type TriageBadgeProps = {
  level: string;
};

const colorMap: Record<string, string> = {
  low: 'from-triage-low/80 to-emerald-500/80 text-white',
  medium: 'from-triage-medium/90 to-amber-500/90 text-white',
  high: 'from-triage-high/90 to-rose-600/90 text-white',
};

const TriageBadge = ({ level }: TriageBadgeProps) => {
  const key = level.toLowerCase();
  const style =
    colorMap[key] ?? 'from-slate-200 to-slate-300 text-slate-700 border border-slate-200 bg-gradient-to-r';
  return (
    <span
      className={`inline-flex items-center rounded-full bg-gradient-to-r px-4 py-1 text-xs font-semibold uppercase shadow ${style}`}
    >
      {level}
    </span>
  );
};

export default TriageBadge;
