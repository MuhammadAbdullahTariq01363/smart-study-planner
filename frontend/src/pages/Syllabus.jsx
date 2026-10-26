import React, { useState, useEffect } from 'react';
import { Plus, BookOpen, Trash2, Edit2, Sparkles, Check } from 'lucide-react';
import { topicApi } from '../services/api';

export default function Syllabus({ subject }) {
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTopic, setNewTopic] = useState({
    title: '',
    difficulty: 3,
    est_hours: 2.0,
    weightage: 1.0
  });

  useEffect(() => {
    if (subject?.id) {
      loadTopics(subject.id);
    }
  }, [subject]);

  const loadTopics = async (subjectId) => {
    setLoading(true);
    try {
      const res = await topicApi.getBySubject(subjectId);
      setTopics(res.data);
    } catch (err) {
      console.warn('Using default demo topics', err);
      setTopics([
        { id: 1, title: 'Calculus: Limits & Continuity', difficulty: 3, est_hours: 3.0, weightage: 1.0, mastery: 0.85, status: 'completed', priority: 1.2 },
        { id: 2, title: 'Differential Equations: 1st Order', difficulty: 4, est_hours: 4.0, weightage: 1.5, mastery: 0.40, status: 'weak', priority: 3.6 },
        { id: 3, title: 'Integration: By Parts & Substitution', difficulty: 4, est_hours: 3.5, weightage: 1.2, mastery: 0.55, status: 'weak', priority: 2.8 },
        { id: 4, title: 'Linear Algebra: Vector Spaces', difficulty: 2, est_hours: 2.0, weightage: 1.0, mastery: 0.70, status: 'in_progress', priority: 0.6 }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTopic = async (e) => {
    e.preventDefault();
    if (!newTopic.title.trim()) return;

    try {
      const res = await topicApi.create(subject.id, newTopic);
      setTopics([...topics, res.data]);
    } catch (err) {
      // Local fallback
      const created = {
        ...newTopic,
        id: Date.now(),
        mastery: 0.0,
        status: 'pending',
        priority: newTopic.difficulty * (newTopic.weightage || 1.0)
      };
      setTopics([...topics, created]);
    }
    setNewTopic({ title: '', difficulty: 3, est_hours: 2.0, weightage: 1.0 });
    setShowAddModal(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Syllabus & Topic Breakdown</h2>
          <p className="text-xs text-slate-500 mt-1">
            Manage your topics, target difficulties, and study weightage for <strong>{subject?.name}</strong>.
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-semibold flex items-center space-x-2 shadow-sm shadow-indigo-100 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add Topic</span>
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/75 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <th className="py-3.5 px-6">Topic Title</th>
              <th className="py-3.5 px-4">Difficulty (1-5)</th>
              <th className="py-3.5 px-4">Est. Hours</th>
              <th className="py-3.5 px-4">Weightage</th>
              <th className="py-3.5 px-4">Priority Score</th>
              <th className="py-3.5 px-4">Mastery</th>
              <th className="py-3.5 px-6">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {topics.map((t) => (
              <tr key={t.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="py-4 px-6 font-semibold text-slate-800 flex items-center space-x-2">
                  <BookOpen className="w-4 h-4 text-slate-400" />
                  <span>{t.title}</span>
                </td>
                <td className="py-4 px-4">
                  <span className="inline-flex items-center space-x-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <span
                        key={star}
                        className={`text-sm ${star <= t.difficulty ? 'text-amber-400 font-bold' : 'text-slate-200'}`}
                      >
                        ★
                      </span>
                    ))}
                  </span>
                </td>
                <td className="py-4 px-4 text-slate-600">{t.est_hours} hrs</td>
                <td className="py-4 px-4 text-slate-600">{t.weightage}x</td>
                <td className="py-4 px-4 font-mono text-xs font-semibold text-indigo-600 bg-indigo-50/50 rounded">
                  {t.priority ? Number(t.priority).toFixed(2) : '-'}
                </td>
                <td className="py-4 px-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-16 bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-2 rounded-full ${
                          (t.mastery || 0) < 0.6 ? 'bg-rose-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${Math.round((t.mastery || 0) * 100)}%` }}
                      />
                    </div>
                    <span className="text-xs font-bold text-slate-700">
                      {Math.round((t.mastery || 0) * 100)}%
                    </span>
                  </div>
                </td>
                <td className="py-4 px-6">
                  <span className={`px-2.5 py-1 text-xs font-semibold rounded-full uppercase tracking-wider ${
                    (t.mastery || 0) < 0.6
                      ? 'bg-rose-100 text-rose-700'
                      : t.status === 'completed'
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-indigo-100 text-indigo-700'
                  }`}>
                    {(t.mastery || 0) < 0.6 ? 'weak (needs review)' : t.status || 'pending'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-slate-800 mb-4">Add Syllabus Topic</h3>
            <form onSubmit={handleAddTopic} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Topic Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Thermodynamics and Entropy"
                  value={newTopic.title}
                  onChange={(e) => setNewTopic({ ...newTopic, title: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Difficulty (1-5)</label>
                  <input
                    type="number"
                    min="1"
                    max="5"
                    value={newTopic.difficulty}
                    onChange={(e) => setNewTopic({ ...newTopic, difficulty: parseInt(e.target.value) || 1 })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Est. Hours</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    value={newTopic.est_hours}
                    onChange={(e) => setNewTopic({ ...newTopic, est_hours: parseFloat(e.target.value) || 1.0 })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Weightage</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    value={newTopic.weightage}
                    onChange={(e) => setNewTopic({ ...newTopic, weightage: parseFloat(e.target.value) || 1.0 })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-500 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-sm"
                >
                  Save Topic
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
