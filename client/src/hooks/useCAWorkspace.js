import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { io } from 'socket.io-client';
import { API_BASE, downloadFile } from '../utils/api';

const API = API_BASE;

const debounce = (fn, ms) => {
  let timer;
  const debounced = (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
  debounced.cancel = () => clearTimeout(timer);
  return debounced;
};

export const useCAWorkspace = (vacancyId) => {
  const [workspace, setWorkspace] = useState(null);
  const [scoresMap, setScoresMap] = useState({});
  const [remarksMap, setRemarksMap] = useState({});
  const [rankings, setRankings] = useState([]);
  const [selectedApplicantId, setSelectedApplicantId] = useState(null);
  const [activeSection, setActiveSection] = useState('A');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const socketRef = useRef(null);
  // Keyed by applicantId -> { [criterionId]: number }
  const localEditsRef = useRef({});
  // Keyed by applicantId -> { [criterionId]: string }
  const localRemarksRef = useRef({});

  const token = () => localStorage.getItem('token');
  const authHeaders = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` });

  /* ─── Fetch workspace data ─── */
  const fetchWorkspace = useCallback(async (silent = false) => {
    if (!vacancyId) return;
    if (!silent) setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API}/api/rsp/ca-workspace/${vacancyId}`, { headers: authHeaders() });
      if (!res.ok) throw new Error((await res.json()).message || 'Failed to load workspace');
      const data = await res.json();
      setWorkspace(data);
      setRankings(data.rankings || []);
      setScoresMap(data.scoresMap || {});
      setRemarksMap(data.remarksMap || {});
      if (data.applicants?.length > 0) {
        setSelectedApplicantId(prev =>
          prev && data.applicants.find(a => a.id === prev) ? prev : data.applicants[0].id
        );
      }
      // Set active section to first section key from the rubric
      if (data.sectionsMeta && data.sectionsMeta.length > 0) {
        setActiveSection(data.sectionsMeta[0].key);
      }
      localEditsRef.current = {};
    } catch (e) {
      console.error('fetchWorkspace error:', e);
      setError(e.message);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [vacancyId]);

  useEffect(() => { fetchWorkspace(); }, [fetchWorkspace]);

  /* ─── Socket.IO live updates ─── */
  useEffect(() => {
    if (!vacancyId) return;
    const socket = io(API);
    socketRef.current = socket;
    socket.emit('join-ca-room', `vacancy:${vacancyId}`);

    socket.on('ca:score-updated', (payload) => {
      if (payload.scoredBy && payload.applicationId === selectedApplicantId) return;
      fetchWorkspace(true);
    });
    socket.on('ca:submitted', () => fetchWorkspace(true));

    return () => {
      socket.emit('leave-ca-room', `vacancy:${vacancyId}`);
      socket.disconnect();
    };
  }, [vacancyId, fetchWorkspace, selectedApplicantId]);

  /* ─── Per-applicant local edits (preserved across tab switches) ─── */
  const getAppEdits = useCallback((appId) => {
    return localEditsRef.current[appId] || {};
  }, []);

  const getScore = useCallback((criterionId) => {
    const appEdits = localEditsRef.current[selectedApplicantId] || {};
    if (appEdits[criterionId] !== undefined) return appEdits[criterionId];
    return scoresMap[selectedApplicantId]?.[criterionId] ?? 0;
  }, [scoresMap, selectedApplicantId]);

  const updateLocalScore = useCallback((criterionId, value) => {
    const appId = selectedApplicantId;
    if (!appId) return;
    const prev = localEditsRef.current[appId] || {};
    localEditsRef.current = {
      ...localEditsRef.current,
      [appId]: { ...prev, [criterionId]: value }
    };
  }, [selectedApplicantId]);

  const getRemarks = useCallback((criterionId) => {
    const appEdits = localRemarksRef.current[selectedApplicantId] || {};
    if (appEdits[criterionId] !== undefined) return appEdits[criterionId];
    return remarksMap[selectedApplicantId]?.[criterionId] ?? '';
  }, [remarksMap, selectedApplicantId]);

  const updateLocalRemarks = useCallback((criterionId, value) => {
    const appId = selectedApplicantId;
    if (!appId) return;
    const prev = localRemarksRef.current[appId] || {};
    localRemarksRef.current = {
      ...localRemarksRef.current,
      [appId]: { ...prev, [criterionId]: value }
    };
  }, [selectedApplicantId]);

  /* ─── Commit changed scores to server ─── */
  const commitScoresToServer = useCallback(async () => {
    if (!selectedApplicantId || !vacancyId) return;
    const appEdits = localEditsRef.current[selectedApplicantId] || {};
    const serverScores = scoresMap[selectedApplicantId] || {};
    const appRemarksEdits = localRemarksRef.current[selectedApplicantId] || {};
    const serverRemarks = remarksMap[selectedApplicantId] || {};

    const changedCriteria = [];
    for (const [cid, val] of Object.entries(appEdits)) {
      const serverVal = serverScores[Number(cid)];
      const remarks = appRemarksEdits[Number(cid)];
      const serverRemarksVal = serverRemarks[Number(cid)];
      const remarksChanged = remarks !== undefined && remarks !== serverRemarksVal;
      if (serverVal === undefined || Number(val) !== Number(serverVal) || remarksChanged) {
        changedCriteria.push({
          criterionId: Number(cid),
          score: Number(val),
          remarks: remarks !== undefined ? remarks : (serverRemarksVal || null)
        });
      }
    }
    if (changedCriteria.length === 0) return;

    setSaving(true);
    try {
      const res = await fetch(`${API}/api/rsp/ca-workspace/${vacancyId}/scores`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({ applicationId: selectedApplicantId, scores: changedCriteria })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Save failed');

      // Merge saved scores into scoresMap
      setScoresMap(prev => ({
        ...prev,
        [selectedApplicantId]: {
          ...prev[selectedApplicantId],
          ...Object.fromEntries(changedCriteria.map(s => [s.criterionId, s.score]))
        }
      }));

      // Merge saved remarks into remarksMap
      const remarksUpdates = changedCriteria.filter(s => s.remarks != null);
      if (remarksUpdates.length > 0) {
        setRemarksMap(prev => ({
          ...prev,
          [selectedApplicantId]: {
            ...prev[selectedApplicantId],
            ...Object.fromEntries(remarksUpdates.map(s => [s.criterionId, s.remarks]))
          }
        }));
      }

      // Update rankings for this applicant
      setRankings(prev => {
        const updated = prev.map(r =>
          r.id === selectedApplicantId
            ? {
                ...r,
                total_score: data.totalScore,
                category_subscore_classroom: data.sectionScores.A ?? data.sectionScores[Object.keys(data.sectionScores)[0]] ?? null,
                category_subscore_nonclassroom: data.sectionScores.B ?? data.sectionScores[Object.keys(data.sectionScores)[1]] ?? null,
                category_subscore_document: data.sectionScores.C ?? data.sectionScores[Object.keys(data.sectionScores)[2]] ?? null
              }
            : r
        );
        return updated.sort((a, b) => Number(b.total_score || 0) - Number(a.total_score || 0));
      });

      // Clear only the committed applicant's local edits
      const { [selectedApplicantId]: _, ...rest } = localEditsRef.current;
      localEditsRef.current = rest;
      const { [selectedApplicantId]: __, ...restRemarks } = localRemarksRef.current;
      localRemarksRef.current = restRemarks;
      setError(null);
    } catch (e) {
      console.error('commitScoresToServer error:', e);
      setError(e.message || 'Failed to save scores');
    } finally {
      setSaving(false);
    }
  }, [selectedApplicantId, vacancyId, scoresMap, remarksMap]);

  const debouncedSave = useMemo(
    () => debounce(commitScoresToServer, 800),
    [commitScoresToServer]
  );

  /* ─── Public handlers ─── */
  const handleScoreChange = useCallback((criterionId, value) => {
    updateLocalScore(criterionId, value);
    debouncedSave();
  }, [updateLocalScore, debouncedSave]);

  const handleScoreBlur = useCallback((criterionId, value) => {
    updateLocalScore(criterionId, value);
    debouncedSave.cancel();
    commitScoresToServer();
  }, [updateLocalScore, commitScoresToServer]);

  const handleRemarksChange = useCallback((criterionId, value) => {
    updateLocalRemarks(criterionId, value);
    debouncedSave();
  }, [updateLocalRemarks, debouncedSave]);

  const handleRemarksBlur = useCallback((criterionId, value) => {
    updateLocalRemarks(criterionId, value);
    debouncedSave.cancel();
    commitScoresToServer();
  }, [updateLocalRemarks, commitScoresToServer]);

  const handleSelectApplicant = useCallback(async (newApplicantId) => {
    if (newApplicantId === selectedApplicantId) return;
    debouncedSave.cancel();
    await commitScoresToServer();
    setSelectedApplicantId(newApplicantId);
  }, [selectedApplicantId, debouncedSave, commitScoresToServer]);

  const handleSaveDraft = useCallback(async () => {
    debouncedSave.cancel();
    await commitScoresToServer();
    await fetchWorkspace(true);
  }, [debouncedSave, commitScoresToServer, fetchWorkspace]);

  const handleSubmit = useCallback(async () => {
    if (!vacancyId) return { success: false, message: 'No vacancy.' };
    setSubmitting(true);
    try {
      const res = await fetch(`${API}/api/rsp/ca-workspace/${vacancyId}/submit`, {
        method: 'POST',
        headers: authHeaders()
      });
      const data = await res.json();
      if (!res.ok) return { success: false, message: data.message || 'Submit failed', missing: data.missing };
      await fetchWorkspace(true);
      return { success: true, message: data.message };
    } catch (e) {
      return { success: false, message: 'Network error.' };
    } finally {
      setSubmitting(false);
    }
  }, [vacancyId, fetchWorkspace]);

  const handleExport = useCallback(async () => {
    if (!vacancyId) return;
    await downloadFile(`/api/rsp/ca-workspace/${vacancyId}/export`, 'ca_workspace_export.csv');
  }, [vacancyId]);

  /* ─── Derived: section scores + total ─── */
  const sectionScores = useMemo(() => {
    const appScores = scoresMap[selectedApplicantId] || {};
    const appEdits = localEditsRef.current[selectedApplicantId] || {};
    const result = {};
    if (!workspace?.criteria) return result;

    // Initialize all section keys from sectionsMeta
    const sm = workspace.sectionsMeta || [];
    sm.forEach(s => { result[s.key] = 0; });

    workspace.criteria.forEach(c => {
      const val = appEdits[c.id] !== undefined ? appEdits[c.id] : (appScores[c.id] ?? 0);
      const max = Number(c.max_score);
      if (max > 0) {
        const weighted = (Number(val) / max) * Number(c.weight_percent);
        const key = c.section_key || '_unsectioned';
        result[key] = (result[key] || 0) + weighted;
      }
    });
    return result;
  }, [scoresMap, selectedApplicantId, workspace, activeSection]);

  const totalScore = useMemo(() => {
    return Object.values(sectionScores).reduce((sum, v) => sum + (Number(v) || 0), 0);
  }, [sectionScores]);

  const isComplete = useMemo(() => {
    if (!workspace?.applicants || !workspace?.criteria) return false;
    return workspace.applicants.every(app => {
      const appScores = scoresMap[app.id] || {};
      return workspace.criteria.every(c => {
        const val = appScores[c.id];
        return val !== undefined && val !== null;
      });
    });
  }, [workspace, scoresMap]);

  const currentTimestamp = useMemo(() => {
    return new Date().toLocaleString('en-PH', {
      hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true
    });
  }, [totalScore]);

  return {
    workspace, rankings, scoresMap, remarksMap,
    selectedApplicantId, setSelectedApplicantId: handleSelectApplicant,
    activeSection, setActiveSection,
    sectionScores, totalScore, isComplete,
    loading, saving, submitting, error,
    getScore, getRemarks, handleScoreChange, handleScoreBlur,
    handleRemarksChange, handleRemarksBlur,
    handleSaveDraft, handleSubmit, handleExport,
    currentTimestamp,
    refresh: fetchWorkspace
  };
};
