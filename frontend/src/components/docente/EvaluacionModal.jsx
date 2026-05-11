import { useState, useEffect } from "react";
import API from "../../api/axios";
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

const DIMENSIONES = [
  {
    key: "comunicativa",
    label: "Comunicativa",
    icon: "💬",
    desc: "Expresión oral, comprensión, vocabulario, narración",
    obsKey: "obs_comunicativa",
  },
  {
    key: "cognitiva",
    label: "Cognitiva",
    icon: "🧠",
    desc: "Curiosidad, resolución de problemas, atención, memoria",
    obsKey: "obs_cognitiva",
  },
  {
    key: "socioafectiva",
    label: "Socioafectiva",
    icon: "🤝",
    desc: "Cooperación, empatía, manejo de emociones, normas",
    obsKey: "obs_socioafectiva",
  },
  {
    key: "corporal",
    label: "Corporal",
    icon: "🏃",
    desc: "Coordinación, equilibrio, motricidad fina y gruesa",
    obsKey: "obs_corporal",
  },
  {
    key: "artistica",
    label: "Artística",
    icon: "🎨",
    desc: "Dibujo, pintura, música, juego simbólico, imaginación",
    obsKey: "obs_artistica",
  },
  {
    key: "autonomia",
    label: "Autonomía",
    icon: "⭐",
    desc: "Hábitos, toma de decisiones, autoestima, identidad",
    obsKey: "obs_autonomia",
  },
];

const NIVELES = [
  { value: 1, label: "Inicio", color: "bg-red-500", ring: "ring-red-300", text: "text-red-600", bg: "bg-red-50", border: "border-red-200" },
  { value: 2, label: "En Proceso", color: "bg-amber-500", ring: "ring-amber-300", text: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200" },
  { value: 3, label: "Esperado", color: "bg-emerald-500", ring: "ring-emerald-300", text: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200" },
  { value: 4, label: "Avanzado", color: "bg-blue-500", ring: "ring-blue-300", text: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200" },
];

export default function EvaluacionModal({ estudiante, idGrupo, onClose, onSaved }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState(0);

  // State for each dimension score
  const [scores, setScores] = useState({
    comunicativa: null,
    cognitiva: null,
    socioafectiva: null,
    corporal: null,
    artistica: null,
    autonomia: null,
  });

  // State for observations per dimension
  const [observations, setObservations] = useState({
    obs_comunicativa: "",
    obs_cognitiva: "",
    obs_socioafectiva: "",
    obs_corporal: "",
    obs_artistica: "",
    obs_autonomia: "",
  });

  const [observacionGeneral, setObservacionGeneral] = useState("");

  // Load existing evaluation
  useEffect(() => {
    const loadEvaluacion = async () => {
      try {
        const res = await API.get(`/docente/evaluacion/${estudiante.id_nino}?id_grupo=${idGrupo}`);
        if (res.data) {
          setScores({
            comunicativa: res.data.comunicativa,
            cognitiva: res.data.cognitiva,
            socioafectiva: res.data.socioafectiva,
            corporal: res.data.corporal,
            artistica: res.data.artistica,
            autonomia: res.data.autonomia,
          });
          setObservations({
            obs_comunicativa: res.data.obs_comunicativa || "",
            obs_cognitiva: res.data.obs_cognitiva || "",
            obs_socioafectiva: res.data.obs_socioafectiva || "",
            obs_corporal: res.data.obs_corporal || "",
            obs_artistica: res.data.obs_artistica || "",
            obs_autonomia: res.data.obs_autonomia || "",
          });
          setObservacionGeneral(res.data.observacion_general || "");
        }
      } catch (err) {
        console.error("Error loading evaluation:", err);
      } finally {
        setLoading(false);
      }
    };
    loadEvaluacion();
  }, [estudiante.id_nino, idGrupo]);

  const handleScoreChange = (dimension, value) => {
    setScores((prev) => ({ ...prev, [dimension]: value }));
    setSaved(false);
  };

  const handleObsChange = (key, value) => {
    setObservations((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const handleSave = async () => {
    // Validate all dimensions have a score
    const incomplete = DIMENSIONES.filter((d) => !scores[d.key]);
    if (incomplete.length > 0) {
      setError(`Faltan dimensiones por calificar: ${incomplete.map((d) => d.label).join(", ")}`);
      return;
    }

    setSaving(true);
    setError("");
    try {
      await API.post("/docente/evaluacion", {
        id_nino: estudiante.id_nino,
        id_grupo: idGrupo,
        ...scores,
        ...observations,
        observacion_general: observacionGeneral,
      });
      setSaved(true);
      if (onSaved) onSaved();
    } catch (err) {
      console.error(err);
      setError("Error al guardar la evaluación. Intenta de nuevo.");
    } finally {
      setSaving(false);
    }
  };

  // Build radar chart data
  const radarData = DIMENSIONES.map((d) => ({
    dimension: d.label,
    valor: scores[d.key] || 0,
    fullMark: 4,
  }));

  const hasAnyScore = Object.values(scores).some((v) => v !== null);
  const allComplete = DIMENSIONES.every((d) => scores[d.key] !== null);

  // Compute average
  const avgScore = allComplete
    ? (Object.values(scores).reduce((a, b) => a + b, 0) / 6).toFixed(1)
    : null;

  const getNivelLabel = (val) => NIVELES.find((n) => n.value === val)?.label || "—";
  const getNivelColor = (val) => NIVELES.find((n) => n.value === val) || NIVELES[0];

  const initials = `${(estudiante.nombres || "")[0] || ""}${(estudiante.apellidos || "")[0] || ""}`.toUpperCase();

  const currentDim = DIMENSIONES[activeTab];

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[92vh] overflow-hidden flex flex-col animate-fade-in">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 via-blue-600 to-violet-600 p-4 md:p-5 text-white relative overflow-hidden shrink-0">
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-xl font-black border border-white/20 shadow-lg">
                {initials}
              </div>
              <div>
                <h2 className="text-xl font-extrabold tracking-tight">
                  Evaluación de Desarrollo
                </h2>
                <p className="text-blue-100 text-sm font-medium">
                  {estudiante.nombres} {estudiante.apellidos}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all active:scale-90 border border-white/10"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 md:p-5 custom-scrollbar">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin h-8 w-8 border-b-2 border-indigo-600 rounded-full"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              {/* Left: Dimension tabs + content */}
              <div className="lg:col-span-3 space-y-4">
                {/* Dimension pills */}
                <div className="flex flex-wrap gap-2">
                  {DIMENSIONES.map((dim, idx) => {
                    const hasScore = scores[dim.key] !== null;
                    const nivel = getNivelColor(scores[dim.key]);
                    return (
                      <button
                        key={dim.key}
                        onClick={() => setActiveTab(idx)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 flex items-center gap-2 border ${
                          activeTab === idx
                            ? "bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-200 scale-105"
                            : hasScore
                            ? `${nivel.bg} ${nivel.text} ${nivel.border}`
                            : "bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200"
                        }`}
                      >
                        <span>{dim.icon}</span>
                        <span className="hidden sm:inline">{dim.label}</span>
                        {hasScore && activeTab !== idx && (
                          <span className={`w-2 h-2 rounded-full ${nivel.color}`}></span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Active dimension card */}
                <div className="bg-white border border-slate-200 rounded-2xl p-4 md:p-5 shadow-sm">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">{currentDim.icon}</span>
                    <div>
                      <h3 className="text-base font-black text-slate-800">
                        {currentDim.label}
                      </h3>
                      <p className="text-[11px] text-slate-400 font-medium leading-tight">
                        {currentDim.desc}
                      </p>
                    </div>
                  </div>

                  {/* Level selection */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
                    {NIVELES.map((nivel) => {
                      const isSelected = scores[currentDim.key] === nivel.value;
                      return (
                        <button
                          key={nivel.value}
                          onClick={() => handleScoreChange(currentDim.key, nivel.value)}
                          className={`relative p-2.5 md:p-3 rounded-2xl border-2 transition-all duration-300 flex flex-col items-center gap-2 group ${
                            isSelected
                              ? `${nivel.border} ${nivel.bg} ring-2 ${nivel.ring} scale-105 shadow-lg`
                              : "border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50"
                          }`}
                        >
                          <div
                            className={`w-7 h-7 rounded-full flex items-center justify-center text-white font-black text-xs transition-all ${
                              isSelected ? nivel.color : "bg-slate-200 text-slate-400"
                            }`}
                          >
                            {nivel.value}
                          </div>
                          <span
                            className={`text-xs font-bold text-center ${
                              isSelected ? nivel.text : "text-slate-400"
                            }`}
                          >
                            {nivel.label}
                          </span>
                          {isSelected && (
                            <div className="absolute -top-1 -right-1 w-5 h-5 bg-white rounded-full flex items-center justify-center shadow-sm border border-slate-100">
                              <svg className={`w-3 h-3 ${nivel.text}`} fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Observation for this dimension */}
                  <div className="mt-5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">
                      Observación — {currentDim.label}
                    </label>
                    <textarea
                      rows={2}
                      value={observations[currentDim.obsKey]}
                      onChange={(e) => handleObsChange(currentDim.obsKey, e.target.value)}
                      placeholder={`¿Qué destaca o necesita refuerzo en ${currentDim.label.toLowerCase()}?`}
                      className="w-full border border-slate-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none transition-all resize-none bg-slate-50"
                    />
                  </div>

                  {/* Navigation */}
                  <div className="flex justify-between mt-4">
                    <button
                      onClick={() => setActiveTab(Math.max(0, activeTab - 1))}
                      disabled={activeTab === 0}
                      className="px-4 py-2 text-sm font-bold text-slate-500 bg-slate-100 rounded-xl hover:bg-slate-200 transition disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      ← Anterior
                    </button>
                    <button
                      onClick={() => setActiveTab(Math.min(DIMENSIONES.length - 1, activeTab + 1))}
                      disabled={activeTab === DIMENSIONES.length - 1}
                      className="px-4 py-2 text-sm font-bold text-indigo-600 bg-indigo-50 rounded-xl hover:bg-indigo-100 transition disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      Siguiente →
                    </button>
                  </div>
                </div>

                {/* General observation */}
                <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">
                    📝 Observación General
                  </label>
                  <textarea
                    rows={3}
                    value={observacionGeneral}
                    onChange={(e) => { setObservacionGeneral(e.target.value); setSaved(false); }}
                    placeholder="Comentarios generales sobre el desarrollo integral del niño..."
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none transition-all resize-none bg-slate-50"
                  />
                </div>
              </div>

              {/* Right: Radar chart + summary */}
              <div className="lg:col-span-2 space-y-4">
                {/* Radar chart */}
                <div className="bg-gradient-to-br from-slate-50 to-indigo-50/30 border border-slate-200 rounded-2xl p-5 shadow-sm">
                  <h4 className="text-sm font-black text-slate-700 mb-3 flex items-center gap-2">
                    <span className="w-7 h-7 bg-indigo-100 rounded-lg flex items-center justify-center text-xs">📊</span>
                    Perfil de Desarrollo
                  </h4>
                  {hasAnyScore ? (
                    <ResponsiveContainer width="100%" height={200}>
                      <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="70%">
                        <PolarGrid stroke="#e2e8f0" />
                        <PolarAngleAxis
                          dataKey="dimension"
                          tick={{ fill: "#64748b", fontSize: 10, fontWeight: 700 }}
                        />
                        <PolarRadiusAxis
                          angle={90}
                          domain={[0, 4]}
                          tick={{ fill: "#94a3b8", fontSize: 9 }}
                          tickCount={5}
                        />
                        <Radar
                          name="Desarrollo"
                          dataKey="valor"
                          stroke="#6366f1"
                          fill="#6366f1"
                          fillOpacity={0.25}
                          strokeWidth={2}
                        />
                        <Tooltip
                          formatter={(value) => [getNivelLabel(value), "Nivel"]}
                          contentStyle={{
                            borderRadius: "12px",
                            border: "1px solid #e2e8f0",
                            fontSize: "12px",
                            fontWeight: "bold",
                          }}
                        />
                      </RadarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-slate-300">
                      <svg className="w-12 h-12 mb-3 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                      <p className="text-xs font-bold">Califica las dimensiones para ver el gráfico</p>
                    </div>
                  )}
                </div>

                {/* Dimension summary */}
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                  <h4 className="text-sm font-black text-slate-700 mb-3">Resumen por Dimensión</h4>
                  <div className="space-y-2">
                    {DIMENSIONES.map((dim) => {
                      const val = scores[dim.key];
                      const nivel = getNivelColor(val);
                      return (
                        <div
                          key={dim.key}
                          className="flex items-center justify-between py-1.5 px-2 rounded-xl hover:bg-slate-50 transition"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-base">{dim.icon}</span>
                            <span className="text-xs font-bold text-slate-700">{dim.label}</span>
                          </div>
                          {val ? (
                            <span
                              className={`text-[10px] font-black px-3 py-1 rounded-full ${nivel.bg} ${nivel.text} ${nivel.border} border`}
                            >
                              {getNivelLabel(val)}
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-slate-300 px-3 py-1 rounded-full bg-slate-100 border border-slate-200">
                              Sin evaluar
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {avgScore && (
                    <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-500">Promedio General</span>
                      <span className="text-lg font-black text-indigo-600">{avgScore} / 4</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <div>
            {error && (
              <p className="text-red-600 text-xs font-bold bg-red-50 px-4 py-2 rounded-xl border border-red-200">
                ⚠️ {error}
              </p>
            )}
            {saved && (
              <p className="text-emerald-600 text-xs font-bold bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-200">
                ✅ Evaluación guardada exitosamente
              </p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-5 py-2.5 text-sm font-bold text-slate-500 bg-white border border-slate-200 rounded-xl hover:bg-slate-100 transition"
            >
              Cerrar
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !allComplete}
              className="px-6 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-indigo-600 to-violet-600 rounded-xl hover:from-indigo-700 hover:to-violet-700 transition-all shadow-lg shadow-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 flex items-center gap-2"
            >
              {saving ? (
                <>
                  <div className="animate-spin h-4 w-4 border-b-2 border-white rounded-full"></div>
                  Guardando...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  Guardar Evaluación
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
