import { motion, AnimatePresence } from 'framer-motion';
import { Settings, LogOut, Shield, HelpCircle, UserCircle2 } from 'lucide-react';
import { Button } from './ui/button';

interface ProfileDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  profession: string;
  userName?: string;
  avatarUrl?: string;
  onOpenSettings: () => void;
}

export function ProfileDropdown({ isOpen, onClose, profession, userName, avatarUrl, onOpenSettings }: ProfileDropdownProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Invisible backdrop to detect clicks outside */}
          <div 
            className="fixed inset-0 z-[55]" 
            onClick={onClose}
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ type: "spring", duration: 0.4, bounce: 0 }}
            className="fixed top-20 right-6 z-[60] w-80 bg-gradient-to-br from-gray-900/95 to-black/95 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col"
          >
            {/* Top Google-style unified profile area */}
            <div className="p-6 flex flex-col items-center justify-center border-b border-white/5 bg-white/5 relative">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 shadow-lg shadow-purple-500/20 mb-4 flex items-center justify-center p-0.5 relative group overflow-hidden">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Profile Avatar" className="w-full h-full object-cover rounded-full" />
                ) : (
                  <div className="w-full h-full bg-black/40 rounded-full flex items-center justify-center group-hover:bg-black/20 transition-colors">
                    <UserCircle2 className="w-12 h-12 text-white/90" strokeWidth={1.5} />
                  </div>
                )}
              </div>
              
              <h3 className="text-xl font-medium text-white mb-1">
                Hi, {userName || 'Explorer'}
              </h3>
              
              <p className="text-sm text-gray-400 capitalize mb-5 px-3 py-1 bg-black/30 rounded-full border border-white/5">
                {profession ? profession : 'Standard Profile'}
              </p>
              
              <Button 
                onClick={() => {
                  onClose();
                  onOpenSettings();
                }}
                variant="outline" 
                className="w-full rounded-2xl border-white/10 hover:bg-white/10 text-white font-medium"
              >
                Manage your NetGlide Profile
              </Button>
            </div>

            {/* Quick Actions List */}
            <div className="p-3 bg-black/20">
              <Button 
                variant="ghost" 
                className="w-full justify-start text-gray-300 hover:text-white hover:bg-white/10 rounded-xl mb-1 py-6"
                onClick={() => {
                  onClose();
                  onOpenSettings();
                }}
              >
                <Settings className="w-5 h-5 mr-3 text-gray-400" />
                Browser Settings
              </Button>
              
              <Button 
                variant="ghost" 
                className="w-full justify-start text-gray-300 hover:text-white hover:bg-white/10 rounded-xl mb-1 py-6"
                onClick={() => {
                  onClose();
                  onOpenSettings(); // Instruct user to go to the privacy tab
                }}
              >
                <Shield className="w-5 h-5 mr-3 text-gray-400" />
                Privacy & Security
              </Button>

              <Button 
                variant="ghost" 
                className="w-full justify-start text-gray-300 hover:text-white hover:bg-white/10 rounded-xl py-6"
              >
                <HelpCircle className="w-5 h-5 mr-3 text-gray-400" />
                Help & Support
              </Button>
            </div>

            {/* Footer Sign out / Clear Data */}
            <div className="p-3 border-t border-white/5 bg-black/40">
              <Button 
                variant="ghost" 
                className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl py-6"
                onClick={() => {
                  if (confirm('Sign out and clear all browsing data? This cannot be undone.')) {
                    localStorage.clear();
                    window.location.reload();
                  }
                }}
              >
                <LogOut className="w-5 h-5 mr-3" />
                Sign out of NetGlide
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
