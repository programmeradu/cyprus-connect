import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { aiChatRaw, aiErrorMessage, hasLovableAi } from "@/lib/lovable-ai";

export const maxDuration = 60;

interface ExtractedData {
  electricity?: number;
  gas?: number;
  water?: number;
  waste?: number;
  transport?: number;
}

async function processWithGemini(
  file: File,
  fileType: string
): Promise<ExtractedData> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");
    const mimeType = fileType;

    const prompt = `You are an expert data extraction AI. Analyze this document (utility bill, report, or invoice) and extract monthly consumption data.

CRITICAL INSTRUCTIONS:
1. Extract ONLY numerical values for these categories:
   - Electricity usage (in kWh, kilowatt-hours)
   - Natural gas usage (in m³, cubic meters, therms, or CCF - convert to m³)
   - Water consumption (in liters, gallons, or m³ - convert to liters)
   - Waste generated (in kg, pounds, or tons - convert to kg)
   - Transportation/fuel (in km, miles, liters of fuel - convert to km)

2. Look for these keywords and variations:
   - Electricity: kWh, kilowatt, power, electric, energy
   - Gas: natural gas, m³, cubic meter, therm, CCF, gas usage
   - Water: water, liters, gallons, m³, water consumption
   - Waste: waste, garbage, recycling, kg, pounds, tons
   - Transport: mileage, km, miles, fuel, diesel, petrol, transportation

3. Conversion factors to use:
   - 1 therm = 2.83 m³ of natural gas
   - 1 CCF = 2.83 m³ of natural gas
   - 1 gallon = 3.785 liters
   - 1 pound = 0.453592 kg
   - 1 ton = 907.185 kg
   - 1 mile = 1.60934 km

4. If document shows multiple billing periods, sum them up for a monthly total
5. Ignore charges, costs, and billing information - focus ONLY on consumption
6. Be smart about custom formats - look for patterns and context clues
7. Return ONLY valid JSON, no markdown, no explanations

Return format (only include fields with valid data):
{
  "electricity": <number in kWh>,
  "gas": <number in m³>,
  "water": <number in liters>,
  "waste": <number in kg>,
  "transport": <number in km>
}

If you cannot find data for a category, omit that field entirely.`;

    // A picture goes in as an image block. A PDF goes in as a file block.
    const dataUrl = `data:${mimeType};base64,${base64}`;
    const attachment = mimeType.startsWith("image/")
      ? { type: "image_url", image_url: { url: dataUrl } }
      : { type: "file", file: { filename: "document.pdf", file_data: dataUrl } };

    const text = await aiChatRaw(
      [{ role: "user", content: [{ type: "text", text: prompt }, attachment] }],
      0.1,
    );

    // Parse JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const extracted = JSON.parse(jsonMatch[0]);
      // Ensure all values are numbers
      const cleaned: ExtractedData = {};
      if (extracted.electricity && !isNaN(extracted.electricity))
        cleaned.electricity = Number(extracted.electricity);
      if (extracted.gas && !isNaN(extracted.gas))
        cleaned.gas = Number(extracted.gas);
      if (extracted.water && !isNaN(extracted.water))
        cleaned.water = Number(extracted.water);
      if (extracted.waste && !isNaN(extracted.waste))
        cleaned.waste = Number(extracted.waste);
      if (extracted.transport && !isNaN(extracted.transport))
        cleaned.transport = Number(extracted.transport);
      return cleaned;
    }

    return {};
  } catch (error) {
    console.error("Gemini processing error:", error);
    throw error;
  }
}

async function processCSV(file: File): Promise<ExtractedData> {
  const text = await file.text();
  const lines = text.split("\n").filter((line) => line.trim());

  if (lines.length < 2) {
    throw new Error("CSV file is empty or invalid");
  }

  const headers = lines[0]
    .toLowerCase()
    .split(",")
    .map((h) => h.trim());
  const data: ExtractedData = {};

  let electricityTotal = 0;
  let gasTotal = 0;
  let waterTotal = 0;
  let wasteTotal = 0;
  let transportTotal = 0;

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(",").map((v) => v.trim());

    headers.forEach((header, index) => {
      const value = parseFloat(values[index]) || 0;

      if (header.includes("electric") || header.includes("kwh")) {
        electricityTotal += value;
      } else if (
        header.includes("gas") ||
        header.includes("m3") ||
        header.includes("m³")
      ) {
        gasTotal += value;
      } else if (
        header.includes("water") ||
        header.includes("liter") ||
        header.includes("litre")
      ) {
        waterTotal += value;
      } else if (header.includes("waste") || header.includes("kg")) {
        wasteTotal += value;
      } else if (
        header.includes("transport") ||
        header.includes("km") ||
        header.includes("mile")
      ) {
        transportTotal += value;
      }
    });
  }

  if (electricityTotal > 0) data.electricity = electricityTotal;
  if (gasTotal > 0) data.gas = gasTotal;
  if (waterTotal > 0) data.water = waterTotal;
  if (wasteTotal > 0) data.waste = wasteTotal;
  if (transportTotal > 0) data.transport = transportTotal;

  return data;
}

async function processExcel(file: File): Promise<ExtractedData> {
  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: "array" });

  // Get first sheet
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];

  // Convert to JSON
  const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

  if (jsonData.length < 2) {
    throw new Error("Excel file is empty or invalid");
  }

  // First row as headers
  const headers = (jsonData[0] as string[]).map((h) =>
    String(h || "").toLowerCase().trim()
  );
  const data: ExtractedData = {};

  let electricityTotal = 0;
  let gasTotal = 0;
  let waterTotal = 0;
  let wasteTotal = 0;
  let transportTotal = 0;

  // Process data rows
  for (let i = 1; i < jsonData.length; i++) {
    const row = jsonData[i];

    headers.forEach((header, colIndex) => {
      const value = parseFloat(row[colIndex]) || 0;

      if (header.includes("electric") || header.includes("kwh")) {
        electricityTotal += value;
      } else if (
        header.includes("gas") ||
        header.includes("m3") ||
        header.includes("m³")
      ) {
        gasTotal += value;
      } else if (
        header.includes("water") ||
        header.includes("liter") ||
        header.includes("litre")
      ) {
        waterTotal += value;
      } else if (header.includes("waste") || header.includes("kg")) {
        wasteTotal += value;
      } else if (
        header.includes("transport") ||
        header.includes("km") ||
        header.includes("mile")
      ) {
        transportTotal += value;
      }
    });
  }

  if (electricityTotal > 0) data.electricity = electricityTotal;
  if (gasTotal > 0) data.gas = gasTotal;
  if (waterTotal > 0) data.water = waterTotal;
  if (wasteTotal > 0) data.waste = wasteTotal;
  if (transportTotal > 0) data.transport = transportTotal;

  return data;
}

export async function POST(request: NextRequest) {
  try {
    if (!hasLovableAi()) {
      return NextResponse.json(
        { error: "AI is not configured on this deployment." },
        { status: 503 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    let extractedData: ExtractedData = {};

    // Route to appropriate processor based on file type
    if (file.type === "text/csv") {
      extractedData = await processCSV(file);
    } else if (
      file.type === "application/vnd.ms-excel" ||
      file.type ===
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    ) {
      extractedData = await processExcel(file);
    } else if (
      file.type === "application/pdf" ||
      file.type.startsWith("image/")
    ) {
      // Use Gemini for PDFs and images
      extractedData = await processWithGemini(file, file.type);
    } else {
      return NextResponse.json(
        { error: "Unsupported file type" },
        { status: 400 }
      );
    }

    if (Object.keys(extractedData).length === 0) {
      return NextResponse.json(
        {
          error:
            "No relevant data found in document. Please ensure the document contains utility usage information.",
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: extractedData,
      fileName: file.name,
      fileType: file.type,
    });
  } catch (error) {
    console.error("Document processing error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to process document",
      },
      { status: 500 }
    );
  }
}