import { useState } from 'react';
import { InstitutionalWorkPage } from '../institutional-workflow/InstitutionalWorkPage';
import { PlanningRadicationPage } from './PlanningRadicationPage';
import { Tabs } from '../../components/ui/Tabs';

const tabs = [
  { id: 'validations', label: 'Validaciones por materia' },
  { id: 'radication', label: 'Radicación por proyecto' },
];

export function PlanningDashboardPage() {
  const [activeTab, setActiveTab] = useState('validations');

  return (
    <div className="space-y-4">
      <div className="mx-auto max-w-7xl px-4 pt-6 lg:px-6">
        <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
      </div>
      {activeTab === 'validations' ? (
        <InstitutionalWorkPage title="Planeación — Validaciones" />
      ) : (
        <PlanningRadicationPage />
      )}
    </div>
  );
}
