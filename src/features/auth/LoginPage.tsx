import { useState, useEffect, useMemo } from "react";
import {
  ArrowRight,
  BookOpenCheck,
  Building2,
  Factory,
  Lock,
  Shield,
  AlertTriangle,
  ClipboardCheck,
  CloudUpload,
} from "lucide-react";
import { motion } from "motion/react";
import { useNavigate } from "react-router-dom";
import { AppLogo } from "../../components/branding/AppLogo";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { useAuth } from "./AuthContext";

const ORANGE_WAVE_PATH =
  "M 0 122 C 10 112, 16 108, 24 98 C 32 86, 38 92, 46 80 C 54 68, 60 72, 68 58 C 76 44, 82 50, 88 36 C 94 22, 96 18, 100 14 L 100 100 L 0 100 Z";

export function LoginPage() {
  const { login, isLoading, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate("/", { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const devAccounts = useMemo(
    () => [
      {
        label: "Product",
        email: "product@local",
        password: "Product123!",
        icon: BookOpenCheck,
      },
      {
        label: "Fábrica",
        email: "fabrica@local",
        password: "Fabrica123!",
        icon: Factory,
      },
      {
        label: "Planeación",
        email: "planeacion@local",
        password: "Planeacion123!",
        icon: ClipboardCheck,
      },
      {
        label: "LMS",
        email: "lms@local",
        password: "Lms123!",
        icon: CloudUpload,
      },
      {
        label: "Admin",
        email: "admin@local",
        password: "Admin123!",
        icon: Shield,
      },
    ],
    [],
  );

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email, password);
      navigate("/", { replace: true });
    } catch (e: any) {
      setError(e?.message ? String(e.message) : "No se pudo iniciar sesión");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden px-6 py-8">
      <div
        className="pointer-events-none absolute inset-0 z-0 overflow-hidden bg-white"
        aria-hidden="true"
      >
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_top_left,#ff6b00_0,transparent_28%)] opacity-[0.035]" />
        <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(15,23,42,.04)_1px,transparent_1px)] bg-size-[72px_72px] opacity-[0.025]" />
        <svg
          className="absolute inset-0 h-full w-full"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient
              id="orangeWaveGradient"
              x1="0%"
              y1="100%"
              x2="100%"
              y2="0%"
            >
              <stop offset="0%" stopColor="#FF4D00" />
              <stop offset="40%" stopColor="#FF7A00" />
              <stop offset="100%" stopColor="#FFB066" />
            </linearGradient>
          </defs>

          <path d={ORANGE_WAVE_PATH} fill="url(#orangeWaveGradient)" />
          <path
            d={ORANGE_WAVE_PATH}
            fill="none"
            stroke="rgba(255,255,255,0.22)"
            strokeWidth="0.6"
          />
        </svg>
      </div>
      <div className="relative z-10 mx-auto grid min-h-[calc(100vh-4rem)] w-full max-w-6xl grid-cols-1 items-center gap-10 py-4 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,26rem)] lg:gap-14 lg:py-8">
        <motion.section
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex w-full justify-center lg:justify-start"
        >
          <div className="flex w-full max-w-[30rem] flex-col text-center lg:text-left">
            <header className="mb-6 flex flex-col items-center gap-4 border-b border-slate-200/70 pb-6 lg:items-start">
              <div className="login-brand-glass relative inline-flex w-fit items-center justify-center rounded-2xl px-3.5 py-2 sm:px-4 sm:py-2.5">
                <AppLogo variant="primary" size="login" className="relative z-[1]" />
              </div>
              <div className="inline-flex items-center gap-2.5 rounded-full border border-orange-100/90 bg-white/90 px-3.5 py-2 text-[11px] font-semibold tracking-tight text-orange-700 shadow-sm backdrop-blur-sm">
                <Building2 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                Equipo desarrollo de operaciones
              </div>
            </header>

            <div className="space-y-4">
              <h1 className="text-[2.1rem] font-black tracking-[-0.04em] leading-[0.93] text-slate-950 sm:text-[2.65rem] lg:text-[2.85rem] lg:leading-[0.9]">
                <span className="block">Operación</span>
                <span className="block text-slate-800">Académica CUN</span>
              </h1>
              <p className="mx-auto max-w-[28rem] text-[0.98rem] font-medium leading-7 text-slate-600 lg:mx-0">
                Gestión integral de solicitudes académicas, producción de
                contenidos, revisión institucional, trazabilidad y entrega LMS.
              </p>
            </div>
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mx-auto w-full max-w-md lg:mx-0"
        >

          <div className="relative">
            <div
              className="absolute -inset-6 rounded-[36px] bg-orange-300/8 blur-2xl"
              aria-hidden="true"
            />
            <Card className="login-glass-surface rounded-[28px] p-8 lg:p-10">
              <div className="relative z-[1] mb-8">
                <div className="mb-3 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-orange-600">
                  <Lock className="h-4 w-4" aria-hidden="true" /> Acceso
                  institucional
                </div>
                <h2 className="text-3xl font-black tracking-tight text-slate-950">
                  Inicia sesión
                </h2>
                <p className="mt-2 text-xs font-bold uppercase tracking-widest text-slate-500">
                  Entorno local de validación
                </p>
              </div>
              <form onSubmit={handleSubmit} className="relative z-[1] space-y-5">
              {error && (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4">
                  <div className="flex items-start gap-2 text-rose-700">
                    <AlertTriangle className="mt-0.5 h-4 w-4" />
                    <div>
                      <p className="text-xs font-bold">
                        Error de autenticación
                      </p>
                      <p className="mt-1 text-[11px] font-medium text-rose-600">
                        {error}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-slate-500">
                  Correo institucional
                </label>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="product@local"
                  className="w-full rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-900 focus:border-orange-300 focus:ring-2 focus:ring-orange-100 focus:outline-none transition-all"
                  autoComplete="username"
                />
              </div>
              <div>
                <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-slate-500">
                  Contraseña
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-900 focus:border-orange-300 focus:ring-2 focus:ring-orange-100 focus:outline-none transition-all"
                  autoComplete="current-password"
                />
              </div>

              <Button
                type="submit"
                disabled={submitting || isLoading}
                className="mt-2 flex w-full items-center justify-center gap-3 py-5 transition-all duration-300 hover:scale-[1.015] hover:shadow-[0_16px_40px_rgba(255,107,0,0.34)]"
              >
                Iniciar sesión <ArrowRight className="h-5 w-5" />
              </Button>

              <div className="mt-1 rounded-2xl border border-dashed border-slate-200/90 bg-slate-50/60 p-3">
                <p className="mb-2.5 text-[10px] font-black uppercase tracking-widest text-slate-500">
                  Accesos rápidos de prueba
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {devAccounts.map((acc) => (
                    <button
                      key={acc.label}
                      type="button"
                      onClick={() => {
                        setEmail(acc.email);
                        setPassword(acc.password);
                      }}
                      className="flex items-center justify-center gap-1.5 rounded-xl border border-dashed border-slate-200 bg-white/70 px-2 py-2 text-[10px] font-semibold text-slate-500 transition-colors hover:border-slate-300 hover:bg-slate-100/90 hover:text-slate-600"
                    >
                      <acc.icon className="h-3.5 w-3.5 opacity-70" aria-hidden="true" />{" "}
                      {acc.label}
                    </button>
                  ))}
                </div>
              </div>
              </form>
            </Card>
          </div>
        </motion.section>
      </div>
    </main>
  );
}
