import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight, Calendar, MessageSquare, Layout, PenTool, Clock, Target, TrendingUp } from 'lucide-react';
import { useLumina } from '../context/LuminaContext';

const getSuggestions = (sessions, projects, calendarEvents, canvasNodes, theme) => {
  const suggestions = [];
  const now = new Date();

  // Check for upcoming deadlines
  const upcomingDeadlines = (calendarEvents || []).filter(e => {
    if (!e || !e.date || e.type !== 'deadline') return false;
    const eventDate = new Date(e.date);
    const daysUntil = Math.ceil((eventDate - now) / (1000 * 60 * 60 * 24));
    return daysUntil >= 0 && daysUntil <= 3;
  });

  if (upcomingDeadlines.length > 0) {
    const deadline = upcomingDeadlines[0];
    suggestions.push({
      id: 'upcoming-deadline',
      icon: Target,
      title: 'Deadline Approaching',
      description: `"${deadline.title}" is due soon. Plan your work in Canvas or schedule tasks in Chronos.`,
      action: 'chronos',
      actionLabel: 'View Schedule',
      priority: 'high',
      gradient: 'from-red-500/20 to-orange-500/20',
      border: 'border-red-500/30'
    });
  }

  // Check for inactive projects
  const activeProjects = (projects || []).filter(p => p && p.files && p.files.length > 0);
  if (activeProjects.length > 0 && activeProjects.length < 3) {
    suggestions.push({
      id: 'work-on-project',
      icon: TrendingUp,
      title: 'Continue Your Work',
      description: `You have ${activeProjects.length} active project${activeProjects.length !== 1 ? 's' : ''}. Keep the momentum going!`,
      action: 'dashboard',
      actionLabel: 'Open Projects',
      priority: 'medium',
      gradient: 'from-blue-500/20 to-cyan-500/20',
      border: 'border-blue-500/30'
    });
  }

  // Check recent chat activity
  const recentChats = (sessions || []).filter(s => {
    if (!s || !s.date) return false;
    const sessionDate = new Date(s.date);
    const daysSince = Math.ceil((now - sessionDate) / (1000 * 60 * 60 * 24));
    return daysSince <= 1;
  });

  if (recentChats.length > 0) {
    suggestions.push({
      id: 'review-insights',
      icon: MessageSquare,
      title: 'Review Recent Insights',
      description: `You had ${recentChats.length} conversation${recentChats.length !== 1 ? 's' : ''} recently. Capture key insights in Canvas or Zenith.`,
      action: 'chat',
      actionLabel: 'Open Chats',
      priority: 'low',
      gradient: 'from-green-500/20 to-emerald-500/20',
      border: 'border-green-500/30'
    });
  }

  // Check for empty canvas
  if (!canvasNodes || canvasNodes.length === 0) {
    suggestions.push({
      id: 'start-canvas',
      icon: Layout,
      title: 'Visualize Your Ideas',
      description: 'Start mapping your thoughts in Canvas. Create mind maps, flowcharts, or brainstorm new concepts.',
      action: 'canvas',
      actionLabel: 'Open Canvas',
      priority: 'medium',
      gradient: 'from-purple-500/20 to-pink-500/20',
      border: 'border-purple-500/30'
    });
  }

  // Check for today's events
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const todayEvents = (calendarEvents || []).filter(e => e && e.date === todayStr);
  
  if (todayEvents.length === 0) {
    suggestions.push({
      id: 'plan-day',
      icon: Calendar,
      title: 'Plan Your Day',
      description: 'No events scheduled for today. Add tasks, meetings, or goals to stay organized.',
      action: 'chronos',
      actionLabel: 'Open Calendar',
      priority: 'low',
      gradient: 'from-amber-500/20 to-orange-500/20',
      border: 'border-amber-500/30'
    });
  }

  // Default suggestion if nothing else applies
  if (suggestions.length === 0) {
    suggestions.push({
      id: 'explore-features',
      icon: Sparkles,
      title: 'Explore More Features',
      description: 'Try out Canvas for visual thinking, Zenith for writing, or Chronos for planning.',
      action: 'canvas',
      actionLabel: 'Get Started',
      priority: 'low',
      gradient: 'from-indigo-500/20 to-purple-500/20',
      border: 'border-indigo-500/30'
    });
  }

  // Sort by priority
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  return suggestions.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]).slice(0, 2);
};

export const SmartSuggestions = () => {
  const { sessions, projects, calendarEvents, canvasNodes, setCurrentView, theme } = useLumina();

  const suggestions = useMemo(
    () => getSuggestions(sessions, projects, calendarEvents, canvasNodes, theme),
    [sessions, projects, calendarEvents, canvasNodes, theme]
  );

  const handleAction = (action) => {
    if (setCurrentView) {
      setCurrentView(action);
    }
  };

  return (
    <div className="space-y-3">
      {suggestions.map((suggestion, index) => {
        const Icon = suggestion.icon;
        return (
          <motion.div
            key={suggestion.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`group p-5 rounded-2xl bg-gradient-to-br ${suggestion.gradient} border ${suggestion.border} hover:border-white/20 transition-all cursor-pointer backdrop-blur-sm`}
            onClick={() => handleAction(suggestion.action)}
          >
            <div className="flex items-start gap-4">
              <div className={`p-3 rounded-xl bg-gradient-to-br ${theme.gradient} shadow-lg shrink-0`}>
                <Icon size={20} className="text-white" />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="text-sm font-bold text-white">{suggestion.title}</h4>
                  {suggestion.priority === 'high' && (
                    <span className="px-2 py-0.5 rounded-full bg-red-500/20 border border-red-500/30 text-[10px] font-bold text-red-400">
                      URGENT
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-400 leading-relaxed mb-3">
                  {suggestion.description}
                </p>
                
                <button className="flex items-center gap-2 text-xs font-bold text-indigo-400 group-hover:text-indigo-300 transition-all">
                  {suggestion.actionLabel}
                  <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};

export default SmartSuggestions;