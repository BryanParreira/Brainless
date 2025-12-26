import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowRight, ArrowLeft, Check, Sparkles, Layout, PenTool, Calendar, MessageSquare, Command } from 'lucide-react';

const TOUR_STEPS = [
  {
    id: 'welcome',
    title: 'Welcome to Brainless',
    description: 'Your AI-powered workspace for thinking, creating, and organizing. Let\'s take a quick tour!',
    target: null,
    position: 'center',
    icon: Sparkles,
    action: null
  },
  {
    id: 'sidebar',
    title: 'Navigation Hub',
    description: 'Switch between Home, Chats, and Projects. Your command center for everything.',
    target: '[data-tour="sidebar"]',
    position: 'right',
    icon: MessageSquare,
    action: null
  },
  {
    id: 'command-bar',
    title: 'Command Bar',
    description: 'Quick access to all features. Switch views, create projects, and more from here.',
    target: '[data-tour="command-bar"]',
    position: 'bottom',
    icon: Command,
    action: null
  },
  {
    id: 'canvas',
    title: 'Canvas - Visual Thinking',
    description: 'Create mind maps, flowcharts, and visual connections. Your ideas come to life here.',
    target: '[data-tour="canvas-button"]',
    position: 'bottom',
    icon: Layout,
    highlight: 'canvas',
    action: 'navigate-canvas'
  },
  {
    id: 'zenith',
    title: 'Zenith - Creative Writing',
    description: 'Distraction-free writing with AI assistance. Perfect for drafting, note-taking, and long-form content.',
    target: '[data-tour="zenith-button"]',
    position: 'bottom',
    icon: PenTool,
    highlight: 'zenith',
    action: 'navigate-zenith'
  },
  {
    id: 'chronos',
    title: 'Chronos - Time Management',
    description: 'Plan your schedule, set deadlines, and manage events. Stay organized with AI-powered scheduling.',
    target: '[data-tour="chronos-button"]',
    position: 'bottom',
    icon: Calendar,
    highlight: 'chronos',
    action: 'navigate-chronos'
  },
  {
    id: 'command-palette',
    title: 'Command Palette',
    description: 'Press ⌘K (Ctrl+K on Windows) anytime to search everything. Your most powerful tool!',
    target: null,
    position: 'center',
    icon: Command,
    action: null,
    showHint: true
  },
  {
    id: 'complete',
    title: 'You\'re All Set!',
    description: 'Start creating, organizing, and thinking with Brainless. Remember: ⌘K is your friend.',
    target: null,
    position: 'center',
    icon: Check,
    action: null
  }
];

const Spotlight = ({ target, onClick }) => {
  const [rect, setRect] = useState(null);

  useEffect(() => {
    if (!target) return;
    const element = document.querySelector(target);
    if (!element) return;

    const updateRect = () => {
      const r = element.getBoundingClientRect();
      setRect({
        top: r.top - 8,
        left: r.left - 8,
        width: r.width + 16,
        height: r.height + 16
      });
    };

    updateRect();
    window.addEventListener('resize', updateRect);
    return () => window.removeEventListener('resize', updateRect);
  }, [target]);

  if (!rect) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9998] pointer-events-none"
      onClick={onClick}
    >
      {/* Overlay with cutout */}
      <svg className="w-full h-full">
        <defs>
          <mask id="spotlight-mask">
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            <rect
              x={rect.left}
              y={rect.top}
              width={rect.width}
              height={rect.height}
              rx="16"
              fill="black"
            />
          </mask>
        </defs>
        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill="rgba(0, 0, 0, 0.7)"
          mask="url(#spotlight-mask)"
        />
      </svg>

      {/* Highlight border */}
      <motion.div
        className="absolute border-4 border-indigo-500 rounded-2xl pointer-events-none"
        style={{
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height
        }}
        animate={{
          boxShadow: [
            '0 0 0 0 rgba(99, 102, 241, 0.4)',
            '0 0 0 20px rgba(99, 102, 241, 0)',
            '0 0 0 0 rgba(99, 102, 241, 0)'
          ]
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut'
        }}
      />
    </motion.div>
  );
};

const TooltipCard = ({ step, position, onNext, onPrev, onSkip, isFirst, isLast, currentIndex, totalSteps }) => {
  const [tooltipStyle, setTooltipStyle] = useState({});

  useEffect(() => {
    if (step.position === 'center') {
      setTooltipStyle({
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)'
      });
      return;
    }

    if (!step.target) return;

    const element = document.querySelector(step.target);
    if (!element) return;

    const updatePosition = () => {
      const rect = element.getBoundingClientRect();
      const style = { position: 'fixed' };

      switch (step.position) {
        case 'right':
          style.left = rect.right + 20;
          style.top = rect.top + rect.height / 2;
          style.transform = 'translateY(-50%)';
          break;
        case 'left':
          style.right = window.innerWidth - rect.left + 20;
          style.top = rect.top + rect.height / 2;
          style.transform = 'translateY(-50%)';
          break;
        case 'bottom':
          style.left = rect.left + rect.width / 2;
          style.top = rect.bottom + 20;
          style.transform = 'translateX(-50%)';
          break;
        case 'top':
          style.left = rect.left + rect.width / 2;
          style.bottom = window.innerHeight - rect.top + 20;
          style.transform = 'translateX(-50%)';
          break;
        default:
          break;
      }

      setTooltipStyle(style);
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    return () => window.removeEventListener('resize', updatePosition);
  }, [step]);

  const Icon = step.icon;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: 10 }}
      className="z-[9999] pointer-events-auto"
      style={tooltipStyle}
    >
      <div className="w-[400px] bg-gradient-to-br from-[#0A0A0A] to-[#1A1A1A] border border-indigo-500/30 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-xl">
        {/* Header */}
        <div className="p-6 border-b border-white/10 bg-gradient-to-r from-indigo-500/10 to-purple-500/10">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg">
              <Icon size={24} className="text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-white mb-1">{step.title}</h3>
              <p className="text-sm text-gray-400 leading-relaxed">{step.description}</p>
            </div>
            <button
              onClick={onSkip}
              className="p-2 hover:bg-white/5 rounded-lg text-gray-500 hover:text-white transition-all"
              title="Skip tour"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Content */}
        {step.showHint && (
          <div className="p-6 bg-indigo-500/5 border-b border-white/5">
            <div className="flex items-center gap-3 px-4 py-3 bg-black/30 rounded-xl border border-indigo-500/20">
              <Command size={20} className="text-indigo-400" />
              <div className="flex-1">
                <p className="text-xs font-bold text-white mb-0.5">Try it now!</p>
                <p className="text-xs text-gray-500">Press <kbd className="px-2 py-1 bg-white/10 rounded text-white font-mono">⌘K</kbd> to open the command palette</p>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="p-4 flex items-center justify-between bg-black/20">
          <div className="flex gap-1">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all ${
                  i === currentIndex
                    ? 'w-6 bg-indigo-500'
                    : i < currentIndex
                    ? 'w-1.5 bg-indigo-500/50'
                    : 'w-1.5 bg-white/10'
                }`}
              />
            ))}
          </div>

          <div className="flex gap-2">
            {!isFirst && (
              <button
                onClick={onPrev}
                className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-sm font-bold text-gray-400 hover:text-white transition-all flex items-center gap-2"
              >
                <ArrowLeft size={14} />
                Back
              </button>
            )}
            <button
              onClick={onNext}
              className="px-4 py-2 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-sm font-bold text-white transition-all flex items-center gap-2 shadow-lg"
            >
              {isLast ? (
                <>
                  <Check size={14} />
                  Get Started
                </>
              ) : (
                <>
                  Next
                  <ArrowRight size={14} />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export const OnboardingTour = ({ isOpen, onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      setCurrentStep(0);
    }
  }, [isOpen]);

  const handleNext = () => {
    const step = TOUR_STEPS[currentStep];
    
    // Execute step action if any
    if (step.action) {
      if (step.action === 'navigate-canvas') {
        window.dispatchEvent(new CustomEvent('tour-navigate', { detail: { view: 'canvas' } }));
      } else if (step.action === 'navigate-zenith') {
        window.dispatchEvent(new CustomEvent('tour-navigate', { detail: { view: 'zenith' } }));
      } else if (step.action === 'navigate-chronos') {
        window.dispatchEvent(new CustomEvent('tour-navigate', { detail: { view: 'chronos' } }));
      }
    }

    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSkip = () => {
    handleComplete();
  };

  const handleComplete = () => {
    setIsVisible(false);
    setTimeout(() => {
      onComplete();
    }, 300);
  };

  if (!isVisible) return null;

  const step = TOUR_STEPS[currentStep];

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {step.target && (
            <Spotlight target={step.target} onClick={handleSkip} />
          )}
          
          {step.position === 'center' && step.target === null && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[9998]"
              onClick={handleSkip}
            />
          )}

          <TooltipCard
            step={step}
            position={step.position}
            onNext={handleNext}
            onPrev={handlePrev}
            onSkip={handleSkip}
            isFirst={currentStep === 0}
            isLast={currentStep === TOUR_STEPS.length - 1}
            currentIndex={currentStep}
            totalSteps={TOUR_STEPS.length}
          />
        </>
      )}
    </AnimatePresence>
  );
};

export default OnboardingTour;