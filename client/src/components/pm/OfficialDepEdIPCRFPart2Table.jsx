import React, { useState } from 'react';
import { Printer, Download, Save, CheckCircle } from 'lucide-react';

const COMPETENCIES_DATA = [
  {
    id: 1,
    title: '1. SELF-MANAGEMENT',
    items: [
      'Sets personal goals and directions, needs and development.',
      'Undertakes personal actions and behavior that are clear and purposeful and takes into account personal goals and values congruent to that of the organization.',
      'Displays emotional maturity and enthusiasm for and is challenged by higher goals.',
      'Prioritizes work tasks and schedules (through Gantt charts, checklists, etc.) to achieve goals.',
      'Sets high quality, challenging, realistic goals for self and others.'
    ]
  },
  {
    id: 2,
    title: '2. PROFESSIONALISM AND ETHICS',
    items: [
      'Demonstrates the values and behavior enshrined in the Norms and Conduct and Ethical Standards for public officials and employees (RA 6713).',
      'Practices ethical and professional behavior and conduct taking into account the impact of his/her actions and decisions.',
      'Maintains a professional image: being trustworthy, regularity of attendance and punctuality, good grooming and communication.',
      'Makes personal sacrifices to meet the organization\'s needs.',
      'Act with a sense of urgency and responsibility to meet the organization\'s needs, improve system and help others improve their effectiveness.'
    ]
  },
  {
    id: 3,
    title: '3. RESULTS FOCUS',
    items: [
      'Achieves results with optimal use of time and resources most of the time.',
      'Avoids rework, mistakes and wastage through effective work methods by placing organizational needs before personal needs.',
      'Delivers error-free outputs most of the time by conforming to standard operating procedures correctly and consistently. Able to produce very satisfactory quality work in terms of usefulness/acceptability and completeness with no supervision required.',
      'Expresses a desire to do better and may express frustration at waste or inefficiency. May focus on new or more precise ways of meeting goals set.',
      'Makes specific changes in the system or in own work methods to improve performance. Examples may include doing something better, faster, at a lower cost, more efficiently, or improving quality, customer satisfaction, morale, without setting any specific goal.'
    ]
  },
  {
    id: 4,
    title: '4. TEAMWORK',
    items: [
      'Willingly does his/her share of responsibility.',
      'Promotes collaboration and removes barrier to teamwork and goal accomplishment across the organization.',
      'Applies negotiation principles in arriving at win-win agreements.',
      'Drives consensus and team ownership of decisions.',
      'Works constructively and collaboratively with others and across organizations to accomplish organization goals and objectives.'
    ]
  },
  {
    id: 5,
    title: '5. SERVICE ORIENTATION',
    items: [
      'Can explain and articulate organizational directions, issues and problems.',
      'Takes personal responsibility for dealing with and/or correcting customer service issues and concerns.',
      'Initiates activities that promote advocacy for men and women empowerment.',
      'Participates in updating office vision, mission, mandates and strategies based on DepEd strategies and directions.',
      'Develops and adopts service improvement program through simplified procedures that will further enhance service delivery.'
    ]
  },
  {
    id: 6,
    title: '6. INNOVATION',
    items: [
      'Examines the root cause of problems and suggests effective solutions. Foster new ideas, processes and suggests better ways to do things (cost and/or operational efficiency).',
      'Demonstrates an ability to think "beyond the box". Continuously focuses on improving personal productivity to create higher value and results.',
      'Promotes a creative climate and inspires co-workers to develop original ideas or solutions.',
      'Translates creative thinking into tangible changes and solutions that improve the work unit and organization.',
      'Uses ingenious methods to accomplish responsibilities. Demonstrates resourcefulness and the ability to succeed with minimal resources.'
    ]
  },
  {
    id: 7,
    title: '7. GENDER SENSITIVITY',
    items: [
      'Recognizes and respects individual differences.',
      'Does not discriminate persons on the basis of Sexual Orientation, Gender Identity, Gender Expression, and Sex Characteristics (SOGIESC).',
      'Promotes gender equality, diversity, and inclusion in the workplace.',
      'Has zero-tolerance to gender-biases, discriminatory and exclusionary behaviors and practices.',
      'Taking affirmative action to address gender inequalities.'
    ]
  }
];

const getAdjectivalRating = (score) => {
  const num = parseFloat(score);
  if (isNaN(num) || num === 0) return '—';
  if (num >= 4.5) return 'Outstanding';
  if (num >= 3.5) return 'Very Satisfactory';
  if (num >= 2.5) return 'Satisfactory';
  if (num >= 1.5) return 'Unsatisfactory';
  return 'Poor';
};

const OfficialDepEdIPCRFPart2Table = ({
  employee,
  period,
  raterInfo,
  approverInfo,
  initialRatings = {},
  readOnly = false,
  isSigned = false,
  signatureDataUrl = null,
  raterSignatureDataUrl = null,
  onSavePart2
}) => {
  // State for 35 ratings: { '1-0': 5, '1-1': 4, ... }
  const [ratings, setRatings] = useState(() => {
    try {
      const saved = localStorage.getItem(`part2a_ratings_${employee?.id || 'default'}`);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    const defaultRatings = {};
    COMPETENCIES_DATA.forEach(cat => {
      cat.items.forEach((_, itemIdx) => {
        const key = `${cat.id}-${itemIdx}`;
        defaultRatings[key] = initialRatings[key] !== undefined ? initialRatings[key] : '';
      });
    });
    return defaultRatings;
  });

  const [rateeName, setRateeName] = useState(employee?.name || employee?.full_name || 'Raul M. Colot Jr.');
  const [raterName, setRaterName] = useState(raterInfo?.name || 'Jay Montealto, CESO V');
  const [approverName, setApproverName] = useState(approverInfo?.name || 'Aurelio A. Santisas, CESO VI');
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Compute category averages
  const getCategoryAverage = (catId) => {
    let sum = 0;
    let count = 0;
    for (let i = 0; i < 5; i++) {
      const val = parseFloat(ratings[`${catId}-${i}`]);
      if (!isNaN(val) && val > 0) {
        sum += val;
        count++;
      }
    }
    return count > 0 ? (sum / count).toFixed(3) : '0.000';
  };

  // Compute overall Part 2-A score
  const getOverallScore = () => {
    let totalSum = 0;
    let catCount = 0;
    COMPETENCIES_DATA.forEach(cat => {
      const catAve = parseFloat(getCategoryAverage(cat.id));
      if (!isNaN(catAve) && catAve > 0) {
        totalSum += catAve;
        catCount++;
      }
    });
    return catCount > 0 ? (totalSum / catCount).toFixed(3) : '0.000';
  };

  const handleRatingChange = (catId, itemIdx, val) => {
    if (readOnly) return;
    const num = parseFloat(val);
    if (isNaN(num) || num < 1 || num > 5) return;
    setRatings(prev => ({ ...prev, [`${catId}-${itemIdx}`]: num }));
  };

  const handleSave = () => {
    if (onSavePart2) {
      onSavePart2(ratings, getOverallScore());
    }
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const overallScore = getOverallScore();
  const overallAdjectival = getAdjectivalRating(overallScore);

  return (
    <div className="w-full bg-slate-100 p-2 sm:p-4 md:p-6 rounded-2xl shadow-xl space-y-4">
      {/* Top Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 md:p-4 rounded-xl border border-slate-300 shadow-sm print:hidden">
        <div>
          <h2 className="text-sm md:text-base font-black text-[#1B3A6B] uppercase tracking-tight">
            DepEd IPCRF Part 2 - A: Core Competencies (5%)
          </h2>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
            {readOnly ? 'Read-Only Evaluated Form' : 'Official Rater Evaluation Sheet · Fill 1 to 5 ratings'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {!readOnly && (
            <button
              onClick={handleSave}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#D6402F] hover:bg-red-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow transition-all cursor-pointer active:scale-95"
            >
              {savedSuccess ? <CheckCircle size={14} /> : <Save size={14} />}
              {savedSuccess ? 'Saved Part 2-A!' : 'Save Core Competencies'}
            </button>
          )}

          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow transition-all cursor-pointer"
          >
            <Printer size={14} /> Print / PDF
          </button>
        </div>
      </div>

      {/* Official Form Sheet */}
      <div className="bg-white p-4 md:p-8 rounded-xl border-2 border-slate-800 shadow-2xl space-y-4 font-sans text-black max-w-5xl mx-auto print:border-none print:p-0">
        
        {/* Official DepEd Header Block */}
        <div className="text-center space-y-1 pb-4 mb-4 border-b-2 border-slate-900">
          <div className="flex justify-center mb-2">
            <img
              src="/deped_seal.png"
              alt="DepEd Seal"
              className="h-20 w-auto object-contain"
            />
          </div>
          <div className="text-xs md:text-sm font-serif font-bold tracking-widest text-slate-900 uppercase">
            Republic of the Philippines
          </div>
          <div className="text-base md:text-xl font-serif font-black tracking-wide text-slate-900 uppercase">
            Department of Education
          </div>
          <div className="text-xs font-serif font-bold text-slate-800 uppercase">
            REGION IX
          </div>
          <div className="text-xs font-serif font-bold text-slate-800 uppercase">
            CITY SCHOOLS DIVISION OF DAPITAN
          </div>
        </div>

        {/* Document Header */}
        <div className="border-b-2 border-slate-900 pb-3 flex justify-between items-start">
          <div>
            <div className="text-base md:text-lg font-black uppercase tracking-tight text-slate-900">
              OFFICIAL ELECTRONIC IPCRF TOOL
            </div>
            <div className="text-xs font-bold uppercase text-slate-700">
              SY {period?.year || 2025}-{period?.year ? Number(period.year) + 1 : 2026} · Beginning towards Proficient Teacher
            </div>
          </div>
          <div className="text-right text-[10px] font-black uppercase text-slate-600 border-2 border-slate-800 p-1 rounded">
            DepEd · BHROD
          </div>
        </div>

        {/* Section Title Banner */}
        <div className="bg-slate-100 border border-slate-800 p-2 text-center">
          <h3 className="text-sm font-black uppercase tracking-wider text-slate-900">
            PART 2 - A: CORE COMPETENCIES (5%)
          </h3>
          <p className="text-[10px] font-bold italic text-slate-700">
            Note: This Form is to be accomplished by the RATER.
          </p>
        </div>

        {/* Competencies Instruction & Rating Scale Box */}
        <div className="border border-slate-800 p-3 bg-slate-50 text-[9.5px] leading-snug grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="md:col-span-2 space-y-1">
            <div className="font-black uppercase text-slate-900">CORE COMPETENCIES</div>
            <p className="text-slate-800 font-bold">
              Core Competencies shall capture competencies required from all DepEd personnel in all job groups within the organization, upholding the DepEd's core values and the Code of Conduct and Ethical Standards for Public Officials and Employees pursuant to RA 6713. They represent the way individuals embody and live the values of the organization.
            </p>
            <div className="pt-1 text-[9px] font-black text-slate-700">
              Scale: 5 - Outstanding (Role Model); 4 - Very Satisfactory; 3 - Satisfactory; 2 - Unsatisfactory; 1 - Poor
            </div>
          </div>

          <div className="border-l border-slate-400 pl-3 space-y-0.5 font-bold text-[9px] text-slate-900">
            <div className="font-black uppercase border-b border-slate-300 pb-0.5">Rating Scale Ranges:</div>
            <div>5.000 – Outstanding (4.500–5.000)</div>
            <div>4.000 – Very Satisfactory (3.500–4.499)</div>
            <div>3.000 – Satisfactory (2.500–3.499)</div>
            <div>2.000 – Unsatisfactory (1.500–2.499)</div>
            <div>1.000 – Poor (Below 1.499)</div>
          </div>
        </div>

        {/* Competencies Table */}
        <div className="border-2 border-slate-900 overflow-x-auto rounded-lg shadow-sm">
          <table className="w-full min-w-[650px] border-collapse text-[9.5px]">
            <thead>
              <tr className="bg-slate-200 border-b-2 border-slate-900 font-black uppercase text-slate-900 text-[10px]">
                <th className="p-2 border-r border-slate-800 text-left w-12">No.</th>
                <th className="p-2 border-r border-slate-800 text-left">Competency Indicator Description</th>
                <th className="p-2 border-r border-slate-800 text-center w-20">Score (1–5)</th>
                <th className="p-2 border-r border-slate-800 text-center w-24">Category Ave</th>
                <th className="p-2 text-center w-32">Adjectival Rating</th>
              </tr>
            </thead>
            <tbody>
              {COMPETENCIES_DATA.map((cat) => {
                const catAve = getCategoryAverage(cat.id);
                const catAdjectival = getAdjectivalRating(catAve);

                return cat.items.map((itemText, itemIdx) => {
                  const key = `${cat.id}-${itemIdx}`;
                  const currentVal = ratings[key] ?? '';

                  return (
                    <tr key={key} className="border-b border-slate-800 hover:bg-slate-50 transition-colors align-top">
                      {/* Item No */}
                      <td className="p-2 border-r border-slate-800 font-black text-center bg-slate-50">
                        {itemIdx === 0 ? cat.id : ''}.{itemIdx + 1}
                      </td>

                      {/* Description / Category Header */}
                      <td className="p-2 border-r border-slate-800 font-bold leading-tight">
                        {itemIdx === 0 && (
                          <div className="font-black uppercase text-black text-[10px] mb-1 bg-slate-100 p-1 border-b border-slate-300">
                            {cat.title}
                          </div>
                        )}
                        <div>{itemText}</div>
                      </td>

                      {/* Score Input (1 to 5) */}
                      <td className="p-2 border-r border-slate-800 text-center align-middle bg-slate-50">
                        {readOnly ? (
                          <span className="font-black text-xs text-black">{currentVal || '—'}</span>
                        ) : (
                          <select
                            value={currentVal}
                            onChange={(e) => handleRatingChange(cat.id, itemIdx, e.target.value)}
                            className="w-14 h-9 bg-white border-2 border-slate-900 rounded-lg text-center font-black text-sm text-slate-900 shadow-sm outline-none focus:border-[#D6402F] focus:ring-2 focus:ring-red-300 cursor-pointer hover:bg-amber-50 active:scale-95 transition-all"
                          >
                            <option value="">—</option>
                            {[5, 4, 3, 2, 1].map(n => (
                              <option key={n} value={n}>{n}</option>
                            ))}
                          </select>
                        )}
                      </td>

                      {/* Category Average (RowSpan for first item) */}
                      {itemIdx === 0 && (
                        <>
                          <td
                            rowSpan={5}
                            className="p-2 border-r border-slate-800 text-center align-middle font-black text-sm text-slate-900 bg-amber-50/60"
                          >
                            {catAve}
                          </td>
                          <td
                            rowSpan={5}
                            className="p-2 text-center align-middle font-black text-xs text-blue-900 uppercase bg-blue-50/60"
                          >
                            {catAdjectival}
                          </td>
                        </>
                      )}
                    </tr>
                  );
                });
              })}
            </tbody>
          </table>
        </div>

        {/* Overall Part II-A Summary Box */}
        <div className="border-2 border-slate-900 bg-slate-100 p-4 rounded-lg flex flex-col md:flex-row items-center justify-between gap-4 font-black uppercase">
          <div className="text-sm text-slate-900">
            PART II - A. CORE COMPETENCIES OVERALL SCORE (5%)
          </div>

          <div className="flex items-center gap-6">
            <div className="text-center bg-white px-4 py-2 rounded-xl border-2 border-slate-900 shadow-sm">
              <div className="text-[9px] text-slate-500">Numerical Rating</div>
              <div className="text-2xl font-black text-[#D6402F]">{overallScore}</div>
            </div>

            <div className="text-center bg-white px-5 py-2 rounded-xl border-2 border-slate-900 shadow-sm">
              <div className="text-[9px] text-slate-500">Adjectival Equivalency</div>
              <div className="text-lg font-black text-blue-900">{overallAdjectival}</div>
            </div>
          </div>
        </div>

        {/* Official Signatures Block */}
        <div className="pt-6 border-t-2 border-slate-900 grid grid-cols-1 md:grid-cols-3 gap-6 text-center text-xs font-bold uppercase">
          <div className="space-y-1">
            <div className="min-h-[50px] border-b-2 border-slate-800 flex flex-col items-center justify-end pb-1 relative">
              {signatureDataUrl ? (
                <img src={signatureDataUrl} alt="Ratee Digital Signature" className="h-12 w-auto object-contain max-h-12 -mb-2 z-10 filter drop-shadow-sm" />
              ) : isSigned ? (
                <div className="font-serif italic font-black text-slate-900 text-xs tracking-wider border-b border-emerald-500 text-emerald-800 bg-emerald-50/80 px-2 py-0.5 rounded shadow-xs mb-1">
                  ✍️ {rateeName || 'Raul M. Colot Jr.'}
                </div>
              ) : null}
              <input
                type="text"
                value={rateeName}
                onChange={(e) => setRateeName(e.target.value)}
                className="w-full text-center font-black uppercase outline-none bg-transparent"
                readOnly={readOnly}
              />
            </div>
            <div className="text-[10px] font-black text-slate-600">Ratee (Employee Signature)</div>
          </div>

          <div className="space-y-1">
            <div className="min-h-[50px] border-b-2 border-slate-800 flex flex-col items-center justify-end pb-1 relative">
              {raterSignatureDataUrl && raterSignatureDataUrl !== 'signed_default' ? (
                <img src={raterSignatureDataUrl} alt="Rater Digital Signature" className="h-12 w-auto object-contain max-h-12 -mb-2 z-10 filter drop-shadow-sm" />
              ) : (readOnly || raterSignatureDataUrl === 'signed_default') ? (
                <div className="font-serif italic font-black text-slate-900 text-xs tracking-wider border-b border-emerald-500 text-emerald-800 bg-emerald-50/80 px-2 py-0.5 rounded shadow-xs mb-1">
                  ✍️ {raterName || 'Jay Montealto, CESO V'}
                </div>
              ) : null}
              <input
                type="text"
                value={raterName}
                onChange={(e) => setRaterName(e.target.value)}
                className="w-full text-center font-black uppercase outline-none bg-transparent text-[#1B3A6B]"
                readOnly={readOnly}
              />
            </div>
            <div className="text-[10px] font-black text-slate-600">Rater (Supervisor Signature)</div>
          </div>

          <div className="space-y-4">
            <div className="h-12 border-b-2 border-slate-800 flex items-end justify-center pb-1">
              <input
                type="text"
                value={approverName}
                onChange={(e) => setApproverName(e.target.value)}
                className="w-full text-center font-black uppercase outline-none bg-transparent text-[#D6402F]"
                readOnly={readOnly}
              />
            </div>
            <div className="text-[10px] font-black text-slate-600">Approving Authority Signature</div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default OfficialDepEdIPCRFPart2Table;
