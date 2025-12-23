import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import MiniSparkline from './MiniSparkline';

const formatSymptomLabel = (value) => value
  .split('_')
  .map((chunk) => chunk.charAt(0).toUpperCase() + chunk.slice(1))
  .join(' ');

const formatDate = (isoString) => {
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
}) => {
  const trendValues = entries
    .map((entry) => entry.severity_score)
    .filter((value) => typeof value === 'number' && !Number.isNaN(value))
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

  return (_jsxs("div", { className: `rounded-3xl border p-6 shadow-xl backdrop-blur ${panelColors}`, children: [_jsxs("div", { className: "flex flex-col gap-3 md:flex-row md:items-center md:justify-between", children: [_jsxs("div", { className: "space-y-1", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("p", { className: "text-xs uppercase tracking-[0.28em] text-slate-500", children: title ?? 'Case timeline' }), _jsx("span", { className: `rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] ${isTrackerPanel
                                ? 'bg-emerald-600/90 text-white'
                                : 'bg-sky-600/90 text-white'}`, children: isTrackerPanel ? 'Tracker' : 'Case' })] }), _jsx("h3", { className: "text-xl font-semibold text-slate-900", children: subtitle ?? 'Saved symptom checks & notes' }), _jsx("p", { className: "text-sm text-slate-600", children: "See saved entries and clear them if needed." })] }), _jsxs("div", { className: "flex items-center gap-3", children: [_jsxs("div", { className: "rounded-2xl border border-slate-100 bg-slate-50/80 px-4 py-3 text-right shadow-inner", children: [_jsx("p", { className: "text-[10px] uppercase tracking-[0.3em] text-slate-500", children: "Entries" }), _jsx("p", { className: "text-2xl font-bold text-slate-900", children: privacySummary?.timeline_entries ?? entries.length }), _jsx("p", { className: "text-[11px] text-slate-500", children: privacySummary?.last_entry_at
                            ? `Last entry ${formatDate(privacySummary.last_entry_at)}`
                            : 'No history yet' }), _jsxs("p", { className: "text-[11px] text-slate-500", children: [trackerCount, " tracker \u00B7 ", caseCount, " case snapshot"] })] }), trendValues.length > 1 && (_jsxs("div", { className: "rounded-2xl border border-slate-100 bg-white/70 px-4 py-3 shadow-inner", children: [_jsx("p", { className: "text-[10px] uppercase tracking-[0.3em] text-slate-500", children: "Severity trend" }), _jsx(MiniSparkline, { values: trendValues })] })), _jsx("button", { type: "button", onClick: onClear, disabled: isLoading || entries.length === 0, className: "rounded-xl border border-rose-100 bg-rose-50/70 px-4 py-2 text-sm font-semibold text-rose-700 shadow hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50", children: "Clear timeline" })] })] }), _jsxs("div", { className: "mt-5 space-y-3", children: [isLoading && _jsx("p", { className: "text-sm text-slate-500", children: "Loading timeline\u2026" }), !isLoading && entries.length === 0 && (_jsx("p", { className: "rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 p-4 text-sm text-slate-500", children: "No saved cases yet. Run a prediction and save it with notes to start your audit trail." })), !isLoading &&
                    entries.map((entry) => (_jsxs("div", { className: `rounded-2xl border bg-gradient-to-r p-4 shadow-sm ${cardColors}`, children: [_jsxs("div", { className: "flex flex-wrap items-start justify-between gap-3", children: [_jsxs("div", { children: [_jsx("p", { className: "text-xs uppercase tracking-[0.25em] text-slate-500", children: "Logged" }), _jsx("p", { className: "text-sm font-semibold text-slate-900", children: formatDate(entry.occurred_at) }), entry.top_prediction && (_jsxs("p", { className: "text-xs text-slate-500", children: ["Top guess: ", _jsx("span", { className: "font-semibold text-slate-800", children: entry.top_prediction }), ' ', entry.triage_level ? `(${entry.triage_level})` : ''] }))] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: `rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] ${entry.entry_type === 'tracker'
                                ? 'border border-emerald-100 bg-emerald-50 text-emerald-700'
                                : 'border border-sky-100 bg-sky-50 text-sky-700'}`, children: entry.entry_type === 'tracker' ? 'Daily check-in' : 'Case snapshot' }), _jsx("button", { type: "button", onClick: () => onDelete(entry.id), className: "text-xs font-semibold text-rose-600 hover:text-rose-800", children: "Remove" })] })] }), entry.symptom_severity ? (_jsx("div", { className: "mt-3 flex flex-wrap gap-2 text-xs text-slate-600", children: Object.entries(entry.symptom_severity).map(([name, value]) => (_jsxs("span", { className: "rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-700", children: [formatSymptomLabel(name), ": ", value] }, name))) })) : (_jsx("div", { className: "mt-3 flex flex-wrap gap-2", children: entry.symptoms.map((symptom) => (_jsx("span", { className: "rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700", children: formatSymptomLabel(symptom) }, symptom))) })), entry.notes && (_jsx("p", { className: "mt-2 rounded-xl bg-slate-50/80 p-3 text-sm text-slate-700 shadow-inner", children: entry.notes })), (() => {
                        if (entry.severity_score !== undefined && entry.severity_score !== null) {
                            return (_jsxs("p", { className: "mt-2 text-xs text-slate-500", children: ["Severity snapshot: ", _jsx("span", { className: "font-semibold text-slate-800", children: entry.severity_score })] }));
                        }
                        if (entry.symptom_severity) {
                            const values = Object.values(entry.symptom_severity);
                            if (values.length > 0) {
                                const avg = Math.round((values.reduce((sum, v) => sum + (v ?? 0), 0) / values.length) * 10) / 10;
                                return (_jsxs("p", { className: "mt-2 text-xs text-slate-500", children: ["Daily mean severity: ", _jsx("span", { className: "font-semibold text-slate-800", children: avg })] }));
                            }
                        }
                        return null;
                    })()] }, entry.id)))] }), privacySummary && privacySummary.stored_categories.length > 0 && (_jsxs("div", { className: "mt-5 rounded-2xl border border-slate-100 bg-slate-50/70 p-4 text-xs text-slate-500 shadow-inner", children: [_jsx("p", { className: "font-semibold text-slate-700", children: "Data retained" }), _jsxs("p", { className: "mt-1", children: ["Categories: ", privacySummary.stored_categories.join(', ')] }), _jsx("p", { children: "Use \"Clear timeline\" to delete locally stored history." })] }))] }));
};

export default TimelinePanel;
