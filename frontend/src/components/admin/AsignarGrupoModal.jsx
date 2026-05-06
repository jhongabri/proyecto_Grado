import React from 'react';
import { CheckIcon, UserGroupIcon } from '@heroicons/react/24/outline';

const AsignarGrupoModal = ({ 
  isOpen, 
  docente, 
  grupos, 
  grupoSeleccionado, // Ahora es un array de IDs
  onGrupoChange, 
  onSubmit, 
  onClose, 
  asignando, 
  error 
}) => {
  if (!isOpen || !docente) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit();
  };

  const handleToggle = (id) => {
    const current = Array.isArray(grupoSeleccionado) ? grupoSeleccionado : [];
    if (current.includes(id)) {
      onGrupoChange(current.filter(i => i !== id));
    } else {
      onGrupoChange([...current, id]);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-50 p-4 transition-all">
      <div className="bg-white rounded-[2rem] p-8 w-full max-w-md mx-4 shadow-2xl border border-slate-100 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full -mr-16 -mt-16 blur-2xl opacity-50"></div>
        
        <div className="flex items-center justify-between mb-6 relative">
          <h3 className="text-2xl font-black text-slate-800 flex items-center">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center mr-3 shadow-lg shadow-indigo-200">
              <UserGroupIcon className="w-6 h-6 text-white" />
            </div>
            Asignar Grupos
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition p-2 hover:bg-slate-50 rounded-xl"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="mb-6 p-4 bg-slate-50 border border-slate-100 rounded-2xl">
          <h4 className="font-bold text-slate-800 text-base">{docente.nombre}</h4>
          <p className="text-xs text-slate-500 font-medium">{docente.correo}</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-2xl mb-6 text-xs font-bold flex items-start gap-2">
            <div className="w-4 h-4 rounded-full bg-red-100 flex items-center justify-center text-[10px] shrink-0 mt-0.5">!</div>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-[11px] font-black text-slate-400 uppercase tracking-[0.15em] mb-4 ml-1">
              Selecciona uno o más grupos
            </label>
            
            <div className="space-y-2 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
              {grupos.map((grupo) => {
                const isSelected = grupoSeleccionado?.includes(grupo.id_grupo);
                return (
                  <label 
                    key={grupo.id_grupo}
                    className={`flex items-center p-4 rounded-2xl border transition-all cursor-pointer group ${
                      isSelected 
                        ? 'border-indigo-600 bg-indigo-50/50 shadow-sm' 
                        : 'border-slate-100 bg-white hover:border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex-1">
                      <p className={`text-sm font-bold ${isSelected ? 'text-indigo-900' : 'text-slate-700'}`}>
                        {grupo.nombre}
                      </p>
                      <p className="text-[10px] text-slate-500 font-medium">
                        {grupo.edad_minima}-{grupo.edad_maxima} años {grupo.horario && `• ${grupo.horario}`}
                      </p>
                    </div>
                    <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                      isSelected 
                        ? 'bg-indigo-600 border-indigo-600' 
                        : 'border-slate-200 group-hover:border-slate-300'
                    }`}>
                      {isSelected && <CheckIcon className="w-4 h-4 text-white stroke-[3]" />}
                    </div>
                    <input
                      type="checkbox"
                      className="hidden"
                      checked={isSelected}
                      onChange={() => handleToggle(grupo.id_grupo)}
                    />
                  </label>
                );
              })}
            </div>
          </div>

          <div className="flex gap-4 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={asignando}
              className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-black py-4 rounded-2xl transition-all text-xs disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={asignando}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-black py-4 rounded-2xl transition-all shadow-xl shadow-indigo-100 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center text-xs gap-2"
            >
              {asignando ? (
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
              ) : (
                'Guardar Cambios'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AsignarGrupoModal;
