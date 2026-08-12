const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const AI_API_KEY = process.env.POLLINATIONS_API_KEY || 'sk_3cpHv0pELis47TdPWKSNvMwrJZKLXh1Y';
const AI_BASE_URL = 'https://gen.pollinations.ai/v1/chat/completions';

// Intelligent fallback translator for clean human language (no tech/git jargon)
function humanizeAndTranslate(commits) {
    const featEn = [];
    const featAr = [];
    const fixEn = [];
    const fixAr = [];
    const perfEn = [];
    const perfAr = [];

    commits.forEach(msg => {
        const lower = msg.toLowerCase();
        if (lower.includes('auto: update changelog') || lower.includes('[skip ci]')) return;

        if (lower.includes('glow') || lower.includes('border') || lower.includes('matte') || lower.includes('style') || lower.includes('ui')) {
            featEn.push('Refined visual design with an eye-friendly matte dark interface and clean borders.');
            featAr.push('تحسين تصميم الواجهة بنمط داكن مريح للعين وإطارات هادئة بدون وهج.');
        } else if (lower.includes('revoke') || lower.includes('cancel') || lower.includes('subscriber') || lower.includes('ceo') || lower.includes('upgrade')) {
            featEn.push('Upgraded account management with instant 1-tap activation and subscription controls.');
            featAr.push('تطوير لوحة إدارة الحسابات مع ميزة التفعيل والتحكم الفوري بضغطة زر واحدة.');
        } else if (lower.includes('telegram') || lower.includes('bot')) {
            featEn.push('Enhanced Telegram bot assistant with live statistics, subscriber overview, and instant actions.');
            featAr.push('تعزيز مساعد تيليجرام الذكي مع إحصائيات حية وعرض المشتركين والأوامر الفورية.');
        } else if (lower.includes('deepseek') || lower.includes('model') || lower.includes('ai') || lower.includes('chat') || lower.includes('qure')) {
            perfEn.push('Enhanced Qure AI medical reasoning engine for faster, more accurate clinical insights.');
            perfAr.push('تسريع محرك Qure AI الطبي لتقديم إجابات سريرية وتحليلات دوائية أكثر دقة وسرعة.');
        } else if (lower.includes('middleware') || lower.includes('auth') || lower.includes('key') || lower.includes('security') || lower.includes('fail')) {
            fixEn.push('Boosted system stability, security safeguards, and continuous server availability.');
            fixAr.push('تعزيز استقرار وأمان النظام لضمان استمرارية الخدمات والاتصال السحابي بدون انقطاع.');
        } else {
            featEn.push('Continuous platform optimizations and medical intelligence enhancements.');
            featAr.push('تحسينات مستمرة في أداء المنصة والذكاء الاصطناعي الطبي.');
        }
    });

    // Deduplicate
    const unique = (arr) => [...new Set(arr)];
    return {
        feat: { en: unique(featEn).slice(0, 4), ar: unique(featAr).slice(0, 4) },
        fix: { en: unique(fixEn).slice(0, 4), ar: unique(fixAr).slice(0, 4) },
        perf: { en: unique(perfEn).slice(0, 4), ar: unique(perfAr).slice(0, 4) },
    };
}

async function summarizeWithQureAi(commitList) {
    try {
        console.log('[Qure AI] Summarizing recent updates using Qure AI engine...');
        const prompt = `You are Qure AI, an expert medical tech product manager for QureScan.
Summarize the following recent platform changes into a user-friendly, professional, non-technical release note.
Strict rules:
1. NEVER mention git, github, commits, branches, sha hashes, pull requests, vercel, or code filenames.
2. Use clear, elegant, user-friendly language understandable by patients, doctors, and regular users.
3. Refer to the AI assistant as "Qure AI".
4. Provide both English and fluent Arabic translations.
5. Output STRICT JSON ONLY matching this structure:
{
  "titleEn": "Short descriptive title in English",
  "titleAr": "عنوان وصفي موجز بالعربية",
  "featuresEn": ["user-friendly bullet 1", "user-friendly bullet 2"],
  "featuresAr": ["ميزة واضحة للمستخدم 1", "ميزة واضحة للمستخدم 2"],
  "fixesEn": ["stability/usability improvement 1"],
  "fixesAr": ["تحسين في الاستقرار وسهولة الاستخدام 1"]
}

Changes to summarize:
${commitList.slice(0, 8).join('\n')}`;

        const res = await fetch(AI_BASE_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${AI_API_KEY}`
            },
            body: JSON.stringify({
                model: 'openai',
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.2,
                response_format: { type: 'json_object' }
            })
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const rawContent = data.choices?.[0]?.message?.content || '{}';
        return JSON.parse(rawContent);
    } catch (e) {
        console.warn('[Aura-OS Ai] AI generation fallback triggered:', e.message);
        return null;
    }
}

async function generateChangelog() {
    try {
        console.log('[Changelog Generator] Extracting updates...');

        let rawLogs = '';
        try {
            rawLogs = execSync('git log -n 20 --pretty=format:"%s"').toString();
        } catch (e) {
            console.warn('[Changelog Generator] git log failed:', e.message);
        }

        const commits = rawLogs.split('\n').map(s => s.trim()).filter(Boolean);
        const filteredCommits = commits.filter(c => !c.includes('auto: update changelog') && !c.includes('[skip ci]'));

        if (filteredCommits.length === 0) {
            console.log('[Changelog Generator] No new user-facing updates.');
            return;
        }

        const changelogPath = path.join(process.cwd(), 'public', 'changelog.json');
        let currentData = [];
        if (fs.existsSync(changelogPath)) {
            try {
                currentData = JSON.parse(fs.readFileSync(changelogPath, 'utf8'));
            } catch (e) {
                currentData = [];
            }
        }

        const today = new Date().toISOString().split('T')[0];

        // Determine version number
        let baseVer = '1.3.0';
        if (currentData[0] && currentData[0].version) {
            const cleanVer = currentData[0].version.replace(/[^0-9.]/g, '');
            if (cleanVer) baseVer = cleanVer;
        }

        const parts = baseVer.split('.').map(Number);
        parts[2] = (parts[2] || 0) + 1;
        const newVersionNumber = parts.join('.');
        const newVersionWithBeta = `v${newVersionNumber} (Beta)`;

        // Try AI summarization with Qure AI
        const aiSummary = await summarizeWithQureAi(filteredCommits);

        let newRelease;
        if (aiSummary && (aiSummary.titleEn || aiSummary.titleAr)) {
            const changes = [];
            if (Array.isArray(aiSummary.featuresEn) && aiSummary.featuresEn.length > 0) {
                changes.push({
                    type: 'feat',
                    categoryEn: 'New Features & Enhancements',
                    categoryAr: 'الميزات والتحسينات الجديدة',
                    itemsEn: aiSummary.featuresEn,
                    itemsAr: aiSummary.featuresAr || aiSummary.featuresEn,
                });
            }
            if (Array.isArray(aiSummary.fixesEn) && aiSummary.fixesEn.length > 0) {
                changes.push({
                    type: 'fix',
                    categoryEn: 'System Stability & User Experience',
                    categoryAr: 'استقرار النظام وسلاسة الاستخدام',
                    itemsEn: aiSummary.fixesEn,
                    itemsAr: aiSummary.fixesAr || aiSummary.fixesEn,
                });
            }

            newRelease = {
                version: newVersionWithBeta,
                titleEn: aiSummary.titleEn || 'Platform Enhancements & Intelligence Updates',
                titleAr: aiSummary.titleAr || 'تحسينات المنصة وترقية الذكاء الاصطناعي',
                date: today,
                badge: 'Beta Release',
                changes: changes.length > 0 ? changes : [
                    {
                        type: 'feat',
                        categoryEn: 'General Updates',
                        categoryAr: 'تحديثات عامة',
                        itemsEn: ['System optimizations and user experience improvements.'],
                        itemsAr: ['تحسينات شاملة في أداء النظام وتجربة الاستخدام.'],
                    }
                ],
            };
        } else {
            // High quality offline translation fallback
            const fallback = humanizeAndTranslate(filteredCommits);
            const changes = [];
            if (fallback.feat.en.length > 0) {
                changes.push({
                    type: 'feat',
                    categoryEn: 'New Features & Enhancements',
                    categoryAr: 'الميزات والتحسينات الجديدة',
                    itemsEn: fallback.feat.en,
                    itemsAr: fallback.feat.ar,
                });
            }
            if (fallback.fix.en.length > 0) {
                changes.push({
                    type: 'fix',
                    categoryEn: 'System Stability & Security',
                    categoryAr: 'استقرار النظام والأمان',
                    itemsEn: fallback.fix.en,
                    itemsAr: fallback.fix.ar,
                });
            }
            if (fallback.perf.en.length > 0) {
                changes.push({
                    type: 'perf',
                    categoryEn: 'Performance & Speed Optimizations',
                    categoryAr: 'تحسينات السرعة والأداء',
                    itemsEn: fallback.perf.en,
                    itemsAr: fallback.perf.ar,
                });
            }

            newRelease = {
                version: newVersionWithBeta,
                titleEn: 'User Experience Enhancements & System Upgrades',
                titleAr: 'تحسينات تجربة المستخدم وترقية استقرار النظام',
                date: today,
                badge: 'Beta Release',
                changes,
            };
        }

        // Clean out any technical release notes in historical data
        currentData = currentData.map(entry => {
            return {
                ...entry,
                version: entry.version.includes('Beta') ? entry.version : `${entry.version} (Beta)`,
                changes: entry.changes.map(c => ({
                    ...c,
                    itemsEn: c.itemsEn.map(i => i.replace(/^\[[a-f0-9]+\]\s*/i, '').replace(/^(feat|fix|style|perf)\([^)]+\):\s*/i, '')),
                    itemsAr: c.itemsAr.map(i => i.replace(/^\[[a-f0-9]+\]\s*/i, '').replace(/^(feat|fix|style|perf)\([^)]+\):\s*/i, '')),
                }))
            };
        });

        // Insert new release at the top
        currentData = currentData.filter(r => !r.version.includes(newVersionNumber));
        currentData.unshift(newRelease);

        // Write cleaned json
        fs.writeFileSync(changelogPath, JSON.stringify(currentData.slice(0, 20), null, 2), 'utf8');

        // Update package.json version
        const pkgPath = path.join(process.cwd(), 'package.json');
        if (fs.existsSync(pkgPath)) {
            const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
            pkg.version = `${newVersionNumber}-beta`;
            fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2), 'utf8');
        }

        // Generate clean Markdown
        let md = `# 🚀 QureScan Changelog (Beta)\n\nSmart release notes powered by Qure AI.\n\n`;
        currentData.forEach(entry => {
            md += `## ${entry.version} — ${entry.titleEn} (${entry.date})\n\n`;
            entry.changes.forEach(c => {
                md += `### ${c.categoryEn}\n`;
                c.itemsEn.forEach(item => {
                    md += `- ${item}\n`;
                });
                md += '\n';
            });
        });
        fs.writeFileSync(path.join(process.cwd(), 'CHANGELOG.md'), md, 'utf8');

        console.log(`[Changelog Generator] ✅ Generated Qure AI Changelog for ${newVersionWithBeta}`);
    } catch (err) {
        console.error('[Changelog Generator] Error:', err);
    }
}

generateChangelog();
