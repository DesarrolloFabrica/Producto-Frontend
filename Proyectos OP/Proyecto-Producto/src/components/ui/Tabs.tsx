import { motion } from 'motion/react';
import { cn } from './tokens';

export interface TabItem {
  id: string;
  label: string;
}

export function Tabs({ tabs, activeTab, onChange }: { tabs: TabItem[]; activeTab: string; onChange: (tab: string) => void }) {
  return (
    <div className="rounded-[12px] bg-[#F1F5F9] p-1">
      <div className="flex flex-wrap">
        {tabs.map((tab) => (
          <motion.button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.98 }}
            className={cn(
              'rounded-[8px] px-3.5 py-2 text-xs font-medium transition-all duration-200',
              activeTab === tab.id
                ? 'bg-white text-[#FF6B00] font-semibold shadow-[0_6px_18px_rgba(249,115,22,0.10)]'
                : 'text-[#64748B] hover:text-[#1E293B]',
            )}
          >
            {tab.label}
          </motion.button>
        ))}
      </div>
    </div>
  );
}
