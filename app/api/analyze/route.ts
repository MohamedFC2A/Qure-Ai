import { NextRequest, NextResponse } from "next/server";
import { analyzeMedicationText } from "@/lib/ai/vision";
import { supabase } from "@/lib/supabase";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { text } = body;

        if (!text) {
            return NextResponse.json({ error: "No text provided" }, { status: 400 });
        }

        // 1. Call AI Service (DeepSeek)
        const data = await analyzeMedicationText(text);

        // 2. Save Analysis to Supabase (Fire & Forget logic or Await safely)
        if (data && data.drugName !== "Unknown") {
            try {
                const { error } = await supabase.from("medication_history").insert({
                    drug_name: data.drugName || "Target Medication",
                    manufacturer: data.manufacturer || "Generic",
                    analysis_json: data,
                });

                if (error) {
                    console.error("Supabase Save Error:", error);
                } else {
                    console.log("Analysis saved to history successfully.");
                }
            } catch (dbError) {
                console.error("Database connection failed:", dbError);
            }
        }

        return NextResponse.json(data);
    } catch (error: any) {
        console.error("API Error:", error);
        return NextResponse.json(
            { error: error.message || "Internal Server Error" },
            { status: 500 }
        );
    }
}
