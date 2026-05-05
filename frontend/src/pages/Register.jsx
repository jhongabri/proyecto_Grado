import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axios";

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
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
            </div>

            {/* Botón */}
            <button
              type="submit"
              disabled={loading}
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