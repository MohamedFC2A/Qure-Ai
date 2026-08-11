/**
 * Robust, crash-proof JSON repair parser for AI responses.
 * Never throws a SyntaxError; always returns a valid object or fallback.
 */

export function extractJsonCandidate(raw: string): string {
    const text = String(raw || "").trim();
    if (!text) return text;

    // Remove markdown code fences
    const fenced = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    const unwrapped = (fenced?.[1] ?? text).trim();

    if ((unwrapped.startsWith("{") && unwrapped.endsWith("}")) || (unwrapped.startsWith("[") && unwrapped.endsWith("]"))) {
        return unwrapped;
    }

    const firstBrace = unwrapped.indexOf("{");
    const lastBrace = unwrapped.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        return unwrapped.slice(firstBrace, lastBrace + 1);
    }

    return unwrapped;
}

export function repairJsonString(jsonText: string): string {
    let s = jsonText.trim();

    // 1. Remove markdown fences
    s = s.replace(/^```json/i, "").replace(/^```/, "").replace(/```$/, "").trim();

    // 2. Fix invalid backslash escapes (JSON only allows ", \, /, b, f, n, r, t, uXXXX)
    s = s.replace(/\\(?!["\\/bfnrtu]|u[0-9a-fA-F]{4})/g, "\\\\");

    // 3. Fix unescaped literal control characters / newlines inside double-quoted string values
    let inString = false;
    let escaped = false;
    let fixed = "";

    for (let i = 0; i < s.length; i++) {
        const char = s[i];
        if (escaped) {
            fixed += char;
            escaped = false;
            continue;
        }
        if (char === "\\") {
            escaped = true;
            fixed += char;
            continue;
        }
        if (char === '"') {
            inString = !inString;
            fixed += char;
            continue;
        }
        if (inString) {
            if (char === "\n") {
                fixed += "\\n";
                continue;
            }
            if (char === "\r") {
                fixed += "\\r";
                continue;
            }
            if (char === "\t") {
                fixed += "\\t";
                continue;
            }
        }
        fixed += char;
    }
    s = fixed;

    // 4. Remove trailing commas before closing braces/brackets
    s = s.replace(/,\s*([}\]])/g, "$1");

    return s;
}

export function robustParseJson<T extends object>(rawText: string, fallback: T): T {
    if (!rawText || typeof rawText !== "string") {
        return fallback;
    }

    const candidate = extractJsonCandidate(rawText);

    // Attempt 1: Direct parse
    try {
        const parsed = JSON.parse(candidate);
        if (parsed && typeof parsed === "object") {
            return { ...fallback, ...parsed };
        }
    } catch {
        /* proceed to repair */
    }

    // Attempt 2: Repaired parse
    try {
        const repaired = repairJsonString(candidate);
        const parsed = JSON.parse(repaired);
        if (parsed && typeof parsed === "object") {
            return { ...fallback, ...parsed };
        }
    } catch {
        /* proceed to regex extraction */
    }

    // Attempt 3: Regex extraction for key fields without throwing SyntaxError
    const result: Record<string, any> = { ...fallback };
    try {
        const keys = Object.keys(fallback);
        for (const k of keys) {
            const pattern = new RegExp(`"${k}"\\s*:\\s*("(?:\\\\.|[^"\\\\])*"|\\d+|true|false|\\[[^\\]]*\\])`, "i");
            const match = candidate.match(pattern);
            if (match && match[1]) {
                try {
                    result[k] = JSON.parse(match[1]);
                } catch {
                    result[k] = match[1].replace(/^"|"$/g, "");
                }
            }
        }
    } catch {
        /* ignore regex errors */
    }

    return result as T;
}
