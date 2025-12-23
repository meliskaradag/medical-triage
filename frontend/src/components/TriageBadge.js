import { jsx as _jsx } from "react/jsx-runtime";
const colorMap = {
    low: 'from-triage-low/80 to-emerald-500/80 text-white',
    medium: 'from-triage-medium/90 to-amber-500/90 text-white',
    high: 'from-triage-high/90 to-rose-600/90 text-white',
};
const TriageBadge = ({ level }) => {
    const key = level.toLowerCase();
    const style = colorMap[key] ?? 'from-slate-200 to-slate-300 text-slate-700 border border-slate-200 bg-gradient-to-r';
    return (_jsx("span", { className: `inline-flex items-center rounded-full bg-gradient-to-r px-4 py-1 text-xs font-semibold uppercase shadow ${style}`, children: level }));
};
export default TriageBadge;
