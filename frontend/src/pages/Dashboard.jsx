import React, { useEffect, useState } from 'react';
import { Clock, CheckCircle2, Flame, AlertTriangle, ArrowRight, BookOpen, Sparkles } from 'lucide-react';
import { progressApi } from '../services/api';

export default function Dashboard({ subject, onNavigateTab }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (subject?.id) {
      loadStats(subject.id);
    }
  }, [subject]);

  const loadStats = async (subjectId) => {
    setLoading(true);
    try {
      const res = await progressApi.getSubjectProgress(subjectId);
      setStats(res.data);
    } catch (err) {
      console.warn('Using fallback local stats', err);
      // Fallback demo state
      setStats({
        subject_name: subject?.name || 'Mathematics',
        exam_date: subject?.exam_date || '2026-11-15',
        days_left: 24,
        coverage_percentage: 45.0,
        avg_mastery: 0.62,
        study_streak_days: 5,
        total_topics: 10,
        completed_topics: 4,
        weak_topics: [
          { id: 1, title: 'Calculus: Chain Rule & Integration', mastery: 0.45, difficulty: 4 },
          { id: 2, title: 'Linear Algebra: Eigenvalues', mastery: 0.52, difficulty: 5 },
        ],
        today_sessions: [
          { id: 101, topic_title: 'Calculus: Chain Rule & Integration', minutes: 60, status: 'pending', date: '2026-10-22' },
          { id: 102, topic_title: 'Revision & Flashcards Practice', minutes: 45, status: 'pending', date: '2026-10-22' },
        ]
      });
    } finally {
      setLoading(false);
    }
  };

  if (!subject) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-slate-200">
        <h3 className="text-lg font-bold text-slate-800">No Subject Selected</h3>
        <p className="text-slate-500 text-sm mt-1">Please create or choose a subject to review your study plan.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700 rounded-3xl p-8 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-white/20 text-white backdrop-blur-md mb-3">
            <Sparkles className="w-3.5 h-3.5 mr-1.5" /> Exam Focus Mode
          </span>
          <h2 className="text-3xl font-extrabold tracking-tight">{stats?.subject_name}</h2>
          <p className="text-indigo-100 text-sm mt-2 leading-relaxed">
            Target exam date is <strong>{stats?.exam_date}</strong>. Keep up your active study streak and tackle weak concepts today!
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Countdown */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-800">{stats?.days_left ?? 0}</div>
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Days Until Exam</div>
          </div>
        </div>

        {/* Syllabus Coverage */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-800">{stats?.coverage_percentage ?? 0}%</div>
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Syllabus Covered</div>
          </div>
        </div>

        {/* Mastery Score */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-800">
              {stats?.avg_mastery ? `${Math.round(stats.avg_mastery * 100)}%` : '0%'}
            </div>
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Average Mastery</div>
          </div>
        </div>

        {/* Study Streak */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-amber-50 text-amber-500 rounded-xl">
            <Flame className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-800">{stats?.study_streak_days ?? 0} Days</div>
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Study Streak</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Tasks */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-800 text-lg">Today's Study Schedule</h3>
              <p className="text-xs text-slate-400">Structured time slots calculated for today</p>
            </div>
            <button
              onClick={() => onNavigateTab('planner')}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center space-x-1"
            >
              <span>View full weekly plan</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {stats?.today_sessions && stats.today_sessions.length > 0 ? (
              stats.today_sessions.map((session) => (
                <div
                  key={session.id}
                  className="flex items-center justify-between p-4 rounded-xl border border-slate-100 bg-slate-50 hover:bg-slate-100 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={session.status === 'done'}
                      readOnly
                      className="w-5 h-5 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />
                    <div>
                      <h4 className="font-semibold text-slate-800 text-sm">{session.topic_title}</h4>
                      <span className="text-xs text-slate-500 font-medium">{session.minutes} minutes allocated</span>
                    </div>
                  </div>
                  <span className={`px-2.5 py-1 text-xs font-semibold rounded-full uppercase tracking-wider ${
                    session.status === 'done' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                  }`}>
                    {session.status}
                  </span>
                </div>
              ))
            ) : (
              <div className="p-6 text-center text-slate-400 text-sm">
                No sessions scheduled for today. Check the Planner tab to generate or adjust your slots!
              </div>
            )}
          </div>
        </div>

        {/* Weak Topics Widget */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2 text-rose-600 mb-2">
              <AlertTriangle className="w-5 h-5" />
              <h3 className="font-bold text-slate-800 text-base">Weak Topics Detected</h3>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed mb-4">
              Topics scoring under 60% mastery are flagged for prioritized revision (+30-40% study time).
            </p>

            <div className="space-y-3">
              {stats?.weak_topics && stats.weak_topics.length > 0 ? (
                stats.weak_topics.map((t) => (
                  <div key={t.id} className="p-3 rounded-xl bg-rose-50/50 border border-rose-100">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-medium text-xs text-slate-800 truncate max-w-[160px]">{t.title}</span>
                      <span className="text-xs font-bold text-rose-600">{Math.round((t.mastery || 0) * 100)}% Mastery</span>
                    </div>
                    <div className="w-full bg-rose-200/50 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-rose-500 h-1.5 rounded-full"
                        style={{ width: `${Math.round((t.mastery || 0) * 100)}%` }}
                      />
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-emerald-600 font-semibold bg-emerald-50 p-3 rounded-xl">
                  Great job! No weak topics detected yet. Keep quizzing to update your mastery rating.
                </p>
              )}
            </div>
          </div>

          <button
            onClick={() => onNavigateTab('quiz')}
            className="w-full mt-6 py-2.5 px-4 bg-rose-600 hover:bg-rose-700 text-white font-medium text-sm rounded-xl shadow-md shadow-rose-100 flex items-center justify-center space-x-2 transition-colors"
          >
            <span>Take Targeted Revision Quiz</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
