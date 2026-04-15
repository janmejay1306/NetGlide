import React, { useEffect, useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Settings,
  X,
  Search,
  Home,
  Shield,
  Bell,
  Globe,
  Trash2,
  Type,
  User,
  Bot,
  Upload,
  Lock,
  Eye,
  EyeOff,
  Cookie,
  Fingerprint,
  ShieldCheck,
  ShieldAlert,
  Layers,
  Zap,
  Sparkles,
  Grid3X3,
  Maximize2,
  SlidersHorizontal,
  GraduationCap,
  Briefcase,
  FlaskConical,
  PenTool,
  TrendingUp,
  Megaphone,
  Lightbulb,
  UserCog,
  ChevronRight,
  Check,
  RotateCcw,
  Clock,
} from 'lucide-react';

const DEFAULT_AVATARS = [
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Jasper',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Mia',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Oliver',
];

import { Button } from './ui/button';
import { Switch } from './ui/switch';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { ThemeSelector } from './ThemeSelector';
import { getTheme, applyTheme } from './utils/themes';

// ── Role presets ────────────────────────────────────────────────
interface RolePreset {
  id: string;
  label: string;
  icon: any;
  description: string;
  gradient: string;
  settings: Partial<Record<string, any>>;
}

const ROLE_PRESETS: RolePreset[] = [
  {
    id: 'designer',
    label: 'Designer',
    icon: PenTool,
    description: 'Large fonts, spacious layout, smooth animations',
    gradient: 'from-pink-500 to-orange-400',
    settings: { fontSize: 20, uiDensity: 'spacious', animationSpeed: 'slow', showParticles: true, fontFamily: 'Outfit' },
  },
  {
    id: 'student',
    label: 'Student',
    icon: GraduationCap,
    description: 'Medium fonts, comfortable density, fast animations',
    gradient: 'from-cyan-500 to-blue-500',
    settings: { fontSize: 16, uiDensity: 'comfortable', animationSpeed: 'fast', showParticles: true, fontFamily: 'Inter' },
  },
  {
    id: 'researcher',
    label: 'Researcher',
    icon: FlaskConical,
    description: 'Small fonts, compact layout, minimal animations',
    gradient: 'from-emerald-500 to-teal-500',
    settings: { fontSize: 14, uiDensity: 'compact', animationSpeed: 'fast', showParticles: false, fontFamily: 'JetBrains Mono' },
  },
  {
    id: 'tech',
    label: 'Developer',
    icon: Briefcase,
    description: 'Medium fonts, compact density, fast animations, monospace font',
    gradient: 'from-violet-500 to-purple-500',
    settings: { fontSize: 16, uiDensity: 'compact', animationSpeed: 'fast', showParticles: true, fontFamily: 'JetBrains Mono' },
  },
  {
    id: 'finance',
    label: 'Finance',
    icon: TrendingUp,
    description: 'Medium fonts, comfortable density, professional look',
    gradient: 'from-amber-500 to-yellow-500',
    settings: { fontSize: 16, uiDensity: 'comfortable', animationSpeed: 'normal', showParticles: false, fontFamily: 'Inter' },
  },
  {
    id: 'marketer',
    label: 'Marketer',
    icon: Megaphone,
    description: 'Large fonts, spacious layout, vibrant style',
    gradient: 'from-rose-500 to-pink-500',
    settings: { fontSize: 20, uiDensity: 'spacious', animationSpeed: 'normal', showParticles: true, fontFamily: 'Outfit' },
  },
  {
    id: 'entrepreneur',
    label: 'Entrepreneur',
    icon: Lightbulb,
    description: 'Medium fonts, comfortable, modern style',
    gradient: 'from-orange-500 to-red-500',
    settings: { fontSize: 16, uiDensity: 'comfortable', animationSpeed: 'normal', showParticles: true, fontFamily: 'Space Grotesk' },
  },
];

// ── Native <select> dropdown — blur after change to prevent scroll jump ──
function NativeSelect({
  value,
  onChange,
  options,
  className = '',
}: {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  className?: string;
}) {
  return (
    <select
      value={value}
      onChange={(e) => {
        e.stopPropagation();
        onChange(e.target.value);
        // Blur immediately so the select doesn't hold focus and cause scroll issues
        e.target.blur();
      }}
      onMouseDown={(e) => e.stopPropagation()}
      className={`w-full h-9 px-3 py-2 text-sm bg-white/5 border border-white/10 text-white rounded-lg
                  focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/30
                  appearance-none cursor-pointer transition-all
                  bg-[url('data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%239ca3af%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E')]
                  bg-no-repeat bg-[right_0.75rem_center]
                  ${className}`}
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value} className="bg-gray-900 text-white">
          {opt.label}
        </option>
      ))}
    </select>
  );
}

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  settings: any;
  onSettingsChange: (settings: any) => void;
  profession: string;
  onProfessionChange: (profession: string) => void;
}

function SettingsPanelInner({ isOpen, onClose, settings, onSettingsChange, profession, onProfessionChange }: SettingsPanelProps) {
  const [currentTab, setCurrentTab] = useState<string>('general');
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const scrollPosRef = useRef<number>(0);

  // Preserve scroll position across re-renders caused by settings changes
  const saveScrollPos = useCallback(() => {
    if (scrollRef.current) {
      scrollPosRef.current = scrollRef.current.scrollTop;
    }
  }, []);

  const restoreScrollPos = useCallback(() => {
    if (scrollRef.current) {
      requestAnimationFrame(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollTop = scrollPosRef.current;
        }
      });
    }
  }, []);

  // Wrap onSettingsChange to preserve scroll
  const handleSettingsChange = useCallback((newSettings: any) => {
    saveScrollPos();
    onSettingsChange(newSettings);
    // Restore after React re-renders
    setTimeout(() => restoreScrollPos(), 0);
  }, [onSettingsChange, saveScrollPos, restoreScrollPos]);

  // Reset tab to general when panel opens
  useEffect(() => {
    if (isOpen) {
      setCurrentTab('general');
    }
  }, [isOpen]);

  // Apply theme whenever it changes
  useEffect(() => {
    if (settings.theme) {
      const theme = getTheme(settings.theme);
      applyTheme(theme);
    }
  }, [settings.theme]);

  const handleClearData = () => {
    if (confirm('Are you sure you want to clear all browsing data? This cannot be undone.')) {
      localStorage.clear();
      window.location.reload();
    }
  };

  const applyRolePreset = (preset: RolePreset) => {
    handleSettingsChange({ ...settings, ...preset.settings });
    onProfessionChange(preset.id);
  };

  // ── Section wrapper ──────────────────────────────────────────
  const SectionCard = ({ children, title, icon: Icon, className = '' }: { children: React.ReactNode; title?: string; icon?: any; className?: string }) => (
    <div className={`p-5 rounded-2xl bg-white/[0.03] border border-white/[0.06] space-y-5 ${className}`}>
      {title && (
        <div className="flex items-center gap-2 mb-1">
          {Icon && <Icon className="w-4 h-4 text-purple-400" />}
          <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">{title}</h3>
        </div>
      )}
      {children}
    </div>
  );

  // ── Toggle Row ───────────────────────────────────────────────
  const ToggleRow = ({ icon: Icon, label, description, checked, onChange }: { icon: any; label: string; description?: string; checked: boolean; onChange: (v: boolean) => void }) => (
    <div className="flex items-center justify-between gap-4" onClick={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()}>
      <div className="flex items-start gap-3 flex-1 min-w-0">
        <div className="mt-0.5 p-1.5 rounded-lg bg-white/5 shrink-0">
          <Icon className="w-4 h-4 text-gray-400" />
        </div>
        <div>
          <Label className="text-gray-200 text-sm cursor-pointer">{label}</Label>
          {description && <p className="text-xs text-gray-500 mt-0.5">{description}</p>}
        </div>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );

  const TABS = [
    { id: 'general', label: 'General' },
    { id: 'roles', label: 'Roles' },
    { id: 'privacy', label: 'Privacy' },
    { id: 'appearance', label: 'Appearance' },
    { id: 'ai', label: 'AI' },
    { id: 'advanced', label: 'Advanced' },
  ];

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
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 300 }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className="fixed right-0 top-0 bottom-0 w-full max-w-2xl bg-gradient-to-br from-gray-900/[0.98] to-gray-950/[0.98] border-l border-purple-500/20 backdrop-blur-xl shadow-2xl z-50 flex flex-col"
          >
            {/* ── Sticky Header ───────────────────────────────── */}
            <div className="shrink-0 p-6 pb-0">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 border border-purple-500/20">
                    <Settings className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold">Settings</h2>
                    <p className="text-xs text-gray-500">Customize your NetGlide experience</p>
                  </div>
                </div>
                <Button onClick={onClose} variant="ghost" size="icon" className="hover:bg-white/10 rounded-xl">
                  <X className="w-5 h-5" />
                </Button>
              </div>

              {/* ── Tab Bar (sticky) ─────────────────────────── */}
              <div className="grid grid-cols-6 bg-white/5 rounded-xl p-1 mb-0">
                {TABS.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setCurrentTab(tab.id);
                      // Scroll content area to top when switching tab
                      if (scrollRef.current) scrollRef.current.scrollTop = 0;
                    }}
                    className={`text-xs rounded-lg py-2 px-1 font-medium transition-all ${
                      currentTab === tab.id
                        ? 'bg-white/10 text-white shadow-sm'
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* ── Scrollable Content ─────────────────────────── */}
            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-6 pt-5 space-y-5"
            >
              {/* ══════════════════════════════════════════════════
                  GENERAL TAB
                  ══════════════════════════════════════════════════ */}
              {currentTab === 'general' && (
                <>
                  <SectionCard title="Profile" icon={User}>
                    <div>
                      <Label className="text-gray-200 mb-2 flex items-center gap-2 text-sm">
                        Display Name
                      </Label>
                      <Input
                        value={settings.userName || 'Explorer'}
                        onChange={(e) => handleSettingsChange({ ...settings, userName: e.target.value })}
                        placeholder="What should we call you?"
                        className="bg-white/5 border-white/10 text-white"
                      />
                    </div>

                    <div>
                      <Label className="text-gray-200 mb-2 flex items-center gap-2 text-sm">
                        Choose Avatar
                      </Label>
                      <div className="flex flex-wrap gap-3 mt-2">
                        {DEFAULT_AVATARS.map((avatar, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleSettingsChange({ ...settings, avatarUrl: avatar })}
                            className={`w-11 h-11 rounded-full overflow-hidden border-2 transition-all ${
                              settings.avatarUrl === avatar
                                ? 'border-purple-500 scale-110 shadow-lg shadow-purple-500/30'
                                : 'border-transparent hover:scale-105 hover:border-white/20'
                            }`}
                          >
                            <img src={avatar} alt={`Avatar ${idx}`} className="w-full h-full object-cover" />
                          </button>
                        ))}
                        <div className={`relative flex items-center justify-center w-11 h-11 rounded-full border-2 transition-colors cursor-pointer group overflow-hidden ${
                          settings.avatarUrl && !DEFAULT_AVATARS.includes(settings.avatarUrl)
                            ? 'border-purple-500 scale-110 shadow-lg shadow-purple-500/30'
                            : 'bg-white/5 border-dashed border-white/20 hover:border-white/40'
                        }`}>
                          <input
                            type="file"
                            accept="image/*"
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                            title="Upload custom picture"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onloadend = () => {
                                  typeof reader.result === 'string' && handleSettingsChange({ ...settings, avatarUrl: reader.result });
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                          />
                          {settings.avatarUrl && !DEFAULT_AVATARS.includes(settings.avatarUrl) ? (
                            <img src={settings.avatarUrl} className="w-full h-full object-cover" />
                          ) : (
                            <Upload className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors" />
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-white/5">
                      <Label className="text-gray-200 mb-2 flex items-center gap-2 text-sm">
                        <UserCog className="w-4 h-4" />
                        Personalized For
                      </Label>
                      <NativeSelect
                        value={profession || 'none'}
                        onChange={(value) => onProfessionChange(value === 'none' ? '' : value)}
                        options={[
                          { value: 'none', label: 'No Personalization' },
                          { value: 'student', label: 'Student' },
                          { value: 'tech', label: 'Tech Developer' },
                          { value: 'finance', label: 'Finance Professional' },
                          { value: 'designer', label: 'Designer' },
                          { value: 'marketer', label: 'Marketing Professional' },
                          { value: 'entrepreneur', label: 'Entrepreneur' },
                          { value: 'researcher', label: 'Researcher' },
                          { value: 'custom', label: 'Custom' },
                        ]}
                      />
                      {profession && profession !== 'none' && (
                        <p className="text-xs text-purple-400 mt-2">
                          ✨ Quick links and tips are tailored for {profession}
                        </p>
                      )}
                    </div>
                  </SectionCard>

                  <SectionCard title="Browsing" icon={Search}>
                    <div>
                      <Label className="text-gray-200 mb-2 flex items-center gap-2 text-sm">
                        <Search className="w-4 h-4" />
                        Default Search Engine
                      </Label>
                      <NativeSelect
                        value={settings.searchEngine}
                        onChange={(value) => handleSettingsChange({ ...settings, searchEngine: value })}
                        options={[
                          { value: 'google', label: '🔍 Google' },
                          { value: 'bing', label: '🌐 Bing' },
                          { value: 'duckduckgo', label: '🦆 DuckDuckGo' },
                          { value: 'brave', label: '🦁 Brave Search' },
                          { value: 'opera', label: '⭕ Opera Search' },
                          { value: 'yahoo', label: '📮 Yahoo' },
                          { value: 'ecosia', label: '🌳 Ecosia' },
                          { value: 'startpage', label: '🔒 Startpage' },
                          { value: 'yandex', label: '🅨 Yandex' },
                        ]}
                      />
                    </div>

                    <div>
                      <Label className="text-gray-200 mb-2 flex items-center gap-2 text-sm">
                        <Home className="w-4 h-4" />
                        Homepage
                      </Label>
                      <NativeSelect
                        value={settings.homepage || 'default'}
                        onChange={(value) => {
                          const newSettings = { ...settings, homepage: value };
                          // Auto-fill customHomepage for preset URLs
                          const presetUrls: Record<string, string> = {
                            'google-home': 'https://www.google.com',
                            'bing-home': 'https://www.bing.com',
                            'duckduckgo-home': 'https://duckduckgo.com',
                            'brave-home': 'https://search.brave.com',
                            'reddit-home': 'https://www.reddit.com',
                            'youtube-home': 'https://www.youtube.com',
                          };
                          if (presetUrls[value]) {
                            newSettings.customHomepage = presetUrls[value];
                          }
                          handleSettingsChange(newSettings);
                        }}
                        options={[
                          { value: 'default', label: '🏠 NetGlide Home (Default)' },
                          { value: 'google-home', label: '🔍 Google' },
                          { value: 'bing-home', label: '🌐 Bing' },
                          { value: 'duckduckgo-home', label: '🦆 DuckDuckGo' },
                          { value: 'brave-home', label: '🦁 Brave Search' },
                          { value: 'reddit-home', label: '📱 Reddit' },
                          { value: 'youtube-home', label: '▶️ YouTube' },
                          { value: 'custom', label: '✏️ Custom URL...' },
                        ]}
                      />
                      {settings.homepage === 'custom' && (
                        <Input
                          value={settings.customHomepage || ''}
                          onChange={(e) => handleSettingsChange({ ...settings, customHomepage: e.target.value })}
                          placeholder="https://example.com"
                          className="mt-2 bg-white/5 border-white/10 text-white"
                          onMouseDown={(e: React.MouseEvent) => e.stopPropagation()}
                        />
                      )}
                      {settings.homepage && !['default', 'blank', 'custom'].includes(settings.homepage) && (
                        <p className="text-xs text-purple-400/80 mt-1.5 flex items-center gap-1">
                          <span>🌐</span> Opens <strong className="text-purple-300">{settings.customHomepage}</strong> on every new tab
                        </p>
                      )}
                    </div>

                    <ToggleRow
                      icon={Bell}
                      label="Enable Notifications"
                      description="Show desktop notifications for important events"
                      checked={settings.notifications}
                      onChange={(checked) => handleSettingsChange({ ...settings, notifications: checked })}
                    />
                  </SectionCard>
                </>
              )}

              {/* ══════════════════════════════════════════════════
                  ROLES TAB
                  ══════════════════════════════════════════════════ */}
              {currentTab === 'roles' && (
                <>
                  <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20">
                    <div className="flex items-center gap-2 mb-1">
                      <Sparkles className="w-4 h-4 text-purple-400" />
                      <h3 className="text-sm font-semibold text-purple-300">Quick Role Presets</h3>
                    </div>
                    <p className="text-xs text-gray-400">
                      One-click presets that adjust font size, button style, density, animations, and more to match your workflow.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-3">
                    {ROLE_PRESETS.map((preset) => {
                      const Icon = preset.icon;
                      const isActive = profession === preset.id;
                      return (
                        <motion.div
                          key={preset.id}
                          whileHover={{ scale: 1.01, x: 4 }}
                          whileTap={{ scale: 0.99 }}
                          className={`relative p-4 rounded-2xl border cursor-pointer transition-all group ${
                            isActive
                              ? 'bg-white/[0.06] border-purple-500/40 shadow-lg shadow-purple-500/10'
                              : 'bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.04] hover:border-white/[0.12]'
                          }`}
                          onClick={() => applyRolePreset(preset)}
                        >
                          <div className="flex items-center gap-4">
                            <div className={`p-3 rounded-xl bg-gradient-to-br ${preset.gradient} shrink-0 shadow-lg`}>
                              <Icon className="w-5 h-5 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <h4 className="text-sm font-semibold text-white">{preset.label}</h4>
                                {isActive && (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                                    ACTIVE
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-gray-400 mt-0.5">{preset.description}</p>
                            </div>
                            <div className="shrink-0">
                              {isActive ? (
                                <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center">
                                  <Check className="w-4 h-4 text-purple-400" />
                                </div>
                              ) : (
                                <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-gray-400 transition-colors" />
                              )}
                            </div>
                          </div>

                          {/* Settings preview chips */}
                          <div className="flex flex-wrap gap-1.5 mt-3 pl-14">
                            {Object.entries(preset.settings).map(([key, val]) => (
                              <span key={key} className="px-2 py-0.5 rounded-full text-[10px] bg-white/5 text-gray-400 border border-white/5">
                                {key.replace(/([A-Z])/g, ' $1').trim()}: {String(val)}
                              </span>
                            ))}
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>

                  <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-400/20">
                    <p className="text-xs text-blue-300">
                      <span className="text-base">💡</span> <strong>Tip:</strong> Applying a role preset will update your density, animation speed, font family, and particles all at once. You can still fine-tune individual settings in the <strong>Appearance</strong> tab afterwards.
                    </p>
                  </div>
                </>
              )}

              {/* ══════════════════════════════════════════════════
                  PRIVACY TAB
                  ══════════════════════════════════════════════════ */}
              {currentTab === 'privacy' && (
                <>
                  <SectionCard title="Tracking & Security" icon={Shield}>
                    <ToggleRow
                      icon={Shield}
                      label="Block Trackers"
                      description="Prevent cross-site trackers from following you"
                      checked={settings.blockTrackers}
                      onChange={(checked) => handleSettingsChange({ ...settings, blockTrackers: checked })}
                    />

                    <ToggleRow
                      icon={ShieldAlert}
                      label="Block Ads"
                      description="Remove intrusive advertisements from web pages"
                      checked={settings.blockAds ?? false}
                      onChange={(checked) => handleSettingsChange({ ...settings, blockAds: checked })}
                    />

                    <ToggleRow
                      icon={Lock}
                      label="HTTPS-Only Mode"
                      description="Force secure connections whenever possible"
                      checked={settings.httpsOnly ?? true}
                      onChange={(checked) => handleSettingsChange({ ...settings, httpsOnly: checked })}
                    />

                    <ToggleRow
                      icon={Eye}
                      label="Send Do Not Track"
                      description="Request websites not to track your browsing"
                      checked={settings.doNotTrack ?? true}
                      onChange={(checked) => handleSettingsChange({ ...settings, doNotTrack: checked })}
                    />

                    <ToggleRow
                      icon={Fingerprint}
                      label="Fingerprint Protection"
                      description="Prevent sites from creating a unique device fingerprint"
                      checked={settings.fingerprintProtection ?? false}
                      onChange={(checked) => handleSettingsChange({ ...settings, fingerprintProtection: checked })}
                    />

                    <ToggleRow
                      icon={ShieldCheck}
                      label="Safe Browsing"
                      description="Warn before visiting dangerous websites"
                      checked={settings.safeBrowsing ?? true}
                      onChange={(checked) => handleSettingsChange({ ...settings, safeBrowsing: checked })}
                    />
                  </SectionCard>

                  <SectionCard title="Cookies & Data" icon={Cookie}>
                    <div>
                      <Label className="text-gray-200 mb-2 flex items-center gap-2 text-sm">
                        <Cookie className="w-4 h-4" />
                        Cookie Policy
                      </Label>
                      <NativeSelect
                        value={settings.cookiePolicy ?? 'allow-all'}
                        onChange={(value) => handleSettingsChange({ ...settings, cookiePolicy: value })}
                        options={[
                          { value: 'allow-all', label: 'Allow All Cookies' },
                          { value: 'block-third-party', label: 'Block Third-Party Cookies' },
                          { value: 'block-all', label: 'Block All Cookies' },
                        ]}
                      />
                    </div>

                    <ToggleRow
                      icon={Trash2}
                      label="Clear Cache on Exit"
                      description="Automatically delete cache when closing the browser"
                      checked={settings.clearCacheOnExit}
                      onChange={(checked) => handleSettingsChange({ ...settings, clearCacheOnExit: checked })}
                    />

                    <ToggleRow
                      icon={EyeOff}
                      label="Clear Cookies on Exit"
                      description="Automatically delete cookies when closing the browser"
                      checked={settings.clearCookiesOnExit ?? false}
                      onChange={(checked) => handleSettingsChange({ ...settings, clearCookiesOnExit: checked })}
                    />

                    <ToggleRow
                      icon={Eye}
                      label="Clear History on Exit"
                      description="Automatically delete browsing history on close"
                      checked={settings.clearHistoryOnExit ?? false}
                      onChange={(checked) => handleSettingsChange({ ...settings, clearHistoryOnExit: checked })}
                    />
                  </SectionCard>

                  <SectionCard title="VPN & Network" icon={Globe}>
                    <ToggleRow
                      icon={Globe}
                      label="VPN (Free Proxy)"
                      description="Route traffic through a proxy server for anonymity"
                      checked={settings.vpnEnabled}
                      onChange={(checked) => handleSettingsChange({ ...settings, vpnEnabled: checked })}
                    />
                    {settings.vpnEnabled && (
                      <p className="text-xs text-yellow-400/80 ml-10">
                        ⚠ VPN feature is simulated. In production, integrate with a VPN service API.
                      </p>
                    )}
                  </SectionCard>

                  <Button onClick={handleClearData} variant="destructive" className="w-full rounded-xl">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Clear All Browsing Data
                  </Button>
                </>
              )}

              {/* ══════════════════════════════════════════════════
                  APPEARANCE TAB
                  ══════════════════════════════════════════════════ */}
              {currentTab === 'appearance' && (
                <>
                  {/* Theme Selector */}
                  <ThemeSelector
                    currentThemeId={settings.theme || 'gx-neon'}
                    onThemeChange={(themeId) => handleSettingsChange({ ...settings, theme: themeId })}
                  />


                  {/* Font Family */}
                  <SectionCard title="Font Family" icon={Type}>
                    <NativeSelect
                      value={settings.fontFamily || 'Inter'}
                      onChange={(value) => handleSettingsChange({ ...settings, fontFamily: value })}
                      options={[
                        { value: 'Inter', label: 'Inter' },
                        { value: 'Roboto', label: 'Roboto' },
                        { value: 'JetBrains Mono', label: 'JetBrains Mono' },
                        { value: 'Outfit', label: 'Outfit' },
                        { value: 'Space Grotesk', label: 'Space Grotesk' },
                        { value: 'System', label: 'System Default' },
                      ]}
                    />
                    <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                      <p className="text-gray-500 text-[10px] uppercase tracking-wider mb-1">Preview</p>
                      <p style={{ fontFamily: ({
                        'Inter': "'Inter', sans-serif",
                        'Roboto': "'Roboto', sans-serif",
                        'JetBrains Mono': "'JetBrains Mono', monospace",
                        'Outfit': "'Outfit', sans-serif",
                        'Space Grotesk': "'Space Grotesk', sans-serif",
                        'System': 'system-ui, sans-serif',
                      } as Record<string, string>)[(settings.fontFamily as string) || 'Inter'] }} className="text-gray-200 text-sm">
                        AaBbCcDd 0123456789 — {settings.fontFamily || 'Inter'}
                      </p>
                    </div>
                  </SectionCard>

                  {/* UI Density */}
                  <SectionCard title="UI Density" icon={SlidersHorizontal}>
                    <div className="grid grid-cols-3 gap-3">
                      {([
                        { id: 'compact', label: 'Compact', desc: 'Minimal padding, more content', icon: Grid3X3 },
                        { id: 'comfortable', label: 'Comfortable', desc: 'Balanced spacing', icon: Layers },
                        { id: 'spacious', label: 'Spacious', desc: 'Extra breathing room', icon: Maximize2 },
                      ] as const).map((density) => {
                        const isActive = settings.uiDensity === density.id;
                        const DIcon = density.icon;
                        return (
                          <button
                            type="button"
                            key={density.id}
                            onClick={(e) => { e.stopPropagation(); handleSettingsChange({ ...settings, uiDensity: density.id }); }}
                            className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                              isActive
                                ? 'bg-purple-500/15 border-purple-500/50'
                                : 'bg-white/[0.03] border-white/[0.06] hover:border-white/[0.15]'
                            }`}
                          >
                            <DIcon className={`w-5 h-5 ${isActive ? 'text-purple-400' : 'text-gray-500'}`} />
                            <span className={`text-xs font-medium ${isActive ? 'text-purple-300' : 'text-gray-400'}`}>{density.label}</span>
                            <span className="text-[10px] text-gray-500 text-center">{density.desc}</span>
                          </button>
                        );
                      })}
                    </div>
                  </SectionCard>

                  {/* Animation Speed */}
                  <SectionCard title="Animation Speed" icon={Zap}>
                    <div className="grid grid-cols-4 gap-2">
                      {([
                        { id: 'off', label: 'Off', desc: 'No animations' },
                        { id: 'fast', label: 'Fast', desc: '0.15s' },
                        { id: 'normal', label: 'Normal', desc: '0.3s' },
                        { id: 'slow', label: 'Slow', desc: '0.6s' },
                      ] as const).map((speed) => {
                        const isActive = settings.animationSpeed === speed.id;
                        return (
                          <button
                            type="button"
                            key={speed.id}
                            onClick={(e) => { e.stopPropagation(); handleSettingsChange({ ...settings, animationSpeed: speed.id }); }}
                            className={`p-3 rounded-xl border-2 transition-all text-center ${
                              isActive
                                ? 'bg-purple-500/15 border-purple-500/50'
                                : 'bg-white/[0.03] border-white/[0.06] hover:border-white/[0.15]'
                            }`}
                          >
                            <span className={`text-xs font-medium block ${isActive ? 'text-purple-300' : 'text-gray-400'}`}>
                              {speed.label}
                            </span>
                            <span className="text-[10px] text-gray-500">{speed.desc}</span>
                          </button>
                        );
                      })}
                    </div>
                  </SectionCard>

                  {/* Visual toggles */}
                  <SectionCard title="Visual Options" icon={Eye}>
                    <ToggleRow
                      icon={Sparkles}
                      label="Background Particles"
                      description="Animated particle effects on the home screen"
                      checked={settings.showParticles !== false}
                      onChange={(checked) => handleSettingsChange({ ...settings, showParticles: checked })}
                    />

                    <ToggleRow
                      icon={Lightbulb}
                      label="Show Quick Tips"
                      description="Display contextual tips on the home page"
                      checked={settings.showQuickTips !== false}
                      onChange={(checked) => handleSettingsChange({ ...settings, showQuickTips: checked })}
                    />
                  </SectionCard>

                  {/* Time Section Theme */}
                  <SectionCard title="Time Section Theme" icon={Clock}>
                    <div className="grid grid-cols-2 gap-2">
                       {([
                         { id: 'minimal', label: 'Minimal', desc: 'Clean text only' },
                         { id: 'modern-glow', label: 'Modern Glow', desc: 'Sleek with glow' },
                         { id: 'futuristic', label: 'Futuristic', desc: 'Glass-morphism style' },
                         { id: 'cyber-neon', label: 'Cyber Neon', desc: 'Vibrant grid & laser feel' },
                       ] as const).map((theme) => {
                         const isActive = settings.timeSectionTheme === theme.id;
                         return (
                           <button
                             type="button"
                             key={theme.id}
                             onClick={(e) => { e.stopPropagation(); handleSettingsChange({ ...settings, timeSectionTheme: theme.id }); }}
                             className={`p-3 rounded-xl border-2 transition-all text-left ${
                               isActive
                                 ? 'bg-purple-500/15 border-purple-500/50'
                                 : 'bg-white/[0.03] border-white/[0.06] hover:border-white/[0.15]'
                             }`}
                           >
                             <span className={`text-xs font-semibold block ${isActive ? 'text-purple-300' : 'text-gray-200'}`}>{theme.label}</span>
                             <span className="text-[10px] text-gray-500">{theme.desc}</span>
                           </button>
                         );
                       })}
                    </div>
                  </SectionCard>

                  {/* Max Tabs Per Row */}
                  <SectionCard title="Max Tabs Per Row" icon={Grid3X3}>
                    <div className="flex items-center gap-3">
                      {([5, 6, 8, 10] as const).map((count) => {
                        const isActive = (settings.maxTabsPerRow || 6) === count;
                        return (
                          <button
                            type="button"
                            key={count}
                            onClick={(e) => { e.stopPropagation(); handleSettingsChange({ ...settings, maxTabsPerRow: count }); }}
                            className={`flex-1 py-2 rounded-xl border-2 text-sm font-medium transition-all ${
                              isActive
                                ? 'bg-purple-500/15 border-purple-500/50 text-purple-300'
                                : 'bg-white/[0.03] border-white/[0.06] text-gray-500 hover:border-white/[0.15]'
                            }`}
                          >
                            {count}
                          </button>
                        );
                      })}
                    </div>
                  </SectionCard>

                  {/* Reset */}
                  <Button
                    onClick={() => handleSettingsChange({
                      ...settings,
                      fontFamily: 'Inter',
                      uiDensity: 'comfortable',
                      animationSpeed: 'normal',
                      showParticles: true,
                      maxTabsPerRow: 6,
                      timeSectionTheme: 'modern-glow',
                    })}
                    variant="outline"
                    className="w-full rounded-xl bg-white/5 border-white/10 text-gray-300 hover:bg-white/10"
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Reset All Appearance Settings
                  </Button>
                </>
              )}

              {/* ══════════════════════════════════════════════════
                  AI TAB
                  ══════════════════════════════════════════════════ */}
              {currentTab === 'ai' && (
                <>
                  <SectionCard title="AI Assistant" icon={Bot}>
                    <div>
                      <Label className="text-gray-200 mb-2 flex items-center gap-2 text-sm">
                        <Bot className="w-4 h-4" />
                        Google Gemini API Key
                      </Label>
                      <Input
                        type="password"
                        value={settings.geminiApiKey}
                        onChange={(e) => handleSettingsChange({ ...settings, geminiApiKey: e.target.value })}
                        placeholder="Enter your Gemini 1.5 API Key..."
                        className="bg-white/5 border-white/10 text-white font-mono"
                      />
                      <p className="text-xs text-gray-500 mt-2">
                        Your key is stored locally and never sent anywhere except directly to Google's API to power your AI Assistant.
                        You can get a free key from{' '}
                        <a
                          href="https://aistudio.google.com/app/apikey"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-purple-400 hover:text-purple-300 underline underline-offset-2"
                        >
                          Google AI Studio
                        </a>.
                      </p>
                    </div>
                  </SectionCard>

                  <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20">
                    <div className="flex items-center gap-2 mb-2">
                      <Bot className="w-4 h-4 text-purple-400" />
                      <h3 className="text-sm font-semibold text-purple-300">How it works</h3>
                    </div>
                    <ul className="text-xs text-gray-400 space-y-1.5">
                      <li>• Click the <strong className="text-gray-300">AI chat bubble</strong> in the bottom-right corner</li>
                      <li>• Ask questions, get summaries, or brainstorm ideas</li>
                      <li>• Powered by Google Gemini 1.5 — fast & intelligent</li>
                      <li>• All conversations stay local to your browser</li>
                    </ul>
                  </div>
                </>
              )}

              {/* ══════════════════════════════════════════════════
                  ADVANCED TAB
                  ══════════════════════════════════════════════════ */}
              {currentTab === 'advanced' && (
                <>
                  <SectionCard>
                    <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-400/20">
                      <h3 className="font-semibold mb-3 text-blue-300 text-sm">⌨️ Keyboard Shortcuts</h3>
                      <div className="space-y-2 text-xs text-gray-300">
                        <div className="flex justify-between items-center">
                          <span>New Tab</span>
                          <kbd className="px-2 py-0.5 rounded bg-white/5 border border-white/10 font-mono text-gray-400">Ctrl + T</kbd>
                        </div>
                        <div className="flex justify-between items-center">
                          <span>Close Tab</span>
                          <kbd className="px-2 py-0.5 rounded bg-white/5 border border-white/10 font-mono text-gray-400">Ctrl + W</kbd>
                        </div>
                        <div className="flex justify-between items-center">
                          <span>Focus Address Bar</span>
                          <kbd className="px-2 py-0.5 rounded bg-white/5 border border-white/10 font-mono text-gray-400">Ctrl + L</kbd>
                        </div>
                        <div className="flex justify-between items-center">
                          <span>New Workspace</span>
                          <kbd className="px-2 py-0.5 rounded bg-white/5 border border-white/10 font-mono text-gray-400">Ctrl + Shift + N</kbd>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-400/20">
                      <h3 className="font-semibold mb-2 text-purple-300 text-sm">🚀 About NetGlide</h3>
                      <p className="text-xs text-gray-300">
                        Version 1.0.0 — A futuristic browser experience with AI assistance, workspace management, and
                        customizable features.
                      </p>
                    </div>
                  </SectionCard>

                  {/* Tab Close Behavior */}
                  <SectionCard title="Tab Behavior" icon={Layers}>
                    <div>
                      <Label className="text-gray-200 mb-2 flex items-center gap-2 text-sm">
                        When closing a tab, switch to:
                      </Label>
                      <NativeSelect
                        value={settings.tabCloseAction || 'previous'}
                        onChange={(value) => handleSettingsChange({ ...settings, tabCloseAction: value })}
                        options={[
                          { value: 'previous', label: 'Previous Tab' },
                          { value: 'next', label: 'Next Tab' },
                          { value: 'first', label: 'First Tab' },
                          { value: 'last', label: 'Last Tab' },
                        ]}
                      />
                    </div>
                  </SectionCard>
                </>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export const SettingsPanel = React.memo(SettingsPanelInner);