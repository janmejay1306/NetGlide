import { useState } from 'react';
import { motion } from 'motion/react';
import { Check, Sparkles } from 'lucide-react';
import { THEMES, Theme, applyTheme } from '../utils/themes';
import { Button } from './ui/button';

interface ThemeSelectorProps {
  currentThemeId: string;
  onThemeChange: (themeId: string) => void;
}

export function ThemeSelector({ currentThemeId, onThemeChange }: ThemeSelectorProps) {
  const [previewThemeId, setPreviewThemeId] = useState(currentThemeId);

  const handlePreview = (theme: Theme) => {
    setPreviewThemeId(theme.id);
    applyTheme(theme);
  };

  const handleSave = () => {
    onThemeChange(previewThemeId);
  };

  const handleReset = () => {
    const currentTheme = THEMES.find((t) => t.id === currentThemeId) || THEMES[0];
    setPreviewThemeId(currentThemeId);
    applyTheme(currentTheme);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-purple-400" />
            Gaming Themes
          </h3>
          <p className="text-sm text-gray-400 mt-1">
            Choose your perfect gaming aesthetic
          </p>
        </div>
        
        {previewThemeId !== currentThemeId && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex gap-2"
          >
            <Button
              onClick={handleReset}
              variant="outline"
              size="sm"
              className="bg-white/5 border-white/20 text-white hover:bg-white/10"
            >
              Reset
            </Button>
            <Button
              onClick={handleSave}
              size="sm"
              className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white shadow-lg shadow-purple-500/30"
            >
              <Check className="w-4 h-4 mr-2" />
              Save & Apply
            </Button>
          </motion.div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {THEMES.map((theme) => {
          const isSelected = previewThemeId === theme.id;
          const isCurrent = currentThemeId === theme.id;
          
          return (
            <motion.div
              key={theme.id}
              whileHover={{ scale: 1.02, y: -4 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handlePreview(theme)}
              className="cursor-pointer relative rounded-2xl backdrop-blur-xl border-2 overflow-hidden transition-all"
              style={{
                background: theme.colors.cardBg,
                borderColor: isSelected ? theme.colors.primary : theme.colors.border,
                boxShadow: isSelected 
                  ? `0 0 30px ${theme.colors.glow}, 0 10px 40px rgba(0, 0, 0, 0.3)`
                  : '0 4px 20px rgba(0, 0, 0, 0.2)',
              }}
            >
              {/* Selected Indicator */}
              {isSelected && (
                <motion.div
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="absolute top-3 right-3 z-10 rounded-full p-2"
                  style={{
                    background: theme.colors.primary,
                    boxShadow: `0 0 20px ${theme.colors.glow}`,
                  }}
                >
                  <Check className="w-4 h-4 text-white" />
                </motion.div>
              )}

              {/* Current Badge */}
              {isCurrent && !isSelected && (
                <div 
                  className="absolute top-3 right-3 z-10 px-2 py-1 rounded-full text-xs font-bold"
                  style={{
                    background: theme.colors.primary,
                    color: 'white',
                  }}
                >
                  Current
                </div>
              )}

              {/* Theme Preview */}
              <div className="p-4">
                {/* Gradient Preview Bar */}
                <div 
                  className="h-24 rounded-xl mb-3 relative overflow-hidden"
                  style={{
                    background: `linear-gradient(135deg, ${theme.colors.backgroundGradientFrom}, ${theme.colors.backgroundGradientTo})`,
                  }}
                >
                  {/* Particle preview */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <motion.div
                      animate={{ 
                        scale: [1, 1.2, 1],
                        opacity: [0.3, 0.6, 0.3],
                      }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="w-16 h-16 rounded-full"
                      style={{
                        background: `radial-gradient(circle, ${theme.particleColor}, transparent)`,
                      }}
                    />
                  </div>
                </div>

                {/* Theme Info */}
                <h4 
                  className="text-lg font-bold mb-1"
                  style={{ color: theme.colors.text }}
                >
                  {theme.name}
                </h4>
                <p 
                  className="text-xs mb-4"
                  style={{ color: theme.colors.textSecondary }}
                >
                  {theme.description}
                </p>

                {/* Color Palette */}
                <div className="flex gap-2 mb-3">
                  <div 
                    className="flex-1 h-8 rounded-lg border"
                    style={{ 
                      background: theme.colors.primary,
                      borderColor: theme.colors.border,
                      boxShadow: `0 0 10px ${theme.colors.glow}`,
                    }}
                    title="Primary"
                  />
                  <div 
                    className="flex-1 h-8 rounded-lg border"
                    style={{ 
                      background: theme.colors.secondary,
                      borderColor: theme.colors.border,
                    }}
                    title="Secondary"
                  />
                  <div 
                    className="flex-1 h-8 rounded-lg border"
                    style={{ 
                      background: theme.colors.accent,
                      borderColor: theme.colors.border,
                    }}
                    title="Accent"
                  />
                </div>

                {/* Button Preview */}
                <div
                  className="w-full py-2 rounded-lg text-sm font-medium text-center transition-all"
                  style={{
                    background: `linear-gradient(to right, ${theme.colors.primary}, ${theme.colors.secondary})`,
                    color: theme.colors.text,
                    boxShadow: isSelected ? `0 0 20px ${theme.colors.glow}` : 'none',
                  }}
                >
                  {isSelected ? 'Selected' : 'Preview Theme'}
                </div>
              </div>

              {/* Glow effect on hover */}
              <motion.div
                className="absolute inset-0 pointer-events-none rounded-2xl"
                initial={{ opacity: 0 }}
                whileHover={{ opacity: 1 }}
                style={{
                  background: `radial-gradient(circle at 50% 50%, ${theme.colors.glow}, transparent 70%)`,
                }}
              />
            </motion.div>
          );
        })}
      </div>

      {/* Info Box */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-5 rounded-2xl bg-blue-500/10 border border-blue-400/20"
      >
        <p className="text-sm text-blue-300">
          <span className="text-xl">💡</span> <strong>Pro Tip:</strong> Click any theme to preview it instantly. 
          Theme changes apply with smooth transitions and neon glow effects. Your selection saves automatically across sessions!
        </p>
      </motion.div>
    </div>
  );
}
