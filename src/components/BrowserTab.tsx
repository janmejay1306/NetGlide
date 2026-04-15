import { X } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState } from 'react';

interface BrowserTabProps {
  tab: {
    id: string;
    url: string;
    title: string;
    isActive: boolean;
  };
  onClose: (id: string) => void;
  onClick: (id: string) => void;
  isCompact?: boolean;
}

export function BrowserTab({ tab, onClose, onClick, isCompact }: BrowserTabProps) {
  const [isHovered, setIsHovered] = useState(false);

  // Extract favicon domain if URL exists
  const getFaviconUrl = (url: string) => {
    try {
      const domain = new URL(url).hostname;
      return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
    } catch {
      return null;
    }
  };

  const favicon = tab.url ? getFaviconUrl(tab.url) : null;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.85, x: -10 }}
      animate={{ opacity: 1, scale: 1, x: 0 }}
      exit={{ opacity: 0, scale: 0.85, x: -10, transition: { duration: 0.15 } }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      onClick={() => onClick(tab.id)}
      className={`relative flex items-center gap-2 pl-3 pr-2 py-1.5 ${isCompact ? 'min-w-[40px] px-1 justify-center' : 'min-w-[140px] max-w-[220px]'} rounded-lg cursor-pointer group transition-all duration-200 shrink-0 border overflow-hidden ${
        tab.isActive
          ? 'bg-white/[0.08] border-white/[0.12] text-white shadow-lg shadow-purple-500/5 backdrop-blur-xl'
          : 'bg-transparent border-transparent text-gray-500 hover:text-gray-200 hover:bg-white/[0.04]'
      }`}
    >
      {/* Active tab top accent line */}
      {tab.isActive && (
        <motion.div
          layoutId="activeTabIndicator"
          className="absolute top-0 left-2 right-2 h-[2px] rounded-full bg-gradient-to-r from-purple-500 via-blue-400 to-purple-500"
          initial={false}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        />
      )}

      {/* Hover glow background */}
      <motion.div
        className="absolute inset-0 pointer-events-none rounded-lg"
        initial={{ opacity: 0 }}
        animate={{
          opacity: isHovered && !tab.isActive ? 0.6 : 0,
          background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.05), rgba(59, 130, 246, 0.05))',
        }}
        transition={{ duration: 0.2 }}
      />

      {/* Favicon or dot indicator */}
      <div className="shrink-0 relative z-10">
        {favicon ? (
          <motion.img
            src={favicon}
            alt=""
            className="w-4 h-4 rounded-sm"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1 }}
          />
        ) : (
          <motion.div
            className={`w-2 h-2 rounded-full ${tab.isActive ? 'bg-purple-400' : 'bg-gray-600'}`}
            animate={tab.isActive ? {
              boxShadow: ['0 0 3px rgba(168,85,247,0.4)', '0 0 8px rgba(168,85,247,0.6)', '0 0 3px rgba(168,85,247,0.4)'],
            } : {}}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          />
        )}
      </div>

      {/* Tab title */}
      {!isCompact && (
        <motion.div
          className="relative z-10 flex-1 truncate text-xs font-medium"
          animate={{
            color: tab.isActive ? '#ffffff' : isHovered ? '#e5e7eb' : '#9ca3af',
          }}
          transition={{ duration: 0.15 }}
        >
          {tab.title || 'New Tab'}
        </motion.div>
      )}

      {/* Close button */}
      <motion.button
        onClick={(e) => {
          e.stopPropagation();
          onClose(tab.id);
        }}
        className={`relative z-10 p-1 rounded-md transition-all duration-150 ${
          tab.isActive
            ? 'text-gray-400 hover:text-white hover:bg-red-500/70'
            : 'opacity-0 group-hover:opacity-100 text-gray-500 hover:text-white hover:bg-white/10'
        }`}
        whileHover={{ scale: 1.15 }}
        whileTap={{ scale: 0.85 }}
        title="Close Tab (Ctrl+W)"
      >
        <X className="w-3 h-3" />
      </motion.button>
    </motion.div>
  );
}
