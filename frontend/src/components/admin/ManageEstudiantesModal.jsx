import React, { useState, useEffect } from 'react';
import API from '../../api/axios';
import { XMarkIcon, TrashIcon, UserPlusIcon } from '@heroicons/react/24/outline';

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
      setEstudiantes(res.data);
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
      await API.post(`/admin/grupos/${grupo.id_grupo}/estudiantes`, form);
      setSuccessMsg("Estudiante agregado correctamente.");
      setForm({ nombres: "", apellidos: "", fecha_nacimiento: "", documento: "" });
      fetchEstudiantes();
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Error al agregar estudiante.");
    } finally {
      setAdding(false);
    }
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm shadow-2xl">
      <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
          <div>
            <h2 className="text-xl font-bold text-gray-800">Gestionar Estudiantes</h2>
            <p className="text-sm text-gray-500">Grupo: {grupo.nombre}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition">
            <XMarkIcon className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-3 gap-6 bg-white">
          
          {/* Panel Izquierdo: Agregar Manualmente */}
          <div className="md:col-span-1 bg-gray-50 rounded-2xl p-5 border border-gray-200 h-max">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center mb-4">
              <UserPlusIcon className="w-5 h-5 mr-2 text-indigo-500" />
              Agregar Alumno
            </h3>
            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Nombres *</label>
                <input required type="text" name="nombres" value={form.nombres} onChange={handleFormChange} className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Apellidos *</label>
                <input required type="text" name="apellidos" value={form.apellidos} onChange={handleFormChange} className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Fecha Nacimiento *</label>
                <input required type="date" name="fecha_nacimiento" value={form.fecha_nacimiento} onChange={handleFormChange} className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Documento (Opcional)</label>
                <input type="text" name="documento" value={form.documento} onChange={handleFormChange} className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
              </div>
              <button disabled={adding} type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 rounded-xl transition cursor-pointer text-sm disabled:opacity-50">
                {adding ? "Agregando..." : "Registrar al Grupo"}
              </button>
            </form>
          </div>

          {/* Panel Derecho: Lista de Estudiantes */}
          <div className="md:col-span-2">
            {error && (
              <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl mb-4 text-sm border border-red-200">
                {error}
              </div>
            )}
            {successMsg && (
              <div className="bg-emerald-50 text-emerald-600 px-4 py-3 rounded-xl mb-4 text-sm border border-emerald-200">
                {successMsg}
              </div>
            )}

            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Alumnos Inscritos ({estudiantes.length})</h3>
            </div>

            {loading ? (
              <div className="flex justify-center p-10"><div className="animate-spin h-8 w-8 border-b-2 border-indigo-600 rounded-full"></div></div>
            ) : estudiantes.length === 0 ? (
              <div className="text-center p-10 bg-gray-50 border border-gray-200 rounded-2xl">
                <p className="text-gray-500">No hay estudiantes en este grupo.</p>
              </div>
            ) : (
              <div className="overflow-hidden border border-gray-200 rounded-2xl">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-gray-100/50">
                    <tr>
                      <th className="px-4 py-3 font-semibold text-gray-600">Nombre</th>
                      <th className="px-4 py-3 font-semibold text-gray-600">Fecha Nac.</th>
                      <th className="px-4 py-3 font-semibold text-gray-600 text-right">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {estudiantes.map((est) => (
                      <tr key={est.id_matricula} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 text-gray-800">{est.nombres} {est.apellidos}</td>
                        <td className="px-4 py-3 text-gray-500">
                           {est.fecha_nacimiento ? new Date(est.fecha_nacimiento).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button onClick={() => handleDelete(est.id_matricula)} className="text-red-500 hover:text-red-700 p-2 rounded-lg hover:bg-red-50 transition cursor-pointer" title="Retirar del grupo">
                            <TrashIcon className="w-5 h-5 drop-shadow-sm" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default ManageEstudiantesModal;
