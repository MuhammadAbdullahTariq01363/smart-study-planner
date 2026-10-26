import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Syllabus from './pages/Syllabus';
import Planner from './pages/Planner';
import Notes from './pages/Notes';
import Tutor from './pages/Tutor';
import Quiz from './pages/Quiz';
import Auth from './pages/Auth';
import { subjectApi } from './services/api';
import { Plus } from 'lucide-react';

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [user, setUser] = useState({ name: 'Abdullah Khan', email: 'abdullah@student.edu' });
  const [activeTab, setActiveTab] = useState('dashboard');
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [newSubject, setNewSubject] = useState({
    name: '',
    description: '',
    exam_date: '2026-11-20',
    daily_hours: 2.0,
  });

  useEffect(() => {
    if (token) {
      loadSubjects();
    }
  }, [token]);

  const loadSubjects = async () => {
    try {
      const res = await subjectApi.getAll();
      setSubjects(res.data);
      if (res.data.length > 0) {
        setSelectedSubject(res.data[0]);
      }
    } catch (err) {
      // Demo initial subjects
      const initial = [
        { id: 1, name: 'Calculus & Linear Algebra', description: 'Undergraduate Mathematics syllabus', exam_date: '2026-11-25', daily_hours: 2.5 },
        { id: 2, name: 'Physics: Electromagnetism', description: 'Physics core course', exam_date: '2026-12-05', daily_hours: 2.0 }
      ];
      setSubjects(initial);
      setSelectedSubject(initial[0]);
    }
  };

  const handleCreateSubject = async (e) => {
    e.preventDefault();
    if (!newSubject.name.trim()) return;

    try {
      const res = await subjectApi.create(newSubject);
      setSubjects([...subjects, res.data]);
      setSelectedSubject(res.data);
    } catch (err) {
      const created = {
        ...newSubject,
        id: Date.now()
      };
      setSubjects([...subjects, created]);
      setSelectedSubject(created);
    }
    setShowSubjectModal(false);
    setNewSubject({ name: '', description: '', exam_date: '2026-11-20', daily_hours: 2.0 });
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
  };

  if (!token) {
    return <Auth onLoginSuccess={(u) => { setUser(u); setToken(localStorage.getItem('token')); }} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Navbar
        subjects={subjects}
        selectedSubject={selectedSubject}
        setSelectedSubject={setSelectedSubject}
        onLogout={handleLogout}
        user={user}
      />

      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

        <main className="flex-1 p-8 overflow-y-auto">
          {/* Quick Create Subject if empty */}
          {subjects.length === 0 && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 text-center mb-6">
              <h3 className="font-bold text-slate-800">No subjects configured yet</h3>
              <p className="text-xs text-slate-500 mt-1 mb-4">Start by adding your course subject, exam date, and available daily hours.</p>
              <button
                onClick={() => setShowSubjectModal(true)}
                className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-semibold inline-flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Create First Subject</span>
              </button>
            </div>
          )}

          {activeTab === 'dashboard' && <Dashboard subject={selectedSubject} onNavigateTab={setActiveTab} />}
          {activeTab === 'syllabus' && <Syllabus subject={selectedSubject} />}
          {activeTab === 'planner' && <Planner subject={selectedSubject} />}
          {activeTab === 'notes' && <Notes subject={selectedSubject} />}
          {activeTab === 'tutor' && <Tutor subject={selectedSubject} />}
          {activeTab === 'quiz' && <Quiz subject={selectedSubject} />}
        </main>
      </div>

      {/* Create Subject Modal */}
      {showSubjectModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-100">
            <h3 className="text-lg font-bold text-slate-800 mb-4">Create New Subject</h3>
            <form onSubmit={handleCreateSubject} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Subject Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Calculus & Differential Equations"
                  value={newSubject.name}
                  onChange={(e) => setNewSubject({ ...newSubject, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Target Exam Date</label>
                <input
                  type="date"
                  required
                  value={newSubject.exam_date}
                  onChange={(e) => setNewSubject({ ...newSubject, exam_date: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Daily Available Study Hours</label>
                <input
                  type="number"
                  step="0.5"
                  min="0.5"
                  max="12"
                  value={newSubject.daily_hours}
                  onChange={(e) => setNewSubject({ ...newSubject, daily_hours: parseFloat(e.target.value) || 2.0 })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowSubjectModal(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-500 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-sm"
                >
                  Save Subject
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
