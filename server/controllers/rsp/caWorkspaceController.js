const db = require('../../db');
const path = require('path');
const fs   = require('fs');
const syncApplicationsStage = require('../../utils/syncApplicationsStage');

/* ─── Import bracket resolution from caController ─── */
const { _resolveCaBracket: resolveCaBracket, _BRACKET_LABELS: BRACKET_LABELS } = require('./caController');

/* ─── Teacher I Sectioned Rubric (DO 007, s. 2023 Enclosure No. 2) ─── */

const TEACHER_I_RUBRIC = [
  // Section A: Classroom Observable Indicators — 60%
  { sectionKey: 'A', sectionLabel: 'Classroom Observable Indicators', sectionCategory: 'Demonstration Teaching', sectionWeight: 60, criterionKey: 'content_knowledge_pedagogy', label: 'Content Knowledge and Pedagogy', max: 10, weight: 10, order: 1 },
  { sectionKey: 'A', sectionLabel: 'Classroom Observable Indicators', sectionCategory: 'Demonstration Teaching', sectionWeight: 60, criterionKey: 'learning_environment_mgmt', label: 'Learning Environment and Management', max: 10, weight: 10, order: 2 },
  { sectionKey: 'A', sectionLabel: 'Classroom Observable Indicators', sectionCategory: 'Demonstration Teaching', sectionWeight: 60, criterionKey: 'learner_diversity_inclusion', label: 'Learner Diversity and Inclusion', max: 10, weight: 8, order: 3 },
  { sectionKey: 'A', sectionLabel: 'Classroom Observable Indicators', sectionCategory: 'Demonstration Teaching', sectionWeight: 60, criterionKey: 'curriculum_planning', label: 'Curriculum and Planning', max: 10, weight: 8, order: 4 },
  { sectionKey: 'A', sectionLabel: 'Classroom Observable Indicators', sectionCategory: 'Demonstration Teaching', sectionWeight: 60, criterionKey: 'assessment_reporting', label: 'Assessment and Reporting', max: 10, weight: 8, order: 5 },
  { sectionKey: 'A', sectionLabel: 'Classroom Observable Indicators', sectionCategory: 'Demonstration Teaching', sectionWeight: 60, criterionKey: 'community_linkages', label: 'Community Linkages and Professional Engagement', max: 10, weight: 8, order: 6 },
  { sectionKey: 'A', sectionLabel: 'Classroom Observable Indicators', sectionCategory: 'Demonstration Teaching', sectionWeight: 60, criterionKey: 'personal_growth_pd', label: 'Personal Growth and Professional Development', max: 10, weight: 8, order: 7 },

  // Section B: Non-Classroom Observable Indicators — 20%
  { sectionKey: 'B', sectionLabel: 'Non-Classroom Observable Indicators', sectionCategory: 'Reflection / BEI', sectionWeight: 20, criterionKey: 'bei_leadership', label: 'Behavioral Event Interview — Leadership', max: 10, weight: 5, order: 8 },
  { sectionKey: 'B', sectionLabel: 'Non-Classroom Observable Indicators', sectionCategory: 'Reflection / BEI', sectionWeight: 20, criterionKey: 'bei_communication', label: 'Behavioral Event Interview — Communication', max: 10, weight: 5, order: 9 },
  { sectionKey: 'B', sectionLabel: 'Non-Classroom Observable Indicators', sectionCategory: 'Reflection / BEI', sectionWeight: 20, criterionKey: 'reflection_self_awareness', label: 'Written Reflection — Self-Awareness', max: 10, weight: 4, order: 10 },
  { sectionKey: 'B', sectionLabel: 'Non-Classroom Observable Indicators', sectionCategory: 'Reflection / BEI', sectionWeight: 20, criterionKey: 'reflection_problem_solving', label: 'Written Reflection — Problem-Solving', max: 10, weight: 3, order: 11 },
  { sectionKey: 'B', sectionLabel: 'Non-Classroom Observable Indicators', sectionCategory: 'Reflection / BEI', sectionWeight: 20, criterionKey: 'interpersonal_professionalism', label: 'Interpersonal Skills & Professionalism', max: 10, weight: 3, order: 12 },

  // Section C: Document Evaluation — 20%
  { sectionKey: 'C', sectionLabel: 'Document Evaluation', sectionCategory: 'Education / Training / Experience', sectionWeight: 20, criterionKey: 'education_degree', label: "Education (Master's/Doctor's Degree)", max: 10, weight: 5, order: 13 },
  { sectionKey: 'C', sectionLabel: 'Document Evaluation', sectionCategory: 'Education / Training / Experience', sectionWeight: 20, criterionKey: 'training_seminars', label: 'Training/Seminars (hrs)', max: 10, weight: 4, order: 14 },
  { sectionKey: 'C', sectionLabel: 'Document Evaluation', sectionCategory: 'Education / Training / Experience', sectionWeight: 20, criterionKey: 'experience_years', label: 'Experience (years in service)', max: 10, weight: 4, order: 15 },
  { sectionKey: 'C', sectionLabel: 'Document Evaluation', sectionCategory: 'Education / Training / Experience', sectionWeight: 20, criterionKey: 'performance_rating', label: 'Performance Rating (last 3 ratings)', max: 10, weight: 4, order: 16 },
  { sectionKey: 'C', sectionLabel: 'Document Evaluation', sectionCategory: 'Education / Training / Experience', sectionWeight: 20, criterionKey: 'outstanding_accomplishments', label: 'Outstanding Accomplishments/Awards', max: 10, weight: 3, order: 17 },
];

const TEACHER_I_SECTIONS_META = [
  { key: 'A', label: 'Classroom Observable Indicators', category: 'Demonstration Teaching', weightPercent: 60 },
  { key: 'B', label: 'Non-Classroom Observable Indicators', category: 'Reflection / BEI', weightPercent: 20 },
  { key: 'C', label: 'Document Evaluation', category: 'Education / Training / Experience', weightPercent: 20 },
];

/* ─── Non-Teaching & Teaching-Related Section Groupings ─── */
/*
 * These position types don't have "Classroom Observable Indicators" as a concept.
 * Instead, the 8 DO 007 criteria are grouped into 3 logical evaluation phases:
 *
 *   A. Qualifications         — Education, Training, Experience
 *   B. Performance & Accomplishments — Performance, Outstanding Accomplishments
 *   C. Application & Potential — Application of Education, Application of L&D, Potential
 *
 * Section weights are computed dynamically from the sum of their constituent criteria weights
 * (which vary by salary grade band).
 */
const FLAT_SECTION_GROUPS = [
  { key: 'A', label: 'Qualifications', category: 'Education, Training & Experience', criteriaOrders: [1, 2, 3] },
  { key: 'B', label: 'Performance & Accomplishments', category: 'Performance Rating & Outstanding Achievements', criteriaOrders: [4, 5] },
  { key: 'C', label: 'Application & Potential', category: 'Application of Knowledge & Growth Potential', criteriaOrders: [6, 7, 8] },
];

const CRITERION_LABELS = Object.freeze({
  education: 'Education',
  training: 'Training',
  experience: 'Experience',
  performance: 'Performance',
  outstanding_accomplishments: 'Outstanding Accomplishments',
  application_of_education: 'Application of Education',
  application_of_ld: 'Application of L&D',
  potential: 'Potential (Written Test, BEI, Work Sample Test)',
  pbet_let_lept_rating: 'PBET/LET/LEPT Rating',
  ppst_coi: 'PPST COIs (Classroom Observation)',
  ppst_ncoi: 'PPST NCOIs (Teacher Reflection)'
});

/* ─── Helpers ─── */

const isTeacherIPosition = (title = '') => {
  const n = String(title).trim().toLowerCase();
  return /\bteacher\s*(i|1)\b/.test(n) && !/\b(master|head|principal|supervisor)\b/.test(n);
};

const ensureSession = async (vacancyId, userId) => {
  await db.query(
    `INSERT INTO ca_sessions (vacancy_id, status) VALUES (?, 'draft')
     ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP`,
    [vacancyId]
  );
};

/* ─── Seed: Teacher I Sectioned Rubric ─── */

const seedTeacherISectionedRubric = async (vacancyId) => {
  const [existing] = await db.query(
    'SELECT id FROM comparative_assessment_criteria WHERE vacancy_id = ? AND section_key IS NOT NULL LIMIT 1',
    [vacancyId]
  );
  if (existing.length > 0) return;

  await db.query(
    `DELETE FROM comparative_assessment_criteria
     WHERE vacancy_id = ? AND salary_grade_band = 'teaching_flat' AND section_key IS NULL`,
    [vacancyId]
  );

  const rows = TEACHER_I_RUBRIC.map(r => [
    vacancyId, 'classroom_observable', 'teaching_flat',
    r.sectionKey, r.sectionLabel, r.sectionWeight,
    r.label, r.weight, r.max, r.order
  ]);

  await db.query(
    `INSERT INTO comparative_assessment_criteria
     (vacancy_id, category, salary_grade_band,
      section_key, section_label, section_weight_percent,
      sub_criterion_label, weight_percent, max_score, display_order)
     VALUES ?`,
    [rows]
  );
};

/* ─── Seed: Non-Teaching / Teaching-Related Rubric from IES templates ─── */

const seedFlatSectionedRubric = async (vacancyId, positionCategory, bracketKey, salaryGradeBand) => {
  const [existing] = await db.query(
    'SELECT id FROM comparative_assessment_criteria WHERE vacancy_id = ? AND salary_grade_band = ? LIMIT 1',
    [vacancyId, salaryGradeBand]
  );
  if (existing.length > 0) {
    // Check if existing criteria already have section_key (properly seeded)
    const [withSection] = await db.query(
      'SELECT id FROM comparative_assessment_criteria WHERE vacancy_id = ? AND salary_grade_band = ? AND section_key IS NOT NULL LIMIT 1',
      [vacancyId, salaryGradeBand]
    );
    if (withSection.length > 0) return; // Already seeded correctly

    // Legacy seed without section_key — migrate in place by adding section info
    const bracketCondition = bracketKey === null ? 'bracket_key IS NULL' : 'bracket_key = ?';
    const bracketParams = bracketKey === null ? [] : [bracketKey];
    const [templates] = await db.query(
      `SELECT criteria_key, max_points, display_order
       FROM ies_weight_templates
       WHERE position_category = ? AND ${bracketCondition} AND max_points > 0
       ORDER BY display_order ASC`,
      [positionCategory, ...bracketParams]
    );

    const labelMap = CRITERION_LABELS;

    // Compute section weights
    const sectionWeights = {};
    templates.forEach(t => {
      const sg = FLAT_SECTION_GROUPS.find(g => g.criteriaOrders.includes(t.display_order));
      if (sg) sectionWeights[sg.key] = (sectionWeights[sg.key] || 0) + Number(t.max_points);
    });

    for (const t of templates) {
      const sectionGroup = FLAT_SECTION_GROUPS.find(g => g.criteriaOrders.includes(t.display_order));
      if (!sectionGroup) continue;
      await db.query(
        `UPDATE comparative_assessment_criteria
         SET section_key = ?, section_label = ?, section_weight_percent = ?
         WHERE vacancy_id = ? AND salary_grade_band = ? AND sub_criterion_label = ?`,
        [sectionGroup.key, sectionGroup.label, sectionWeights[sectionGroup.key] || 0,
         vacancyId, salaryGradeBand, labelMap[t.criteria_key] || t.criteria_key]
      );
    }
    return;
  }

  const bracketCondition = bracketKey === null ? 'bracket_key IS NULL' : 'bracket_key = ?';
  const bracketParams = bracketKey === null ? [] : [bracketKey];

  const [templates] = await db.query(
    `SELECT criteria_key, max_points, display_order
     FROM ies_weight_templates
     WHERE position_category = ? AND ${bracketCondition}
       AND max_points > 0
     ORDER BY display_order ASC`,
    [positionCategory, ...bracketParams]
  );

  if (templates.length === 0) {
    throw new Error(`No IES weight template found for ${positionCategory} / ${bracketKey}`);
  }

  const labelMap = CRITERION_LABELS;

  const rows = templates.map(t => {
    const sectionGroup = FLAT_SECTION_GROUPS.find(g => g.criteriaOrders.includes(t.display_order));
    const sectionKey = sectionGroup ? sectionGroup.key : null;
    const sectionLabel = sectionGroup ? sectionGroup.label : null;

    return [
      vacancyId,
      'comparative_flat',
      salaryGradeBand,
      sectionKey,
      sectionLabel,
      null, // section_weight_percent computed below
      labelMap[t.criteria_key] || t.criteria_key,
      Number(t.max_points),
      Number(t.max_points),
      t.display_order
    ];
  });

  const sectionWeights = {};
  templates.forEach(t => {
    const sectionGroup = FLAT_SECTION_GROUPS.find(g => g.criteriaOrders.includes(t.display_order));
    if (sectionGroup) {
      sectionWeights[sectionGroup.key] = (sectionWeights[sectionGroup.key] || 0) + Number(t.max_points);
    }
  });

  rows.forEach(r => {
    const sectionKey = r[3];
    if (sectionKey && sectionWeights[sectionKey] !== undefined) {
      r[5] = sectionWeights[sectionKey];
    }
  });

  for (const r of rows) {
    const val = Number(r[5]);
    if (!Number.isFinite(val) || val <= 0 || val > 100) {
      throw new Error(
        `Invalid section_weight_percent for section "${r[3]}": got ${JSON.stringify(r[5])} (expected a finite number 0–100)`
      );
    }
  }

  await db.query(
    `INSERT INTO comparative_assessment_criteria
     (vacancy_id, category, salary_grade_band,
      section_key, section_label, section_weight_percent,
      sub_criterion_label, weight_percent, max_score, display_order)
     VALUES ?`,
    [rows]
  );
};

/* ─── Master seed orchestrator ─── */

const seedDefaultRubric = async (vacancyId) => {
  const [vacancies] = await db.query(
    'SELECT id, position_type, position_title, salary_grade FROM vacancies WHERE id = ?',
    [vacancyId]
  );
  if (vacancies.length === 0) throw new Error('Vacancy not found.');
  const vacancy = vacancies[0];

  // Teacher I: sectioned rubric with A/B/C (DO 007 Enclosure No. 2)
  if (vacancy.position_type === 'teaching' && isTeacherIPosition(vacancy.position_title)) {
    await seedTeacherISectionedRubric(vacancyId);
    return {
      positionCategory: 'teacher_i',
      layoutMode: 'sectioned',
      salaryGradeBand: 'teaching_flat',
      bracketLabel: null,
      sectionsMeta: TEACHER_I_SECTIONS_META
    };
  }

  // Non-teaching & Teaching-Related: sectioned flat rubric from IES templates
  if (vacancy.position_type === 'non_teaching' || vacancy.position_type === 'teaching_related') {
    try {
      const { positionCategory: resolvedCategory, bracketKey, salaryGradeBand } = resolveCaBracket(vacancy);
      await seedFlatSectionedRubric(vacancyId, resolvedCategory, bracketKey, salaryGradeBand);

      const bracketLabel = BRACKET_LABELS[resolvedCategory]?.[bracketKey] || bracketKey;

      // Build dynamic sectionsMeta from the seeded criteria
      const [criteria] = await db.query(
        `SELECT DISTINCT section_key, section_label, section_weight_percent
         FROM comparative_assessment_criteria
         WHERE vacancy_id = ? AND salary_grade_band = ?
           AND section_key IS NOT NULL
         ORDER BY section_key ASC`,
        [vacancyId, salaryGradeBand]
      );

      const sectionsMeta = criteria.map(c => ({
        key: c.section_key,
        label: c.section_label,
        category: FLAT_SECTION_GROUPS.find(g => g.key === c.section_key)?.category || '',
        weightPercent: Number(c.section_weight_percent) || 0
      }));

      return {
        positionCategory: resolvedCategory,
        layoutMode: 'sectioned',
        salaryGradeBand,
        bracketLabel,
        sectionsMeta
      };
    } catch (err) {
      return {
        positionCategory: vacancy.position_type,
        layoutMode: 'sectioned',
        salaryGradeBand: null,
        bracketLabel: null,
        sectionsMeta: FLAT_SECTION_GROUPS.map(g => ({
          key: g.key,
          label: g.label,
          category: g.category,
          weightPercent: 0
        })),
        criteriaError: err.message
      };
    }
  }

  // Fallback (unknown position type)
  return {
    positionCategory: vacancy.position_type || 'unknown',
    layoutMode: 'flat',
    salaryGradeBand: null,
    bracketLabel: null,
    sectionsMeta: [],
    criteriaNotConfigured: true
  };
};

/* ─── Generic recompute totals (works for any section layout) ─── */

const recomputeTotals = async (applicationId, vacancyId) => {
  const [allScores] = await db.query(`
    SELECT s.score_given, c.max_score, c.weight_percent, c.section_key
    FROM comparative_assessment_scores s
    JOIN comparative_assessment_criteria c ON s.criterion_id = c.id
    WHERE s.applicant_id = ? AND c.vacancy_id = ?`,
    [applicationId, vacancyId]
  );

  const sectionScores = {};
  let total = 0;

  allScores.forEach(row => {
    const max = Number(row.max_score);
    if (!max) return;
    const weighted = (Number(row.score_given) / max) * Number(row.weight_percent);
    total += weighted;
    const key = row.section_key || '_unsectioned';
    sectionScores[key] = (sectionScores[key] || 0) + weighted;
  });

  // Store full sectionScores as JSON + legacy columns for backward compatibility
  // Map section keys to the legacy column slots:
  //   A → category_subscore_classroom
  //   B → category_subscore_nonclassroom
  //   C → category_subscore_document
  // Any non-ABC keys are ONLY in the JSON column — no scores silently lost.
  await db.query(`
    INSERT INTO comparative_assessment_results
    (applicant_id, category_subscore_classroom, category_subscore_nonclassroom,
     category_subscore_document, total_score, section_scores)
    VALUES (?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      category_subscore_classroom = VALUES(category_subscore_classroom),
      category_subscore_nonclassroom = VALUES(category_subscore_nonclassroom),
      category_subscore_document = VALUES(category_subscore_document),
      total_score = VALUES(total_score),
      section_scores = VALUES(section_scores),
      computed_at = CURRENT_TIMESTAMP`,
    [applicationId, sectionScores.A || null, sectionScores.B || null, sectionScores.C || null, total,
     JSON.stringify(sectionScores)]
  );

  return { sectionScores, totalScore: total };
};

/* ─── CONTROLLERS ─── */

const getWorkspace = async (req, res) => {
  try {
    const { vacancyId } = req.params;

    const [vacancies] = await db.query(
      'SELECT id, position_type, position_title, salary_grade, ref_no, current_stage FROM vacancies WHERE id = ?',
      [vacancyId]
    );
    if (vacancies.length === 0) return res.status(404).json({ message: 'Vacancy not found.' });
    const vacancy = vacancies[0];

    const { positionCategory, layoutMode, salaryGradeBand, bracketLabel, sectionsMeta, criteriaError, criteriaNotConfigured } = await seedDefaultRubric(vacancyId);

    const [applicants] = await db.query(
      `SELECT id, full_name, ref_no AS applicant_code
       FROM applications
       WHERE vacancy_id = ? AND status IN ('qualified','shortlisted','selected','appointed')
       ORDER BY full_name ASC`,
      [vacancyId]
    );

    let criteria, sections;
    if (layoutMode === 'sectioned' && salaryGradeBand) {
      const [rows] = await db.query(
        `SELECT id, section_key, section_label, section_weight_percent,
                sub_criterion_label, weight_percent, max_score, display_order
         FROM comparative_assessment_criteria
         WHERE vacancy_id = ? AND salary_grade_band = ?
         ORDER BY display_order ASC, id ASC`,
        [vacancyId, salaryGradeBand]
      );
      criteria = rows;

      // Build sections from the dynamic sectionsMeta
      const sm = sectionsMeta || [];
      sections = sm.map(s => ({
        ...s,
        criteria: rows.filter(r => r.section_key === s.key)
      }));
    } else {
      criteria = [];
      sections = [];
    }

    const appIds = applicants.map(a => a.id);
    let scoresMap = {};
    let remarksMap = {};
    let rankings = [];

    if (appIds.length > 0) {
      const placeholders = appIds.map(() => '?').join(',');
      const [scoresRows] = await db.query(
        `SELECT applicant_id, criterion_id, score_given, remarks
         FROM comparative_assessment_scores
         WHERE applicant_id IN (${placeholders})`,
        appIds
      );
      scoresRows.forEach(r => {
        if (!scoresMap[r.applicant_id]) scoresMap[r.applicant_id] = {};
        scoresMap[r.applicant_id][r.criterion_id] = parseFloat(r.score_given);
        if (r.remarks != null) {
          if (!remarksMap[r.applicant_id]) remarksMap[r.applicant_id] = {};
          remarksMap[r.applicant_id][r.criterion_id] = r.remarks;
        }
      });

      const [rankRows] = await db.query(
        `SELECT a.id, a.full_name, a.ref_no AS applicant_code,
                IFNULL(r.total_score, 0) AS total_score,
                r.category_subscore_classroom, r.category_subscore_nonclassroom,
                r.category_subscore_document,
                r.section_scores,
                RANK() OVER (ORDER BY IFNULL(r.total_score, 0) DESC) AS rank_val
         FROM applications a
         LEFT JOIN comparative_assessment_results r ON a.id = r.applicant_id
         WHERE a.vacancy_id = ? AND a.status IN ('qualified','shortlisted','selected','appointed')
         ORDER BY rank_val ASC`,
        [vacancyId]
      );
      // Parse section_scores JSON and map to legacy column names so RankingsSidebar
      // works for any section key layout (not just A/B/C).
      rankings = rankRows.map(r => {
        let parsed = null;
        if (r.section_scores) {
          try { parsed = typeof r.section_scores === 'string' ? JSON.parse(r.section_scores) : r.section_scores; }
          catch { parsed = null; }
        }
        return {
          ...r,
          category_subscore_classroom:    parsed?.A ?? r.category_subscore_classroom ?? null,
          category_subscore_nonclassroom: parsed?.B ?? r.category_subscore_nonclassroom ?? null,
          category_subscore_document:     parsed?.C ?? r.category_subscore_document ?? null,
          section_scores: parsed   // raw JSON for frontend (arbitrary keys)
        };
      });
    }

    await ensureSession(vacancyId, req.user.id);

    res.json({
      vacancy,
      positionCategory,
      layoutMode,
      salaryGradeBand,
      bracketLabel,
      criteriaError: criteriaError || null,
      criteriaNotConfigured: criteriaNotConfigured || false,
      applicants,
      criteria,
      sections,
      scoresMap,
      remarksMap,
      rankings,
      sectionsMeta: layoutMode === 'sectioned' ? (sectionsMeta || []) : null
    });
  } catch (error) {
    console.error('getWorkspace Error:', error);
    res.status(500).json({ message: error.message || 'Failed to load workspace.' });
  }
};

const bulkUpsertScores = async (req, res) => {
  try {
    const { vacancyId } = req.params;
    const { applicationId, scores } = req.body;
    const userId = req.user.id;

    if (!applicationId || !Array.isArray(scores) || scores.length === 0) {
      return res.status(400).json({ message: 'applicationId and scores array are required.' });
    }

    const [appCheck] = await db.query(
      'SELECT id FROM applications WHERE id = ? AND vacancy_id = ?',
      [applicationId, vacancyId]
    );
    if (appCheck.length === 0) {
      return res.status(404).json({ message: 'Application not found for this vacancy.' });
    }

    const [criteria] = await db.query(
      `SELECT id, max_score FROM comparative_assessment_criteria WHERE vacancy_id = ?`,
      [vacancyId]
    );
    const criteriaMap = {};
    criteria.forEach(c => { criteriaMap[c.id] = Number(c.max_score); });

    const validScores = [];
    for (const s of scores) {
      const max = criteriaMap[s.criterionId];
      if (max === undefined) continue;
      const num = Number(s.score);
      if (!Number.isFinite(num) || num < 0 || num > max) {
        return res.status(422).json({
          message: `Score for criterion ${s.criterionId} must be between 0 and ${max}.`
        });
      }
      const remarks = s.remarks != null ? String(s.remarks).slice(0, 2000) : null;
      validScores.push([applicationId, s.criterionId, num, remarks, userId]);
    }

    if (validScores.length > 0) {
      await db.query(
        `INSERT INTO comparative_assessment_scores
         (applicant_id, criterion_id, score_given, remarks, scored_by)
         VALUES ?
         ON DUPLICATE KEY UPDATE
           score_given = VALUES(score_given),
           remarks = VALUES(remarks),
           scored_by = VALUES(scored_by),
           scored_at = CURRENT_TIMESTAMP,
           updated_at = CURRENT_TIMESTAMP`,
        [validScores]
      );
    }

    const { sectionScores, totalScore } = await recomputeTotals(applicationId, vacancyId);

    await ensureSession(vacancyId, userId);

    const io = req.app.get('socketio');
    if (io) {
      io.to(`vacancy:${vacancyId}`).emit('ca:score-updated', {
        applicationId,
        sectionScores,
        totalScore,
        scoredBy: userId
      });
    }

    res.json({ applicationId, sectionScores, totalScore });
  } catch (error) {
    console.error('bulkUpsertScores Error:', error);
    res.status(500).json({ message: error.message || 'Failed to save scores.' });
  }
};

const submitToHRMPSB = async (req, res) => {
  try {
    const { vacancyId } = req.params;
    const userId = req.user.id;

    const [applicants] = await db.query(
      `SELECT id, full_name FROM applications
       WHERE vacancy_id = ? AND status IN ('qualified','shortlisted','selected','appointed')`,
      [vacancyId]
    );
    if (applicants.length === 0) {
      return res.status(400).json({ message: 'No qualified applicants found for this vacancy.' });
    }

    const [criteria] = await db.query(
      `SELECT id FROM comparative_assessment_criteria WHERE vacancy_id = ?`,
      [vacancyId]
    );

    if (criteria.length === 0) {
      return res.status(400).json({ message: 'No assessment criteria configured for this vacancy.' });
    }

    const missing = [];
    for (const app of applicants) {
      const [scored] = await db.query(
        `SELECT criterion_id FROM comparative_assessment_scores
         WHERE applicant_id = ? AND criterion_id IN (${criteria.map(() => '?').join(',')})`,
        [app.id, ...criteria.map(c => c.id)]
      );
      const scoredIds = new Set(scored.map(s => s.criterion_id));
      const missingCriteria = criteria.filter(c => !scoredIds.has(c.id));
      if (missingCriteria.length > 0) {
        missing.push({
          applicationId: app.id,
          fullName: app.full_name,
          missingCriteriaCount: missingCriteria.length
        });
      }
    }

    if (missing.length > 0) {
      return res.status(409).json({
        message: 'Incomplete scoring. Some applicants are missing scores.',
        missing
      });
    }

    await db.query(
      `INSERT INTO ca_sessions (vacancy_id, status, submitted_by, submitted_at)
       VALUES (?, 'submitted', ?, NOW())
       ON DUPLICATE KEY UPDATE status='submitted', submitted_by=VALUES(submitted_by), submitted_at=NOW()`,
      [vacancyId, userId]
    );

    await db.query(
      'UPDATE vacancies SET current_stage = 7, assessment_submitted_at = CURRENT_TIMESTAMP WHERE id = ?',
      [vacancyId]
    );
    await syncApplicationsStage(vacancyId, 7, req.app.get('socketio'));

    for (const app of applicants) {
      await db.query(
        `INSERT INTO stage_history (application_id, stage_number, status, completed_at)
         VALUES (?, 6, 'completed', NOW())
         ON DUPLICATE KEY UPDATE status='completed', completed_at=NOW()`,
        [app.id]
      );
      await db.query('UPDATE applications SET current_stage = 6 WHERE id = ?', [app.id]);
    }

    await db.query(
      'INSERT INTO activity_log (vacancy_id, actor_id, action_description) VALUES (?, ?, ?)',
      [vacancyId, userId, 'Comparative Assessment submitted to HRMPSB.']
    );

    const io = req.app.get('socketio');
    if (io) {
      io.to(`vacancy:${vacancyId}`).emit('ca:submitted', { vacancyId });
      io.emit('rsp:dashboard:update');
      io.emit('notification:admin', {
        message: `Comparative Assessment submitted for vacancy ${vacancyId}`,
        type: 'rsp'
      });
    }

    res.json({ message: 'Assessment submitted successfully. Advancing to Results Posting.' });
  } catch (error) {
    console.error('submitToHRMPSB Error:', error);
    res.status(500).json({ message: error.message || 'Failed to submit assessment.' });
  }
};

const getExportCSV = async (req, res) => {
  try {
    const { vacancyId } = req.params;

    const [applicants] = await db.query(
      `SELECT a.id, a.full_name, a.ref_no AS applicant_code,
              IFNULL(r.total_score, 0) AS total_score,
              r.category_subscore_classroom, r.category_subscore_nonclassroom,
              r.category_subscore_document
       FROM applications a
       LEFT JOIN comparative_assessment_results r ON a.id = r.applicant_id
       WHERE a.vacancy_id = ? AND a.status IN ('qualified','shortlisted','selected','appointed')
       ORDER BY r.total_score DESC`,
      [vacancyId]
    );

    const [criteria] = await db.query(
      `SELECT id, sub_criterion_label, section_key, weight_percent, max_score
       FROM comparative_assessment_criteria
       WHERE vacancy_id = ?
       ORDER BY display_order ASC, id ASC`,
      [vacancyId]
    );

    const appIds = applicants.map(a => a.id);
    let allScores = [];
    if (appIds.length > 0) {
      const ph = appIds.map(() => '?').join(',');
      [allScores] = await db.query(
        `SELECT applicant_id, criterion_id, score_given
         FROM comparative_assessment_scores WHERE applicant_id IN (${ph})`,
        appIds
      );
    }
    const scoreLookup = {};
    allScores.forEach(s => {
      if (!scoreLookup[s.applicant_id]) scoreLookup[s.applicant_id] = {};
      scoreLookup[s.applicant_id][s.criterion_id] = s.score_given;
    });

    const header = ['Rank', 'Applicant', 'Code', ...criteria.map(c => c.sub_criterion_label), 'Total'];
    const rows = applicants.map((a, i) => {
      const scores = criteria.map(c => {
        const val = scoreLookup[a.id]?.[c.id];
        return val !== undefined ? Number(val).toFixed(2) : '';
      });
      return [i + 1, a.full_name, a.applicant_code, ...scores, Number(a.total_score).toFixed(2)];
    });

    const csv = [header, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="CA_Results_${vacancyId}.csv"`);
    res.send(csv);
  } catch (error) {
    console.error('getExportCSV Error:', error);
    res.status(500).json({ message: error.message || 'Failed to export.' });
  }
};

/* ─── PDF Export: Comparative Assessment Result (CAR) ─── */

const generateCARPdf = async (req, res) => {
  try {
    const { vacancyId } = req.params;

    /* ── 1. Fetch vacancy ── */
    const [vacancyRows] = await db.query(
      `SELECT id, position_type, position_title, item_number, salary_grade,
              ref_no, assessment_submitted_at
       FROM vacancies WHERE id = ?`,
      [vacancyId]
    );
    if (vacancyRows.length === 0) return res.status(404).json({ message: 'Vacancy not found.' });
    const v = vacancyRows[0];
    const isTeacherI = v.position_type === 'teaching';

    /* ── 2. Fetch applicants (ordered by rank) ── */
    const [applicants] = await db.query(
      `SELECT a.id, a.full_name, a.ref_no AS applicant_code,
              IFNULL(r.total_score, 0) AS total_score,
              RANK() OVER (ORDER BY IFNULL(r.total_score, 0) DESC) AS rank_val
       FROM applications a
       LEFT JOIN comparative_assessment_results r ON a.id = r.applicant_id
       WHERE a.vacancy_id = ? AND a.status IN ('qualified','shortlisted','selected','appointed')
       ORDER BY rank_val ASC`,
      [vacancyId]
    );

    /* ── 3. Fetch criteria (ordered by display_order) ── */
    const [criteria] = await db.query(
      `SELECT id, section_key, section_label, section_weight_percent,
              sub_criterion_label, weight_percent, max_score, display_order
       FROM comparative_assessment_criteria
       WHERE vacancy_id = ?
       ORDER BY display_order ASC, id ASC`,
      [vacancyId]
    );

    /* ── 4. Fetch all scores ── */
    const appIds = applicants.map(a => a.id);
    let allScores = [];
    if (appIds.length > 0) {
      const ph = appIds.map(() => '?').join(',');
      [allScores] = await db.query(
        `SELECT applicant_id, criterion_id, score_given
         FROM comparative_assessment_scores WHERE applicant_id IN (${ph})`,
        appIds
      );
    }
    const scoreLookup = {};
    allScores.forEach(s => {
      if (!scoreLookup[s.applicant_id]) scoreLookup[s.applicant_id] = {};
      scoreLookup[s.applicant_id][s.criterion_id] = Number(s.score_given);
    });

    /* ── 5. Build PDF ── */
    const PDFDocument = require('pdfkit');
    const doc = new PDFDocument({ margin: 36, size: 'LETTER', layout: 'landscape' });

    const safeTitle = (v.position_title || 'CAR').replace(/[^a-zA-Z0-9]/g, '_');
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition',
      `attachment; filename="CAR_${safeTitle}_${v.ref_no || vacancyId}.pdf"`);
    doc.pipe(res);

    // Layout constants
    const L   = 36;
    const R   = doc.page.width - 36;
    const W   = R - L;   // 720pt for landscape LETTER
    const SI  = 'Times-Italic';
    const SB  = 'Times-Bold';
    const SR  = 'Times-Roman';
    const BLACK    = '#000000';
    const NAVY     = '#1B3A6B';
    const HEADER_BG = '#E8EDF5';
    const cellPad   = 3;

    // ── DepEd Seal ──────────────────────────────────────────────────────
    const sealPath = path.join(__dirname, '../../assets/deped-seal.png');
    if (fs.existsSync(sealPath)) {
      const sealW = 72;
      const sealX = (doc.page.width - sealW) / 2;
      doc.image(sealPath, sealX, doc.y || 36, { width: sealW });
      doc.y = (doc.y || 36) + sealW + 4;
    }

    // ── LETTERHEAD (matches adviceController.js exactly) ────────────────
    doc.fillColor(BLACK);
    doc.font(SI).fontSize(12).text('Republic of the Philippines', L, doc.y, { width: W, align: 'center' });
    doc.moveDown(0.1);
    doc.font(SB).fontSize(16).text('Department of Education', L, doc.y, { width: W, align: 'center' });
    doc.moveDown(0.1);
    doc.font(SR).fontSize(10).text('REGION IX, ZAMBOANGA PENINSULA', L, doc.y, { width: W, align: 'center' });
    doc.moveDown(0.05);
    doc.font(SB).fontSize(10.5).text('SCHOOLS DIVISION OF DAPITAN CITY', L, doc.y, { width: W, align: 'center' });
    doc.moveDown(0.3);
    doc.moveTo(L, doc.y).lineTo(R, doc.y).lineWidth(1.5).stroke(NAVY);
    doc.moveDown(0.8);

    // ── TITLE ───────────────────────────────────────────────────────────
    doc.fillColor(BLACK);
    doc.font(SB).fontSize(13).text('COMPARATIVE ASSESSMENT RESULT (CAR)', L, doc.y, { width: W, align: 'center' });
    doc.moveDown(0.8);

    // ── HEADER FIELDS ───────────────────────────────────────────────────
    const delibDate = v.assessment_submitted_at
      ? new Date(v.assessment_submitted_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
      : '_______________';

    const hdrFields = [
      ['Position:',              v.position_title || '_______________'],
      ['Office/Bureau/Division/Unit:', 'Schools Division Office of Dapitan City'],
      ['Plantilla Item Number:', v.item_number || '_______________'],
      ['Date of Final Deliberation:', delibDate],
    ];

    const lblX = L;
    const valX = L + 180;
    let fy = doc.y;
    hdrFields.forEach(([lbl, val]) => {
      doc.font(SB).fontSize(9).fillColor(BLACK).text(lbl, lblX, fy, { width: 176, lineBreak: false });
      doc.font(SR).fontSize(9).text(String(val), valX, fy, { width: W - (valX - L), lineBreak: false });
      const valW = Math.max(doc.widthOfString(String(val)) + 8, 100);
      doc.moveTo(valX, fy + 11).lineTo(valX + valW, fy + 11).lineWidth(0.3).stroke('#999999');
      fy += 14;
    });
    doc.moveTo(L, fy + 2).lineTo(R, fy + 2).lineWidth(0.5).stroke('#cccccc');
    doc.y = fy + 10;

    // ── TABLE COLUMN DEFINITIONS ────────────────────────────────────────
    const criteriaHeaders = isTeacherI
      ? criteria.map(c => c.sub_criterion_label)
      : ['Education', 'Training', 'Experience', 'Performance',
         'Outstanding\nAccomplishment', 'Application\nof Education',
         'Application\nof L&D', 'Potential'];

    const fixedCols = [
      { label: 'Name of\nApplicant',           align: 'left'   },
      { label: 'Application/\nRanking No.',    align: 'center' },
    ];
    const tailCols = [
      { label: 'Total',  align: 'center' },
      { label: 'Rank',   align: 'center' },
      { label: 'Remarks', align: 'left'  },
      { label: 'Pre-Employment\nOrientation', align: 'center' },
    ];
    const allHeaders = [...fixedCols, ...criteriaHeaders.map(h => ({ label: h, align: 'center' })), ...tailCols];
    const numCols = allHeaders.length;

    // Compute column widths proportionally
    const fixedWidths = [90, 80];                                    // Name, App/Ranking
    const tailWidths  = [42, 36, 65, 80];                           // Total, Rank, Remarks, PEO
    const fixedTotal  = fixedWidths.reduce((s, w) => s + w, 0);     // 170
    const tailTotal   = tailWidths.reduce((s, w) => s + w, 0);      // 223
    const criteriaW   = W - fixedTotal - tailTotal;                  // 327
    const perCritW    = Math.floor(criteriaW / criteriaHeaders.length);

    const colWidths = [
      ...fixedWidths,
      ...criteriaHeaders.map(() => perCritW),
      ...tailWidths,
    ];
    // Adjust rounding remainder into the last tail column (Remarks)
    const usedW = colWidths.reduce((s, w) => s + w, 0);
    colWidths[colWidths.length - 2] += (W - usedW);

    // Build colX[] — left edge of each column
    const colX = [L];
    for (let i = 0; i < numCols - 1; i++) colX.push(colX[i] + colWidths[i]);

    // ── TABLE DRAWING HELPERS ───────────────────────────────────────────
    // Two-tier header: Tier 1 = merged labels, Tier 2 = individual criteria labels
    const tier1H      = 24;   // Top row height (merged "CRITERIA" cell)
    const tier2H      = 20;   // Bottom row height (individual criteria labels)
    const headerRowH  = tier1H + tier2H;  // 44pt total
    const minRowH     = 18;
    const bodyFontSz  = isTeacherI ? 7.5 : 8;
    const headerFontSz = isTeacherI ? 7 : 7.5;

    const criteriaLabel = isTeacherI
      ? 'CRITERIA (DO 007 Enclosure No. 2)'
      : 'CRITERIA (DO 007, s. 2023)';
    const criteriaStartCol = 2;
    const criteriaEndCol   = 2 + criteriaHeaders.length; // exclusive

    const drawTableBorder = (topY, totalH) => {
      doc.save();
      doc.lineWidth(1).strokeColor(BLACK);
      doc.rect(L, topY, W, totalH).stroke();
      doc.restore();
    };

    const drawTwoTierHeader = (topY) => {
      // 1. Full background
      doc.save();
      doc.rect(L, topY, W, headerRowH).fill(HEADER_BG);
      doc.restore();

      // 2. Grid lines — horizontal tier divider (criteria columns only)
      doc.save();
      doc.moveTo(colX[criteriaStartCol], topY + tier1H)
         .lineTo(colX[criteriaEndCol],    topY + tier1H)
         .lineWidth(0.5).strokeColor('#888888').stroke();
      doc.restore();

      // Header bottom line (full width, thicker)
      doc.save();
      doc.moveTo(L, topY + headerRowH).lineTo(R, topY + headerRowH)
         .lineWidth(1).strokeColor(BLACK).stroke();
      doc.restore();

      // Vertical lines — full height for fixed/tail boundaries
      [criteriaStartCol, criteriaEndCol].forEach(i => {
        if (i <= numCols) {
          doc.save();
          doc.moveTo(colX[i], topY).lineTo(colX[i], topY + headerRowH)
             .lineWidth(0.5).strokeColor('#888888').stroke();
          doc.restore();
        }
      });

      // Vertical lines — tier 2 only for individual criteria boundaries
      for (let i = criteriaStartCol + 1; i < criteriaEndCol; i++) {
        doc.save();
        doc.moveTo(colX[i], topY + tier1H).lineTo(colX[i], topY + headerRowH)
           .lineWidth(0.4).strokeColor('#888888').stroke();
        doc.restore();
      }

      // Vertical lines — full height for remaining tail boundaries
      for (let i = criteriaEndCol + 1; i < numCols; i++) {
        doc.save();
        doc.moveTo(colX[i], topY).lineTo(colX[i], topY + headerRowH)
           .lineWidth(0.4).strokeColor('#888888').stroke();
        doc.restore();
      }

      // 3. Cover criteria section in tier 1 so vertical lines don't cut through merged cell
      doc.save();
      doc.rect(colX[criteriaStartCol], topY,
               colX[criteriaEndCol] - colX[criteriaStartCol], tier1H)
         .fill(HEADER_BG);
      doc.restore();

      // 4. Tier 1 text — fixed columns (rowspan 2, vertically centred)
      doc.save();
      doc.font('Helvetica-Bold').fontSize(headerFontSz).fillColor(BLACK);

      const vMidY = topY + (headerRowH / 2) - 4;   // approx centre for 2-line label
      doc.text('Name of\nApplicant', colX[0] + cellPad, vMidY,
        { width: colWidths[0] - cellPad * 2, align: 'left', lineGap: 0 });
      doc.text('Application/\nRanking No.', colX[1] + cellPad, vMidY,
        { width: colWidths[1] - cellPad * 2, align: 'center', lineGap: 0 });

      // Merged CRITERIA cell (tier 1, spans all criteria columns)
      const mergedW = colX[criteriaEndCol] - colX[criteriaStartCol];
      doc.text(criteriaLabel, colX[criteriaStartCol] + cellPad, topY + 7,
        { width: mergedW - cellPad * 2, align: 'center', lineGap: 0 });

      // Tail columns (rowspan 2, vertically centred)
      const t = criteriaEndCol;  // first tail column index
      doc.text('Total', colX[t] + cellPad, vMidY,
        { width: colWidths[t] - cellPad * 2, align: 'center', lineGap: 0 });
      doc.text('Rank', colX[t + 1] + cellPad, vMidY,
        { width: colWidths[t + 1] - cellPad * 2, align: 'center', lineGap: 0 });
      doc.text('Remarks', colX[t + 2] + cellPad, vMidY,
        { width: colWidths[t + 2] - cellPad * 2, align: 'left', lineGap: 0 });
      doc.text('Pre-Employment\nOrientation', colX[t + 3] + cellPad, vMidY,
        { width: colWidths[t + 3] - cellPad * 2, align: 'center', lineGap: 0 });

      doc.restore();

      // 5. Tier 2 text — individual criteria labels
      doc.save();
      doc.font('Helvetica-Bold').fontSize(headerFontSz - 0.5).fillColor(BLACK);
      criteriaHeaders.forEach((label, i) => {
        doc.text(label, colX[criteriaStartCol + i] + cellPad, topY + tier1H + 4,
          { width: colWidths[criteriaStartCol + i] - cellPad * 2, align: 'center', lineGap: 0 });
      });
      doc.restore();
    };

    const drawVLines = (topY, totalH) => {
      for (let i = 1; i < numCols; i++) {
        doc.save();
        doc.moveTo(colX[i], topY).lineTo(colX[i], topY + totalH)
          .lineWidth(0.4).strokeColor('#888888').stroke();
        doc.restore();
      }
    };

    const drawRowLine = (y) => {
      doc.save();
      doc.moveTo(L, y).lineTo(R, y).lineWidth(0.4).strokeColor('#888888').stroke();
      doc.restore();
    };

    const measureRowHeight = (cells) => {
      doc.font('Helvetica').fontSize(bodyFontSz);
      let maxH = minRowH;
      cells.forEach((txt, i) => {
        const h = doc.heightOfString(String(txt || '—'), { width: colWidths[i] - cellPad * 2 });
        if (h + cellPad * 2 > maxH) maxH = h + cellPad * 2;
      });
      return Math.ceil(maxH);
    };

    const drawRow = (cells, y, rowH, opts = {}) => {
      const cellY = y + cellPad;
      doc.save();
      doc.font('Helvetica').fontSize(bodyFontSz).fillColor(BLACK);
      cells.forEach((txt, i) => {
        const fontFn = opts.bold ? 'Helvetica-Bold' : 'Helvetica';
        doc.font(fontFn).fontSize(bodyFontSz);
        const align = i < 2 ? 'left' : (allHeaders[i]?.align === 'center' ? 'center' : 'left');
        doc.text(String(txt ?? '—'), colX[i] + cellPad, cellY,
          { width: colWidths[i] - cellPad * 2, align, lineGap: 0 });
      });
      doc.restore();
    };

    // ── DRAW TABLE HEADER ───────────────────────────────────────────────
    let tableTop = doc.y;
    drawTableBorder(tableTop, headerRowH);
    drawTwoTierHeader(tableTop);
    doc.y = tableTop + headerRowH;

    // ── DRAW BODY ROWS ──────────────────────────────────────────────────
    const pageBottom = doc.page.height - 36;
    let rowIdx = 0;

    const renderApplicantRow = (app) => {
      const scoreMap = scoreLookup[app.id] || {};
      const cells = [
        app.full_name || '—',
        app.applicant_code || '—',
      ];

      if (isTeacherI) {
        criteria.forEach(c => {
          const s = scoreMap[c.id];
          cells.push(s !== undefined ? Number(s).toFixed(2) : '—');
        });
      } else {
        // Non-teaching: map criteria_key → column position
        const keyOrder = [
          'education', 'training', 'experience', 'performance',
          'outstanding_accomplishments', 'application_of_education',
          'application_of_ld', 'potential'
        ];
        const keyedScores = {};
        criteria.forEach(c => { keyedScores[c.sub_criterion_label] = scoreMap[c.id]; });
        // Match by sub_criterion_label against CRITERION_LABELS values
        const CRITERION_LABELS = {
          education: 'Education', training: 'Training', experience: 'Experience',
          performance: 'Performance', outstanding_accomplishments: 'Outstanding Accomplishments',
          application_of_education: 'Application of Education',
          application_of_ld: 'Application of L&D', potential: 'Potential (Written Test, BEI, Work Sample Test)'
        };
        // Build a lookup: criteria_key → score
        const keyScoreMap = {};
        criteria.forEach(c => {
          // Find which key matches this label
          for (const [k, lbl] of Object.entries(CRITERION_LABELS)) {
            if (c.sub_criterion_label === lbl || c.sub_criterion_label === CRITERION_LABELS[k]) {
              keyScoreMap[k] = scoreMap[c.id];
            }
          }
        });
        // Also try matching by criteria_key if the criteria row has it stored in sub_criterion_label
        criteria.forEach(c => {
          const lbl = (c.sub_criterion_label || '').toLowerCase();
          if (lbl === 'education')           keyScoreMap.education = scoreMap[c.id];
          if (lbl === 'training')            keyScoreMap.training = scoreMap[c.id];
          if (lbl === 'experience')          keyScoreMap.experience = scoreMap[c.id];
          if (lbl === 'performance')         keyScoreMap.performance = scoreMap[c.id];
          if (lbl.startsWith('outstanding')) keyScoreMap.outstanding_accomplishments = scoreMap[c.id];
          if (lbl.startsWith('application of education')) keyScoreMap.application_of_education = scoreMap[c.id];
          if (lbl.startsWith('application of l'))         keyScoreMap.application_of_ld = scoreMap[c.id];
          if (lbl.startsWith('potential'))   keyScoreMap.potential = scoreMap[c.id];
        });

        keyOrder.forEach(k => {
          const s = keyScoreMap[k];
          cells.push(s !== undefined ? Number(s).toFixed(2) : '—');
        });
      }

      // Tail columns
      cells.push(Number(app.total_score || 0).toFixed(2));   // Total
      cells.push(String(app.rank_val || rowIdx + 1));        // Rank
      cells.push('');                                         // Remarks (blank)
      cells.push('');                                         // Pre-Employment Orientation (blank)

      const rowH = measureRowHeight(cells);

      // Page break check
      if (doc.y + rowH > pageBottom) {
        doc.addPage({ size: 'LETTER', layout: 'landscape', margin: 36 });
        doc.y = 36;
        // Redraw two-tier header on new page
        const newTop = doc.y;
        drawTableBorder(newTop, headerRowH);
        drawTwoTierHeader(newTop);
        doc.y = newTop + headerRowH;
      }

      const rowY = doc.y;

      // Zebra stripe
      if (rowIdx % 2 === 0) {
        doc.save();
        doc.rect(L, rowY, W, rowH).fill('#F8FAFC');
        doc.restore();
      }

      drawRow(cells, rowY, rowH);
      drawVLines(rowY, rowH);
      drawRowLine(rowY + rowH);

      doc.y = rowY + rowH;
      rowIdx++;
    };

    // Draw section sub-header for Teacher I
    if (isTeacherI) {
      const sections = [];
      let curKey = null;
      criteria.forEach(c => {
        if (c.section_key !== curKey) {
          curKey = c.section_key;
          sections.push({ key: c.section_key, label: c.section_label, weight: c.section_weight_percent });
        }
      });

      // We'll draw section sub-header rows before each section's first criterion
      let lastSectionKey = null;
      let appIdx = 0;

      // For each applicant, we render all criteria in one row.
      // Instead of section sub-headers interleaved, group criteria by section for the header row.
      // The criteria are already in order (A then B then C).
      // We add section sub-header rows before each section group.
      let sectionHeaderDrawn = {};

      // Render all applicant rows — section headers are embedded in the criteria column headers
      // Since all criteria are in a single row per applicant, we don't need interleaved section headers.
      // Instead, add a section group indicator row above the first applicant.
      // Actually, the simplest approach: just render applicants. The section grouping is in the column headers.
      applicants.forEach(app => renderApplicantRow(app));
    } else {
      applicants.forEach(app => renderApplicantRow(app));
    }

    // ── TOTAL ROW ───────────────────────────────────────────────────────
    if (applicants.length > 0) {
      const totalRowCells = ['', '', ...criteriaHeaders.map(() => ''), '', '', '', ''];
      const rowH = measureRowHeight(['']);
      const rowY = doc.y;
      doc.save();
      doc.rect(L, rowY, W, rowH).fill('#E8EDF5');
      doc.restore();
      doc.save();
      doc.font('Helvetica-Bold').fontSize(bodyFontSz).fillColor(BLACK);
      doc.text('TOTAL', colX[0] + cellPad, rowY + cellPad,
        { width: colX[2] - colX[0] - cellPad, align: 'left' });
      doc.restore();
      drawVLines(rowY, rowH);
      drawRowLine(rowY + rowH);
      doc.y = rowY + rowH;
    }

    // ── SIGNATORIES ─────────────────────────────────────────────────────
    // Use doc.y as the true cursor position after the last table row.
    // Add a fixed gap, then check if the full signature block fits.
    const SIG_GAP     = 50;   // pt gap between table bottom and first signature line
    const SIG_BLOCK_H = 70;   // estimated height of the 3-line signature block

    doc.y += SIG_GAP;

    if (doc.y + SIG_BLOCK_H > pageBottom) {
      doc.addPage({ size: 'LETTER', layout: 'landscape', margin: 36 });
      doc.y = 60;
    }

    const sigY = doc.y;
    doc.moveTo(L, sigY).lineTo(L + 200, sigY).stroke(BLACK);
    doc.font(SB).fontSize(8).fillColor(BLACK).text('HRMPSB Chairperson', L, sigY + 4, { width: 200, align: 'center' });
    doc.font(SR).fontSize(8).text('Printed Name & Signature', L, sigY + 14, { width: 200, align: 'center' });

    const midX = L + W / 2 - 100;
    doc.moveTo(midX, sigY).lineTo(midX + 200, sigY).stroke(BLACK);
    doc.font(SB).fontSize(8).text('SDS / Schools Division Superintendent', midX, sigY + 4, { width: 200, align: 'center' });
    doc.font(SR).fontSize(8).text('Printed Name & Signature', midX, sigY + 14, { width: 200, align: 'center' });

    const rgtX = R - 200;
    doc.moveTo(rgtX, sigY).lineTo(rgtX + 200, sigY).stroke(BLACK);
    doc.font(SB).fontSize(8).text('HRMPSB Secretary', rgtX, sigY + 4, { width: 200, align: 'center' });
    doc.font(SR).fontSize(8).text('Printed Name & Signature', rgtX, sigY + 14, { width: 200, align: 'center' });

    doc.moveDown(2);
    doc.font(SR).fontSize(7).fillColor('#666666')
      .text('Date Printed: ___________________', L, doc.y, { width: W, align: 'left' });

    doc.end();
  } catch (error) {
    console.error('generateCARPdf Error:', error);
    res.status(500).json({ message: error.message || 'Failed to generate CAR PDF.' });
  }
};

module.exports = {
  getWorkspace,
  bulkUpsertScores,
  submitToHRMPSB,
  getExportCSV,
  generateCARPdf,
  _ensureSession: ensureSession,
  _recomputeTotals: recomputeTotals
};
