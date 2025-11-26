import React, { useState, useCallback, useMemo } from 'react';
import { useLumina } from '../context/LuminaContext';
import { Calendar, Plus, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Memoized event color function
const getEventColor = (type, isDev) => {
  if (isDev) {
    if (type === 'release') return 'bg-rose-500/20 text-rose-300 border-rose-500/30 border';
    if (type === 'task') return 'bg-orange-500/20 text-orange-300 border-orange-500/30 border';
    return 'bg-gray-800 text-gray-400 border-gray-700 border';
  }
  if (type === 'exam') return 'bg-red-500/20 text-red-300 border-red-500/30 border';
  if (type === 'study') return 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30 border';
  return 'bg-blue-500/20 text-blue-300 border-blue-500/30 border';
};

// Calendar utility functions memoized
const getDaysInMonth = (date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
const getFirstDayOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();
const formatDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const CalendarDay = React.memo(({ day, dateStr, dayEvents, isToday, theme }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    className={`rounded-2xl p-3 border transition-all ${
      isToday ? `bg-white/5 ${theme.primaryBorder}` : 'bg-[#0A0A0A] border-white/5 hover:border-white/10'
    }`}
  >
    <div className={`text-sm font-bold mb-2 ${isToday ? theme.accentText : 'text-gray-500'}`}>
      {day}
    </div>
    <div className="space-y-1 overflow-y-auto max-h-[80px] custom-scrollbar">
      {dayEvents.map(event => (
        <div
          key={event.id}
          className={`text-[10px] px-2 py-1 rounded truncate ${getEventColor(event.type, false)}`}
          title={event.title}
        >
          {event.title}
        </div>
      ))}
    </div>
  </motion.div>
));

CalendarDay.displayName = 'CalendarDay';

const EventModal = React.memo(
  ({ isOpen, isPlanning, newEventTitle, setNewEventTitle, newEventDate, setNewEventDate, planTopic, setPlanTopic, planDate, setPlanDate, onClose, onAdd, onGenerate, settings, theme, isLoading }) => {
    const handleKeyDown = useCallback(
      (e) => {
        if (e.key === 'Escape') onClose();
      },
      [onClose]
    );

    if (!isOpen) return null;

    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={onClose}
          onKeyDown={handleKeyDown}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
        >
          <motion.div
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.95 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-[#111] border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl"
          >
            <h3 id="modal-title" className="text-lg font-bold text-white mb-4">
              {isPlanning
                ? settings.developerMode
                  ? "Plan Sprint"
                  : "Generate Study Plan"
                : "Add Event"}
            </h3>

            {isPlanning ? (
              <div className="space-y-4 mb-6">
                <div>
                  <label className="text-xs text-gray-500 block mb-1">
                    {settings.developerMode ? "Feature / Milestone" : "Subject / Exam Topic"}
                  </label>
                  <input
                    value={planTopic}
                    onChange={(e) => setPlanTopic(e.target.value)}
                    className="w-full bg-black border border-white/10 rounded-lg p-2 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
                    autoFocus
                    placeholder="Enter topic..."
                    aria-label="Topic"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">
                    {settings.developerMode ? "Deadline" : "Exam Date"}
                  </label>
                  <input
                    type="date"
                    value={planDate}
                    onChange={(e) => setPlanDate(e.target.value)}
                    className="w-full bg-black border border-white/10 rounded-lg p-2 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
                    aria-label="Target date"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-4 mb-6">
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Title</label>
                  <input
                    value={newEventTitle}
                    onChange={(e) => setNewEventTitle(e.target.value)}
                    className="w-full bg-black border border-white/10 rounded-lg p-2 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
                    autoFocus
                    placeholder="Event title..."
                    aria-label="Event title"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Date</label>
                  <input
                    type="date"
                    value={newEventDate}
                    onChange={(e) => setNewEventDate(e.target.value)}
                    className="w-full bg-black border border-white/10 rounded-lg p-2 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
                    aria-label="Event date"
                  />
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2">
              <button
                onClick={onClose}
                className="px-4 py-2 text-xs text-gray-400 hover:text-white transition-colors font-medium"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                onClick={isPlanning ? onGenerate : onAdd}
                disabled={isLoading || (isPlanning ? !planTopic || !planDate : !newEventTitle || !newEventDate)}
                className={`px-4 py-2 rounded-lg text-xs font-bold text-white transition-all ${
                  isPlanning
                    ? `${theme.primaryBg} hover:opacity-90 disabled:opacity-50`
                    : 'bg-white text-black hover:bg-gray-200 disabled:bg-gray-700 disabled:cursor-not-allowed'
                }`}
              >
                {isLoading ? "Processing..." : isPlanning ? "Generate" : "Add"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  }
);

EventModal.displayName = 'EventModal';

export const Chronos = React.memo(() => {
  const { calendarEvents, addEvent, generateSchedule, theme, settings, isLoading } = useLumina();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPlanning, setIsPlanning] = useState(false);
  const [newEventTitle, setNewEventTitle] = useState("");
  const [newEventDate, setNewEventDate] = useState("");
  const [planTopic, setPlanTopic] = useState("");
  const [planDate, setPlanDate] = useState("");

  // Memoized calendar dimensions
  const daysInMonth = useMemo(() => getDaysInMonth(currentDate), [currentDate]);
  const firstDayOfMonth = useMemo(() => getFirstDayOfMonth(currentDate), [currentDate]);

  const changeMonth = useCallback((delta) => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() + delta);
      return newDate;
    });
  }, []);

  const handleAdd = useCallback(() => {
    if (newEventTitle && newEventDate) {
      addEvent(
        newEventTitle,
        newEventDate,
        settings.developerMode ? 'deadline' : 'assignment'
      );
      setIsModalOpen(false);
      setNewEventTitle("");
      setNewEventDate("");
    }
  }, [newEventTitle, newEventDate, addEvent, settings.developerMode]);

  const handleGenerate = useCallback(() => {
    if (planTopic && planDate) {
      generateSchedule(planTopic, planDate);
      setIsModalOpen(false);
      setPlanTopic("");
      setPlanDate("");
      setIsPlanning(false);
    }
  }, [planTopic, planDate, generateSchedule]);

  const openAddModal = useCallback(() => {
    setIsPlanning(false);
    setIsModalOpen(true);
  }, []);

  const openPlanModal = useCallback(() => {
    setIsPlanning(true);
    setIsModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    setNewEventTitle("");
    setNewEventDate("");
    setPlanTopic("");
    setPlanDate("");
    setIsPlanning(false);
  }, []);

  // Memoized calendar grid
  const calendarDays = useMemo(() => {
    const days = [];
    // Empty cells for days before month starts
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(null);
    }
    // Days in month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }
    return days;
  }, [daysInMonth, firstDayOfMonth]);

  const today = useMemo(() => new Date().toISOString().split('T')[0], []);

  const eventsByDate = useMemo(() => {
    return calendarEvents.reduce((acc, event) => {
      if (!acc[event.date]) acc[event.date] = [];
      acc[event.date].push(event);
      return acc;
    }, {});
  }, [calendarEvents]);

  return (
    <div className="flex-1 h-full overflow-y-auto custom-scrollbar p-8 bg-[#030304] relative">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-end justify-between border-b border-white/5 pb-6 mb-8">
          <div>
            <div
              className={`inline-flex items-center gap-2 px-2 py-1 rounded-md bg-white/5 border border-white/5 text-[10px] font-bold uppercase tracking-widest ${theme.accentText}`}
            >
              <Calendar size={10} /> {settings.developerMode ? "Sprint Roadmap" : "Study Planner"}
            </div>
            <h1 className="text-4xl font-bold text-white tracking-tight mt-2">
              {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
            </h1>
          </div>

          <div className="flex gap-2">
            <button
              onClick={openPlanModal}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white transition-all ${theme.primaryBg} hover:opacity-90 shadow-lg disabled:opacity-50`}
              disabled={isLoading}
              aria-label={settings.developerMode ? "Plan sprint" : "Plan study schedule"}
            >
              <Sparkles size={14} />
              {settings.developerMode ? "AI Sprint Plan" : "AI Study Plan"}
            </button>

            <button
              onClick={openAddModal}
              className="flex items-center gap-2 px-4 py-2 bg-[#111] hover:bg-[#1a1a1a] border border-white/10 rounded-xl text-xs font-medium text-gray-300 hover:text-white transition-all"
              aria-label="Add event"
            >
              <Plus size={14} /> Add Event
            </button>

            <div className="flex bg-[#111] rounded-xl border border-white/10">
              <button
                onClick={() => changeMonth(-1)}
                className="px-3 py-2 hover:bg-white/5 text-gray-400 hover:text-white transition-colors"
                aria-label="Previous month"
              >
                <ChevronLeft size={16} />
              </button>
              <div className="w-px bg-white/5"></div>
              <button
                onClick={() => changeMonth(1)}
                className="px-3 py-2 hover:bg-white/5 text-gray-400 hover:text-white transition-colors"
                aria-label="Next month"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-4 mb-4 text-center">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-4 auto-rows-[120px]">
          {calendarDays.map((day, index) => {
            if (day === null) {
              return <div key={`empty-${index}`} className="bg-transparent" />;
            }

            const dateStr = formatDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), day));
            const dayEvents = eventsByDate[dateStr] || [];
            const isToday = today === dateStr;

            return (
              <CalendarDay
                key={`day-${day}`}
                day={day}
                dateStr={dateStr}
                dayEvents={dayEvents}
                isToday={isToday}
                theme={theme}
              />
            );
          })}
        </div>
      </div>

      <EventModal
        isOpen={isModalOpen}
        isPlanning={isPlanning}
        newEventTitle={newEventTitle}
        setNewEventTitle={setNewEventTitle}
        newEventDate={newEventDate}
        setNewEventDate={setNewEventDate}
        planTopic={planTopic}
        setPlanTopic={setPlanTopic}
        planDate={planDate}
        setPlanDate={setPlanDate}
        onClose={closeModal}
        onAdd={handleAdd}
        onGenerate={handleGenerate}
        settings={settings}
        theme={theme}
        isLoading={isLoading}
      />
    </div>
  );
});

Chronos.displayName = 'Chronos';