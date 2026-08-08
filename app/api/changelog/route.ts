import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET() {
    try {
        // Read local json
        const filePath = path.join(process.cwd(), "public", "changelog.json");
        let localData: any[] = [];
        if (fs.existsSync(filePath)) {
            const raw = fs.readFileSync(filePath, "utf-8");
            localData = JSON.parse(raw);
        }

        // Try fetching live GitHub releases as dynamic fallback
        try {
            const ghRes = await fetch("https://api.github.com/repos/MohamedFC2A/Qure-Ai/releases", {
                headers: { Accept: "application/vnd.github.v3+json", "User-Agent": "QureScan-App" },
                next: { revalidate: 300 } // Cache 5 min
            });
            if (ghRes.ok) {
                const releases = await ghRes.json();
                if (Array.isArray(releases) && releases.length > 0) {
                    const ghData = releases.map((r: any) => ({
                        version: r.tag_name || r.name,
                        titleEn: r.name || r.tag_name,
                        titleAr: `تحديث ${r.tag_name || r.name}`,
                        date: r.published_at ? r.published_at.split("T")[0] : new Date().toISOString().split("T")[0],
                        badge: r.prerelease ? "Beta" : "Release",
                        changes: [
                            {
                                type: "feat",
                                categoryEn: "GitHub Release Notes",
                                categoryAr: "ملاحظات الإصدار على GitHub",
                                itemsEn: (r.body || "Performance and stability improvements.").split("\n").filter((s: string) => s.trim().length > 0).slice(0, 8),
                                itemsAr: (r.body || "تحسينات في الأداء والاستقرار.").split("\n").filter((s: string) => s.trim().length > 0).slice(0, 8)
                            }
                        ]
                    }));

                    // Merge avoiding duplicates
                    const localVers = new Set(localData.map((d: any) => d.version));
                    for (const g of ghData) {
                        if (!localVers.has(g.version)) {
                            localData.push(g);
                        }
                    }
                }
            }
        } catch {
            // best-effort
        }

        return NextResponse.json({ releases: localData });
    } catch (e: any) {
        return NextResponse.json({ releases: [] });
    }
}
