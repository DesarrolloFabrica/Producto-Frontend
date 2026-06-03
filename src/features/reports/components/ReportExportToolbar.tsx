import { FileSpreadsheet } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import type { ReportCatalogItem } from '../../../services/types/reportingApi.types';

type Props = {
  report: ReportCatalogItem;
  exporting: boolean;
  onExportExcel: () => void;
};

export function ReportExportToolbar({ report, exporting, onExportExcel }: Props) {
  if (!report.supportsExcel) return null;

  return (
    <Button
      type="button"
      size="sm"
      onClick={onExportExcel}
      disabled={exporting}
      className="gap-1.5"
    >
      <FileSpreadsheet className="h-3.5 w-3.5" />
      {exporting ? 'Exportando…' : 'Exportar Excel'}
    </Button>
  );
}
