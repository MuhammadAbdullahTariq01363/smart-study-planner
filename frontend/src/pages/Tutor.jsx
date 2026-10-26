import React, { useState, useEffect, useRef } from 'react';
import { Send, Sparkles, BookOpen, FileText, AlertCircle, Bot, User, Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { tutorApi } from '../services/api';
import api from '../services/api';

export default function Tutor({ subject }) {
  const [messages, setMessages] = useState([
    {
      sender: 'bot',
      text: `Hello! I am your AI Tutor for ${subject?.name || 'your subject'}. Ask me anything about your uploaded notes and I will answer from them, with the source shown.`,
      sources: []
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [aiStatus, setAiStatus] = useState(null); // null = loading, {ok, mode, message}
  const messagesEndRef = useRef(null);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Check AI status on mount
  useEffect(() => {
    checkAiStatus();
  }, []);

  const checkAiStatus = async () => {
    try {
      const res = await api.get('/tutor/status');
      setAiStatus(res.data);
    } catch (err) {
      setAiStatus({ ok: false, mode: 'error', message: 'Could not reach backend server.' });
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || !subject?.id) return;

    const userMsg = { sender: 'user', text: input };
    setMessages((prev) => [...prev, userMsg]);
    const currentInput = input;
    setInput('');
    setLoading(true);

    // Add a "searching" placeholder
    setMessages((prev) => [...prev, { sender: 'bot', text: '', searching: true, sources: [] }]);

    try {
      const res = await tutorApi.ask({
        subject_id: subject.id,
        question: currentInput
      });

      // Replace the searching placeholder with the real answer
      setMessages((prev) => [
        ...prev.slice(0, -1),
        {
          sender: 'bot',
          text: res.data.answer,
          sources: res.data.sources || [],
          found_in_notes: res.data.found_in_notes
        }
      ]);
    } catch (err) {
      const errDetail = err?.response?.data?.detail || 'Could not get a response. Please try again.';
      setMessages((prev) => [
        ...prev.slice(0, -1),
        {
          sender: 'bot',
          text: `⚠️ ${errDetail}`,
          sources: [],
          found_in_notes: false,
          isError: true
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Status badge rendering
  const renderStatusBadge = () => {
    if (!aiStatus) {
      return (
        <span className="text-xs bg-slate-100 text-slate-500 px-3 py-1 rounded-full font-semibold border border-slate-200 flex items-center space-x-1.5">
          <RefreshCw className="w-3 h-3 animate-spin" />
          <span>Checking AI...</span>
        </span>
      );
    }
    if (aiStatus.ok && aiStatus.mode === 'gemini') {
      return (
        <span className="text-xs bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full font-semibold border border-emerald-200 flex items-center space-x-1.5">
          <Wifi className="w-3 h-3" />
          <span>● Gemini AI Active</span>
        </span>
      );
    }
    if (aiStatus.mode === 'mock') {
      return (
        <span className="text-xs bg-amber-50 text-amber-700 px-3 py-1 rounded-full font-semibold border border-amber-200 flex items-center space-x-1.5">
          <WifiOff className="w-3 h-3" />
          <span>● Offline Mode (No AI Key)</span>
        </span>
      );
    }
    // gemini configured but failing
    return (
      <button
        onClick={checkAiStatus}
        className="text-xs bg-red-50 text-red-700 px-3 py-1 rounded-full font-semibold border border-red-200 flex items-center space-x-1.5 hover:bg-red-100 transition-colors"
      >
        <AlertCircle className="w-3 h-3" />
        <span>● AI key problem (click to retry)</span>
      </button>
    );
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-sm">Grounded AI Tutor (RAG)</h3>
            <p className="text-xs text-slate-500">Retrieves top matching chunks from uploaded notes and includes source citations.</p>
          </div>
        </div>

        {renderStatusBadge()}
      </div>

      {/* Offline mode info banner */}
      {aiStatus && aiStatus.mode === 'mock' && (
        <div className="px-4 py-2.5 bg-amber-50 border-b border-amber-100 flex items-start space-x-2">
          <WifiOff className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-amber-700 leading-relaxed">
            <strong>Offline Mode:</strong> No Gemini API key is set. The tutor will show the most relevant excerpt from your uploaded notes instead of an AI-generated answer.
            To enable full AI: add your key from <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="underline font-semibold">aistudio.google.com</a> to the <code className="bg-amber-100 px-1 rounded">.env</code> file.
          </p>
        </div>
      )}

      {/* Messages Feed */}
      <div className="flex-1 p-6 overflow-y-auto space-y-4">
        {messages.map((m, idx) => (
          <div
            key={idx}
            className={`flex items-start space-x-3 ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {m.sender === 'bot' && (
              <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center flex-shrink-0 mt-1">
                <Bot className="w-4 h-4" />
              </div>
            )}

            <div className={`max-w-xl space-y-2`}>
              <div
                className={`p-4 rounded-2xl text-sm leading-relaxed ${
                  m.sender === 'user'
                    ? 'bg-indigo-600 text-white rounded-br-none'
                    : m.isError
                    ? 'bg-red-50 text-red-700 rounded-bl-none border border-red-200'
                    : 'bg-slate-100 text-slate-800 rounded-bl-none border border-slate-200/60'
                }`}
              >
                {m.searching ? (
                  <span className="italic text-slate-400 flex items-center space-x-2">
                    <RefreshCw className="w-3 h-3 animate-spin" />
                    <span>Searching your notes...</span>
                  </span>
                ) : (
                  m.text.split('\n').map((line, i) => (
                    <p key={i} className={line ? 'mb-2' : 'mb-0'}>{line}</p>
                  ))
                )}
              </div>

              {/* Source References */}
              {m.sources && m.sources.length > 0 && (
                <div className="bg-indigo-50/60 border border-indigo-100 rounded-xl p-3 text-xs space-y-1.5">
                  <div className="font-bold text-indigo-900 flex items-center space-x-1.5">
                    <FileText className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Evidence Sources from Notes:</span>
                  </div>
                  {m.sources.map((s, sIdx) => (
                    <div key={sIdx} className="bg-white p-2 rounded-lg border border-indigo-50 text-slate-600">
                      <div className="font-semibold text-slate-700">
                        {s.filename} {s.page_number && `(Page ${s.page_number})`}
                      </div>
                      <p className="text-slate-500 italic mt-0.5">"{s.snippet}"</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {m.sender === 'user' && (
              <div className="w-8 h-8 rounded-lg bg-slate-800 text-white flex items-center justify-center flex-shrink-0 mt-1">
                <User className="w-4 h-4" />
              </div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="p-4 border-t border-slate-200 bg-white flex items-center space-x-3">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={subject ? "Ask about core concepts, mechanisms, laws..." : "Select a subject first..."}
          disabled={!subject?.id || loading}
          className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!input.trim() || loading || !subject?.id}
          className="bg-indigo-600 hover:bg-indigo-700 text-white p-3 rounded-2xl transition-colors disabled:opacity-50"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
