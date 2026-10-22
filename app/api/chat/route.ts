import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {
        const { text, image } = await req.json();
        const apiKey = process.env.GEMINI_API_KEY;

        if (!apiKey) {
            return NextResponse.json({ ans: "❌ Render এ GEMINI_API_KEY পাওয়া যায়নি।" });
        }

        const prompt = `You are Poralekha AI. Answer short in Bangla. Question: ${text}`;
        let parts: any[] = [{ text: prompt }];
        if (image && image.includes(",")) {
            parts.push({ inline_data: { mime_type: "image/jpeg", data: image.split(",")[1] } });
        }

        const body = JSON.stringify({ contents: [{ parts }] });

        // তোমার ৩টাই দিলাম: 2.0, 1.5, আর 3.8 (8b)
        const models = [
            "gemini-2.0-flash",
            "gemini-1.5-flash",
            "gemini-3.8-flash"
        ];

        let finalAns = "";
        let lastError = "";

        for (const model of models) {
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
            const res = await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: body,
            });
            const data = await res.json();

            if (!data.error && data?.candidates?.[0]?.content?.parts?.[0]?.text) {
                finalAns = data.candidates[0].content.parts[0].text;
                break; // উত্তর পেয়ে গেলে আর লুপ চালাবে না
            } else {
                lastError = data.error?.message || "No response";
            }
        }

        if (finalAns) {
            return NextResponse.json({ ans: finalAns });
        } else {
            return NextResponse.json({ ans: "API Error: " + lastError });
        }

    } catch (e: any) {
        return NextResponse.json({ ans: "Server Error: " + e.message });
    }
}