import React, { useState, useCallback } from 'react';
import API from '../../api/axios';
import { CloudArrowUpIcon, XMarkIcon, UsersIcon } from '@heroicons/react/24/outline';

const ExcelImportModal = ({ 
  isOpen, 
  grupo, 
  onClose, 
  onSuccess
}) => {
  const [file, setFile] = useState(null);
  const [importError, setImportError] = useState("");
  const [importSuccess, setImportSuccess] = useState("");
  const [estudiantesLoading, setEstudiantesLoading] = useState(false);
  const [estudiantes, setEstudiantes] = useState([]);
  const [uploading, setUploading] = useState(false);

  // Fetch estudiantes for preview
  React.useEffect(() => {
    if (isOpen && grupo?.id_grupo) {
      setEstudiantesLoading(true);
      API.get(`/admin/grupos/${grupo.id_grupo}/estudiantes`)
        .then(res => setEstudiantes(res.data.estudiantes || []))
        .catch(() => setEstudiantes([]))
        .finally(() => setEstudiantesLoading(false));
    }
  }, [isOpen, grupo?.id_grupo]);

  const handleFileChange = (e) => {
    setFile(e.target.files?.[0] || null);
    setImportError("");
  };

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && (droppedFile.name.endsWith('.xlsx') || droppedFile.name.endsWith('.xls'))) {
      setFile(droppedFile);
      setImportError("");
    } else {
      setImportError("Solo archivos Excel (.xlsx, .xls) son permitidos");
    }
  }, []);

  const handleImport = async (e) => {
    e.preventDefault();
    if (!file) {
      setImportError("Selecciona un archivo Excel");
      return;
    }

    const formData = new FormData();
    formData.append("excel", file);
    formData.append("id_grupo", grupo.id_grupo);

    setUploading(true);
    setImportError("");
    setImportSuccess("");

    try {
      const res = await API.post("/admin/grupos/importar", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      setImportSuccess(`✅ Importación completada: ${res.data.resultados.creados} creados, ${res.data.resultados.existentes} existentes`);
      
      if (onSuccess) onSuccess();
      
      setTimeout(() => setImportSuccess(""), 5000);
    } catch (error) {
      setImportError(error.response?.data?.message || "Error en la importación");
    } finally {
      setUploading(false);
    }
  };

  if (!isOpen || !grupo) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all">
      <div className="bg-white rounded-2xl p-5 w-full max-w-xl max-h-[85vh] overflow-y-auto shadow-2xl border border-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center mr-3 border border-emerald-100">
              <CloudArrowUpIcon className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">Importar Estudiantes</h2>
              <p className="text-xs text-slate-500 font-medium">{grupo.nombre}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Mensajes */}
        {importError && (
          <div className="bg-red-50 border border-red-100 text-red-600 p-3 rounded-xl mb-4 text-[11px] font-medium leading-relaxed">
             {importError}
          </div>
        )}
        {importSuccess && (
          <div className="bg-emerald-50 border border-emerald-100 text-emerald-600 p-3 rounded-xl mb-4 text-[11px] font-medium leading-relaxed">
            {importSuccess}
          </div>
        )}

        {/* Upload Area */}
        <form onSubmit={handleImport} className="mb-6">
          <div 
            className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all duration-300 ${
              file ? 'border-emerald-400 bg-emerald-50/50' : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
            }`}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            <input
              id="excel-file"
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileChange}
              className="hidden"
              required
            />
            <label htmlFor="excel-file" className="cursor-pointer block">
              <CloudArrowUpIcon className={`w-12 h-12 mx-auto mb-3 ${file ? 'text-emerald-600' : 'text-slate-300'}`} />
              
              {file ? (
                <div>
                  <p className="text-sm font-bold text-emerald-600 mb-0.5 mt-2 truncate max-w-xs mx-auto">{file.name}</p>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Listo para procesar</p>
                </div>
              ) : (
                <div>
                  <p className="text-sm font-bold text-slate-800 mb-0.5">Arrastra tu archivo Excel</p>
                  <p className="text-xs text-slate-500">Columnas: nombre, apellido, codigo, edad</p>
                </div>
              )}
            </label>
          </div>

          <button
            type="submit"
            disabled={!file || uploading || estudiantesLoading}
            className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-bold py-2.5 rounded-xl transition shadow-lg shadow-emerald-100 text-xs flex items-center justify-center mt-4 disabled:cursor-not-allowed"
          >
            {uploading ? (
               "Importando..."
            ) : (
              <>
                <CloudArrowUpIcon className="w-4 h-4 mr-2" />
                Importar a {grupo.nombre}
              </>
            )}
          </button>
        </form>

        {/* Estudiantes Preview */}
        <div>
          <h4 className="text-sm font-bold text-slate-800 mb-3 flex items-center">
            Estudiantes Actuales 
            <span className="ml-2 px-2 py-0.5 bg-indigo-50 text-indigo-600 text-[11px] font-bold rounded-lg border border-indigo-100">
              {estudiantes.length}
            </span>
          </h4>
          
          {estudiantesLoading ? (
            <div className="flex justify-center py-6"><div className="animate-spin h-6 w-6 border-b-2 border-indigo-600 rounded-full"></div></div>
          ) : estudiantes.length === 0 ? (
            <div className="text-center py-8 border-2 border-dashed border-slate-100 rounded-2xl">
              <UsersIcon className="w-10 h-10 text-slate-200 mx-auto mb-3" />
              <p className="text-xs text-slate-400">Sin estudiantes</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-100 shadow-sm">
              <table className="w-full text-left text-xs whitespace-nowrap">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-2 font-bold text-slate-600 uppercase text-[9px] tracking-wider">Nombre</th>
                    <th className="px-4 py-2 font-bold text-slate-600 uppercase text-[9px] tracking-wider text-center">Código</th>
                    <th className="px-4 py-2 font-bold text-slate-600 uppercase text-[9px] tracking-wider text-right">Edad</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {estudiantes.slice(0, 10).map((estudiante, index) => (
                    <tr key={estudiante.id_matricula || index} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-2 font-medium text-slate-700">{estudiante.nombres} {estudiante.apellidos}</td>
                      <td className="px-4 py-2 text-center">
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md font-mono text-[10px]">{estudiante.codigo}</span>
                      </td>
                      <td className="px-4 py-2 text-right font-bold text-indigo-600">{estudiante.edad}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExcelImportModal;

