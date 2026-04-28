import { useEffect, useState } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import API from "../api/axios";
import { UserIcon, DocumentTextIcon, CheckCircleIcon, FaceSmileIcon, HeartIcon, ExclamationTriangleIcon } from "@heroicons/react/24/outline";

export default function AcudienteDashboard() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [guias, setGuias] = useState([]);

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

    const savedGuias = localStorage.getItem("cdi_guias");
    if (savedGuias) {
      setGuias(JSON.parse(savedGuias));
    }
  }, []);

  if (loading) {
    return (
      <DashboardLayout title="Cargando...">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!data || !data.vinculado) {
    return (
      <DashboardLayout title="Mi Acudido">
         <div className="bg-amber-50 border border-amber-200 rounded-3xl p-10 text-center max-w-2xl mx-auto shadow-sm">
            <ExclamationTriangleIcon className="w-16 h-16 text-amber-500 mx-auto mb-6" />
            <h3 className="text-2xl font-bold text-amber-900 mb-2">Cuenta no vinculada</h3>
            <p className="text-amber-700 leading-relaxed">
              Tu cuenta de acudiente aún no ha sido vinculada a ningún estudiante. 
              Por favor, contacta a la administración del CDI para completar tu registro.
            </p>
         </div>
      </DashboardLayout>
    );
  }

  const { nino, grupo, docente, asistenciaHoy, estrellas } = data;

  return (
    <DashboardLayout title="Mi Acudido">
      
      {/* Header welcome */}
      <div className="mb-8">
        <h2 className="text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-slate-800 to-indigo-900">
          El Día de {nino.nombres}
        </h2>
        <p className="text-slate-500 mt-1.5 font-medium">Aquí está el resumen de las actividades de tu pequeño hoy.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">

        {/* Card 1: Grupo y Docente */}
        <div className="relative group bg-white p-7 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 hover:shadow-[0_8px_40px_rgba(79,70,229,0.12)] transition-all duration-300 hover:-translate-y-1 overflow-hidden">
          <div className="absolute -right-10 -top-10 w-32 h-32 bg-indigo-400 rounded-full blur-3xl opacity-20 group-hover:opacity-40 transition-opacity duration-500"></div>
          <div className="flex items-center justify-between relative z-10 mb-4">
            <div className="p-3.5 rounded-2xl bg-indigo-50 text-indigo-600 font-bold text-2xl group-hover:scale-110 transition-transform duration-300 shadow-sm">
              🏫
            </div>
          </div>
          <div className="relative z-10">
             <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Grupo: {grupo?.nombre || 'No asignado'}</h3>
             <p className="text-xl font-bold text-slate-800">Docente: {docente?.nombre || 'Asignando...'}</p>
             <p className="text-sm font-medium text-indigo-600 mt-1">{grupo?.horario || 'Horario por definir'}</p>
          </div>
        </div>

        {/* Card 2: Asistencia Hoy */}
        <div className="relative group bg-white p-7 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 hover:shadow-[0_8px_40px_rgba(34,197,94,0.12)] transition-all duration-300 hover:-translate-y-1 overflow-hidden">
          <div className={`absolute -right-10 -top-10 w-32 h-32 ${asistenciaHoy?.estado === 'presente' ? 'bg-green-400' : 'bg-amber-400'} rounded-full blur-3xl opacity-20 group-hover:opacity-40 transition-opacity duration-500`}></div>
          <div className="flex items-center justify-between relative z-10 mb-4">
            <div className={`p-3.5 rounded-2xl ${asistenciaHoy?.estado === 'presente' ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'} font-bold text-2xl group-hover:scale-110 transition-transform duration-300 shadow-sm`}>
              {asistenciaHoy?.estado === 'presente' ? '✅' : '⏳'}
            </div>
          </div>
          <div className="relative z-10">
             <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Asistencia Hoy</h3>
             <p className="text-xl font-bold text-slate-800">
               {asistenciaHoy ? (asistenciaHoy.estado === 'presente' ? 'Asistió al CDI' : 'Reportado Ausente') : 'Sin reporte aún'}
             </p>
             <p className="text-sm font-medium text-slate-500 mt-1 italic">{asistenciaHoy?.observacion || ''}</p>
          </div>
        </div>

        {/* Card 3: Comportamiento / Estrellas */}
        <div className="relative group bg-white p-7 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 hover:shadow-[0_8px_40px_rgba(234,179,8,0.12)] transition-all duration-300 hover:-translate-y-1 overflow-hidden">
          <div className="absolute -right-10 -top-10 w-32 h-32 bg-yellow-400 rounded-full blur-3xl opacity-20 group-hover:opacity-40 transition-opacity duration-500"></div>
          <div className="flex items-center justify-between relative z-10 mb-4">
            <div className="p-3.5 rounded-2xl bg-yellow-50 text-yellow-600 font-bold text-2xl group-hover:scale-110 transition-transform duration-300 shadow-sm">
              ⭐
            </div>
          </div>
          <div className="relative z-10">
             <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Rendimiento Hoy</h3>
             <div className="flex gap-1 mt-1 mb-1">
                {[...Array(5)].map((_, i) => (
                    <span key={i} className={i < estrellas ? "text-yellow-400 text-2xl" : "text-slate-200 text-2xl"}>★</span>
                ))}
             </div>
             <p className="text-sm font-medium text-yellow-700">
               {estrellas === 5 ? '¡Excelente comportamiento!' : estrellas >= 3 ? 'Buen día de aprendizaje' : 'Sigue esforzándote'}
             </p>
          </div>
        </div>

      </div>

      {/* Guías de Estudio Asignadas */}
      <div className="bg-white p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 mb-8">
         <div className="flex items-center justify-between mb-8">
           <h3 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-800 to-violet-600 flex items-center">
             <div className="w-12 h-12 rounded-2xl bg-violet-100 flex items-center justify-center mr-4 shadow-inner">
               <DocumentTextIcon className="w-6 h-6 text-violet-600" />
             </div>
             Guías a Estudiar en Casa
           </h3>
         </div>
         
         {guias.length === 0 ? (
           <div className="flex flex-col items-center justify-center text-slate-400 py-16 border-2 border-dashed border-slate-100 rounded-3xl bg-slate-50/50">
             <CheckCircleIcon className="w-16 h-16 mb-4 text-emerald-300" />
             <p className="text-lg font-medium text-slate-500">No hay guías asignadas por el momento</p>
             <p className="text-sm">¡Tiempo libre para jugar en familia!</p>
           </div>
         ) : (
           <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
             {guias.map((guia) => (
               <div key={guia.id} className="p-6 border border-slate-100 bg-gradient-to-br from-white to-slate-50 rounded-3xl hover:border-violet-200 transition-all duration-300 group shadow-sm hover:shadow-md relative overflow-hidden">
                 <div className="absolute top-0 right-0 w-24 h-24 bg-violet-100 rounded-bl-full -z-0 opacity-50 group-hover:scale-110 transition-transform"></div>
                 <div className="relative z-10">
                   <h4 className="font-bold text-lg text-slate-800 group-hover:text-violet-700 transition-colors mb-2 line-clamp-1">
                     {guia.titulo}
                   </h4>
                   <p className="text-sm text-slate-600 mb-6 line-clamp-3 min-h-[60px]">
                     {guia.descripcion}
                   </p>
                   <div className="flex justify-between items-center text-sm font-semibold pt-4 border-t border-slate-200/60 mt-auto">
                     <span className="text-slate-500">
                       Repaso sugerido:
                     </span>
                     <span className="px-3 py-1 bg-violet-100 text-violet-700 rounded-lg">
                        {new Date(guia.fecha_entrega).toLocaleDateString()}
                     </span>
                   </div>
                 </div>
               </div>
             ))}
           </div>
         )}
      </div>

    </DashboardLayout>
  );
}