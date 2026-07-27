import React, { useState, useEffect } from 'react';
import { BookOpen, ClipboardList, Calendar, CheckCircle, Star, ArrowRight } from 'lucide-react';
import { useLDApplicant, useTNAForms } from '../../hooks/useLD';
import { API_BASE } from '../../utils/api';

const token = () => localStorage.getItem('token');
const headers = () => ({ 'Authorization': `Bearer ${token()}`, 'Content-Type': 'application/json' });

const LDPortal = () => {
  const { data, loading, submitTNA, getMyTnaResponse, registerTraining, submitEval } = useLDApplicant();
  const { forms, fetch: fetchForms } = useTNAForms();
  const [activeSection, setActiveSection] = useState('dashboard');
  const [selectedForm, setSelectedForm] = useState(null);
  const [formQuestions, setFormQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [existingResponse, setExistingResponse] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [selectedEval, setSelectedEval] = useState(null);
  const [evalForm, setEvalForm] = useState({ relevance_rating: 5, effectiveness_rating: 5, applicability_rating: 5, comments: '', impact_assessment: '' });

  useEffect(() => {
    if (activeSection === 'tna') {
      fetchForms({ status: 'open' });
    }
  }, [activeSection, fetchForms]);

  const openForm = async (formId) => {
    const res = await fetch(`${API_BASE}/api/ld/tna/${formId}`, { headers: headers() });
    if (res.ok) {
      const form = await res.json();
      setSelectedForm(form);
      setFormQuestions(form.questions || []);
      const existing = await getMyTnaResponse(formId);
      if (existing) {
        setExistingResponse(existing);
        const ans = {};
        existing.answers?.forEach(a => { ans[a.question_id] = a.answer_value; });
        setAnswers(ans);
      } else {
        setExistingResponse(null);
        setAnswers({});
      }
    }
  };

  const handleAnswer = (questionId, value) => {
    setAnswers({ ...answers, [questionId]: value });
  };

  const handleSubmitTNA = async () => {
    if (!selectedForm) return;
    setSubmitting(true);
    try {
      const ansArray = Object.entries(answers).map(([question_id, answer_value]) => ({ question_id: Number(question_id), answer_value }));
      await submitTNA({ tna_form_id: selectedForm.id, answers: ansArray });
      alert('TNA submitted successfully!');
      setSelectedForm(null);
      setActiveSection('dashboard');
    } catch (err) { alert(err.message); }
    finally { setSubmitting(false); }
  };

  const handleRegister = async (trainingId) => {
    try {
      await registerTraining(trainingId);
      alert('Registered successfully!');
    } catch (err) { alert(err.message); }
  };

  const handleEvalSubmit = async () => {
    if (!selectedEval) return;
    try {
      await submitEval({ training_id: selectedEval.id, ...evalForm });
      alert('Evaluation submitted!');
      setSelectedEval(null);
      setEvalForm({ relevance_rating: 5, effectiveness_rating: 5, applicability_rating: 5, comments: '', impact_assessment: '' });
    } catch (err) { alert(err.message); }
  };

  if (loading) return <div className="animate-pulse p-8 space-y-6"><div className="h-8 bg-slate-200 rounded-xl w-1/3" /><div className="h-40 bg-slate-200 rounded-2xl" /><div className="h-40 bg-slate-200 rounded-2xl" /></div>;

  const tabs = [
    { key: 'dashboard', label: 'Dashboard', icon: BookOpen },
    { key: 'tna', label: 'TNA Forms', icon: ClipboardList },
    { key: 'trainings', label: 'My Trainings', icon: Calendar },
  ];

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-2 flex gap-1">
        {tabs.map(tab => (
          <button key={tab.key} onClick={() => setActiveSection(tab.key)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
              activeSection === tab.key ? 'bg-[#1B3A6B] text-white shadow-sm' : 'text-slate-500 hover:text-[#1B3A6B] hover:bg-slate-50'
            }`}
          >
            <tab.icon size={16} /> {tab.label}
          </button>
        ))}
      </div>

      {/* DASHBOARD */}
      {activeSection === 'dashboard' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-[#1B3A6B] text-white rounded-2xl p-6">
              <ClipboardList size={24} className="mb-2 opacity-80" />
              <p className="text-3xl font-black">{data?.openTnaForms?.length || 0}</p>
              <p className="text-sm opacity-80 font-semibold">Open TNA Forms</p>
            </div>
            <div className="bg-[#D6402F] text-white rounded-2xl p-6">
              <Calendar size={24} className="mb-2 opacity-80" />
              <p className="text-3xl font-black">{data?.upcomingTrainings?.length || 0}</p>
              <p className="text-sm opacity-80 font-semibold">Available Trainings</p>
            </div>
            <div className="bg-green-700 text-white rounded-2xl p-6">
              <CheckCircle size={24} className="mb-2 opacity-80" />
              <p className="text-3xl font-black">{data?.myTrainings?.length || 0}</p>
              <p className="text-sm opacity-80 font-semibold">My Trainings</p>
            </div>
          </div>

          {/* Open TNA Forms */}
          {data?.openTnaForms?.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <h3 className="font-black text-[#1B3A6B] uppercase text-sm mb-4">Open TNA Forms</h3>
              <div className="space-y-2">
                {data.openTnaForms.map(f => (
                  <button key={f.id} onClick={() => { openForm(f.id); setActiveSection('tna'); }}
                    className="w-full flex items-center justify-between p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors text-left">
                    <div>
                      <p className="font-bold text-sm text-[#1B3A6B]">{f.title}</p>
                      {f.description && <p className="text-xs text-slate-500 mt-0.5">{f.description}</p>}
                    </div>
                    <ArrowRight size={16} className="text-slate-400" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Upcoming Trainings */}
          {data?.upcomingTrainings?.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <h3 className="font-black text-[#1B3A6B] uppercase text-sm mb-4">Available Trainings</h3>
              <div className="space-y-2">
                {data.upcomingTrainings.map(t => (
                  <div key={t.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                    <div>
                      <p className="font-bold text-sm text-[#1B3A6B]">{t.title}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{t.venue && `${t.venue} • `}{t.start_date && new Date(t.start_date).toLocaleDateString()}</p>
                    </div>
                    <button onClick={() => handleRegister(t.id)}
                      disabled={t.is_registered}
                      className={`px-4 py-2 rounded-xl text-xs font-bold ${
                        t.is_registered ? 'bg-green-100 text-green-700' : 'bg-[#1B3A6B] text-white hover:bg-[#162E55]'
                      }`}>
                      {t.is_registered ? 'Registered' : 'Register'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TNA FORMS */}
      {activeSection === 'tna' && !selectedForm && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <h3 className="font-black text-[#1B3A6B] uppercase text-sm mb-4">Available TNA Forms</h3>
          <div className="space-y-2">
            {forms.filter(f => f.status === 'open').map(f => (
              <button key={f.id} onClick={() => openForm(f.id)}
                className="w-full flex items-center justify-between p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors text-left">
                <div>
                  <p className="font-bold text-[#1B3A6B]">{f.title}</p>
                  <p className="text-xs text-slate-500 mt-1">{f.description}</p>
                  <p className="text-xs text-slate-400 mt-1">{f.question_count} questions</p>
                </div>
                <ArrowRight size={16} className="text-slate-400" />
              </button>
            ))}
            {forms.filter(f => f.status === 'open').length === 0 && (
              <p className="text-center text-slate-400 py-8 font-semibold">No open TNA forms available</p>
            )}
          </div>
        </div>
      )}

      {/* TNA Form Filler */}
      {activeSection === 'tna' && selectedForm && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="font-black text-lg text-[#1B3A6B]">{selectedForm.title}</h3>
              <p className="text-sm text-slate-500 mt-1">{selectedForm.description}</p>
            </div>
            <button onClick={() => { setSelectedForm(null); setAnswers({}); }} className="text-sm text-slate-400 hover:text-slate-600 font-bold">Back</button>
          </div>
          {existingResponse && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
              <p className="text-sm font-bold text-amber-700">You have already submitted a response. You can update it below.</p>
            </div>
          )}
          <div className="space-y-6">
            {formQuestions.map((q, i) => (
              <div key={q.id || i} className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
                <p className="font-bold text-[#1B3A6B] mb-2">{i + 1}. {q.question_text} {q.is_required && <span className="text-red-500">*</span>}</p>
                {q.question_type === 'text' && (
                  <textarea value={answers[q.id] || ''} onChange={e => handleAnswer(q.id, e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm" rows={3} />
                )}
                {q.question_type === 'rating' && (
                  <div className="flex gap-2">
                    {[1,2,3,4,5].map(r => (
                      <button key={r} onClick={() => handleAnswer(q.id, r)}
                        className={`w-10 h-10 rounded-xl text-sm font-bold transition-all ${
                          Number(answers[q.id]) === r ? 'bg-[#1B3A6B] text-white' : 'bg-white border border-slate-200 text-slate-500 hover:border-[#1B3A6B]'
                        }`}>{r}</button>
                    ))}
                  </div>
                )}
                {(q.question_type === 'choice') && (
                  <div className="space-y-2">
                    {(typeof q.options === 'string' ? q.options.split(',').map(s => s.trim()) : q.options || []).map(opt => (
                      <label key={opt} className="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-100 cursor-pointer hover:border-[#1B3A6B]">
                        <input type="radio" name={`q_${q.id}`} value={opt} checked={answers[q.id] === opt} onChange={e => handleAnswer(q.id, e.target.value)} />
                        <span className="text-sm">{opt}</span>
                      </label>
                    ))}
                  </div>
                )}
                {q.question_type === 'multiple_choice' && (
                  <div className="space-y-2">
                    {(typeof q.options === 'string' ? q.options.split(',').map(s => s.trim()) : q.options || []).map(opt => {
                      const current = (answers[q.id] || '').split(',').filter(Boolean);
                      const checked = current.includes(opt);
                      return (
                        <label key={opt} className="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-100 cursor-pointer hover:border-[#1B3A6B]">
                          <input type="checkbox" checked={checked} onChange={e => {
                            const updated = checked ? current.filter(v => v !== opt) : [...current, opt];
                            handleAnswer(q.id, updated.join(','));
                          }} />
                          <span className="text-sm">{opt}</span>
                        </label>
                      );
                    })}
                  </div>
                )}
                {q.question_type === 'text' && q.category && (
                  <p className="text-xs text-slate-400 mt-1">Category: {q.category}</p>
                )}
              </div>
            ))}
          </div>
          <button onClick={handleSubmitTNA} disabled={submitting}
            className="mt-6 px-8 py-3 bg-[#1B3A6B] text-white rounded-xl text-sm font-black uppercase tracking-wider hover:bg-[#162E55] disabled:opacity-50">
            {submitting ? 'Submitting...' : existingResponse ? 'Update Response' : 'Submit TNA'}
          </button>
        </div>
      )}

      {/* MY TRAININGS */}
      {activeSection === 'trainings' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <h3 className="font-black text-[#1B3A6B] uppercase text-sm mb-4">My Registered Trainings</h3>
          {!data?.myTrainings?.length ? (
            <p className="text-center text-slate-400 py-8 font-semibold">No trainings registered yet</p>
          ) : (
            <div className="space-y-2">
              {data.myTrainings.map(t => (
                <div key={t.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                  <div>
                    <p className="font-bold text-sm text-[#1B3A6B]">{t.title}</p>
                    <div className="flex gap-3 mt-1 text-xs text-slate-400 font-semibold">
                      <span className={`px-2 py-0.5 rounded-full ${t.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>{t.status}</span>
                      <span>Attendance: {t.attendance_status || 'Pending'}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!t.has_evaluated && t.status === 'completed' && (
                      <button onClick={() => {
                        setSelectedEval({ id: t.id, title: t.title });
                        setEvalForm({ relevance_rating: 5, effectiveness_rating: 5, applicability_rating: 5, comments: '', impact_assessment: '' });
                      }} className="px-3 py-2 bg-amber-100 text-amber-700 rounded-xl text-xs font-bold hover:bg-amber-200">
                        <Star size={14} className="inline mr-1" />Evaluate
                      </button>
                    )}
                    {t.has_evaluated > 0 && (
                      <span className="px-3 py-2 bg-green-100 text-green-700 rounded-xl text-xs font-bold">Evaluated</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Evaluation Modal */}
      {selectedEval && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center" onClick={() => setSelectedEval(null)}>
          <div className="bg-white rounded-3xl w-full max-w-lg p-8 m-4 shadow-2xl" onClick={e => e.stopPropagation()}>
            <h3 className="font-black text-lg text-[#1B3A6B] mb-2">Evaluate Training</h3>
            <p className="text-sm text-slate-500 mb-6">{selectedEval.title}</p>
            <div className="space-y-4">
              {['relevance_rating', 'effectiveness_rating', 'applicability_rating'].map(field => (
                <div key={field}>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-2">
                    {field.replace('_', ' ')}
                  </label>
                  <div className="flex gap-2">
                    {[1,2,3,4,5].map(r => (
                      <button key={r} onClick={() => setEvalForm({ ...evalForm, [field]: r })}
                        className={`w-10 h-10 rounded-xl text-sm font-bold transition-all ${
                          evalForm[field] === r ? 'bg-[#1B3A6B] text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                        }`}>{r}</button>
                    ))}
                  </div>
                </div>
              ))}
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-2">Comments</label>
                <textarea value={evalForm.comments} onChange={e => setEvalForm({ ...evalForm, comments: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm" rows={3} />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-2">Impact Assessment</label>
                <textarea value={evalForm.impact_assessment} onChange={e => setEvalForm({ ...evalForm, impact_assessment: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm" rows={2} />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={handleEvalSubmit} className="px-6 py-3 bg-[#1B3A6B] text-white rounded-xl text-xs font-black uppercase tracking-wider">Submit Evaluation</button>
              <button onClick={() => setSelectedEval(null)} className="px-6 py-3 bg-slate-100 text-slate-600 rounded-xl text-xs font-bold">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LDPortal;
