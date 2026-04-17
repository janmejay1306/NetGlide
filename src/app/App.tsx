import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  Sparkles,
} from 'lucide-react';
import { ParticleBackground } from '../components/ParticleBackground';
import { ProfessionPrompt } from '../components/ProfessionPrompt';
import { AIAssistant } from '../components/AIAssistant';
import { BrowserTab } from '../components/BrowserTab';
import { QuickLinks } from '../components/QuickLinks';
import type { QuickLink } from '../components/QuickLinks';
import { BookmarksPanel } from '../components/BookmarksPanel';
import { SettingsPanel } from '../components/SettingsPanel';
import { WorkspacePanel } from '../components/WorkspacePanel';
import { HistoryPanel } from '../components/HistoryPanel';
import { Input } from '../components/ui/input';
import { getTheme, applyTheme } from '../components/utils/themes';

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

interface BookmarkItem {
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
  isDarkMode: boolean;
  geminiApiKey: string;
  userName: string;
  avatarUrl: string;
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
  isDarkMode: true,
  geminiApiKey: '',
  userName: '',
  avatarUrl: '',
};

function App() {
  const [isMac, setIsMac] = useState(false);
  const [showProfessionPrompt, setShowProfessionPrompt] = useState(false);
  const [profession, setProfession] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [greeting, setGreeting] = useState('');

  // Detect platform on mount
  useEffect(() => {
    setIsMac(navigator.userAgent.toLowerCase().includes('mac'));
  }, []);

  const [workspaces, setWorkspaces] = useState<Workspace[]>([
    {
      id: '1',
      name: 'Main Workspace',
      tabs: [{ id: '1', url: '', title: 'New Tab', isActive: true, history: [], historyIndex: -1 }],
    },
  ]);
  const [currentWorkspaceId, setCurrentWorkspaceId] = useState('1');
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);

  const [showBookmarks, setShowBookmarks] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showWorkspaces, setShowWorkspaces] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [customLinks, setCustomLinks] = useState<QuickLink[]>([]);

  // Ref to the Electron <webview> element
  const webviewRef = useRef<any>(null);

  const currentWorkspace = workspaces.find((w) => w.id === currentWorkspaceId) || workspaces[0];
  const activeTab = currentWorkspace.tabs.find((t) => t.isActive);

  // ── HANDLERS ────────────────────────────────────────────────────────────────

  const handleProfessionSelect = (selectedProfession: string) => {
    setProfession(selectedProfession);
    setShowProfessionPrompt(false);
    localStorage.setItem('cozytab_seen_prompt', 'true');
  };

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter') return;

    e.preventDefault();

    const query = (e.target as HTMLInputElement).value.trim();

    if (!query) return;

    let url = query.trim();

    if (url.startsWith('http')) {
      // good
    } else if (url.includes('.')) {
      url = 'https://' + url;
    } else {
      const engines = {
        google: 'https://www.google.com/search?q=',
        duckduckgo: 'https://duckduckgo.com/?q=',
        bing: 'https://www.bing.com/search?q=',
        brave: 'https://search.brave.com/search?q=',
        yahoo: 'https://search.yahoo.com/search?p=',
        ecosia: 'https://www.ecosia.org/search?q=',
        startpage: 'https://www.startpage.com/do/search?q=',
        yandex: 'https://yandex.com/search/?text=',
      };
      url = engines[settings.searchEngine as keyof typeof engines] + encodeURIComponent(query);
    }

    handleNavigate(url);
    setSearchQuery('');
  };

  const handleNavigate = (url: string) => {
    // Empty URL means "go home" – clear the active tab instead of pushing history.
    if (!url) {
      const clearedWorkspaces = workspaces.map((workspace) => {
        if (workspace.id === currentWorkspaceId) {
          return {
            ...workspace,
            tabs: workspace.tabs.map((tab) =>
              tab.isActive
                ? { ...tab, url: '', title: 'New Tab', history: [], historyIndex: -1 }
                : tab
            ),
          };
        }
        return workspace;
      });
      setWorkspaces(clearedWorkspaces);
      return;
    }

    const updatedWorkspaces = workspaces.map((workspace) => {
      if (workspace.id === currentWorkspaceId) {
        return {
          ...workspace,
          tabs: workspace.tabs.map((tab) => {
            if (tab.isActive) {
              const newHistory = tab.history.slice(0, tab.historyIndex + 1);
              newHistory.push(url);
              return {
                ...tab,
                url,
                history: newHistory,
                historyIndex: newHistory.length - 1,
              };
            }
            return tab;
          }),
        };
      }
      return workspace;
    });

    setWorkspaces(updatedWorkspaces);

    const historyItem: HistoryItem = {
      id: Date.now().toString(),
      url,
      title: new URL(url).hostname,
      visitedAt: Date.now(),
    };
    setHistory((prev) => [...prev, historyItem]);

    // ✅ Load URL inside the Electron webview — stays inside Netglide
    if (webviewRef.current) {
      webviewRef.current.loadURL(url);
    }
  };

  const handleBack = () => {
    if (!activeTab || !activeTab.history || activeTab.historyIndex <= 0) return;

    const newIndex = activeTab.historyIndex - 1;
    const backUrl = activeTab.history[newIndex];

    const updatedWorkspaces = workspaces.map((workspace) => {
      if (workspace.id === currentWorkspaceId) {
        return {
          ...workspace,
          tabs: workspace.tabs.map((tab) => {
            if (tab.isActive) {
              return {
                ...tab,
                url: backUrl,
                historyIndex: newIndex
              };
            }
            return tab;
          }),
        };
      }
      return workspace;
    });

    setWorkspaces(updatedWorkspaces);

    // ✅ Use webview goBack() for proper browser back navigation
    if (webviewRef.current) {
      webviewRef.current.goBack();
    }
  };

  const handleForward = () => {
    if (!activeTab || !activeTab.history || activeTab.historyIndex >= activeTab.history.length - 1) return;

    const newIndex = activeTab.historyIndex + 1;
    const forwardUrl = activeTab.history[newIndex];

    const updatedWorkspaces = workspaces.map((workspace) => {
      if (workspace.id === currentWorkspaceId) {
        return {
          ...workspace,
          tabs: workspace.tabs.map((tab) => {
            if (tab.isActive) {
              return {
                ...tab,
                url: forwardUrl,
                historyIndex: newIndex
              };
            }
            return tab;
          }),
        };
      }
      return workspace;
    });

    setWorkspaces(updatedWorkspaces);

    // ✅ Use webview goForward() for proper browser forward navigation
    if (webviewRef.current) {
      webviewRef.current.goForward();
    }
  };

  const handleHome = () => {
    handleNavigate(''); // clears URL → shows home page
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

        if (filteredTabs.length === 0) {
          return {
            ...workspace,
            tabs: [{ id: Date.now().toString(), url: '', title: 'New Tab', isActive: true, history: [], historyIndex: -1 }],
          };
        }

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

    // ✅ When switching tabs, load that tab's URL into the webview
    const clickedTab = currentWorkspace.tabs.find((t) => t.id === tabId);
    if (clickedTab?.url && webviewRef.current) {
      webviewRef.current.loadURL(clickedTab.url);
    }
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
    const bookmark: BookmarkItem = {
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

  // ── LOAD FROM LOCALSTORAGE ──────────────────────────────────────────────────

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
      const theme = getTheme(loadedSettings.theme || 'gx-neon');
      applyTheme(theme);
    } else {
      const defaultTheme = getTheme('gx-neon');
      applyTheme(defaultTheme);
    }

    if (savedProfession) setProfession(savedProfession);
    if (savedWorkspaces) {
      const loaded = JSON.parse(savedWorkspaces);
      const migrated = loaded.map((w: Workspace) => ({
        ...w,
        tabs: w.tabs.map((t: Tab) => ({
          ...t,
          history: t.history || [],
          historyIndex: t.historyIndex ?? -1,
        })),
      }));
      setWorkspaces(migrated);
    }
    if (savedBookmarks) setBookmarks(JSON.parse(savedBookmarks));
    if (savedHistory) setHistory(JSON.parse(savedHistory));

    const savedCustomLinks = localStorage.getItem('cozytab_custom_links');
    if (savedCustomLinks) setCustomLinks(JSON.parse(savedCustomLinks));

    if (!hasSeenPrompt) setShowProfessionPrompt(true);
  }, []);

  // ── SAVE TO LOCALSTORAGE ────────────────────────────────────────────────────

  useEffect(() => { if (profession) localStorage.setItem('cozytab_profession', profession); }, [profession]);
  useEffect(() => { localStorage.setItem('cozytab_workspaces', JSON.stringify(workspaces)); }, [workspaces]);
  useEffect(() => { localStorage.setItem('cozytab_bookmarks', JSON.stringify(bookmarks)); }, [bookmarks]);
  useEffect(() => { localStorage.setItem('cozytab_history', JSON.stringify(history)); }, [history]);
  useEffect(() => { localStorage.setItem('cozytab_settings', JSON.stringify(settings)); }, [settings]);
  useEffect(() => { localStorage.setItem('cozytab_custom_links', JSON.stringify(customLinks)); }, [customLinks]);

  // ── TIME & GREETING ─────────────────────────────────────────────────────────

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now);
      const hour = now.getHours();
      setGreeting(
        hour < 12 ? 'Good Morning' :
          hour < 18 ? 'Good Afternoon' :
            'Good Evening'
      );
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // ── KEYBOARD SHORTCUTS ──────────────────────────────────────────────────────

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

  // ── INTERCEPT WEBVIEW LINK CLICKS (prevent external browser) ───────────────

  useEffect(() => {
    const webview = webviewRef.current;
    if (!webview) return;

    const handleNewWindow = (e: Event) => {
      // Prevent any link with target="_blank" or window.open() from opening Opera GX
      const event = e as any;
      event.preventDefault?.();
      if (event.url) {
        handleNavigate(event.url);
      }
    };

    webview.addEventListener('new-window', handleNewWindow);
    return () => webview.removeEventListener('new-window', handleNewWindow);
  }, [webviewRef.current]);

  const showHomePage = !activeTab?.url;

  return (
    <div className="h-screen w-full overflow-hidden text-white relative noise-overlay">
      <ParticleBackground themeId={settings.theme} />

      {showProfessionPrompt && <ProfessionPrompt onSelect={handleProfessionSelect} />}

      <div className="relative z-10 h-full flex flex-col">
        {/* Top Navigation - Ultra Dark Glass */}
        <div className="glass-panel border-b border-white/[0.04] shrink-0">
          {/* Tabs Row */}
          <div 
            className={`flex items-center gap-1 px-3 pt-2 pb-1 overflow-x-auto custom-scrollbar ${isMac ? 'pl-20' : ''}`}
          >
            <AnimatePresence>
              {currentWorkspace.tabs.map((tab) => (
                <BrowserTab
                  key={tab.id}
                  tab={tab}
                  onClose={handleCloseTab}
                  onClick={handleTabClick}
                  isMac={isMac}
                />
              ))}
            </AnimatePresence>
            <motion.button
              onClick={handleNewTab}
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
              className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/[0.06] transition-all shrink-0 ml-1"
              title={`New Tab (${isMac ? '⌘T' : 'Ctrl+T'})`}
            >
              <Plus className="w-4 h-4" />
            </motion.button>
          </div>

          {/* Navigation & Search Row */}
          <div className="flex items-center gap-3 px-3 pb-2 pt-1">
            {/* Nav Controls */}
            <div className="flex items-center gap-0.5 shrink-0">
              <motion.button
                onClick={handleBack}
                disabled={!activeTab || !activeTab.history || activeTab.historyIndex <= 0}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className={`p-2 rounded-lg transition-all ${!activeTab || !activeTab.history || activeTab.historyIndex <= 0
                  ? 'text-gray-700 cursor-not-allowed'
                  : 'text-gray-400 hover:text-white hover:bg-white/[0.06]'
                  }`}
              >
                <ArrowLeft className="w-4 h-4" />
              </motion.button>
              <motion.button
                onClick={handleForward}
                disabled={!activeTab || !activeTab.history || activeTab.historyIndex >= activeTab.history.length - 1}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className={`p-2 rounded-lg transition-all ${!activeTab || !activeTab.history || activeTab.historyIndex >= activeTab.history.length - 1
                  ? 'text-gray-700 cursor-not-allowed'
                  : 'text-gray-400 hover:text-white hover:bg-white/[0.06]'
                  }`}
              >
                <ArrowRight className="w-4 h-4" />
              </motion.button>
              <motion.button
                onClick={handleHome}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/[0.06] transition-all"
              >
                <HomeIcon className="w-4 h-4" />
              </motion.button>
            </div>

            {/* Omnibox */}
            <div className="flex-1 max-w-4xl mx-auto">
              <div className="flex items-center h-9 bg-white/[0.03] border border-white/[0.06] rounded-xl overflow-hidden hover:border-white/[0.12] focus-within:border-purple-500/40 focus-within:bg-white/[0.04] transition-all px-3 gap-2 group">
                <Search className="w-3.5 h-3.5 text-gray-600 shrink-0 group-focus-within:text-purple-400 transition-colors" />
                <Input
                  id="search-bar"
                  value={searchQuery}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                  onKeyDown={handleSearch}
                  placeholder={activeTab?.url || 'Search or enter URL...'}
                  className="flex-1 border-0 bg-transparent text-white placeholder:text-gray-600 shadow-none focus-visible:ring-0 h-full text-sm px-1"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-0.5 shrink-0">
              <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => setShowBookmarks(true)} className="p-2 rounded-lg text-gray-500 hover:text-white hover:bg-white/[0.06] transition-all" title="Bookmarks">
                <Bookmark className="w-4 h-4" />
              </motion.button>
              <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => setShowHistory(true)} className="p-2 rounded-lg text-gray-500 hover:text-white hover:bg-white/[0.06] transition-all" title="History">
                <History className="w-4 h-4" />
              </motion.button>
              <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => setShowWorkspaces(true)} className="p-2 rounded-lg text-gray-500 hover:text-white hover:bg-white/[0.06] transition-all" title="Workspaces">
                <Layers className="w-4 h-4" />
              </motion.button>
              <div className="w-px h-4 bg-white/[0.06] mx-1" />
              <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => setShowSettings(true)} className="p-2 rounded-lg text-gray-500 hover:text-white hover:bg-white/[0.06] transition-all" title="Settings">
                <Settings className="w-4 h-4" />
              </motion.button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-hidden">
          {showHomePage ? (
            <div className="h-full overflow-y-auto p-8 pt-10">
              <div className="max-w-5xl mx-auto">
                {/* Time & Greeting */}
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center mb-14"
                >
                  <motion.div
                    className="inline-flex items-center gap-3 mb-4"
                    animate={{ opacity: [0.7, 1, 0.7] }}
                    transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                  >
                    <Clock className="w-7 h-7 text-purple-500/60" />
                  </motion.div>
                  <h2 className="text-7xl font-extralight tracking-tight text-white/90 glow-text mb-3">
                    {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </h2>
                  <p className="text-xl font-light text-gray-500">{greeting}</p>
                  {profession && (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-xs text-gray-600 mt-3 uppercase tracking-[0.2em]"
                    >
                      Personalized for <span className="text-purple-400/80">{profession}</span>
                    </motion.p>
                  )}
                </motion.div>

                {/* Quick Links */}
                <QuickLinks
                  profession={profession}
                  onNavigate={handleNavigate}
                  customLinks={customLinks}
                  onCustomLinksChange={setCustomLinks}
                />

                {/* Profession Tips */}
                {profession && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="mt-10 p-6 rounded-2xl bg-white/[0.02] border border-white/[0.05] backdrop-blur-sm"
                  >
                    <h3 className="text-sm font-medium text-gray-400 mb-4 flex items-center gap-2 uppercase tracking-wider">
                      <Sparkles className="w-4 h-4 text-purple-400/60" /> Tips for {profession}
                    </h3>
                    <div className="text-sm text-gray-500 space-y-2.5">
                      {profession === 'student' && (
                        <>
                          <p className="flex items-start gap-2"><span className="text-purple-500/60 mt-0.5">▸</span> Stay organized with workspace tabs for different subjects</p>
                          <p className="flex items-start gap-2"><span className="text-purple-500/60 mt-0.5">▸</span> Bookmark important research articles and resources</p>
                          <p className="flex items-start gap-2"><span className="text-purple-500/60 mt-0.5">▸</span> Use the AI assistant for grammar checks and research help</p>
                        </>
                      )}
                      {profession === 'tech' && (
                        <>
                          <p className="flex items-start gap-2"><span className="text-purple-500/60 mt-0.5">▸</span> Keep API docs in separate workspaces for quick reference</p>
                          <p className="flex items-start gap-2"><span className="text-purple-500/60 mt-0.5">▸</span> Use Code Helper AI for debugging assistance</p>
                          <p className="flex items-start gap-2"><span className="text-purple-500/60 mt-0.5">▸</span> Bookmark your favorite GitHub repos and Stack Overflow threads</p>
                        </>
                      )}
                      {profession === 'finance' && (
                        <>
                          <p className="flex items-start gap-2"><span className="text-purple-500/60 mt-0.5">▸</span> Track market data across multiple workspace tabs</p>
                          <p className="flex items-start gap-2"><span className="text-purple-500/60 mt-0.5">▸</span> Bookmark financial news sources for quick access</p>
                          <p className="flex items-start gap-2"><span className="text-purple-500/60 mt-0.5">▸</span> Enable tracker blocking for secure financial browsing</p>
                        </>
                      )}
                      {profession === 'designer' && (
                        <>
                          <p className="flex items-start gap-2"><span className="text-pink-500/60 mt-0.5">▸</span> Use workspaces to separate client projects and inspiration</p>
                          <p className="flex items-start gap-2"><span className="text-pink-500/60 mt-0.5">▸</span> Bookmark Dribbble shots, Behance projects, and Figma files</p>
                          <p className="flex items-start gap-2"><span className="text-pink-500/60 mt-0.5">▸</span> Use the AI assistant for copywriting and color palette ideas</p>
                        </>
                      )}
                      {profession === 'marketer' && (
                        <>
                          <p className="flex items-start gap-2"><span className="text-orange-500/60 mt-0.5">▸</span> Track campaigns in separate workspaces for each channel</p>
                          <p className="flex items-start gap-2"><span className="text-orange-500/60 mt-0.5">▸</span> Bookmark Google Analytics, Ads dashboards, and reporting tools</p>
                          <p className="flex items-start gap-2"><span className="text-orange-500/60 mt-0.5">▸</span> Use the AI assistant for content ideas and ad copy</p>
                        </>
                      )}
                      {profession === 'entrepreneur' && (
                        <>
                          <p className="flex items-start gap-2"><span className="text-emerald-500/60 mt-0.5">▸</span> Use workspaces to separate product, funding, and market research</p>
                          <p className="flex items-start gap-2"><span className="text-emerald-500/60 mt-0.5">▸</span> Bookmark Product Hunt, Y Combinator, and AngelList for opportunities</p>
                          <p className="flex items-start gap-2"><span className="text-emerald-500/60 mt-0.5">▸</span> Ask the AI assistant for pitch deck feedback and market analysis</p>
                        </>
                      )}
                      {profession === 'researcher' && (
                        <>
                          <p className="flex items-start gap-2"><span className="text-cyan-500/60 mt-0.5">▸</span> Organize literature reviews across multiple workspace tabs</p>
                          <p className="flex items-start gap-2"><span className="text-cyan-500/60 mt-0.5">▸</span> Bookmark Google Scholar, arXiv, and ResearchGate for quick access</p>
                          <p className="flex items-start gap-2"><span className="text-cyan-500/60 mt-0.5">▸</span> Use the AI assistant to summarize papers and explain concepts</p>
                        </>
                      )}
                      {profession === 'custom' && (
                        <>
                          <p className="flex items-start gap-2"><span className="text-purple-500/60 mt-0.5">▸</span> Add your most-used sites as custom Quick Links above</p>
                          <p className="flex items-start gap-2"><span className="text-purple-500/60 mt-0.5">▸</span> Organize projects with multiple workspaces</p>
                          <p className="flex items-start gap-2"><span className="text-purple-500/60 mt-0.5">▸</span> Use the AI assistant for any task — writing, coding, research, and more</p>
                        </>
                      )}
                      {!['student', 'tech', 'finance', 'designer', 'marketer', 'entrepreneur', 'researcher', 'custom'].includes(profession) && (
                        <>
                          <p className="flex items-start gap-2"><span className="text-purple-500/60 mt-0.5">▸</span> Organize your work with multiple workspaces</p>
                          <p className="flex items-start gap-2"><span className="text-purple-500/60 mt-0.5">▸</span> Use bookmarks to save important resources</p>
                          <p className="flex items-start gap-2"><span className="text-purple-500/60 mt-0.5">▸</span> Try the AI assistant for productivity tips</p>
                        </>
                      )}
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
          ) : (
            <div className="h-full w-full bg-[#0a0a0a]" id="webview-container">
              {/* Electron webview */}
              <webview
                ref={webviewRef}
                src={activeTab?.url || 'about:blank'}
                style={{ width: '100%', height: '100%', display: 'flex' }}
              />
            </div>
          )}
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
        profession={profession}
        onProfessionChange={setProfession}
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

      <AIAssistant geminiApiKey={settings.geminiApiKey} />
    </div>
  );
}

export default App;