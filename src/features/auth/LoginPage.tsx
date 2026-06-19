import { useState, useEffect, useRef, useCallback } from "react";
import {
  ArrowRight,
  Building2,
  Lock,
  AlertTriangle,
  Mail,
  UserCheck,
} from "lucide-react";
import { GoogleLogin, type CredentialResponse } from "@react-oauth/google";
import { motion } from "motion/react";
import { useNavigate } from "react-router-dom";
import { AppLogo } from "../../components/branding/AppLogo";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { env } from "../../config/env";
import { useAuth } from "./AuthContext";

const ORANGE_WAVE_PATH =
  "M 0 122 C 10 112, 16 108, 24 98 C 32 86, 38 92, 46 80 C 54 68, 60 72, 68 58 C 76 44, 82 50, 88 36 C 94 22, 96 18, 100 14 L 100 100 L 0 100 Z";

const UNAUTHORIZED_EMAIL_MESSAGE =
  "Este correo no tiene permisos para acceder a Operación Académica CUN.";

function resolveAuthError(error: unknown): string {
  const apiError = error as { status?: number; message?: string };
  if (apiError?.message) {
    return String(apiError.message);
  }
  if (apiError?.status === 403) {
    return UNAUTHORIZED_EMAIL_MESSAGE;
  }
  return "No se pudo iniciar sesión";
}

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

const SSO_TRUST_POINTS = [
  { icon: Mail, label: "Acceso institucional" },
  { icon: UserCheck, label: "Permisos por rol" },
] as const;

function GoogleAuthButton({
  label,
  disabled,
  onSuccess,
  onError,
  variant = "default",
}: {
  label: string;
  disabled?: boolean;
  onSuccess: (credentialResponse: CredentialResponse) => void;
  onError: () => void;
  variant?: "default" | "institutional";
}) {
  const isInstitutional = variant === "institutional";
  const containerRef = useRef<HTMLDivElement>(null);
  const [buttonWidth, setButtonWidth] = useState<number | null>(null);

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;

    const updateWidth = () => {
      const width = Math.floor(node.getBoundingClientRect().width);
      if (width > 0) {
        setButtonWidth((prev) => (prev === width ? prev : width));
      }
    };

    updateWidth();
    const observer = new ResizeObserver(updateWidth);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const triggerGoogleLogin = useCallback(() => {
    if (disabled) return;
    const googleBtn = containerRef.current?.querySelector(
      'div[role="button"]',
    ) as HTMLElement | null;
    googleBtn?.click();
  }, [disabled]);

  const handleContainerClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (disabled) return;
    const target = event.target as HTMLElement;
    if (target.tagName === "IFRAME" || target.closest('div[role="button"]')) {
      return;
    }
    triggerGoogleLogin();
  };

  return (
    <div
      ref={containerRef}
      className={`group relative w-full cursor-pointer ${disabled ? "pointer-events-none opacity-60" : ""}`}
      onClick={handleContainerClick}
    >
      <div
        className={
          isInstitutional
            ? "login-sso-google-button pointer-events-none flex h-14 w-full items-center justify-center gap-3 rounded-2xl px-5"
            : "pointer-events-none flex h-12 w-full items-center justify-center gap-2.5 rounded-full border border-slate-200 bg-white px-4 shadow-sm"
        }
        aria-hidden="true"
      >
        <GoogleIcon className={isInstitutional ? "h-5 w-5 shrink-0" : "h-4 w-4 shrink-0"} />
        <span
          className={
            isInstitutional
              ? "text-[15px] font-bold tracking-tight text-slate-800"
              : "text-sm font-semibold text-slate-700"
          }
        >
          {label}
        </span>
      </div>
      <div className="google-auth-overlay absolute inset-0 z-[2] opacity-[0.01]">
        {buttonWidth !== null && (
          <GoogleLogin
            onSuccess={onSuccess}
            onError={onError}
            text="continue_with"
            size="large"
            width={String(buttonWidth)}
            theme="outline"
            shape={isInstitutional ? "rectangular" : "pill"}
            containerProps={{
              className: "google-auth-host",
              style: { height: "100%", width: "100%" },
            }}
          />
        )}
      </div>
    </div>
  );
}

function AuthErrorBanner({ error }: { error: string }) {
  return (
    <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4">
      <div className="flex items-start gap-2 text-rose-700">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
        <div>
          <p className="text-xs font-bold">Error de autenticación</p>
          <p className="mt-1 text-[11px] font-medium text-rose-600">{error}</p>
        </div>
      </div>
    </div>
  );
}

export function LoginPage() {
  const { loginWithGoogle, loginWithEmailOnly, isLoading, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const showGoogleAuth = env.googleAuthEnabled && Boolean(env.googleClientId);
  const showDevEmailLogin = env.devEmailLoginEnabled;
  const isSsoOnly = showGoogleAuth && !showDevEmailLogin;
  const isMixedAuth = showGoogleAuth && showDevEmailLogin;

  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const authBusy = submitting || isLoading;

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate("/", { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate]);

  const handleEmailSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await loginWithEmailOnly(email.trim().toLowerCase());
      navigate("/", { replace: true });
    } catch (e: unknown) {
      setError(resolveAuthError(e));
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
    const credential = credentialResponse.credential;
    if (!credential) {
      setError("No se pudo obtener la credencial de Google");
      return;
    }

    setError(null);
    setSubmitting(true);
    try {
      await loginWithGoogle(credential);
      navigate("/", { replace: true });
    } catch (e: unknown) {
      setError(resolveAuthError(e));
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleError = () => {
    setError("No se pudo completar la autenticación con Google");
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
      <div
        className={`relative z-10 mx-auto grid min-h-[calc(100vh-4rem)] w-full max-w-6xl grid-cols-1 items-center gap-10 py-4 lg:gap-14 lg:py-8 ${
          isSsoOnly
            ? "lg:grid-cols-[minmax(0,1fr)_minmax(24rem,35.5rem)]"
            : "lg:grid-cols-[minmax(0,1.05fr)_minmax(0,26rem)]"
        }`}
      >
        <motion.section
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex w-full justify-center lg:justify-start"
        >
          <div className="flex w-full max-w-[30rem] flex-col text-center lg:text-left">
            <header className="mb-6 flex flex-col items-center gap-4 border-b border-slate-200/70 pb-6 lg:items-start">
              <div className="login-brand-glass login-brand-logo-glow relative inline-flex w-fit items-center justify-center rounded-2xl px-4 py-2.5 sm:px-5 sm:py-3">
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
          className={`mx-auto w-full lg:mx-0 ${
            isSsoOnly
              ? "min-w-[22rem] max-w-[35.5rem]"
              : "max-w-md"
          }`}
        >
          <div className="relative">
            <div
              className="absolute -inset-6 rounded-[36px] bg-orange-300/8 blur-2xl"
              aria-hidden="true"
            />
            <Card
              className={`login-glass-surface rounded-[28px] ${
                isSsoOnly ? "px-8 py-10 sm:px-10 sm:py-12 lg:px-11 lg:py-14" : "p-8 lg:p-10"
              }`}
            >
              {isSsoOnly ? (
                <>
                  <div className="relative z-[1] mb-10">
                    <div className="mb-3 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-orange-600">
                      <Lock className="h-4 w-4" aria-hidden="true" /> Acceso
                      institucional
                    </div>
                    <h2 className="text-3xl font-black tracking-tight text-slate-950">
                      Acceso institucional
                    </h2>
                    <p className="mt-2.5 text-sm font-medium leading-6 text-slate-600">
                      Accede a la plataforma con tu cuenta institucional
                      autorizada.
                    </p>
                  </div>

                  <div className="relative z-[1]">
                    {error && (
                      <div className="mb-5">
                        <AuthErrorBanner error={error} />
                      </div>
                    )}

                    <GoogleAuthButton
                      label="Continuar con Google"
                      disabled={authBusy}
                      onSuccess={handleGoogleSuccess}
                      onError={handleGoogleError}
                      variant="institutional"
                    />

                    <p className="mt-6 text-center text-[11px] font-medium leading-5 text-slate-400">
                      Dirección de Operaciones
                    </p>

                    <ul className="mt-5 flex flex-wrap justify-center gap-2 sm:justify-start">
                      {SSO_TRUST_POINTS.map(({ icon: Icon, label }) => (
                        <li
                          key={label}
                          className="inline-flex items-center gap-1.5 rounded-full border border-slate-200/80 bg-white/70 px-3 py-1.5 text-[11px] font-semibold text-slate-600 shadow-sm backdrop-blur-sm"
                        >
                          <Icon
                            className="h-3 w-3 shrink-0 text-orange-500"
                            aria-hidden="true"
                          />
                          {label}
                        </li>
                      ))}
                    </ul>
                  </div>
                </>
              ) : (
                <>
                  <div className="relative z-[1] mb-8">
                    <div className="mb-3 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-orange-600">
                      <Lock className="h-4 w-4" aria-hidden="true" /> Acceso
                      institucional
                    </div>
                    <h2 className="text-3xl font-black tracking-tight text-slate-950">
                      Acceso institucional
                    </h2>
                    <p className="mt-2 text-sm font-medium leading-6 text-slate-600">
                      Ingresa con tu correo autorizado para acceder a la
                      plataforma.
                    </p>
                  </div>

                  <div className="relative z-[1] space-y-5">
                    {error && <AuthErrorBanner error={error} />}

                    {showGoogleAuth && (
                      <GoogleAuthButton
                        label="Continuar con Google"
                        disabled={authBusy}
                        onSuccess={handleGoogleSuccess}
                        onError={handleGoogleError}
                      />
                    )}

                    {isMixedAuth && (
                      <div className="flex items-center gap-3">
                        <div className="h-px flex-1 bg-slate-200" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                          o
                        </span>
                        <div className="h-px flex-1 bg-slate-200" />
                      </div>
                    )}

                    {showDevEmailLogin && (
                      <form onSubmit={handleEmailSubmit} className="space-y-5">
                        <div>
                          <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-slate-500">
                            Correo autorizado
                          </label>
                          <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="nombre.apellido@cun.edu.co"
                            required
                            className="w-full rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-900 focus:border-orange-300 focus:ring-2 focus:ring-orange-100 focus:outline-none transition-all"
                            autoComplete="email"
                          />
                        </div>

                        <Button
                          type="submit"
                          disabled={authBusy || !email.trim()}
                          className="mt-2 flex w-full items-center justify-center gap-3 py-5 transition-all duration-300 hover:scale-[1.015] hover:shadow-[0_16px_40px_rgba(255,107,0,0.34)]"
                        >
                          Ingresar con correo{" "}
                          <ArrowRight className="h-5 w-5" />
                        </Button>
                      </form>
                    )}
                  </div>
                </>
              )}
            </Card>
          </div>
        </motion.section>
      </div>
    </main>
  );
}
