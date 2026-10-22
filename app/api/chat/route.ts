import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {
        const { text, image } = await req.json();
        const apiKey = process.env.GEMINI_API_KEY;

        const prompt = `You are Poralekha AI. Answer short in Bangla. Question: ${text}`;
        let parts: any[] = [{ text: prompt }];
        if (image && image.includes(",")) {
            parts.push({ inline_data: { mime_type: "image/jpeg", data: image.split(",")[1] } });
        }

        const body = JSON.stringify({ contents: [{ parts }] });

        // 8b বাদ দিয়েছি, এখন যেগুলা চলে শুধু সেগুলা
        const models = [
            "gemini-2.0-flash",
            "gemini-2.0-flash-lite",
            "gemini-1.5-flash"
        ];

        let finalAns = "";

        for (const model of models) {
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
            const res = await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: body,
            });
            const data = await res.json();
            if (data?.candidates?.[0]?.content?.parts?.[0]?.text) {
                finalAns = data.candidates[0].content.parts[0].text;
                break;
            }
        }

        return NextResponse.json({ ans: finalAns || "একটু পর আবার Try করো ভাই" });

    } catch (e: any) {
        return NextResponse.json({ ans: "Server Error: " + e.message });
    }
}