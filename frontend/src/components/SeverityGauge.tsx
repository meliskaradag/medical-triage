type SeverityGaugeProps = {
  score: number;
};

const thresholds = {
  low: 10,
  medium: 20,
};

const resolveColor = (score: number) => {
  if (score >= thresholds.medium) {
    return 'bg-triage-high';
  }
  if (score >= thresholds.low) {
    return 'bg-triage-medium';
  }
  return 'bg-triage-low';
};

const resolveLabel = (score: number) => {
  if (score >= thresholds.medium) {
    return 'High Severity';
  }
  if (score >= thresholds.low) {
    return 'Moderate Severity';
  }
  return 'Low Severity';
};

const SeverityGauge = ({ score }: SeverityGaugeProps) => {
  const cappedScore = Math.min(Math.max(score, 0), 40);
  const fillWidth = `${Math.min((cappedScore / 40) * 100, 100)}%`;

  return (
    <div className="rounded-3xl border border-slate-100 bg-white/90 p-6 shadow-xl shadow-slate-200 backdrop-blur">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">Overall severity</p>
          <p className="mt-2 text-4xl font-bold text-slate-900">{score.toFixed(1)}</p>
          <p className="text-sm font-semibold text-slate-500">{resolveLabel(score)}</p>
        </div>
        <div className="flex-1">
          <div className="h-4 rounded-full bg-slate-100">
            <div
              className={`h-4 rounded-full ${resolveColor(score)} transition-all duration-500`}
              style={{ width: fillWidth }}
            />
          </div>
          <div className="mt-2 flex justify-between text-[10px] uppercase tracking-[0.3em] text-slate-400">
            <span>Low</span>
            <span>Medium</span>
            <span>High</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SeverityGauge;
