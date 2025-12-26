import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Command } from 'lucide-react';

export const CommandPaletteHint = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [hasBeenDismissed, setHasBeenDismissed] = useState(false);

  useEffect(() => {
    // Check if user has already seen the hint
    const dismissed = localStorage.getItem('commandPaletteHintDismissed');
    if (dismissed) {
      setHasBeenDismissed(true);
      return;
    }

    // Show hint after 3 seconds
    const showTimer = setTimeout(() => {
      setIsVisible(true);
    }, 3000);

    // Auto-hide after 10 seconds
    const hideTimer = setTimeout(() => {
      setIsVisible(false);
      localStorage.setItem('commandPaletteHintDismissed', 'true');
      setHasBeenDismissed(true);
    }, 13000);

    // Listen for command palette open
    const handleCommandPaletteOpen = () => {
      setIsVisible(false);
      localStorage.setItem('commandPaletteHintDismissed', 'true');
      setHasBeenDismissed(true);
    };

    window.addEventListener('commandPaletteOpened', handleCommandPaletteOpen);

    return () => {
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
      window.removeEventListener('commandPaletteOpened', handleCommandPaletteOpen);
    };
  }, []);

  if (hasBeenDismissed) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed top-6 left-1/2 -translate-x-1/2 z-[9996] pointer-events-none"
        >
          <div className="px-6 py-3 rounded-full bg-gradient-to-r from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 backdrop-blur-xl shadow-2xl">
            <div className="flex items-center gap-3">
              <Command size={16} className="text-indigo-400" />
              <span className="text-sm font-bold text-white">
                Press{' '}
                <kbd className="px-2 py-1 bg-white/10 rounded text-white font-mono text-xs">
                  ⌘K
                </kbd>{' '}
                to search everything
              </span>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CommandPaletteHint;