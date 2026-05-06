import React from 'react';
import { PencilSquareIcon } from '@heroicons/react/24/outline';

const DocentesList = ({ 
  docentes, 
  grupos, 
  onAsignarGrupo, 
  onBack,
  loading 
}) => {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-bold text-slate-800 flex items-center">
          <svg className="w-6 h-6 mr-3 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
          Docentes ({docentes.length})
        </h3>
        <button
          onClick={onBack}
          className="inline-flex items-center px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold rounded-lg transition"
        >
          Volver
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
          <span className="ml-3 text-gray-500">Cargando...</span>
        </div>
      ) : docentes.length === 0 ? (
        <div className="text-center py-12">
          <svg className="mx-auto h-16 w-16 text-gray-400 mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <p className="text-lg text-gray-500">No hay docentes registrados</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Nombre</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Correo</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Estado</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">Grupo</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {docentes.map((docente) => (
                <tr key={docente.id_usuario} className="hover:bg-slate-50 transition-colors">
  <td className="px-4 py-2.5 whitespace-nowrap font-bold text-slate-800 text-xs">
                    {docente.nombre}
                  </td>
                  <td className="px-4 py-2.5 whitespace-nowrap text-xs text-slate-600 font-medium">
                    {docente.correo}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
                      docente.estado 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {docente.estado ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-center">
                    <div className="flex flex-wrap justify-center gap-1.5 max-w-[200px] mx-auto">
                      {docente.grupos && docente.grupos.length > 0 ? (
                        docente.grupos.map((g, idx) => (
                          <span 
                            key={idx} 
                            className="inline-flex items-center px-2.5 py-0.5 bg-indigo-100 text-indigo-700 text-[10px] font-bold rounded-lg border border-indigo-200"
                          >
                            {g.nombre}
                          </span>
                        ))
                      ) : (
                        <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Sin asignar</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-center text-sm font-medium">
                    <button
                      onClick={() => onAsignarGrupo(docente)}
                      className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-xl transition shadow-sm"
                    >
                      <PencilSquareIcon className="w-4 h-4 mr-1" />
                      Asignar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default DocentesList;

