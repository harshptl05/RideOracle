import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const CSV_FILE_PATH = path.join(process.cwd(), "src/data/user_profiles.csv");

// Ensure CSV file exists with headers
function ensureCSVFile() {
  const dir = path.dirname(CSV_FILE_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  if (!fs.existsSync(CSV_FILE_PATH)) {
    const headers = "user_id,name,email,phone,ssn_placeholder,annual_income,employment_status,down_payment,loan_term_preference\n";
    fs.writeFileSync(CSV_FILE_PATH, headers);
  }
}

// Parse CSV to array of objects (handles quoted fields)
function parseCSV(content: string): any[] {
  const lines = content.trim().split("\n");
  if (lines.length <= 1) return [];
  
  const headers = lines[0].split(",").map(h => h.trim().replace(/^"|"$/g, ""));
  const profiles = [];
  
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    
    // Parse CSV line handling quoted fields
    const values: string[] = [];
    let current = "";
    let inQuotes = false;
    
    for (let j = 0; j < lines[i].length; j++) {
      const char = lines[i][j];
      if (char === '"') {
        if (inQuotes && lines[i][j + 1] === '"') {
          current += '"';
          j++; // Skip next quote
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
    values.push(current.trim()); // Add last value
    
    const profile: any = {};
    headers.forEach((header, index) => {
      const value = values[index]?.replace(/^"|"$/g, "") || "";
      profile[header] = value;
    });
    
    // Only add if it has required fields
    if (profile.user_id) {
      profiles.push(profile);
    }
  }
  
  return profiles;
}

// Convert object to CSV line (only personal + financial info)
function toCSVLine(profile: any): string {
  const fields = [
    profile.user_id || "",
    profile.name || "",
    profile.email || "",
    profile.phone || "",
    profile.ssn_placeholder || "",
    profile.annual_income || "",
    profile.employment_status || "",
    profile.down_payment || "",
    profile.loan_term_preference || "",
  ];
  return fields.map(field => `"${String(field).replace(/"/g, '""')}"`).join(",");
}

export async function GET(request: NextRequest) {
  try {
    ensureCSVFile();
    
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("user_id");
    
    const content = fs.readFileSync(CSV_FILE_PATH, "utf-8");
    const profiles = parseCSV(content);
    
    if (userId) {
      const profile = profiles.find((p) => p.user_id === userId);
      return NextResponse.json(profile || null);
    }
    
    return NextResponse.json(profiles);
  } catch (error: any) {
    console.error("Error reading profiles:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    ensureCSVFile();
    
    const profile = await request.json();
    
    // Read existing profiles
    const content = fs.readFileSync(CSV_FILE_PATH, "utf-8");
    const profiles = parseCSV(content);
    
    // Check if profile exists
    const existingIndex = profiles.findIndex((p) => p.user_id === profile.user_id);
    
    if (existingIndex >= 0) {
      // Update existing
      profiles[existingIndex] = profile;
    } else {
      // Add new
      profiles.push(profile);
    }
    
    // Write back to CSV (only personal + financial info)
    const headers = "user_id,name,email,phone,ssn_placeholder,annual_income,employment_status,down_payment,loan_term_preference\n";
    const lines = profiles.map(toCSVLine);
    const newContent = headers + lines.join("\n") + "\n";
    
    fs.writeFileSync(CSV_FILE_PATH, newContent);
    
    return NextResponse.json({ success: true, profile });
  } catch (error: any) {
    console.error("Error saving profile:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

