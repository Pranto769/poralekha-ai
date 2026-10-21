@"
    import { NextRequest, NextResponse } from "next/server";
export async function POST(req: NextRequest) {
    try {
        const { text, image } = await req.json();
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) return NextResponse.json({ ans: "Render এ GEMINI_API_KEY পাওয়া যায়নি।" });

        const prompt = `You are Poralekha AI. Answer directly and correctly in Bangla (use English term in bracket). User question: ${text}. If user asks formula, give formula directly. Example: formula of nitrogen is N2. Don't give study plan unless asked. Be short and helpful. If image is given, solve the question in the image.`;

        let parts: any[] = [{ text: prompt }];
        if (image && image.includes(",")) {
            parts.push({ inline_data: { mime_type: "image/jpeg", data: image.split(",")[1] } });
        }

        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ contents: [{ parts }] })
        });

        const data = await res.json();
        const ans = data?.candidates?.[0]?.content?.parts?.[0]?.text || "উত্তর পাওয়া যায়নি, আবার চেষ্টা করো।";
        return NextResponse.json({ ans });
    } catch (e: any) {
        return NextResponse.json({ ans: "Error: " + e.message });
    }
}
"@ | Set-Content -Path app\api\chat\route.ts -Encoding utf8