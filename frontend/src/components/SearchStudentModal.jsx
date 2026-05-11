import { useState, useEffect } from "react";
import API from "../api/axios";
import { MagnifyingGlassIcon, XMarkIcon, UserIcon, AcademicCapIcon } from "@heroicons/react/24/outline";

export default function SearchStudentModal({ isOpen, onClose, role = "admin" }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (query.length >= 2) {
        handleSearch();
      } else {
        setResults([]);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  const handleSearch = async () => {
    setLoading(true);
    try {
      const endpoint = role === "admin" ? "/admin/estudiantes/buscar" : "/docente/estudiantes/buscar";
      const res = await API.get(`${endpoint}?query=${query}`);
      setResults(res.data);
    } catch (error) {
      console.error("Error searching students:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose}></div>
      
      <div className="relative bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
        <div className="p-8">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-2xl font-black text-slate-900 flex items-center gap-3">
              <MagnifyingGlassIcon className="w-8 h-8 text-indigo-600" />
              Buscar Estudiante
            </h3>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
              <XMarkIcon className="w-6 h-6 text-slate-400" />
            </button>
          </div>

          <div className="relative mb-8">
            <MagnifyingGlassIcon className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-400" />
            <input
              type="text"
              autoFocus
              placeholder="Escribe el nombre o documento..."
              className="w-full pl-16 pr-6 py-5 bg-slate-50 border-2 border-slate-100 rounded-[1.5rem] focus:border-indigo-500 focus:ring-0 transition-all text-lg font-medium"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12 space-y-4">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
                <p className="text-slate-400 font-medium">Buscando en la base de datos...</p>
              </div>
            ) : results.length > 0 ? (
              results.map((nino) => (
                <div key={nino.id_nino} className="p-5 bg-white border border-slate-100 rounded-2xl hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-50 transition-all group flex items-center justify-between cursor-default">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                      <UserIcon className="w-6 h-6 text-indigo-600" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 text-lg">{nino.nombres} {nino.apellidos}</h4>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="text-xs font-black text-slate-400 uppercase tracking-widest">{nino.documento || 'Sin doc.'}</span>
                        {nino.grupo_nombre && (
                          <span className="flex items-center gap-1 text-[10px] font-bold text-indigo-500 px-2 py-0.5 bg-indigo-50 rounded-md">
                            <AcademicCapIcon className="w-3 h-3" />
                            {nino.grupo_nombre}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : query.length >= 2 ? (
              <div className="text-center py-12">
                <p className="text-slate-400 font-bold">No se encontraron resultados para "{query}"</p>
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-slate-300 font-medium">Empieza a escribir para buscar...</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
