import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axios";

// Componente auxiliar para mostrar cada requisito de la contraseña
const RequirementCheck = ({ label, checked, className = "" }) => (
  <div className={`flex items-center space-x-2 text-xs transition-colors duration-300 ${className}`}>
    {checked ? (
      <svg className="w-4 h-4 text-emerald-500 flex-shrink-0 transition-transform duration-300 scale-110" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
      </svg>
    ) : (
      <svg className="w-4 h-4 text-gray-300 flex-shrink-0 transition-colors duration-300" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10" />
      </svg>
    )}
    <span className={`font-semibold tracking-wide transition-colors duration-300 ${checked ? 'text-emerald-700' : 'text-gray-400'}`}>
      {label}
    </span>
  </div>
);

export default function Register() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    nombre: "",
    correo: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  // 🔐 Reglas de contraseña y cálculo de fuerza en tiempo real
  const password = form.password;
  const checks = {
    length: password.length >= 8,
    hasUpper: /[A-Z]/.test(password),
    hasLower: /[a-z]/.test(password),
    hasNumber: /\d/.test(password),
    hasSpecial: /[@$!%*?&._\-]/.test(password),
  };

  const completedChecksCount = Object.values(checks).filter(Boolean).length;
  const isPasswordSecure = completedChecksCount === 5;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Validación extra en submit por seguridad del cliente
    if (form.password && !isPasswordSecure) {
      setError("La contraseña no cumple con los requisitos mínimos de seguridad.");
      return;
    }

    setLoading(true);

    try {
      const res = await API.post("/auth/register", form);
      console.log("Register response:", res.data);

      // Guardar token y usuario en localStorage
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("usuario", JSON.stringify(res.data.user));
      console.log("Token set:", localStorage.getItem("token"));

      // Redireccionar directamente al dashboard de acudiente
      navigate("/acudiente");

    } catch (err) {
      console.log("Register error:", err.response?.data);
      setError(err.response?.data?.message || "Error al registrarse. Intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="flex min-h-screen bg-white"
      style={{ 
        backgroundImage: 'radial-gradient(#e5e7eb 1px, transparent 1px)', 
        backgroundSize: '24px 24px' 
      }}
    >

      {/* Lado Izquierdo (Formulario) */}
      <div className="w-full md:w-1/2 flex items-center justify-center px-6 py-12 relative z-10">
        <div className="w-full max-w-md space-y-6 bg-white/80 backdrop-blur-sm p-6 sm:p-8 rounded-[2rem] shadow-sm border border-white">

          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center mb-4">
              <img
                src="/CDI-LOGO.jpg"
                alt="Logo CDI Connect"
                className="w-40 h-auto object-contain mix-blend-multiply"
              />
            </div>
            <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">
              Crea tu Cuenta
            </h2>
            <p className="text-gray-500 mt-2 text-sm font-medium tracking-wide">
              Únete a la plataforma educativa
            </p>
          </div>

          {error && (
            <div className="animate-fade-in-down flex items-center bg-red-50 border border-red-200 text-red-600 p-3 rounded-xl text-sm shadow-sm">
              <svg className="w-5 h-5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Nombre */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide ml-1">
                Nombre Completo
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <input
                  type="text"
                  name="nombre"
                  placeholder="Juan Pérez"
                  value={form.nombre}
                  onChange={handleChange}
                  required
                  className="w-full pl-11 pr-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 text-sm focus:bg-white focus:border-gray-300 focus:shadow-[inset_0_2px_0_0_#f97316] focus:outline-none transition-all duration-300"
                />
              </div>
            </div>

            {/* Correo */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide ml-1">
                Correo Electrónico
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                  </svg>
                </div>
                <input
                  type="email"
                  name="correo"
                  placeholder="correo@ejemplo.com"
                  value={form.correo}
                  onChange={handleChange}
                  required
                  className="w-full pl-11 pr-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 text-sm focus:bg-white focus:border-gray-300 focus:shadow-[inset_0_2px_0_0_#f97316] focus:outline-none transition-all duration-300"
                />
              </div>
            </div>

            {/* Contraseña */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide ml-1">
                Contraseña
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input
                  type="password"
                  name="password"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={handleChange}
                  required
                  className="w-full pl-11 pr-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 text-sm focus:bg-white focus:border-gray-300 focus:shadow-[inset_0_2px_0_0_#f97316] focus:outline-none transition-all duration-300"
                />
              </div>

              {/* Indicador de Fuerza de Contraseña */}
              {form.password && (
                <div className="mt-3 p-4 bg-gray-50 border border-gray-200/60 rounded-2xl space-y-3.5 animate-fade-in transition-all duration-300">
                  {/* Cabecera y Barra de Progreso */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs font-bold uppercase tracking-wider">
                      <span className="text-gray-500">Fuerza de Contraseña</span>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-widest transition-all duration-300 ${
                        completedChecksCount <= 2 ? 'bg-red-100 text-red-700' :
                        completedChecksCount <= 4 ? 'bg-amber-100 text-amber-700' :
                        'bg-emerald-100 text-emerald-700'
                      }`}>
                        {completedChecksCount <= 2 ? 'Débil ⚠️' :
                         completedChecksCount <= 4 ? 'Media ⚡' :
                         'Segura 🚀'}
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-500 ease-out ${
                          completedChecksCount <= 2 ? 'bg-red-500' :
                          completedChecksCount <= 4 ? 'bg-amber-500' :
                          'bg-emerald-500'
                        }`}
                        style={{ width: `${(completedChecksCount / 5) * 100}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Checklist de Requisitos */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-gray-200/50">
                    <RequirementCheck label="Mínimo 8 caracteres" checked={checks.length} />
                    <RequirementCheck label="Una Mayúscula (A-Z)" checked={checks.hasUpper} />
                    <RequirementCheck label="Una Minúscula (a-z)" checked={checks.hasLower} />
                    <RequirementCheck label="Un Número (0-9)" checked={checks.hasNumber} />
                    <RequirementCheck label="Carácter especial (ej: !@#$)" checked={checks.hasSpecial} className="sm:col-span-2" />
                  </div>
                </div>
              )}
            </div>

            {/* Botón */}
            <button
              type="submit"
              disabled={loading || (form.password.length > 0 && !isPasswordSecure)}
              className="w-full flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-xl transition-all duration-300 shadow-md hover:shadow-lg active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed mt-4"
            >
              {loading ? (
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : "Completar Registro"}
            </button>
          </form>

          {/* Ir a login */}
          <p className="text-center text-sm mt-8 text-gray-600">
            ¿Ya tienes cuenta?{" "}
            <span
              onClick={() => navigate("/")}
              className="text-indigo-600 font-bold cursor-pointer hover:text-indigo-800 hover:underline transition-colors decoration-indigo-400 decoration-2 underline-offset-4 ml-1"
            >
              Inicia sesión aquí
            </span>
          </p>

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-xs text-gray-400 tracking-wider">
              © {new Date().getFullYear()} Centro de Desarrollo Infantil.
            </p>
          </div>

        </div>
      </div>

      {/* Lado Derecho (Imagen) - Oculto en móviles */}
      <div className="hidden md:block md:w-1/2 relative">
        {/* Degradado en la línea divisoria para que no se vea cuadrada y se mezcle con el fondo blanco */}
        <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none"></div>
        <img
          src="/Fondo-register.png"
          alt="Centro Educativo CDI Registro"
          className="absolute inset-0 w-full h-full object-cover"
        />
        {/* Overlay opcional para la imagen */}
        <div className="absolute inset-0 bg-gradient-to-t from-indigo-900/30 to-transparent"></div>
      </div>

    </div>
  );
}