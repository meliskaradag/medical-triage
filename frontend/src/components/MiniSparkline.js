import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
const MiniSparkline = ({ values, width = 140, height = 40, color = '#0ea5e9' }) => {
    if (values.length === 0)
        return _jsx("span", { className: "text-xs text-slate-400", children: "No data" });
    const max = Math.max(...values, 1);
    const min = Math.min(...values, 0);
    const range = Math.max(max - min, 1);
    const step = width / Math.max(values.length - 1, 1);
    const points = values
        .map((v, i) => {
        const x = i * step;
        const y = height - ((v - min) / range) * height;
        return `${x},${y}`;
    })
        .join(' ');
    return (_jsxs("svg", { width: width, height: height, viewBox: `0 0 ${width} ${height}`, "aria-label": "Trend", children: [_jsx("polyline", { fill: "none", stroke: color, strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", points: points }), values.map((v, i) => {
                const x = i * step;
                const y = height - ((v - min) / range) * height;
                return _jsx("circle", { cx: x, cy: y, r: 2.5, fill: color }, `${v}-${i}`);
            })] }));
};
export default MiniSparkline;
