import { NextRequest, NextResponse } from "next/server";
import archiver from "archiver";
import fs from "fs";
import path from "path";

export async function GET(req: NextRequest) {
  try {
    const projectRoot = process.cwd();
    
    // Create a passthrough stream
    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();
    
    // Create archiver instance
    const archive = archiver("zip", {
      zlib: { level: 9 }
    });

    // Stream archive data to the response
    archive.on("data", (chunk: Uint8Array) => {
      writer.write(chunk);
    });

    archive.on("end", () => {
      writer.close();
    });

    archive.on("error", (err: unknown) => {
      console.error("Archive error:", err);
      writer.abort(err as any);
    });

    // Add files to archive, excluding common directories
    const excludeDirs = [
      "node_modules",
      ".next",
      ".git",
      "dist",
      "build",
      ".vercel",
      ".turbo"
    ];

    function shouldExclude(filePath: string): boolean {
      const relativePath = path.relative(projectRoot, filePath);
      return excludeDirs.some(dir => relativePath.startsWith(dir));
    }

    function addDirectory(dirPath: string, zipPath: string = "") {
      const items = fs.readdirSync(dirPath);
      
      for (const item of items) {
        const fullPath = path.join(dirPath, item);
        const relPath = zipPath ? path.join(zipPath, item) : item;
        
        if (shouldExclude(fullPath)) {
          continue;
        }
        
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          addDirectory(fullPath, relPath);
        } else if (stat.isFile()) {
          archive.file(fullPath, { name: relPath });
        }
      }
    }

    // Start adding files
    addDirectory(projectRoot);
    
    // Finalize archive
    archive.finalize();

    // Return streaming response
    return new NextResponse(readable, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="verdeiq-codebase-${Date.now()}.zip"`
      }
    });
  } catch (error) {
    console.error("Error creating zip:", error);
    return NextResponse.json(
      { error: "Failed to create zip file" },
      { status: 500 }
    );
  }
}
