import { useState, useEffect, useMemo } from "react";
import {
  ArrowRight,
  BookOpenCheck,
  Factory,
  Lock,
  Shield,
  Sparkles,
  AlertTriangle,
  ClipboardCheck,
  CloudUpload,
} from "lucide-react";
import { motion } from "motion/react";
import { useNavigate } from "react-router-dom";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { cn } from "../../components/ui/tokens";
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
      <div className="relative z-10 mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl flex-col items-center justify-center gap-12 lg:flex-row">
        <motion.section
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex-1 space-y-8 lg:-translate-x-3"
        >
          <div className="inline-flex items-center gap-3 rounded-full border border-orange-100 bg-white px-5 py-3 text-[10px] font-black uppercase tracking-widest text-orange-500 shadow-sm">
            <Sparkles className="h-4 w-4" /> MVP Operativo
          </div>
          <div>
            <h1 className="max-w-xl text-5xl font-black tracking-[-0.04em] leading-[0.92] text-slate-950 lg:text-7xl">
              Fabrica Academica CUN
            </h1>
            <p className="mt-6 max-w-[620px] text-sm font-semibold leading-7 text-slate-500">
              Base frontend para gestionar solicitudes de virtualizacion,
              produccion academica, documentos fuente, checklist de materias y
              trazabilidad entre Product y Fabrica.
            </p>
          </div>
          <div className="grid max-w-xl grid-cols-2 gap-4">
            <Card className="h-[96px] border border-white/70 bg-white/92 p-5 shadow-[0_8px_30px_rgba(15,23,42,0.06)] backdrop-blur-xl">
              <p className="text-3xl font-black text-orange-500">02</p>
              <p className="mt-1 text-[10px] font-black uppercase tracking-widest text-slate-400">
                Roles MVP
              </p>
            </Card>
            <Card className="h-[96px] border border-white/70 bg-white/92 p-5 shadow-[0_8px_30px_rgba(15,23,42,0.06)] backdrop-blur-xl">
              <p className="text-3xl font-black text-slate-950">API</p>
              <p className="mt-1 text-[10px] font-black uppercase tracking-widest text-slate-400">
                :3000 + JWT
              </p>
            </Card>
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md"
        >

<div className="relative">
<div className="absolute -inset-6 rounded-[36px] bg-orange-300/10 blur-2xl" />
          <Card className="login-glass-surface p-8 lg:p-10">
            <div className="mb-8">
              <div className="mb-3 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-orange-500">
                <Lock className="h-4 w-4" /> Acceso temporal
              </div>
              <h2 className="text-3xl font-black tracking-tight text-slate-950">
                Inicia sesión
              </h2>
              <p className="mt-2 text-xs font-bold uppercase tracking-widest text-slate-400">
                Sesión JWT local
              </p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-5">
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
                <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Email
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
                <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Password
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

              <div className="pt-2">
                <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Accesos DEV
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
                      className="flex items-center justify-center gap-2 rounded-[16px] border border-slate-100 bg-white px-3 py-2 text-[11px] font-bold text-slate-700 transition-all hover:border-orange-100 hover:bg-orange-50"
                    >
                      <acc.icon className="h-4 w-4" /> {acc.label}
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
