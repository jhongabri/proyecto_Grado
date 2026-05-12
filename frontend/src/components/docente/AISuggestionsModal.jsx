import React, { useState, useEffect } from 'react';
import { SparklesIcon, XMarkIcon, LightBulbIcon, ArrowPathIcon } from "@heroicons/react/24/outline";
import API from "../../api/axios";

export default function AISuggestionsModal({ isOpen, onClose, studentId, groupId }) {
  const [suggestions, setSuggestions] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen && studentId && groupId) {
      fetchSuggestions();
    }
  }, [isOpen, studentId, groupId]);

  const fetchSuggestions = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await API.get(`/docente/ai-suggestions?id_nino=${studentId}&id_grupo=${groupId}`);
      setSuggestions(res.data.suggestions);
    } catch (err) {
      console.error("AI Suggestions Error:", err);
      setError(err.response?.data?.message || "No se pudieron obtener sugerencias en este momento.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        onClick={onClose}
      ></div>

      {/* Modal Content */}
      <div className="relative bg-white w-full max-w-2xl max-h-[90vh] flex flex-col rounded-[2.5rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300 border border-slate-200">
        
        <div className="relative p-6 md:p-10 overflow-y-auto custom-scrollbar">
          {/* Close button */}
          <button 
            onClick={onClose}
            className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>

          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <div className="p-4 bg-gradient-to-tr from-violet-600 to-indigo-600 rounded-2xl shadow-xl shadow-violet-100">
              <LightBulbIcon className="w-8 h-8 text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">Sugerencias Pedagógicas IA</h3>
              <p className="text-xs uppercase tracking-widest font-bold text-violet-500/70">Asistente para el Fortalecimiento Infantil</p>
            </div>
          </div>

          {/* Content Body */}
          <div className="min-h-[250px]">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 space-y-6">
                <div className="relative w-16 h-16">
                  <div className="absolute inset-0 rounded-full border-t-2 border-violet-600 animate-spin"></div>
                  <SparklesIcon className="absolute inset-0 m-auto w-6 h-6 text-violet-600 animate-pulse" />
                </div>
                <p className="text-center text-sm font-bold text-violet-500 animate-pulse">
                  Analizando el radar de desarrollo...
                </p>
              </div>
            ) : error ? (
              <div className="text-center py-12 bg-red-50 rounded-3xl border border-red-100 px-6">
                <h4 className="text-lg font-bold text-red-900 mb-2">¡Ups!</h4>
                <p className="text-sm text-red-700/80 mb-6">{error}</p>
                <button 
                  onClick={fetchSuggestions}
                  className="flex items-center gap-2 mx-auto px-6 py-2.5 bg-red-500 text-white rounded-xl font-bold text-sm hover:bg-red-600 transition-colors shadow-lg shadow-red-100"
                >
                  <ArrowPathIcon className="w-4 h-4" /> Reintentar
                </button>
              </div>
            ) : (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="prose prose-violet prose-lg max-w-none text-slate-600 leading-relaxed font-medium whitespace-pre-line bg-slate-50/50 p-6 rounded-3xl border border-slate-100">
                  {suggestions}
                </div>
                
                <div className="mt-8 p-6 bg-violet-50 rounded-2xl border border-violet-100 flex items-start gap-4">
                  <div className="p-2 bg-white rounded-lg shadow-sm">
                    <SparklesIcon className="w-5 h-5 text-violet-600" />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-widest font-black text-violet-400 mb-1">Nota para el docente</p>
                    <p className="text-xs text-violet-900/70 font-semibold leading-relaxed">
                      Estas actividades son sugerencias basadas en datos. Aplica tu criterio pedagógico para adaptarlas a la dinámica de tu aula.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          {!loading && (
            <div className="mt-10 flex justify-center border-t border-slate-100 pt-8">
              <button 
                onClick={onClose}
                className="px-12 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-black transition-all shadow-xl active:scale-95"
              >
                Cerrar Sugerencias
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
