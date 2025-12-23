import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo, useState } from 'react';
const formatSymptomLabel = (value) => value
    .split('_')
    .map((chunk) => chunk.charAt(0).toUpperCase() + chunk.slice(1))
    .join(' ');
const SymptomInput = ({ selectedSymptoms, suggestions, onAddSymptom, onRemoveSymptom, isLoading = false, }) => {
    const [query, setQuery] = useState('');
    const availableSuggestions = useMemo(() => suggestions.filter((symptom) => !selectedSymptoms.includes(symptom)), [selectedSymptoms, suggestions]);
    const filteredSuggestions = useMemo(() => {
        if (!query.trim()) {
            return availableSuggestions.slice(0, 10);
        }
        return availableSuggestions
            .filter((symptom) => symptom.includes(query.toLowerCase()))
            .slice(0, 10);
    }, [availableSuggestions, query]);
    const [isAllVisible, setAllVisible] = useState(false);
    const handleAdd = (symptom) => {
        if (!symptom || selectedSymptoms.includes(symptom)) {
            return;
        }
        onAddSymptom(symptom);
        setQuery('');
    };
    const submitFromInput = () => {
        const normalized = query.trim().toLowerCase().replace(/\s+/g, '_');
        if (normalized) {
            handleAdd(normalized);
        }
    };
    return (_jsx("div", { className: "rounded-2xl border border-slate-100 bg-white/90 p-6 shadow-lg shadow-slate-200 backdrop-blur", children: _jsxs("div", { className: "flex flex-col gap-4", children: [_jsx("label", { className: "text-sm font-medium text-slate-600", children: "Enter your symptoms" }), _jsxs("div", { className: "flex gap-2", children: [_jsx("input", { type: "text", value: query, onChange: (event) => setQuery(event.target.value), onKeyDown: (event) => {
                                if (event.key === 'Enter') {
                                    event.preventDefault();
                                    submitFromInput();
                                }
                            }, className: "flex-1 rounded-lg border border-slate-200 px-4 py-2 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200", placeholder: "Start typing a symptom (e.g., fever, headache)", disabled: isLoading }), _jsx("button", { type: "button", onClick: submitFromInput, className: "rounded-lg bg-sky-600 px-6 py-2 font-semibold text-white shadow hover:bg-sky-700 disabled:opacity-50", disabled: isLoading, children: "Add" })] }), filteredSuggestions.length > 0 && (_jsxs("div", { className: "rounded-2xl border border-slate-100 bg-slate-50/80 p-3 shadow-inner", children: [_jsx("p", { className: "text-xs font-semibold uppercase tracking-wide text-slate-500", children: "Suggested symptoms" }), _jsx("div", { className: "mt-2 flex flex-wrap gap-2", children: filteredSuggestions.map((symptom) => (_jsx("button", { type: "button", onClick: () => handleAdd(symptom), className: "rounded-full border border-sky-200 px-3 py-1 text-xs text-sky-700 hover:bg-sky-50", children: formatSymptomLabel(symptom) }, symptom))) })] })), _jsxs("div", { className: "rounded-2xl border border-slate-100 bg-white/70 p-3 shadow-inner", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("p", { className: "text-xs font-semibold uppercase tracking-wide text-slate-500", children: "Browse all symptoms" }), _jsx("button", { type: "button", className: "text-xs font-medium text-sky-600 hover:text-sky-800", onClick: () => setAllVisible((prev) => !prev), children: isAllVisible ? 'Hide list' : 'Show list' })] }), isAllVisible && (_jsx("div", { className: "mt-3 max-h-56 overflow-y-auto rounded-2xl border border-slate-50 bg-slate-50/70 p-3 text-left shadow-inner", children: _jsx("div", { className: "grid gap-2 md:grid-cols-2 lg:grid-cols-3", children: availableSuggestions.length > 0 ? (availableSuggestions.map((symptom) => (_jsx("button", { type: "button", onClick: () => handleAdd(symptom), className: "rounded-full border border-slate-200 px-3 py-1 text-left text-xs text-slate-700 hover:border-sky-300 hover:text-sky-700", children: formatSymptomLabel(symptom) }, symptom)))) : (_jsx("p", { className: "text-xs text-slate-500", children: "All symptoms selected." })) }) }))] }), selectedSymptoms.length > 0 && (_jsxs("div", { children: [_jsx("p", { className: "text-xs font-semibold uppercase tracking-wide text-slate-500", children: "Selected" }), _jsx("div", { className: "mt-2 flex flex-wrap gap-2", children: selectedSymptoms.map((symptom) => (_jsxs("span", { className: "inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700", children: [formatSymptomLabel(symptom), _jsx("button", { type: "button", className: "text-slate-500 hover:text-slate-900", onClick: () => onRemoveSymptom(symptom), "aria-label": `Remove ${symptom}`, children: "\u00D7" })] }, symptom))) })] }))] }) }));
};
export default SymptomInput;
