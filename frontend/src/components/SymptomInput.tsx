import { useMemo, useState } from 'react';

type SymptomInputProps = {
  selectedSymptoms: string[];
  suggestions: string[];
  onAddSymptom: (symptom: string) => void;
  onRemoveSymptom: (symptom: string) => void;
  isLoading?: boolean;
};

const formatSymptomLabel = (value: string) =>
  value
    .split('_')
    .map((chunk) => chunk.charAt(0).toUpperCase() + chunk.slice(1))
    .join(' ');

const SymptomInput = ({
  selectedSymptoms,
  suggestions,
  onAddSymptom,
  onRemoveSymptom,
  isLoading = false,
}: SymptomInputProps) => {
  const [query, setQuery] = useState('');

  const availableSuggestions = useMemo(
    () => suggestions.filter((symptom) => !selectedSymptoms.includes(symptom)),
    [selectedSymptoms, suggestions],
  );

  const filteredSuggestions = useMemo(() => {
    if (!query.trim()) {
      return availableSuggestions.slice(0, 10);
    }
    return availableSuggestions
      .filter((symptom) => symptom.includes(query.toLowerCase()))
      .slice(0, 10);
  }, [availableSuggestions, query]);

  const [isAllVisible, setAllVisible] = useState(false);

  const handleAdd = (symptom: string) => {
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

  return (
    <div className="rounded-2xl border border-slate-100 bg-white/90 p-6 shadow-lg shadow-slate-200 backdrop-blur">
      <div className="flex flex-col gap-4">
        <label className="text-sm font-medium text-slate-600">Enter your symptoms</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                submitFromInput();
              }
            }}
            className="flex-1 rounded-lg border border-slate-200 px-4 py-2 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
            placeholder="Start typing a symptom (e.g., fever, headache)"
            disabled={isLoading}
          />
          <button
            type="button"
            onClick={submitFromInput}
            className="rounded-lg bg-sky-600 px-6 py-2 font-semibold text-white shadow hover:bg-sky-700 disabled:opacity-50"
            disabled={isLoading}
          >
            Add
          </button>
        </div>
        {filteredSuggestions.length > 0 && (
          <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-3 shadow-inner">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Suggested symptoms</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {filteredSuggestions.map((symptom) => (
                <button
                  type="button"
                  key={symptom}
                  onClick={() => handleAdd(symptom)}
                  className="rounded-full border border-sky-200 px-3 py-1 text-xs text-sky-700 hover:bg-sky-50"
                >
                  {formatSymptomLabel(symptom)}
                </button>
              ))}
            </div>
          </div>
        )}
        <div className="rounded-2xl border border-slate-100 bg-white/70 p-3 shadow-inner">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Browse all symptoms</p>
            <button
              type="button"
              className="text-xs font-medium text-sky-600 hover:text-sky-800"
              onClick={() => setAllVisible((prev) => !prev)}
            >
              {isAllVisible ? 'Hide list' : 'Show list'}
            </button>
          </div>
          {isAllVisible && (
            <div className="mt-3 max-h-56 overflow-y-auto rounded-2xl border border-slate-50 bg-slate-50/70 p-3 text-left shadow-inner">
              <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
                {availableSuggestions.length > 0 ? (
                  availableSuggestions.map((symptom) => (
                    <button
                      type="button"
                      key={symptom}
                      onClick={() => handleAdd(symptom)}
                      className="rounded-full border border-slate-200 px-3 py-1 text-left text-xs text-slate-700 hover:border-sky-300 hover:text-sky-700"
                    >
                      {formatSymptomLabel(symptom)}
                    </button>
                  ))
                ) : (
                  <p className="text-xs text-slate-500">All symptoms selected.</p>
                )}
              </div>
            </div>
          )}
        </div>
        {selectedSymptoms.length > 0 && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Selected</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {selectedSymptoms.map((symptom) => (
                <span
                  key={symptom}
                  className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700"
                >
                  {formatSymptomLabel(symptom)}
                  <button
                    type="button"
                    className="text-slate-500 hover:text-slate-900"
                    onClick={() => onRemoveSymptom(symptom)}
                    aria-label={`Remove ${symptom}`}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SymptomInput;
