import { useState, useEffect } from "react";
import API from "../../api/axios";

export default function RegistrarNutricionModal({ estudiante, onClose, onSaved }) {
  const [peso, setPeso] = useState("");
  const [talla, setTalla] = useState("");
  const [observaciones, setObservaciones] = useState("");
  const [imc, setImc] = useState(null);
  const [estado, setEstado] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Cargar registro nutricional existente al abrir el modal
  useEffect(() => {
    const fetchExistente = async () => {
      setLoading(true);
      try {
        const res = await API.get(`/nutricion/${estudiante.id_nino}`);
        if (res.data && res.data.length > 0) {
          // Tomar el registro más reciente (último en la lista ordenada ASC)
          const ultimo = res.data[res.data.length - 1];
          setPeso(ultimo.peso ? String(ultimo.peso) : "");
          setTalla(ultimo.talla ? String(ultimo.talla) : "");
          setObservaciones(ultimo.observaciones || "");
        }
      } catch (err) {
        console.error("Error al cargar nutrición existente:", err);
      } finally {
        setLoading(false);
      }
    };
    if (estudiante?.id_nino) {
      fetchExistente();
    }
  }, [estudiante?.id_nino]);

  // Calcular IMC en tiempo real
  useEffect(() => {
    if (peso && talla) {
      const p = parseFloat(peso);
      const t = parseFloat(talla) / 100;
      if (p > 0 && t > 0) {
        const val = parseFloat((p / (t * t)).toFixed(2));
        setImc(val);

        // Lógica de clasificación de estado
        if (val < 14) {
          setEstado("Bajo peso");
        } else if (val >= 14 && val <= 18) {
          setEstado("Normal");
        } else if (val > 18 && val <= 19) {
          setEstado("Riesgo de Sobrepeso");
        } else {
          setEstado("Sobrepeso");
        }
      } else {
        setImc(null);
        setEstado("");
      }
    } else {
      setImc(null);
      setEstado("");
    }
  }, [peso, talla]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!peso || !talla) {
      setError("Por favor ingresa tanto el peso como la estatura.");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess(false);

    try {
      await API.post("/nutricion", {
        id_nino: estudiante.id_nino,
        peso,
        talla,
        observaciones
      });
      setSuccess(true);
      setTimeout(() => {
        if (onSaved) onSaved();
        onClose();
      }, 1500);
    } catch (err) {
      console.error("Error al guardar registro nutricional:", err);
      setError(err.response?.data?.message || "Ocurrió un error al guardar el registro.");
    } finally {
      setSaving(false);
    }
  };

  const initials = `${(estudiante.nombres || "")[0] || ""}${(estudiante.apellidos || "")[0] || ""}`.toUpperCase();

  // Colores para el estado nutricional en tiempo real
  const getEstadoClasses = () => {
    switch (estado) {
      case "Bajo peso":
        return "bg-rose-50 border-rose-200 text-rose-700 ring-rose-300";
      case "Normal":
        return "bg-emerald-50 border-emerald-200 text-emerald-700 ring-emerald-300";
      case "Riesgo de Sobrepeso":
        return "bg-amber-50 border-amber-200 text-amber-700 ring-amber-300";
      case "Sobrepeso":
        return "bg-orange-50 border-orange-200 text-orange-700 ring-orange-300";
      default:
        return "bg-slate-50 border-slate-200 text-slate-500";
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div className="relative bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden flex flex-col animate-fade-in border border-slate-100">
        {/* Header */}
        <div className="bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600 p-5 md:p-6 text-white relative overflow-hidden shrink-0">
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-xl font-black border border-white/20 shadow-lg">
                {initials}
              </div>
              <div>
                <h2 className="text-xl font-extrabold tracking-tight">
                  Registro de Crecimiento
                </h2>
                <p className="text-indigo-100 text-sm font-medium">
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

        {/* Form Body */}
        {loading ? (
          <div className="flex-1 p-8 flex flex-col items-center justify-center min-h-[320px] space-y-3">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent shadow-md"></div>
            <p className="text-slate-500 font-bold text-sm tracking-wide">Cargando expediente nutricional...</p>
          </div>
        ) : (
          <form onSubmit={handleSave} className="flex-1 p-6 md:p-8 space-y-6">
            <div className="grid grid-cols-2 gap-4">
              {/* Peso */}
              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest block">
                  Peso (Kilogramos)
                </label>
                <div className="relative rounded-2xl shadow-sm">
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={peso}
                    onChange={(e) => setPeso(e.target.value)}
                    placeholder="ej: 14.5"
                    className="w-full border border-slate-200 rounded-2xl px-4 py-3.5 pr-12 text-sm font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none transition-all bg-slate-50"
                  />
                  <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-slate-400 font-bold text-xs">
                    kg
                  </div>
                </div>
              </div>

              {/* Talla */}
              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest block">
                  Talla / Estatura
                </label>
                <div className="relative rounded-2xl shadow-sm">
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={talla}
                    onChange={(e) => setTalla(e.target.value)}
                    placeholder="ej: 98"
                    className="w-full border border-slate-200 rounded-2xl px-4 py-3.5 pr-12 text-sm font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none transition-all bg-slate-50"
                  />
                  <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-slate-400 font-bold text-xs">
                    cm
                  </div>
                </div>
              </div>
            </div>

            {/* Real-time Calculation Display */}
            {imc && (
              <div className={`p-5 rounded-3xl border-2 transition-all duration-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fade-in ${getEstadoClasses()}`}>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-wider opacity-70">Cálculo de IMC en vivo</p>
                  <h4 className="text-2xl font-black">{imc} <span className="text-xs font-medium opacity-80">kg/m²</span></h4>
                </div>
                <div className="flex flex-col items-start sm:items-end">
                  <p className="text-[10px] font-black uppercase tracking-wider opacity-70">Estado Diagnosticado</p>
                  <span className="text-sm font-black uppercase tracking-wider">{estado}</span>
                </div>
              </div>
            )}

            {/* Observaciones */}
            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-500 uppercase tracking-widest block">
                Observaciones Nutricionales
              </label>
              <textarea
                rows={3}
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                placeholder="Ej: El niño come muy bien las verduras, se sugiere incrementar la ingesta de legumbres..."
                className="w-full border border-slate-200 rounded-2xl px-4 py-3.5 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none transition-all resize-none bg-slate-50 font-medium text-slate-700"
              />
            </div>

            {/* Messages */}
            {error && (
              <div className="text-rose-600 text-xs font-bold bg-rose-50 px-4 py-3 rounded-2xl border border-rose-200 animate-fade-in">
                ⚠️ {error}
              </div>
            )}
            {success && (
              <div className="text-emerald-600 text-xs font-bold bg-emerald-50 px-4 py-3 rounded-2xl border border-emerald-200 animate-fade-in">
                ✅ Registro nutricional guardado con éxito.
              </div>
            )}

            {/* Footer Action Buttons */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="w-1/2 py-3.5 text-sm font-bold text-slate-500 bg-white border border-slate-200 rounded-2xl hover:bg-slate-50 transition active:scale-95"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving || success}
                className="w-1/2 py-3.5 text-sm font-bold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 rounded-2xl transition-all shadow-lg shadow-indigo-100 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 flex items-center justify-center gap-2"
              >
                {saving ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-b-2 border-white rounded-full"></div>
                    Guardando...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Guardar Datos
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
