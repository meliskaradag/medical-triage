import TriageBadge from './TriageBadge';

type DiseaseCardProps = {
  disease: string;
  probability: number;
  triageLevel: string;
  precautions: string[];
  description?: string | null;
};

const DiseaseCard = ({
  disease,
  probability,
  triageLevel,
  precautions,
  description,
}: DiseaseCardProps) => {
  const probabilityPercent = Math.round(probability * 100);
  const barWidth = `${Math.min(Math.max(probability * 100, 1), 100)}%`;

  return (
    <div className="rounded-3xl border border-slate-100 bg-white/90 p-6 shadow-xl shadow-slate-200 backdrop-blur">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">Likely condition</p>
          <h3 className="text-2xl font-semibold text-slate-900">{disease}</h3>
        </div>
        <TriageBadge level={triageLevel} />
      </div>

      <div className="mt-5 grid gap-4">
        <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
          <p className="text-xs uppercase tracking-wide text-slate-500">Probability</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{probabilityPercent}%</p>
          <div className="mt-3 h-2 rounded-full bg-white/70">
            <div className="h-2 rounded-full bg-gradient-to-r from-sky-500 to-blue-600" style={{ width: barWidth }} />
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-4 text-sm text-slate-600 md:grid-cols-2">
        <div className="rounded-2xl border border-slate-100 bg-white/70 p-4">
          <p className="text-xs uppercase tracking-wide text-slate-500">Recommended Precautions</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-slate-700">
            {precautions.length > 0 ? (
              precautions.map((precaution) => <li key={precaution}>{precaution}</li>)
            ) : (
              <li>No precaution data available</li>
            )}
          </ul>
        </div>
        {description && (
          <div className="rounded-2xl border border-slate-100 bg-white/70 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">Condition insights</p>
            <p className="mt-2 leading-relaxed text-slate-700">{description}</p>
          </div>
        )}
      </div>

      {!description && (
        <div className="mt-4 rounded-2xl border border-slate-100 bg-slate-50/70 p-4 text-sm text-slate-500">
          No disease description is available.
        </div>
      )}
    </div>
  );
};

export default DiseaseCard;
