import { motion, AnimatePresence } from 'motion/react';
import { Layers, X, Plus, Trash2, Check } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { useState } from 'react';

interface Workspace {
  id: string;
  name: string;
  tabs: any[];
}

interface WorkspacePanelProps {
  isOpen: boolean;
  onClose: () => void;
  workspaces: Workspace[];
  currentWorkspaceId: string;
  onCreateWorkspace: (name: string) => void;
  onSwitchWorkspace: (id: string) => void;
  onDeleteWorkspace: (id: string) => void;
}

export function WorkspacePanel({
  isOpen,
  onClose,
  workspaces,
  currentWorkspaceId,
  onCreateWorkspace,
  onSwitchWorkspace,
  onDeleteWorkspace,
}: WorkspacePanelProps) {
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');

  const handleCreate = () => {
    if (newName.trim()) {
      onCreateWorkspace(newName.trim());
      setNewName('');
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
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl bg-gradient-to-br from-gray-900/98 to-gray-800/98 border border-purple-500/30 rounded-3xl backdrop-blur-xl shadow-2xl z-50 overflow-hidden"
          >
            <div className="p-6 max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <Layers className="w-6 h-6 text-purple-400" />
                  <h2 className="text-2xl">Workspaces</h2>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => setShowAdd(!showAdd)}
                    size="sm"
                    className="bg-gradient-to-r from-purple-500 to-blue-500"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    New
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
                  <Input
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                    placeholder="Workspace name..."
                    className="bg-white/5 border-white/10 text-white"
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <Button onClick={handleCreate} className="bg-gradient-to-r from-purple-500 to-blue-500">
                      Create Workspace
                    </Button>
                    <Button onClick={() => setShowAdd(false)} variant="outline" className="border-white/20">
                      Cancel
                    </Button>
                  </div>
                </motion.div>
              )}

              <div className="space-y-3">
                {workspaces.map((workspace) => (
                  <motion.div
                    key={workspace.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer group ${
                      workspace.id === currentWorkspaceId
                        ? 'bg-gradient-to-r from-purple-500/20 to-blue-500/20 border-purple-400/50'
                        : 'bg-white/5 border-white/10 hover:bg-white/10'
                    }`}
                    onClick={() => {
                      onSwitchWorkspace(workspace.id);
                      onClose();
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {workspace.id === currentWorkspaceId && (
                          <Check className="w-5 h-5 text-purple-400" />
                        )}
                        <div>
                          <h3 className="font-medium text-gray-200">{workspace.name}</h3>
                          <p className="text-sm text-gray-400">{workspace.tabs.length} tabs</p>
                        </div>
                      </div>
                      {workspaces.length > 1 && (
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteWorkspace(workspace.id);
                          }}
                          size="sm"
                          variant="ghost"
                          className="opacity-0 group-hover:opacity-100 hover:bg-red-500/20 text-red-400"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
