import { PrivacySummary, TimelineEntry } from '../services/api';
import MiniSparkline from './MiniSparkline';

type TimelinePanelProps = {
  entries: TimelineEntry[];
  privacySummary?: PrivacySummary | null;
  isLoading?: boolean;
  onDelete: (entryId: string) => void;
  onClear: () => void;
  title?: string;
  subtitle?: string;
  tone?: 'tracker' | 'case';
};

const formatSymptomLabel = (value: string) =>
  value
    .split('_')
    .map((chunk) => chunk.charAt(0).toUpperCase() + chunk.slice(1))
    .join(' ');

const formatDate = (isoString: string) => {
  const parsed = new Date(isoString);
  if (Number.isNaN(parsed.getTime())) {
    return isoString;
  }
  return parsed.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
};

const TimelinePanel = ({
  entries,
  privacySummary,
  isLoading = false,
  onDelete,
  onClear,
  title,
  subtitle,
  tone = 'case',
}: TimelinePanelProps) => {
  const trendValues = entries
    .map((entry) => entry.severity_score)
    .filter((value): value is number => typeof value === 'number' && !Number.isNaN(value))
    .reverse(); // oldest to newest for visual flow
  const trackerCount = entries.filter((entry) => entry.entry_type === 'tracker').length;
  const caseCount = entries.length - trackerCount;
  const isTrackerPanel = tone === 'tracker';
  const panelColors = isTrackerPanel
    ? 'border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-emerald-100/70 shadow-emerald-100/70'
    : 'border-sky-200 bg-gradient-to-br from-sky-50 via-white to-blue-100/70 shadow-sky-100/70';
  const cardColors = isTrackerPanel
    ? 'from-emerald-50 via-white to-emerald-100/70 border-emerald-200'
    : 'from-sky-50 via-white to-blue-100/70 border-sky-200';

  return (
    <div className={`rounded-3xl border p-6 shadow-xl backdrop-blur ${panelColors}`}>
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <p className="text-xs uppercase tracking-[0.28em] text-slate-500">{title ?? 'Case timeline'}</p>
            <span
              className={`rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] ${
                isTrackerPanel
                  ? 'bg-emerald-600/90 text-white'
                  : 'bg-sky-600/90 text-white'
              }`}
            >
              {isTrackerPanel ? 'Tracker' : 'Case'}
            </span>
          </div>
          <h3 className="text-xl font-semibold text-slate-900">
            {subtitle ?? 'Saved symptom checks & notes'}
          </h3>
          <p className="text-sm text-slate-600">See saved entries and clear them if needed.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="rounded-2xl border border-slate-100 bg-slate-50/80 px-4 py-3 text-right shadow-inner">
            <p className="text-[10px] uppercase tracking-[0.3em] text-slate-500">Entries</p>
            <p className="text-2xl font-bold text-slate-900">{privacySummary?.timeline_entries ?? entries.length}</p>
            <p className="text-[11px] text-slate-500">
              {privacySummary?.last_entry_at
                ? `Last entry ${formatDate(privacySummary.last_entry_at)}`
                : 'No history yet'}
            </p>
            <p className="text-[11px] text-slate-500">
              {trackerCount} tracker · {caseCount} case snapshot
            </p>
          </div>
          {trendValues.length > 1 && (
            <div className="rounded-2xl border border-slate-100 bg-white/70 px-4 py-3 shadow-inner">
              <p className="text-[10px] uppercase tracking-[0.3em] text-slate-500">Severity trend</p>
              <MiniSparkline values={trendValues} />
            </div>
          )}
          <button
            type="button"
            onClick={onClear}
            disabled={isLoading || entries.length === 0}
            className="rounded-xl border border-rose-100 bg-rose-50/70 px-4 py-2 text-sm font-semibold text-rose-700 shadow hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Clear timeline
          </button>
        </div>
      </div>

      <div className="mt-5 space-y-3">
        {isLoading && <p className="text-sm text-slate-500">Loading timeline…</p>}
        {!isLoading && entries.length === 0 && (
          <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 p-4 text-sm text-slate-500">
            No saved cases yet. Run a prediction and save it with notes to start your audit trail.
          </p>
        )}

        {!isLoading &&
          entries.map((entry) => (
            <div
              key={entry.id}
              className={`rounded-2xl border bg-gradient-to-r p-4 shadow-sm ${cardColors}`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Logged</p>
                  <p className="text-sm font-semibold text-slate-900">{formatDate(entry.occurred_at)}</p>
                  {entry.top_prediction && (
                    <p className="text-xs text-slate-500">
                      Top guess: <span className="font-semibold text-slate-800">{entry.top_prediction}</span>{' '}
                      {entry.triage_level ? `(${entry.triage_level})` : ''}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] ${
                      entry.entry_type === 'tracker'
                        ? 'border border-emerald-100 bg-emerald-50 text-emerald-700'
                        : 'border border-sky-100 bg-sky-50 text-sky-700'
                    }`}
                  >
                    {entry.entry_type === 'tracker' ? 'Daily check-in' : 'Case snapshot'}
                  </span>
                  <button
                    type="button"
                    onClick={() => onDelete(entry.id)}
                    className="text-xs font-semibold text-rose-600 hover:text-rose-800"
                  >
                    Remove
                  </button>
                </div>
              </div>
              {entry.symptom_severity ? (
                <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-600">
                  {Object.entries(entry.symptom_severity).map(([name, value]) => (
                    <span key={name} className="rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-700">
                      {formatSymptomLabel(name)}: {value}
                    </span>
                  ))}
                </div>
              ) : (
                <div className="mt-3 flex flex-wrap gap-2">
                  {entry.symptoms.map((symptom) => (
                    <span
                      key={symptom}
                      className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700"
                    >
                      {formatSymptomLabel(symptom)}
                    </span>
                  ))}
                </div>
              )}
              {entry.notes && (
                <p className="mt-2 rounded-xl bg-slate-50/80 p-3 text-sm text-slate-700 shadow-inner">{entry.notes}</p>
              )}
              {(() => {
                if (entry.severity_score !== undefined && entry.severity_score !== null) {
                  return (
                    <p className="mt-2 text-xs text-slate-500">
                      Severity snapshot: <span className="font-semibold text-slate-800">{entry.severity_score}</span>
                    </p>
                  );
                }
                if (entry.symptom_severity) {
                  const values = Object.values(entry.symptom_severity);
                  if (values.length > 0) {
                    const avg = Math.round((values.reduce((sum, v) => sum + (v ?? 0), 0) / values.length) * 10) / 10;
                    return (
                      <p className="mt-2 text-xs text-slate-500">
                        Daily mean severity: <span className="font-semibold text-slate-800">{avg}</span>
                      </p>
                    );
                  }
                }
                return null;
              })()}
            </div>
          ))}
      </div>

      {privacySummary && privacySummary.stored_categories.length > 0 && (
        <div className="mt-5 rounded-2xl border border-slate-100 bg-slate-50/70 p-4 text-xs text-slate-500 shadow-inner">
          <p className="font-semibold text-slate-700">Data retained</p>
          <p className="mt-1">Categories: {privacySummary.stored_categories.join(', ')}</p>
          <p>Use "Clear timeline" to delete locally stored history.</p>
        </div>
      )}
    </div>
  );
};

export default TimelinePanel;
