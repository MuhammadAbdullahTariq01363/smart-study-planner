import React, { useState, useEffect } from 'react';
import { Award, CheckCircle, XCircle, ArrowRight, RefreshCw, AlertTriangle, Sparkles } from 'lucide-react';
import { quizApi, topicApi } from '../services/api';

export default function Quiz({ subject }) {
  const [topics, setTopics] = useState([]);
  const [selectedTopicId, setSelectedTopicId] = useState('');
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [userAnswers, setUserAnswers] = useState({});
  const [quizResult, setQuizResult] = useState(null);

  useEffect(() => {
    if (subject?.id) {
      loadTopics(subject.id);
    }
  }, [subject]);

  const loadTopics = async (subjectId) => {
    try {
      const res = await topicApi.getBySubject(subjectId);
      setTopics(res.data);
      if (res.data.length > 0) {
        setSelectedTopicId(res.data[0].id);
      }
    } catch (err) {
      const demoTopics = [
        { id: 1, title: 'Calculus: Limits & Continuity', difficulty: 3, mastery: 0.85 },
        { id: 2, title: 'Differential Equations: 1st Order', difficulty: 4, mastery: 0.40 },
        { id: 3, title: 'Integration: By Parts & Substitution', difficulty: 4, mastery: 0.55 },
      ];
      setTopics(demoTopics);
      setSelectedTopicId(demoTopics[0].id);
    }
  };

  const handleStartQuiz = async () => {
    if (!selectedTopicId) return;
    setLoading(true);
    setQuizResult(null);
    setUserAnswers({});

    try {
      const res = await quizApi.generate(selectedTopicId);
      setQuiz(res.data);
    } catch (err) {
      // Demo quiz
      const chosen = topics.find(t => t.id === parseInt(selectedTopicId));
      setQuiz({
        id: 101,
        topic_id: selectedTopicId,
        topic_title: chosen?.title || 'Selected Topic',
        difficulty: chosen?.difficulty || 3,
        questions: [
          {
            id: 1,
            type: 'mcq',
            question: `What is the core prerequisite theorem for solving problems in ${chosen?.title || 'this topic'}?`,
            options: [
              'Fundamental Theorem of Analysis and Limits',
              'Heuristic Random Approximation',
              'Arbitrary Constant Cancellation',
              'Static Equilibrium Factor'
            ]
          },
          {
            id: 2,
            type: 'mcq',
            question: 'When a function is differentiable across an open interval, which statement is guaranteed?',
            options: [
              'The function must be continuous across that interval',
              'The function has no turning points',
              'The second derivative is everywhere zero',
              'The function is strictly monotonic'
            ]
          },
          {
            id: 3,
            type: 'short_answer',
            question: 'Briefly define the role of the integration factor when solving linear first-order differential equations.',
            options: null
          }
        ]
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitQuiz = async () => {
    if (!quiz) return;
    setSubmitting(true);

    const answersPayload = quiz.questions.map((q) => ({
      question_id: q.id,
      answer: userAnswers[q.id] || ''
    }));

    try {
      const res = await quizApi.submit(quiz.id, { answers: answersPayload });
      setQuizResult(res.data);
    } catch (err) {
      // Demo result calculation
      setQuizResult({
        score: 66.7,
        accuracy: 0.67,
        total_questions: 3,
        correct_count: 2,
        new_mastery: 0.58,
        is_weak: true,
        breakdown: [
          {
            question_id: 1,
            question: quiz.questions[0].question,
            your_answer: userAnswers[1] || 'Not answered',
            correct_answer: 'Fundamental Theorem of Analysis and Limits',
            is_correct: userAnswers[1] === 'Fundamental Theorem of Analysis and Limits',
            explanation: 'Limits are the basis for rates of change and integration.'
          },
          {
            question_id: 2,
            question: quiz.questions[1].question,
            your_answer: userAnswers[2] || 'Not answered',
            correct_answer: 'The function must be continuous across that interval',
            is_correct: true,
            explanation: 'Differentiability strictly implies continuity.'
          },
          {
            question_id: 3,
            question: quiz.questions[2].question,
            your_answer: userAnswers[3] || 'Not answered',
            correct_answer: 'Transforms the non-exact differential equation into an exact derivative form.',
            is_correct: false,
            explanation: 'Multiplying by e^(int P dx) allows integration of the product rule.'
          }
        ]
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-800">Targeted AI Topic Quiz</h2>
        <p className="text-xs text-slate-500 mt-1">
          Quizzes are generated from your notes. Scoring automatically updates your mastery rating using the Exponential Moving Average formula (mastery &lt; 60% flags a weak topic).
        </p>
      </div>

      {/* Topic Selection Card */}
      {!quiz && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 max-w-xl">
          <label className="block text-xs font-semibold text-slate-600 uppercase mb-2">Select Topic to Quiz</label>
          <div className="flex space-x-3">
            <select
              value={selectedTopicId}
              onChange={(e) => setSelectedTopicId(e.target.value)}
              className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {topics.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title} (Current Mastery: {Math.round((t.mastery || 0) * 100)}%)
                </option>
              ))}
            </select>
            <button
              onClick={handleStartQuiz}
              disabled={loading}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-semibold text-sm shadow-sm transition-colors disabled:opacity-50 flex items-center space-x-2"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Award className="w-4 h-4" />}
              <span>{loading ? 'Generating...' : 'Start Quiz'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Active Quiz Card */}
      {quiz && !quizResult && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="font-bold text-slate-800 text-lg">{quiz.topic_title}</h3>
              <p className="text-xs text-slate-500">{quiz.questions.length} Questions (MCQ & Short Answer)</p>
            </div>
            <button
              onClick={() => setQuiz(null)}
              className="text-xs text-slate-400 hover:text-slate-600"
            >
              Cancel
            </button>
          </div>

          <div className="space-y-6">
            {quiz.questions.map((q, idx) => (
              <div key={q.id} className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-3">
                <div className="flex items-start space-x-2">
                  <span className="font-bold text-indigo-600 text-sm">Q{idx + 1}.</span>
                  <h4 className="font-semibold text-slate-800 text-sm">{q.question}</h4>
                </div>

                {q.type === 'mcq' && q.options && (
                  <div className="space-y-2 pl-6">
                    {q.options.map((opt, optIdx) => (
                      <label
                        key={optIdx}
                        className={`flex items-center space-x-3 p-3 rounded-xl border text-sm cursor-pointer transition-colors ${
                          userAnswers[q.id] === opt
                            ? 'bg-indigo-50 border-indigo-400 font-semibold text-indigo-900'
                            : 'bg-white border-slate-200 hover:bg-slate-100/70 text-slate-700'
                        }`}
                      >
                        <input
                          type="radio"
                          name={`q_${q.id}`}
                          value={opt}
                          checked={userAnswers[q.id] === opt}
                          onChange={(e) => setUserAnswers({ ...userAnswers, [q.id]: e.target.value })}
                          className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span>{opt}</span>
                      </label>
                    ))}
                  </div>
                )}

                {q.type === 'short_answer' && (
                  <div className="pl-6">
                    <textarea
                      rows={3}
                      value={userAnswers[q.id] || ''}
                      onChange={(e) => setUserAnswers({ ...userAnswers, [q.id]: e.target.value })}
                      placeholder="Type your brief answer here..."
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-100">
            <button
              onClick={handleSubmitQuiz}
              disabled={submitting}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl font-semibold text-sm shadow-md shadow-indigo-100 transition-colors disabled:opacity-50 flex items-center space-x-2"
            >
              {submitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
              <span>{submitting ? 'Submitting & Scoring...' : 'Submit Answers'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Quiz Result Card */}
      {quizResult && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="font-bold text-slate-800 text-lg">Quiz Results & Mastery Update</h3>
              <p className="text-xs text-slate-500">Evaluation based on notes answer key</p>
            </div>
            <button
              onClick={() => { setQuiz(null); setQuizResult(null); }}
              className="px-4 py-2 bg-indigo-50 text-indigo-700 font-semibold text-xs rounded-xl hover:bg-indigo-100"
            >
              Take Another Quiz
            </button>
          </div>

          {/* KPI */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-xs text-slate-400 font-bold uppercase">Quiz Accuracy</span>
              <div className="text-2xl font-black text-slate-800 mt-1">{quizResult.score}%</div>
              <p className="text-xs text-slate-500 mt-0.5">{quizResult.correct_count} of {quizResult.total_questions} correct</p>
            </div>

            <div className="p-4 rounded-xl bg-indigo-50/70 border border-indigo-100">
              <span className="text-xs text-indigo-700 font-bold uppercase">New Mastery Score</span>
              <div className="text-2xl font-black text-indigo-900 mt-1">
                {Math.round(quizResult.new_mastery * 100)}%
              </div>
              <p className="text-xs text-indigo-600 mt-0.5">Updated via Exponential Moving Average</p>
            </div>

            <div className={`p-4 rounded-xl border ${quizResult.is_weak ? 'bg-rose-50 border-rose-100' : 'bg-emerald-50 border-emerald-100'}`}>
              <span className={`text-xs font-bold uppercase ${quizResult.is_weak ? 'text-rose-700' : 'text-emerald-700'}`}>
                Topic Status
              </span>
              <div className={`text-xl font-black mt-1 ${quizResult.is_weak ? 'text-rose-800' : 'text-emerald-800'}`}>
                {quizResult.is_weak ? 'Flagged as Weak (< 60%)' : 'Concept Mastered'}
              </div>
              <p className={`text-xs mt-0.5 ${quizResult.is_weak ? 'text-rose-600' : 'text-emerald-600'}`}>
                {quizResult.is_weak ? 'Extra 30-40% revision time assigned' : 'Ready for examination'}
              </p>
            </div>
          </div>

          {/* Breakdown */}
          <div className="space-y-4 pt-2">
            <h4 className="font-bold text-slate-800 text-sm">Question Breakdown & Explanations</h4>
            {quizResult.breakdown.map((item, idx) => (
              <div key={idx} className="p-4 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center space-x-2">
                  {item.is_correct ? (
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <XCircle className="w-4 h-4 text-rose-500" />
                  )}
                  <h5 className="font-semibold text-slate-800 text-sm">{item.question}</h5>
                </div>
                <div className="text-xs space-y-1 pl-6">
                  <div><strong>Your Answer:</strong> <span className={item.is_correct ? 'text-emerald-700 font-semibold' : 'text-rose-600'}>{item.your_answer}</span></div>
                  {!item.is_correct && (
                    <div><strong>Correct Answer:</strong> <span className="text-slate-800 font-semibold">{item.correct_answer}</span></div>
                  )}
                  {item.explanation && (
                    <div className="text-slate-500 italic mt-1"><strong>Explanation:</strong> {item.explanation}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
