import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Settings,
  X,
  Search,
  Home,
  Shield,
  Eye,
  Bell,
  Download,
  Globe,
  Trash2,
  Type,
  Palette,
} from 'lucide-react';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Switch } from './ui/switch';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { ThemeSelector } from './ThemeSelector';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  settings: {
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
  };
  onSettingsChange: (settings: any) => void;
}

export function SettingsPanel({ isOpen, onClose, settings, onSettingsChange }: SettingsPanelProps) {
  const handleExportZip = () => {
    alert('Export functionality would bundle the project files into a ZIP. This is a demo implementation.');
    // In a real implementation, this would create and download a ZIP file
  };

  const handleClearData = () => {
    if (confirm('Are you sure you want to clear all browsing data? This cannot be undone.')) {
      localStorage.clear();
      window.location.reload();
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
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 300 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-2xl bg-gradient-to-br from-gray-900/98 to-gray-800/98 border-l border-purple-500/30 backdrop-blur-xl shadow-2xl z-50 overflow-y-auto"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <Settings className="w-6 h-6 text-purple-400" />
                  <h2 className="text-2xl">Settings</h2>
                </div>
                <Button onClick={onClose} variant="ghost" size="icon" className="hover:bg-white/10">
                  <X className="w-5 h-5" />
                </Button>
              </div>

              <Tabs defaultValue="general" className="w-full">
                <TabsList className="grid w-full grid-cols-4 bg-white/5 mb-6">
                  <TabsTrigger value="general">General</TabsTrigger>
                  <TabsTrigger value="privacy">Privacy</TabsTrigger>
                  <TabsTrigger value="appearance">Appearance</TabsTrigger>
                  <TabsTrigger value="advanced">Advanced</TabsTrigger>
                </TabsList>

                <TabsContent value="general" className="space-y-6">
                  <div className="p-6 rounded-2xl bg-white/5 border border-white/10 space-y-6">
                    <div>
                      <Label className="text-gray-200 mb-2 flex items-center gap-2">
                        <Search className="w-4 h-4" />
                        Default Search Engine
                      </Label>
                      <Select
                        value={settings.searchEngine}
                        onValueChange={(value) => onSettingsChange({ ...settings, searchEngine: value })}
                      >
                        <SelectTrigger className="bg-white/5 border-white/10 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-900 border-purple-500/30 text-white">
                          <SelectItem value="google">Google</SelectItem>
                          <SelectItem value="duckduckgo">DuckDuckGo</SelectItem>
                          <SelectItem value="bing">Bing</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-gray-200 mb-2 flex items-center gap-2">
                        <Home className="w-4 h-4" />
                        Homepage
                      </Label>
                      <Select
                        value={settings.homepage}
                        onValueChange={(value) => onSettingsChange({ ...settings, homepage: value })}
                      >
                        <SelectTrigger className="bg-white/5 border-white/10 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-900 border-purple-500/30 text-white">
                          <SelectItem value="default">Default (CozyTab Home)</SelectItem>
                          <SelectItem value="blank">Blank Page</SelectItem>
                          <SelectItem value="custom">Custom URL</SelectItem>
                        </SelectContent>
                      </Select>
                      {settings.homepage === 'custom' && (
                        <Input
                          value={settings.customHomepage}
                          onChange={(e) => onSettingsChange({ ...settings, customHomepage: e.target.value })}
                          placeholder="Enter custom homepage URL..."
                          className="mt-2 bg-white/5 border-white/10 text-white"
                        />
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <Label className="text-gray-200 flex items-center gap-2">
                        <Bell className="w-4 h-4" />
                        Enable Notifications
                      </Label>
                      <Switch
                        checked={settings.notifications}
                        onCheckedChange={(checked) => onSettingsChange({ ...settings, notifications: checked })}
                      />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="privacy" className="space-y-6">
                  <div className="p-6 rounded-2xl bg-white/5 border border-white/10 space-y-6">
                    <div className="flex items-center justify-between">
                      <Label className="text-gray-200 flex items-center gap-2">
                        <Shield className="w-4 h-4" />
                        Block Trackers
                      </Label>
                      <Switch
                        checked={settings.blockTrackers}
                        onCheckedChange={(checked) => onSettingsChange({ ...settings, blockTrackers: checked })}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label className="text-gray-200 flex items-center gap-2">
                        <Trash2 className="w-4 h-4" />
                        Clear Cache on Exit
                      </Label>
                      <Switch
                        checked={settings.clearCacheOnExit}
                        onCheckedChange={(checked) =>
                          onSettingsChange({ ...settings, clearCacheOnExit: checked })
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label className="text-gray-200 flex items-center gap-2">
                        <Globe className="w-4 h-4" />
                        VPN (Free Proxy)
                      </Label>
                      <Switch
                        checked={settings.vpnEnabled}
                        onCheckedChange={(checked) => onSettingsChange({ ...settings, vpnEnabled: checked })}
                      />
                    </div>
                    {settings.vpnEnabled && (
                      <p className="text-sm text-yellow-400">
                        Note: VPN feature is simulated. In production, integrate with a VPN service API.
                      </p>
                    )}

                    <Button onClick={handleClearData} variant="destructive" className="w-full">
                      <Trash2 className="w-4 h-4 mr-2" />
                      Clear All Browsing Data
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="appearance" className="space-y-6">
                  {/* Theme Selector */}
                  <ThemeSelector
                    currentThemeId={settings.theme || 'gx-neon'}
                    onThemeChange={(themeId) => onSettingsChange({ ...settings, theme: themeId })}
                  />

                  <div className="p-6 rounded-2xl bg-white/5 border border-white/10 space-y-6">
                    <div>
                      <Label className="text-gray-200 mb-2 flex items-center gap-2">
                        <Type className="w-4 h-4" />
                        Font Size
                      </Label>
                      <Select
                        value={settings.fontSize}
                        onValueChange={(value) => onSettingsChange({ ...settings, fontSize: value })}
                      >
                        <SelectTrigger className="bg-white/5 border-white/10 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-900 border-purple-500/30 text-white">
                          <SelectItem value="small">Small</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="large">Large</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-gray-200 mb-2 flex items-center gap-2">
                        <Palette className="w-4 h-4" />
                        Button Style
                      </Label>
                      <Select
                        value={settings.buttonStyle}
                        onValueChange={(value) => onSettingsChange({ ...settings, buttonStyle: value })}
                      >
                        <SelectTrigger className="bg-white/5 border-white/10 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-900 border-purple-500/30 text-white">
                          <SelectItem value="rounded">Rounded</SelectItem>
                          <SelectItem value="sharp">Sharp</SelectItem>
                          <SelectItem value="pill">Pill</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="advanced" className="space-y-6">
                  <div className="p-6 rounded-2xl bg-white/5 border border-white/10 space-y-4">
                    <Button onClick={handleExportZip} className="w-full bg-gradient-to-r from-purple-500 to-blue-500">
                      <Download className="w-4 h-4 mr-2" />
                      Export Project as ZIP
                    </Button>

                    <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-400/30">
                      <h3 className="font-semibold mb-2 text-blue-300">Keyboard Shortcuts</h3>
                      <div className="space-y-1 text-sm text-gray-300">
                        <p>• Ctrl/Cmd + T: New Tab</p>
                        <p>• Ctrl/Cmd + W: Close Tab</p>
                        <p>• Ctrl/Cmd + L: Focus Address Bar</p>
                        <p>• Ctrl/Cmd + Shift + N: New Workspace</p>
                      </div>
                    </div>

                    <div className="p-4 rounded-lg bg-purple-500/10 border border-purple-400/30">
                      <h3 className="font-semibold mb-2 text-purple-300">About CozyTab</h3>
                      <p className="text-sm text-gray-300">
                        Version 1.0.0 - A futuristic browser experience with AI assistance, workspace management, and
                        customizable features.
                      </p>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}