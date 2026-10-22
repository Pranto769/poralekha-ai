"use client";

import { useState, useRef, useEffect } from "react";
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

type Message = {
  role: "user" | "bot";
  content: string;
  image?: string;
};

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "bot",
      content: "হ্যালো! আমি Poralekha AI 📚\nতোমার পার্সোনাল স্টাডি বাডি। কী নিয়ে সাহায্য চাও?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState("chat");
  const [image, setImage] = useState<string | null>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const modes = [
    { id: "chat", label: "AI Chat", icon: "💬" },
    { id: "summarize", label: "Summarize", icon: "📝" },
    { id: "quiz", label: "Quiz", icon: "❓" },
    { id: "plan", label: "Study Plan", icon: "📅" },
    { id: "flashcard", label: "Flashcards", icon: "🃏" },
  ];

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const sendMessage = async () => {
    if (!input.trim() && !image) return;
    const userMessage: Message = {
      role: "user",
      content: input || "এই ছবিটা দেখে সাহায্য করো",
      image: image || undefined,
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    const currentImage = image;
    setImage(null);
    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: input || "এই ছবির নোট সামারাইজ / ব্যাখ্যা করো",
          image: currentImage,
          mode: mode,
        }),
      });
      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        { role: "bot", content: data.ans || "কিছু একটা সমস্যা হয়েছে" },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: "bot", content: "নেটওয়ার্ক সমস্যা হয়েছে। আবার try করো।" },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 text-white">
      <header className="border-b border-white/10 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-xl">📖</div>
            <div>
              <h1 className="font-bold text-lg">Poralekha AI</h1>
              <p className="text-xs text-white/60">Your AI Study Buddy</p>
            </div>
          </div>
          <div className="text-sm text-white/50">YUNet AIgnite 2026</div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-4 gap-6">
        <aside className="space-y-2">
          <p className="text-xs uppercase tracking-wider text-white/50 mb-2">Modes</p>
          {modes.map((m) => (
            <button
              key={m.id}
              onClick={() => setMode(m.id)}
              className={`w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 transition ${mode === m.id ? "bg-violet-600 shadow-lg shadow-violet-600/30" : "bg-white/5 hover:bg-white/10"}`}
            >
              <span className="text-xl">{m.icon}</span>
              <span className="font-medium">{m.label}</span>
            </button>
          ))}
          <div className="mt-6 p-4 rounded-xl bg-white/5 text-sm text-white/60">
            <p className="font-medium text-white/80 mb-1">টিপস</p>
            <ul className="space-y-1 text-xs">
              <li>• নোটের ছবি তুলে দিতে পারো</li>
              <li>• বাংলায় বা ইংরেজিতে লিখতে পারো</li>
              <li>• নির্দিষ্ট করে জিজ্ঞেস করলে ভালো উত্তর পাবে</li>
            </ul>
          </div>
        </aside>

        <main className="lg:col-span-3">
          <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl flex flex-col h-[75vh]">
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg, i) => (
                <div key={i} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                  {msg.role === "bot" && (
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center flex-shrink-0">🤖</div>
                  )}
                  <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${msg.role === "user" ? "bg-violet-600 rounded-tr-none" : "bg-white/10 rounded-tl-none"}`}>
                    {msg.image && <img src={msg.image} alt="uploaded" className="max-w-xs rounded-lg mb-2 border border-white/20" />}
                    {msg.role === "bot" ? (
                      <div className="prose prose-invert prose-sm max-w-none prose-p:my-1 prose-strong:text-white prose-pre:bg-black/30">
                        <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{msg.content}</ReactMarkdown>
                      </div>
                    ) : (
                      <div className="whitespace-pre-wrap">{msg.content}</div>
                    )}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex gap-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center">🤖</div>
                  <div className="bg-white/10 rounded-2xl rounded-tl-none px-4 py-3 flex gap-1">
                    <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce [animation-delay:0.1s]"></div>
                    <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
            {image && (
              <div className="px-4 pt-2">
                <div className="relative inline-block">
                  <img src={image} alt="preview" className="h-20 rounded-lg border border-white/20" />
                  <button onClick={() => setImage(null)} className="absolute -top-2 -right-2 bg-red-500 w-6 h-6 rounded-full text-xs">✕</button>
                </div>
              </div>
            )}
            <div className="border-t border-white/10 p-4">
              <div className="flex gap-3 items-end">
                <button onClick={() => fileInputRef.current?.click()} className="p-3 rounded-xl bg-white/10 hover:bg-white/20" title="নোটের ছবি তোলো">📷</button>
                <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageUpload} className="hidden" />
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                  placeholder={mode === "summarize" ? "নোট পেস্ট করো বা ছবি তোলো..." : mode === "quiz" ? "কোন টপিকের কুইজ চাও?" : mode === "plan" ? "কোন বিষয়ের স্টাডি প্ল্যান চাও?" : "তোমার প্রশ্ন লিখো..."}
                  rows={2}
                  className="flex-1 bg-white/10 border border-white/20 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none text-sm"
                />
                <button onClick={sendMessage} disabled={loading} className="px-5 py-3 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 rounded-xl font-medium disabled:opacity-50">➤</button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}