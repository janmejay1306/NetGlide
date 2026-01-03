import { X } from 'lucide-react';
import { motion } from 'motion/react';

interface BrowserTabProps {
  tab: {
    id: string;
    url: string;
    title: string;
    isActive: boolean;
  };
  onClose: (id: string) => void;
  onClick: (id: string) => void;
}

export function BrowserTab({ tab, onClose, onClick }: BrowserTabProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      onClick={() => onClick(tab.id)}
      className={`flex items-center gap-2 px-4 py-2 min-w-[180px] max-w-[220px] rounded-t-lg cursor-pointer group transition-all ${
        tab.isActive
          ? 'bg-gradient-to-b from-purple-900/40 to-purple-800/40 border-t border-x border-purple-500/30'
          : 'bg-white/5 hover:bg-white/10 border-t border-x border-white/10'
      }`}
    >
      <div className="flex-1 truncate text-sm text-gray-200">{tab.title || 'New Tab'}</div>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onClose(tab.id);
        }}
        className="opacity-0 group-hover:opacity-100 hover:bg-white/20 rounded p-1 transition-all"
      >
        <X className="w-3 h-3" />
      </button>
    </motion.div>
  );
}
