import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET() {
    try {
        // Read curated, AI-generated changelog
        const filePath = path.join(process.cwd(), "public", "changelog.json");
        let localData: any[] = [];
        if (fs.existsSync(filePath)) {
            const raw = fs.readFileSync(filePath, "utf-8");
            localData = JSON.parse(raw);
        }

        return NextResponse.json({ releases: localData });
    } catch (e: any) {
        console.error("[Changelog API] Error loading releases:", e);
        return NextResponse.json({ releases: [] });
    }
}
