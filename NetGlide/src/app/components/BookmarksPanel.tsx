import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bookmark, X, Plus, Trash2, ExternalLink } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';

interface Bookmark {
  id: string;
  title: string;
  url: string;
  createdAt: number;
}

interface BookmarksPanelProps {
  isOpen: boolean;
  onClose: () => void;
  bookmarks: Bookmark[];
  onAddBookmark: (title: string, url: string) => void;
  onDeleteBookmark: (id: string) => void;
  onNavigate: (url: string) => void;
}

export function BookmarksPanel({
  isOpen,
  onClose,
  bookmarks,
  onAddBookmark,
  onDeleteBookmark,
  onNavigate,
}: BookmarksPanelProps) {
  const [showAdd, setShowAdd] = useState(false);
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');

  const handleAdd = () => {
    if (title.trim() && url.trim()) {
      onAddBookmark(title.trim(), url.trim());
      setTitle('');
      setUrl('');
      setShowAdd(false);
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
            initial={{ opacity: 0, y: -300 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -300 }}
            className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-2xl mt-4 bg-gradient-to-br from-gray-900/98 to-gray-800/98 border border-purple-500/30 rounded-3xl backdrop-blur-xl shadow-2xl z-50 overflow-hidden"
          >
            <div className="p-6 max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <Bookmark className="w-6 h-6 text-purple-400" />
                  <h2 className="text-2xl">Bookmarks</h2>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => setShowAdd(!showAdd)}
                    size="sm"
                    className="bg-gradient-to-r from-purple-500 to-blue-500"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add
                  </Button>
                  <Button onClick={onClose} variant="ghost" size="icon" className="hover:bg-white/10">
                    <X className="w-5 h-5" />
                  </Button>
                </div>
              </div>

              {showAdd && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-6 p-4 rounded-2xl bg-white/5 border border-white/10 space-y-4"
                >
                  <div>
                    <Label className="text-gray-200 mb-2">Title</Label>
                    <Input
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Bookmark title..."
                      className="bg-white/5 border-white/10 text-white"
                    />
                  </div>
                  <div>
                    <Label className="text-gray-200 mb-2">URL</Label>
                    <Input
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      placeholder="https://..."
                      className="bg-white/5 border-white/10 text-white"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleAdd} className="bg-gradient-to-r from-purple-500 to-blue-500">
                      Save Bookmark
                    </Button>
                    <Button onClick={() => setShowAdd(false)} variant="outline" className="border-white/20">
                      Cancel
                    </Button>
                  </div>
                </motion.div>
              )}

              <div className="space-y-3">
                {bookmarks.length === 0 ? (
                  <div className="text-center py-12 text-gray-400">
                    <Bookmark className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No bookmarks yet. Click "Add" to create one.</p>
                  </div>
                ) : (
                  bookmarks.map((bookmark) => (
                    <motion.div
                      key={bookmark.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all group"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-gray-200 mb-1">{bookmark.title}</h3>
                          <p className="text-sm text-gray-400 truncate">{bookmark.url}</p>
                        </div>
                        <div className="flex gap-2 ml-4">
                          <Button
                            onClick={() => {
                              onNavigate(bookmark.url);
                              onClose();
                            }}
                            size="sm"
                            variant="ghost"
                            className="hover:bg-white/20"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                          <Button
                            onClick={() => onDeleteBookmark(bookmark.id)}
                            size="sm"
                            variant="ghost"
                            className="hover:bg-red-500/20 text-red-400"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
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
