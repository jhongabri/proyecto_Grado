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
    <div
      className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 relative overflow-hidden bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: "url('/fondo-login.png')" }}
    >
      {/* Overlay oscuro y difuminado apenas perceptible para que la foto se vea bien */}
      <div className="absolute inset-0 bg-slate-900/30 backdrop-blur-[2px] z-0"></div>

      {/* Main Glassmorphism Card */}
      <div className="relative w-full max-w-md bg-white/10 backdrop-blur-3xl border border-white/20 p-8 rounded-3xl shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] z-10 transition-all duration-500 hover:shadow-[0_8px_40px_0_rgba(0,0,0,0.6)]">

        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center mb-2">
            <img src="/logo-escuela.jpg" alt="Logo Kinder Garden" className="w-16 h-16 object-cover rounded-full drop-shadow-md" />
          </div>
          <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-200 to-indigo-200 tracking-tight">
            CDI Connect
          </h1>
          <p className="text-indigo-200 mt-1 text-xs font-medium tracking-wide opacity-80">
            Sistema Académico Integral
          </p>
        </div>

        {error && (
          <div className="animate-fade-in-down flex items-center bg-red-500/10 border border-red-500/50 text-red-200 p-2 rounded-xl mb-4 text-sm text-center shadow-inner">
            <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {error}
          </div>
        )}

        {/* LOGIN NORMAL */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1 group">
            <label className="block text-[10px] font-semibold text-indigo-200 uppercase tracking-wider ml-1 mb-1 group-focus-within:text-white transition-colors">
              Correo Electrónico
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-4 w-4 text-indigo-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                </svg>
              </div>
              <input
                type="email"
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white placeholder-indigo-300/50 text-sm focus:bg-white/10 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/50 focus:outline-none transition-all duration-300 backdrop-blur-sm"
                placeholder="tu@correo.com"
              />
            </div>
          </div>

          <div className="space-y-1 group">
            <label className="block text-[10px] font-semibold text-indigo-200 uppercase tracking-wider ml-1 mb-1 group-focus-within:text-white transition-colors">
              Contraseña
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-4 w-4 text-indigo-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white placeholder-indigo-300/50 text-sm focus:bg-white/10 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/50 focus:outline-none transition-all duration-300 backdrop-blur-sm"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full relative group overflow-hidden bg-gradient-to-r from-indigo-500 to-blue-500 hover:from-indigo-400 hover:to-blue-400 text-white font-bold py-2.5 px-4 rounded-xl transition-all duration-300 shadow-[0_0_20px_rgba(79,70,229,0.3)] hover:shadow-[0_0_25px_rgba(79,70,229,0.5)] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed mt-2"
          >
            <span className="relative z-10 flex items-center justify-center">
              {loading ? (
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : "Ingresar"}
            </span>
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center my-6">
          <div className="flex-1 border-t border-white/10"></div>
          <span className="px-3 text-[10px] tracking-wider text-indigo-300/70 uppercase">O continuar con</span>
          <div className="flex-1 border-t border-white/10"></div>
        </div>

        {/* GOOGLE LOGIN */}
        <div className="flex justify-center transform transition-transform hover:scale-105 duration-300">
          <div className="shadow-lg rounded-full overflow-hidden border border-white/10">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => setError("No se pudo conectar con Google. Intenta nuevamente.")}
              shape="pill"
              size="medium"
              theme="filled_black"
              text="continue_with"
            />
          </div>
        </div>

        {/* REGISTRO */}
        <p className="text-center text-xs mt-6 text-indigo-200/80">
          ¿Nuevo en la plataforma?{" "}
          <span
            onClick={() => navigate("/register")}
            className="text-white font-semibold cursor-pointer hover:text-indigo-300 hover:underline transition-colors decoration-indigo-400 decoration-2 underline-offset-4"
          >
            Crea una cuenta aquí
          </span>
        </p>

      </div>

      {/* Footer */}
      <div className="absolute bottom-4 w-full text-center z-10">
        <p className="text-[10px] text-indigo-200/50 tracking-wider">
          © {new Date().getFullYear()} Centro de Desarrollo Infantil.
        </p>
      </div>

    </div>
  );
}