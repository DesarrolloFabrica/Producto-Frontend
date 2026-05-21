import { motion } from 'motion/react';
import { ChevronRight } from 'lucide-react';
import { cn } from './tokens';

export interface TabItem {
  id: string;
  label: string;
  flow?: boolean;
}

export function Tabs({ tabs, activeTab, onChange }: { tabs: TabItem[]; activeTab: string; onChange: (tab: string) => void }) {
  return (
    <div className="inline-flex items-center gap-1 rounded-[16px] bg-slate-100 p-1.5">
      {tabs.map((tab, index) => (
        <div key={tab.id} className="flex items-center">
          <motion.button
            type="button"
            onClick={() => onChange(tab.id)}
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.98 }}
            className={cn(
              'relative flex items-center gap-1.5 rounded-[12px] px-4 py-2.5 text-sm font-medium transition-all duration-200',
              activeTab === tab.id
                ? 'bg-white text-orange-600 font-bold shadow-[0_4px_12px_rgba(0,0,0,0.08)]'
                : 'text-slate-500 hover:text-slate-700 hover:bg-white/50',
            )}
          >
            {tab.label}
            {tab.flow && activeTab !== tab.id && (
              <span className="flex items-center justify-center">
                <ChevronRight className="h-3 w-3" />
              </span>
            )}
            {tab.flow && activeTab === tab.id && (
              <span className="h-1.5 w-1.5 rounded-full bg-orange-500 shadow-[0_0_0_3px_rgba(255,107,0,0.2)]" />
            )}
          </motion.button>
          {index < tabs.length - 1 && (
            <div className="mx-1 h-4 w-px bg-slate-300" />
          )}
        </div>
      ))}
    </div>
  );
}
