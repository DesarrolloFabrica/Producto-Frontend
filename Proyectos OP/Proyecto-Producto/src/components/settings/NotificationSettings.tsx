import { useState } from 'react';
import { motion } from 'motion/react';
import { Bell, Mail, Clock, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Card } from '../ui/Card';
import { PageHeader } from '../ui/PageHeader';
import { cn } from '../ui/tokens';
import { useToast } from '../ui/ToastProvider';
import { fadeUp } from '../motion/presets';

interface SettingItem {
  id: string;
  title: string;
  description: string;
  enabled: boolean;
  category: 'alerts' | 'email' | 'general';
}

const INITIAL_SETTINGS: SettingItem[] = [
  {
    id: 'deadline_alerts',
    title: 'Alertas de vencimiento',
    description: 'Recibe un aviso cuando falten menos de 72 horas para una entrega',
    enabled: true,
    category: 'alerts',
  },
  {
    id: 'status_changes',
    title: 'Cambios de estado',
    description: 'Notifica cuando un proyecto o tarea cambie de estado operacional',
    enabled: true,
    category: 'alerts',
  },
  {
    id: 'critical_events',
    title: 'Eventos críticos',
    description: 'Alertas inmediatas para bloqueos y riesgos del proyecto',
    enabled: true,
    category: 'alerts',
  },
  {
    id: 'deadline_reminders',
    title: 'Recordatorios de entrega',
    description: 'Notificaciones periódicas antes de fechas límite importantes',
    enabled: false,
    category: 'alerts',
  },
  {
    id: 'email_digest',
    title: 'Resumen diario por correo',
    description: 'Recibe un consolidado de las novedades del día',
    enabled: false,
    category: 'email',
  },
  {
    id: 'email_instant',
    title: 'Notificaciones instantáneas',
    description: 'Envío inmediato de alertas críticas al correo electrónico',
    enabled: true,
    category: 'email',
  },
  {
    id: 'email_mentions',
    title: 'Menciones y comentarios',
    description: 'Notifica cuando alguien te mencione en comentarios',
    enabled: true,
    category: 'email',
  },
  {
    id: 'sound_notifications',
    title: 'Sonido de notificación',
    description: 'Reproducir sonido al recibir nuevas alertas',
    enabled: false,
    category: 'general',
  },
  {
    id: 'desktop_notifications',
    title: 'Notificaciones de escritorio',
    description: 'Mostrar notificaciones nativas del sistema operativo',
    enabled: false,
    category: 'general',
  },
];

const CATEGORY_CONFIG = {
  alerts: {
    title: 'Alertas Operativas',
    icon: Bell,
    description: 'Configura las alertas que verás en la plataforma',
  },
  email: {
    title: 'Preferencias de Correo',
    icon: Mail,
    description: 'Gestiona cómo y cuándo recibes correos electrónicos',
  },
  general: {
    title: 'Configuración General',
    icon: CheckCircle2,
    description: 'Opciones adicionales de notificación',
  },
};

export function NotificationSettings() {
  const [settings, setSettings] = useState<SettingItem[]>(INITIAL_SETTINGS);
  const { showToast } = useToast();

  const toggleSetting = (id: string) => {
    setSettings((prev) =>
      prev.map((setting) =>
        setting.id === id ? { ...setting, enabled: !setting.enabled } : setting,
      ),
    );
  };

  const handleSave = () => {
    showToast('Configuración de notificaciones guardada correctamente');
  };

  const handleReset = () => {
    setSettings(INITIAL_SETTINGS);
    showToast('Configuración restablecida a valores predeterminados');
  };

  const groupedSettings = {
    alerts: settings.filter((s) => s.category === 'alerts'),
    email: settings.filter((s) => s.category === 'email'),
    general: settings.filter((s) => s.category === 'general'),
  };

  return (
    <div className="space-y-6">
      <PageHeader
        prominentEyebrow
        eyebrow="Perfil y preferencias"
        title="Configuración de notificaciones"
        description="Personaliza cómo y cuándo recibes notificaciones de la plataforma"
      />

      <motion.div {...fadeUp} className="max-w-3xl">
        {(Object.keys(groupedSettings) as Array<keyof typeof groupedSettings>).map((categoryKey) => (
          <SettingsCard
            key={categoryKey}
            category={categoryKey}
            settings={groupedSettings[categoryKey]}
            onToggle={toggleSetting}
          />
        ))}

        <div className="mt-8 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-2 rounded-[10px] border border-[#E2E8F0] bg-transparent px-6 py-2.5 text-sm font-medium text-[#64748B] transition-all duration-200 hover:bg-[#F1F5F9] hover:text-[#1E293B]"
          >
            Restablecer
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="inline-flex items-center gap-2 rounded-[10px] bg-gradient-to-br from-[#FF6B00] to-[#FF852D] px-6 py-2.5 text-sm font-semibold text-white shadow-[0_4px_12px_rgba(255,107,0,0.2)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_6px_16px_rgba(255,107,0,0.3)]"
          >
            Guardar cambios
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function SettingsCard({
  category,
  settings,
  onToggle,
}: {
  category: keyof typeof CATEGORY_CONFIG;
  settings: SettingItem[];
  onToggle: (id: string) => void;
}) {
  const config = CATEGORY_CONFIG[category];
  const Icon = config.icon;

  return (
    <Card className="mb-6 overflow-hidden bg-white p-0 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.02),0_10px_15px_-3px_rgba(0,0,0,0.03)]">
      <div className="border-b border-[#F1F5F9] bg-gradient-to-r from-[#F8FAFC] to-white px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#FF6B00]/10 text-[#FF6B00]">
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#1E293B]">{config.title}</h3>
            <p className="text-xs font-medium text-[#94A3B8]">{config.description}</p>
          </div>
        </div>
      </div>

      <div className="divide-y divide-[#F1F5F9] px-6 py-2">
        {settings.map((setting) => (
          <SettingRow
            key={setting.id}
            title={setting.title}
            description={setting.description}
            enabled={setting.enabled}
            onToggle={() => onToggle(setting.id)}
          />
        ))}
      </div>
    </Card>
  );
}

function SettingRow({
  title,
  description,
  enabled,
  onToggle,
}: {
  title: string;
  description: string;
  enabled: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-4 transition-colors duration-200 hover:rounded-[8px] hover:bg-[#F8FAFC]">
      <div className="flex-1">
        <p className="text-[0.95rem] font-semibold text-[#1E293B]">{title}</p>
        <p className="mt-0.5 text-[0.85rem] font-normal text-[#64748B]">{description}</p>
      </div>
      <PremiumSwitch enabled={enabled} onToggle={onToggle} />
    </div>
  );
}

function PremiumSwitch({
  enabled,
  onToggle,
}: {
  enabled: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      onClick={onToggle}
      className={cn(
        'relative h-6 w-11 rounded-full transition-colors duration-250 ease-out',
        enabled ? 'bg-[#FF6B00]' : 'bg-[#E2E8F0]',
      )}
    >
      <span
        className={cn(
          'absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow-[0_2px_4px_rgba(0,0,0,0.1)] transition-transform duration-250 ease-out',
          enabled ? 'translate-x-5' : 'translate-x-0',
        )}
        style={{
          transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      />
    </button>
  );
}
