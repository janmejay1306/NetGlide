import { motion, AnimatePresence } from 'motion/react';
import { History, X, Trash2, ExternalLink, Calendar } from 'lucide-react';
import { Button } from './ui/button';

interface HistoryItem {
  id: string;
  url: string;
  title: string;
  visitedAt: number;
}

interface HistoryPanelProps {
  isOpen: boolean;
  onClose: () => void;
  history: HistoryItem[];
  onNavigate: (url: string) => void;
  onClearHistory: () => void;
}

export function HistoryPanel({ isOpen, onClose, history, onNavigate, onClearHistory }: HistoryPanelProps) {
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return `Today, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else if (date.toDateString() === yesterday.toDateString()) {
      return `Yesterday, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          />
          <motion.div
            initial={{ opacity: 0, x: -300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -300 }}
            className="fixed left-0 top-0 bottom-0 w-full max-w-md bg-gradient-to-br from-gray-900/98 to-gray-800/98 border-r border-purple-500/30 backdrop-blur-xl shadow-2xl z-50 overflow-y-auto"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <History className="w-6 h-6 text-purple-400" />
                  <h2 className="text-2xl">Browsing History</h2>
                </div>
                <Button onClick={onClose} variant="ghost" size="icon" className="hover:bg-white/10">
                  <X className="w-5 h-5" />
                </Button>
              </div>

              {history.length > 0 && (
                <Button
                  onClick={() => {
                    if (confirm('Clear all browsing history?')) {
                      onClearHistory();
                    }
                  }}
                  variant="destructive"
                  size="sm"
                  className="mb-4 w-full"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Clear All History
                </Button>
              )}

              <div className="space-y-2">
                {history.length === 0 ? (
                  <div className="text-center py-12 text-gray-400">
                    <History className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No browsing history yet</p>
                  </div>
                ) : (
                  history
                    .slice()
                    .reverse()
                    .map((item) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all group"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-gray-200 mb-1 truncate">{item.title}</h3>
                            <p className="text-sm text-gray-400 truncate mb-2">{item.url}</p>
                            <p className="text-xs text-gray-500 flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {formatDate(item.visitedAt)}
                            </p>
                          </div>
                          <Button
                            onClick={() => {
                              onNavigate(item.url);
                              onClose();
                            }}
                            size="sm"
                            variant="ghost"
                            className="opacity-0 group-hover:opacity-100 hover:bg-white/20"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                        </div>
                      </motion.div>
                    ))
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
