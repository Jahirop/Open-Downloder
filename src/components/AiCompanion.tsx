import React, { useState } from "react";
import { Sparkles, Check, ChevronRight, HelpCircle, Send, MessageSquare, ListMusic, Loader2 } from "lucide-react";
import { MediaMetadata } from "../types";

interface AiCompanionProps {
  metadata: MediaMetadata;
  onSetStartTime: (val: number) => void;
  onSetEndTime: (val: number) => void;
}

export default function AiCompanion({ metadata, onSetStartTime, onSetEndTime }: AiCompanionProps) {
  const [activeTab, setActiveTab] = useState<'summary' | 'chapters' | 'chat'>('summary');
  const [chatPrompt, setChatPrompt] = useState<string>("");
  const [chatHistory, setChatHistory] = useState<{ role: 'user' | 'model'; text: string }[]>([
    { role: 'model', text: `Hi there! I have extracted all details from this media stream. You can ask me to write a custom newsletter title, explain key sections, or draft a LinkedIn update about this! What would you like to build?` }
  ]);
  const [chatLoading, setChatLoading] = useState<boolean>(false);

  const formatSecs = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const submitChatCommand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatPrompt.trim() || chatLoading) return;

    const userMsg = chatPrompt.trim();
    setChatPrompt("");
    setChatHistory((prev) => [...prev, { role: 'user', text: userMsg }]);
    setChatLoading(true);

    try {
      const response = await fetch("/api/gemini-command", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mediaContext: {
            title: metadata.title,
            author: metadata.author,
            summary: metadata.summary,
            chapters: metadata.chapters
          },
          prompt: userMsg
        })
      });

      if (response.ok) {
        const data = await response.json();
        setChatHistory((prev) => [...prev, { role: 'model', text: data.result }]);
      } else {
        setChatHistory((prev) => [...prev, { role: 'model', text: "Hmm, I encountered an issue compiling that request. Please try again." }]);
      }
    } catch (err) {
      setChatHistory((prev) => [...prev, { role: 'model', text: "Connection error. Ensure your server is active." }]);
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-zinc-900/50 border border-zinc-800 rounded-2xl p-5 md:p-6 shadow-xl backdrop-blur-md">
      {/* Header Panel label */}
      <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
            <Sparkles className="w-4 h-4 text-indigo-400 animate-pulse" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-zinc-100 flex items-center gap-1.5">
              Gemini Companion
            </h3>
            <p className="text-[10px] text-zinc-500 font-mono">SERVER COGNITION ENGI-NODE</p>
          </div>
        </div>

        {/* Tab triggers */}
        <div className="flex bg-zinc-950 p-1 border border-zinc-800/80 rounded-lg">
          <button
            onClick={() => setActiveTab('summary')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
              activeTab === 'summary' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            Insights
          </button>
          <button
            onClick={() => setActiveTab('chapters')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
              activeTab === 'chapters' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            Index
          </button>
          <button
            onClick={() => setActiveTab('chat')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
              activeTab === 'chat' ? 'bg-zinc-800 text-white animate-pulse' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            Interactive
          </button>
        </div>
      </div>

      {/* Content Canvas (Scrollable) */}
      <div className="flex-1 overflow-y-auto pr-1 py-4 text-sm max-h-[340px]">
        {activeTab === 'summary' && (
          <div className="flex flex-col gap-4 animate-fadeIn">
            {/* Summary Text block */}
            <div className="bg-zinc-950/40 p-4 border border-zinc-800/50 rounded-xl">
              <span className="text-[10px] font-mono tracking-wider text-purple-400 uppercase">TRANSCRIPT OVERVIEW</span>
              <p className="text-zinc-300 leading-relaxed font-sans text-sm mt-1.5">{metadata.summary}</p>
            </div>

            {/* Tags list */}
            <div>
              <span className="text-[10px] font-mono tracking-wider text-zinc-500 uppercase block mb-2">EXTRACTION ASSOCIATES</span>
              <div className="flex flex-wrap gap-1.5">
                {metadata.tags.map((tag, idx) => (
                  <span key={idx} className="px-2.5 py-1 text-xs rounded-full bg-indigo-500/5 border border-indigo-500/10 text-indigo-300">
                    #{tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Quick Details stats */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="bg-zinc-950/60 p-3 rounded-xl border border-zinc-800/60">
                <span className="text-[10px] font-mono text-zinc-500 block">CREATOR</span>
                <span className="text-zinc-300 font-medium truncate block mt-0.5">{metadata.author}</span>
              </div>
              <div className="bg-zinc-950/60 p-3 rounded-xl border border-zinc-800/60">
                <span className="text-[10px] font-mono text-zinc-500 block">BASE DURATION</span>
                <span className="text-zinc-300 font-medium block mt-0.5">{formatSecs(metadata.duration)}</span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'chapters' && (
          <div className="flex flex-col gap-3 animate-fadeIn">
            <span className="text-[10px] font-mono tracking-wider text-zinc-500 uppercase block">INTEREST CHRONOS INDEX (CLICK TO MARK)</span>
            
            <div className="grid gap-2">
              {metadata.chapters.map((chapter, idx) => (
                <div
                  key={idx}
                  onClick={() => {
                    // Update cropping triggers
                    onSetStartTime(chapter.time);
                    if (idx < metadata.chapters.length - 1) {
                      onSetEndTime(metadata.chapters[idx + 1].time);
                    } else {
                      onSetEndTime(metadata.duration);
                    }
                  }}
                  className="group flex items-center justify-between p-3 rounded-xl bg-zinc-950/30 hover:bg-indigo-500/5 border border-zinc-800 hover:border-indigo-500/20 cursor-pointer transition-all hover:-translate-y-0.5"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-xs text-zinc-500 font-mono group-hover:bg-indigo-500/10 group-hover:text-indigo-400">
                      {idx + 1}
                    </span>
                    <span className="text-zinc-300 font-medium group-hover:text-zinc-100 transition-colors truncate max-w-[210px]">
                      {chapter.title}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="font-mono text-xs text-zinc-500 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800 group-hover:border-indigo-500/20 group-hover:text-indigo-300">
                      {formatSecs(chapter.time)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'chat' && (
          <div className="flex flex-col gap-3 min-h-[260px] max-h-[300px] bg-zinc-950 rounded-xl border border-zinc-800/80 overflow-hidden flex-1 justify-between">
            {/* Conversation Feed */}
            <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-3.5 max-h-[220px]">
              {chatHistory.map((chat, idx) => (
                <div key={idx} className={`flex flex-col ${chat.role === 'user' ? 'items-end' : 'items-start'}`}>
                  <span className="text-[9px] font-mono text-zinc-600 uppercase mb-1">
                    {chat.role === 'user' ? 'Client Request' : 'Cognitive Response'}
                  </span>
                  <div className={`px-3.5 py-2.5 rounded-2xl max-w-[85%] text-xs font-sans leading-relaxed ${
                    chat.role === 'user'
                      ? 'bg-indigo-600 text-white rounded-tr-none shadow-md'
                      : 'bg-zinc-900/90 text-zinc-200 border border-zinc-800 rounded-tl-none'
                  }`}>
                    {chat.text}
                  </div>
                </div>
              ))}
              {chatLoading && (
                <div className="flex items-center gap-2 text-zinc-500 text-xs px-2">
                  <Loader2 className="w-4.5 h-4.5 animate-spin text-indigo-400" />
                  <span className="font-mono">Synthesizing solution...</span>
                </div>
              )}
            </div>

            {/* Input message form bar */}
            <form onSubmit={submitChatCommand} className="flex border-t border-zinc-800 p-2 gap-2 bg-zinc-900/20">
              <input
                type="text"
                placeholder="Ask e.g. Write a 4-sentence summary..."
                value={chatPrompt}
                onChange={(e) => setChatPrompt(e.target.value)}
                disabled={chatLoading}
                className="flex-1 bg-zinc-950 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 rounded-lg px-3 py-2 border border-zinc-800/50"
              />
              <button
                type="submit"
                disabled={chatLoading}
                className="p-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-40 transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
