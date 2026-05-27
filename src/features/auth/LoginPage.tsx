import { useMemo, useState, useEffect } from 'react';
import { ArrowRight, BookOpenCheck, Factory, Lock, Shield, Sparkles, AlertTriangle, ClipboardCheck, CloudUpload } from 'lucide-react';
import { motion } from 'motion/react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { cn } from '../../components/ui/tokens';
import { useAuth } from './AuthContext';

export function LoginPage() {
  const { login, isLoading, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const savedPath = useMemo(() => {
    const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname;
    return from && from !== '/login' && from !== '/' ? from : null;
  }, [location.state]);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate(savedPath ?? '/', { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate, savedPath]);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const devAccounts = useMemo(
    () => [
      { label: 'Product', email: 'product@local', password: 'Product123!', icon: BookOpenCheck },
      { label: 'Fábrica', email: 'fabrica@local', password: 'Fabrica123!', icon: Factory },
      { label: 'Planeación', email: 'planeacion@local', password: 'Planeacion123!', icon: ClipboardCheck },
      { label: 'LMS', email: 'lms@local', password: 'Lms123!', icon: CloudUpload },
      { label: 'Admin', email: 'admin@local', password: 'Admin123!', icon: Shield },
    ],
    [],
  );

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email, password);
      navigate(savedPath ?? '/', { replace: true });
    } catch (e: any) {
      setError(e?.message ? String(e.message) : 'No se pudo iniciar sesión');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen overflow-hidden px-6 py-8">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl flex-col items-center justify-center gap-12 lg:flex-row">
        <motion.section initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="flex-1">
          <div className="mb-8 inline-flex items-center gap-3 rounded-full border border-orange-100 bg-white px-5 py-3 text-[10px] font-black uppercase tracking-widest text-orange-500 shadow-sm">
            <Sparkles className="h-4 w-4" /> MVP Operativo
          </div>
          <h1 className="max-w-xl text-5xl font-black tracking-tight text-slate-950 lg:text-7xl">Fabrica Academica CUN</h1>
          <p className="mt-6 max-w-xl text-sm font-semibold leading-7 text-slate-500">
            Base frontend para gestionar solicitudes de virtualizacion, produccion academica, documentos fuente, checklist de materias y trazabilidad entre Product y Fabrica.
          </p>
          <div className="mt-10 grid max-w-xl grid-cols-2 gap-4">
            <Card className="p-5">
              <p className="text-3xl font-black text-orange-500">02</p>
              <p className="mt-1 text-[10px] font-black uppercase tracking-widest text-slate-400">Roles MVP</p>
            </Card>
            <Card className="p-5">
              <p className="text-3xl font-black text-slate-950">API</p>
              <p className="mt-1 text-[10px] font-black uppercase tracking-widest text-slate-400">:3000 + JWT</p>
            </Card>
          </div>
        </motion.section>

        <motion.section initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md">
          <Card glass className="p-8 lg:p-10">
            <div className="mb-8">
              <div className="mb-3 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-orange-500">
                <Lock className="h-4 w-4" /> Acceso temporal
              </div>
              <h2 className="text-3xl font-black tracking-tight text-slate-950">Inicia sesión</h2>
              <p className="mt-2 text-xs font-bold uppercase tracking-widest text-slate-400">Sesión JWT local</p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4">
                  <div className="flex items-start gap-2 text-rose-700">
                    <AlertTriangle className="mt-0.5 h-4 w-4" />
                    <div>
                      <p className="text-xs font-bold">Error de autenticación</p>
                      <p className="mt-1 text-[11px] font-medium text-rose-600">{error}</p>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-slate-400">Email</label>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="product@local"
                  className="w-full rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-900 focus:border-orange-300 focus:ring-2 focus:ring-orange-100 focus:outline-none transition-all"
                  autoComplete="username"
                />
              </div>
              <div>
                <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-slate-400">Password</label>
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
                className="mt-2 flex w-full items-center justify-center gap-3 py-5"
              >
                Iniciar sesión <ArrowRight className="h-5 w-5" />
              </Button>

              <div className="pt-2">
                <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-slate-400">Accesos DEV</p>
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
        </motion.section>
      </div>
    </main>
  );
}
