import React from 'react';
import { BookOpen, Calendar, Clock, LogOut, Sparkles } from 'lucide-react';

export default function Navbar({ subjects, selectedSubject, setSelectedSubject, onLogout, user }) {
  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-100">
          <Sparkles className="w-5 h-5" />
        </div>
        <div>
          <h1 className="font-bold text-slate-800 text-lg leading-tight">Smart Study Planner</h1>
          <p className="text-xs text-indigo-600 font-medium">+ AI Tutor</p>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        {/* Subject Switcher */}
        {subjects.length > 0 && (
          <div className="flex items-center space-x-2 bg-slate-100 py-1.5 px-3 rounded-lg border border-slate-200 text-sm">
            <BookOpen className="w-4 h-4 text-slate-500" />
            <span className="text-slate-500 font-medium">Subject:</span>
            <select
              value={selectedSubject?.id || ''}
              onChange={(e) => {
                const sub = subjects.find(s => s.id === parseInt(e.target.value));
                if (sub) setSelectedSubject(sub);
              }}
              className="bg-transparent font-semibold text-slate-800 focus:outline-none cursor-pointer"
            >
              {subjects.map((sub) => (
                <option key={sub.id} value={sub.id}>
                  {sub.name} (Exam: {sub.exam_date})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* User Info & Logout */}
        <div className="flex items-center space-x-3 pl-3 border-l border-slate-200">
          <div className="text-right text-xs">
            <div className="font-semibold text-slate-700">{user?.name || 'Student'}</div>
            <div className="text-slate-400">{user?.email || 'student@domain.com'}</div>
          </div>
          <button
            onClick={onLogout}
            title="Log out"
            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
