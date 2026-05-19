import { useState } from 'react';
import { ArrowRight, BookOpenCheck, Factory, Lock, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { cn } from '../../components/ui/tokens';
import type { Role } from '../../types/domain';
import { useAuth } from './AuthContext';

export function LoginPage() {
  const [selectedRole, setSelectedRole] = useState<Role>('PRODUCT');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    login(selectedRole);
    navigate(selectedRole === 'PRODUCT' ? '/product/dashboard' : '/factory/dashboard', { replace: true });
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
              <p className="text-3xl font-black text-slate-950">Mock</p>
              <p className="mt-1 text-[10px] font-black uppercase tracking-widest text-slate-400">Sin backend</p>
            </Card>
          </div>
        </motion.section>

        <motion.section initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md">
          <Card glass className="p-8 lg:p-10">
            <div className="mb-8">
              <div className="mb-3 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-orange-500">
                <Lock className="h-4 w-4" /> Acceso temporal
              </div>
              <h2 className="text-3xl font-black tracking-tight text-slate-950">Selecciona tu rol</h2>
              <p className="mt-2 text-xs font-bold uppercase tracking-widest text-slate-400">La sesion se guarda en localStorage</p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-5">
              <RoleOption role="PRODUCT" selectedRole={selectedRole} onSelect={setSelectedRole} icon={BookOpenCheck} description="Registra solicitudes, documentos y seguimiento general." />
              <RoleOption role="FABRICA" selectedRole={selectedRole} onSelect={setSelectedRole} icon={Factory} description="Produce contenidos, revisa links y actualiza avances." />
              <Button type="submit" className="mt-4 flex w-full items-center justify-center gap-3 py-5">
                Entrar al dashboard <ArrowRight className="h-5 w-5" />
              </Button>
            </form>
          </Card>
        </motion.section>
      </div>
    </main>
  );
}

function RoleOption({ role, selectedRole, onSelect, icon: Icon, description }: { role: Role; selectedRole: Role; onSelect: (role: Role) => void; icon: typeof BookOpenCheck; description: string }) {
  const active = role === selectedRole;
  return (
    <button
      type="button"
      onClick={() => onSelect(role)}
      className={cn('flex w-full items-center gap-4 rounded-[28px] border p-5 text-left transition-all', active ? 'border-orange-200 bg-orange-50 shadow-sm' : 'border-slate-100 bg-white hover:border-orange-100')}
    >
      <div className={cn('flex h-12 w-12 items-center justify-center rounded-2xl', active ? 'bg-orange-500 text-white' : 'bg-slate-50 text-slate-400')}>
        <Icon className="h-6 w-6" />
      </div>
      <div>
        <p className="text-sm font-black tracking-tight text-slate-950">{role}</p>
        <p className="mt-1 text-xs font-semibold leading-5 text-slate-400">{description}</p>
      </div>
    </button>
  );
}
