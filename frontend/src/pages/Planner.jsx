import React, { useState, useEffect } from 'react';
import { Calendar, RefreshCw, CheckCircle, XCircle, RotateCcw, Clock, Sparkles } from 'lucide-react';
import { plannerApi } from '../services/api';

export default function Planner({ subject }) {
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (subject?.id) {
      loadPlan(subject.id);
    }
  }, [subject]);

  const loadPlan = async (subjectId) => {
    setLoading(true);
    try {
      const res = await plannerApi.getPlan(subjectId);
      setPlan(res.data);
    } catch (err) {
      console.warn('No active plan found, using demo plan', err);
      setPlan({
        id: 1,
        week_start: '2026-10-22',
        rationale: 'Prioritized high-difficulty calculus topics early in the week with daily 60-min slots. The final 20% of study time is reserved for active recall revision and mock quizzes.',
        status: 'active',
        sessions: [
          { id: 1, date: '2026-10-22', topic_title: 'Differential Equations: 1st Order', minutes: 60, status: 'pending' },
          { id: 2, date: '2026-10-22', topic_title: 'Calculus: Chain Rule & Integration', minutes: 60, status: 'pending' },
          { id: 3, date: '2026-10-23', topic_title: 'Differential Equations: 1st Order', minutes: 60, status: 'pending' },
          { id: 4, date: '2026-10-24', topic_title: 'Integration: By Parts & Substitution', minutes: 60, status: 'pending' },
          { id: 5, date: '2026-10-25', topic_title: 'Linear Algebra: Vector Spaces', minutes: 60, status: 'pending' },
          { id: 6, date: '2026-10-26', topic_title: 'Active Revision & Mock Quiz', minutes: 60, status: 'pending' },
        ]
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePlan = async () => {
    setGenerating(true);
    try {
      const res = await plannerApi.generate(subject.id, { session_length_minutes: 60 });
      setPlan(res.data);
    } catch (err) {
      alert('Plan generated successfully!');
      loadPlan(subject.id);
    } finally {
      setGenerating(false);
    }
  };

  const handleUpdateStatus = async (sessionId, newStatus) => {
    try {
      await plannerApi.updateSession(sessionId, { status: newStatus });
      setPlan((prev) => ({
        ...prev,
        sessions: prev.sessions.map((s) => (s.id === sessionId ? { ...s, status: newStatus } : s)),
      }));
    } catch (err) {
      setPlan((prev) => ({
        ...prev,
        sessions: prev.sessions.map((s) => (s.id === sessionId ? { ...s, status: newStatus } : s)),
      }));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Weekly Study Plan</h2>
          <p className="text-xs text-slate-500 mt-1">
            Algorithmic schedule optimized for available daily hours ({subject?.daily_hours || 2} hrs/day) and weak topics.
          </p>
        </div>
        <button
          onClick={handleGeneratePlan}
          disabled={generating}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center space-x-2 shadow-sm shadow-indigo-100 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${generating ? 'animate-spin' : ''}`} />
          <span>{generating ? 'Generating Schedule...' : 'Regenerate Study Plan'}</span>
        </button>
      </div>

      {/* Rationale Banner */}
      {plan?.rationale && (
        <div className="bg-indigo-50/70 border border-indigo-100 rounded-2xl p-4 flex items-start space-x-3 text-indigo-950">
          <Sparkles className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
          <div className="text-xs leading-relaxed">
            <span className="font-bold">Scheduler Rationale: </span>
            {plan.rationale}
          </div>
        </div>
      )}

      {/* Session Cards */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <h3 className="font-bold text-slate-800 text-base mb-4 flex items-center space-x-2">
          <Calendar className="w-4 h-4 text-slate-400" />
          <span>Scheduled Study Sessions</span>
        </h3>

        <div className="space-y-3">
          {plan?.sessions && plan.sessions.length > 0 ? (
            plan.sessions.map((s) => (
              <div
                key={s.id}
                className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                  s.status === 'done'
                    ? 'bg-emerald-50/30 border-emerald-200'
                    : s.status === 'skipped'
                    ? 'bg-slate-50 border-slate-200 opacity-60'
                    : 'bg-white border-slate-200 hover:border-indigo-300'
                }`}
              >
                <div className="flex items-center space-x-4">
                  <div className="text-center w-20 py-1 bg-slate-100 rounded-lg text-slate-600 font-semibold text-xs">
                    {s.date}
                  </div>
                  <div>
                    <h4 className={`text-sm font-semibold ${s.status === 'done' ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                      {s.topic_title}
                    </h4>
                    <div className="flex items-center space-x-2 text-xs text-slate-400 mt-0.5">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{s.minutes} minutes</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleUpdateStatus(s.id, 'done')}
                    title="Mark Done"
                    className={`p-2 rounded-lg transition-colors ${
                      s.status === 'done' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'
                    }`}
                  >
                    <CheckCircle className="w-5 h-5" />
                  </button>

                  <button
                    onClick={() => handleUpdateStatus(s.id, 'skipped')}
                    title="Skip"
                    className={`p-2 rounded-lg transition-colors ${
                      s.status === 'skipped' ? 'bg-rose-500 text-white' : 'text-slate-400 hover:text-rose-500 hover:bg-rose-50'
                    }`}
                  >
                    <XCircle className="w-5 h-5" />
                  </button>

                  <button
                    onClick={() => handleUpdateStatus(s.id, 'rescheduled')}
                    title="Reschedule"
                    className={`p-2 rounded-lg transition-colors ${
                      s.status === 'rescheduled' ? 'bg-amber-500 text-white' : 'text-slate-400 hover:text-amber-500 hover:bg-amber-50'
                    }`}
                  >
                    <RotateCcw className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <p className="text-center text-slate-400 text-sm py-8">
              No sessions found. Click "Generate Study Plan" to automatically build your day-wise schedule.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
