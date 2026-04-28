import { useEffect, useState, useRef } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import API from "../api/axios";

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
  const [grupo, setGrupo] = useState(null);
  const [estudiantes, setEstudiantes] = useState([]);
  const [estadisticas, setEstadisticas] = useState({});
  const [reportes, setReportes] = useState([]);
  
  // Estados para asistencia
  const [fechaAsistencia, setFechaAsistencia] = useState(new Date().toISOString().split('T')[0]);
  const [estudiantesAsistencia, setEstudiantesAsistencia] = useState([]);
  const [asistenciaCargada, setAsistenciaCargada] = useState(false);
  
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

  // ====== ESTADOS LOCALES (CDI FEATURES) ======
  const [guias, setGuias] = useState([]);
  const [nuevaGuia, setNuevaGuia] = useState({ titulo: "", descripcion: "", fecha_entrega: "" });
  const [estrellas, setEstrellas] = useState({}); // { id_nino: cantidad }

  // Cargar datos locales al montar
  useEffect(() => {
    const savedGuias = localStorage.getItem("cdi_guias");
    if (savedGuias) {
      setGuias(JSON.parse(savedGuias));
    }
  }, []);

  // Handlers para el sidebar
  const handleDashboardClick = () => setActiveView("dashboard");
  const handleGestionClick = () => setActiveView("gestion");
  const handleReportesClick = () => setActiveView("reportes");

  // Cargar datos del dashboard
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await API.get("/docente/dashboard");
        setGrupo(res.data.grupo);
        setEstudiantes(res.data.estudiantes);
        setEstadisticas(res.data.estadisticas);
        setReportes(res.data.reportes);
      } catch (error) {
        console.error("Error fetching dashboard:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Cargar estudiantes para asistencia
  const loadEstudiantesAsistencia = async (fecha) => {
    try {
      const res = await API.get(`/docente/estudiantes?fecha=${fecha}`);
      setEstudiantesAsistencia(res.data.estudiantes);
      
      // Sincronizar estrellas desde el backend
      const newEstrellas = {};
      res.data.estudiantes.forEach(est => {
        newEstrellas[est.id_nino] = est.comportamiento_estrellas || 0;
      });
      setEstrellas(newEstrellas);

      setAsistenciaCargada(true);
    } catch (error) {
      console.error("Error loading students:", error);
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
      });
      
      // Actualizar la lista
      loadEstudiantesAsistencia(fechaAsistencia);
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

    if (!grupo) {
      setImportResult({ errores: ["No tienes un grupo asignado"] });
      return;
    }

    setImporting(true);
    setImportResult(null);

    const formData = new FormData();
    formData.append("archivo", file);
    formData.append("id_grupo", grupo.id_grupo);

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

  // ====== HANDLERS LOCALES (CDI FEATURES) ======
  const handleCrearGuia = (e) => {
    e.preventDefault();
    const nueva = {
      ...nuevaGuia,
      id: Date.now(),
      fecha_creacion: new Date().toISOString()
    };
    const updatedGuias = [nueva, ...guias];
    setGuias(updatedGuias);
    localStorage.setItem("cdi_guias", JSON.stringify(updatedGuias));
    setNuevaGuia({ titulo: "", descripcion: "", fecha_entrega: "" });
  };

  const handleEliminarGuia = (id) => {
    const updatedGuias = guias.filter(g => g.id !== id);
    setGuias(updatedGuias);
    localStorage.setItem("cdi_guias", JSON.stringify(updatedGuias));
  };

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
        activeView === "gestion"
          ? "Gestión - " + (grupo?.nombre || "Mi Grupo")
          : activeView === "reportes"
          ? "Reportes y Quejas"
          : "Dashboard - " + (grupo?.nombre || "Mi Grupo")
      }
      onDashboardClick={handleDashboardClick}
      onGestionClick={handleGestionClick}
      onReportesClick={handleReportesClick}
    >
      {/* ===== VISTA DASHBOARD ===== */}
      {activeView === "dashboard" && (
        <>
          {grupo ? (
            <>
              {/* Info del Grupo */}
              <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-2xl p-6 mb-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold">{grupo.nombre}</h2>
                    <p className="text-blue-100 mt-1">
                      Edades: {grupo.edad_minima} - {grupo.edad_maxima} años
                    </p>
                    <p className="text-blue-100">
                      Horario: {grupo.horario || "No definido"}
                    </p>
                  </div>
                  <div className="text-center bg-white/20 rounded-xl p-4">
                    <p className="text-4xl font-bold">{grupo.total_estudiantes}</p>
                    <p className="text-blue-100 text-sm">Estudiantes</p>
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
      {activeView === "gestion" && grupo && (
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

          {/* Tab Content: Asistencia */}
          {gestionSubView === "asistencia" && (
          <div className="bg-white p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100">
            <h3 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-800 to-indigo-600 mb-6 flex items-center">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center mr-3">
                <CalendarIcon className="w-5 h-5 text-indigo-600" />
              </div>
              Tomar Asistencia
            </h3>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha:
              </label>
              <input
                type="date"
                value={fechaAsistencia}
                onChange={handleFechaChange}
                className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            {!asistenciaCargada ? (
              <button
                onClick={() => loadEstudiantesAsistencia(fechaAsistencia)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
              >
                Cargar Lista de Estudiantes
              </button>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                    <tr>
                      <th className="px-4 py-3">Estudiante</th>
                      <th className="px-4 py-3">Estado Actual</th>
                      <th className="px-4 py-3 text-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {estudiantesAsistencia.map((est) => (
                      <tr key={est.id_matricula} className="border-b hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium">
                          <div className="flex flex-col">
                            <span>{est.nombres} {est.apellidos}</span>
                            {/* Gamificación: Mostrar estrellas ganadas */}
                            <div className="flex items-center gap-1 mt-1">
                              {[...Array(5)].map((_, i) => (
                                <svg 
                                  key={i} 
                                  className={`w-4 h-4 ${i < (estrellas[est.id_nino] || 0) ? "text-yellow-400" : "text-gray-200"}`} 
                                  fill="currentColor" 
                                  viewBox="0 0 20 20"
                                >
                                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                              ))}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {est.asistencia_estado === "presente" && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Presente
                            </span>
                          )}
                          {est.asistencia_estado === "ausente" && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              Ausente
                            </span>
                          )}
                          {!est.asistencia_estado && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              Sin registrar
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex justify-center flex-wrap gap-2">
                            <button
                              onClick={() => handletoggleEstrella(est.id_nino)}
                              className="px-2 py-1 rounded-lg text-yellow-600 bg-yellow-50 hover:bg-yellow-100 border border-yellow-200 transition-colors flex items-center justify-center"
                              title="Dar/Quitar Estrella de Comportamiento"
                            >
                              ⭐ +
                            </button>
                            <button
                              onClick={() => handleAsistencia(est.id_matricula, "presente")}
                              className={`px-3 py-1 rounded text-white text-xs ${
                                est.asistencia_estado === "presente"
                                  ? "bg-green-600"
                                  : "bg-green-500 hover:bg-green-600"
                              }`}
                            >
                              Presente
                            </button>
                            <button
                              onClick={() => handleAsistencia(est.id_matricula, "ausente")}
                              className={`px-3 py-1 rounded text-white text-xs ${
                                est.asistencia_estado === "ausente"
                                  ? "bg-red-600"
                                  : "bg-red-500 hover:bg-red-600"
                              }`}
                            >
                              Ausente
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          )}

          {/* Tab Content: Guías de Estudio */}
          {gestionSubView === "tareas" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100">
              <h3 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-800 to-violet-600 mb-6 flex items-center">
                <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center mr-3">
                  <DocumentTextIcon className="w-5 h-5 text-violet-600" />
                </div>
                Nueva Guía de Estudio
              </h3>
              <form className="space-y-5" onSubmit={handleCrearGuia}>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Tema / Título</label>
                  <input 
                    type="text" 
                    value={nuevaGuia.titulo}
                    onChange={(e) => setNuevaGuia({...nuevaGuia, titulo: e.target.value})}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-violet-500 bg-slate-50 transition-shadow" 
                    placeholder="Ej. Vocales y Colores" 
                    required 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Descripción y Apoyo</label>
                  <textarea 
                    rows={4} 
                    value={nuevaGuia.descripcion}
                    onChange={(e) => setNuevaGuia({...nuevaGuia, descripcion: e.target.value})}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-violet-500 bg-slate-50 resize-none transition-shadow" 
                    placeholder="Detalles para que el acudiente repase con el niño..." 
                    required>
                  </textarea>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Fecha Sugerida de Repaso</label>
                  <input 
                    type="date" 
                    value={nuevaGuia.fecha_entrega}
                    onChange={(e) => setNuevaGuia({...nuevaGuia, fecha_entrega: e.target.value})}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-violet-500 bg-slate-50 transition-shadow" 
                    required 
                  />
                </div>
                <button type="submit" className="w-full bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600 text-white font-bold py-3.5 rounded-xl transition-all duration-300 shadow-lg shadow-violet-500/30 hover:shadow-violet-500/50 active:scale-95">
                  Asignar Guía
                </button>
              </form>
            </div>
            
            <div className="bg-white p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 flex flex-col">
              <h3 className="text-xl font-bold text-slate-800 mb-6">Guías Asignadas</h3>
              
              {guias.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-400 py-12 border-2 border-dashed border-slate-100 rounded-2xl bg-slate-50/50">
                  <DocumentTextIcon className="w-12 h-12 mb-3 text-slate-300" />
                  <p>No hay guías asignadas</p>
                </div>
              ) : (
                <div className="space-y-4 overflow-y-auto pr-2 custom-scrollbar">
                  {guias.map((guia) => (
                    <div key={guia.id} className="p-5 border border-slate-100 bg-slate-50/50 rounded-2xl hover:bg-white hover:border-violet-200 transition-all duration-300 group shadow-sm">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-bold text-slate-800 group-hover:text-violet-600 transition-colors">
                          {guia.titulo}
                        </h4>
                        <button 
                          onClick={() => handleEliminarGuia(guia.id)}
                          className="text-slate-300 hover:text-red-500 transition-colors p-1"
                          title="Eliminar Guía"
                        >
                          <XCircleIcon className="w-5 h-5" />
                        </button>
                      </div>
                      <p className="text-sm text-slate-600 mb-3">{guia.descripcion}</p>
                      <div className="flex justify-between items-center text-xs font-semibold pt-3 border-t border-slate-200/60 mt-auto">
                        <span className="text-slate-500">
                          Repaso: <span className="text-violet-500">{new Date(guia.fecha_entrega).toLocaleDateString()}</span>
                        </span>
                      </div>
                    </div>
                  ))}
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

