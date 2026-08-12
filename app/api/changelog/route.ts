import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

function parseCommitMessage(msg: string): { type: "feat" | "fix" | "perf" | "style"; categoryEn: string; categoryAr: string; title: string } {
    const text = String(msg || "").trim().split("\n")[0];
    const match = text.match(/^(feat|fix|perf|style|refactor|docs)(?:\(([^)]+)\))?:\s*(.+)$/i);
    if (!match) {
        return {
            type: "feat",
            categoryEn: "General Improvements",
            categoryAr: "تحسينات عامة",
            title: text,
        };
    }
    const rawType = match[1].toLowerCase();
    const scope = match[2] ? match[2].toUpperCase() : "SYSTEM";
    const title = match[3];

    let type: "feat" | "fix" | "perf" | "style" = "feat";
    let categoryEn = `Features & Enhancements (${scope})`;
    let categoryAr = `مميزات وتحديثات جديدة (${scope})`;

    if (rawType === "fix") {
        type = "fix";
        categoryEn = `Bug Fixes & Security (${scope})`;
        categoryAr = `إصلاح الأخطاء والأمان (${scope})`;
    } else if (rawType === "perf") {
        type = "perf";
        categoryEn = `Performance & Token Optimization (${scope})`;
        categoryAr = `تحسين الأداء وتوفير التوكنز (${scope})`;
    } else if (rawType === "style" || rawType === "docs") {
        type = "style";
        categoryEn = `UI/UX & Documentation (${scope})`;
        categoryAr = `التصميم والواجهة والتوثيق (${scope})`;
    }

    return { type, categoryEn, categoryAr, title };
}

export async function GET() {
    try {
        // 1. Read static curated changelog.json
        const filePath = path.join(process.cwd(), "public", "changelog.json");
        let localData: any[] = [];
        if (fs.existsSync(filePath)) {
            const raw = fs.readFileSync(filePath, "utf-8");
            localData = JSON.parse(raw);
        }

        // 2. Fetch live GitHub Commits (Real-time auto sync on every push!)
        try {
            const ghRes = await fetch("https://api.github.com/repos/MohamedFC2A/Qure-Ai/commits?per_page=15", {
                headers: {
                    Accept: "application/vnd.github.v3+json",
                    "User-Agent": "QureScan-App",
                },
                next: { revalidate: 60 } // Refresh every 60 seconds
            });

            if (ghRes.ok) {
                const commits = await ghRes.json();
                if (Array.isArray(commits) && commits.length > 0) {
                    const commitItemsEn: string[] = [];
                    const commitItemsAr: string[] = [];

                    for (const c of commits) {
                        const parsed = parseCommitMessage(c.commit?.message || "");
                        if (parsed.title) {
                            commitItemsEn.push(`[${c.sha.slice(0, 7)}] ${parsed.title}`);
                            commitItemsAr.push(`[${c.sha.slice(0, 7)}] ${parsed.title}`);
                        }
                    }

                    if (commitItemsEn.length > 0) {
                        const latestCommitDate = commits[0].commit?.committer?.date
                            ? commits[0].commit.committer.date.split("T")[0]
                            : new Date().toISOString().split("T")[0];

                        const latestJsonVer = localData[0]?.version || "v1.3.1 (Beta)";
                        const liveGithubRelease = {
                            version: `${latestJsonVer.split(' ')[0]}-live (Beta)`,
                            titleEn: "Live GitHub Pushes & Real-Time Sync",
                            titleAr: "التحديثات المرفوعة المباشرة عبر GitHub",
                            date: latestCommitDate,
                            badge: "Live Auto-Sync",
                            changes: [
                                {
                                    type: "perf",
                                    categoryEn: "Recent GitHub Commits",
                                    categoryAr: "آخر التحديثات المرفوعة على GitHub",
                                    itemsEn: commitItemsEn.slice(0, 8),
                                    itemsAr: commitItemsAr.slice(0, 8),
                                }
                            ]
                        };

                        // Avoid duplicating if live is already present
                        localData = localData.filter((d: any) => !d.version.includes("-live"));
                        localData.unshift(liveGithubRelease);
                    }
                }
            }
        } catch (ghErr) {
            console.warn("[Changelog API] Live GitHub commits fetch failed, using local json fallback:", ghErr);
        }

        return NextResponse.json({ releases: localData });
    } catch (e: any) {
        return NextResponse.json({ releases: [] });
    }
}
