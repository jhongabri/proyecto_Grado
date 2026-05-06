import { useEffect, useState, useRef } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import API from "../api/axios";
import EvaluacionModal from "../components/docente/EvaluacionModal";

import {
  AcademicCapIcon,
  UserGroupIcon,
  CalendarIcon,
  ArrowUpTrayIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  TrashIcon,
  UserPlusIcon,
  PencilIcon
} from "@heroicons/react/24/outline";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const COLORS = ["#22c55e", "#ef4444", "#eab308"];

export default function DocenteDashboard() {
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState("dashboard");
  const [gestionSubView, setGestionSubView] = useState("asistencia"); // asistencia, estudiantes, tareas
  
  // Datos del dashboard
  const [grupos, setGrupos] = useState([]);
  const [grupoActivo, setGrupoActivo] = useState(null);
  const [estudiantes, setEstudiantes] = useState([]);
  const [estadisticas, setEstadisticas] = useState({});
  const [reportes, setReportes] = useState([]);
  
  // Estados para asistencia
  const [fechaAsistencia, setFechaAsistencia] = useState(new Date().toISOString().split('T')[0]);
  const [estudiantesAsistencia, setEstudiantesAsistencia] = useState([]);
  const [asistenciaCargada, setAsistenciaCargada] = useState(false);
  const [asistenciaLoading, setAsistenciaLoading] = useState(false);
  
  // Estados para importar Excel
  const [file, setFile] = useState(null);
  const [importResult, setImportResult] = useState(null);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef(null);
  
  // Estados para reportes
  const [reporteTitulo, setReporteTitulo] = useState("");
  const [reporteDescripcion, setReporteDescripcion] = useState("");
  const [reporteTipo, setReporteTipo] = useState("general");
  const [reporteSuccess, setReporteSuccess] = useState("");
  const [reporteError, setReporteError] = useState("");

  // Estados estudiantes lista manual
  const [estLista, setEstLista] = useState([]);
  const [estListaLoading, setEstListaLoading] = useState(false);
  const [addForm, setAddForm] = useState({ nombres: "", apellidos: "", fecha_nacimiento: "", documento: "" });
  const [addingError, setAddingError] = useState("");
  const [addingSuccess, setAddingSuccess] = useState("");
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // ====== ESTADOS TAREAS ======
  const [tareas, setTareas] = useState([]);
  const [tareasLoading, setTareasLoading] = useState(false);
  const [nuevaTarea, setNuevaTarea] = useState({ titulo: "", descripcion: "", fecha_entrega: "", recurso_url: "" });
  const [estrellas, setEstrellas] = useState({}); // { id_nino: cantidad }

  // ====== ESTADOS EVALUACIÓN ======
  const [evaluaciones, setEvaluaciones] = useState([]);
  const [evalLoading, setEvalLoading] = useState(false);
  const [evalModalOpen, setEvalModalOpen] = useState(false);
  const [evalEstudiante, setEvalEstudiante] = useState(null);

  // Handlers para el sidebar
  const handleDashboardClick = () => setActiveView("dashboard");
  const handleGestionClick = () => setActiveView("gestion");
  const handleReportesClick = () => setActiveView("reportes");

  // Cargar datos del dashboard
  const fetchDashboardData = async (idGrupo = null) => {
    try {
      const url = idGrupo ? `/docente/dashboard?id_grupo=${idGrupo}` : "/docente/dashboard";
      const res = await API.get(url);
      setGrupos(res.data.grupos || []);
      setGrupoActivo(res.data.grupoActivo);
      setEstudiantes(res.data.estudiantes);
      setEstadisticas(res.data.estadisticas);
      setReportes(res.data.reportes);
    } catch (error) {
      console.error("Error fetching dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Cambiar de grupo activo
  const handleGrupoChange = (e) => {
    const id = e.target.value;
    setLoading(true);
    setAsistenciaCargada(false);
    fetchDashboardData(id);
  };

  // Cargar estudiantes para asistencia
  const loadEstudiantesAsistencia = async (fecha) => {
    if (!grupoActivo) return;
    setAsistenciaLoading(true);
    try {
      const res = await API.get(`/docente/estudiantes?fecha=${fecha}&id_grupo=${grupoActivo.id_grupo}`);
      setEstudiantesAsistencia(res.data.estudiantes);
      
      const newEstrellas = {};
      res.data.estudiantes.forEach(est => {
        newEstrellas[est.id_nino] = est.comportamiento_estrellas || 0;
      });
      setEstrellas(newEstrellas);
      setAsistenciaCargada(true);
    } catch (error) {
      console.error("Error loading students:", error);
    } finally {
      setAsistenciaLoading(false);
    }
  };

  // Cambiar fecha de asistencia
  const handleFechaChange = (e) => {
    const nuevaFecha = e.target.value;
    setFechaAsistencia(nuevaFecha);
    setAsistenciaCargada(false);
    loadEstudiantesAsistencia(nuevaFecha);
  };

  // Marcar asistencia de un estudiante
  const handleAsistencia = async (idMatricula, estado) => {
    try {
      await API.post("/docente/asistencia", {
        id_matricula: idMatricula,
        fecha: fechaAsistencia,
        estado,
        observacion: "",
        id_grupo: grupoActivo.id_grupo
      });
      
      // Actualizar localmente para feedback inmediato
      setEstudiantesAsistencia(prev => 
        prev.map(est => est.id_matricula === idMatricula ? { ...est, asistencia_estado: estado } : est)
      );
    } catch (error) {
      console.error("Error registering attendance:", error);
    }
  };

  // Importar estudiantes desde Excel
  const handleImport = async (e) => {
    e.preventDefault();
    
    if (!file) {
      setImportResult({ errores: ["Selecciona un archivo primero"] });
      return;
    }

    if (!grupoActivo) {
      setImportResult({ errores: ["No tienes un grupo asignado"] });
      return;
    }

    setImporting(true);
    const formData = new FormData();
    formData.append("archivo", file);
    formData.append("id_grupo", grupoActivo.id_grupo);

    try {
      const res = await API.post("/docente/importar", formData);
      
      setImportResult(res.data.resultados);
      
      // Recargar datos del dashboard
      const dashRes = await API.get("/docente/dashboard");
      setEstudiantes(dashRes.data.estudiantes);
      
      // Recargar estudiantes de asistencia
      loadEstudiantesAsistencia(fechaAsistencia);
      
    } catch (error) {
      setImportResult({ errores: [error.response?.data?.message || "Error al importar"] });
    } finally {
      setImporting(false);
    }
  };

  // ========== MANUAL MANAGEMENT FUNCTIONS ============
  const loadEstudiantesLista = async () => {
    setEstListaLoading(true);
    try {
      const res = await API.get("/docente/estudiantes/lista");
      setEstLista(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setEstListaLoading(false);
    }
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setAdding(true);
    setAddingError("");
    setAddingSuccess("");
    try {
      if (editingId) {
        await API.put(`/docente/estudiantes/${editingId}`, addForm);
        setAddingSuccess("Estudiante actualizado correctamente.");
      } else {
        await API.post("/docente/estudiantes/manual", addForm);
        setAddingSuccess("Estudiante agregado correctamente.");
      }
      setAddForm({ nombres: "", apellidos: "", fecha_nacimiento: "", documento: "" });
      setEditingId(null);
      loadEstudiantesLista();
      setTimeout(() => setAddingSuccess(""), 3000);
      
      const dashRes = await API.get("/docente/dashboard");
      setEstudiantes(dashRes.data.estudiantes);
    } catch (err) {
      setAddingError(err.response?.data?.message || "Error al procesar estudiante.");
    } finally {
       setAdding(false);
    }
  };

  const handleEditClick = (est) => {
    setEditingId(est.id_nino);
    setAddForm({
      nombres: est.nombres,
      apellidos: est.apellidos,
      fecha_nacimiento: est.fecha_nacimiento ? est.fecha_nacimiento.split('T')[0] : "",
      documento: est.documento || ""
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setAddForm({ nombres: "", apellidos: "", fecha_nacimiento: "", documento: "" });
  };

  const handleDeleteEstudiante = async (id_matricula) => {
    if (!window.confirm("¿Seguro que deseas retirar a este estudiante de tu grupo?")) return;
    setAddingError("");
    try {
      await API.delete(`/docente/estudiantes/${id_matricula}`);
      loadEstudiantesLista();
      
      const dashRes = await API.get("/docente/dashboard");
      setEstudiantes(dashRes.data.estudiantes);
    } catch (err) {
      alert("Error al retirar al estudiante.");
    }
  };
  // ===================================================

  // Crear reporte
  const handleCrearReporte = async (e) => {
    e.preventDefault();
    setReporteError("");
    setReporteSuccess("");

    try {
      await API.post("/docente/reportes", {
        titulo: reporteTitulo,
        descripcion: reporteDescripcion,
        tipo: reporteTipo,
      });

      setReporteSuccess("Reporte enviado exitosamente");
      setReporteTitulo("");
      setReporteDescripcion("");
      setReporteTipo("general");
      
      // Recargar reportes
      const res = await API.get("/docente/dashboard");
      setReportes(res.data.reportes);
      
    } catch (error) {
      setReporteError(error.response?.data?.message || "Error al enviar reporte");
    }
  };

  // ====== TAREAS BACKEND HANDLERS ======
  const loadTareas = async () => {
    if (!grupoActivo) return;
    setTareasLoading(true);
    try {
      const res = await API.get(`/docente/tareas?id_grupo=${grupoActivo.id_grupo}`);
      setTareas(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setTareasLoading(false);
    }
  };

  const handleCrearTarea = async (e) => {
    e.preventDefault();
    if (!grupoActivo) return;
    try {
      await API.post("/docente/tareas", {
        ...nuevaTarea,
        id_grupo: grupoActivo.id_grupo
      });
      setNuevaTarea({ titulo: "", descripcion: "", fecha_entrega: "", recurso_url: "" });
      loadTareas();
    } catch (error) {
      console.error(error);
    }
  };

  const handleEliminarTarea = async (id) => {
    if (!window.confirm("¿Eliminar esta tarea?")) return;
    try {
      await API.delete(`/docente/tareas/${id}`);
      loadTareas();
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    if (activeView === "gestion" && gestionSubView === "tareas") {
      loadTareas();
    }
  }, [activeView, gestionSubView, grupoActivo]);

  // Cargar evaluaciones del grupo
  const loadEvaluaciones = async () => {
    if (!grupoActivo) return;
    setEvalLoading(true);
    try {
      const res = await API.get(`/docente/evaluaciones?id_grupo=${grupoActivo.id_grupo}`);
      setEvaluaciones(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setEvalLoading(false);
    }
  };

  useEffect(() => {
    if (activeView === "gestion" && gestionSubView === "evaluacion") {
      loadEvaluaciones();
    }
  }, [activeView, gestionSubView, grupoActivo]);

  const handletoggleEstrella = async (idNino) => {
    const actuales = estrellas[idNino] || 0;
    // Otorgar hasta 5 estrellas max, luego reinicia
    const nuevasEstrellas = actuales >= 5 ? 0 : actuales + 1;
    
    try {
       await API.post("/docente/comportamiento", {
         id_nino: idNino,
         estrellas: nuevasEstrellas
       });

       setEstrellas({
         ...estrellas,
         [idNino]: nuevasEstrellas
       });
    } catch (error) {
       console.error("Error al guardar estrellas:", error);
    }
  };

  // Datos para gráficos
  const chartData = [
    { name: "Presentes", value: estadisticas.presentes || 0 },
    { name: "Ausentes", value: estadisticas.ausentes || 0 },
  ];

  if (loading) {
    return (
      <DashboardLayout title="Panel Docente">
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">Cargando datos...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title={
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <span>
            {activeView === "gestion" ? "Gestión" : activeView === "reportes" ? "Reportes" : "Dashboard"}
          </span>
          {grupos.length > 0 && (
            <select 
              value={grupoActivo?.id_grupo || ""} 
              onChange={handleGrupoChange}
              className="text-sm bg-white/10 border border-white/20 rounded-lg px-3 py-1 text-white focus:outline-none focus:ring-2 focus:ring-white/50"
            >
              {grupos.map(g => (
                <option key={g.id_grupo} value={g.id_grupo} className="text-gray-800">
                  {g.nombre}
                </option>
              ))}
            </select>
          )}
        </div>
      }
      onDashboardClick={handleDashboardClick}
      onGestionClick={handleGestionClick}
      onReportesClick={handleReportesClick}
    >
      {/* ===== VISTA DASHBOARD ===== */}
      {activeView === "dashboard" && (
        <>
          {grupoActivo ? (
            <>
              {/* Info del Grupo */}
              <div className="bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-800 rounded-3xl p-8 mb-8 text-white shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl"></div>
                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                  <div>
                    <h2 className="text-3xl font-extrabold tracking-tight">{grupoActivo.nombre}</h2>
                    <div className="flex flex-wrap gap-3 mt-3">
                      <span className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-medium border border-white/10">
                        Edades: {grupoActivo.edad_minima} - {grupoActivo.edad_maxima} años
                      </span>
                      <span className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-medium border border-white/10 flex items-center">
                        <CalendarIcon className="w-3.5 h-3.5 mr-1" />
                        {grupoActivo.horario || "Horario no definido"}
                      </span>
                    </div>
                  </div>
                  <div className="text-center bg-white/20 backdrop-blur-lg rounded-2xl p-5 border border-white/20 min-w-[140px] shadow-lg">
                    <p className="text-5xl font-black">{grupoActivo.total_estudiantes}</p>
                    <p className="text-blue-100 text-xs font-bold uppercase tracking-widest mt-1">Estudiantes</p>
                  </div>
                </div>
              </div>

              {/* Tarjetas de estadísticas */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <StatCard
                  title="Total Registros"
                  value={estadisticas.total_asistencias}
                  Icon={CalendarIcon}
                  color="text-blue-600"
                />
                <StatCard
                  title="Presentes"
                  value={estadisticas.presentes}
                  Icon={CheckCircleIcon}
                  color="text-green-600"
                />
                <StatCard
                  title="Ausentes"
                  value={estadisticas.ausentes}
                  Icon={XCircleIcon}
                  color="text-red-600"
                />
                <StatCard
                  title="% Asistencia"
                  value={`${estadisticas.porcentaje_asistencia}%`}
                  Icon={AcademicCapIcon}
                  color="text-indigo-600"
                />
              </div>

              {/* Gráficos */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                  <h3 className="text-lg font-semibold text-gray-700 mb-4">
                    Asistencia del Mes
                  </h3>
                  <div className="h-64">
                    <ResponsiveContainer>
                      <BarChart
                        data={[
                          { name: "Presentes", cantidad: estadisticas.presentes },
                          { name: "Ausentes", cantidad: estadisticas.ausentes },
                        ]}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="cantidad" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                  <h3 className="text-lg font-semibold text-gray-700 mb-4">
                    Porcentaje de Asistencia
                  </h3>
                  <div className="h-64">
                    <ResponsiveContainer>
                      <PieChart>
                        <Pie
                          data={chartData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                          label={({ name, percent }) =>
                            `${name} ${(percent * 100).toFixed(0)}%`
                          }
                        >
                          {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Lista de estudiantes */}
              <div className="mt-6 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-700 mb-4">
                  Mis Estudiantes ({estudiantes.length})
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                      <tr>
                        <th className="px-4 py-3">Nombres</th>
                        <th className="px-4 py-3">Apellidos</th>
                        <th className="px-4 py-3">Fecha Nacimiento</th>
                      </tr>
                    </thead>
                    <tbody>
                      {estudiantes.map((est) => (
                        <tr key={est.id_matricula} className="border-b hover:bg-gray-50">
                          <td className="px-4 py-3 font-medium">{est.nombres}</td>
                          <td className="px-4 py-3">{est.apellidos}</td>
                          <td className="px-4 py-3">{est.fecha_nacimiento}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-center">
              <ExclamationTriangleIcon className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-yellow-800">
                Sin grupo asignado
              </h3>
              <p className="text-yellow-600 mt-2">
                Contacta al administrador para que te asigne un grupo.
              </p>
            </div>
          )}
        </>
      )}

      {/* ===== VISTA GESTIÓN ===== */}
      {activeView === "gestion" && grupoActivo && (
        <div className="space-y-8 animate-fade-in">
          {/* Tabs Navigation */}
          <div className="flex space-x-2 bg-slate-100/80 p-1.5 rounded-2xl w-fit shadow-inner border border-slate-200/60">
            <button
              onClick={() => setGestionSubView("asistencia")}
              className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 flex items-center gap-2 ${
                gestionSubView === "asistencia"
                  ? "bg-white text-indigo-600 shadow-md ring-1 ring-slate-900/5"
                  : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
              }`}
            >
              <CalendarIcon className="w-5 h-5" /> Asistencia
            </button>
            <button
              onClick={() => {
                setGestionSubView("estudiantes");
                loadEstudiantesLista();
              }}
              className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 flex items-center gap-2 ${
                gestionSubView === "estudiantes"
                  ? "bg-white text-indigo-600 shadow-md ring-1 ring-slate-900/5"
                  : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
              }`}
            >
              <UserGroupIcon className="w-5 h-5" /> Estudiantes
            </button>
            <button
              onClick={() => setGestionSubView("tareas")}
              className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 flex items-center gap-2 ${
                gestionSubView === "tareas"
                  ? "bg-white text-indigo-600 shadow-md ring-1 ring-slate-900/5"
                  : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
              }`}
            >
              <DocumentTextIcon className="w-5 h-5" /> Tareas
            </button>
            <button
              onClick={() => setGestionSubView("evaluacion")}
              className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 flex items-center gap-2 ${
                gestionSubView === "evaluacion"
                  ? "bg-white text-indigo-600 shadow-md ring-1 ring-slate-900/5"
                  : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
              }`}
            >
              <AcademicCapIcon className="w-5 h-5" /> Evaluación
            </button>
          </div>

          {/* Sección: Gestionar Estudiantes (Estudiantes Tab) */}
          {gestionSubView === "estudiantes" && (
          <div className="bg-white p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100">
            {/* Top row: Excel Importer */}
            <div className="mb-10 bg-slate-50 border border-slate-200 p-6 rounded-2xl">
              <h3 className="text-lg font-semibold text-gray-700 mb-2 flex items-center">
                <ArrowUpTrayIcon className="w-5 h-5 mr-2 text-blue-600" />
                Importar Masivamente desde Excel
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                El archivo debe tener las columnas: nombres, apellidos, fecha_nacimiento, documento
              </p>
              
              <form onSubmit={handleImport} className="space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <input
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={(e) => setFile(e.target.files[0])}
                    ref={fileInputRef}
                    className="block w-full text-sm text-gray-500
                      file:mr-4 file:py-2 file:px-4
                      file:rounded-full file:border-0
                      file:text-sm file:font-semibold
                      file:bg-blue-100 file:text-blue-700
                      hover:file:bg-blue-200"
                  />
                  <button
                    type="submit"
                    disabled={importing}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-xl disabled:opacity-50 transition w-full sm:w-auto"
                  >
                    {importing ? "Importando..." : "Cargar Excel"}
                  </button>
                </div>
              </form>

              {importResult && !importResult.errores?.length && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 p-4 rounded-xl mt-4 text-sm flex items-start shadow-sm animate-fade-in">
                   <CheckCircleIcon className="w-6 h-6 mr-3 text-emerald-500 shrink-0" />
                   <div>
                     <p className="font-bold text-base mb-1">¡Importación Exitosa!</p>
                     <p className="font-medium">• {importResult.creados} creados, {importResult.existentes} existentes.</p>
                   </div>
                </div>
              )}
              
              {importResult && importResult.errores && importResult.errores.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-xl mt-4 text-sm shadow-sm animate-fade-in">
                   <div className="flex items-start">
                     <ExclamationTriangleIcon className="w-6 h-6 mr-3 text-amber-500 shrink-0" />
                     <div>
                       <p className="font-bold text-base mb-1 tracking-wide">Importación con Advertencias/Errores</p>
                       <ul className="list-disc pl-5 mt-2 space-y-1 text-red-600">
                         {importResult.errores.map((err, i) => (<li key={i}>{err}</li>))}
                       </ul>
                     </div>
                   </div>
                </div>
              )}
            </div>

            {/* Bottom Row: Manual Addition and List */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Add form */}
              <div className="lg:col-span-1 bg-slate-50/50 rounded-2xl p-5 border border-slate-200 h-max shadow-sm">
                <h3 className="text-base font-bold text-slate-800 flex items-center mb-4">
                  <UserPlusIcon className="w-4 h-4 mr-2 text-indigo-500" />
                  {editingId ? "Editar Alumno" : "Agregar Manualmente"}
                </h3>
                <form onSubmit={handleAddSubmit} className="space-y-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 ml-1">Nombres *</label>
                    <input required type="text" value={addForm.nombres} onChange={(e) => setAddForm({ ...addForm, nombres: e.target.value })} className="w-full border border-slate-200 rounded-xl px-3 py-1.5 text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none transition-all" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 ml-1">Apellidos *</label>
                    <input required type="text" value={addForm.apellidos} onChange={(e) => setAddForm({ ...addForm, apellidos: e.target.value })} className="w-full border border-slate-200 rounded-xl px-3 py-1.5 text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none transition-all" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 ml-1">Fecha de Nacimiento *</label>
                    <input required type="date" value={addForm.fecha_nacimiento} onChange={(e) => setAddForm({ ...addForm, fecha_nacimiento: e.target.value })} className="w-full border border-slate-200 rounded-xl px-3 py-1.5 text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none transition-all" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 ml-1">Documento (Opcional)</label>
                    <input type="text" value={addForm.documento} onChange={(e) => setAddForm({ ...addForm, documento: e.target.value })} className="w-full border border-slate-200 rounded-xl px-3 py-1.5 text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none transition-all" />
                  </div>
                  <div className="space-y-2">
                    <button disabled={adding} type="submit" className={`w-full ${editingId ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-200' : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200'} text-white font-bold py-2 rounded-xl transition shadow-lg active:scale-[0.98] disabled:opacity-50 text-xs`}>
                      {adding ? "Guardando..." : editingId ? "Actualizar Alumno" : "Agregar al Grupo"}
                    </button>
                    {editingId && (
                      <button type="button" onClick={cancelEdit} className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold py-2 rounded-xl transition text-xs">
                        Cancelar
                      </button>
                    )}
                  </div>
                </form>
              </div>

              {/* List */}
              <div className="lg:col-span-2">
                <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center justify-between">
                   <span>Lista Actual del Grupo ({estLista.length})</span>
                </h3>
                
                {addingError && <div className="bg-red-50 text-red-600 px-4 py-2 rounded-xl mb-4 text-xs border border-red-200">{addingError}</div>}
                {addingSuccess && <div className="bg-emerald-50 text-emerald-600 px-4 py-2 rounded-xl mb-4 text-xs border border-emerald-200">{addingSuccess}</div>}

                {estListaLoading ? (
                  <div className="flex justify-center p-10"><div className="animate-spin h-6 w-6 border-b-2 border-indigo-600 rounded-full"></div></div>
                ) : estLista.length === 0 ? (
                  <div className="text-center p-10 bg-slate-50 border border-slate-200 rounded-2xl border-dashed">
                    <p className="text-xs text-slate-400">No hay estudiantes en tu grupo.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto border border-slate-200 rounded-2xl shadow-sm">
                    <table className="w-full text-left text-xs whitespace-nowrap">
                      <thead className="bg-slate-100">
                        <tr>
                          <th className="px-4 py-2.5 font-bold text-slate-600 tracking-wide uppercase text-[9px]">Nombre</th>
                          <th className="px-4 py-2.5 font-bold text-slate-600 tracking-wide uppercase text-[9px]">Fecha Nac.</th>
                          <th className="px-4 py-2.5 font-bold text-slate-600 tracking-wide uppercase text-[9px] text-right">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {estLista.map((est) => (
                          <tr key={est.id_matricula} className="hover:bg-slate-50 transition-colors">
                            <td className="px-4 py-2 text-slate-700 font-medium">{est.nombres} {est.apellidos}</td>
                            <td className="px-4 py-2 text-slate-500 font-medium">
                              {est.fecha_nacimiento ? new Date(est.fecha_nacimiento).toLocaleDateString() : 'N/A'}
                            </td>
                            <td className="px-4 py-2 text-right space-x-1">
                              <button onClick={() => handleEditClick(est)} className="text-amber-500 hover:text-amber-700 p-1.5 rounded-lg hover:bg-amber-50 transition" title="Editar">
                                <PencilIcon className="w-4 h-4" />
                              </button>
                              <button onClick={() => handleDeleteEstudiante(est.id_matricula)} className="text-red-500 hover:text-red-700 p-1.5 rounded-lg hover:bg-red-50 transition" title="Retirar">
                                <TrashIcon className="w-4 h-4" />
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
          )}

          {gestionSubView === "asistencia" && (
            <div className="bg-white p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
              <div>
                <h3 className="text-2xl font-black text-slate-800 flex items-center">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center mr-4 shadow-lg shadow-indigo-200">
                    <CalendarIcon className="w-6 h-6 text-white" />
                  </div>
                  Control de Asistencia
                </h3>
                <p className="text-slate-500 mt-1 ml-16">Registra la presencia diaria de tus estudiantes</p>
              </div>
              
              <div className="flex items-center gap-3 bg-slate-50 p-2 rounded-2xl border border-slate-200">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-2">Fecha:</label>
                <input
                  type="date"
                  value={fechaAsistencia}
                  onChange={(e) => {
                    const nf = e.target.value;
                    setFechaAsistencia(nf);
                    setAsistenciaCargada(false);
                  }}
                  className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-all"
                />
              </div>
            </div>

            {!asistenciaCargada ? (
              <div className="flex flex-col items-center justify-center py-16 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-md mb-4">
                  <UserGroupIcon className="w-8 h-8 text-indigo-500" />
                </div>
                <h4 className="text-lg font-bold text-slate-800">¿Listo para empezar?</h4>
                <p className="text-slate-500 text-sm mb-6">Carga la lista de estudiantes para la fecha seleccionada</p>
                <button
                  onClick={() => loadEstudiantesAsistencia(fechaAsistencia)}
                  disabled={asistenciaLoading}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-8 py-3 rounded-2xl shadow-lg shadow-indigo-200 transition-all active:scale-95 disabled:opacity-50"
                >
                  {asistenciaLoading ? "Cargando..." : "Cargar Estudiantes"}
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-fade-in">
                {estudiantesAsistencia.map((est) => (
                  <div 
                    key={est.id_matricula} 
                    className={`group relative bg-white rounded-3xl p-6 border transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${
                      est.asistencia_estado === 'presente' ? 'border-emerald-100 bg-emerald-50/10' : 
                      est.asistencia_estado === 'ausente' ? 'border-red-100 bg-red-50/10' : 'border-slate-100'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-xl font-bold text-slate-600 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                        {est.nombres[0]}{est.apellidos[0]}
                      </div>
                      <button
                        onClick={() => handletoggleEstrella(est.id_nino)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                          (estrellas[est.id_nino] || 0) > 0 
                            ? "bg-amber-100 text-amber-700 border border-amber-200" 
                            : "bg-slate-100 text-slate-400 border border-slate-200 hover:bg-amber-50 hover:text-amber-600 hover:border-amber-100"
                        }`}
                      >
                        <span className="text-base">⭐</span>
                        {estrellas[est.id_nino] || 0}
                      </button>
                    </div>

                    <h4 className="text-base font-bold text-slate-800 line-clamp-1">{est.nombres}</h4>
                    <p className="text-xs text-slate-500 font-medium">{est.apellidos}</p>

                    <div className="mt-6 flex gap-2">
                      <button
                        onClick={() => handleAsistencia(est.id_matricula, "presente")}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-xs font-bold transition-all ${
                          est.asistencia_estado === "presente"
                            ? "bg-emerald-500 text-white shadow-lg shadow-emerald-200"
                            : "bg-white text-slate-400 border border-slate-200 hover:border-emerald-300 hover:text-emerald-600 hover:bg-emerald-50"
                        }`}
                      >
                        <CheckCircleIcon className="w-4 h-4" />
                        Presente
                      </button>
                      <button
                        onClick={() => handleAsistencia(est.id_matricula, "ausente")}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-xs font-bold transition-all ${
                          est.asistencia_estado === "ausente"
                            ? "bg-red-500 text-white shadow-lg shadow-red-200"
                            : "bg-white text-slate-400 border border-slate-200 hover:border-red-300 hover:text-red-600 hover:bg-red-50"
                        }`}
                      >
                        <XCircleIcon className="w-4 h-4" />
                        Ausente
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          )}

          {/* Tab Content: Tareas / Recursos */}
          {gestionSubView === "tareas" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
              {/* Formulario Nueva Tarea */}
              <div className="lg:col-span-1 bg-white p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 h-fit">
                <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
                    <DocumentTextIcon className="w-6 h-6 text-indigo-600" />
                  </div>
                  Nueva Tarea
                </h3>
                <form onSubmit={handleCrearTarea} className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase mb-1.5 block ml-1">Título / Tema</label>
                    <input
                      required
                      type="text"
                      placeholder="Ej: Guía de colores y formas"
                      value={nuevaTarea.titulo}
                      onChange={(e) => setNuevaTarea({...nuevaTarea, titulo: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase mb-1.5 block ml-1">Descripción de Apoyo</label>
                    <textarea
                      rows="4"
                      placeholder="Instrucciones para que los padres repasen con el niño..."
                      value={nuevaTarea.descripcion}
                      onChange={(e) => setNuevaTarea({...nuevaTarea, descripcion: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none font-medium"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase mb-1.5 block ml-1">Fecha Sugerida de Repaso</label>
                    <input
                      type="date"
                      value={nuevaTarea.fecha_entrega}
                      onChange={(e) => setNuevaTarea({...nuevaTarea, fecha_entrega: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-bold text-slate-600"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase mb-1.5 block ml-1">Link al Recurso (Opcional)</label>
                    <div className="relative">
                      <input
                        type="url"
                        placeholder="https://ejemplo.com/archivo.pdf"
                        value={nuevaTarea.recurso_url}
                        onChange={(e) => setNuevaTarea({...nuevaTarea, recurso_url: e.target.value})}
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all pl-11 font-medium"
                      />
                      <ArrowUpTrayIcon className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-4 rounded-2xl shadow-lg shadow-indigo-200 transition-all active:scale-95 flex items-center justify-center gap-2 mt-4"
                  >
                    Publicar Recurso
                  </button>
                </form>
              </div>

              {/* Lista de Tareas */}
              <div className="lg:col-span-2 flex flex-col">
                <div className="flex items-center justify-between mb-6 px-2">
                  <h3 className="text-xl font-bold text-slate-800">Recursos Publicados</h3>
                  <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-xs font-black tracking-wider uppercase">
                    {tareas.length} Activos
                  </span>
                </div>

                {tareasLoading ? (
                  <div className="flex-1 flex justify-center items-center py-20 bg-white rounded-3xl border border-slate-100 shadow-sm">
                    <div className="animate-spin h-10 w-10 border-4 border-indigo-600 border-t-transparent rounded-full shadow-lg"></div>
                  </div>
                ) : tareas.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center py-20 bg-slate-50/50 rounded-3xl border-2 border-dashed border-slate-100 text-center">
                    <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-md mb-4 text-slate-300">
                      <DocumentTextIcon className="w-8 h-8" />
                    </div>
                    <p className="text-slate-400 text-sm font-bold">No hay recursos publicados para este grupo.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4 overflow-y-auto max-h-[700px] pr-2 custom-scrollbar">
                    {tareas.map((t) => (
                      <div key={t.id_tarea} className="bg-white p-7 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 group relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full bg-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                              <h4 className="text-lg font-black text-slate-800 group-hover:text-indigo-600 transition-colors tracking-tight">{t.titulo}</h4>
                              <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-2 py-1 rounded-lg uppercase tracking-widest flex items-center gap-1">
                                <CalendarIcon className="w-3 h-3" />
                                {new Date(t.fecha_creacion).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="text-slate-500 text-sm leading-relaxed mb-6 font-medium line-clamp-3">{t.descripcion}</p>
                            
                            <div className="flex flex-wrap items-center gap-3">
                              {t.fecha_entrega && (
                                <div className="flex items-center gap-2 text-[11px] font-black text-red-500 bg-red-50 px-4 py-2 rounded-xl border border-red-100 shadow-sm">
                                  <CalendarIcon className="w-4 h-4" />
                                  REPASO: {new Date(t.fecha_entrega).toLocaleDateString()}
                                </div>
                              )}
                              {t.recurso_url && (
                                <a 
                                  href={t.recurso_url} 
                                  target="_blank" 
                                  rel="noreferrer"
                                  className="flex items-center gap-2 text-[11px] font-black text-indigo-600 bg-indigo-50 px-4 py-2 rounded-xl hover:bg-indigo-600 hover:text-white transition-all shadow-sm border border-indigo-100"
                                >
                                  <ArrowUpTrayIcon className="w-4 h-4" />
                                  DESCARGAR RECURSO
                                </a>
                              )}
                            </div>
                          </div>
                          <button 
                            onClick={() => handleEliminarTarea(t.id_tarea)}
                            className="p-2.5 text-slate-200 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all active:scale-90"
                            title="Eliminar Recurso"
                          >
                            <TrashIcon className="w-6 h-6" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tab Content: Evaluación de Desarrollo */}
          {gestionSubView === "evaluacion" && (
            <div className="animate-fade-in">
              <div className="bg-white p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                  <div>
                    <h3 className="text-2xl font-black text-slate-800 flex items-center">
                      <div className="w-12 h-12 rounded-2xl bg-violet-600 flex items-center justify-center mr-4 shadow-lg shadow-violet-200">
                        <AcademicCapIcon className="w-6 h-6 text-white" />
                      </div>
                      Evaluación de Desarrollo
                    </h3>
                    <p className="text-slate-500 mt-1 ml-16">Evalúa el desarrollo integral de cada estudiante por dimensiones</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold">
                      <span className="w-3 h-3 rounded-full bg-red-500"></span> Inicio
                      <span className="w-3 h-3 rounded-full bg-amber-500 ml-2"></span> En Proceso
                      <span className="w-3 h-3 rounded-full bg-emerald-500 ml-2"></span> Esperado
                      <span className="w-3 h-3 rounded-full bg-blue-500 ml-2"></span> Avanzado
                    </div>
                  </div>
                </div>

                {evalLoading ? (
                  <div className="flex justify-center py-16">
                    <div className="animate-spin h-8 w-8 border-b-2 border-violet-600 rounded-full"></div>
                  </div>
                ) : estudiantes.length === 0 ? (
                  <div className="text-center py-16 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                    <AcademicCapIcon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-400 font-bold">No hay estudiantes en tu grupo para evaluar.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {estudiantes.map((est) => {
                      const evalData = evaluaciones.find((e) => e.id_nino === est.id_nino);
                      const initials = `${(est.nombres || "")[0] || ""}${(est.apellidos || "")[0] || ""}`.toUpperCase();
                      const dims = evalData
                        ? [evalData.comunicativa, evalData.cognitiva, evalData.socioafectiva, evalData.corporal, evalData.artistica, evalData.autonomia]
                        : [];
                      const avg = dims.length > 0 ? (dims.reduce((a, b) => a + (b || 0), 0) / dims.filter(Boolean).length) : 0;
                      const getNivelStyle = (v) => {
                        if (v >= 3.5) return { bg: "bg-blue-50", text: "text-blue-600", border: "border-blue-200", label: "Avanzado" };
                        if (v >= 2.5) return { bg: "bg-emerald-50", text: "text-emerald-600", border: "border-emerald-200", label: "Esperado" };
                        if (v >= 1.5) return { bg: "bg-amber-50", text: "text-amber-600", border: "border-amber-200", label: "En Proceso" };
                        return { bg: "bg-red-50", text: "text-red-600", border: "border-red-200", label: "Inicio" };
                      };

                      return (
                        <div
                          key={est.id_nino}
                          className="bg-white border border-slate-200 rounded-2xl p-5 hover:shadow-lg hover:border-violet-200 transition-all duration-300 group cursor-pointer"
                          onClick={() => {
                            setEvalEstudiante(est);
                            setEvalModalOpen(true);
                          }}
                        >
                          <div className="flex items-center gap-3 mb-4">
                            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-sm font-black shadow-md">
                              {initials}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-black text-slate-800 truncate group-hover:text-violet-600 transition-colors">
                                {est.nombres} {est.apellidos}
                              </h4>
                              {evalData ? (
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${getNivelStyle(avg).bg} ${getNivelStyle(avg).text} ${getNivelStyle(avg).border} border`}>
                                  Promedio: {avg.toFixed(1)} — {getNivelStyle(avg).label}
                                </span>
                              ) : (
                                <span className="text-[10px] font-bold text-slate-400">Sin evaluar</span>
                              )}
                            </div>
                          </div>

                          {evalData ? (
                            <div className="grid grid-cols-3 gap-1.5">
                              {[
                                { key: "comunicativa", icon: "💬", label: "Com" },
                                { key: "cognitiva", icon: "🧠", label: "Cog" },
                                { key: "socioafectiva", icon: "🤝", label: "Soc" },
                                { key: "corporal", icon: "🏃", label: "Cor" },
                                { key: "artistica", icon: "🎨", label: "Art" },
                                { key: "autonomia", icon: "⭐", label: "Aut" },
                              ].map((d) => {
                                const val = evalData[d.key];
                                const style = getNivelStyle(val);
                                return (
                                  <div
                                    key={d.key}
                                    className={`${style.bg} ${style.border} border rounded-lg py-1.5 px-2 text-center`}
                                  >
                                    <span className="text-xs">{d.icon}</span>
                                    <p className={`text-[10px] font-black ${style.text}`}>{val}/4</p>
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <div className="flex items-center justify-center py-4 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                              <p className="text-xs text-slate-400 font-bold">Toca para evaluar →</p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      )}

      {/* ===== VISTA REPORTES ===== */}
      {activeView === "reportes" && (
        <div className="animate-fade-in grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Formulario de reportes */}
          <div className="bg-white p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 h-fit">
            <h3 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-800 to-orange-600 mb-6 flex items-center">
              <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center mr-3">
                <DocumentTextIcon className="w-5 h-5 text-orange-600" />
              </div>
              Nuevo Reporte / Queja
            </h3>

            {reporteSuccess && (
              <div className="bg-green-50 border border-green-200 text-green-700 p-4 rounded-xl mb-6 text-sm flex items-center shadow-sm">
                <CheckCircleIcon className="w-5 h-5 mr-2 text-green-500" />
                {reporteSuccess}
              </div>
            )}

            {reporteError && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl mb-6 text-sm flex items-center shadow-sm">
                <ExclamationTriangleIcon className="w-5 h-5 mr-2 text-red-500" />
                {reporteError}
              </div>
            )}

            <form onSubmit={handleCrearReporte} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Tipo de Reporte
                </label>
                <div className="relative">
                  <select
                    value={reporteTipo}
                    onChange={(e) => setReporteTipo(e.target.value)}
                    className="w-full pl-4 pr-10 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 appearance-none bg-slate-50 text-slate-700 font-medium transition-shadow"
                  >
                    <option value="general">General</option>
                    <option value="queja">Queja</option>
                    <option value="sugerencia">Sugerencia</option>
                    <option value="emergencia">Emergencia</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Título
                </label>
                <input
                  type="text"
                  value={reporteTitulo}
                  onChange={(e) => setReporteTitulo(e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-shadow text-slate-700 bg-slate-50"
                  placeholder="Ej. Comportamiento en clase"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Descripción
                </label>
                <textarea
                  value={reporteDescripcion}
                  onChange={(e) => setReporteDescripcion(e.target.value)}
                  required
                  rows={5}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-shadow text-slate-700 resize-none bg-slate-50"
                  placeholder="Describe los detalles relevantes de la situación..."
                />
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold py-3.5 rounded-xl transition-all duration-300 shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 active:scale-95 flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg>
                Enviar Reporte
              </button>
            </form>
          </div>

          {/* Lista de reportes enviados */}
          <div className="bg-white p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 flex flex-col h-full">
            <h3 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-800 to-slate-600 mb-6">
              Mis Reportes Enviados
            </h3>

            {reportes.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center py-12 text-slate-400">
                <DocumentTextIcon className="w-16 h-16 opacity-20 mb-4" />
                <p>No has enviado ningún reporte aún.</p>
              </div>
            ) : (
              <div className="space-y-4 overflow-y-auto pr-2 custom-scrollbar">
                {reportes.map((reporte) => (
                  <div
                    key={reporte.id_reporte}
                    className="p-5 border border-slate-100 bg-slate-50/50 rounded-2xl hover:bg-white hover:border-orange-200 transition-all duration-300 group shadow-sm hover:shadow-md"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <h4 className="font-bold text-slate-800 group-hover:text-orange-600 transition-colors">
                        {reporte.titulo}
                      </h4>
                      <span className="text-xs text-slate-400 font-medium whitespace-nowrap ml-4 bg-white px-3 py-1 rounded-full border border-slate-100 shadow-sm">
                        {new Date(reporte.fecha || reporte.fecha_creacion).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 mb-4 line-clamp-3">
                      {reporte.descripcion}
                    </p>
                    <div className="flex justify-between items-center text-xs font-semibold pt-3 border-t border-slate-200/60 mt-auto">
                      <span className="text-slate-500 uppercase tracking-wider">
                        Tipo: <span className="text-orange-500">{reporte.tipo || 'General'}</span>
                      </span>
                      <span
                        className={`px-3 py-1 rounded-full font-bold ${
                          reporte.estado === "pendiente"
                            ? "bg-amber-100 text-amber-700 border border-amber-200"
                            : reporte.estado === "en_proceso" || reporte.estado === "atendido"
                            ? "bg-blue-100 text-blue-700 border border-blue-200"
                            : "bg-green-100 text-green-700 border border-green-200"
                        }`}
                      >
                        {reporte.estado === "pendiente" ? "Pendiente" : reporte.estado === "en_proceso" ? "En Proceso" : reporte.estado === "atendido" ? "Atendido" : "Resuelto"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal de Evaluación */}
      {evalModalOpen && evalEstudiante && (
        <EvaluacionModal
          estudiante={evalEstudiante}
          idGrupo={grupoActivo?.id_grupo}
          onClose={() => {
            setEvalModalOpen(false);
            setEvalEstudiante(null);
          }}
          onSaved={() => {
            loadEvaluaciones();
          }}
        />
      )}
    </DashboardLayout>
  );
}

function StatCard({ title, value, Icon, color, iconColor = "text-blue-600", bgGlow = "bg-blue-400" }) {
  return (
    <div className="relative group bg-white p-7 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 hover:shadow-[0_8px_40px_rgba(79,70,229,0.12)] transition-all duration-300 hover:-translate-y-1 overflow-hidden cursor-default">
      {/* Decorative background glow */}
      <div className={`absolute -right-10 -top-10 w-32 h-32 ${bgGlow} rounded-full blur-3xl opacity-20 group-hover:opacity-40 transition-opacity duration-500`}></div>
      
      <div className="flex items-center justify-between relative z-10">
        <div className={`p-3.5 rounded-2xl group-hover:scale-110 transition-transform duration-300 shadow-sm ${bgGlow ? bgGlow.replace('bg-', 'bg-opacity-10 bg-') : ''}`}>
          <Icon className={`w-8 h-8 ${iconColor}`} />
        </div>
        <div className="flex h-3 w-3 relative">
           <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
           <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
        </div>
      </div>
      <div className="mt-5 relative z-10">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{title}</p>
        <div className="flex items-baseline gap-2 mt-1">
           <p className={`text-4xl font-extrabold ${color} tracking-tight`}>{value}</p>
        </div>
      </div>
    </div>
  );
}

