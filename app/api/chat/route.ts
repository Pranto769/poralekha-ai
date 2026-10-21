import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {
        const { text, image } = await req.json();
        const apiKey = process.env.GEMINI_API_KEY;

        if (!apiKey) {
            return NextResponse.json({ ans: "❌ Render এ GEMINI_API_KEY পাওয়া যায়নি।" });
        }

        const prompt = `You are Poralekha AI. Answer in Bangla. User: ${text}`;

        let parts: any[] = [{ text: prompt }];
        if (image && image.includes(",")) {
            parts.push({ inline_data: { mime_type: "image/jpeg", data: image.split(",")[1] } });
        }

        // এটাই এখন সব Free API Key তে চলে - এটাই তোমার সেই 3.8 এর নতুন নাম
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

        const res = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ contents: [{ parts }] }),
        });

        const data = await res.json();
        if (data.error) return NextResponse.json({ ans: "API Error: " + data.error.message });

        const ans = data?.candidates?.[0]?.content?.parts?.[0]?.text || "উত্তর পাওয়া যায়নি";
        return NextResponse.json({ ans });

    } catch (e: any) {
        return NextResponse.json({ ans: "Server Error: " + e.message });
    }
}