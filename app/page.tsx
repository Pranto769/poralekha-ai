"use client";
import { useState } from "react";

export default function Home() {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const send = async (text: string, img?: string) => {
    if (!text.trim() && !img) return;
    setMessages(m => [...m, { role: "user", text, img }]);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, image: img })
      });
      const data = await res.json();
      setMessages(m => [...m, { role: "ai", text: data.ans }]);
    } catch (e) {
      setMessages(m => [...m, { role: "ai", text: "Error, আবার চেষ্টা করো।" }]);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center p-4">
      <h1 className="text-2xl font-bold my-4">Poralekha AI 📚</h1>
      <div className="w-full max-w-2xl flex-1 bg-slate-900 rounded-xl p-4 overflow-auto space-y-3">
        {messages.map((m, i) => (
          <div key={i} className={m.role === "user" ? "text-right" : "text-left"}>
            <div className={`inline-block p-3 rounded-xl ${m.role === "user" ? "bg-blue-600" : "bg-slate-700"}`}>
              {m.img && <img src={m.img} className="max-w-[200px] rounded mb-2" />}
              <div>{m.text}</div>
            </div>
          </div>
        ))}
        {loading && <div className="text-gray-400">AI লিখছে...</div>}
      </div>
      <div className="w-full max-w-2xl flex gap-2 mt-4">
        <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && send(input)} placeholder="প্রশ্ন লেখো, যেমন formula of nitrogen" className="flex-1 p-3 rounded-xl bg-slate-800 outline-none" />
        <button onClick={() => send(input)} className="bg-blue-600 px-6 rounded-xl">Send</button>
      </div>
    </div>
  );
}