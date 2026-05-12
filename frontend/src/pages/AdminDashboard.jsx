import { useEffect, useState, useCallback } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import API from "../api/axios";

import {
  AcademicCapIcon,
  UserGroupIcon,
  UsersIcon,
  DocumentTextIcon,
  MagnifyingGlassIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  ArrowPathIcon,
  ChatBubbleBottomCenterTextIcon,
  TrashIcon,
  CheckIcon,
  SparklesIcon,
  XMarkIcon,
  CpuChipIcon
} from "@heroicons/react/24/outline";

import SearchStudentModal from "../components/SearchStudentModal";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

import GestionCards from "../components/admin/GestionCards";
import CreateDocenteForm from "../components/admin/CreateDocenteForm";
import CreateGrupoForm from "../components/admin/CreateGrupoForm";
import DocentesList from "../components/admin/DocentesList";
import GruposList from "../components/admin/GruposList";
import ExcelImportModal from "../components/admin/ExcelImportModal";
import AsignarGrupoModal from "../components/admin/AsignarGrupoModal";
import ManageEstudiantesModal from "../components/admin/ManageEstudiantesModal";
import GestionAcudientes from "../components/admin/GestionAcudientes";

// StatCard Component
const StatCard = ({ title, value, Icon, color, iconColor, bgGlow }) => (
  <div className="relative group bg-white p-5 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 hover:shadow-[0_8px_40px_rgba(79,70,229,0.12)] transition-all duration-300 hover:-translate-y-1 overflow-hidden cursor-default">
    {/* Decorative background glow */}
    <div className={`absolute -right-8 -top-8 w-24 h-24 ${bgGlow} rounded-full blur-3xl opacity-20 group-hover:opacity-40 transition-opacity duration-500`}></div>
    
    <div className="flex items-center justify-between relative z-10">
      <div className={`p-2.5 rounded-xl group-hover:scale-110 transition-transform duration-300 shadow-sm ${bgGlow.replace('bg-', 'bg-opacity-10 bg-')}`}>
        <Icon className={`w-6 h-6 ${iconColor}`} />
      </div>
      <div className="flex h-2 w-2 relative">
         <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
         <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
      </div>
    </div>
    <div className="mt-3 relative z-10">
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{title}</p>
      <div className="flex items-baseline gap-2 mt-0.5">
         <p className={`text-3xl font-black ${color} tracking-tight`}>{value}</p>
      </div>
    </div>
  </div>
);

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalNinos: 0,
    totalDocentes: 0,
    totalUsuarios: 0,
  });

  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState("dashboard");
  const [gestionSubView, setGestionSubView] = useState("cards");

  const handleDashboardClick = () => setActiveView("dashboard");
  const handleGestionClick = () => {
    setActiveView("gestion");
    setGestionSubView("cards");
  };
  const handleReportesClick = () => setActiveView("reportes");

  const [reportes, setReportes] = useState([]);
  const [reportesLoading, setReportesLoading] = useState(true);

  // Estados para Análisis IA de Reportes
  const [analisisModalOpen, setAnalisisModalOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [analisisAI, setAnalisisAI] = useState("");
  const [analisisLoading, setAnalisisLoading] = useState(false);
  const [docentes, setDocentes] = useState([]);
  const [grupos, setGrupos] = useState([]);
  const [gruposLoading, setGruposLoading] = useState(false);
  const [docentesLoading, setDocentesLoading] = useState(false);
  const [gestionLoading, setGestionLoading] = useState(false);
  const [gestionError, setGestionError] = useState("");
  const [error, setError] = useState("");
  const [showExcelModal, setShowExcelModal] = useState(false);
  const [selectedGrupoExcel, setSelectedGrupoExcel] = useState(null);
  
  const [showManageModal, setShowManageModal] = useState(false);
  const [selectedGrupoManage, setSelectedGrupoManage] = useState(null);

  // Modal Asignar Grupo states
  const [showAsignarModal, setShowAsignarModal] = useState(false);
  const [selectedDocente, setSelectedDocente] = useState(null);
  const [selectedGrupos, setSelectedGrupos] = useState([]); // Ahora es un array
  const [asignandoGrupo, setAsignandoGrupo] = useState(false);
  const [grupoError, setGrupoError] = useState("");

  // Búsqueda
  const [searchModalOpen, setSearchModalOpen] = useState(false);

  // ✅ FIX: Un único handler que siempre limpia el estado antes de abrir el modal
  const handleOpenAsignarModal = (docente) => {
    setSelectedDocente(docente);
    // Extraer solo IDs de los grupos actuales del docente
    const ids = docente.grupos ? docente.grupos.map(g => g.id_grupo) : [];
    setSelectedGrupos(ids);
    setGrupoError("");
    setShowAsignarModal(true);
  };

  const handleCloseAsignarModal = () => {
    setShowAsignarModal(false);
    setSelectedDocente(null);
    setSelectedGrupos([]);
    setGrupoError("");
  };

  const handleGrupoChange = (ids) => {
    setSelectedGrupos(ids);
    setGrupoError("");
  };

  const handleAsignarGrupoSubmit = async () => {
    setAsignandoGrupo(true);
    setGrupoError("");
    try {
      await API.put("/admin/docentes/asignar-grupo", {
        id_docente: selectedDocente.id_usuario,
        id_grupos: selectedGrupos, // Enviar el array completo
      });
      handleCloseAsignarModal();
      refreshDocentes();
    } catch (err) {
      setGrupoError(err.response?.data?.message || "Error asignando grupos");
    } finally {
      setAsignandoGrupo(false);
    }
  };

  const refreshStats = useCallback(async () => {
    try {
      const res = await API.get("/admin/stats");
      setStats(res.data);
      setError("");
    } catch (err) {
      setError("Error cargando estadísticas");
    }
  }, []);

  const refreshDocentes = useCallback(async () => {
    try {
      const res = await API.get("/admin/docentes");
      setDocentes(res.data);
      setError("");
    } catch (err) {
      setError("Error cargando docentes");
    }
  }, []);

  const refreshGrupos = useCallback(async () => {
    try {
      const res = await API.get("/grupos");
      setGrupos(res.data);
      setError("");
    } catch (err) {
      setError("Error cargando grupos");
    }
  }, []);

  const fetchReportes = async () => {
    setReportesLoading(true);
    try {
      const res = await API.get("/docente/reportes/admin");
      setReportes(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setReportesLoading(false);
    }
  };

  const handleUpdateReportStatus = async (id, newStatus) => {
    try {
      await API.put(`/docente/reportes/${id}`, { estado: newStatus });
      fetchReportes();
    } catch (err) {
      console.error("Error al actualizar estado del reporte:", err);
    }
  };

  const handleAnalyzeReport = async (reporte) => {
    setSelectedReport(reporte);
    setAnalisisModalOpen(true);
    setAnalisisLoading(true);
    setAnalisisAI("");
    try {
      const res = await API.get(`/admin/reports/${reporte.id_reporte}/analyze`);
      setAnalisisAI(res.data.analysis);
    } catch (err) {
      console.error("Error al analizar reporte:", err);
      setAnalisisAI("Error al generar el análisis. Por favor intente de nuevo.");
    } finally {
      setAnalisisLoading(false);
    }
  };

  useEffect(() => {
    if (activeView === "reportes") {
      fetchReportes();
    }
  }, [activeView]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await API.get("/admin/stats");
        setStats(res.data);
      } catch (error) {
        // Silent fail
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (activeView === "gestion") {
      const fetchGestionData = async () => {
        setGestionLoading(true);
        setGestionError("");
        try {
          const [docentesRes, gruposRes] = await Promise.all([
            API.get("/admin/docentes"),
            API.get("/grupos"),
          ]);
          setDocentes(docentesRes.data || []);
          setGrupos(gruposRes.data || []);
        } catch (error) {
          console.error("Gestion data fetch error:", error);
          setGestionError("Error cargando datos de gestión. Verifica que el backend esté corriendo.");
          setDocentes([]);
          setGrupos([]);
        } finally {
          setGestionLoading(false);
          setDocentesLoading(false);
          setGruposLoading(false);
        }
      };
      fetchGestionData();
    }
  }, [activeView]);

  const chartData = [
    { name: "Niños", cantidad: stats.totalNinos },
    { name: "Docentes", cantidad: stats.totalDocentes },
    { name: "Usuarios", cantidad: stats.totalUsuarios },
  ];

  const ReportesPanel = () => {
    const [filtro, setFiltro] = useState("todos");

    const reportesFiltrados = reportes.filter(r => {
      if (filtro === "todos") return true;
      return r.estado === filtro;
    });

    return (
      <div className="max-w-6xl mx-auto py-12 px-6 animate-fade-in">
        {/* Header con Filtros */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
              <div className="p-3 bg-orange-100 rounded-2xl">
                <DocumentTextIcon className="w-8 h-8 text-orange-600" />
              </div>
              Bandeja de Reportes
            </h2>
            <p className="text-slate-500 mt-1 font-medium">Gestión administrativa y alertas de docentes</p>
          </div>

          <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200">
            {['todos', 'pendiente', 'leído', 'resuelto'].map((f) => (
              <button
                key={f}
                onClick={() => setFiltro(f)}
                className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                  filtro === f 
                  ? 'bg-white text-slate-900 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {reportesLoading ? (
          <div className="flex flex-col items-center justify-center py-24 bg-white rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-200/50">
            <div className="relative w-16 h-16 mb-6">
              <div className="absolute inset-0 rounded-full border-t-2 border-orange-600 animate-spin"></div>
              <DocumentTextIcon className="absolute inset-0 m-auto w-6 h-6 text-orange-600 animate-pulse" />
            </div>
            <p className="text-slate-400 font-black uppercase tracking-[0.2em] text-xs">Cargando reportes...</p>
          </div>
        ) : reportesFiltrados.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-[3rem] border-2 border-dashed border-slate-200">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircleIcon className="w-10 h-10 text-slate-300" />
            </div>
            <h3 className="text-xl font-black text-slate-800 mb-2">Todo en orden</h3>
            <p className="text-slate-500">No hay reportes con estado "{filtro}"</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-10">
            {reportesFiltrados.map((reporte) => (
              <div 
                key={reporte.id_reporte} 
                className="group bg-white rounded-[3.5rem] border-2 border-slate-200 shadow-xl shadow-slate-200/40 hover:shadow-2xl hover:shadow-indigo-200/40 hover:border-indigo-400 transition-all duration-500 overflow-hidden"
              >
                <div className="flex flex-col lg:flex-row">
                  {/* Left Accent & Teacher Info */}
                  <div className={`w-full lg:w-72 p-10 flex flex-col items-center justify-center text-center relative ${
                    reporte.estado === 'pendiente' ? 'bg-orange-50/50' : 
                    reporte.estado === 'leído' ? 'bg-blue-50/50' : 'bg-emerald-50/50'
                  }`}>
                    {/* Status Badge Top Left */}
                    <div className={`absolute top-6 left-6 px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                      reporte.estado === 'pendiente' ? 'bg-orange-50 text-orange-600 border-orange-200' : 
                      reporte.estado === 'leído' ? 'bg-blue-50 text-blue-600 border-blue-200' : 
                      'bg-emerald-50 text-emerald-600 border-emerald-200'
                    }`}>
                      {reporte.estado}
                    </div>

                    <div className="relative mb-4">
                      <div className={`w-24 h-24 rounded-[2rem] flex items-center justify-center text-3xl font-black shadow-xl transform group-hover:rotate-12 transition-transform duration-500 ${
                        reporte.estado === 'pendiente' ? 'bg-orange-500 text-white shadow-orange-100' : 
                        reporte.estado === 'leído' ? 'bg-blue-500 text-white shadow-blue-100' : 
                        'bg-emerald-500 text-white shadow-emerald-100'
                      }`}>
                        {(reporte.docente_nombre || "D")[0]}
                      </div>
                      <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-white rounded-2xl shadow-lg flex items-center justify-center">
                        <UserGroupIcon className={`w-5 h-5 ${
                          reporte.estado === 'pendiente' ? 'text-orange-500' : 
                          reporte.estado === 'leído' ? 'text-blue-500' : 'text-emerald-500'
                        }`} />
                      </div>
                    </div>
                    
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Docente Remitente</p>
                    <h4 className="text-lg font-black text-slate-800 leading-tight">
                      {reporte.docente_nombre}
                    </h4>
                  </div>

                  {/* Main Content */}
                  <div className="flex-1 p-10 flex flex-col justify-between border-t lg:border-t-0 lg:border-l border-slate-50">
                    <div>
                      <div className="flex items-center gap-3 mb-4">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 px-3 py-1 rounded-lg">
                          {new Date(reporte.fecha).toLocaleDateString('es-ES', { dateStyle: 'full' })}
                        </span>
                      </div>
                      
                      <h4 className="text-2xl font-black text-slate-900 mb-4 tracking-tight group-hover:text-indigo-600 transition-colors">
                        {reporte.titulo || "Incidencia Reportada"}
                      </h4>
                      <p className="text-slate-500 font-medium leading-relaxed text-lg italic">
                        "{reporte.descripcion}"
                      </p>
                    </div>

                    <div className="mt-10 flex flex-wrap items-center justify-between gap-6">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-indigo-50 rounded-2xl">
                          <SparklesIcon className="w-6 h-6 text-indigo-600" />
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Sugerencia</p>
                          <p className="text-xs font-bold text-slate-600">Usa la IA para analizar la gravedad</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <button 
                          onClick={() => handleAnalyzeReport(reporte)}
                          className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-indigo-600 transition-all shadow-xl shadow-slate-200 active:scale-95"
                        >
                          <SparklesIcon className="w-4 h-4" />
                          Análisis IA
                        </button>

                        {reporte.estado !== 'resuelto' && (
                          <button 
                            onClick={() => handleUpdateReportStatus(reporte.id_reporte, reporte.estado === 'pendiente' ? 'leído' : 'resuelto')}
                            className="bg-white border-2 border-slate-100 text-slate-700 px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:border-indigo-200 hover:text-indigo-600 transition-all active:scale-95"
                          >
                            {reporte.estado === 'pendiente' ? 'Marcar Leído' : 'Cerrar Caso'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // Modal de Análisis IA
  const ReportAnalysisModal = () => {
    if (!analisisModalOpen) return null;

    return (
      <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setAnalisisModalOpen(false)}></div>
        <div className="relative bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-[3rem] shadow-2xl border border-white/20 animate-in zoom-in-95 duration-300">
          <div className="p-10">
            <button 
              onClick={() => setAnalisisModalOpen(false)}
              className="absolute top-8 right-8 p-3 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-2xl transition-all"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>

            <div className="flex items-center gap-5 mb-10">
              <div className="p-5 bg-gradient-to-tr from-violet-600 to-indigo-600 rounded-3xl shadow-xl shadow-indigo-100">
                <SparklesIcon className="w-8 h-8 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">Análisis Estratégico IA</h3>
                <p className="text-[10px] uppercase tracking-[0.2em] font-black text-violet-500/80">Inteligencia Administrativa CDI</p>
              </div>
            </div>

            <div className="space-y-8">
              <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Reporte Analizado</p>
                <h4 className="text-lg font-black text-slate-800">{selectedReport?.titulo}</h4>
                <p className="text-sm text-slate-500 mt-1">{selectedReport?.docente_nombre} • {new Date(selectedReport?.fecha).toLocaleDateString()}</p>
              </div>

              {analisisLoading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                  <div className="relative w-12 h-12">
                    <div className="absolute inset-0 rounded-full border-2 border-violet-100"></div>
                    <div className="absolute inset-0 rounded-full border-t-2 border-violet-600 animate-spin"></div>
                  </div>
                  <p className="text-sm font-black text-violet-500 animate-pulse uppercase tracking-widest">Generando Estrategia...</p>
                </div>
              ) : (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                  <div className="prose prose-slate max-w-none">
                    <div className="whitespace-pre-line text-slate-600 font-medium leading-relaxed bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
                      {analisisAI}
                    </div>
                  </div>

                  <div className="mt-8 flex gap-4">
                    <button 
                      onClick={() => {
                        handleUpdateReportStatus(selectedReport.id_reporte, 'resuelto');
                        setAnalisisModalOpen(false);
                      }}
                      className="flex-1 bg-emerald-600 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-100 flex items-center justify-center gap-2"
                    >
                      <CheckIcon className="w-5 h-5" /> Resolver Ahora
                    </button>
                    <button 
                      onClick={() => setAnalisisModalOpen(false)}
                      className="px-8 bg-slate-900 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-black transition-all"
                    >
                      Cerrar
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Bot Asistente del Admin
  const AdminBot = () => {
    const [showBubble, setShowBubble] = useState(false);

    useEffect(() => {
      const timer = setTimeout(() => setShowBubble(true), 1500);
      return () => clearTimeout(timer);
    }, []);

    if (activeView !== "dashboard") return null;

    const reportesPendientes = reportes.filter(r => r.estado === 'pendiente').length;

    return (
      <div className="fixed bottom-10 right-10 z-[100] flex flex-col items-end gap-4 pointer-events-none">
        {/* Chat Bubble */}
        <div className={`max-w-xs bg-white p-7 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.15)] border-2 border-slate-200 transition-all duration-700 transform pointer-events-auto ${
          showBubble ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-10 scale-90'
        }`}>
          <div className="relative">
            <button 
              onClick={() => setShowBubble(false)}
              className="absolute -top-2 -right-2 p-1 bg-slate-50 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
            >
              <XMarkIcon className="w-3 h-3" />
            </button>
            <p className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
              <span className="text-xl">👋</span> ¡Hola, Administrador!
            </p>
            <div className="space-y-3">
              <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                Hoy tenemos un excelente progreso en el CDI. Aquí tienes un resumen rápido:
              </p>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-indigo-50 p-3 rounded-2xl border border-indigo-100/50">
                  <p className="text-[9px] font-black text-indigo-400 uppercase tracking-tighter">Niños</p>
                  <p className="text-lg font-black text-indigo-700 leading-none">{stats.totalNinos}</p>
                </div>
                <div className="bg-emerald-50 p-3 rounded-2xl border border-emerald-100/50">
                  <p className="text-[9px] font-black text-emerald-400 uppercase tracking-tighter">Docentes</p>
                  <p className="text-lg font-black text-emerald-700 leading-none">{stats.totalDocentes}</p>
                </div>
                <div className="col-span-2 bg-orange-50 p-3 rounded-2xl border border-orange-100/50 flex items-center justify-between">
                  <div>
                    <p className="text-[9px] font-black text-orange-400 uppercase tracking-tighter">Reportes Pendientes</p>
                    <p className="text-lg font-black text-orange-700 leading-none">{reportesPendientes}</p>
                  </div>
                  {reportesPendientes > 0 && (
                    <div className="w-2 h-2 rounded-full bg-orange-500 animate-ping"></div>
                  )}
                </div>
              </div>
              <button 
                onClick={() => setActiveView("reportes")}
                className="w-full py-2.5 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-lg shadow-slate-100"
              >
                Ver Reportes
              </button>
            </div>
          </div>
          {/* Arrow */}
          <div className="absolute -bottom-2 right-8 w-4 h-4 bg-white border-r border-b border-slate-100 rotate-45"></div>
        </div>

        {/* Robot Avatar */}
        <div 
          className="w-20 h-20 bg-gradient-to-tr from-slate-900 to-slate-800 rounded-3xl shadow-2xl flex items-center justify-center border-[6px] border-white ring-4 ring-slate-100 cursor-pointer hover:scale-110 active:scale-95 transition-all duration-300 pointer-events-auto group relative overflow-hidden"
          onClick={() => setShowBubble(!showBubble)}
        >
          <div className="absolute inset-0 bg-indigo-500/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <CpuChipIcon className="w-10 h-10 text-white relative z-10" />
          
          {/* Pulsing Aura */}
          <div className="absolute inset-0 rounded-3xl border-2 border-white/30 animate-ping"></div>
        </div>
      </div>
    );
  };

  return (
    <DashboardLayout
      title={
        activeView === "gestion"
          ? "Gestión de Docentes"
          : activeView === "reportes"
          ? "Reportes"
          : "Dashboard Administrador"
      }
      onDashboardClick={handleDashboardClick}
      onGestionClick={handleGestionClick}
      onReportesClick={handleReportesClick}
    >
      {loading ? (
        <p className="text-gray-500 text-center py-12">Cargando estadísticas...</p>
      ) : (
        <>
          {/* Vista Principal: Dashboard */}
          {activeView === "dashboard" && (
            <div className="animate-fade-in">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <StatCard 
                  title="Niños Activos" 
                  value={stats.totalNinos} 
                  Icon={AcademicCapIcon} 
                  color="text-indigo-900" 
                  iconColor="text-indigo-600" 
                  bgGlow="bg-indigo-400" 
                />
                <StatCard 
                  title="Docentes" 
                  value={stats.totalDocentes} 
                  Icon={UserGroupIcon} 
                  color="text-blue-900" 
                  iconColor="text-blue-600" 
                  bgGlow="bg-blue-400" 
                />
                <StatCard 
                  title="Usuarios Totales" 
                  value={stats.totalUsuarios} 
                  Icon={UsersIcon} 
                  color="text-purple-900" 
                  iconColor="text-purple-600" 
                  bgGlow="bg-purple-400" 
                />
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-800 to-indigo-900 leading-none">Resumen General</h3>
                    <p className="text-[11px] text-slate-500 mt-1">Distribución de usuarios en la plataforma</p>
                  </div>
                </div>
                <div className="w-full h-64">
                  <ResponsiveContainer>
                    <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorCantidad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0.2}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b'}} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b'}} dx={-10} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                        cursor={{fill: '#f8fafc'}}
                      />
                      <Bar dataKey="cantidad" fill="url(#colorCantidad)" radius={[6, 6, 0, 0]} maxBarSize={60} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* Vista Principal: Reportes */}
          {activeView === "reportes" && <ReportesPanel />}

          {/* Vista de Gestión */}
          {activeView === "gestion" && (
            <div className="animate-fade-in">
              {gestionLoading ? (
                <div className="w-full py-20 flex items-center justify-center min-h-[400px]">
                  <div className="text-center">
                    <div className="relative w-20 h-20 mx-auto mb-6">
                      <div className="absolute inset-0 rounded-full border-t-2 border-indigo-500 animate-spin"></div>
                      <div className="absolute inset-2 rounded-full border-r-2 border-blue-400 animate-spin shadow-[0_0_15px_rgba(79,70,229,0.5)]" style={{animationDirection: 'reverse'}}></div>
                    </div>
                    <h3 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-800 to-indigo-900 mb-2">Cargando Gestión...</h3>
                    <p className="text-slate-500">Obteniendo docentes y grupos</p>
                  </div>
                </div>
              ) : gestionError ? (
                <div className="w-full py-12">
                  <div className="bg-red-50/50 backdrop-blur-sm border border-red-200/60 rounded-3xl p-10 text-center max-w-2xl mx-auto shadow-sm">
                    <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                      <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-bold text-red-900 mb-2">{gestionError}</h3>
                    <p className="text-red-600/80 mb-8">Intenta recargando la página o verifica la conexión con el servidor backend.</p>
                    <button
                      onClick={() => window.location.reload()}
                      className="bg-red-500 hover:bg-red-600 text-white font-semibold py-3 px-8 rounded-xl transition-all duration-300 shadow-md hover:shadow-lg active:scale-95"
                    >
                      Recargar
                    </button>
                  </div>
                </div>
              ) : (
                <div className="w-full">
                  {gestionSubView === "cards" && (
                    <GestionCards
                      onCreateDocente={() => setGestionSubView("createDocente")}
                      onCreateGrupo={() => setGestionSubView("createGrupo")}
                      onViewDocentes={() => setGestionSubView("docentes")}
                      onViewGrupos={() => setGestionSubView("grupos")}
                      onReportes={() => setGestionSubView("reportes")}
                      onViewAcudientes={() => setGestionSubView("acudientes")}
                      docentesCount={docentes.length}
                      gruposCount={grupos.length}
                    />
                  )}

                  {gestionSubView === "reportes" && <ReportesPanel />}

                  {gestionSubView === "createDocente" && (
                    <CreateDocenteForm
                      onBack={() => setGestionSubView("cards")}
                      onRefreshStats={refreshStats}
                      onSuccess={refreshDocentes}
                    />
                  )}

                  {gestionSubView === "createGrupo" && (
                    <CreateGrupoForm
                      onBack={() => setGestionSubView("cards")}
                      onSuccess={refreshGrupos}
                    />
                  )}

                  {/* ✅ FIX: usa handleOpenAsignarModal que limpia estado antes de abrir */}
                  {gestionSubView === "docentes" && (
                    <DocentesList
                      docentes={docentes}
                      grupos={grupos}
                      loading={docentesLoading || gruposLoading}
                      onAsignarGrupo={handleOpenAsignarModal}
                      onBack={() => setGestionSubView("cards")}
                    />
                  )}

                  {gestionSubView === "grupos" && (
                    <GruposList
                      grupos={grupos}
                      loading={gruposLoading}
                      onManageEstudiantes={(grupo) => {
                        setSelectedGrupoManage(grupo);
                        setShowManageModal(true);
                      }}
                      onImportExcel={(grupo) => {
                        setSelectedGrupoExcel(grupo);
                        setShowManageModal(false);
                        setShowExcelModal(true);
                      }}
                      onBack={() => setGestionSubView("cards")}
                    />
                  )}

                  {gestionSubView === "acudientes" && (
                    <GestionAcudientes
                      onBack={() => setGestionSubView("cards")}
                    />
                  )}
                </div>
              )}

              {showExcelModal && selectedGrupoExcel && (
                <ExcelImportModal
                  isOpen={showExcelModal}
                  grupo={selectedGrupoExcel}
                  onClose={() => {
                    setShowExcelModal(false);
                    setSelectedGrupoExcel(null);
                  }}
                  onSuccess={refreshGrupos}
                />
              )}

              {showManageModal && selectedGrupoManage && (
                <ManageEstudiantesModal
                  isOpen={showManageModal}
                  grupo={selectedGrupoManage}
                  onClose={() => {
                    setShowManageModal(false);
                    setSelectedGrupoManage(null);
                    refreshGrupos();
                  }}
                />
              )}

              <AsignarGrupoModal
                isOpen={showAsignarModal}
                docente={selectedDocente}
                grupos={grupos}
                grupoSeleccionado={selectedGrupos}
                onGrupoChange={handleGrupoChange}
                onSubmit={handleAsignarGrupoSubmit}
                onClose={handleCloseAsignarModal}
                asignando={asignandoGrupo}
                error={grupoError}
              />
            </div>
          )}
        </>
      )}
      <SearchStudentModal 
        isOpen={searchModalOpen} 
        onClose={() => setSearchModalOpen(false)} 
        role="admin" 
      />

      <ReportAnalysisModal />
      <AdminBot />
    </DashboardLayout>
  );
}