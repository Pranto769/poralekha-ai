import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {
        const { text, image } = await req.json();
        const apiKey = process.env.GEMINI_API_KEY;

        if (!apiKey) {
            return NextResponse.json({ ans: "❌ Render এ GEMINI_API_KEY পাওয়া যায়নি। Environment এ গিয়ে Add করো ভাই।" });
        }

        const prompt = `You are Poralekha AI. Answer in Bangla, short and correct. User: ${text}`;

        let parts: any[] = [{ text: prompt }];
        if (image && image.includes(",")) {
            const base64 = image.split(",")[1];
            parts.push({ inline_data: { mime_type: "image/jpeg", data: base64 } });
        }

        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

        const res = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ contents: [{ parts }] }),
        });

        const data = await res.json();

        // যদি Google থেকে Error আসে, সেটাই দেখাবো
        if (data.error) {
            return NextResponse.json({ ans: "Google API Error: " + data.error.message });
        }

        const ans = data?.candidates?.[0]?.content?.parts?.[0]?.text || "উত্তর পাওয়া যায়নি, আবার চেষ্টা করো। Raw: " + JSON.stringify(data).slice(0, 300);

        return NextResponse.json({ ans });

    } catch (e: any) {
        return NextResponse.json({ ans: "Server Error: " + e.message });
    }
}