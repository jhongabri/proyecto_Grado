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
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
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
  const [nutritionData, setNutritionData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [evalRes, nutrRes] = await Promise.all([
          API.get(`/docente/evaluacion/${estudiante.id_nino}?id_grupo=${idGrupo}`),
          API.get(`/nutricion/${estudiante.id_nino}`).catch(err => {
            console.warn("No se encontraron registros nutricionales o error:", err);
            return { data: [] };
          })
        ]);
        setData(evalRes.data);
        
        const rawHistory = Array.isArray(nutrRes.data) ? nutrRes.data : [];
        setNutritionData({
          historialNutricion: rawHistory,
          nutricionActual: rawHistory.length > 0 ? rawHistory[rawHistory.length - 1] : null
        });
      } catch (err) {
        console.error("Error cargando boletín consolidado:", err);
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
      <div id="boletin-card" className="bg-white w-full max-w-4xl rounded-[2.5rem] shadow-2xl flex flex-col max-h-[90vh] print:max-h-none print:shadow-none print:rounded-none overflow-hidden relative">
        
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
          <div className="flex flex-col md:flex-row justify-between items-start mb-8 border-b-2 border-slate-900 pb-6">
            <div className="flex items-center gap-4 mb-6 md:mb-0">
              <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center text-white text-2xl font-black shrink-0">
                CDI
              </div>
              <div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-none">CENTRO DE DESARROLLO INFANTIL</h1>
                <p className="text-slate-600 font-extrabold tracking-widest text-[11px] uppercase mt-1">HISTORIAL CLÍNICO Y PEDAGÓGICO DE DESARROLLO</p>
                <p className="text-slate-400 text-[10px] font-bold mt-0.5">DOCUMENTO OFICIAL DE CONTROL INDIVIDUAL</p>
              </div>
            </div>
            <div className="border-2 border-slate-900 p-4 rounded-2xl min-w-[280px] bg-slate-50 font-mono text-xs">
              <div className="grid grid-cols-2 gap-y-2 text-slate-800">
                <span className="font-bold text-slate-500">ESTUDIANTE:</span>
                <span className="font-extrabold uppercase text-right">{estudiante.nombres} {estudiante.apellidos}</span>
                
                <span className="font-bold text-slate-500">DOCUMENTO:</span>
                <span className="font-extrabold text-right">{estudiante.documento || 'NO REGISTRADO'}</span>
                
                <span className="font-bold text-slate-500">GRUPO / AULA:</span>
                <span className="font-extrabold uppercase text-right">GRUPO {idGrupo}</span>
                
                <span className="font-bold text-slate-500">FECHA REGISTRO:</span>
                <span className="font-extrabold text-right">{data ? new Date(data.fecha).toLocaleDateString() : '-'}</span>
              </div>
            </div>
          </div>

          {/* Radar Chart & Summary */}
          {data && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10 break-inside-avoid">
              <div className="bg-white rounded-2xl border-2 border-slate-200 p-6">
                <h3 className="text-sm font-black text-slate-900 mb-4 uppercase tracking-wider flex items-center gap-2">
                  <span className="text-lg">📊</span> PERFIL DE DESARROLLO INTEGRAL (EVCDI-R)
                </h3>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={DIMENSIONES.map(d => ({
                      subject: d.label,
                      A: data[d.key] || 0,
                      fullMark: 4,
                    }))}>
                      <PolarGrid stroke="#cbd5e1" strokeWidth={1} />
                      <PolarAngleAxis 
                        dataKey="subject" 
                        tick={{ fill: '#1e293b', fontSize: 10, fontWeight: 900 }}
                      />
                      <Radar
                        name="Puntaje"
                        dataKey="A"
                        stroke="#0f172a"
                        fill="#0f172a"
                        fillOpacity={0.15}
                        strokeWidth={2.5}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="flex flex-col gap-4 justify-between">
                <div className="bg-slate-50 p-6 rounded-2xl border-2 border-slate-200">
                  <h3 className="text-slate-900 font-extrabold text-sm uppercase tracking-wider mb-2">Resumen de Diagnóstico</h3>
                  <p className="text-slate-700 text-[12px] leading-relaxed mb-4">
                    Este perfil clínico-pedagógico consolida las valoraciones cualitativas y cuantitativas en las seis dimensiones del desarrollo correspondientes al marco pedagógico colombiano.
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-[10px] font-black uppercase">
                    <div className="flex items-center gap-2 px-2.5 py-1.5 bg-red-100 text-red-800 rounded-lg border border-red-200">
                      <span className="w-2.5 h-2.5 bg-red-600 rounded-full shrink-0"></span> INICIO (1.0 - 1.4)
                    </div>
                    <div className="flex items-center gap-2 px-2.5 py-1.5 bg-amber-100 text-amber-800 rounded-lg border border-amber-200">
                      <span className="w-2.5 h-2.5 bg-amber-500 rounded-full shrink-0"></span> PROCESO (1.5 - 2.4)
                    </div>
                    <div className="flex items-center gap-2 px-2.5 py-1.5 bg-emerald-100 text-emerald-800 rounded-lg border border-emerald-200">
                      <span className="w-2.5 h-2.5 bg-emerald-600 rounded-full shrink-0"></span> ESPERADO (2.5 - 3.4)
                    </div>
                    <div className="flex items-center gap-2 px-2.5 py-1.5 bg-blue-100 text-blue-800 rounded-lg border border-blue-200">
                      <span className="w-2.5 h-2.5 bg-blue-600 rounded-full shrink-0"></span> AVANZADO (3.5 - 4.0)
                    </div>
                  </div>
                </div>

                <div className="bg-slate-900 p-6 rounded-2xl text-white">
                  <h3 className="text-xs font-black tracking-wider uppercase text-slate-400 mb-2">📝 OBSERVACIÓN GENERAL PEDAGÓGICA</h3>
                  <p className="text-slate-200 text-xs leading-relaxed italic font-medium">
                    "{data.observacion_general || 'No se registraron observaciones adicionales para este periodo.'}"
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Dimension Details */}
          <h3 className="text-lg font-black text-slate-900 mb-4 uppercase tracking-wider flex items-center gap-2 break-inside-avoid">
             <span className="text-xl">📋</span> DIAGNÓSTICO DETALLADO POR DIMENSIONES
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
            {data && DIMENSIONES.map((dim) => {
              const score = data[dim.key];
              const nivel = getNivelLabel(score);
              const observation = data[`obs_${dim.key}`];

              return (
                <div key={dim.key} className="bg-white p-5 rounded-2xl border-2 border-slate-200 break-inside-avoid">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{dim.icon}</span>
                      <div>
                        <h4 className="text-sm font-black text-slate-800 tracking-tight leading-none uppercase">{dim.label}</h4>
                        <span className={`inline-block text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md mt-1 border ${nivel.bg} ${nivel.color}`}>
                          NIVEL: {nivel.label}
                        </span>
                      </div>
                    </div>
                    <div className="bg-slate-100 border border-slate-300 text-slate-800 px-3 py-1 rounded-xl text-sm font-black">
                      {score} / 4.0
                    </div>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-slate-700 text-[11px] leading-relaxed font-bold">
                    {observation || 'Sin comentarios específicos registrados en esta dimensión.'}
                  </div>
                </div>
              );
            })}
          </div>

          {/* SECCIÓN DE NUTRICIÓN Y CRECIMIENTO (OMS / ICBF) */}
          {nutritionData && (
            <div className="mt-8 pt-8 border-t-2 border-slate-900 break-inside-avoid">
               <h3 className="text-lg font-black text-slate-900 mb-6 uppercase tracking-wider flex items-center gap-2">
                  <span className="text-xl">⚖️</span> CONTROL NUTRICIONAL Y DESARROLLO FÍSICO (OMS / ICBF)
               </h3>

               {nutritionData.nutricionActual ? (
                 <div className="space-y-6">
                   {/* KPIs de Nutrición */}
                   <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-slate-50 p-4 rounded-xl border-2 border-slate-200">
                         <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">PESO ACTUAL</span>
                         <h4 className="text-xl font-black text-slate-900 mt-1">{nutritionData.nutricionActual.peso} <span className="text-xs font-bold text-slate-400">kg</span></h4>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-xl border-2 border-slate-200">
                         <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">ESTATURA ACTUAL</span>
                         <h4 className="text-xl font-black text-slate-900 mt-1">{nutritionData.nutricionActual.talla} <span className="text-xs font-bold text-slate-400">cm</span></h4>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-xl border-2 border-slate-200">
                         <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">ÍNDICE IMC</span>
                         <h4 className="text-xl font-black text-slate-900 mt-1">{nutritionData.nutricionActual.imc} <span className="text-xs font-bold text-slate-400">kg/m²</span></h4>
                      </div>
                      <div className="bg-slate-900 p-4 rounded-xl text-white">
                         <span className="text-[9px] font-black text-indigo-300 uppercase tracking-widest block">ESTADO CLÍNICO</span>
                         <h4 className="text-sm font-black text-white mt-1 uppercase tracking-tight">{nutritionData.nutricionActual.estado_nutricional}</h4>
                      </div>
                   </div>

                   {/* Gráfico y Observaciones */}
                   <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                     {/* Curva de crecimiento plana */}
                     <div className="lg:col-span-8 bg-white p-5 rounded-2xl border-2 border-slate-200 flex flex-col">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-4">Curva Histórica de Mediciones</h4>
                        {nutritionData.historialNutricion && nutritionData.historialNutricion.length > 0 ? (
                          <div className="h-60 w-full shrink-0">
                            <ResponsiveContainer width="100%" height="100%">
                              <LineChart 
                                data={nutritionData.historialNutricion.map(item => ({
                                  fechaFormateada: new Date(item.fecha).toLocaleDateString('es-ES', { month: 'short', year: '2-digit' }),
                                  Peso: parseFloat(item.peso),
                                  Talla: parseFloat(item.talla),
                                }))} 
                                margin={{ top: 15, right: 30, left: -25, bottom: 5 }}
                              >
                                <CartesianGrid strokeDasharray="0" stroke="#e2e8f0" strokeWidth={1} />
                                <XAxis dataKey="fechaFormateada" tick={{ fill: '#0f172a', fontSize: 9, fontWeight: 'bold' }} />
                                <YAxis yAxisId="left" tick={{ fill: '#1e3a8a', fontSize: 9, fontWeight: 'bold' }} />
                                <YAxis yAxisId="right" orientation="right" tick={{ fill: '#b45309', fontSize: 9, fontWeight: 'bold' }} />
                                <Legend wrapperStyle={{ fontSize: 9, fontWeight: 'bold', textTransform: 'uppercase', color: '#0f172a' }} />
                                <Line 
                                  yAxisId="left" 
                                  type="linear" 
                                  dataKey="Peso" 
                                  stroke="#1e3a8a" 
                                  strokeWidth={3} 
                                  dot={{ r: 5, stroke: '#1e3a8a', strokeWidth: 2, fill: '#fff' }}
                                  label={{ position: 'top', fill: '#1e3a8a', fontSize: 10, fontWeight: 'bold', offset: 8 }}
                                />
                                <Line 
                                  yAxisId="right" 
                                  type="linear" 
                                  dataKey="Talla" 
                                  stroke="#b45309" 
                                  strokeWidth={3} 
                                  dot={{ r: 5, stroke: '#b45309', strokeWidth: 2, fill: '#fff' }}
                                  label={{ position: 'top', fill: '#b45309', fontSize: 10, fontWeight: 'bold', offset: 8 }}
                                />
                              </LineChart>
                            </ResponsiveContainer>
                          </div>
                        ) : (
                          <div className="flex-1 flex items-center justify-center bg-slate-50 rounded-xl min-h-[160px]">
                            <p className="text-xs text-slate-400 font-bold">Sin histórico registrado.</p>
                          </div>
                        )}
                     </div>

                     {/* Observaciones y Sugerencias de Crecimiento */}
                     <div className="lg:col-span-4 flex flex-col justify-between gap-4">
                        <div className="bg-slate-50 p-5 rounded-2xl border-2 border-slate-200 flex-1 flex flex-col">
                          <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">📝 EVALUACIÓN DE PEDIATRÍA Y HÁBITOS</h4>
                          <p className="text-slate-700 text-xs leading-relaxed font-bold overflow-y-auto">
                            "{nutritionData.nutricionActual.observaciones || 'No se registraron observaciones nutricionales adicionales para este periodo.'}"
                          </p>
                        </div>
                     </div>
                   </div>

                   {/* Tabla Clínica de Historial Nutricional */}
                   <div className="bg-white rounded-2xl border-2 border-slate-200 overflow-hidden break-inside-avoid">
                     <table className="w-full text-left border-collapse text-[11px]">
                       <thead>
                         <tr className="bg-slate-900 text-white font-black uppercase text-[9px] tracking-wider">
                           <th className="p-3 border-b border-slate-200">Fecha</th>
                           <th className="p-3 border-b border-slate-200">Peso (kg)</th>
                           <th className="p-3 border-b border-slate-200">Talla (cm)</th>
                           <th className="p-3 border-b border-slate-200">Índice IMC</th>
                           <th className="p-3 border-b border-slate-200">Estado Clínico</th>
                         </tr>
                       </thead>
                       <tbody className="divide-y divide-slate-200 font-bold text-slate-700">
                         {nutritionData.historialNutricion.slice().reverse().map((item, idx) => (
                           <tr key={item.id_registro_nutricional || idx} className="hover:bg-slate-50">
                             <td className="p-3">{new Date(item.fecha).toLocaleDateString()}</td>
                             <td className="p-3 text-slate-900 font-extrabold">{item.peso} kg</td>
                             <td className="p-3 text-slate-900 font-extrabold">{item.talla} cm</td>
                             <td className="p-3">{item.imc}</td>
                             <td className="p-3">
                               <span className="uppercase text-[9px] font-black tracking-wider px-2 py-0.5 rounded border border-slate-300 bg-slate-50">
                                 {item.estado_nutricional}
                               </span>
                             </td>
                           </tr>
                         ))}
                       </tbody>
                     </table>
                   </div>
                 </div>
               ) : (
                 <div className="bg-slate-50 p-8 rounded-3xl border border-dashed border-slate-200 text-center">
                   <p className="text-slate-400 font-bold text-sm">Este estudiante aún no cuenta con controles de peso y talla registrados.</p>
                 </div>
               )}
            </div>
          )}

          <div className="mt-16 border-t-2 border-slate-900 pt-8 flex flex-col md:flex-row justify-between items-center gap-8 break-inside-avoid">
            <div className="text-center md:text-left">
              <div className="w-48 border-b-2 border-slate-900 mb-2 mx-auto md:mx-0"></div>
              <p className="font-black text-slate-800 text-xs tracking-tight uppercase">Docente Encargado</p>
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">CDI Connect Space</p>
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
          /* Desactivar scrolling e inyectar flujo de impresión natural */
          html, body {
            height: auto !important;
            min-height: auto !important;
            overflow: visible !important;
            margin: 0 !important;
            padding: 0 !important;
          }

          /* Ocultar todos los otros elementos del sitio web */
          body > *:not(#boletin-root) {
            display: none !important;
          }
          
          #boletin-root {
            display: block !important;
            position: relative !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            height: auto !important;
            min-height: auto !important;
            max-height: none !important;
            overflow: visible !important;
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
          }

          #boletin-card {
            display: block !important;
            position: relative !important;
            width: 100% !important;
            height: auto !important;
            min-height: auto !important;
            max-height: none !important;
            overflow: visible !important;
            box-shadow: none !important;
            border: none !important;
            border-radius: 0 !important;
            margin: 0 !important;
            padding: 0 !important;
          }

          #boletin-content {
            display: block !important;
            overflow: visible !important;
            height: auto !important;
            min-height: auto !important;
            max-height: none !important;
            padding: 10mm !important;
            width: 100% !important;
          }

          #boletin-root * {
            visibility: visible !important;
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

          .break-inside-avoid {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }

          .lg\:grid-cols-12 { display: block !important; }
          .lg\:col-span-8, .lg\:col-span-4 { width: 100% !important; display: block !important; }
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
