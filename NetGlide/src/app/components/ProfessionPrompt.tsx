import { useState } from 'react';
import { motion } from 'motion/react';
import { Briefcase, GraduationCap, TrendingUp, Scissors, Building, Users, Landmark, Scale, Pencil } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';

interface ProfessionPromptProps {
  onSelect: (profession: string) => void;
}

const professions = [
  { id: 'student', name: 'Student', icon: GraduationCap },
  { id: 'finance', name: 'Finance Professional', icon: TrendingUp },
  { id: 'fashion', name: 'Fashion Industry', icon: Scissors },
  { id: 'business', name: 'Business Owner', icon: Building },
  { id: 'consultant', name: 'Consultant', icon: Users },
  { id: 'tech', name: 'Tech Developer', icon: Briefcase },
  { id: 'government', name: 'Government Employee', icon: Landmark },
  { id: 'policy', name: 'Policy Maker', icon: Scale },
];

export function ProfessionPrompt({ onSelect }: ProfessionPromptProps) {
  const [showCustom, setShowCustom] = useState(false);
  const [customValue, setCustomValue] = useState('');

  const handleCustomSubmit = () => {
    if (customValue.trim()) {
      onSelect(customValue.trim());
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-3xl mx-4 p-8 rounded-3xl bg-gradient-to-br from-purple-900/40 to-blue-900/40 border border-purple-500/30 backdrop-blur-xl shadow-2xl"
      >
        <div className="text-center mb-8">
          <h2 className="text-3xl mb-2 bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
            Welcome to CozyTab
          </h2>
          <p className="text-gray-300">Customize your experience by selecting your profession</p>
        </div>

        {!showCustom ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {professions.map((prof) => (
              <motion.button
                key={prof.id}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onSelect(prof.id)}
                className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-purple-400/50 transition-all flex flex-col items-center gap-3 group"
              >
                <prof.icon className="w-8 h-8 text-purple-400 group-hover:text-purple-300" />
                <span className="text-sm text-center text-gray-200">{prof.name}</span>
              </motion.button>
            ))}
          </div>
        ) : (
          <div className="mb-6">
            <Input
              value={customValue}
              onChange={(e) => setCustomValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCustomSubmit()}
              placeholder="Enter your profession..."
              className="bg-white/5 border-white/10 text-white placeholder:text-gray-400"
              autoFocus
            />
          </div>
        )}

        <div className="flex gap-3 justify-center">
          {!showCustom ? (
            <Button
              onClick={() => setShowCustom(true)}
              variant="outline"
              className="bg-white/5 border-white/20 text-white hover:bg-white/10"
            >
              <Pencil className="w-4 h-4 mr-2" />
              Custom
            </Button>
          ) : (
            <>
              <Button
                onClick={() => setShowCustom(false)}
                variant="outline"
                className="bg-white/5 border-white/20 text-white hover:bg-white/10"
              >
                Back
              </Button>
              <Button
                onClick={handleCustomSubmit}
                className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
              >
                Continue
              </Button>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
