"use client";

import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import { jsPDF } from "jspdf";

type Message = {
  role: "user" | "bot";
  content: string;
  image?: string;
};

export default function Home() {
  const [page, setPage] = useState<"welcome" | "study" | "teacher">("welcome");
  const [userName, setUserName] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [image, setImage] = useState<string | null>(null);
  const [seconds, setSeconds] = useState(0);
  const [mode, setMode] = useState("chat");
  const [level, setLevel] = useState("SSC");
  const [subject, setSubject] = useState("ICT");
  const [teacherMode, setTeacherMode] = useState("teach");
  const [topic, setTopic] = useState("");
  const [listening, setListening] = useState(false);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (page === "welcome") return;
    const timer = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(timer);
  }, [page]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m} মি ${sec} সে`;
  };

  const healthTip =
    seconds > 1800
      ? "১৫ মিনিট বিরতি নাও, চোখের যত্ন নাও!"
      : seconds > 900
        ? "পানি খাও এবং একটু হাঁটো।"
        : "ফোকাস বজায় রাখো!";

  const modes = [
    { id: "chat", label: "AI Chat", icon: "💬" },
    { id: "summarize", label: "Summarize", icon: "📝" },
    { id: "quiz", label: "Quiz", icon: "❓" },
    { id: "plan", label: "Study Plan", icon: "📅" },
    { id: "flashcard", label: "Flashcards", icon: "🃏" },
  ];

  const subjectIcon: Record<string, string> = {
    ICT: "💻",
    Physics: "⚛️",
    Chemistry: "🧪",
    Biology: "🧬",
    Math: "📐",
    Bangla: "📖",
    English: "🔤",
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type === "application/pdf") {
      alert("PDF সরাসরি সাপোর্ট সীমিত। ছবি তুলে দাও অথবা টেক্সট পেস্ট করো।");
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => setImage(reader.result as string);
    reader.readAsDataURL(file);
  };

  const startLearning = () => {
    if (userName.trim()) localStorage.setItem("poralekha_name", userName.trim());
    setMessages([
      {
        role: "bot",
        content: `হ্যালো ${userName || ""}! আমি Poralekha AI 📚\nতোমার পার্সোনাল স্টাডি বাডি। কী নিয়ে সাহায্য চাও?`,
      },
    ]);
    setPage("study");
  };

  const clearChat = () => {
    if (page === "study") {
      setMessages([
        {
          role: "bot",
          content: `হ্যালো ${userName || ""}! চ্যাট ক্লিয়ার করা হয়েছে। নতুন করে জিজ্ঞেস করো!`,
        },
      ]);
    } else {
      setMessages([]);
    }
  };

  const copyText = async (text: string, id: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1500);
    } catch {
      alert("Copy করতে সমস্যা হয়েছে");
    }
  };

  const downloadPDF = () => {
    const doc = new jsPDF();
    let y = 15;
    doc.setFontSize(14);
    doc.text("Poralekha AI - Chat Export", 10, y);
    y += 10;
    doc.setFontSize(10);

    messages.forEach((msg) => {
      const prefix = msg.role === "user" ? "You: " : "AI: ";
      const lines = doc.splitTextToSize(prefix + msg.content, 180);
      if (y + lines.length * 6 > 280) {
        doc.addPage();
        y = 15;
      }
      doc.text(lines, 10, y);
      y += lines.length * 6 + 4;
    });

    doc.save("poralekha-chat.pdf");
  };

  const startVoice = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("এই ব্রাউজারে Voice সাপোর্ট নেই। Chrome ব্যবহার করো।");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "bn-BD";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setListening(true);
    recognition.onend = () => setListening(false);
    recognition.onerror = () => {
      setListening(false);
      alert("ভয়েস রিকগনিশন সমস্যা হয়েছে।");
    };
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      if (page === "teacher") setTopic((prev) => (prev ? prev + " " : "") + transcript);
      else setInput((prev) => (prev ? prev + " " : "") + transcript);
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  const sendMessage = async (currentMode: string, customText?: string) => {
    const textToSend = customText !== undefined ? customText : input;
    if (!textToSend.trim() && !image) return;

    const userMessage: Message = {
      role: "user",
      content: textToSend || "এই ছবিটা দেখে সাহায্য করো",
      image: image || undefined,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setTopic("");
    const currentImage = image;
    setImage(null);
    setLoading(true);

    try {
      // Faster: only last 4 messages + truncate long content
      const history = messages
        .slice(1)
        .slice(-4)
        .map((m) => ({
          role: m.role,
          content: m.content.slice(0, 400),
        }));

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: userMessage.content,
          image: currentImage,
          mode: currentMode,
          history,
          level,
          subject,
        }),
      });

      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        { role: "bot", content: data.ans || "কিছু একটা সমস্যা হয়েছে" },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "bot", content: "নেটওয়ার্ক সমস্যা হয়েছে। আবার try করো।" },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // ====================== WELCOME PAGE ======================
  if (page === "welcome") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-950 to-indigo-950 text-white flex items-center justify-center p-6 relative overflow-hidden">
        {/* Animated background blobs */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-violet-600/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-fuchsia-600/20 rounded-full blur-3xl animate-pulse delay-700"></div>

        <div className="max-w-md w-full text-center space-y-8 relative z-10">
          <div className="relative mx-auto w-28 h-28">
            <div className="absolute inset-0 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-3xl rotate-6 animate-pulse"></div>
            <div className="relative w-28 h-28 rounded-3xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-5xl shadow-2xl shadow-violet-500/40">
              📚
            </div>
          </div>

          <div>
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-violet-300 to-fuchsia-300 bg-clip-text text-transparent">
              Poralekha AI
            </h1>
            <p className="text-white/70 mt-3 text-lg">তোমার পার্সোনাল AI Study Buddy</p>
          </div>

          <div className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-3xl p-7 space-y-5 shadow-2xl">
            <div className="flex justify-center gap-4 text-3xl">
              <span className="animate-bounce">📖</span>
              <span className="animate-bounce delay-100">✏️</span>
              <span className="animate-bounce delay-200">🎯</span>
            </div>

            <p className="text-white/80 text-sm leading-relaxed">
              বাংলায় সহজে শিখো • প্রশ্ন করো • কুইজ দাও
              <br />
              পরীক্ষার প্রস্তুতি নাও — শিক্ষকের মতো
            </p>

            <input
              type="text"
              placeholder="তোমার নাম (ঐচ্ছিক)"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-center focus:outline-none focus:ring-2 focus:ring-violet-500"
            />

            <button
              onClick={startLearning}
              className="w-full py-4 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 rounded-xl font-semibold text-lg shadow-lg shadow-violet-600/30 transition active:scale-95"
            >
              Start Learning →
            </button>
          </div>

          <p className="text-xs text-white/40">YUNet AIgnite 2026</p>
        </div>
      </div>
    );
  }

  // ====================== STUDY PAGE ======================
  if (page === "study") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 text-white">
        <header className="border-b border-white/10 backdrop-blur-md sticky top-0 z-50">
          <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-xl">
                📖
              </div>
              <div>
                <h1 className="font-bold text-lg">Poralekha AI</h1>
                <p className="text-xs text-white/60">Your AI Study Buddy</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-xs text-white/50 hidden md:block max-w-[180px] truncate">
                {formatTime(seconds)} • {healthTip}
              </div>
              <button
                onClick={clearChat}
                className="text-xs bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg"
              >
                Clear
              </button>
              <button
                onClick={downloadPDF}
                className="text-xs bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg"
              >
                PDF
              </button>
              <button
                onClick={() => {
                  setMessages([]);
                  setPage("teacher");
                }}
                className="text-sm bg-violet-600 hover:bg-violet-500 px-3 py-1.5 rounded-lg"
              >
                Teacher →
              </button>
            </div>
          </div>
        </header>

        <div className="max-w-5xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-4 gap-6">
          <aside className="space-y-2">
            <p className="text-xs uppercase tracking-wider text-white/50 mb-2">Modes</p>
            {modes.map((m) => (
              <button
                key={m.id}
                onClick={() => setMode(m.id)}
                className={`w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 transition ${mode === m.id
                    ? "bg-violet-600 shadow-lg shadow-violet-600/30"
                    : "bg-white/5 hover:bg-white/10"
                  }`}
              >
                <span className="text-xl">{m.icon}</span>
                <span className="font-medium">{m.label}</span>
              </button>
            ))}
            <div className="mt-6 p-4 rounded-xl bg-white/5 text-sm text-white/60">
              <p className="font-medium text-white/80 mb-1">টিপস</p>
              <ul className="space-y-1 text-xs">
                <li>• 🎤 বাটনে কথা বলে প্রশ্ন করতে পারো</li>
                <li>• নোটের ছবি তুলে দিতে পারো</li>
                <li>• Clear ও PDF বাটন ব্যবহার করো</li>
              </ul>
            </div>
          </aside>

          <main className="lg:col-span-3">
            <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl flex flex-col h-[75vh]">
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
                  >
                    {msg.role === "bot" && (
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center flex-shrink-0">
                        🤖
                      </div>
                    )}
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-3 relative group ${msg.role === "user"
                          ? "bg-violet-600 rounded-tr-none"
                          : "bg-white/10 rounded-tl-none"
                        }`}
                    >
                      {msg.image && (
                        <img
                          src={msg.image}
                          alt="uploaded"
                          className="max-w-xs rounded-lg mb-2 border border-white/20"
                        />
                      )}
                      {msg.role === "bot" ? (
                        <>
                          <div className="prose prose-invert prose-sm max-w-none prose-p:my-1 prose-strong:text-white">
                            <ReactMarkdown
                              remarkPlugins={[remarkMath]}
                              rehypePlugins={[rehypeKatex]}
                            >
                              {msg.content}
                            </ReactMarkdown>
                          </div>
                          <button
                            onClick={() => copyText(msg.content, i)}
                            className="mt-2 text-xs text-white/50 hover:text-white"
                          >
                            {copiedId === i ? "Copied ✓" : "Copy"}
                          </button>
                        </>
                      ) : (
                        <div className="whitespace-pre-wrap">{msg.content}</div>
                      )}
                    </div>
                  </div>
                ))}

                {loading && (
                  <div className="flex gap-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center">
                      🤖
                    </div>
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
                    <button
                      onClick={() => setImage(null)}
                      className="absolute -top-2 -right-2 bg-red-500 w-6 h-6 rounded-full text-xs"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              )}

              <div className="border-t border-white/10 p-4">
                <div className="flex gap-2 items-end">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="p-3 rounded-xl bg-white/10 hover:bg-white/20"
                    title="ছবি"
                  >
                    📷
                  </button>
                  <button
                    onClick={startVoice}
                    className={`p-3 rounded-xl ${listening ? "bg-red-500 animate-pulse" : "bg-white/10 hover:bg-white/20"
                      }`}
                    title="ভয়েস"
                  >
                    🎤
                  </button>
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    ref={fileInputRef}
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage(mode);
                      }
                    }}
                    placeholder={
                      mode === "summarize"
                        ? "নোট পেস্ট করো বা ছবি তোলো..."
                        : mode === "quiz"
                          ? "কোন টপিকের কুইজ চাও?"
                          : mode === "plan"
                            ? "কোন বিষয়ের স্টাডি প্ল্যান চাও?"
                            : "তোমার প্রশ্ন লিখো বা 🎤 চাপো..."
                    }
                    rows={2}
                    className="flex-1 bg-white/10 border border-white/20 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none text-sm"
                  />
                  <button
                    onClick={() => sendMessage(mode)}
                    disabled={loading}
                    className="px-5 py-3 bg-gradient-to-r from-violet-600 to-fuchsia-600 rounded-xl font-medium disabled:opacity-50"
                  >
                    ➤
                  </button>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  // ====================== TEACHER PAGE ======================
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white">
      <header className="border-b border-white/10 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-xl">
              {subjectIcon[subject] || "👨‍🏫"}
            </div>
            <div>
              <h1 className="font-bold text-lg">Poralekha Teacher</h1>
              <p className="text-xs text-white/60">
                {subject} • {level}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={clearChat} className="text-xs bg-white/10 px-3 py-1.5 rounded-lg">
              Clear
            </button>
            <button onClick={downloadPDF} className="text-xs bg-white/10 px-3 py-1.5 rounded-lg">
              PDF
            </button>
            <button
              onClick={() => {
                setMessages([
                  {
                    role: "bot",
                    content: "Study Buddy-তে ফিরে এসেছো! কীভাবে সাহায্য করব?",
                  },
                ]);
                setPage("study");
              }}
              className="text-sm bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg"
            >
              ← Study
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          <select
            value={level}
            onChange={(e) => setLevel(e.target.value)}
            className="bg-slate-800 text-white border border-white/20 rounded-xl px-3 py-2 text-sm"
          >
            <option value="SSC">SSC</option>
            <option value="HSC">HSC</option>
            <option value="Admission">Admission</option>
            <option value="General">General</option>
          </select>

          <select
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="bg-slate-800 text-white border border-white/20 rounded-xl px-3 py-2 text-sm"
          >
            <option>ICT</option>
            <option>Physics</option>
            <option>Chemistry</option>
            <option>Biology</option>
            <option>Math</option>
            <option>Bangla</option>
            <option>English</option>
          </select>

          <select
            value={teacherMode}
            onChange={(e) => setTeacherMode(e.target.value)}
            className="bg-slate-800 text-white border border-white/20 rounded-xl px-3 py-2 text-sm"
          >
            <option value="teach">Teach Me</option>
            <option value="exam">Generate Questions</option>
            <option value="solve">Solve Question</option>
            <option value="suggestion">Suggestions</option>
            <option value="summary">Summary</option>
          </select>

          <button
            onClick={() => sendMessage(teacherMode, topic)}
            disabled={loading}
            className="bg-violet-600 hover:bg-violet-500 rounded-xl py-2 font-medium text-sm disabled:opacity-50"
          >
            Start
          </button>
        </div>

        <div className="flex gap-2">
          <input
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage(teacherMode, topic)}
            placeholder="টপিক বা প্রশ্ন লিখো..."
            className="flex-1 bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
          />
          <button
            onClick={startVoice}
            className={`px-4 rounded-xl ${listening ? "bg-red-500 animate-pulse" : "bg-white/10"
              }`}
          >
            🎤
          </button>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl h-[50vh] overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <p className="text-white/40 text-center mt-16">
              Level, Subject ও Mode সিলেক্ট করে টপিক লিখে Start চাপো
            </p>
          )}

          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
            >
              {msg.role === "bot" && (
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center flex-shrink-0">
                  {subjectIcon[subject] || "👨‍🏫"}
                </div>
              )}
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 ${msg.role === "user"
                    ? "bg-violet-600 rounded-tr-none"
                    : "bg-white/10 rounded-tl-none"
                  }`}
              >
                {msg.image && (
                  <img
                    src={msg.image}
                    alt="uploaded"
                    className="max-w-xs rounded-lg mb-2 border border-white/20"
                  />
                )}
                {msg.role === "bot" ? (
                  <>
                    <div className="prose prose-invert prose-sm max-w-none prose-p:my-1 prose-strong:text-white">
                      <ReactMarkdown
                        remarkPlugins={[remarkMath]}
                        rehypePlugins={[rehypeKatex]}
                      >
                        {msg.content}
                      </ReactMarkdown>
                    </div>
                    <button
                      onClick={() => copyText(msg.content, i)}
                      className="mt-2 text-xs text-white/50 hover:text-white"
                    >
                      {copiedId === i ? "Copied ✓" : "Copy"}
                    </button>
                  </>
                ) : (
                  <div className="whitespace-pre-wrap">{msg.content}</div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex gap-3">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center">
                {subjectIcon[subject] || "👨‍🏫"}
              </div>
              <div className="bg-white/10 rounded-2xl rounded-tl-none px-4 py-3 text-white/60">
                শিক্ষক চিন্তা করছেন...
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-3 rounded-xl bg-white/10 hover:bg-white/20"
          >
            📷 ছবি / নোট
          </button>
          <input
            type="file"
            accept="image/*,application/pdf"
            ref={fileInputRef}
            onChange={handleImageUpload}
            className="hidden"
          />
          {image && (
            <div className="flex items-center gap-2">
              <img src={image} alt="preview" className="h-12 rounded" />
              <button onClick={() => setImage(null)} className="text-red-400 text-sm">
                ✕
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}