import React from 'react';
import { LayoutDashboard, BookText, CalendarCheck, FileUp, MessageSquare, Award } from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab }) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'syllabus', label: 'Syllabus & Topics', icon: BookText },
    { id: 'planner', label: 'Study Planner', icon: CalendarCheck },
    { id: 'notes', label: 'Upload Notes', icon: FileUp },
    { id: 'tutor', label: 'AI Tutor (RAG)', icon: MessageSquare },
    { id: 'quiz', label: 'Topic Quizzes', icon: Award },
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col justify-between p-4 min-h-[calc(100vh-4rem)]">
      <nav className="space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-all duration-150 ${
                isActive
                  ? 'bg-indigo-50 text-indigo-700 shadow-sm font-semibold'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-4 rounded-2xl border border-indigo-100">
        <h4 className="font-semibold text-xs text-indigo-900 uppercase tracking-wider mb-1">
          RAG AI Guardrails Active
        </h4>
        <p className="text-xs text-slate-600 leading-relaxed">
          The tutor strictly draws evidence from your notes and explicitly flags missing syllabus context.
        </p>
      </div>
    </aside>
  );
}
