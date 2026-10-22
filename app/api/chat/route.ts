import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {
        const { text, image, mode = "chat" } = await req.json();
        const apiKey = process.env.GEMINI_API_KEY;

        if (!apiKey) {
            return NextResponse.json({ ans: "API Key missing! .env.local ফাইলে GEMINI_API_KEY দাও।" });
        }

        // Different prompts for different modes
        const systemPrompts: Record<string, string> = {
            chat: `তুমি Poralekha AI — একজন বন্ধুসুলভ এবং স্মার্ট বাংলাদেশি স্টডি বাডি। 
উত্তর সংক্ষিপ্ত, পরিষ্কার এবং সহজ বাংলায় দাও। প্রয়োজনে উদাহরণ দাও।`,

            summarize: `তুমি Poralekha AI। নিচের নোট/টেক্সট খুব সহজ বাংলায় সামারাইজ করো। 
মূল পয়েন্টগুলো বুলেট পয়েন্টে দাও। অপ্রয়োজনীয় কথা বাদ দাও।`,

            quiz: `তুমি Poralekha AI। নিচের টপিক থেকে ৫টি মাল্টিপল চয়েস প্রশ্ন তৈরি করো। 
প্রতিটি প্রশ্নের সাথে সঠিক উত্তরও দাও। ফরম্যাট সুন্দর করে দাও।`,

            plan: `তুমি Poralekha AI। নিচের বিষয়ের জন্য একটি বাস্তবসম্মত ৭ দিনের স্টাডি প্ল্যান তৈরি করো। 
প্রতিদিন কী পড়তে হবে এবং কতক্ষণ সময় লাগবে তা উল্লেখ করো।`,

            flashcard: `তুমি Poralekha AI। নিচের বিষয় থেকে ৮টি ফ্ল্যাশকার্ড তৈরি করো। 
ফরম্যাট:
প্রশ্ন: ...
উত্তর: ...`
        };

        const systemPrompt = systemPrompts[mode] || systemPrompts.chat;
        const fullPrompt = `${systemPrompt}\n\nUser Input: ${text || "এই ছবির নোট ব্যাখ্যা/সামারাইজ করো"}`;

        let parts: any[] = [{ text: fullPrompt }];

        // Support image upload
        if (image && image.includes(",")) {
            parts.push({
                inline_data: {
                    mime_type: "image/jpeg",
                    data: image.split(",")[1],
                },
            });
        }

        const body = JSON.stringify({
            contents: [{ parts }],
            generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 2048,
            },
        });

        // Model fallback list (working models)
        const models = ["gemini-2.5-flash-lite", "gemini-2.0-flash-lite", "gemini-3.5-flash", "gemini-3.8-flash"];

        let finalAns = "";

        for (const model of models) {
            try {
                const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
                const res = await fetch(url, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body,
                });

                const data = await res.json();

                if (data?.candidates?.[0]?.content?.parts?.[0]?.text) {
                    finalAns = data.candidates[0].content.parts[0].text;
                    break;
                }
            } catch (err) {
                console.log(`Model ${model} failed, trying next...`);
            }
        }

        return NextResponse.json({
            ans: finalAns || "একটু পর আবার try করো ভাই 😊",
        });
    } catch (e: any) {
        return NextResponse.json({ ans: "Server Error: " + e.message });
    }
}