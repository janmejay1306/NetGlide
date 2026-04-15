import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Youtube, Github, MessageCircle, Twitter, BookOpen,
  Plus, X, Pencil, ExternalLink, Palette, Briefcase,
  TrendingUp, Lightbulb, FlaskConical, Globe, RotateCcw
} from 'lucide-react';

export interface QuickLink {
  id: string;
  name: string;
  url: string;
  iconName: string;
  color: string;
  isCustom?: boolean;
}

const ICON_MAP: Record<string, any> = {
  Search, Youtube, Github, MessageCircle, Twitter, BookOpen,
  Palette, Briefcase, TrendingUp, Lightbulb, FlaskConical, Globe, ExternalLink,
};

const ICON_OPTIONS = [
  { name: 'Globe', icon: Globe },
  { name: 'Search', icon: Search },
  { name: 'BookOpen', icon: BookOpen },
  { name: 'Github', icon: Github },
  { name: 'Youtube', icon: Youtube },
  { name: 'MessageCircle', icon: MessageCircle },
  { name: 'Twitter', icon: Twitter },
  { name: 'Palette', icon: Palette },
  { name: 'Briefcase', icon: Briefcase },
  { name: 'TrendingUp', icon: TrendingUp },
  { name: 'Lightbulb', icon: Lightbulb },
  { name: 'FlaskConical', icon: FlaskConical },
  { name: 'ExternalLink', icon: ExternalLink },
];

const COLOR_OPTIONS = [
  'text-purple-400', 'text-blue-400', 'text-cyan-400', 'text-emerald-400',
  'text-green-400', 'text-yellow-400', 'text-orange-400', 'text-red-400',
  'text-pink-400', 'text-rose-400', 'text-indigo-400', 'text-white',
];

const DEFAULT_LINKS: QuickLink[] = [
  { id: 'd1', name: 'DuckDuckGo', url: 'https://duckduckgo.com', iconName: 'Search', color: 'text-orange-400' },
  { id: 'd2', name: 'Wikipedia', url: 'https://wikipedia.org', iconName: 'BookOpen', color: 'text-gray-300' },
  { id: 'd3', name: 'YouTube', url: 'https://youtube.com', iconName: 'Youtube', color: 'text-red-400' },
  { id: 'd4', name: 'GitHub', url: 'https://github.com', iconName: 'Github', color: 'text-white' },
  { id: 'd5', name: 'Reddit', url: 'https://reddit.com', iconName: 'MessageCircle', color: 'text-orange-400' },
  { id: 'd6', name: 'X/Twitter', url: 'https://x.com', iconName: 'Twitter', color: 'text-blue-400' },
];

const PROFESSION_LINKS: Record<string, QuickLink[]> = {
  student: [
    { id: 'p-s1', name: 'Khan Academy', url: 'https://khanacademy.org', iconName: 'BookOpen', color: 'text-green-400' },
    { id: 'p-s2', name: 'Coursera', url: 'https://coursera.org', iconName: 'BookOpen', color: 'text-blue-400' },
    { id: 'p-s3', name: 'Stack Overflow', url: 'https://stackoverflow.com', iconName: 'MessageCircle', color: 'text-orange-400' },
  ],
  tech: [
    { id: 'p-t1', name: 'GitHub', url: 'https://github.com', iconName: 'Github', color: 'text-white' },
    { id: 'p-t2', name: 'Stack Overflow', url: 'https://stackoverflow.com', iconName: 'MessageCircle', color: 'text-orange-400' },
    { id: 'p-t3', name: 'Dev.to', url: 'https://dev.to', iconName: 'BookOpen', color: 'text-purple-400' },
  ],
  finance: [
    { id: 'p-f1', name: 'Bloomberg', url: 'https://bloomberg.com', iconName: 'TrendingUp', color: 'text-yellow-400' },
    { id: 'p-f2', name: 'Yahoo Finance', url: 'https://finance.yahoo.com', iconName: 'TrendingUp', color: 'text-purple-400' },
    { id: 'p-f3', name: 'MarketWatch', url: 'https://marketwatch.com', iconName: 'TrendingUp', color: 'text-green-400' },
  ],
  designer: [
    { id: 'p-d1', name: 'Dribbble', url: 'https://dribbble.com', iconName: 'Palette', color: 'text-pink-400' },
    { id: 'p-d2', name: 'Behance', url: 'https://behance.net', iconName: 'Palette', color: 'text-blue-400' },
    { id: 'p-d3', name: 'Figma', url: 'https://figma.com', iconName: 'Palette', color: 'text-purple-400' },
    { id: 'p-d4', name: 'Awwwards', url: 'https://awwwards.com', iconName: 'Globe', color: 'text-cyan-400' },
  ],
  marketer: [
    { id: 'p-m1', name: 'HubSpot Blog', url: 'https://blog.hubspot.com', iconName: 'TrendingUp', color: 'text-orange-400' },
    { id: 'p-m2', name: 'Google Trends', url: 'https://trends.google.com', iconName: 'TrendingUp', color: 'text-blue-400' },
    { id: 'p-m3', name: 'Canva', url: 'https://canva.com', iconName: 'Palette', color: 'text-cyan-400' },
    { id: 'p-m4', name: 'Mailchimp', url: 'https://mailchimp.com', iconName: 'Globe', color: 'text-yellow-400' },
  ],
  entrepreneur: [
    { id: 'p-e1', name: 'Y Combinator', url: 'https://ycombinator.com', iconName: 'Lightbulb', color: 'text-orange-400' },
    { id: 'p-e2', name: 'Product Hunt', url: 'https://producthunt.com', iconName: 'Lightbulb', color: 'text-red-400' },
    { id: 'p-e3', name: 'Indie Hackers', url: 'https://indiehackers.com', iconName: 'Briefcase', color: 'text-blue-400' },
    { id: 'p-e4', name: 'AngelList', url: 'https://angel.co', iconName: 'TrendingUp', color: 'text-emerald-400' },
  ],
  researcher: [
    { id: 'p-r1', name: 'Google Scholar', url: 'https://scholar.google.com', iconName: 'Search', color: 'text-blue-400' },
    { id: 'p-r2', name: 'arXiv', url: 'https://arxiv.org', iconName: 'FlaskConical', color: 'text-red-400' },
    { id: 'p-r3', name: 'ResearchGate', url: 'https://researchgate.net', iconName: 'FlaskConical', color: 'text-green-400' },
    { id: 'p-r4', name: 'PubMed', url: 'https://pubmed.ncbi.nlm.nih.gov', iconName: 'BookOpen', color: 'text-cyan-400' },
  ],
  custom: [],
};

interface QuickLinksProps {
  profession?: string;
  onNavigate: (url: string) => void;
  customLinks?: QuickLink[];
  onCustomLinksChange?: (links: QuickLink[]) => void;
  hiddenLinkIds?: string[];
  onHiddenLinkIdsChange?: (ids: string[]) => void;
  maxPerRow?: number;
}

export function QuickLinks({ profession, onNavigate, customLinks = [], onCustomLinksChange, hiddenLinkIds = [], onHiddenLinkIdsChange, maxPerRow = 6 }: QuickLinksProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newLink, setNewLink] = useState({ name: '', url: '', iconName: 'Globe', color: 'text-purple-400' });

  const professionLinks = profession && profession in PROFESSION_LINKS
    ? PROFESSION_LINKS[profession as keyof typeof PROFESSION_LINKS]
    : [];

  const allLinksUnfiltered = [...DEFAULT_LINKS, ...professionLinks, ...customLinks];
  const allLinks = allLinksUnfiltered.filter((link) => !hiddenLinkIds.includes(link.id));
  const hiddenCount = hiddenLinkIds.length;

  const handleAddLink = () => {
    if (!newLink.name.trim() || !newLink.url.trim()) return;
    let url = newLink.url.trim();
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }
    const link: QuickLink = {
      id: 'custom-' + Date.now(),
      name: newLink.name.trim(),
      url,
      iconName: newLink.iconName,
      color: newLink.color,
      isCustom: true,
    };
    onCustomLinksChange?.([...customLinks, link]);
    setNewLink({ name: '', url: '', iconName: 'Globe', color: 'text-purple-400' });
    setShowAddForm(false);
  };

  const handleRemoveLink = (link: QuickLink) => {
    if (link.isCustom) {
      // Remove custom links entirely
      onCustomLinksChange?.(customLinks.filter((l) => l.id !== link.id));
    } else {
      // Hide default/profession links
      onHiddenLinkIdsChange?.([...hiddenLinkIds, link.id]);
    }
  };

  const handleRestoreAll = () => {
    onHiddenLinkIdsChange?.([]);
  };

  const getIcon = (iconName: string) => ICON_MAP[iconName] || Globe;

  return (
    <div className="relative">
      {/* Edit Toggle */}
      <div className="flex items-center justify-end mb-5">
        <div className="flex items-center gap-2">
          {isEditing && hiddenCount > 0 && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleRestoreAll}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/25 transition-all"
            >
              <RotateCcw className="w-3 h-3" />
              Restore {hiddenCount} hidden
            </motion.button>
          )}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => { setIsEditing(!isEditing); setShowAddForm(false); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              isEditing
                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 border border-transparent'
            }`}
          >
            <Pencil className="w-3 h-3" />
            {isEditing ? 'Done' : 'Edit'}
          </motion.button>
        </div>
      </div>

      {/* Links Grid */}
      <div className={`grid gap-3 mb-6 ${
        maxPerRow === 4 ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4' :
        maxPerRow === 5 ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5' :
        maxPerRow === 8 ? 'grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8' :
        maxPerRow === 10 ? 'grid-cols-2 sm:grid-cols-5 md:grid-cols-8 lg:grid-cols-10' :
        'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6'
      }`}>
        <AnimatePresence>
          {allLinks.map((link, idx) => {
            const IconComponent = getIcon(link.iconName);
            return (
              <motion.div
                key={link.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ delay: idx * 0.03, type: 'spring', stiffness: 300, damping: 25 }}
                className="relative group"
              >
                <motion.button
                  whileHover={{ scale: 1.06, y: -4 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => !isEditing && onNavigate(link.url)}
                  className="w-full p-4 rounded-2xl bg-white/[0.03] hover:bg-white/[0.08] transition-all duration-300 backdrop-blur-sm border border-white/[0.06] hover:border-white/[0.15] flex flex-col items-center justify-center gap-2.5 relative overflow-hidden"
                >
                  {/* Glow effect on hover */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none bg-gradient-to-br from-purple-500/5 via-transparent to-blue-500/5" />
                  <div className={`relative z-10 p-2.5 rounded-xl bg-white/[0.04] group-hover:bg-white/[0.08] transition-all duration-300 group-hover:shadow-lg group-hover:shadow-purple-500/10`}>
                    <IconComponent className={`w-6 h-6 ${link.color} group-hover:scale-110 transition-transform duration-300`} />
                  </div>
                  <p className="relative z-10 text-xs font-medium text-gray-400 group-hover:text-white transition-colors duration-200 truncate w-full text-center">{link.name}</p>
                </motion.button>

                {/* Remove button — works for ALL links in edit mode */}
                {isEditing && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.5 }}
                    onClick={() => handleRemoveLink(link)}
                    className="absolute -top-1.5 -right-1.5 z-20 w-6 h-6 rounded-full bg-red-500/90 hover:bg-red-400 flex items-center justify-center shadow-lg shadow-red-500/30 transition-colors"
                    title={link.isCustom ? 'Delete link' : 'Hide link'}
                  >
                    <X className="w-3 h-3 text-white" />
                  </motion.button>
                )}

                {/* Shake animation in edit mode */}
                {isEditing && (
                  <motion.div
                    className="absolute inset-0 rounded-2xl border-2 border-dashed border-purple-500/30 pointer-events-none"
                    animate={{ rotate: [0, 1, -1, 0] }}
                    transition={{ repeat: Infinity, duration: 0.5, ease: 'easeInOut' }}
                  />
                )}
              </motion.div>
            );
          })}

          {/* Add New Link button */}
          {isEditing && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              whileHover={{ scale: 1.06, y: -4 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => setShowAddForm(true)}
              className="w-full p-4 rounded-2xl border-2 border-dashed border-white/10 hover:border-purple-500/40 bg-transparent hover:bg-purple-500/5 transition-all duration-300 flex flex-col items-center justify-center gap-2 group"
            >
              <div className="p-2.5 rounded-xl bg-white/5 group-hover:bg-purple-500/10 transition-colors">
                <Plus className="w-6 h-6 text-gray-500 group-hover:text-purple-400 transition-colors" />
              </div>
              <p className="text-xs font-medium text-gray-500 group-hover:text-purple-300 transition-colors">Add Link</p>
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* Add Link Form Modal */}
      <AnimatePresence>
        {showAddForm && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddForm(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md p-6 rounded-3xl bg-gray-900/95 border border-white/10 backdrop-blur-2xl shadow-2xl"
            >
              <h3 className="text-lg font-semibold text-white mb-5 flex items-center gap-2">
                <Plus className="w-5 h-5 text-purple-400" /> Add Quick Link
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-gray-400 mb-1.5 block">Name</label>
                  <input
                    type="text"
                    value={newLink.name}
                    onChange={(e) => setNewLink({ ...newLink, name: e.target.value })}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddLink()}
                    placeholder="e.g. My Portfolio"
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-gray-500 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/30 transition-all text-sm"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-400 mb-1.5 block">URL</label>
                  <input
                    type="text"
                    value={newLink.url}
                    onChange={(e) => setNewLink({ ...newLink, url: e.target.value })}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddLink()}
                    placeholder="e.g. myportfolio.com"
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-gray-500 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/30 transition-all text-sm"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-400 mb-1.5 block">Icon</label>
                  <div className="flex flex-wrap gap-2">
                    {ICON_OPTIONS.map((opt) => (
                      <button
                        key={opt.name}
                        onClick={() => setNewLink({ ...newLink, iconName: opt.name })}
                        className={`p-2 rounded-lg border transition-all ${
                          newLink.iconName === opt.name
                            ? 'bg-purple-500/20 border-purple-500/50 text-purple-300'
                            : 'bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/10'
                        }`}
                      >
                        <opt.icon className="w-4 h-4" />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-400 mb-1.5 block">Color</label>
                  <div className="flex flex-wrap gap-2">
                    {COLOR_OPTIONS.map((c) => (
                      <button
                        key={c}
                        onClick={() => setNewLink({ ...newLink, color: c })}
                        className={`w-7 h-7 rounded-full border-2 transition-all flex items-center justify-center ${
                          newLink.color === c ? 'border-white scale-110' : 'border-transparent hover:border-white/30'
                        }`}
                      >
                        <span className={`w-4 h-4 rounded-full ${c.replace('text-', 'bg-')}`} />
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowAddForm(false)}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 text-gray-300 hover:bg-white/10 transition-colors text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddLink}
                  disabled={!newLink.name.trim() || !newLink.url.trim()}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white disabled:opacity-40 disabled:cursor-not-allowed hover:from-purple-500 hover:to-blue-500 transition-all text-sm font-medium shadow-lg shadow-purple-500/20"
                >
                  Add Link
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
