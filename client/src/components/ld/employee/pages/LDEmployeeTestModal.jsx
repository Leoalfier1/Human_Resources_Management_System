import React, { useState, useEffect } from 'react';
import { X, CheckCircle, HelpCircle, FileText, AlertCircle, RefreshCw, Award } from 'lucide-react';
import { apiFetch } from '../../../../utils/api';

const LDEmployeeTestModal = ({
  isOpen,
  onClose,
  programId,
  programTitle,
  testType = 'pre_test',
  onSubmitted
}) => {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitError, setSubmitError] = useState(null);
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (isOpen && programId) {
      setLoading(true);
      setError(null);
      setSubmitError(null);
      setAnswers({});
      setResult(null);

      const defaultSampleQuestions = testType === 'pre_test' ? [
        {
          id: 'demo_1',
          question_text: 'What is the primary objective of PPST-aligned professional development?',
          question_type: 'multiple_choice',
          options: ['Enhancing teacher competencies', 'Fulfilling administrative hours', 'Manual grading', 'None of the above'],
          correct_answer: 'Enhancing teacher competencies'
        },
        {
          id: 'demo_2',
          question_text: 'Self-assessment results help identify priority learning areas.',
          question_type: 'true_false',
          options: ['True', 'False'],
          correct_answer: 'True'
        }
      ] : [
        {
          id: 'demo_post_1',
          question_text: 'Did the program content satisfy your learning objectives?',
          question_type: 'true_false',
          options: ['True', 'False'],
          correct_answer: 'True'
        }
      ];

      apiFetch(`/api/ld/programs/${programId}/tests`)
        .then(r => r.json())
        .then(data => {
          const list = testType === 'pre_test' ? (data.pre_test || []) : (data.post_test || []);
          if (list.length > 0) {
            setQuestions(list);
          } else {
            setQuestions(defaultSampleQuestions);
          }
        })
        .catch(err => {
          console.error('Fetch test error, using sample questions:', err);
          setQuestions(defaultSampleQuestions);
        })
        .finally(() => setLoading(false));
    }
  }, [isOpen, programId, testType]);

  if (!isOpen) return null;

  const titleText = testType === 'pre_test' ? 'Pre-Test Assessment' : 'Post-Test Assessment';

  const handleSelectOption = (questionId, optionValue) => {
    setAnswers(prev => ({ ...prev, [questionId]: optionValue }));
    if (submitError) setSubmitError(null);
  };

  const isAllAnswered = questions.length > 0 && questions.every(q => answers[q.id]);

  const handleSubmit = async () => {
    if (!isAllAnswered) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await apiFetch(`/api/ld/programs/${programId}/submit-test`, {
        method: 'POST',
        body: JSON.stringify({
          test_type: testType,
          answers
        })
      });
      const data = await res.json();
      if (res && res.ok) {
        setResult(data);
        if (onSubmitted) onSubmitted(data);
      } else {
        setSubmitError(data?.message || 'Something went wrong submitting your test — please try again.');
      }
    } catch (err) {
      console.error('Submit test error:', err);
      setSubmitError('Unable to connect to HRMIS server. Please check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0" style={{ background: '#1B2A50' }}>
          <div className="flex items-center gap-3 text-white">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.15)' }}>
              <FileText size={20} />
            </div>
            <div>
              <h3 className="font-black text-sm text-white uppercase tracking-wider">{titleText}</h3>
              <p className="text-xs text-white/70 truncate max-w-md">{programTitle || `Program #${programId}`}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white transition-colors p-1">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {submitError && (
            <div className="p-4 rounded-2xl bg-red-50 border border-red-200 flex items-start gap-3 text-red-700 animate-fadeIn">
              <AlertCircle size={18} className="shrink-0 mt-0.5 text-red-600" />
              <div className="text-xs font-semibold">
                <p className="font-bold text-red-900 mb-0.5">Submission Failed</p>
                <p>{submitError}</p>
              </div>
            </div>
          )}
          {loading ? (
            <div className="py-12 text-center space-y-3">
              <RefreshCw size={28} className="animate-spin mx-auto text-[#1B2A50]" />
              <p className="text-xs font-bold text-slate-500">Loading questions...</p>
            </div>
          ) : error ? (
            <div className="py-8 text-center space-y-3">
              <AlertCircle size={32} className="mx-auto text-amber-500" />
              <p className="text-xs font-bold text-slate-600">{error}</p>
            </div>
          ) : result ? (
            /* Results Screen */
            <div className="py-8 text-center space-y-4">
              <div className="w-20 h-20 rounded-full mx-auto flex items-center justify-center bg-emerald-50 border-4 border-emerald-500 text-emerald-600">
                <Award size={40} />
              </div>
              <div>
                <h4 className="font-black text-xl text-[#1B2A50]">Assessment Completed!</h4>
                <p className="text-xs text-slate-500 mt-1">Your responses have been recorded.</p>
              </div>
              <div className="inline-flex items-center justify-center gap-6 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <div>
                  <p className="text-[10px] font-black uppercase text-slate-400">Score</p>
                  <p className="text-2xl font-black text-[#1B2A50]">{result.score}%</p>
                </div>
                <div className="w-px h-8 bg-slate-200" />
                <div>
                  <p className="text-[10px] font-black uppercase text-slate-400">Correct Answers</p>
                  <p className="text-2xl font-black text-emerald-600">{result.correct_count} / {result.total_questions}</p>
                </div>
              </div>
            </div>
          ) : (
            /* Questions List */
            <>
              <div className="flex items-center justify-between text-xs text-slate-500 pb-2 border-b border-slate-100">
                <span>Please answer all {questions.length} questions.</span>
                <span className="font-bold text-[#1B2A50]">
                  Answered: {Object.keys(answers).length} / {questions.length}
                </span>
              </div>

              {questions.map((q, idx) => {
                const opts = Array.isArray(q.options) && q.options.length > 0
                  ? q.options
                  : (q.question_type === 'true_false' ? ['True', 'False'] : ['Option A', 'Option B', 'Option C', 'Option D']);

                return (
                  <div key={q.id} className="p-5 rounded-2xl border border-slate-100 bg-slate-50/50 space-y-3">
                    <div className="flex items-start gap-3">
                      <span className="w-6 h-6 rounded-full bg-[#1B2A50] text-white font-black text-xs flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <p className="font-bold text-xs text-slate-800 leading-relaxed pt-0.5">
                        {q.question_text}
                      </p>
                    </div>

                    <div className="space-y-2 pl-9">
                      {opts.map((opt, oIdx) => {
                        const isSelected = answers[q.id] === opt;
                        return (
                          <label
                            key={oIdx}
                            onClick={() => handleSelectOption(q.id, opt)}
                            className={`flex items-center gap-3 p-3 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${
                              isSelected
                                ? 'bg-blue-50 border-blue-500 text-blue-900 shadow-sm'
                                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                            }`}
                          >
                            <input
                              type="radio"
                              name={`question_${q.id}`}
                              value={opt}
                              checked={isSelected}
                              onChange={() => handleSelectOption(q.id, opt)}
                              className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                            />
                            <span>{opt}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between shrink-0">
          {result ? (
            <button
              onClick={onClose}
              className="w-full py-3 rounded-xl text-xs font-black text-white bg-[#1B2A50] hover:opacity-90 transition-opacity"
            >
              Done & Close
            </button>
          ) : (
            <>
              <button
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200/60 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={!isAllAnswered || submitting || loading || !!error}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase text-white transition-opacity shadow-sm"
                style={{
                  background: isAllAnswered ? '#DE4E2A' : '#fdd5cc',
                  cursor: isAllAnswered ? 'pointer' : 'not-allowed',
                  opacity: submitting ? 0.6 : 1
                }}
              >
                {submitting ? <RefreshCw size={14} className="animate-spin" /> : <CheckCircle size={14} />}
                {submitting ? 'Submitting...' : 'Submit Answers'}
              </button>
            </>
          )}
        </div>

      </div>
    </div>
  );
};

export default LDEmployeeTestModal;
