import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {
        const {
            text,
            image,
            mode = "chat",
            history = [],
            level = "",
            subject = ""
        } = await req.json();

        const apiKey = process.env.GEMINI_API_KEY;

        if (!apiKey) {
            return NextResponse.json({ ans: "API Key missing! .env.local ফাইলে GEMINI_API_KEY দাও।" });
        }

        // Different prompts for different modes
        const systemPrompts: Record<string, string> = {
            chat: `তুমি Poralekha AI — একজন বন্ধুসুলভ এবং স্মার্ট বাংলাদেশি স্টডি বাডি। 
উত্তর সংক্ষিপ্ত, পরিষ্কার এবং সহজ বাংলায় দাও। প্রয়োজনে উদাহরণ দাও। আগের কথোপকথন মনে রেখো।`,

            summarize: `তুমি Poralekha AI। নিচের নোট/টেক্সট খুব সহজ বাংলায় সামারাইজ করো। 
মূল পয়েন্টগুলো বুলেট পয়েন্টে দাও। অপ্রয়োজনীয় কথা বাদ দাও।`,

            quiz: `তুমি Poralekha AI। নিচের টপিক থেকে ৫টি মাল্টিপল চয়েস প্রশ্ন তৈরি করো। 
প্রতিটি প্রশ্নের সাথে সঠিক উত্তরও দাও। ফরম্যাট সুন্দর করে দাও।`,

            plan: `তুমি Poralekha AI। নিচের বিষয়ের জন্য একটি বাস্তবসম্মত ৭ দিনের স্টাডি প্ল্যান তৈরি করো। 
প্রতিদিন কী পড়তে হবে এবং কতক্ষণ সময় লাগবে তা উল্লেখ করো।`,

            flashcard: `তুমি Poralekha AI। নিচের বিষয় থেকে ৮টি ফ্ল্যাশকার্ড তৈরি করো। 
ফরম্যাট:
প্রশ্ন: ...
উত্তর: ...`,

            // Teacher Mode prompts
            teach: `তুমি একজন অভিজ্ঞ এবং ধৈর্যশীল বাংলাদেশি শিক্ষক। 
Level: ${level || "General"}, Subject: ${subject || "General"}।
ছাত্রকে ধাপে ধাপে পড়াবে। আগে সহজ করে ব্যাখ্যা করবে, উদাহরণ দিবে, তারপর ছোট প্রশ্ন করে বুঝেছে কিনা চেক করবে। সহজ বাংলায় কথা বলবে।`,

            exam: `তুমি একজন অভিজ্ঞ শিক্ষক। 
Level: ${level || "General"}, Subject: ${subject || "General"}।
বোর্ড পরীক্ষার স্টাইলে ৫টি প্রশ্ন তৈরি করো (MCQ + Creative মিশিয়ে)। প্রতিটি প্রশ্নের সঠিক উত্তরও দাও।`,

            solve: `তুমি একজন অভিজ্ঞ শিক্ষক। প্রশ্নটি ধাপে ধাপে সমাধান করে খুব সহজ বাংলায় বুঝিয়ে দাও।`,

            suggestion: `তুমি একজন অভিজ্ঞ শিক্ষক। 
Level: ${level || "General"}, Subject: ${subject || "General"}।
পরীক্ষার জন্য গুরুত্বপূর্ণ সাজেশন এবং কোন টপিক বেশি খেয়াল রাখতে হবে তা বলো।`,

            summary: `তুমি একজন অভিজ্ঞ শিক্ষক। টপিকটির ছোট্ট এবং পরিষ্কার সামারি দাও সহজ বাংলায়।`
        };

        const systemPrompt = systemPrompts[mode] || systemPrompts.chat;

        // Build conversation with history
        const contents: any[] = [
            {
                role: "user",
                parts: [{ text: systemPrompt }]
            },
            {
                role: "model",
                parts: [{ text: "ঠিক আছে! আমি প্রস্তুত। সাহায্য করতে পারি।" }]
            }
        ];

        // Add previous history (last 6 messages)
        const recentHistory = (history || []).slice(-6);
        recentHistory.forEach((msg: any) => {
            contents.push({
                role: msg.role === "user" ? "user" : "model",
                parts: [{ text: msg.content || "" }]
            });
        });

        // Current user message
        const currentParts: any[] = [{
            text: text || "এই ছবির নোট ব্যাখ্যা/সামারাইজ করো"
        }];

        // Support image upload
        if (image && image.includes(",")) {
            currentParts.push({
                inline_data: {
                    mime_type: "image/jpeg",
                    data: image.split(",")[1],
                },
            });
        }

        contents.push({
            role: "user",
            parts: currentParts
        });

        const body = JSON.stringify({
            contents,
            generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 2048,
            },
        });

        // Model fallback list
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