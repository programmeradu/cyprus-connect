import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { aiChatRaw, hasLovableAi } from "@/lib/lovable-ai";
import { readUpload } from "@/lib/validate";
import { logger } from "@/lib/log";

export const maxDuration = 60;

const log = logger("documents.process");

interface ExtractedData {
  electricity?: number;
  gas?: number;
  water?: number;
  waste?: number;
  transport?: number;
}

async function processWithGemini(
  file: File,
  mimeType: string
): Promise<ExtractedData> {
  const arrayBuffer = await file.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString("base64");

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

  const dataUrl = `data:${mimeType};base64,${base64}`;
  const attachment = mimeType.startsWith("image/")
    ? { type: "image_url", image_url: { url: dataUrl } }
    : { type: "file", file: { filename: "document.pdf", file_data: dataUrl } };

  const text = await aiChatRaw(
    [{ role: "user", content: [{ type: "text", text: prompt }, attachment] }],
    0.1,
  );

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    const extracted = JSON.parse(jsonMatch[0]);
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

  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];

  const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

  if (jsonData.length < 2) {
    throw new Error("Excel file is empty or invalid");
  }

  const headers = (jsonData[0] as string[]).map((h) =>
    String(h || "").toLowerCase().trim()
  );
  const data: ExtractedData = {};

  let electricityTotal = 0;
  let gasTotal = 0;
  let waterTotal = 0;
  let wasteTotal = 0;
  let transportTotal = 0;

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
  if (!hasLovableAi()) {
    return NextResponse.json(
      { error: "AI is not configured on this deployment." },
      { status: 503 }
    );
  }

  const upload = await readUpload(request, "file", ["csv", "xlsx", "pdf", "png", "jpeg"]);
  if (!upload.ok) return upload.response;
  const { file, kind } = upload;

  try {
    let extractedData: ExtractedData = {};

    if (kind === "csv") {
      extractedData = await processCSV(file);
    } else if (kind === "xlsx") {
      extractedData = await processExcel(file);
    } else {
      const mimeType = kind === "pdf" ? "application/pdf" : kind === "png" ? "image/png" : "image/jpeg";
      extractedData = await processWithGemini(file, mimeType);
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
    const ref = log.error("Document processing error", error);
    return NextResponse.json(
      { error: "The document could not be processed.", ref },
      { status: 500 }
    );
  }
}
