import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
const formatSymptomLabel = (value) => value
    .split('_')
    .map((chunk) => chunk.charAt(0).toUpperCase() + chunk.slice(1))
    .join(' ');
const SymptomAudit = ({ normalized, unmapped }) => {
    if (normalized.length === 0 && unmapped.length === 0) {
        return null;
    }
    const uniqueNormalized = Array.from(new Set(normalized));
    const recognized = uniqueNormalized.filter((symptom) => !unmapped.includes(symptom));
    const coverage = uniqueNormalized.length
        ? Math.round((recognized.length / uniqueNormalized.length) * 100)
        : 0;
    return (_jsxs("div", { className: "rounded-3xl border border-slate-100 bg-gradient-to-br from-white to-slate-50/70 p-6 shadow-lg shadow-slate-200", children: [_jsxs("div", { className: "flex flex-col gap-3 md:flex-row md:items-center md:justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-xs uppercase tracking-[0.28em] text-slate-500", children: "Model input audit" }), _jsx("h3", { className: "text-xl font-semibold text-slate-900", children: "How your symptoms were understood" }), _jsx("p", { className: "text-sm text-slate-600", children: "Normalized vocabulary the model actually used, plus anything it could not map." })] }), _jsxs("div", { className: "min-w-[220px] rounded-2xl border border-slate-100 bg-white/80 p-4 text-right shadow-inner", children: [_jsx("p", { className: "text-xs uppercase tracking-[0.25em] text-slate-500", children: "Coverage" }), _jsxs("p", { className: "text-3xl font-bold text-slate-900", children: [coverage, "%"] }), _jsxs("p", { className: "text-xs text-slate-500", children: [recognized.length, " mapped / ", uniqueNormalized.length, " provided"] }), _jsx("div", { className: "mt-3 h-2 rounded-full bg-slate-100", children: _jsx("div", { className: "h-2 rounded-full bg-gradient-to-r from-emerald-500 to-sky-500", style: { width: `${coverage}%` } }) })] })] }), _jsxs("div", { className: "mt-4 grid gap-4 md:grid-cols-2", children: [_jsxs("div", { className: "rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4 shadow-inner", children: [_jsx("p", { className: "text-xs font-semibold uppercase tracking-wide text-emerald-700", children: "Mapped symptoms" }), _jsx("div", { className: "mt-2 flex flex-wrap gap-2", children: recognized.length > 0 ? (recognized.map((symptom) => (_jsx("span", { className: "rounded-full bg-white px-3 py-1 text-xs font-medium text-emerald-700 shadow", children: formatSymptomLabel(symptom) }, symptom)))) : (_jsx("p", { className: "text-xs text-slate-500", children: "No symptoms were mapped." })) })] }), _jsxs("div", { className: "rounded-2xl border border-amber-100 bg-amber-50/60 p-4 shadow-inner", children: [_jsx("p", { className: "text-xs font-semibold uppercase tracking-wide text-amber-800", children: "Not recognized" }), _jsx("div", { className: "mt-2 flex flex-wrap gap-2", children: unmapped.length > 0 ? (unmapped.map((symptom) => (_jsx("span", { className: "rounded-full bg-white px-3 py-1 text-xs font-medium text-amber-800 shadow", children: formatSymptomLabel(symptom) }, symptom)))) : (_jsx("p", { className: "text-xs text-slate-500", children: "All symptoms were used by the model." })) })] })] })] }));
};
export default SymptomAudit;
