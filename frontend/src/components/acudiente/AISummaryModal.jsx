import React, { useState, useEffect } from 'react';
import { SparklesIcon, XMarkIcon, ChatBubbleLeftRightIcon, ArrowPathIcon } from "@heroicons/react/24/outline";
import API from "../../api/axios";

export default function AISummaryModal({ isOpen, onClose }) {
  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      generateSummary();
    }
  }, [isOpen]);

  const generateSummary = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await API.get("/acudiente/ai-summary");
      setSummary(res.data.summary);
    } catch (err) {
      console.error("AI Error:", err);
      setError(err.response?.data?.message || "No se pudo conectar con la magia de la IA.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-md transition-opacity"
        onClick={onClose}
      ></div>

      {/* Modal Content */}
      <div className="relative bg-white/90 backdrop-blur-2xl border border-white/50 w-full max-w-2xl max-h-[90vh] flex flex-col rounded-[3rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
        
        {/* Animated border/glow */}
        <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-[3rem] blur opacity-10 animate-pulse pointer-events-none"></div>

        <div className="relative p-6 md:p-12 overflow-y-auto overflow-x-hidden">
          {/* Close button */}
          <button 
            onClick={onClose}
            className="absolute top-8 right-8 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>

          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <div className="p-4 bg-gradient-to-tr from-indigo-600 to-purple-600 rounded-2xl shadow-xl shadow-indigo-200">
              <SparklesIcon className="w-8 h-8 text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">Resumen Mágico con IA</h3>
              <p className="text-xs uppercase tracking-widest font-bold text-indigo-500/70">Análisis Pedagógico Inteligente</p>
            </div>
          </div>

          {/* Content Body */}
          <div className="min-h-[200px] flex flex-col justify-center">
            {loading ? (
              <div className="space-y-6 py-12">
                <div className="flex justify-center mb-4">
                  <div className="relative w-16 h-16">
                    <div className="absolute inset-0 rounded-full border-t-2 border-indigo-600 animate-spin"></div>
                    <SparklesIcon className="absolute inset-0 m-auto w-6 h-6 text-indigo-600 animate-pulse" />
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="h-4 bg-slate-100 rounded-full w-3/4 mx-auto animate-pulse"></div>
                  <div className="h-4 bg-slate-100 rounded-full w-5/6 mx-auto animate-pulse"></div>
                  <div className="h-4 bg-slate-100 rounded-full w-2/3 mx-auto animate-pulse"></div>
                </div>
                <p className="text-center text-sm font-bold text-indigo-500 animate-bounce pt-4">
                  Interpretando el desarrollo de tu pequeño...
                </p>
              </div>
            ) : error ? (
              <div className="text-center py-12 bg-red-50/50 rounded-3xl border border-red-100 px-6">
                <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <XMarkIcon className="w-8 h-8" />
                </div>
                <h4 className="text-lg font-bold text-red-900 mb-2">¡Ups! Algo salió mal</h4>
                <p className="text-sm text-red-700/80 mb-6">{error}</p>
                <button 
                  onClick={generateSummary}
                  className="flex items-center gap-2 mx-auto px-6 py-2.5 bg-red-500 text-white rounded-xl font-bold text-sm hover:bg-red-600 transition-colors shadow-lg shadow-red-100"
                >
                  <ArrowPathIcon className="w-4 h-4" /> Reintentar Magia
                </button>
              </div>
            ) : (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="relative">
                  <div className="absolute -left-6 -top-2 text-6xl text-indigo-100 opacity-60 font-serif leading-none">“</div>
                  <div className="prose prose-indigo prose-lg max-w-none text-slate-600 leading-relaxed font-medium italic whitespace-pre-line px-4">
                    {summary}
                  </div>
                  <div className="absolute -right-2 -bottom-4 text-6xl text-indigo-100 opacity-60 font-serif leading-none">”</div>
                </div>
                
                <div className="mt-12 p-6 bg-indigo-50/50 rounded-3xl border border-indigo-100 flex items-start gap-4">
                  <div className="p-2 bg-indigo-100 rounded-lg shrink-0">
                    <ChatBubbleLeftRightIcon className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.2em] font-black text-indigo-400 mb-1">Consejo CDI</p>
                    <p className="text-xs text-indigo-900/70 font-semibold leading-relaxed">
                      Este resumen ha sido generado para apoyarte en el seguimiento del crecimiento integral de tu hijo.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          {!loading && (
            <div className="mt-12 flex justify-center">
              <button 
                onClick={onClose}
                className="px-12 py-4 bg-slate-900 text-white rounded-[1.5rem] font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl active:scale-95"
              >
                Entendido
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
