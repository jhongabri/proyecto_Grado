import React from 'react';
import { CheckIcon } from '@heroicons/react/24/outline';

const AsignarGrupoModal = ({ 
  isOpen, 
  docente, 
  grupos, 
  grupoSeleccionado, 
  onGrupoChange, 
  onSubmit, 
  onClose, 
  asignando, 
  error 
}) => {
  if (!isOpen || !docente) return null;

  // ✅ FIX 1: Interceptar el submit del form para evitar recarga de página,
  // luego llamar onSubmit que es la función async del padre
  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all">
      <div className="bg-white rounded-2xl p-5 w-full max-w-sm mx-4 shadow-2xl border border-slate-100">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-slate-800 flex items-center">
            <CheckIcon className="w-6 h-6 text-emerald-600 mr-3" />
            Asignar Grupo
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition p-1"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="mb-4 p-3 bg-indigo-50 border border-indigo-100 rounded-xl">
          <h4 className="font-bold text-slate-800 text-sm">{docente.nombre}</h4>
          <p className="text-xs text-slate-500 font-medium">{docente.correo}</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-100 text-red-600 p-3 rounded-xl mb-4 text-[11px] font-medium leading-relaxed">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">
              Seleccionar Grupo
            </label>
            <select
              value={grupoSeleccionado}
              onChange={(e) => onGrupoChange(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none bg-white font-medium"
            >
              <option value="">— Sin grupo asignado —</option>
              {grupos.map((grupo) => (
                <option key={grupo.id_grupo} value={grupo.id_grupo}>
                  {grupo.nombre} ({grupo.edad_minima}-{grupo.edad_maxima} años)
                  {grupo.horario && ` | ${grupo.horario}`}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={asignando}
              className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-2.5 rounded-xl transition text-xs disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={asignando}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-xl transition shadow-lg shadow-indigo-100 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center text-xs"
            >
              {asignando ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  ...
                </>
              ) : (
                'Asignar Grupo'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AsignarGrupoModal;
