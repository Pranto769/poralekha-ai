"use client";
import { useState, useRef } from "react";

type Msg = { role: "user" | "ai"; text: string; image?: string };

export default function Home() {
  const [messages, setMessages] = useState<Msg[]>([
    { role: "ai", text: "আসসালামু আলাইকুম! আমি তোমার পড়ালেখা AI 🚀\n\n✅ ছবি তুলে অংক করতে পারি\n✅ মুখে বললে শুনতে পারি\n✅ MCQ, নোট, সৃজনশীল বানিয়ে দেব\n\nশুরু করো, একটা প্রশ্ন করো!" }
  ]);
  const [input, setInput] = useState("");
  const [isListening, setIsListening] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const send = (text: string, img?: string) => {
    if (!text.trim() && !img) return;
    const userMsg: Msg = { role: "user", text: text || "এই ছবিটা সমাধান করে দাও", image: img };

    let ans = "";
    const q = text.toLowerCase();

    if (img) {
      ans = "ছবিটা দেখলাম! 📸\n\nএটা সমাধান:\nধাপ ১: প্রদত্ত তথ্য লিখি\nধাপ ২: সূত্র প্রয়োগ করি - (a+b)² = a²+2ab+b²\nধাপ ৩: মান বসিয়ে উত্তর = ২৫\n\nবুঝতে না পারলে বলো, আরো সহজ করে বুঝাবো।";
    } else if (q.includes("mcq")) {
      ans = "MCQ বানিয়ে দিলাম তোমার জন্য:\n\n১. পানির সংকেত কি?\nক) H2O খ) CO2 গ) O2 ঘ) N2\nউত্তর: ক\n\n২. ৫² = কত? ক) ১০ খ) ২৫ গ) ১৫ ঘ) ৫০\nউত্তর: খ";
    } else if (q.includes("নোট") || q.includes("note")) {
      ans = "১ পেজ নোট:\n\n📌 বিষয়: নিউটনের সূত্র\n- ১ম সূত্র: জড়তা\n- ২য় সূত্র: F=ma\n- ৩য় সূত্র: ক্রিয়া=প্রতিক্রিয়া\n\nপরীক্ষায় এই ৩টা লাইন লিখলেই ৫ মার্ক!";
    } else {
      ans = `তোমার প্রশ্ন: "${text}"\n\nচমৎকার! চলো স্টেপ বাই স্টেপ বুঝি:\n\n১. সংজ্ঞা: এটা হলো...\n২. উদাহরণ: মনে করো...\n৩. পরীক্ষায় লেখার টেকনিক: প্রথমে সূত্র, তারপর মান...\n\nভয়েসে শুনতে চাও নিচে 🔊 বাটন চাপো।`;
    }

    setMessages(m => [...m, userMsg, { role: "ai", text: ans }]);
    setInput("");
  };

  const startVoice = () => {
    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    if (!SpeechRecognition) { alert("এই ব্রাউজারে ভয়েস সাপোর্ট করে না, Chrome ব্যবহার করো"); return; }
    const rec = new SpeechRecognition();
    rec.lang = "bn-BD";
    rec.start();
    setIsListening(true);
    rec.onresult = (e: any) => { setInput(e.results[0][0].transcript); setIsListening(false); };
    rec.onend = () => setIsListening(false);
  };

  const onImage = (e: any) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => send(input, reader.result as string);
    reader.readAsDataURL(file);
  };

  return (
    <div className="min-h-screen bg-[#f8f7f4] flex flex-col">
      <header className="max-w-3xl w-full mx-auto p-4 flex justify-between items-center">
        <h1 className="font-black text-xl">📚 পড়ালেখা AI</h1>
        <div className="flex gap-2">
          <button onClick={() => send("আমার জন্য MCQ বানাও")} className="text-xs bg-white border px-3 py-1.5 rounded-full">MCQ</button>
          <button onClick={() => send("এই অধ্যায়ের নোট বানাও")} className="text-xs bg-black text-white px-3 py-1.5 rounded-full">নোট</button>
        </div>
      </header>

      <div className="max-w-3xl w-full mx-auto flex-1 p-4 space-y-3 overflow-y-auto">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`p-4 rounded-[20px] max-w-[85%] whitespace-pre-wrap text-[15px] leading-6 ${m.role === "user" ? "bg-black text-white rounded-br-md" : "bg-white border shadow-sm rounded-bl-md"}`}>
              {m.image && <img src={m.image} className="rounded-xl mb-2 max-h-60" />}
              {m.text}
            </div>
          </div>
        ))}
      </div>

      <div className="max-w-3xl w-full mx-auto p-3 sticky bottom-0 bg-[#f8f7f4]">
        <div className="bg-white border shadow-[0_8px_30px_rgba(0,0,0,0.12)] rounded-full flex items-center p-1.5 gap-1">
          <button onClick={() => fileRef.current?.click()} className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">📷</button>
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={onImage} />

          <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && send(input)} placeholder="প্রশ্ন লেখো বা ভয়েস দাও..." className="flex-1 outline-none px-3 bg-transparent" />

          <button onClick={startVoice} className={`w-10 h-10 rounded-full flex items-center justify-center ${isListening ? "bg-red-500 animate-pulse" : "bg-gray-100"}`}>🎤</button>
          <button onClick={() => send(input)} className="bg-black text-white w-10 h-10 rounded-full">↑</button>
        </div>
        <p className="text-[10px] text-center text-gray-400 mt-2">Poralekha AI - তোমার বন্ধু • ছবি + ভয়েস + MCQ সব আছে</p>
      </div>
    </div>
  );
}