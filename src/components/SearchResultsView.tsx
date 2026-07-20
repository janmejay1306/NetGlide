/**
 * SearchResultsView.tsx
 * 
 * A beautiful, native-feeling search results page that displays inside NetGlide
 * instead of redirecting to an external search engine. Results are fetched via
 * IPC (Electron) or a fallback scraping approach, then rendered as elegant cards
 * matching the dark/neon NetGlide theme.
 * 
 * Features:
 *   - Smooth skeleton loading animation
 *   - Multiple search engine support (Google, Bing, DuckDuckGo, etc.)
 *   - Click-to-navigate on any result
 *   - Integrated "open in search engine" fallback button
 *   - Fully responsive, premium dark UI
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Globe,
  ExternalLink,
  Clock,
  ChevronRight,
  Sparkles,
  AlertTriangle,
  RefreshCw,
  ArrowRight,
  Zap,
  Shield,
} from 'lucide-react';

// ── Types ──────────────────────────────────────────────────────
export interface SearchResult {
  title: string;
  url: string;
  displayUrl: string;
  snippet: string;
  favicon?: string;
}

interface SearchResultsViewProps {
  query: string;
  searchEngine: string;
  onNavigate: (url: string) => void;
  onNewSearch: (query: string) => void;
  isActive: boolean;
}

// ── Search engine metadata ────────────────────────────────────
const ENGINE_META: Record<string, { name: string; color: string; icon: string; gradient: string }> = {
  google:     { name: 'Google',      color: '#4285f4', icon: '🔍', gradient: 'from-blue-500/20 to-green-500/20' },
  bing:       { name: 'Bing',        color: '#00809d', icon: '🌐', gradient: 'from-cyan-500/20 to-blue-500/20' },
  duckduckgo: { name: 'DuckDuckGo',  color: '#de5833', icon: '🦆', gradient: 'from-orange-500/20 to-red-500/20' },
  brave:      { name: 'Brave',       color: '#fb542b', icon: '🦁', gradient: 'from-orange-500/20 to-yellow-500/20' },
  yahoo:      { name: 'Yahoo',       color: '#6001d2', icon: '🟣', gradient: 'from-purple-500/20 to-violet-500/20' },
  ecosia:     { name: 'Ecosia',      color: '#36a342', icon: '🌱', gradient: 'from-green-500/20 to-emerald-500/20' },
  startpage:  { name: 'Startpage',   color: '#5b89a7', icon: '🛡️', gradient: 'from-sky-500/20 to-blue-500/20' },
  yandex:     { name: 'Yandex',      color: '#ff0000', icon: '🔴', gradient: 'from-red-500/20 to-yellow-500/20' },
  opera:      { name: 'Opera Search', color: '#ff1b2d', icon: '⭕', gradient: 'from-red-500/20 to-rose-500/20' },
};

// ── Build the search URL for a given engine ───────────────────
function getSearchUrl(engine: string, query: string): string {
  const engines: Record<string, string> = {
    google:     'https://www.google.com/search?q=',
    duckduckgo: 'https://duckduckgo.com/?q=',
    bing:       'https://www.bing.com/search?q=',
    brave:      'https://search.brave.com/search?q=',
    yahoo:      'https://search.yahoo.com/search?p=',
    opera:      'https://search.yahoo.com/search?p=',
    ecosia:     'https://www.ecosia.org/search?q=',
    startpage:  'https://www.startpage.com/do/search?q=',
    yandex:     'https://yandex.com/search/?text=',
  };
  return (engines[engine] || engines.google) + encodeURIComponent(query);
}

// ── Extract domain from URL ───────────────────────────────────
function extractDomain(url: string): string {
  try {
    return new URL(url).hostname.replace('www.', '');
  } catch {
    return url;
  }
}

// ── Fetch results via Electron IPC (main process proxy) ───────
async function fetchSearchResults(query: string, engine: string): Promise<SearchResult[]> {
  const isElectron = typeof window !== 'undefined' && (window as any).require;
  
  if (isElectron) {
    try {
      const { ipcRenderer } = (window as any).require('electron');
      const results = await ipcRenderer.invoke('search-query', { query, engine });
      if (results && results.length > 0) return results;
    } catch (err) {
      console.warn('[SearchResultsView] IPC search failed, trying fallback:', err);
    }
  }

  // Fallback: use DuckDuckGo Instant Answer API (CORS-friendly, JSON)
  try {
    const resp = await fetch(
      `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`
    );
    const data = await resp.json();
    const results: SearchResult[] = [];

    // Abstract
    if (data.AbstractURL && data.AbstractText) {
      results.push({
        title: data.Heading || query,
        url: data.AbstractURL,
        displayUrl: extractDomain(data.AbstractURL),
        snippet: data.AbstractText,
      });
    }

    // Related topics
    if (Array.isArray(data.RelatedTopics)) {
      for (const topic of data.RelatedTopics) {
        if (topic.FirstURL && topic.Text) {
          results.push({
            title: topic.Text.split(' - ')[0] || topic.Text.slice(0, 80),
            url: topic.FirstURL,
            displayUrl: extractDomain(topic.FirstURL),
            snippet: topic.Text,
          });
        }
        // Nested subtopics
        if (Array.isArray(topic.Topics)) {
          for (const sub of topic.Topics) {
            if (sub.FirstURL && sub.Text) {
              results.push({
                title: sub.Text.split(' - ')[0] || sub.Text.slice(0, 80),
                url: sub.FirstURL,
                displayUrl: extractDomain(sub.FirstURL),
                snippet: sub.Text,
              });
            }
          }
        }
      }
    }

    // Results section
    if (Array.isArray(data.Results)) {
      for (const r of data.Results) {
        if (r.FirstURL && r.Text) {
          results.push({
            title: r.Text.split(' - ')[0] || r.Text.slice(0, 80),
            url: r.FirstURL,
            displayUrl: extractDomain(r.FirstURL),
            snippet: r.Text,
          });
        }
      }
    }

    return results.slice(0, 12);
  } catch (err) {
    console.warn('[SearchResultsView] Fallback API failed:', err);
    return [];
  }
}

// ── Skeleton loading card ─────────────────────────────────────
function SkeletonCard({ delay = 0 }: { delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
      className="p-5 rounded-2xl bg-white/[0.03] border border-white/[0.06] space-y-3"
    >
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl bg-white/[0.06] animate-pulse" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-3/4 rounded-lg bg-white/[0.06] animate-pulse" />
          <div className="h-3 w-1/2 rounded-lg bg-white/[0.04] animate-pulse" />
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-3 w-full rounded-lg bg-white/[0.04] animate-pulse" />
        <div className="h-3 w-5/6 rounded-lg bg-white/[0.04] animate-pulse" />
      </div>
    </motion.div>
  );
}

// ── Main Component ────────────────────────────────────────────
export function SearchResultsView({
  query,
  searchEngine,
  onNavigate,
  onNewSearch,
  isActive,
}: SearchResultsViewProps) {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [inlineQuery, setInlineQuery] = useState(query);
  const [searchTime, setSearchTime] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const meta = ENGINE_META[searchEngine] || ENGINE_META.google;

  // Fetch results whenever query changes
  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) return;
    setLoading(true);
    setError(false);
    setResults([]);
    const start = performance.now();

    try {
      const res = await fetchSearchResults(q, searchEngine);
      setSearchTime(Math.round(performance.now() - start));
      setResults(res);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [searchEngine]);

  useEffect(() => {
    doSearch(query);
    setInlineQuery(query);
  }, [query, doSearch]);

  const handleInlineSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const q = inlineQuery.trim();
      if (q && q !== query) {
        onNewSearch(q);
      }
    }
  };

  if (!isActive) return null;

  return (
    <div className="h-full w-full overflow-y-auto custom-scrollbar"
      style={{ background: 'linear-gradient(180deg, rgba(0,0,0,0.6) 0%, rgba(10,10,20,0.95) 100%)' }}
    >
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 pb-20">

        {/* ── Search header area ────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-8"
        >
          {/* Inline search bar for refining */}
          <div className="relative mb-5">
            <div className="flex items-center h-12 bg-white/[0.04] border border-white/[0.08] rounded-2xl overflow-hidden px-4 group hover:border-white/15 focus-within:border-purple-500/40 focus-within:ring-1 focus-within:ring-purple-500/30 transition-all shadow-lg shadow-black/20">
              <Search className="w-4.5 h-4.5 text-gray-500 shrink-0 group-focus-within:text-purple-400 transition-colors" />
              <input
                ref={inputRef}
                value={inlineQuery}
                onChange={(e) => setInlineQuery(e.target.value)}
                onKeyDown={handleInlineSearch}
                className="flex-1 bg-transparent text-white placeholder:text-gray-600 h-full text-sm font-medium px-3 outline-none border-none"
                placeholder="Refine your search..."
                autoComplete="off"
              />
              <button
                onClick={() => { if (inlineQuery.trim()) onNewSearch(inlineQuery.trim()); }}
                className="p-1.5 rounded-lg text-gray-500 hover:text-purple-400 hover:bg-purple-500/10 transition-colors"
              >
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Search meta info */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gradient-to-r ${meta.gradient} border border-white/[0.06]`}>
              <span className="text-sm">{meta.icon}</span>
              <span className="text-xs font-medium text-gray-300">{meta.name}</span>
            </div>

            {!loading && results.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-1.5 text-xs text-gray-500"
              >
                <Zap className="w-3 h-3 text-yellow-500/60" />
                <span>{results.length} results</span>
                <span>·</span>
                <span>{searchTime < 1000 ? `${searchTime}ms` : `${(searchTime/1000).toFixed(1)}s`}</span>
              </motion.div>
            )}

            {/* Open in search engine button */}
            <button
              onClick={() => onNavigate(getSearchUrl(searchEngine, query))}
              className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/[0.06] text-xs text-gray-400 hover:text-white hover:bg-white/[0.08] hover:border-white/[0.12] transition-all group"
            >
              <ExternalLink className="w-3 h-3 group-hover:text-purple-400 transition-colors" />
              <span>Open in {meta.name}</span>
            </button>
          </div>
        </motion.div>

        {/* ── Loading skeleton ──────────────────────────────── */}
        <AnimatePresence mode="wait">
          {loading && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-3"
            >
              {/* Animated loading header */}
              <div className="flex items-center gap-3 mb-6">
                <div className="relative">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                    >
                      <RefreshCw className="w-5 h-5 text-purple-400" />
                    </motion.div>
                  </div>
                  <div className="absolute -inset-2 bg-purple-500/10 rounded-full blur-xl" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-300">
                    Searching for "<span className="text-purple-400">{query}</span>"
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">Fetching results via {meta.name}...</p>
                </div>
              </div>
              
              {[0, 1, 2, 3, 4].map((i) => (
                <SkeletonCard key={i} delay={i * 0.08} />
              ))}
            </motion.div>
          )}

          {/* ── Error state ──────────────────────────────────── */}
          {!loading && error && (
            <motion.div
              key="error"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-16"
            >
              <div className="w-16 h-16 rounded-3xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-7 h-7 text-red-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Couldn't fetch results</h3>
              <p className="text-sm text-gray-500 mb-6 max-w-sm mx-auto">
                Something went wrong while searching. Try again or open directly in {meta.name}.
              </p>
              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={() => doSearch(query)}
                  className="px-5 py-2.5 rounded-xl bg-white/[0.06] border border-white/[0.08] text-sm text-gray-300 hover:text-white hover:bg-white/[0.1] transition-all"
                >
                  <RefreshCw className="w-4 h-4 inline mr-2" />
                  Retry
                </button>
                <button
                  onClick={() => onNavigate(getSearchUrl(searchEngine, query))}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-sm text-white font-medium shadow-lg shadow-purple-900/30 hover:shadow-purple-900/50 transition-all"
                >
                  <ExternalLink className="w-4 h-4 inline mr-2" />
                  Open {meta.name}
                </button>
              </div>
            </motion.div>
          )}

          {/* ── No results state ─────────────────────────────── */}
          {!loading && !error && results.length === 0 && (
            <motion.div
              key="no-results"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-16"
            >
              <div className="w-16 h-16 rounded-3xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mx-auto mb-4">
                <Search className="w-7 h-7 text-purple-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">No instant results found</h3>
              <p className="text-sm text-gray-500 mb-6 max-w-sm mx-auto">
                Open the full search page in {meta.name} for comprehensive results.
              </p>
              <button
                onClick={() => onNavigate(getSearchUrl(searchEngine, query))}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-sm text-white font-semibold shadow-lg shadow-purple-900/30 hover:shadow-purple-900/50 hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                <Globe className="w-4 h-4 inline mr-2" />
                Search on {meta.name}
              </button>
            </motion.div>
          )}

          {/* ── Results list ─────────────────────────────────── */}
          {!loading && !error && results.length > 0 && (
            <motion.div
              key="results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-3"
            >
              {results.map((result, idx) => (
                <motion.button
                  key={`${result.url}-${idx}`}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: idx * 0.04 }}
                  onClick={() => onNavigate(result.url)}
                  className="w-full text-left p-5 rounded-2xl bg-white/[0.025] border border-white/[0.06] hover:bg-white/[0.06] hover:border-white/[0.12] hover:shadow-lg hover:shadow-purple-900/10 transition-all group cursor-pointer relative overflow-hidden"
                >
                  {/* Hover glow effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500/[0.03] to-blue-500/[0.03] opacity-0 group-hover:opacity-100 transition-opacity" />
                  
                  <div className="relative z-10">
                    {/* URL + favicon row */}
                    <div className="flex items-center gap-2.5 mb-2">
                      <div className="w-6 h-6 rounded-lg bg-white/[0.06] flex items-center justify-center shrink-0 overflow-hidden">
                        {result.favicon ? (
                          <img 
                            src={result.favicon} 
                            alt="" 
                            className="w-4 h-4" 
                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                          />
                        ) : (
                          <Globe className="w-3 h-3 text-gray-500" />
                        )}
                      </div>
                      <span className="text-xs text-gray-500 truncate flex-1">
                        {result.displayUrl}
                      </span>
                      <ChevronRight className="w-3.5 h-3.5 text-gray-600 opacity-0 group-hover:opacity-100 group-hover:text-purple-400 transition-all shrink-0" />
                    </div>

                    {/* Title */}
                    <h3 className="text-[15px] font-semibold text-blue-400 group-hover:text-blue-300 transition-colors mb-1.5 leading-snug">
                      {result.title}
                    </h3>

                    {/* Snippet */}
                    {result.snippet && (
                      <p className="text-sm text-gray-400 leading-relaxed line-clamp-2">
                        {result.snippet}
                      </p>
                    )}
                  </div>
                </motion.button>
              ))}

              {/* ── Footer: "View all results on..." button ── */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: results.length * 0.04 + 0.2 }}
                className="pt-4 pb-8"
              >
                <button
                  onClick={() => onNavigate(getSearchUrl(searchEngine, query))}
                  className="w-full p-4 rounded-2xl border border-dashed border-white/[0.08] hover:border-purple-500/30 hover:bg-purple-500/[0.04] transition-all group flex items-center justify-center gap-3"
                >
                  <div className={`p-2 rounded-xl bg-gradient-to-br ${meta.gradient}`}>
                    <span className="text-base">{meta.icon}</span>
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium text-gray-300 group-hover:text-white transition-colors">
                      View all results on {meta.name}
                    </p>
                    <p className="text-xs text-gray-600">Full search results page with more options</p>
                  </div>
                  <ExternalLink className="w-4 h-4 text-gray-600 group-hover:text-purple-400 transition-colors ml-auto" />
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Privacy notice ────────────────────────────────── */}
        <div className="flex items-center justify-center gap-2 mt-4">
          <Shield className="w-3 h-3 text-gray-700" />
          <span className="text-[10px] text-gray-700">Searches are processed locally via {meta.name}</span>
        </div>
      </div>
    </div>
  );
}

export default SearchResultsView;
