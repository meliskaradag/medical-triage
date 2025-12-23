type SymptomAuditProps = {
  normalized: string[];
  unmapped: string[];
};

const formatSymptomLabel = (value: string) =>
  value
    .split('_')
    .map((chunk) => chunk.charAt(0).toUpperCase() + chunk.slice(1))
    .join(' ');

const SymptomAudit = ({ normalized, unmapped }: SymptomAuditProps) => {
  if (normalized.length === 0 && unmapped.length === 0) {
    return null;
  }

  const uniqueNormalized = Array.from(new Set(normalized));
  const recognized = uniqueNormalized.filter((symptom) => !unmapped.includes(symptom));
  const coverage = uniqueNormalized.length
    ? Math.round((recognized.length / uniqueNormalized.length) * 100)
    : 0;

  return (
    <div className="rounded-3xl border border-slate-100 bg-gradient-to-br from-white to-slate-50/70 p-6 shadow-lg shadow-slate-200">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-slate-500">Model input audit</p>
          <h3 className="text-xl font-semibold text-slate-900">How your symptoms were understood</h3>
          <p className="text-sm text-slate-600">
            Normalized vocabulary the model actually used, plus anything it could not map.
          </p>
        </div>
        <div className="min-w-[220px] rounded-2xl border border-slate-100 bg-white/80 p-4 text-right shadow-inner">
          <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Coverage</p>
          <p className="text-3xl font-bold text-slate-900">{coverage}%</p>
          <p className="text-xs text-slate-500">{recognized.length} mapped / {uniqueNormalized.length} provided</p>
          <div className="mt-3 h-2 rounded-full bg-slate-100">
            <div
              className="h-2 rounded-full bg-gradient-to-r from-emerald-500 to-sky-500"
              style={{ width: `${coverage}%` }}
            />
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4 shadow-inner">
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Mapped symptoms</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {recognized.length > 0 ? (
              recognized.map((symptom) => (
                <span
                  key={symptom}
                  className="rounded-full bg-white px-3 py-1 text-xs font-medium text-emerald-700 shadow"
                >
                  {formatSymptomLabel(symptom)}
                </span>
              ))
            ) : (
              <p className="text-xs text-slate-500">No symptoms were mapped.</p>
            )}
          </div>
        </div>
        <div className="rounded-2xl border border-amber-100 bg-amber-50/60 p-4 shadow-inner">
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-800">Not recognized</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {unmapped.length > 0 ? (
              unmapped.map((symptom) => (
                <span
                  key={symptom}
                  className="rounded-full bg-white px-3 py-1 text-xs font-medium text-amber-800 shadow"
                >
                  {formatSymptomLabel(symptom)}
                </span>
              ))
            ) : (
              <p className="text-xs text-slate-500">All symptoms were used by the model.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SymptomAudit;
