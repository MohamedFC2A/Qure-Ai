const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function generateChangelog() {
    try {
        console.log('[Changelog Generator] Reading git logs...');
        
        // 1. Fetch recent git commits
        let rawLogs = '';
        try {
            rawLogs = execSync('git log -n 25 --pretty=format:"%s|||%h|||%an|||%ad" --date=short').toString();
        } catch (e) {
            console.warn('[Changelog Generator] git log command failed, skipping:', e.message);
            return;
        }

        const lines = rawLogs.split('\n').filter(Boolean);
        if (lines.length === 0) {
            console.log('[Changelog Generator] No commits found.');
            return;
        }

        const latestCommit = lines[0].split('|||');
        const commitMsg = latestCommit[0] || 'System update';

        // Avoid infinite loop if this was triggered by automated changelog commit
        if (commitMsg.includes('auto: update changelog') || commitMsg.includes('[skip ci]')) {
            console.log('[Changelog Generator] Skipping auto-changelog loop.');
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

        // Parse previous latest version e.g. "v1.3.0 (Beta)" or "v1.3.0"
        let baseVer = '1.3.0';
        if (currentData[0] && currentData[0].version) {
            const cleanVer = currentData[0].version.replace(/[^0-9.]/g, '');
            if (cleanVer) baseVer = cleanVer;
        }

        const parts = baseVer.split('.').map(Number);
        parts[2] = (parts[2] || 0) + 1; // Increment patch version
        const newVersionNumber = parts.join('.');
        const newVersionWithBeta = `v${newVersionNumber} (Beta)`;

        const featItemsEn = [];
        const featItemsAr = [];
        const fixItemsEn = [];
        const fixItemsAr = [];
        const perfItemsEn = [];
        const perfItemsAr = [];

        lines.slice(0, 10).forEach(line => {
            const [msg, hash] = line.split('|||');
            if (!msg || msg.includes('auto: update changelog') || msg.includes('[skip ci]')) return;

            const cleanMsg = msg.replace(/^(feat|fix|perf|style|refactor|chore|docs)(\([^)]+\))?:\s*/i, '');
            const itemEn = `[${hash}] ${msg}`;
            const itemAr = `[${hash}] ${cleanMsg}`;

            const lower = msg.toLowerCase();
            if (lower.startsWith('fix') || lower.includes('fix') || lower.includes('bug')) {
                fixItemsEn.push(itemEn);
                fixItemsAr.push(itemAr);
            } else if (lower.startsWith('perf') || lower.includes('optimiz') || lower.includes('token')) {
                perfItemsEn.push(itemEn);
                perfItemsAr.push(itemAr);
            } else {
                featItemsEn.push(itemEn);
                featItemsAr.push(itemAr);
            }
        });

        const changes = [];
        if (featItemsEn.length > 0) {
            changes.push({
                type: 'feat',
                categoryEn: 'Features & UI Enhancements',
                categoryAr: 'الميزات وتحسينات الواجهة',
                itemsEn: featItemsEn.slice(0, 5),
                itemsAr: featItemsAr.slice(0, 5),
            });
        }
        if (fixItemsEn.length > 0) {
            changes.push({
                type: 'fix',
                categoryEn: 'Bug Fixes & Security Hardening',
                categoryAr: 'إصلاح الأخطاء وتعزيز الأمان',
                itemsEn: fixItemsEn.slice(0, 5),
                itemsAr: fixItemsAr.slice(0, 5),
            });
        }
        if (perfItemsEn.length > 0) {
            changes.push({
                type: 'perf',
                categoryEn: 'Performance & Optimization',
                categoryAr: 'تحسين الأداء والسرعة',
                itemsEn: perfItemsEn.slice(0, 5),
                itemsAr: perfItemsAr.slice(0, 5),
            });
        }

        if (changes.length === 0) {
            changes.push({
                type: 'feat',
                categoryEn: 'General Updates',
                categoryAr: 'تحديثات عامة',
                itemsEn: [commitMsg],
                itemsAr: [commitMsg],
            });
        }

        const newRelease = {
            version: newVersionWithBeta,
            titleEn: commitMsg,
            titleAr: `تحديث تلقائي: ${commitMsg}`,
            date: today,
            badge: 'Beta Update',
            changes,
        };

        // Filter out any duplicate with same version number
        currentData = currentData.filter(r => !r.version.includes(newVersionNumber));
        currentData.unshift(newRelease);

        // Keep last 25 releases
        fs.writeFileSync(changelogPath, JSON.stringify(currentData.slice(0, 25), null, 2), 'utf8');

        // Also update package.json version
        const pkgPath = path.join(process.cwd(), 'package.json');
        if (fs.existsSync(pkgPath)) {
            const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
            pkg.version = `${newVersionNumber}-beta`;
            fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2), 'utf8');
        }

        // Generate CHANGELOG.md
        let md = `# 🚀 QureScan Changelog (Beta)\n\nAutomated real-time updates pushed from GitHub commits.\n\n`;
        currentData.forEach(entry => {
            md += `## ${entry.version} - ${entry.titleEn} (${entry.date})\n\n`;
            entry.changes.forEach(c => {
                md += `### ${c.categoryEn}\n`;
                c.itemsEn.forEach(item => {
                    md += `- ${item}\n`;
                });
                md += '\n';
            });
        });
        fs.writeFileSync(path.join(process.cwd(), 'CHANGELOG.md'), md, 'utf8');

        console.log(`[Changelog Generator] ✅ Successfully generated changelog for ${newVersionWithBeta}`);
    } catch (err) {
        console.error('[Changelog Generator] ❌ Error:', err);
    }
}

generateChangelog();
