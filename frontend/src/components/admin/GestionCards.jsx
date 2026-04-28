import React from 'react';
import { PlusIcon, UserGroupIcon, UsersIcon, CloudArrowUpIcon, DocumentTextIcon } from '@heroicons/react/24/outline';

const GestionCards = ({ 
  onCreateDocente, 
  onCreateGrupo, 
  onViewDocentes, 
  onViewGrupos, 
  onReportes,
  onViewAcudientes,
  docentesCount, 
  gruposCount 
}) => {
  const handleImportExcel = () => console.log('Import Excel clicked');
  const handleReportes = onReportes || (() => {});

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

      {/* Card Crear Docente */}
      <div className="group bg-white p-5 rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg hover:border-blue-200 transition-all duration-300 cursor-pointer" onClick={onCreateDocente}>
        <div className="flex items-center justify-between">
          <div className="p-2.5 bg-blue-100 rounded-xl group-hover:bg-blue-200 transition">
            <PlusIcon className="w-6 h-6 text-blue-600" />
          </div>
          <div className="w-1.5 h-1.5 bg-blue-400 rounded-full group-hover:bg-blue-600"></div>
        </div>
        <h3 className="mt-3 text-base font-bold text-gray-900">Crear Docente</h3>
        <p className="mt-0.5 text-xs text-gray-500">Agregar nuevo docente al sistema</p>
      </div>

      {/* Card Crear Grupo */}
      <div className="group bg-white p-5 rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg hover:border-purple-200 transition-all duration-300 cursor-pointer" onClick={onCreateGrupo}>
        <div className="flex items-center justify-between">
          <div className="p-2.5 bg-purple-100 rounded-xl group-hover:bg-purple-200 transition">
            <UsersIcon className="w-6 h-6 text-purple-600" />
          </div>
          <div className="w-1.5 h-1.5 bg-purple-400 rounded-full group-hover:bg-purple-600"></div>
        </div>
        <h3 className="mt-3 text-base font-bold text-gray-900">Crear Grupo</h3>
        <p className="mt-0.5 text-xs text-gray-500">Nuevo grupo de estudiantes</p>
      </div>

      {/* Card Lista Docentes */}
      <div className="group bg-white p-5 rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg hover:border-green-200 transition-all duration-300 cursor-pointer" onClick={onViewDocentes}>
        <div className="flex items-center justify-between">
          <div className="p-2.5 bg-green-100 rounded-xl group-hover:bg-green-200 transition">
            <UserGroupIcon className="w-6 h-6 text-green-600" />
          </div>
          <div className="w-1.5 h-1.5 bg-green-400 rounded-full group-hover:bg-green-600"></div>
        </div>
        <h3 className="mt-3 text-base font-bold text-gray-900">Docentes ({docentesCount || 0})</h3>
        <p className="mt-0.5 text-xs text-gray-500">Ver lista y asignar grupos</p>
      </div>

      {/* Card Lista Grupos */}
      <div className="group bg-white p-5 rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg hover:border-indigo-200 transition-all duration-300 cursor-pointer" onClick={onViewGrupos}>
        <div className="flex items-center justify-between">
          <div className="p-2.5 bg-indigo-100 rounded-xl group-hover:bg-indigo-200 transition">
            <UsersIcon className="w-6 h-6 text-indigo-600" />
          </div>
          <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full group-hover:bg-indigo-600"></div>
        </div>
        <h3 className="mt-3 text-base font-bold text-gray-900">Grupos ({gruposCount || 0})</h3>
        <p className="mt-0.5 text-xs text-gray-500">Ver grupos e importar Excel</p>
      </div>

      {/* Card Reportes */}
      <div className="group bg-white p-5 rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg hover:border-orange-200 transition-all duration-300 cursor-pointer" onClick={handleReportes}>
        <div className="flex items-center justify-between">
          <div className="p-2.5 bg-orange-100 rounded-xl group-hover:bg-orange-200 transition">
            <DocumentTextIcon className="w-6 h-6 text-orange-600" />
          </div>
          <div className="w-1.5 h-1.5 bg-orange-400 rounded-full group-hover:bg-orange-600"></div>
        </div>
        <h3 className="mt-3 text-base font-bold text-gray-900">Reportes</h3>
        <p className="mt-0.5 text-xs text-gray-500">Gestionar reportes de docentes</p>
      </div>

      {/* Card Acudientes */}
      <div className="group bg-white p-5 rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg hover:border-pink-200 transition-all duration-300 cursor-pointer" onClick={onViewAcudientes}>
        <div className="flex items-center justify-between">
          <div className="p-2.5 bg-pink-100 rounded-xl group-hover:bg-pink-200 transition">
            <UsersIcon className="w-6 h-6 text-pink-600" />
          </div>
          <div className="w-1.5 h-1.5 bg-pink-400 rounded-full group-hover:bg-pink-600"></div>
        </div>
        <h3 className="mt-3 text-base font-bold text-gray-900">Acudientes</h3>
        <p className="mt-0.5 text-xs text-gray-500">Vincular padres con estudiantes</p>
      </div>

    </div>
  );
};

export default GestionCards;

