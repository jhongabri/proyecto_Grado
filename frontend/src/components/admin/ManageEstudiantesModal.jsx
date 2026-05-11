import React, { useState, useEffect } from 'react';
import API from '../../api/axios';
import { XMarkIcon, TrashIcon, UserPlusIcon, PencilIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import SearchStudentModal from '../SearchStudentModal';

const ManageEstudiantesModal = ({ isOpen, grupo, onClose }) => {
  const [estudiantes, setEstudiantes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const [form, setForm] = useState({
    nombres: "",
    apellidos: "",
    fecha_nacimiento: "",
    documento: ""
  });
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Búsqueda
  const [searchModalOpen, setSearchModalOpen] = useState(false);

  useEffect(() => {
    if (isOpen && grupo) {
      fetchEstudiantes();
    }
  }, [isOpen, grupo]);

  const fetchEstudiantes = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await API.get(`/admin/grupos/${grupo.id_grupo}/estudiantes`);
      // Adaptación al formato del backend { estudiantes: [...] }
      setEstudiantes(res.data.estudiantes || []);
    } catch (err) {
      setError("Error cargando estudiantes");
    } finally {
      setLoading(false);
    }
  };

  const handleFormChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setAdding(true);
    setError("");
    setSuccessMsg("");
    try {
      if (editingId) {
        await API.put(`/admin/grupos/estudiantes/${editingId}`, form);
        setSuccessMsg("Estudiante actualizado correctamente.");
      } else {
        await API.post(`/admin/grupos/${grupo.id_grupo}/estudiantes`, form);
        setSuccessMsg("Estudiante agregado correctamente.");
      }
      setForm({ nombres: "", apellidos: "", fecha_nacimiento: "", documento: "" });
      setEditingId(null);
      fetchEstudiantes();
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Error al procesar estudiante.");
    } finally {
      setAdding(false);
    }
  };

  const handleEditClick = (est) => {
    setEditingId(est.id_nino);
    setForm({
      nombres: est.nombres,
      apellidos: est.apellidos,
      fecha_nacimiento: est.fecha_nacimiento ? est.fecha_nacimiento.split('T')[0] : "",
      documento: est.documento || est.codigo || ""
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm({ nombres: "", apellidos: "", fecha_nacimiento: "", documento: "" });
  };

  const handleDelete = async (id_matricula) => {
    if (!window.confirm("¿Seguro que deseas retirar a este estudiante del grupo?")) return;
    setError("");
    setSuccessMsg("");
    try {
      await API.delete(`/admin/grupos/estudiantes/${id_matricula}`);
      setSuccessMsg("Estudiante retirado del grupo.");
      fetchEstudiantes();
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err) {
      setError("Error retirando estudiante.");
    }
  };

  if (!isOpen || !grupo) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 bg-slate-900/60 backdrop-blur-sm shadow-2xl">
      <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[85vh] overflow-hidden flex flex-col shadow-2xl">
        
        {/* Header */}
        <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between bg-gray-50">
          <div>
            <h2 className="text-lg font-bold text-gray-800 tracking-tight">Gestionar Estudiantes</h2>
            <p className="text-[11px] text-gray-500 font-medium uppercase tracking-wider">Grupo: {grupo.nombre}</p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-200 rounded-full transition-colors active:scale-95">
            <XMarkIcon className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 grid grid-cols-1 md:grid-cols-3 gap-5 bg-white">
          
          {/* Panel Izquierdo: Agregar/Editar Manualmente */}
          <div className="md:col-span-1 bg-slate-50/50 rounded-2xl p-4 border border-slate-200/60 h-max shadow-sm">
            <h3 className="text-sm font-bold text-slate-800 flex items-center mb-4">
              <UserPlusIcon className="w-4 h-4 mr-2 text-indigo-500" />
              {editingId ? "Editar Alumno" : "Agregar Alumno"}
            </h3>
            <form onSubmit={handleAddSubmit} className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 ml-1">Nombres *</label>
                <input required type="text" name="nombres" value={form.nombres} onChange={handleFormChange} className="w-full border border-slate-200 bg-white rounded-xl px-3 py-1.5 text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none transition-all placeholder-slate-300" placeholder="Ej. Juan" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 ml-1">Apellidos *</label>
                <input required type="text" name="apellidos" value={form.apellidos} onChange={handleFormChange} className="w-full border border-slate-200 bg-white rounded-xl px-3 py-1.5 text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none transition-all placeholder-slate-300" placeholder="Ej. Pérez" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 ml-1">Fecha Nacimiento *</label>
                <input required type="date" name="fecha_nacimiento" value={form.fecha_nacimiento} onChange={handleFormChange} className="w-full border border-slate-200 bg-white rounded-xl px-3 py-1.5 text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none transition-all" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 ml-1">Documento (Opcional)</label>
                <input type="text" name="documento" value={form.documento} onChange={handleFormChange} className="w-full border border-slate-200 bg-white rounded-xl px-3 py-1.5 text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none transition-all placeholder-slate-300" placeholder="Ej. 12345678" />
              </div>
              <div className="space-y-2 pt-2">
                <button disabled={adding} type="submit" className={`w-full ${editingId ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-200' : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200'} text-white font-bold py-2 rounded-xl transition-all cursor-pointer text-xs disabled:opacity-50 shadow-lg active:scale-[0.98]`}>
                  {adding ? "Procesando..." : editingId ? "Actualizar Alumno" : "Registrar al Grupo"}
                </button>
                {editingId && (
                  <button type="button" onClick={cancelEdit} className="w-full bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold py-2 rounded-xl transition-all text-xs active:scale-[0.98]">
                    Cancelar Edición
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Panel Derecho: Lista de Estudiantes */}
          <div className="md:col-span-2 flex flex-col min-h-0">
            {error && (
              <div className="bg-red-50 text-red-600 px-3 py-2 rounded-xl mb-3 text-[11px] border border-red-100 flex items-center">
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
                {error}
              </div>
            )}
            {successMsg && (
              <div className="bg-emerald-50 text-emerald-600 px-3 py-2 rounded-xl mb-3 text-[11px] border border-emerald-100 flex items-center">
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                {successMsg}
              </div>
            )}

            <div className="flex items-center justify-between mb-3 px-1">
              <h3 className="text-sm font-bold text-slate-800">Alumnos Inscritos <span className="bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full text-[10px] ml-1">{estudiantes.length}</span></h3>
              <button 
                onClick={() => setSearchModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1 bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white rounded-lg text-[10px] font-black transition-all border border-indigo-100 uppercase tracking-wider"
              >
                <MagnifyingGlassIcon className="w-3.5 h-3.5" />
                Buscar
              </button>
            </div>

            {loading ? (
              <div className="flex-1 flex flex-col items-center justify-center p-10 bg-slate-50/50 rounded-2xl border border-dashed border-slate-300">
                <div className="animate-spin h-6 w-6 border-2 border-indigo-600 border-t-transparent rounded-full mb-2"></div>
                <span className="text-xs text-slate-400 font-medium">Cargando lista...</span>
              </div>
            ) : estudiantes.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center p-10 bg-slate-50/50 border border-dashed border-slate-300 rounded-2xl">
                <p className="text-xs text-slate-400 font-medium">No hay estudiantes en este grupo.</p>
              </div>
            ) : (
              <div className="flex-1 overflow-hidden border border-slate-200 rounded-2xl shadow-sm">
                <div className="overflow-y-auto max-h-[50vh]">
                  <table className="w-full text-left text-xs whitespace-nowrap">
                    <thead className="bg-slate-100 sticky top-0 z-10">
                      <tr>
                        <th className="px-4 py-2.5 font-bold text-slate-600 tracking-wide uppercase text-[9px]">Nombre</th>
                        <th className="px-4 py-2.5 font-bold text-slate-600 tracking-wide uppercase text-[9px]">Fecha Nac.</th>
                        <th className="px-4 py-2.5 font-bold text-slate-600 tracking-wide uppercase text-[9px] text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {estudiantes.map((est) => (
                        <tr key={est.id_matricula} className="hover:bg-indigo-50/30 transition-colors">
                          <td className="px-4 py-2 text-slate-700 font-medium">{est.nombres} {est.apellidos}</td>
                          <td className="px-4 py-2 text-slate-500 font-medium uppercase">
                             {est.fecha_nacimiento ? new Date(est.fecha_nacimiento).toLocaleDateString() : 'N/A'}
                          </td>
                          <td className="px-4 py-2 text-right space-x-0.5">
                            <button onClick={() => handleEditClick(est)} className="text-amber-500 hover:text-amber-600 p-1.5 rounded-lg hover:bg-amber-100/50 transition-all active:scale-90" title="Editar datos">
                              <PencilIcon className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleDelete(est.id_matricula)} className="text-red-500 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-100/50 transition-all active:scale-90" title="Retirar del grupo">
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
      <SearchStudentModal 
        isOpen={searchModalOpen} 
        onClose={() => setSearchModalOpen(false)} 
        role="admin" 
      />
    </div>
  );
};

export default ManageEstudiantesModal;
