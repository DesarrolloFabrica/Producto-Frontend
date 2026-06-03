import { DashboardKpiGrid } from '../../../components/layout/DashboardShell';
import { MetricCard } from '../../../components/cards/MetricCard';
import type { ReportPreviewResponse } from '../../../services/types/reportingApi.types';
import { buildReportKpis } from '../reportKpiUtils';

type Props = {
  reportId: string;
  preview: ReportPreviewResponse;
};

export function ReportKpiHeader({ reportId, preview }: Props) {
  const kpis = buildReportKpis(reportId, preview);

  return (
    <DashboardKpiGrid columns={4}>
      {kpis.map((kpi) => (
        <MetricCard
          key={kpi.label}
          compact
          label={kpi.label}
          value={kpi.value}
          icon={kpi.icon}
          tone={kpi.tone}
        />
      ))}
    </DashboardKpiGrid>
  );
}
