import OpenAI from "openai";

// Initialize DeepSeek client (text-only)
const deepseek = new OpenAI({
    apiKey: process.env.DEEPSEEK_API_KEY || "placeholder-key",
    baseURL: "https://api.deepseek.com",
});

export const analyzeMedicationText = async (extractedText: string) => {
    try {
        console.log("--- START DEEP ANALYSIS ---");
        console.log("Raw OCR Input:", extractedText);

        if (!extractedText || extractedText.trim().length < 2) {
            throw new Error("Text too short for forensic analysis.");
        }

        // Forensic Pharmacist Prompt V2 (Expanded)
        const systemPrompt = `
    You are a World-Class Clinical Pharmacist and Forensic Text Analyst.
    You have been provided with messy, fragmented text extracted from a medication image via OCR.
    
    YOUR MISSION: 
    Reconstruct the identity of the medication with 99.9% accuracy. You must use your extensive pharmaceutical knowledge to particularize the drug even from partial words (e.g., "Tyl..." -> "Tylenol/Acetaminophen").
    
    STRICT RULES:
    1. NEVER return "Unknown" if there is even a slight clue. Infer the most likely match.
    2. If the text contains purely random garbage (e.g. "%$&^#"), only then return "Unknown".
    3. Output JSON ONLY. No markdown, no pre-text.
    
    RETURN FORMAT (JSON):
    {
        "drugName": "Inferred Name (e.g. Panadol Extra)",
        "genericName": "Scientific Name (e.g. Paracetamol 500mg + Caffeine)",
        "manufacturer": "Inferred Manufacturer (or 'Generic')",
        "description": "Professional medical description of the drug, suitable for a patient to understand.",
        "category": "Therapeutic Category (e.g. Analgesic)",
        "uses": ["List of 3-5 primary medical uses"],
        "sideEffects": ["List of 3-5 common side effects"],
        "dosage": "Standard adult dosage (e.g. '500-1000mg q4-6h') if specific dosage not found in text.",
        "storage": "Storage instructions (e.g. 'Store below 25°C, away from light')",
        "warnings": ["Critical safety warnings", "Pregnancy/Breastfeeding safety"],
        "interactions": ["Major drug interactions (e.g. Warfarin, Alcohol)"],
        "confidenceScore": 0-100 (Your confidence in this identification)
    }
    
    OCR TEXT FRAGMENTS:
    "${extractedText}"
    
    END OF TEXT. ANALYZE NOW.
  `;

        const response = await deepseek.chat.completions.create({
            model: "deepseek-chat",
            messages: [
                { role: "system", content: "You are a specialized medical analysis AI. Output valid JSON only." },
                { role: "user", content: systemPrompt }
            ],
            response_format: { type: "json_object" },
            temperature: 0.2, // Very low temperature for high precision
        });

        const content = response.choices[0].message.content;
        console.log("AI Raw Response:", content);

        if (!content) throw new Error("No response from AI");

        const parsedContent = JSON.parse(content);

        // Sanity Check
        if (parsedContent.drugName === "Unknown") {
            console.warn("AI returned Unknown drug name.");
            // We still return it, UI will handle the failure state
        }

        return parsedContent;

    } catch (error) {
        console.error("DeepSeek Analysis Error:", error);
        throw new Error(error instanceof Error ? error.message : "Failed to analyze text");
    }
};
