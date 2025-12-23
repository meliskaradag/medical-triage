type MiniSparklineProps = {
  values: number[];
  width?: number;
  height?: number;
  color?: string;
};

const MiniSparkline = ({ values, width = 140, height = 40, color = '#0ea5e9' }: MiniSparklineProps) => {
  if (values.length === 0) return <span className="text-xs text-slate-400">No data</span>;
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

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-label="Trend">
      <polyline
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
      {values.map((v, i) => {
        const x = i * step;
        const y = height - ((v - min) / range) * height;
        return <circle key={`${v}-${i}`} cx={x} cy={y} r={2.5} fill={color} />;
      })}
    </svg>
  );
};

export default MiniSparkline;
