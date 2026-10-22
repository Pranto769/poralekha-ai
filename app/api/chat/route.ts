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

    // ৪টা মডেল, একটা Busy হলে আরেকটা চলবে
    const models = [
      "gemini-2.0-flash",
      "gemini-2.0-flash-lite",
      "gemini-1.5-flash",
      "gemini-1.5-flash-8b"
    ];

    let finalAns = "";
    let lastError = "";

    for (const model of models) {
      try {
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
        } else {
          lastError = data.error?.message || "Busy";
        }
      } catch (e) { continue; }
    }

    if (finalAns) {
      return NextResponse.json({ ans: finalAns });
    } else {
      return NextResponse.json({ ans: "⚠️ সব মডেল এখন Busy আছে ভাই, ১০ সেকেন্ড পর আবার Try করো। (" + lastError + ")" });
    }

  } catch (e: any) {
    return NextResponse.json({ ans: "Server Error: " + e.message });
  }
}