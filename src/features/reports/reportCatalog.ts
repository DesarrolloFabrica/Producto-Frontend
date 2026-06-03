import {
  BarChart3,
  ClipboardList,
  FileSpreadsheet,
  Factory,
  ScrollText,
  ShieldCheck,
  Users,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export const REPORT_ICONS: Record<string, LucideIcon> = {
  'requests-general': ClipboardList,
  'factory-production': Factory,
  'observations-corrections': FileSpreadsheet,
  radications: ShieldCheck,
  'sla-compliance': BarChart3,
  'audit-trail': ScrollText,
  'productivity-by-user': Users,
  'productivity-by-role': Users,
};
