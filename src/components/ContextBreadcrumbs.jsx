import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, FileText, MessageSquare, Calendar, Layers, X } from 'lucide-react';
import { useLumina } from '../context/LuminaContext';

const SOURCE_ICONS = {
  zenith: FileText,
  canvas: Layers,
  chat: MessageSquare,
  chronos: Calendar
};

export const ContextBreadcrumbs = ({ contexts = [] }) => {
  const { theme } = useLumina();

  if (!contexts || contexts.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="flex items-center gap-2 px-4 py-2 bg-[#0A0A0A]/90 backdrop-blur-xl border border-white/10 rounded-xl shadow-lg"
    >
      <div className={`p-1.5 rounded-lg ${theme.softBg}`}>
        <Brain size={12} className={theme.accentText} />
      </div>
      
      <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
        Context Active:
      </span>

      <div className="flex items-center gap-1">
        <AnimatePresence>
          {contexts.slice(0, 3).map((ctx, index) => {
            const Icon = SOURCE_ICONS[ctx.source] || FileText;
            return (
              <motion.div
                key={`${ctx.source}-${index}`}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                className="flex items-center gap-1.5 px-2 py-1 bg-white/5 rounded-lg border border-white/10"
              >
                <Icon size={10} className={theme.accentText} />
                <span className="text-[9px] text-gray-400 max-w-[80px] truncate">
                  {ctx.metadata.filename || ctx.metadata.title || ctx.source}
                </span>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {contexts.length > 3 && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="px-2 py-1 bg-white/5 rounded-lg text-[9px] text-gray-500"
          >
            +{contexts.length - 3} more
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};