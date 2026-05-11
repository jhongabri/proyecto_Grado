import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import API from "../../api/axios";
import {
  XMarkIcon,
  PrinterIcon,
  AcademicCapIcon,
  InformationCircleIcon
} from "@heroicons/react/24/outline";
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer
} from "recharts";

const DIMENSIONES = [
  { key: "comunicativa", label: "Comunicativa", icon: "💬" },
  { key: "cognitiva", label: "Cognitiva", icon: "🧠" },
  { key: "socioafectiva", label: "Socioafectiva", icon: "🤝" },
  { key: "corporal", icon: "🏃", label: "Corporal" },
  { key: "artistica", icon: "🎨", label: "Artística" },
  { key: "autonomia", icon: "⭐", label: "Autonomía" },
];

const getNivelLabel = (v) => {
  if (v >= 3.5) return { label: "Avanzado", color: "text-blue-600", bg: "bg-blue-50" };
  if (v >= 2.5) return { label: "Esperado", color: "text-emerald-600", bg: "bg-emerald-50" };
  if (v >= 1.5) return { label: "En Proceso", color: "text-amber-600", bg: "bg-amber-50" };
  return { label: "Inicio", color: "text-red-600", bg: "bg-red-50" };
};

export default function BoletinModal({ estudiante, idGrupo, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const res = await API.get(`/docente/evaluacion/${estudiante.id_nino}?id_grupo=${idGrupo}`);
        setData(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [estudiante.id_nino, idGrupo]);

  const handlePrint = () => {
    window.print();
  };

  const modalContent = (
    <div id="boletin-root" className="fixed inset-0 z-[99999] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto print:p-0 print:bg-white print:block">
      <div className="bg-white w-full max-w-4xl rounded-[2.5rem] shadow-2xl flex flex-col max-h-[90vh] print:max-h-none print:shadow-none print:rounded-none overflow-hidden relative">
        
        {/* Header - Buttons (Hidden in print) */}
        <div className="flex justify-between items-center px-8 py-5 border-b border-slate-100 print:hidden shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-100">
              <AcademicCapIcon className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-xl font-black text-slate-800 tracking-tight">Boletín de Desarrollo</h2>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={handlePrint}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-2xl font-bold transition-all active:scale-95 shadow-lg shadow-indigo-100"
            >
              <PrinterIcon className="w-5 h-5" />
              Descargar PDF / Imprimir
            </button>
            <button onClick={onClose} className="p-2.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-2xl transition-colors">
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div id="boletin-content" className="flex-1 overflow-y-auto p-8 print:p-0 print:overflow-visible custom-scrollbar bg-white">
          
          {/* Institutional Header */}
          <div className="flex flex-col md:flex-row justify-between items-start mb-10 border-b-2 border-slate-50 pb-8">
            <div className="flex items-center gap-5 mb-6 md:mb-0">
              <div className="w-20 h-20 bg-indigo-600 rounded-3xl flex items-center justify-center text-white text-3xl font-black shadow-xl">
                CDI
              </div>
              <div>
                <h1 className="text-3xl font-black text-slate-900 tracking-tighter">CENTRO DE DESARROLLO INFANTIL</h1>
                <p className="text-indigo-600 font-black tracking-widest text-sm uppercase">Informe de Evaluación de Desarrollo</p>
                <p className="text-slate-400 text-xs font-medium mt-1 uppercase">Vigencia: {new Date().getFullYear()}</p>
              </div>
            </div>
            <div className="bg-slate-50 p-5 rounded-3xl border border-slate-100 min-w-[240px]">
              <div className="mb-3">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">ESTUDIANTE</span>
                <p className="text-lg font-black text-slate-800 tracking-tight leading-none uppercase">{estudiante.nombres} {estudiante.apellidos}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">GRUPO</span>
                  <p className="text-sm font-bold text-slate-700 uppercase">GRUPO {idGrupo}</p>
                </div>
                <div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">FECHA</span>
                  <p className="text-sm font-bold text-slate-700 uppercase">{data ? new Date(data.fecha).toLocaleDateString() : '-'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Radar Chart & Summary */}
          {data && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-12">
            <div className="bg-white rounded-3xl border border-slate-100 p-8 shadow-[0_15px_40px_rgba(0,0,0,0.02)]">
              <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2">
                <div className="w-1 h-6 bg-indigo-600 rounded-full"></div>
                Perfil de Desarrollo
              </h3>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="80%" data={DIMENSIONES.map(d => ({
                    subject: d.label,
                    A: data[d.key] || 0,
                    fullMark: 4,
                  }))}>
                    <PolarGrid stroke="#e2e8f0" strokeWidth={2} />
                    <PolarAngleAxis 
                      dataKey="subject" 
                      tick={{ fill: '#64748b', fontSize: 11, fontWeight: 700 }}
                    />
                    <Radar
                      name="Puntaje"
                      dataKey="A"
                      stroke="#4f46e5"
                      fill="#4f46e5"
                      fillOpacity={0.2}
                      strokeWidth={3}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="flex flex-col gap-6 justify-center">
              <div className="bg-indigo-50 p-8 rounded-[2rem] border border-indigo-100 relative overflow-hidden group">
                <div className="absolute -right-10 -top-10 w-32 h-32 bg-indigo-600/10 rounded-full blur-3xl"></div>
                <h3 className="text-indigo-900 font-black text-xl mb-2">Resumen General</h3>
                <p className="text-indigo-700/80 text-sm leading-relaxed mb-4">
                  El perfil visual muestra el nivel alcanzado en cada una de las 6 dimensiones del desarrollo integral según el marco normativo EVCDI-R.
                </p>
                <div className="flex flex-wrap gap-2">
                  <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">Inicio</span>
                  <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">Proceso</span>
                  <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">Esperado</span>
                  <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">Avanzado</span>
                </div>
              </div>

              <div className="bg-slate-900 p-8 rounded-[2rem] text-white shadow-xl shadow-slate-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                    <InformationCircleIcon className="w-6 h-6 text-indigo-400" />
                  </div>
                  <h3 className="text-xl font-black tracking-tight">Observación General</h3>
                </div>
                <p className="text-slate-300 text-sm leading-relaxed italic">
                  "{data.observacion_general || 'No se registraron observaciones adicionales para este periodo.'}"
                </p>
              </div>
            </div>
          </div>
          )}

          {/* Dimension Details */}
          <h3 className="text-2xl font-black text-slate-800 mb-8 flex items-center gap-3">
             <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
               <AcademicCapIcon className="w-7 h-7" />
             </div>
             Desglose por Dimensión
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
            {data && DIMENSIONES.map((dim) => {
              const score = data[dim.key];
              const nivel = getNivelLabel(score);
              const observation = data[`obs_${dim.key}`];

              return (
                <div key={dim.key} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow break-inside-avoid">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{dim.icon}</span>
                      <div>
                        <h4 className="text-lg font-black text-slate-800 leading-none tracking-tight">{dim.label}</h4>
                        <p className={`text-[10px] font-black uppercase tracking-widest mt-1 ${nivel.color}`}>Nivel: {nivel.label}</p>
                      </div>
                    </div>
                    <div className={`${nivel.bg} ${nivel.color} h-10 w-14 rounded-xl border border-current flex items-center justify-center text-xl font-black opacity-40`}>
                      {score}/4
                    </div>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                     <p className="text-slate-600 text-[11px] leading-relaxed font-bold">
                       {observation || 'Sin comentarios específicos en esta dimensión.'}
                     </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer Signature */}
          <div className="mt-20 border-t-2 border-slate-50 pt-10 flex flex-col md:flex-row justify-between items-center gap-10">
            <div className="text-center md:text-left">
              <div className="w-48 border-b-2 border-slate-300 mb-4 mx-auto md:mx-0"></div>
              <p className="font-black text-slate-800 text-sm tracking-tight uppercase">Docente Encargado</p>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Plataforma CDI - Connect Space</p>
            </div>
            <div className="text-center md:text-right text-[10px] text-slate-400 font-bold max-w-xs uppercase leading-tight tracking-widest">
              Este documento es una representación oficial de la evaluación de desarrollo infantil.
            </div>
          </div>

        </div>
      </div>
      
      {/* Styles for print */}
      <style>{`
        @media print {
          /* Estrategia: Ocultar todo lo que sea hijo directo del body excepto el portal del modal */
          body > *:not(#boletin-root) {
            display: none !important;
          }
          
          #boletin-root {
            display: block !important;
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            height: auto !important;
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
          }

          #boletin-root * {
            visibility: visible !important;
          }

          #boletin-content {
            padding: 15mm !important;
            width: 100% !important;
          }

          .grid { display: grid !important; }
          .grid-cols-1 { grid-template-columns: 1fr !important; }
          .md\\:grid-cols-2 { grid-template-columns: 1fr 1fr !important; }
          .lg\\:grid-cols-2 { grid-template-columns: 1fr 1fr !important; }

          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          .print\\:hidden, button, .shrink-0 {
            display: none !important;
          }

          .recharts-responsive-container {
            width: 100% !important;
            height: 350px !important;
          }
        }
      `}</style>
    </div>
  );

  if (loading) {
    return (
      <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm">
        <div className="bg-white p-8 rounded-3xl shadow-xl flex flex-col items-center">
          <div className="animate-spin h-10 w-10 border-4 border-indigo-600 border-t-transparent rounded-full mb-4"></div>
          <p className="font-bold text-slate-600">Generando reporte...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm">
        <div className="bg-white p-8 rounded-3xl shadow-xl max-w-sm text-center">
          <XMarkIcon className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-slate-800 mb-2">Sin Evaluación</h3>
          <p className="text-slate-500 mb-6 text-sm">Este estudiante aún no ha sido evaluado en este periodo.</p>
          <button onClick={onClose} className="w-full bg-slate-100 hover:bg-slate-200 py-3 rounded-xl font-bold transition-colors">Cerrar</button>
        </div>
      </div>
    );
  }

  return createPortal(modalContent, document.body);
}
