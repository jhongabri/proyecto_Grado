import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import API from "../api/axios";

export default function Login() {
  const [correo, setCorreo] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const redirectByRole = (user) => {
    if (user.id_rol === 1) {
      navigate("/admin");
    } else if (user.id_rol === 2) {
      navigate("/docente");
    } else {
      navigate("/acudiente");
    }
  };

  // LOGIN NORMAL
  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await API.post("/auth/login", {
        correo,
        password,
      });

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("usuario", JSON.stringify(res.data.user));

      redirectByRole(res.data.user);
    } catch (error) {
      setError("Credenciales incorrectas. Verifica tu correo y contraseña.");
    } finally {
      setLoading(false);
    }
  };

  // LOGIN GOOGLE
  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const res = await API.post("/auth/google", {
        credential: credentialResponse.credential,
      });

      // Usuario nuevo → completar registro
      if (res.data.nuevo) {
        navigate("/completar-registro", {
          state: {
            correo: res.data.correo,
            nombre: res.data.nombre,
          },
        });
        return;
      }

      // Usuario existente
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("usuario", JSON.stringify(res.data.user));

      redirectByRole(res.data.user);
    } catch (error) {
      setError("Error con autenticación Google.");
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-white">

      {/* Ticker Banner */}
      <div 
        onClick={() => navigate('/register')}
        className="w-full bg-indigo-600 text-white h-10 flex items-center overflow-hidden shrink-0 cursor-pointer hover:bg-indigo-700 transition-colors"
      >
        <div className="animate-ticker cursor-pointer">
          <span className="mx-8 font-bold text-sm tracking-wide">MATRÍCULAS ABIERTAS    INSCRÍBETE YA ✨</span>
          <span className="mx-8 font-bold text-sm tracking-wide">MATRÍCULAS ABIERTAS    INSCRÍBETE YA ✨</span>
          <span className="mx-8 font-bold text-sm tracking-wide">MATRÍCULAS ABIERTAS    INSCRÍBETE YA ✨</span>
          <span className="mx-8 font-bold text-sm tracking-wide">MATRÍCULAS ABIERTAS    INSCRÍBETE YA ✨</span>
          <span className="mx-8 font-bold text-sm tracking-wide">MATRÍCULAS ABIERTAS    INSCRÍBETE YA ✨</span>
          <span className="mx-8 font-bold text-sm tracking-wide">MATRÍCULAS ABIERTAS    INSCRÍBETE YA ✨</span>
          <span className="mx-8 font-bold text-sm tracking-wide">MATRÍCULAS ABIERTAS    INSCRÍBETE YA ✨</span>
          <span className="mx-8 font-bold text-sm tracking-wide">MATRÍCULAS ABIERTAS    INSCRÍBETE YA ✨</span>
        </div>
      </div>

      <div className="flex flex-1 relative">

        {/* Lado Izquierdo (Formulario) */}
        <div className="w-full md:w-1/2 flex items-center justify-center px-6 py-12 relative z-10">
          <div className="w-full max-w-md space-y-6">

            {/* Header */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center mb-4">
                <img
                  src="/CDI-LOGO.jpg"
                  alt="Logo CDI Connect"
                  className="w-40 h-auto object-contain mix-blend-multiply"
                />
              </div>
              <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
                SIGEPRO
              </h1>
              <p className="text-gray-500 mt-2 text-sm font-medium tracking-wide">
                Sistema Académico Integral
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

            {/* LOGIN NORMAL */}
            <form onSubmit={handleLogin} className="space-y-5">
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
                    value={correo}
                    onChange={(e) => setCorreo(e.target.value)}
                    required
                    className="w-full pl-11 pr-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 text-sm focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none transition-all duration-300"
                    placeholder="tu@correo.com"
                  />
                </div>
              </div>

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
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full pl-11 pr-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 text-sm focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none transition-all duration-300"
                    placeholder="••••••••"
                  />
                </div>
              </div>

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
                ) : "Ingresar a SIGEPRO"}
              </button>
            </form>

            {/* Divider */}
            <div className="flex items-center my-6">
              <div className="flex-1 border-t border-gray-200"></div>
              <span className="px-3 text-xs tracking-wider text-gray-500 uppercase font-medium">O continuar con</span>
              <div className="flex-1 border-t border-gray-200"></div>
            </div>

            {/* GOOGLE LOGIN */}
            <div className="flex justify-center">
              <div className="transform transition-transform hover:scale-105 duration-300">
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={() => setError("No se pudo conectar con Google. Intenta nuevamente.")}
                  shape="pill"
                  size="large"
                  theme="outline"
                  text="continue_with"
                />
              </div>
            </div>

            {/* REGISTRO */}
            <p className="text-center text-sm mt-8 text-gray-600">
              ¿Nuevo en la plataforma?{" "}
              <span
                onClick={() => navigate("/register")}
                className="text-indigo-600 font-bold cursor-pointer hover:text-indigo-800 hover:underline transition-colors decoration-indigo-400 decoration-2 underline-offset-4 ml-1"
              >
                Crea una cuenta aquí
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
            src="/Fondo.png"
            alt="Centro Educativo CDI"
            className="absolute inset-0 w-full h-full object-cover"
          />
          {/* Overlay opcional para la imagen */}
          <div className="absolute inset-0 bg-gradient-to-t from-indigo-900/30 to-transparent"></div>
        </div>

      </div>

    </div>
  );
}