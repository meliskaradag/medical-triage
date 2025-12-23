import { useEffect, useMemo, useState } from 'react';
import DiseaseCard from '../components/DiseaseCard';
import SeverityGauge from '../components/SeverityGauge';
import SymptomInput from '../components/SymptomInput';
import TimelinePanel from '../components/TimelinePanel';
import MiniSparkline from '../components/MiniSparkline';
import {
  PredictionResult,
  PrivacySummary,
  TimelineEntry,
  UserProfile,
  clearTimeline,
  createTimelineEntry,
  deleteTimelineEntry,
  fetchPrivacySummary,
  fetchSymptoms,
  fetchTimeline,
  login,
  requestPrediction,
  setAuthToken,
  signup,
} from '../services/api';

const AUTH_TOKEN_KEY = 'triage_auth_token';
const AUTH_USER_KEY = 'triage_user_profile';

const Home = () => {
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [symptomOptions, setSymptomOptions] = useState<string[]>([]);
  const [results, setResults] = useState<PredictionResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [normalizedSymptoms, setNormalizedSymptoms] = useState<string[]>([]);
  const [unmappedSymptoms, setUnmappedSymptoms] = useState<string[]>([]);
  const [timelineEntries, setTimelineEntries] = useState<TimelineEntry[]>([]);
  const [privacySummary, setPrivacySummary] = useState<PrivacySummary | null>(null);
  const [timelineNote, setTimelineNote] = useState('');
  const [isSavingTimeline, setIsSavingTimeline] = useState(false);
  const [timelineError, setTimelineError] = useState<string | null>(null);
  const [isTimelineLoading, setIsTimelineLoading] = useState(false);
  const [symptomDetails, setSymptomDetails] = useState<Record<string, { severity: number }>>({});
  const [redFlags, setRedFlags] = useState<string[]>([]);
  const [followUpQuestions, setFollowUpQuestions] = useState<string[]>([]);
  const [trackerNote, setTrackerNote] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authName, setAuthName] = useState('');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('signup');
  const [authError, setAuthError] = useState<string | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [activeView, setActiveView] = useState<'predict' | 'tracker' | 'history'>('predict');
  const trackerSymptoms = useMemo(
    () => (selectedSymptoms.length > 0 ? selectedSymptoms : Object.keys(symptomDetails)),
    [selectedSymptoms, symptomDetails],
  );

  const trackerSuggestions = useMemo(
    () =>
      symptomOptions
        .filter((symptom) => !trackerSymptoms.includes(symptom))
        .slice(0, 8),
    [symptomOptions, trackerSymptoms],
  );

  const refreshTimeline = async () => {
    if (!isAuthenticated) return;
    setIsTimelineLoading(true);
    setTimelineError(null);
    try {
      const [entries, summary] = await Promise.all([fetchTimeline(), fetchPrivacySummary()]);
      setTimelineEntries(entries);
      setPrivacySummary(summary);
    } catch (err: any) {
      console.error(err);
      if (err?.response?.status === 401) {
        setTimelineError('Session expired. Please sign in again.');
        handleSignOut();
        setShowAuthModal(true);
      } else {
        setTimelineError('Timeline could not be loaded.');
      }
    } finally {
      setIsTimelineLoading(false);
    }
  };

  useEffect(() => {
    const loadSymptoms = async () => {
      try {
        const fetched = await fetchSymptoms();
        setSymptomOptions(fetched);
      } catch (err) {
        console.error(err);
        setError('Unable to load symptom vocabulary.');
      }
    };
    loadSymptoms();
  }, []);

  useEffect(() => {
    const storedToken = localStorage.getItem(AUTH_TOKEN_KEY);
    const storedUser = localStorage.getItem(AUTH_USER_KEY);
    if (storedToken) {
      setAuthToken(storedToken);
      setIsAuthenticated(true);
      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          setUserProfile(parsedUser);
          setAuthName(parsedUser?.name ?? '');
          setAuthEmail(parsedUser?.email ?? '');
        } catch (err) {
          console.error('Could not parse stored user profile', err);
        }
      }
      refreshTimeline();
    }
  }, []);

  const handleAuthSubmit = async () => {
    setAuthError(null);
    setTimelineError(null);
    if (authMode === 'signup' && !authName.trim()) {
      setAuthError('Add your name to sign up.');
      return;
    }
    if (!authEmail.trim() || !authPassword.trim()) {
      setAuthError('Email and password are required.');
      return;
    }
    setIsAuthLoading(true);
    try {
      const response =
        authMode === 'signup'
          ? await signup({ name: authName.trim(), email: authEmail.trim(), password: authPassword })
          : await login({ email: authEmail.trim(), password: authPassword });
      const { token, user } = response;
      setAuthToken(token);
      localStorage.setItem(AUTH_TOKEN_KEY, token);
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
      setIsAuthenticated(true);
      setAuthName(user.name);
      setAuthEmail(user.email);
      setUserProfile(user);
      setShowAuthModal(false);
      setAuthPassword('');
      setAuthError(null);
      refreshTimeline();
    } catch (err: any) {
      const detail = err?.response?.data?.detail ?? 'Authentication failed.';
      setAuthError(detail);
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleSignOut = () => {
    setAuthToken(undefined);
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(AUTH_USER_KEY);
    localStorage.removeItem('triage_user_name');
    localStorage.removeItem('triage_user_email');
    setIsAuthenticated(false);
    setUserProfile(null);
    setTimelineEntries([]);
    setPrivacySummary(null);
    setAuthPassword('');
    setAuthError(null);
  };

  const addSymptom = (symptom: string) => {
    setSelectedSymptoms((prev) => {
      if (prev.includes(symptom)) return prev;
      setSymptomDetails((details) => ({
        ...details,
        [symptom]: details[symptom] ?? { severity: 5 },
      }));
      return [...prev, symptom];
    });
  };

  const removeSymptom = (symptom: string) => {
    setSelectedSymptoms((prev) => prev.filter((item) => item !== symptom));
    setSymptomDetails((details) => {
      const next = { ...details };
      delete next[symptom];
      return next;
    });
  };

  const handleSubmit = async () => {
    if (selectedSymptoms.length === 0) {
      setError('Please add at least one symptom.');
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const symptomDetailsPayload = selectedSymptoms.map((symptom) => {
        const meta = symptomDetails[symptom];
        return {
          name: symptom,
          severity: typeof meta?.severity === 'number' ? meta.severity : undefined,
        };
      });
      const response = await requestPrediction({
        symptoms: selectedSymptoms,
        symptom_details: symptomDetailsPayload,
      });
      setResults(response.results);
      setNormalizedSymptoms(response.normalized_symptoms ?? []);
      setUnmappedSymptoms(response.unmapped_symptoms ?? []);
      setRedFlags(response.red_flags ?? []);
      setFollowUpQuestions(response.follow_up_questions ?? []);
    } catch (err: any) {
      const detail = err?.response?.data?.detail ?? 'Prediction request failed.';
      setError(detail);
      setResults([]);
      setNormalizedSymptoms([]);
      setUnmappedSymptoms([]);
      setRedFlags([]);
      setFollowUpQuestions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveToTimeline = async () => {
    if (!isAuthenticated) {
      setTimelineError('Sign in or sign up to save cases to timeline.');
      setShowAuthModal(true);
      return;
    }
    const symptomsToSave = (normalizedSymptoms.length > 0 ? normalizedSymptoms : selectedSymptoms).filter(Boolean);
    if (symptomsToSave.length === 0) {
      setTimelineError('Add symptoms and run a prediction before saving.');
      return;
    }
    if (results.length === 0) {
      setTimelineError('Run a prediction before saving to timeline.');
      return;
    }
    setIsSavingTimeline(true);
    setTimelineError(null);
    try {
      const payload = {
        symptoms: symptomsToSave,
        notes: timelineNote.trim() || undefined,
        top_prediction: results[0]?.disease,
        triage_level: results[0]?.triage_level,
        severity_score: results[0]?.severity_score ?? undefined,
        symptom_severity: Object.fromEntries(
          Object.entries(symptomDetails).map(([name, meta]) => [name, meta.severity ?? 0]),
        ),
        entry_type: 'case' as const,
      };
      const created = await createTimelineEntry(payload);
      setTimelineEntries((prev) => [created, ...prev]);
      setTimelineNote('');
      const summary = await fetchPrivacySummary();
      setPrivacySummary(summary);
    } catch (err) {
      console.error(err);
      setTimelineError('Case could not be saved.');
    } finally {
      setIsSavingTimeline(false);
    }
  };

  const handleDeleteEntry = async (entryId: string) => {
    if (!isAuthenticated) {
      setShowAuthModal(true);
      setTimelineError('Sign in or sign up to manage timeline entries.');
      return;
    }
    try {
      await deleteTimelineEntry(entryId);
      setTimelineEntries((prev) => prev.filter((entry) => entry.id !== entryId));
      const summary = await fetchPrivacySummary();
      setPrivacySummary(summary);
    } catch (err) {
      console.error(err);
      setTimelineError('Entry could not be removed.');
    }
  };

  const handleClearTimeline = async () => {
    if (!isAuthenticated) {
      setShowAuthModal(true);
      setTimelineError('Sign in or sign up to manage timeline entries.');
      return;
    }
    try {
      await clearTimeline();
      setTimelineEntries([]);
      const summary = await fetchPrivacySummary();
      setPrivacySummary(summary);
    } catch (err) {
      console.error(err);
      setTimelineError('Timeline could not be cleared.');
    }
  };


  const severityScore = useMemo(() => (results.length > 0 ? results[0].severity_score : 0), [results]);
  const hasSymptoms = selectedSymptoms.length > 0;
  const hasResults = results.length > 0;
  const averageTrackerSeverity =
    trackerSymptoms.length === 0
      ? 0
      : Math.round(
          (trackerSymptoms.reduce((sum, name) => sum + (symptomDetails[name]?.severity ?? 0), 0) /
            trackerSymptoms.length) *
            10,
        ) / 10;

  const trackerEntries = useMemo(
    () => timelineEntries.filter((entry) => entry.entry_type === 'tracker'),
    [timelineEntries],
  );
  const trackerEntriesSorted = useMemo(
    () =>
      [...trackerEntries].sort(
        (a, b) => new Date(b.occurred_at).getTime() - new Date(a.occurred_at).getTime(),
      ),
    [trackerEntries],
  );
  const caseEntries = useMemo(
    () => timelineEntries.filter((entry) => (entry.entry_type ?? 'case') !== 'tracker'),
    [timelineEntries],
  );
  const lastTrackerEntry = useMemo(() => trackerEntriesSorted[0] ?? null, [trackerEntriesSorted]);
  const lastTrackerAverage = useMemo(() => {
    if (!lastTrackerEntry?.symptom_severity) return null;
    const values = Object.values(lastTrackerEntry.symptom_severity);
    if (values.length === 0) return null;
    const avg = values.reduce((sum, value) => sum + (value ?? 0), 0) / values.length;
    return Math.round(avg * 10) / 10;
  }, [lastTrackerEntry]);
  const trackerDelta = useMemo(() => {
    if (lastTrackerAverage === null) return null;
    const delta = Math.round((averageTrackerSeverity - lastTrackerAverage) * 10) / 10;
    if (Math.abs(delta) < 0.3) return { delta, label: 'Stable vs last saved check-in' };
    return {
      delta,
      label: delta > 0 ? 'Worsening vs last saved check-in' : 'Improving vs last saved check-in',
    };
  }, [averageTrackerSeverity, lastTrackerAverage]);
  const trackerGuidance = useMemo(() => {
    if (redFlags.length > 0) return 'Red flags present: escalate to urgent care if new or severe.';
    if (averageTrackerSeverity >= 7) return 'High today: lighten activity, hydrate, consider clinician contact.';
    if (averageTrackerSeverity >= 4) return 'Moderate: pace your day, monitor changes, prepare questions for your provider.';
    return 'Mild: maintain routine, keep hydration/sleep on track, log again tomorrow.';
  }, [averageTrackerSeverity, redFlags.length]);
  const trackerHistorySeries = useMemo(() => {
    const series = trackerEntriesSorted
      .map((entry) => {
        if (entry.symptom_severity) {
          const values = Object.values(entry.symptom_severity);
          if (values.length === 0) return null;
          const avg = values.reduce((sum, value) => sum + (value ?? 0), 0) / values.length;
          return Math.round(avg * 10) / 10;
        }
        if (typeof entry.severity_score === 'number') {
          return Math.round(entry.severity_score * 10) / 10;
        }
        return null;
      })
      .filter((value): value is number => value !== null)
      .slice(0, 6);
    return series.reverse(); // oldest to newest for the sparkline
  }, [trackerEntriesSorted]);
  const trackerHistoryDelta = useMemo(() => {
    if (trackerHistorySeries.length < 2) return null;
    const change =
      trackerHistorySeries[trackerHistorySeries.length - 1] - trackerHistorySeries[0];
    const rounded = Math.round(change * 10) / 10;
    if (Math.abs(rounded) < 0.3) return { change: rounded, label: 'Stable across recent check-ins' };
    return {
      change: rounded,
      label: rounded > 0 ? 'Trending higher over recent check-ins' : 'Trending lower over recent check-ins',
    };
  }, [trackerHistorySeries]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100 pb-16">
      <header className="bg-gradient-to-br from-sky-50 via-white to-emerald-50">
        <div className="mx-auto max-w-5xl px-6 pt-6">
          <div className="flex flex-wrap items-center justify-end gap-3">
            {isAuthenticated && userProfile ? (
              <>
                <div className="rounded-full border border-white/60 bg-white/70 px-4 py-2 text-sm text-slate-700 shadow">
                  Signed in as <span className="font-semibold text-slate-900">{userProfile.name}</span>
                </div>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="rounded-full border border-slate-200 bg-white/80 px-4 py-2 text-sm font-semibold text-slate-700 shadow hover:border-sky-200 hover:text-sky-700"
                >
                  Sign out
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('signup');
                    setShowAuthModal(true);
                    setAuthError(null);
                  }}
                  className="rounded-full bg-gradient-to-r from-sky-600 to-blue-700 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-sky-200 hover:from-sky-500 hover:to-blue-600"
                >
                  Sign up
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('login');
                    setShowAuthModal(true);
                    setAuthError(null);
                  }}
                  className="rounded-full border border-slate-200 bg-white/80 px-4 py-2 text-sm font-semibold text-slate-700 shadow hover:border-sky-200 hover:text-sky-700"
                >
                  Sign in
                </button>
              </>
            )}
          </div>
        </div>
        <div className="mx-auto flex max-w-5xl flex-col gap-8 px-6 pb-12 pt-8 lg:flex-row lg:items-center">
          <div className="flex-1">
            <p className="text-xs uppercase tracking-[0.35em] text-sky-600">medical triage</p>
            <h1 className="mt-3 text-4xl font-bold text-slate-900 md:text-5xl">Symptom checker</h1>
            <p className="mt-4 max-w-2xl text-lg text-slate-600 leading-relaxed">
              Add symptoms to see possible conditions, a simple severity score, and basic precautions.
            </p>
            <div className="mt-6 flex flex-wrap gap-4 text-sm text-slate-600">
              <div className="rounded-2xl border border-white/60 bg-white/60 px-4 py-2 shadow-sm backdrop-blur">
                Multi-condition predictions
              </div>
              <div className="rounded-2xl border border-white/60 bg-white/60 px-4 py-2 shadow-sm backdrop-blur">
                Severity score & triage level
              </div>
              <div className="rounded-2xl border border-white/60 bg-white/60 px-4 py-2 shadow-sm backdrop-blur">
                Precautions & explanations
              </div>
            </div>
          </div>
          <div className="flex-1 rounded-[28px] border border-white/40 bg-white/80 p-8 shadow-xl shadow-sky-100 backdrop-blur">
            <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Safety notice</p>
            <p className="mt-3 text-lg font-semibold text-slate-900 leading-relaxed">Educational tool only.</p>
            <p className="mt-3 text-sm text-slate-600 leading-relaxed">
              Results are rough guidance and do not replace a clinician’s advice.
            </p>
          </div>
        </div>
      </header>

      <main className="mx-auto mt-12 flex w-full max-w-5xl flex-col gap-10 px-6">
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-slate-100 bg-white/90 p-6 shadow-sm shadow-slate-200 backdrop-blur">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-slate-500">Quick navigation</p>
            <p className="text-sm text-slate-700">Choose the view you need.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              { key: 'predict', label: 'Prediction' },
              { key: 'tracker', label: 'Daily tracker' },
              { key: 'history', label: 'Care timeline' },
            ].map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveView(tab.key as 'predict' | 'tracker' | 'history')}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  activeView === tab.key
                    ? 'bg-sky-600 text-white shadow-lg shadow-sky-200'
                    : 'border border-slate-200 bg-white text-slate-700 hover:border-sky-200 hover:text-sky-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {activeView === 'predict' && (
          <>
            <div className="grid gap-5 rounded-3xl border border-slate-100 bg-white/95 p-6 shadow-md shadow-slate-200 backdrop-blur sm:grid-cols-3">
              {[
                { label: 'Step 1', title: 'Add symptoms', done: hasSymptoms },
                { label: 'Step 2', title: 'Set severity', done: hasSymptoms },
                { label: 'Step 3', title: 'Predict & save', done: hasResults },
              ].map((step) => (
                <div
                  key={step.title}
                  className={`rounded-2xl border px-5 py-4 text-sm ${
                    step.done
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                      : 'border-slate-100 bg-slate-50 text-slate-700'
                  }`}
                >
                  <p className="text-[11px] uppercase tracking-[0.28em]">{step.label}</p>
                  <p className="font-semibold">{step.title}</p>
                </div>
              ))}
            </div>

            <SymptomInput
              selectedSymptoms={selectedSymptoms}
              suggestions={symptomOptions}
              onAddSymptom={addSymptom}
              onRemoveSymptom={removeSymptom}
              isLoading={isLoading}
            />

            {selectedSymptoms.length > 0 && (
              <div className="rounded-3xl border border-slate-100 bg-white/95 p-7 shadow-lg shadow-slate-200 backdrop-blur">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Symptom severity</p>
                <h3 className="mt-2 text-xl font-semibold text-slate-900">Step 2 – set a 0-10 severity for each symptom</h3>
                <div className="mt-5 grid gap-5">
                  {selectedSymptoms.map((symptom) => {
                    const meta = symptomDetails[symptom] ?? { severity: 5 };
                    return (
                      <div
                        key={symptom}
                        className="grid gap-3 rounded-2xl border border-slate-100 bg-slate-50/70 p-4 shadow-inner md:grid-cols-2"
                      >
                        <div>
                          <p className="text-sm font-semibold text-slate-800">{symptom.replace(/_/g, ' ')}</p>
                        </div>
                        <div>
                          <label className="block text-xs uppercase tracking-[0.2em] text-slate-500">Severity (0-10)</label>
                          <input
                            type="range"
                            min={0}
                            max={10}
                            step={1}
                            value={meta.severity}
                            onChange={(event) =>
                              setSymptomDetails((prev) => ({
                                ...prev,
                                [symptom]: { ...meta, severity: Number(event.target.value) },
                              }))
                            }
                            className="mt-2 w-full accent-sky-600"
                          />
                          <p className="mt-1 text-sm font-semibold text-slate-800">{meta.severity}/10</p>
                          <p className="text-xs text-slate-500">This weight influences the model input and severity score.</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-100 bg-white/80 p-5 shadow-sm shadow-slate-200">
              <button
                type="button"
                onClick={handleSubmit}
                className="w-full rounded-xl bg-gradient-to-r from-sky-600 to-blue-700 px-8 py-3 text-center text-base font-semibold text-white shadow-lg shadow-sky-200 hover:from-sky-500 hover:to-blue-600 focus:outline-none focus:ring-2 focus:ring-sky-200 sm:w-auto"
                disabled={isLoading}
              >
                {isLoading ? 'Evaluating...' : 'Predict triage'}
              </button>
              <p className="text-sm text-slate-500">For educational use only. Not a medical device.</p>
            </div>

            {redFlags.length > 0 && (
              <div className="rounded-2xl border border-rose-200 bg-rose-50/80 p-4 text-sm text-rose-800 shadow-sm">
                <p className="text-xs uppercase tracking-[0.3em] font-semibold">Red flag alerts</p>
                <ul className="mt-2 list-disc space-y-1 pl-5">
                  {redFlags.map((flag) => (
                    <li key={flag}>{flag}</li>
                  ))}
                </ul>
                <p className="mt-2 text-xs text-rose-700">In emergencies, call your local emergency number immediately.</p>
              </div>
            )}

            {error && (
              <div className="rounded-2xl border border-rose-100 bg-rose-50/80 p-4 text-sm text-rose-700 shadow-sm">{error}</div>
            )}

            {isLoading && !hasResults && (
              <div className="grid gap-4 rounded-3xl border border-slate-100 bg-white/90 p-6 shadow-lg shadow-slate-200 backdrop-blur md:grid-cols-2">
                {[1, 2, 3, 4].map((item) => (
                  <div
                    key={item}
                    className="h-24 animate-pulse rounded-2xl bg-gradient-to-r from-slate-100 via-slate-50 to-slate-100"
                  />
                ))}
              </div>
            )}

            {followUpQuestions.length > 0 && (
              <div className="rounded-3xl border border-slate-100 bg-white/90 p-6 shadow-lg shadow-slate-200 backdrop-blur">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Follow-up questions</p>
                <h3 className="mt-2 text-xl font-semibold text-slate-900">Key questions a clinician may ask</h3>
                <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-700">
                  {followUpQuestions.map((question) => (
                    <li key={question}>{question}</li>
                  ))}
                </ul>
              </div>
            )}

            {results.length > 0 && (
              <>
                <SeverityGauge score={severityScore} />

                <div className="grid gap-5">
                  <div className="rounded-3xl border border-slate-100 bg-white/90 p-6 shadow-xl shadow-slate-200 backdrop-blur">
                    <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Save to timeline</p>
                    <h3 className="mt-2 text-xl font-semibold text-slate-900">Save this check with notes</h3>
                    <p className="text-sm text-slate-600">
                      Store the result and your notes for later.
                    </p>
                    {!isAuthenticated && (
                      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-100 bg-amber-50/80 p-3 text-xs text-amber-800">
                        <p>Sign up or sign in to save this result to your timeline.</p>
                        <button
                          type="button"
                          onClick={() => {
                            setAuthMode('signup');
                            setShowAuthModal(true);
                            setAuthError(null);
                          }}
                          className="rounded-lg bg-amber-600 px-3 py-2 text-xs font-semibold text-white shadow hover:bg-amber-500"
                        >
                          Start now
                        </button>
                      </div>
                    )}

                    {results[0] && (
                      <div className="mt-4 grid gap-3 rounded-2xl border border-slate-100 bg-slate-50/70 p-4 shadow-inner sm:grid-cols-2">
                        <div>
                          <p className="text-[11px] uppercase tracking-[0.25em] text-slate-500">Top match</p>
                          <p className="text-lg font-semibold text-slate-900">{results[0].disease}</p>
                          <p className="text-xs text-slate-500">
                            Triage: <span className="font-semibold text-slate-800">{results[0].triage_level}</span>
                          </p>
                        </div>
                        <div>
                          <p className="text-[11px] uppercase tracking-[0.25em] text-slate-500">Severity snapshot</p>
                          <p className="text-lg font-semibold text-slate-900">{results[0].severity_score.toFixed(1)}</p>
                          <p className="text-xs text-slate-500">Saved with your notes for follow-up</p>
                        </div>
                      </div>
                    )}

                    <label className="mt-4 block text-sm font-medium text-slate-700">Notes or next steps</label>
                    <textarea
                      value={timelineNote}
                      onChange={(event) => setTimelineNote(event.target.value)}
                      className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 shadow-inner focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
                      rows={3}
                      placeholder="Observation, follow-up plan, or context to remember later."
                      disabled={isSavingTimeline}
                    />
                    <div className="mt-4 flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={handleSaveToTimeline}
                        disabled={isSavingTimeline || !isAuthenticated}
                        className="rounded-xl bg-gradient-to-r from-emerald-500 to-sky-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-200 hover:from-emerald-500 hover:to-sky-500 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isSavingTimeline ? 'Saving...' : 'Save case to timeline'}
                      </button>
                      <button
                        type="button"
                        onClick={refreshTimeline}
                        className="rounded-xl border border-slate-200 px-6 py-3 text-sm font-semibold text-slate-700 hover:border-sky-200 hover:text-sky-700"
                      >
                        Refresh history
                      </button>
                    </div>
                    {timelineError && (
                      <p className="mt-3 text-xs font-semibold text-rose-600">{timelineError}</p>
                    )}
                  </div>

              {results.map((result) => (
                <DiseaseCard
                  key={result.disease}
                  disease={result.disease}
                  probability={result.probability}
                  triageLevel={result.triage_level}
                  precautions={result.precautions}
                  description={result.description ?? undefined}
                />
              ))}
                </div>
              </>
            )}

            {results.length === 0 && !error && (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-white/80 p-10 text-center text-slate-500 shadow-sm">
                Add a few symptoms and press Predict to view diagnosis and triage guidance.
              </div>
            )}
          </>
        )}

        {activeView === 'tracker' && (
          <>
            <div className="rounded-3xl border border-slate-100 bg-gradient-to-r from-white via-slate-50 to-emerald-50/70 p-6 shadow-md shadow-slate-200 backdrop-blur">
              <p className="text-[11px] uppercase tracking-[0.3em] text-emerald-600">Tracker vs timeline</p>
              <div className="mt-3 grid gap-4 md:grid-cols-3">
                <div className="rounded-2xl border border-slate-100 bg-white/80 p-4 shadow-inner">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Daily tracker</p>
                  <p className="text-sm text-slate-700 leading-relaxed">
                    Quick check-ins for today’s symptoms with a severity score. Use it to see short-term ups/downs.
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-100 bg-white/80 p-4 shadow-inner">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Care timeline</p>
                  <p className="text-sm text-slate-700 leading-relaxed">
                    Longer-term log of saved predictions and tracker entries for clinician handoff or personal history.
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-100 bg-white/80 p-4 shadow-inner">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">How they connect</p>
                  <p className="text-sm text-slate-700 leading-relaxed">
                    Save today’s tracker to capture your baseline. Save predictions when you run a full triage check.
                  </p>
                </div>
              </div>
            </div>

            {timelineError && (
              <div className="rounded-2xl border border-amber-100 bg-amber-50/80 p-4 text-sm text-amber-800 shadow-sm">
                {timelineError}
              </div>
            )}
            <div className="grid gap-5">
              <div className="rounded-3xl border border-slate-100 bg-white/90 p-6 shadow-lg shadow-slate-200 backdrop-blur">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div className="space-y-2">
                    <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Symptom tracker</p>
                    <h3 className="text-xl font-semibold text-slate-900">Log today’s status</h3>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      Pick the symptoms you care about most, set today’s level, add an optional note, then save. We’ll show
                      the trend in the timeline below.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="rounded-2xl border border-slate-100 bg-slate-50/80 px-4 py-3 text-xs text-slate-600 shadow-inner">
                      <p className="font-semibold text-slate-800">Avg severity</p>
                      <p className="text-base font-bold text-slate-900">{averageTrackerSeverity}/10</p>
                      <p>
                        Last entry:{' '}
                        {privacySummary?.last_entry_at ? new Date(privacySummary.last_entry_at).toLocaleString() : '—'}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-emerald-100 bg-emerald-50/80 px-4 py-3 text-xs text-emerald-700 shadow-inner">
                      <p className="text-[11px] uppercase tracking-[0.2em] text-emerald-700">Trend</p>
                      <p className="text-base font-bold text-emerald-900">
                        {trackerDelta ? `${trackerDelta.delta > 0 ? '+' : ''}${trackerDelta.delta}` : '—'}
                      </p>
                      <p className="text-[12px] font-semibold text-emerald-800">
                        {trackerDelta?.label ?? 'No trend yet. Save today, compare tomorrow.'}
                      </p>
                      {!trackerDelta && (
                        <p className="mt-2 inline-flex items-center rounded-full border border-emerald-200 bg-white/70 px-3 py-1 text-[11px] font-semibold text-emerald-700">
                          Save today → See change tomorrow
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col gap-2 rounded-2xl border border-slate-100 bg-white/90 px-4 py-3 text-xs text-slate-700 shadow-inner">
                      <div className="flex items-center justify-between">
                        <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500">Recent check-ins</p>
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-700">
                          last {trackerHistorySeries.length || 1}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <MiniSparkline values={trackerHistorySeries} width={120} height={36} color="#10b981" />
                        <div>
                          <p className="text-[11px] text-slate-500">Change</p>
                          <p className="text-sm font-semibold text-slate-800">
                            {trackerHistoryDelta
                              ? `${trackerHistoryDelta.change > 0 ? '+' : ''}${trackerHistoryDelta.change}`
                              : trackerHistorySeries.length > 0
                                ? '—'
                                : 'No history'}
                          </p>
                          <p className="text-[11px] text-slate-500">
                            {trackerHistoryDelta?.label ?? 'Save today and keep logging to build history.'}
                          </p>
                        </div>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Pro tip: log daily for 5–7 days to see a clear trend line.
                      </p>
                    </div>
                    <div className="rounded-2xl border border-sky-100 bg-sky-50/80 px-4 py-3 text-xs text-sky-700 shadow-inner">
                      <p className="font-semibold text-sky-800">Care guidance</p>
                      <p className="text-[13px] font-semibold text-sky-900">{trackerGuidance}</p>
                      {lastTrackerAverage !== null && (
                        <p className="text-[11px] text-sky-700">Last saved avg: {lastTrackerAverage}/10</p>
                      )}
                    </div>
                    <button
                      type="button"
                      className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:border-sky-200 hover:text-sky-700"
                      onClick={refreshTimeline}
                      disabled={!isAuthenticated}
                    >
                      Refresh trend
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-3xl border border-slate-100 bg-white/90 p-6 shadow-lg shadow-slate-200 backdrop-blur">
                  <div className="flex items-center justify-between">
                    <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Current tracker symptoms</p>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedSymptoms([]);
                        setSymptomDetails({});
                      }}
                      className="text-xs font-semibold text-slate-600 hover:text-rose-700"
                      disabled={trackerSymptoms.length === 0}
                    >
                      Clear all
                    </button>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {trackerSymptoms.length > 0 ? (
                      trackerSymptoms.map((symptom) => (
                        <span
                          key={symptom}
                          className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700"
                        >
                          {symptom.replace(/_/g, ' ')}
                          <button
                            type="button"
                            className="text-slate-500 hover:text-slate-900"
                            onClick={() => {
                              setSelectedSymptoms((prev) => prev.filter((item) => item !== symptom));
                              setSymptomDetails((prev) => {
                                const next = { ...prev };
                                delete next[symptom];
                                return next;
                              });
                            }}
                            aria-label={`Remove ${symptom}`}
                          >
                            ×
                          </button>
                        </span>
                      ))
                    ) : (
                      <span className="rounded-full border border-dashed border-slate-200 px-3 py-1 text-xs text-slate-500">
                        No symptoms selected yet.
                      </span>
                    )}
                  </div>
                  {trackerSuggestions.length > 0 && (
                    <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-600">
                      <span className="font-semibold text-slate-700">Quick add:</span>
                      {trackerSuggestions.map((symptom) => (
                        <button
                          key={symptom}
                          type="button"
                          onClick={() => addSymptom(symptom)}
                          className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1 font-semibold text-sky-700 hover:border-sky-300 hover:bg-white"
                        >
                          {symptom.replace(/_/g, ' ')}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="rounded-3xl border border-slate-100 bg-white/90 p-6 shadow-lg shadow-slate-200 backdrop-blur">
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Tracker note (optional)</p>
                  <textarea
                    value={trackerNote}
                    onChange={(event) => setTrackerNote(event.target.value)}
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 shadow-inner focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
                    rows={4}
                    placeholder="How are the symptoms trending today?"
                  />
                  <div className="mt-3 flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={async () => {
                        setTimelineError(null);
                        if (!isAuthenticated) {
                          setTimelineError('Sign in or sign up to save tracker entries.');
                          setShowAuthModal(true);
                          return;
                        }
                        const targetSymptoms =
                          normalizedSymptoms.length > 0
                            ? normalizedSymptoms
                            : selectedSymptoms.length > 0
                              ? selectedSymptoms
                              : Object.keys(symptomDetails);
                        if (targetSymptoms.length === 0) {
                          setTimelineError('Add at least one symptom to log.');
                          return;
                        }
                        try {
                  const payload = {
                    symptoms: targetSymptoms,
                    notes: trackerNote.trim() || undefined,
                    severity_score: averageTrackerSeverity,
                    symptom_severity: Object.fromEntries(
                      Object.entries(symptomDetails).map(([k, v]) => [k, v.severity ?? 0]),
                    ),
                    entry_type: 'tracker' as const,
                  };
                          const created = await createTimelineEntry(payload);
                          setTimelineEntries((prev) => [created, ...prev]);
                          setTrackerNote('');
                          const summary = await fetchPrivacySummary();
                          setPrivacySummary(summary);
                        } catch (err) {
                          console.error(err);
                          setTimelineError('Could not log tracker entry.');
                          return;
                        }
                        setTimelineError(null);
                      }}
                      className="rounded-xl bg-gradient-to-r from-emerald-500 to-sky-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-200 hover:from-emerald-500 hover:to-sky-500"
                    >
                      Save today’s tracker
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSymptomDetails({});
                        setSelectedSymptoms([]);
                        setTrackerNote('');
                        setTimelineError(null);
                      }}
                      className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 hover:border-sky-200 hover:text-sky-700"
                    >
                      Reset tracker
                    </button>
                    <p className="text-xs text-slate-600">
                      Keep it fresh: log today so tomorrow’s check-in clearly shows up/down changes.
                    </p>
                  </div>
                </div>
              </div>

              {trackerSymptoms.length > 0 && (
                <div className="rounded-3xl border border-slate-100 bg-white/90 p-6 shadow-lg shadow-slate-200 backdrop-blur">
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Today’s sliders</p>
                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    {trackerSymptoms.map((symptom) => {
                      const meta = symptomDetails[symptom] ?? { severity: 5 };
                      return (
                        <div key={symptom} className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4 shadow-inner">
                          <p className="text-sm font-semibold text-slate-800">{symptom.replace(/_/g, ' ')}</p>
                          <input
                            type="range"
                            min={0}
                            max={10}
                            step={1}
                            value={meta.severity}
                            onChange={(event) =>
                              setSymptomDetails((prev) => ({
                                ...prev,
                                [symptom]: { ...meta, severity: Number(event.target.value) },
                              }))
                            }
                            className="mt-2 w-full accent-emerald-500"
                          />
                          <p className="text-xs text-slate-500">Today: {meta.severity}/10</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {activeView === 'history' && (
          <>
            <div className="rounded-3xl border border-slate-100 bg-gradient-to-r from-white via-slate-50 to-sky-50/70 p-6 shadow-md shadow-slate-200 backdrop-blur">
              <p className="text-[11px] uppercase tracking-[0.3em] text-sky-700">Care timeline</p>
              <h3 className="text-xl font-semibold text-slate-900">Saved history</h3>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                See your tracker check-ins and saved prediction snapshots.
              </p>
            </div>
            {timelineError && (
              <div className="rounded-2xl border border-amber-100 bg-amber-50/80 p-4 text-sm text-amber-800 shadow-sm">
                {timelineError}
              </div>
            )}
            <TimelinePanel
              entries={trackerEntries}
              privacySummary={privacySummary}
              isLoading={isTimelineLoading}
              onDelete={handleDeleteEntry}
              onClear={handleClearTimeline}
              title="Tracker history"
              subtitle="Daily symptom logs"
              tone="tracker"
            />
            <TimelinePanel
              entries={caseEntries}
              privacySummary={privacySummary}
              isLoading={isTimelineLoading}
              onDelete={handleDeleteEntry}
              onClear={handleClearTimeline}
              title="Case timeline"
              subtitle="Saved prediction snapshots"
            />
          </>
        )}
      </main>

      <footer className="mt-16 border-t border-slate-200 bg-white/80 py-6 text-center text-xs text-slate-500">
        This application provides automated educational guidance only. Consult a healthcare professional for any medical
        concerns.
      </footer>

      {showAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
          <div className="w-full max-w-md rounded-3xl border border-slate-100 bg-white p-6 shadow-2xl shadow-slate-400">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
                {authMode === 'signup' ? 'Sign up' : 'Sign in'}
              </p>
              <button
                type="button"
                onClick={() => {
                  setAuthMode(authMode === 'signup' ? 'login' : 'signup');
                  setAuthError(null);
                }}
                className="text-xs font-semibold text-sky-700 hover:text-sky-900"
              >
                {authMode === 'signup' ? 'I already have an account' : 'Create account'}
              </button>
            </div>
            <h3 className="mt-2 text-xl font-semibold text-slate-900">
              {authMode === 'signup' ? 'Create an account to save your data' : 'Access your saved timeline'}
            </h3>
            <p className="text-sm text-slate-600">
              {authMode === 'signup'
                ? 'Use your name, email, and a password to enable timeline sync on this device.'
                : 'Enter your email and password to keep working with your saved timeline and tracker.'}
            </p>
            <div className="mt-4 space-y-3">
              {authMode === 'signup' && (
                <input
                  type="text"
                  placeholder="Name"
                  value={authName}
                  onChange={(e) => setAuthName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm shadow-inner focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
                />
              )}
              <input
                type="email"
                placeholder="Email"
                value={authEmail}
                onChange={(e) => setAuthEmail(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm shadow-inner focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
              />
              <input
                type="password"
                placeholder="Password (min 6 characters)"
                value={authPassword}
                onChange={(e) => setAuthPassword(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm shadow-inner focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
              />
            </div>
            {authError && <p className="mt-2 text-xs font-semibold text-rose-600">{authError}</p>}
            <div className="mt-4 flex gap-3">
              <button
                type="button"
                onClick={handleAuthSubmit}
                disabled={isAuthLoading}
                className="flex-1 rounded-xl bg-gradient-to-r from-sky-600 to-blue-700 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-sky-200 hover:from-sky-500 hover:to-blue-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isAuthLoading ? 'Working...' : authMode === 'signup' ? 'Sign up' : 'Sign in'}
              </button>
              <button
                type="button"
                onClick={() => setShowAuthModal(false)}
                className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 hover:border-sky-200 hover:text-sky-700"
              >
                Cancel
              </button>
            </div>
            <p className="mt-3 text-xs text-slate-500">
              Data stays on this device. Signing in enables saving to the timeline and tracker.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
