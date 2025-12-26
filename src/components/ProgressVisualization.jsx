import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Activity, Calendar, MessageSquare, Layout, PenTool } from 'lucide-react';
import { useLumina } from '../context/LuminaContext';

const getWeeklyData = (sessions, canvasNodes, calendarEvents) => {
  const now = new Date();
  const weekData = Array(7).fill(0).map((_, i) => {
    const date = new Date(now);
    date.setDate(date.getDate() - (6 - i));
    return {
      date: date.toLocaleDateString('en-US', { weekday: 'short' }),
      chats: 0,
      canvas: 0,
      events: 0,
      total: 0
    };
  });

  // Count chats per day
  (sessions || []).forEach(session => {
    if (!session || !session.date) return;
    try {
      const sessionDate = new Date(session.date);
      const daysDiff = Math.floor((now - sessionDate) / (1000 * 60 * 60 * 24));
      if (daysDiff >= 0 && daysDiff < 7) {
        const index = 6 - daysDiff;
        if (weekData[index]) {
          weekData[index].chats += 1;
          weekData[index].total += 1;
        }
      }
    } catch (e) {
      // Invalid date
    }
  });

  // Count canvas nodes per day (assuming creation date)
  (canvasNodes || []).forEach(node => {
    if (!node || !node.id) return;
    // Use node ID timestamp if available
    try {
      const timestamp = parseInt(node.id);
      if (!isNaN(timestamp)) {
        const nodeDate = new Date(timestamp);
        const daysDiff = Math.floor((now - nodeDate) / (1000 * 60 * 60 * 24));
        if (daysDiff >= 0 && daysDiff < 7) {
          const index = 6 - daysDiff;
          if (weekData[index]) {
            weekData[index].canvas += 1;
            weekData[index].total += 1;
          }
        }
      }
    } catch (e) {
      // Invalid ID
    }
  });

  // Count events per day
  (calendarEvents || []).forEach(event => {
    if (!event || !event.date) return;
    try {
      const eventDate = new Date(event.date);
      const daysDiff = Math.floor((now - eventDate) / (1000 * 60 * 60 * 24));
      if (daysDiff >= 0 && daysDiff < 7) {
        const index = 6 - daysDiff;
        if (weekData[index]) {
          weekData[index].events += 1;
          weekData[index].total += 1;
        }
      }
    } catch (e) {
      // Invalid date
    }
  });

  return weekData;
};

const getWeeklyStats = (weekData) => {
  const thisWeekTotal = weekData.reduce((sum, day) => sum + day.total, 0);
  
  // Mock last week data (in real app, would be stored)
  const lastWeekTotal = Math.floor(thisWeekTotal * (0.7 + Math.random() * 0.6));
  
  const change = thisWeekTotal - lastWeekTotal;
  const percentChange = lastWeekTotal > 0 ? ((change / lastWeekTotal) * 100).toFixed(0) : 0;
  
  return {
    thisWeek: thisWeekTotal,
    lastWeek: lastWeekTotal,
    change,
    percentChange,
    isPositive: change >= 0
  };
};

const BarChart = ({ data, maxValue }) => {
  return (
    <div className="flex items-end justify-between h-32 gap-2">
      {data.map((day, i) => {
        const height = maxValue > 0 ? (day.total / maxValue) * 100 : 0;
        
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-2">
            <div className="relative w-full flex-1 flex items-end">
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: `${height}%` }}
                transition={{ delay: i * 0.05, duration: 0.5, ease: 'easeOut' }}
                className="w-full bg-gradient-to-t from-indigo-600 to-purple-600 rounded-t-lg relative group cursor-pointer"
              >
                {/* Tooltip */}
                {day.total > 0 && (
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    <div className="px-3 py-2 bg-black/90 rounded-lg text-xs font-bold text-white whitespace-nowrap shadow-xl">
                      <div className="flex flex-col gap-1">
                        {day.chats > 0 && (
                          <div className="flex items-center gap-2">
                            <MessageSquare size={12} className="text-blue-400" />
                            <span>{day.chats} chat{day.chats !== 1 ? 's' : ''}</span>
                          </div>
                        )}
                        {day.canvas > 0 && (
                          <div className="flex items-center gap-2">
                            <Layout size={12} className="text-purple-400" />
                            <span>{day.canvas} node{day.canvas !== 1 ? 's' : ''}</span>
                          </div>
                        )}
                        {day.events > 0 && (
                          <div className="flex items-center gap-2">
                            <Calendar size={12} className="text-green-400" />
                            <span>{day.events} event{day.events !== 1 ? 's' : ''}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            </div>
            <div className="text-[10px] text-gray-600 font-bold">
              {day.date}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export const ProgressVisualization = () => {
  const { sessions, canvasNodes, calendarEvents, theme } = useLumina();

  const weekData = useMemo(
    () => getWeeklyData(sessions, canvasNodes, calendarEvents),
    [sessions, canvasNodes, calendarEvents]
  );

  const stats = useMemo(
    () => getWeeklyStats(weekData),
    [weekData]
  );

  const maxValue = Math.max(...weekData.map(d => d.total), 1);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-white/10 overflow-hidden bg-gradient-to-br from-[#0A0A0A] to-[#0C0C0C] backdrop-blur-xl shadow-2xl"
    >
      {/* Header */}
      <div className="p-6 border-b border-white/10 bg-gradient-to-r from-white/5 to-transparent">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
              <Activity size={18} className="text-indigo-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-widest">Weekly Activity</h3>
              <p className="text-[10px] text-gray-600 font-mono mt-0.5">Last 7 days</p>
            </div>
          </div>

          {/* Trend Indicator */}
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${
            stats.isPositive 
              ? 'bg-green-500/10 border border-green-500/20' 
              : 'bg-red-500/10 border border-red-500/20'
          }`}>
            {stats.isPositive ? (
              <TrendingUp size={14} className="text-green-400" />
            ) : (
              <TrendingDown size={14} className="text-red-400" />
            )}
            <span className={`text-xs font-bold ${
              stats.isPositive ? 'text-green-400' : 'text-red-400'
            }`}>
              {stats.isPositive ? '+' : ''}{stats.percentChange}%
            </span>
          </div>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-white mb-1">
              {stats.thisWeek}
            </div>
            <div className="text-[10px] text-gray-600 uppercase tracking-wider">
              This Week
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-600 mb-1">
              {stats.lastWeek}
            </div>
            <div className="text-[10px] text-gray-600 uppercase tracking-wider">
              Last Week
            </div>
          </div>
          <div className="text-center">
            <div className={`text-2xl font-bold mb-1 ${
              stats.isPositive ? 'text-green-400' : 'text-red-400'
            }`}>
              {stats.isPositive ? '+' : ''}{stats.change}
            </div>
            <div className="text-[10px] text-gray-600 uppercase tracking-wider">
              Change
            </div>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="p-6">
        <BarChart data={weekData} maxValue={maxValue} />
      </div>

      {/* Activity Breakdown */}
      <div className="p-6 border-t border-white/10 bg-black/20">
        <div className="grid grid-cols-3 gap-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
            <span className="text-xs text-gray-400">Chats</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-purple-500"></div>
            <span className="text-xs text-gray-400">Canvas</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500"></div>
            <span className="text-xs text-gray-400">Events</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ProgressVisualization;