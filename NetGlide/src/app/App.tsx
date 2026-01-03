import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search,
  Plus,
  Bookmark,
  Settings,
  Layers,
  History,
  Clock,
  ArrowLeft,
  ArrowRight,
  Home as HomeIcon,
} from 'lucide-react';
import { ParticleBackground } from './components/ParticleBackground';
import { ProfessionPrompt } from './components/ProfessionPrompt';
import { AIAssistant } from './components/AIAssistant';
import { BrowserTab } from './components/BrowserTab';
import { DirectNavigationView } from './components/DirectNavigationView';
import { QuickLinks } from './components/QuickLinks';
import { BookmarksPanel } from './components/BookmarksPanel';
import { SettingsPanel } from './components/SettingsPanel';
import { WorkspacePanel } from './components/WorkspacePanel';
import { HistoryPanel } from './components/HistoryPanel';
import { Button } from './components/ui/button';
import { Input } from './components/ui/input';
import { getTheme, applyTheme } from './utils/themes';

interface Tab {
  id: string;
  url: string;
  title: string;
  isActive: boolean;
  history: string[];
  historyIndex: number;
}

interface Workspace {
  id: string;
  name: string;
  tabs: Tab[];
}

interface Bookmark {
  id: string;
  title: string;
  url: string;
  createdAt: number;
}

interface HistoryItem {
  id: string;
  url: string;
  title: string;
  visitedAt: number;
}

interface AppSettings {
  searchEngine: string;
  homepage: string;
  customHomepage: string;
  blockTrackers: boolean;
  clearCacheOnExit: boolean;
  fontSize: string;
  buttonStyle: string;
  notifications: boolean;
  vpnEnabled: boolean;
  theme: string;
}

const DEFAULT_SETTINGS: AppSettings = {
  searchEngine: 'google',
  homepage: 'default',
  customHomepage: '',
  blockTrackers: true,
  clearCacheOnExit: false,
  fontSize: 'medium',
  buttonStyle: 'rounded',
  notifications: true,
  vpnEnabled: false,
  theme: 'gx-neon',
};

function App() {
  const [showProfessionPrompt, setShowProfessionPrompt] = useState(false);
  const [profession, setProfession] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [greeting, setGreeting] = useState('');
  
  const [workspaces, setWorkspaces] = useState<Workspace[]>([
    {
      id: '1',
      name: 'Main Workspace',
      tabs: [{ id: '1', url: '', title: 'New Tab', isActive: true, history: [], historyIndex: -1 }],
    },
  ]);
  const [currentWorkspaceId, setCurrentWorkspaceId] = useState('1');
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);

  const [showBookmarks, setShowBookmarks] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showWorkspaces, setShowWorkspaces] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const currentWorkspace = workspaces.find((w) => w.id === currentWorkspaceId) || workspaces[0];
  const activeTab = currentWorkspace.tabs.find((t) => t.isActive);

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedProfession = localStorage.getItem('cozytab_profession');
    const savedWorkspaces = localStorage.getItem('cozytab_workspaces');
    const savedBookmarks = localStorage.getItem('cozytab_bookmarks');
    const savedHistory = localStorage.getItem('cozytab_history');
    const savedSettings = localStorage.getItem('cozytab_settings');
    const hasSeenPrompt = localStorage.getItem('cozytab_seen_prompt');

    if (savedSettings) {
      const loadedSettings = JSON.parse(savedSettings);
      setSettings(loadedSettings);
      // Apply theme
      const theme = getTheme(loadedSettings.theme || 'gx-neon');
      applyTheme(theme);
    } else {
      // Apply default theme
      const defaultTheme = getTheme('gx-neon');
      applyTheme(defaultTheme);
    }

    if (savedProfession) {
      setProfession(savedProfession);
    }

    if (savedWorkspaces) {
      const loadedWorkspaces = JSON.parse(savedWorkspaces);
      // Ensure all tabs have history and historyIndex properties
      const migratedWorkspaces = loadedWorkspaces.map((workspace: Workspace) => ({
        ...workspace,
        tabs: workspace.tabs.map((tab: Tab) => ({
          ...tab,
          history: tab.history || [],
          historyIndex: tab.historyIndex ?? -1,
        })),
      }));
      setWorkspaces(migratedWorkspaces);
    }

    if (savedBookmarks) {
      setBookmarks(JSON.parse(savedBookmarks));
    }

    if (savedHistory) {
      setHistory(JSON.parse(savedHistory));
    }

    // Show profession prompt only on first launch
    if (!hasSeenPrompt) {
      setShowProfessionPrompt(true);
    }
  }, []);

  // Save to localStorage whenever state changes
  useEffect(() => {
    if (profession) {
      localStorage.setItem('cozytab_profession', profession);
    }
  }, [profession]);

  useEffect(() => {
    localStorage.setItem('cozytab_workspaces', JSON.stringify(workspaces));
  }, [workspaces]);

  useEffect(() => {
    localStorage.setItem('cozytab_bookmarks', JSON.stringify(bookmarks));
  }, [bookmarks]);

  useEffect(() => {
    localStorage.setItem('cozytab_history', JSON.stringify(history));
  }, [history]);

  useEffect(() => {
    localStorage.setItem('cozytab_settings', JSON.stringify(settings));
  }, [settings]);

  // Update time and greeting
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now);
      
      const hour = now.getHours();
      if (hour < 12) setGreeting('Good Morning');
      else if (hour < 18) setGreeting('Good Afternoon');
      else setGreeting('Good Evening');
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 't') {
        e.preventDefault();
        handleNewTab();
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'w') {
        e.preventDefault();
        if (activeTab) handleCloseTab(activeTab.id);
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'l') {
        e.preventDefault();
        document.getElementById('search-bar')?.focus();
      } else if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'N') {
        e.preventDefault();
        setShowWorkspaces(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTab]);

  const handleProfessionSelect = (selectedProfession: string) => {
    setProfession(selectedProfession);
    setShowProfessionPrompt(false);
    localStorage.setItem('cozytab_seen_prompt', 'true');
  };

  const handleSearch = (query: string = searchQuery) => {
    if (!query.trim()) return;

    let url = query;
    
    // Check if it's a URL
    if (!query.includes('.') && !query.startsWith('http')) {
      // It's a search query
      const searchEngines = {
        google: 'https://www.google.com/search?q=',
        duckduckgo: 'https://duckduckgo.com/?q=',
        bing: 'https://www.bing.com/search?q=',
      };
      url = searchEngines[settings.searchEngine as keyof typeof searchEngines] + encodeURIComponent(query);
    } else if (!query.startsWith('http')) {
      url = 'https://' + query;
    }

    handleNavigate(url);
    setSearchQuery('');
  };

  const handleNavigate = (url: string) => {
    const updatedWorkspaces = workspaces.map((workspace) => {
      if (workspace.id === currentWorkspaceId) {
        return {
          ...workspace,
          tabs: workspace.tabs.map((tab) => {
            if (tab.isActive) {
              // Add to tab's navigation history
              const newHistory = tab.history.slice(0, tab.historyIndex + 1);
              newHistory.push(url);
              return { 
                ...tab, 
                url,
                history: newHistory,
                historyIndex: newHistory.length - 1
              };
            }
            return tab;
          }),
        };
      }
      return workspace;
    });

    setWorkspaces(updatedWorkspaces);

    // Add to browsing history
    const historyItem: HistoryItem = {
      id: Date.now().toString(),
      url,
      title: new URL(url).hostname,
      visitedAt: Date.now(),
    };
    setHistory((prev) => [...prev, historyItem]);
  };

  const handleBack = () => {
    if (!activeTab || !activeTab.history || activeTab.historyIndex <= 0) return;

    const updatedWorkspaces = workspaces.map((workspace) => {
      if (workspace.id === currentWorkspaceId) {
        return {
          ...workspace,
          tabs: workspace.tabs.map((tab) => {
            if (tab.isActive && tab.historyIndex > 0) {
              const newIndex = tab.historyIndex - 1;
              return {
                ...tab,
                url: tab.history[newIndex],
                historyIndex: newIndex,
              };
            }
            return tab;
          }),
        };
      }
      return workspace;
    });

    setWorkspaces(updatedWorkspaces);
  };

  const handleForward = () => {
    if (!activeTab || !activeTab.history || activeTab.historyIndex >= activeTab.history.length - 1) return;

    const updatedWorkspaces = workspaces.map((workspace) => {
      if (workspace.id === currentWorkspaceId) {
        return {
          ...workspace,
          tabs: workspace.tabs.map((tab) => {
            if (tab.isActive && tab.historyIndex < tab.history.length - 1) {
              const newIndex = tab.historyIndex + 1;
              return {
                ...tab,
                url: tab.history[newIndex],
                historyIndex: newIndex,
              };
            }
            return tab;
          }),
        };
      }
      return workspace;
    });

    setWorkspaces(updatedWorkspaces);
  };

  const handleHome = () => {
    const updatedWorkspaces = workspaces.map((workspace) => {
      if (workspace.id === currentWorkspaceId) {
        return {
          ...workspace,
          tabs: workspace.tabs.map((tab) => {
            if (tab.isActive) {
              return { 
                ...tab, 
                url: '',
                history: [...tab.history, ''],
                historyIndex: tab.history.length
              };
            }
            return tab;
          }),
        };
      }
      return workspace;
    });

    setWorkspaces(updatedWorkspaces);
  };

  const handleNewTab = () => {
    const newTab: Tab = {
      id: Date.now().toString(),
      url: '',
      title: 'New Tab',
      isActive: true,
      history: [],
      historyIndex: -1,
    };

    const updatedWorkspaces = workspaces.map((workspace) => {
      if (workspace.id === currentWorkspaceId) {
        return {
          ...workspace,
          tabs: [...workspace.tabs.map((t) => ({ ...t, isActive: false })), newTab],
        };
      }
      return workspace;
    });

    setWorkspaces(updatedWorkspaces);
  };

  const handleCloseTab = (tabId: string) => {
    const updatedWorkspaces = workspaces.map((workspace) => {
      if (workspace.id === currentWorkspaceId) {
        const filteredTabs = workspace.tabs.filter((t) => t.id !== tabId);
        
        // Don't close if it's the last tab
        if (filteredTabs.length === 0) {
          return {
            ...workspace,
            tabs: [{ id: Date.now().toString(), url: '', title: 'New Tab', isActive: true, history: [], historyIndex: -1 }],
          };
        }

        // If we closed the active tab, activate another
        const closedTabWasActive = workspace.tabs.find((t) => t.id === tabId)?.isActive;
        if (closedTabWasActive && filteredTabs.length > 0) {
          filteredTabs[filteredTabs.length - 1].isActive = true;
        }

        return { ...workspace, tabs: filteredTabs };
      }
      return workspace;
    });

    setWorkspaces(updatedWorkspaces);
  };

  const handleTabClick = (tabId: string) => {
    const updatedWorkspaces = workspaces.map((workspace) => {
      if (workspace.id === currentWorkspaceId) {
        return {
          ...workspace,
          tabs: workspace.tabs.map((t) => ({ ...t, isActive: t.id === tabId })),
        };
      }
      return workspace;
    });

    setWorkspaces(updatedWorkspaces);
  };

  const handleTabTitleChange = (title: string) => {
    const updatedWorkspaces = workspaces.map((workspace) => {
      if (workspace.id === currentWorkspaceId) {
        return {
          ...workspace,
          tabs: workspace.tabs.map((tab) => {
            if (tab.isActive) {
              return { ...tab, title };
            }
            return tab;
          }),
        };
      }
      return workspace;
    });

    setWorkspaces(updatedWorkspaces);
  };

  const handleCreateWorkspace = (name: string) => {
    const newWorkspace: Workspace = {
      id: Date.now().toString(),
      name,
      tabs: [{ id: Date.now().toString(), url: '', title: 'New Tab', isActive: true, history: [], historyIndex: -1 }],
    };

    setWorkspaces([...workspaces, newWorkspace]);
  };

  const handleDeleteWorkspace = (id: string) => {
    if (workspaces.length <= 1) return;
    
    const filtered = workspaces.filter((w) => w.id !== id);
    setWorkspaces(filtered);
    
    if (currentWorkspaceId === id) {
      setCurrentWorkspaceId(filtered[0].id);
    }
  };

  const handleAddBookmark = (title: string, url: string) => {
    const bookmark: Bookmark = {
      id: Date.now().toString(),
      title,
      url,
      createdAt: Date.now(),
    };
    setBookmarks([...bookmarks, bookmark]);
  };

  const handleDeleteBookmark = (id: string) => {
    setBookmarks(bookmarks.filter((b) => b.id !== id));
  };

  const showHomePage = !activeTab?.url;

  return (
    <div className="h-screen w-full overflow-hidden text-white relative">
      <ParticleBackground />

      {showProfessionPrompt && <ProfessionPrompt onSelect={handleProfessionSelect} />}

      <div className="relative z-10 h-full flex flex-col">
        {/* Top Navigation */}
        <div className="bg-gradient-to-b from-black/40 to-transparent backdrop-blur-lg border-b border-white/10 p-4">
          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                CozyTab
              </h1>
            </div>

            <div className="flex-1 max-w-3xl">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  id="search-bar"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="Search or enter URL..."
                  className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-gray-400 backdrop-blur-xl"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={() => setShowBookmarks(true)}
                variant="ghost"
                size="icon"
                className="hover:bg-white/10"
                title="Bookmarks (Ctrl+D)"
              >
                <Bookmark className="w-5 h-5" />
              </Button>
              <Button
                onClick={() => setShowHistory(true)}
                variant="ghost"
                size="icon"
                className="hover:bg-white/10"
                title="History"
              >
                <History className="w-5 h-5" />
              </Button>
              <Button
                onClick={() => setShowWorkspaces(true)}
                variant="ghost"
                size="icon"
                className="hover:bg-white/10"
                title="Workspaces (Ctrl+Shift+N)"
              >
                <Layers className="w-5 h-5" />
              </Button>
              <Button
                onClick={() => setShowSettings(true)}
                variant="ghost"
                size="icon"
                className="hover:bg-white/10"
                title="Settings"
              >
                <Settings className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto">
            <AnimatePresence>
              {currentWorkspace.tabs.map((tab) => (
                <BrowserTab
                  key={tab.id}
                  tab={tab}
                  onClose={handleCloseTab}
                  onClick={handleTabClick}
                />
              ))}
            </AnimatePresence>
            <Button
              onClick={handleNewTab}
              variant="ghost"
              size="icon"
              className="hover:bg-white/10 shrink-0"
              title="New Tab (Ctrl+T)"
            >
              <Plus className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {!showHomePage && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-r from-black/30 via-black/20 to-black/30 backdrop-blur-md border-b border-white/10 px-6 py-3 flex items-center gap-3"
            >
              {/* Navigation Buttons */}
              <motion.button
                onClick={handleBack}
                disabled={!activeTab || !activeTab.history || activeTab.historyIndex <= 0}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`p-2.5 rounded-xl backdrop-blur-xl border transition-all ${
                  !activeTab || !activeTab.history || activeTab.historyIndex <= 0
                    ? 'bg-white/5 border-white/10 text-gray-500 cursor-not-allowed'
                    : 'bg-gradient-to-br from-purple-500/20 to-blue-500/20 border-purple-400/30 text-white hover:from-purple-500/30 hover:to-blue-500/30 hover:border-purple-400/50 hover:shadow-lg hover:shadow-purple-500/20'
                }`}
                title="Go Back"
              >
                <ArrowLeft className="w-5 h-5" />
              </motion.button>

              <motion.button
                onClick={handleForward}
                disabled={!activeTab || !activeTab.history || activeTab.historyIndex >= activeTab.history.length - 1}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`p-2.5 rounded-xl backdrop-blur-xl border transition-all ${
                  !activeTab || !activeTab.history || activeTab.historyIndex >= activeTab.history.length - 1
                    ? 'bg-white/5 border-white/10 text-gray-500 cursor-not-allowed'
                    : 'bg-gradient-to-br from-purple-500/20 to-blue-500/20 border-purple-400/30 text-white hover:from-purple-500/30 hover:to-blue-500/30 hover:border-purple-400/50 hover:shadow-lg hover:shadow-purple-500/20'
                }`}
                title="Go Forward"
              >
                <ArrowRight className="w-5 h-5" />
              </motion.button>

              <motion.button
                onClick={handleHome}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="p-2.5 rounded-xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 border border-purple-400/30 text-white hover:from-purple-500/30 hover:to-blue-500/30 hover:border-purple-400/50 backdrop-blur-xl transition-all hover:shadow-lg hover:shadow-purple-500/20"
                title="Go Home"
              >
                <HomeIcon className="w-5 h-5" />
              </motion.button>

              {/* Current URL Display */}
              <div className="flex-1 px-4 py-2 rounded-xl bg-white/5 border border-white/10 backdrop-blur-xl">
                <p className="text-sm text-gray-300 truncate">{activeTab?.url || ''}</p>
              </div>
            </motion.div>
          )}

          <div className="flex-1 overflow-hidden">
            {showHomePage ? (
              <div className="h-full overflow-y-auto p-8">
                <div className="max-w-6xl mx-auto">
                  {/* Clock and Greeting */}
                  <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-12"
                  >
                    <div className="flex items-center justify-center gap-3 mb-3">
                      <Clock className="w-8 h-8 text-purple-400" />
                      <h2 className="text-6xl">{currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</h2>
                    </div>
                    <p className="text-2xl text-gray-300">{greeting}</p>
                    {profession && (
                      <p className="text-sm text-gray-400 mt-2">
                        Personalized for: <span className="text-purple-400 capitalize">{profession}</span>
                      </p>
                    )}
                  </motion.div>

                  {/* Quick Links */}
                  <QuickLinks profession={profession} onNavigate={handleNavigate} />

                  {/* Widgets based on profession */}
                  {profession && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className="mt-8 p-6 rounded-3xl bg-gradient-to-br from-purple-900/20 to-blue-900/20 border border-purple-500/20 backdrop-blur-sm"
                    >
                      <h3 className="text-xl mb-3 flex items-center gap-2">
                        <span className="text-purple-400">✨</span> Quick Tips for {profession}
                      </h3>
                      <div className="text-gray-300 space-y-2">
                        {profession === 'student' && (
                          <>
                            <p>• Stay organized with your workspace tabs for different subjects</p>
                            <p>• Bookmark important research articles and resources</p>
                            <p>• Use the AI assistant for quick grammar and research help</p>
                          </>
                        )}
                        {profession === 'tech' && (
                          <>
                            <p>• Keep documentation tabs in separate workspaces</p>
                            <p>• Use Code Helper AI for debugging assistance</p>
                            <p>• Bookmark your favorite GitHub repos and Stack Overflow threads</p>
                          </>
                        )}
                        {profession === 'finance' && (
                          <>
                            <p>• Track market data across multiple workspace tabs</p>
                            <p>• Bookmark financial news sources for quick access</p>
                            <p>• Enable tracker blocking for secure browsing</p>
                          </>
                        )}
                        {!['student', 'tech', 'finance'].includes(profession) && (
                          <>
                            <p>• Organize your work with multiple workspaces</p>
                            <p>• Use bookmarks to save important resources</p>
                            <p>• Try the AI assistant for productivity tips</p>
                          </>
                        )}
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>
            ) : (
              <DirectNavigationView url={activeTab.url} onTitleChange={handleTabTitleChange} />
            )}
          </div>
        </div>
      </div>

      {/* Floating Panels */}
      <BookmarksPanel
        isOpen={showBookmarks}
        onClose={() => setShowBookmarks(false)}
        bookmarks={bookmarks}
        onAddBookmark={handleAddBookmark}
        onDeleteBookmark={handleDeleteBookmark}
        onNavigate={handleNavigate}
      />

      <SettingsPanel
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        settings={settings}
        onSettingsChange={setSettings}
      />

      <WorkspacePanel
        isOpen={showWorkspaces}
        onClose={() => setShowWorkspaces(false)}
        workspaces={workspaces}
        currentWorkspaceId={currentWorkspaceId}
        onCreateWorkspace={handleCreateWorkspace}
        onSwitchWorkspace={setCurrentWorkspaceId}
        onDeleteWorkspace={handleDeleteWorkspace}
      />

      <HistoryPanel
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
        history={history}
        onNavigate={handleNavigate}
        onClearHistory={() => setHistory([])}
      />

      {/* AI Assistant */}
      <AIAssistant />
    </div>
  );
}

export default App;