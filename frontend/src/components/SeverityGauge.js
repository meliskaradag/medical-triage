import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
const thresholds = {
    low: 10,
    medium: 20,
};
const resolveColor = (score) => {
    if (score >= thresholds.medium) {
        return 'bg-triage-high';
    }
    if (score >= thresholds.low) {
        return 'bg-triage-medium';
    }
    return 'bg-triage-low';
};
const resolveLabel = (score) => {
    if (score >= thresholds.medium) {
        return 'High Severity';
    }
    if (score >= thresholds.low) {
        return 'Moderate Severity';
    }
    return 'Low Severity';
};
const SeverityGauge = ({ score }) => {
    const cappedScore = Math.min(Math.max(score, 0), 40);
    const fillWidth = `${Math.min((cappedScore / 40) * 100, 100)}%`;
    return (_jsx("div", { className: "rounded-3xl border border-slate-100 bg-white/90 p-6 shadow-xl shadow-slate-200 backdrop-blur", children: _jsxs("div", { className: "flex flex-col gap-4 md:flex-row md:items-center md:justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-xs uppercase tracking-wide text-slate-500", children: "Overall severity" }), _jsx("p", { className: "mt-2 text-4xl font-bold text-slate-900", children: score.toFixed(1) }), _jsx("p", { className: "text-sm font-semibold text-slate-500", children: resolveLabel(score) })] }), _jsxs("div", { className: "flex-1", children: [_jsx("div", { className: "h-4 rounded-full bg-slate-100", children: _jsx("div", { className: `h-4 rounded-full ${resolveColor(score)} transition-all duration-500`, style: { width: fillWidth } }) }), _jsxs("div", { className: "mt-2 flex justify-between text-[10px] uppercase tracking-[0.3em] text-slate-400", children: [_jsx("span", { children: "Low" }), _jsx("span", { children: "Medium" }), _jsx("span", { children: "High" })] })] })] }) }));
};
export default SeverityGauge;
