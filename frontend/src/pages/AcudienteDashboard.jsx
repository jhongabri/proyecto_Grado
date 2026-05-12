import { useEffect, useState } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import API from "../api/axios";
import { 
  UserIcon, 
  DocumentTextIcon, 
  CheckCircleIcon, 
  FaceSmileIcon, 
  HeartIcon, 
  ExclamationTriangleIcon, 
  VideoCameraIcon, 
  FolderIcon, 
  LinkIcon,
  AcademicCapIcon,
  StarIcon,
  CalendarDaysIcon,
  CloudArrowDownIcon,
  SparklesIcon,
  ArrowTopRightOnSquareIcon,
  BellIcon
} from "@heroicons/react/24/outline";

import AISummaryModal from "../components/acudiente/AISummaryModal";

import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
} from "recharts";

export default function AcudienteDashboard() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [showAIModal, setShowAIModal] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await API.get("/acudiente/dashboard");
        setData(res.data);
      } catch (error) {
        console.error("Error fetching acudiente data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <DashboardLayout title="Cargando...">
        <div className="flex items-center justify-center h-screen bg-slate-50/50">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-600"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-8 w-8 bg-indigo-100 rounded-full animate-pulse"></div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!data || !data.vinculado) {
    return (
      <DashboardLayout title="Mi Perfil">
         <div className="min-h-[70vh] flex items-center justify-center px-4">
           <div className="bg-white/80 backdrop-blur-xl border border-slate-200 rounded-[3rem] p-12 text-center max-w-2xl w-full shadow-2xl shadow-indigo-100/50">
              <div className="w-24 h-24 bg-amber-100 rounded-3xl flex items-center justify-center mx-auto mb-8 animate-bounce">
                <ExclamationTriangleIcon className="w-12 h-12 text-amber-500" />
              </div>
              <h3 className="text-3xl font-black text-slate-900 mb-4">Cuenta no vinculada</h3>
              <p className="text-slate-500 text-lg leading-relaxed mb-8">
                Tu cuenta de acudiente aún no ha sido asociada a ningún estudiante en nuestro sistema. 
              </p>
              <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 text-sm font-medium text-slate-600">
                Por favor, contacta a la administración del CDI para completar tu registro y empezar a ver el progreso de tu niño.
              </div>
           </div>
         </div>
      </DashboardLayout>
    );
  }

  const { nino, grupo, docente, asistenciaHoy, estrellas, recursos, tareas, evaluacion } = data;

  const radarData = evaluacion ? [
    { subject: 'Comunicativa', A: evaluacion.comunicativa, fullMark: 5 },
    { subject: 'Cognitiva', A: evaluacion.cognitiva, fullMark: 5 },
    { subject: 'Socioafectiva', A: evaluacion.socioafectiva, fullMark: 5 },
    { subject: 'Corporal', A: evaluacion.corporal, fullMark: 5 },
    { subject: 'Artística', A: evaluacion.artistica, fullMark: 5 },
    { subject: 'Autonomía', A: evaluacion.autonomia, fullMark: 5 },
  ] : [];

  return (
    <DashboardLayout title="Mi Acudido">
      <div className="max-w-7xl mx-auto space-y-8 pb-12">
        
        {/* Header Section (Versión Original Limpia) */}
        <div className="relative overflow-hidden rounded-[3rem] bg-gradient-to-br from-indigo-700 via-violet-800 to-indigo-900 p-8 md:p-12 text-white shadow-2xl shadow-indigo-200">
           <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full -mr-48 -mt-48 blur-3xl animate-pulse"></div>
           <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
              <div className="w-32 h-32 md:w-40 md:h-40 rounded-[2.5rem] bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-6xl shadow-2xl">
                {nino.sexo === 'F' ? '👧' : '👦'}
              </div>
              <div className="text-center md:text-left space-y-2">
                 <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/10 backdrop-blur-sm rounded-full text-xs font-bold tracking-widest uppercase mb-2">
                   <SparklesIcon className="w-4 h-4 text-yellow-300" />
                   Resumen de Hoy
                 </div>
                 <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-none">
                   ¡Hola! Soy {nino.nombres}
                 </h1>
                 <p className="text-indigo-100 text-lg md:text-xl font-medium max-w-lg">
                   Mira cómo va mi aventura de hoy en el CDI.
                 </p>
              </div>
           </div>
        </div>

        {/* Quick Stats Grid (Versión Original Limpia) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-100/50">
             <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center mb-4">
               <AcademicCapIcon className="w-6 h-6 text-indigo-600" />
             </div>
             <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Grupo</p>
             <h4 className="text-xl font-black text-slate-800">{grupo?.nombre}</h4>
             <p className="text-sm font-bold text-indigo-500 mt-1">{grupo?.horario}</p>
          </div>
          <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-100/50">
             <div className="w-12 h-12 bg-violet-50 rounded-2xl flex items-center justify-center mb-4">
               <UserIcon className="w-6 h-6 text-violet-600" />
             </div>
             <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Docente</p>
             <h4 className="text-xl font-black text-slate-800">{docente?.nombre}</h4>
             <p className="text-xs text-slate-400 truncate mt-1">{docente?.correo}</p>
          </div>
          <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-100/50">
             <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4 bg-emerald-50 text-emerald-600">
               {asistenciaHoy?.estado === 'presente' ? <CheckCircleIcon className="w-6 h-6" /> : <ExclamationTriangleIcon className="w-6 h-6" />}
             </div>
             <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Asistencia</p>
             <h4 className="text-xl font-black text-slate-800">{asistenciaHoy?.estado || 'Pendiente'}</h4>
          </div>
          <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-100/50">
             <div className="w-12 h-12 bg-yellow-50 rounded-2xl flex items-center justify-center mb-4">
               <StarIcon className="w-6 h-6 text-yellow-500" />
             </div>
             <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Desempeño</p>
             <div className="flex gap-1 mt-1">
                {[...Array(5)].map((_, i) => (
                    <span key={i} className={i < estrellas ? "text-yellow-400 text-xl" : "text-slate-100 text-xl"}>★</span>
                ))}
             </div>
          </div>
        </div>

        {/* Radar Section (Original) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-5 bg-white p-8 rounded-[3rem] border border-slate-100 shadow-2xl shadow-slate-200/50 flex flex-col h-full">
             <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-black text-slate-800 leading-tight">Desarrollo Integral</h3>
                <button 
                  onClick={() => setShowAIModal(true)}
                  className="p-2 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-600 hover:text-white transition-all duration-300 group relative"
                  title="Generar Resumen Mágico"
                >
                  <SparklesIcon className="w-6 h-6 group-hover:animate-pulse" />
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-indigo-500 rounded-full border-2 border-white animate-bounce"></span>
                </button>
             </div>
             {evaluacion ? (
               <div className="flex-1 flex flex-col items-center">
                 <div className="w-full h-72">
                   <ResponsiveContainer width="100%" height="100%">
                     <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                       <PolarGrid stroke="#e2e8f0" />
                       <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 10, fontWeight: 'bold' }} />
                       <Radar name={nino.nombres} dataKey="A" stroke="#4f46e5" fill="#4f46e5" fillOpacity={0.4} />
                     </RadarChart>
                   </ResponsiveContainer>
                 </div>
                 <div className="mt-4 p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100/50 w-full text-center">
                    <p className="text-sm text-slate-600 italic">"{evaluacion.observacion_general}"</p>
                 </div>
               </div>
             ) : (
               <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                  <p className="text-slate-400 font-medium">Aún no hay una evaluación de desarrollo cargada.</p>
               </div>
             )}
          </div>

          {/* TAREAS - CON COLOR Y TEXTURA (RETO ACEPTADO) */}
          <div className="lg:col-span-7 space-y-6">
             <div className="bg-[#f8fafc] p-1 rounded-[3.5rem] border-2 border-white shadow-2xl shadow-indigo-100/50">
                <div className="bg-white p-8 md:p-10 rounded-[3rem] shadow-xl">
                   <div className="flex items-center justify-between mb-10">
                      <h3 className="text-3xl font-black text-slate-900 tracking-tight">Tareas para Casa</h3>
                      <div className="relative">
                        <div className="absolute -inset-1 bg-violet-500 rounded-full blur opacity-20"></div>
                        <span className="relative px-6 py-2 bg-violet-600 text-white rounded-full text-xs font-black uppercase tracking-widest">
                          {tareas.length} Pendientes
                        </span>
                      </div>
                   </div>

                   <div className="space-y-6">
                      {tareas.length === 0 ? (
                        <div className="py-20 text-center border-4 border-dashed border-slate-50 rounded-[2.5rem]">
                           <SparklesIcon className="w-16 h-16 text-emerald-400 mx-auto mb-4" />
                           <p className="text-slate-400 font-black text-lg">¡Hoy no hay tareas!</p>
                        </div>
                      ) : (
                        tareas.map(tarea => (
                          <div key={tarea.id_tarea} className="group bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100 hover:shadow-2xl hover:shadow-indigo-100/50 transition-all flex flex-col md:flex-row gap-8 items-center">
                             <div className="w-20 h-20 bg-white rounded-[2rem] shadow-lg flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                                <CalendarDaysIcon className="w-10 h-10 text-violet-600" />
                             </div>
                             <div className="flex-1 space-y-3 text-center md:text-left w-full">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                                   <h4 className="text-2xl font-black text-slate-800 group-hover:text-violet-600">{tarea.titulo}</h4>
                                   <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                      Entrega: {new Date(tarea.fecha_entrega).toLocaleDateString()}
                                   </span>
                                </div>
                                <p className="text-base text-slate-500 leading-relaxed font-medium">
                                  {tarea.descripcion}
                                </p>
                                <div className="pt-4">
                                   {tarea.recurso_url && (
                                     <a 
                                       href={tarea.recurso_url} 
                                       target="_blank" 
                                       rel="noopener noreferrer"
                                       className="inline-flex items-center gap-3 px-8 py-4 bg-violet-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] hover:bg-violet-700 transition-all shadow-xl shadow-violet-100 active:scale-95"
                                     >
                                       <CloudArrowDownIcon className="w-5 h-5" />
                                       Descargar Guía
                                     </a>
                                   )}
                                </div>
                             </div>
                          </div>
                        ))
                      )}
                   </div>
                </div>
             </div>
          </div>
        </div>

        {/* RECURSOS - CON COLOR Y TEXTURA (RETO ACEPTADO) */}
        <div className="bg-[#0f172a] p-12 rounded-[4rem] text-white relative overflow-hidden shadow-2xl shadow-slate-300">
           <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500 rounded-full blur-[120px] opacity-20 -mr-48 -mt-48"></div>
           
           <div className="relative z-10">
              <div className="flex flex-col md:flex-row items-center justify-between mb-12 gap-6">
                <div className="space-y-2 text-center md:text-left">
                  <h3 className="text-4xl font-black tracking-tight">Recursos de Aprendizaje</h3>
                  <p className="text-slate-400 font-medium">Material interactivo para que sigamos practicando en familia.</p>
                </div>
                <div className="p-4 bg-white/10 rounded-3xl border border-white/20">
                  <FolderIcon className="w-10 h-10 text-indigo-400" />
                </div>
              </div>

              {recursos.length === 0 ? (
                <div className="py-20 text-center border-2 border-dashed border-white/10 rounded-[3rem]">
                   <p className="text-slate-500 font-bold">Próximamente más recursos...</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                   {recursos.map(rec => (
                     <div key={rec.id_recurso} className="bg-white p-1 rounded-[2.5rem] group hover:scale-[1.02] transition-transform duration-500">
                        <div className="bg-slate-50 p-8 rounded-[2.3rem] h-full flex flex-col space-y-6">
                           <div className="flex items-center justify-between">
                              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
                                rec.tipo === 'video' ? 'bg-rose-100 text-rose-600' : 'bg-sky-100 text-sky-600'
                              }`}>
                                {rec.tipo === 'video' ? <VideoCameraIcon className="w-7 h-7" /> : <DocumentTextIcon className="w-7 h-7" />}
                              </div>
                              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                {rec.tipo}
                              </span>
                           </div>
                           <h5 className="text-xl font-black text-slate-800 leading-tight flex-1">
                             {rec.titulo}
                           </h5>
                           <a 
                             href={rec.url} 
                             target="_blank" 
                             rel="noopener noreferrer"
                             className="flex items-center justify-between w-full p-5 bg-white border border-slate-100 group-hover:bg-indigo-600 group-hover:text-white rounded-2xl transition-all font-black text-[10px] uppercase tracking-widest"
                           >
                             Explorar Ahora
                             <ArrowTopRightOnSquareIcon className="w-5 h-5" />
                           </a>
                        </div>
                     </div>
                   ))}
                </div>
              )}
           </div>
        </div>

      </div>
      <AISummaryModal 
        isOpen={showAIModal} 
        onClose={() => setShowAIModal(false)} 
      />
    </DashboardLayout>
  );
}