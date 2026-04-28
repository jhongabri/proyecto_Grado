import React, { useState } from 'react';
import API from '../../api/axios';
import { PlusIcon, CalendarIcon } from '@heroicons/react/24/outline';
import ExcelImportModal from './ExcelImportModal';

const CreateGrupoForm = ({ onSuccess, onCancel, onRefreshGrupos }) => {
  const [nombre, setNombre] = useState("");
  const [edadMin, setEdadMin] = useState("");
  const [edadMax, setEdadMax] = useState("");
  const [horario, setHorario] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [newGrupo, setNewGrupo] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    if (parseInt(edadMin) >= parseInt(edadMax)) {
      setError("Edad mínima debe ser menor que edad máxima");
      setLoading(false);
      return;
    }

    try {
      const res = await API.post("/grupos", {
        nombre,
        edad_minima: parseInt(edadMin),
        edad_maxima: parseInt(edadMax),
        horario: horario || null
      });

      setSuccess("Grupo creado correctamente");
      setNombre("");
      setEdadMin("");
      setEdadMax("");
      setHorario("");

      if (onSuccess) onSuccess();
      if (onRefreshGrupos) onRefreshGrupos();

      setNewGrupo(res.data);
      setShowImportModal(true);

      setTimeout(() => setSuccess(""), 3000);
    } catch (error) {
      setError(error.response?.data?.message || "Error creando grupo");
    } finally {
      setLoading(false);
    }
  };

  return (
<div className="bg-white p-5 rounded-2xl shadow-lg border border-slate-100 max-w-md mx-auto">
      <div className="text-center mb-5">
        <div className="w-14 h-14 bg-purple-50 rounded-2xl flex items-center justify-center mx-auto mb-3 border border-purple-100/50">
          <CalendarIcon className="w-7 h-7 text-purple-600" />
        </div>
        <h2 className="text-xl font-bold text-slate-800 mb-1">Crear Grupo</h2>
        <p className="text-[11px] text-slate-500 font-medium">Define el grupo de estudiantes</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-100 text-red-600 p-3 rounded-xl mb-4 text-[11px] font-medium leading-relaxed">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-emerald-50 border border-emerald-100 text-emerald-600 p-3 rounded-xl mb-4 text-[11px] font-medium leading-relaxed">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        <div className="md:col-span-2">
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">
            Nombre del Grupo *
          </label>
          <input
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            required
            className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all outline-none"
            placeholder="Ej: Maternal A"
          />
        </div>

        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">
            Edad Mínima *
          </label>
          <input
            type="number"
            min="0"
            max="99"
            value={edadMin}
            onChange={(e) => setEdadMin(e.target.value)}
            required
            className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all outline-none"
            placeholder="2"
          />
        </div>

        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">
            Edad Máxima *
          </label>
          <input
            type="number"
            min="1"
            max="99"
            value={edadMax}
            onChange={(e) => setEdadMax(e.target.value)}
            required
            className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all outline-none"
            placeholder="4"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">
            Horario (opcional)
          </label>
          <input
            type="text"
            value={horario}
            onChange={(e) => setHorario(e.target.value)}
            className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all outline-none"
            placeholder="Ej: 8:00am - 12:00pm"
          />
        </div>

        <div className="md:col-span-2 flex gap-3 pt-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-2 rounded-xl transition text-xs disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 rounded-xl transition shadow-lg shadow-purple-100 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center text-xs"
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                ...
              </>
            ) : (
                "Crear Grupo"
            )}
          </button>
        </div>
      </form>

      {showImportModal && newGrupo && (
        <ExcelImportModal
          isOpen={showImportModal}
          grupo={newGrupo}
          onClose={() => setShowImportModal(false)}
          onSuccess={onRefreshGrupos}
        />
      )}
    </div>
  );
};

export default CreateGrupoForm;

