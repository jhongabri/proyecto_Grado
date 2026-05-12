import { useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import {
  HomeIcon,
  Cog6ToothIcon,
  DocumentChartBarIcon,
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  XMarkIcon,
  BellAlertIcon,
  MegaphoneIcon,
  InformationCircleIcon
} from "@heroicons/react/24/outline";

export default function DashboardLayout({ children, title, onDashboardClick, onGestionClick, onReportesClick }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showNotificaciones, setShowNotificaciones] = useState(false);
  const [anuncios, setAnuncios] = useState([]);
  
  useEffect(() => {
    const savedAnuncios = localStorage.getItem("cdi_anuncios");
    if (savedAnuncios) {
      setAnuncios(JSON.parse(savedAnuncios));
    }
  }, [showNotificaciones]); // Recargar al abrir el panel
  
  const usuario = JSON.parse(localStorage.getItem("usuario"));

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("usuario");
    navigate("/");
  };

  // Determinar la "ruta activa" en UI usando los custom handlers
  const [activeItem, setActiveItem] = useState("Dashboard");

  const navItems = [
    { name: "Dashboard", icon: HomeIcon, action: () => { setActiveItem("Dashboard"); onDashboardClick?.(); setSidebarOpen(false); } },
    { name: "Gestión", icon: Cog6ToothIcon, action: () => { setActiveItem("Gestión"); onGestionClick?.(); setSidebarOpen(false); }, roles: [1, 2] },
    { name: "Reportes", icon: DocumentChartBarIcon, action: () => { setActiveItem("Reportes"); onReportesClick?.(); setSidebarOpen(false); }, roles: [1, 2] },
  ].filter(item => !item.roles || item.roles.includes(usuario?.id_rol));

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans overflow-hidden">

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-gradient-to-b from-slate-900 via-slate-800 to-indigo-950 text-white flex flex-col transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 border-r border-indigo-500/10 shadow-2xl lg:shadow-none
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Logo Area */}
        <div className="flex items-center justify-between p-5 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/20 flex items-center justify-center border border-indigo-400/30">
               <svg className="w-5 h-5 text-indigo-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
               </svg>
            </div>
            <div>
              <h1 className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-200 to-indigo-200">Plataforma CDI</h1>
              <p className="text-[9px] uppercase tracking-widest text-indigo-300/60 font-medium">Connect Space</p>
            </div>
          </div>
          <button className="lg:hidden text-indigo-200 hover:text-white" onClick={() => setSidebarOpen(false)}>
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* User Card inside Sidebar */}
        <div className="px-5 py-6">
           <div className="flex items-center gap-3 bg-white/5 p-3 rounded-xl border border-white/5 shadow-inner">
             <div className="relative">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-blue-400 flex items-center justify-center text-white font-bold text-base shadow-lg">
                  {usuario?.nombre?.charAt(0).toUpperCase() || "U"}
                </div>
                <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-400 border-2 border-slate-800 rounded-full"></div>
             </div>
             <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-white truncate">{usuario?.nombre || "Usuario"}</p>
                <p className="text-[10px] text-indigo-300/80 truncate font-medium uppercase tracking-tight">
                  {usuario?.id_rol === 1 ? "Admin" : usuario?.id_rol === 2 ? "Docente" : "Acudiente"}
                </p>
             </div>
           </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => (
            <button
              key={item.name}
              onClick={item.action}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-300 group
                ${activeItem === item.name 
                  ? 'bg-indigo-500/15 text-white border border-indigo-400/20 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]' 
                  : 'text-indigo-200/70 hover:bg-white/5 hover:text-white'
                }
              `}
            >
              <item.icon className={`w-4 h-4 transition-colors duration-300 ${activeItem === item.name ? 'text-indigo-400' : 'text-indigo-400/50 group-hover:text-indigo-300'}`} />
              <span className="font-semibold tracking-tight text-xs">{item.name}</span>
            </button>
          ))}
        </nav>

        {/* Logout */}
        <div className="p-3 border-t border-white/5 m-3 bg-red-500/5 rounded-xl">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 text-red-400/80 hover:text-red-300 hover:bg-red-500/10 py-2.5 rounded-lg text-xs font-bold transition-all duration-300"
          >
            <ArrowRightOnRectangleIcon className="w-4 h-4" />
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden bg-slate-50 relative">
         {/* Decorative subtle background mesh */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoOTksIDEwMiwgMjQxLCAwLjA1KSIvPjwvc3ZnPg==')] opacity-50 pointer-events-none z-0"></div>

        {/* Header / Navbar - Glassmorphism */}
        <header className="sticky top-0 z-30 bg-white/70 backdrop-blur-lg border-b border-indigo-100/50 shadow-sm px-6 py-3 flex justify-between items-center transition-all duration-300">
          <div className="flex items-center gap-3">
            <button 
              className="lg:hidden p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
               onClick={() => setSidebarOpen(true)}
            >
              <Bars3Icon className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-800 to-indigo-900 tracking-tight">
              {title}
            </h2>
          </div>

          <div className="flex items-center space-x-4">
            {/* Notification Bell */}
            <button 
              onClick={() => setShowNotificaciones(!showNotificaciones)}
              className="relative p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all duration-300 group"
            >
              <BellAlertIcon className="w-5 h-5 group-hover:animate-wiggle" />
              {anuncios.length > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 border-2 border-white rounded-full"></span>
              )}
            </button>
          </div>
        </header>

        {/* Main View Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 scroll-smooth">
           <div className="max-w-7xl mx-auto pb-8">
             {children}
           </div>
        </main>

        {/* Slide-over Panel de Anuncios / Notificaciones */}
        {showNotificaciones && (
          <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/20 backdrop-blur-sm transition-opacity">
            <div className="absolute inset-0" onClick={() => setShowNotificaciones(false)}></div>
            <div className="fixed inset-y-0 right-0 max-w-sm w-full flex bg-white shadow-2xl transform transition-transform pointer-events-auto">
              <div className="w-full h-full flex flex-col">
                <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-white z-10">
                  <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                    <MegaphoneIcon className="w-6 h-6 text-indigo-600" /> 
                    Muro Institucional
                  </h2>
                  <button onClick={() => setShowNotificaciones(false)} className="text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-slate-50 transition-colors">
                    <XMarkIcon className="w-6 h-6" />
                  </button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50">
                  {anuncios.length === 0 ? (
                    <div className="text-center text-slate-500 mt-12 flex flex-col items-center">
                      <InformationCircleIcon className="w-16 h-16 text-slate-300 mb-4" />
                      <p className="font-medium text-lg">No hay comunicados</p>
                      <p className="text-sm">Todo está al día por aquí.</p>
                    </div>
                  ) : (
                    anuncios.map((anuncio) => (
                      <div key={anuncio.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 hover:shadow-md transition-shadow relative overflow-hidden group">
                        <div className={`absolute top-0 left-0 w-1 h-full ${anuncio.tipo === 'importante' ? 'bg-red-500' : anuncio.tipo === 'evento' ? 'bg-green-500' : 'bg-blue-500'}`}></div>
                        <div className="flex justify-between items-start mb-2">
                          <span className={`text-xs font-bold uppercase tracking-wider px-2 py-1 rounded-md ${
                            anuncio.tipo === 'importante' ? 'bg-red-50 text-red-600' :
                            anuncio.tipo === 'evento' ? 'bg-green-50 text-green-700' :
                            'bg-blue-50 text-blue-700'
                          }`}>
                            {anuncio.tipo}
                          </span>
                          <span className="text-[10px] text-slate-400 font-semibold">{new Date(anuncio.fecha).toLocaleDateString()}</span>
                        </div>
                        <h3 className="font-bold text-slate-800 mt-3 mb-1">{anuncio.titulo}</h3>
                        <p className="text-sm text-slate-600 leading-relaxed">
                          {anuncio.mensaje}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}