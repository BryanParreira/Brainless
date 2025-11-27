import React, { useState, useCallback, useMemo } from 'react';
import { useLumina } from '../context/LuminaContext';
import { Calendar, Plus, Sparkles, ChevronLeft, ChevronRight, Clock, Tag, AlertCircle, Download, Layout, Grid } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- Utility & Helper Functions ---

const getEventColor = (type, isDev) => {
  if (isDev) {
    if (type === 'release') return 'bg-rose-500/10 text-rose-300 border-rose-500/20 border-l-2 border-l-rose-500';
    if (type === 'task') return 'bg-orange-500/10 text-orange-300 border-orange-500/20 border-l-2 border-l-orange-500';
    if (type === 'deadline') return 'bg-red-500/10 text-red-300 border-red-500/20 border-l-2 border-l-red-500';
    return 'bg-gray-800 text-gray-400 border-gray-700 border';
  }
  if (type === 'exam') return 'bg-red-500/10 text-red-300 border-red-500/20 border-l-2 border-l-red-500';
  if (type === 'study') return 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20 border-l-2 border-l-indigo-500';
  if (type === 'assignment') return 'bg-blue-500/10 text-blue-300 border-blue-500/20 border-l-2 border-l-blue-500';
  return 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20 border-l-2 border-l-emerald-500';
};

const getDaysInMonth = (date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
const getFirstDayOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();
const formatDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const generateICS = (events) => {
  let icsContent = "BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//Lumina//Chronos//EN\n";
  events.forEach(event => {
    const start = event.date.replace(/-/g, '');
    icsContent += `BEGIN:VEVENT\nSUMMARY:${event.title}\nDTSTART;VALUE=DATE:${start}\nDESCRIPTION:${event.notes || ''}\nEND:VEVENT\n`;
  });
  icsContent += "END:VCALENDAR";
  const blob = new Blob([icsContent], { type: 'text/calendar' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'lumina-schedule.ics';
  a.click();
  window.URL.revokeObjectURL(url);
};

// --- Sub-Components ---

const CalendarDay = React.memo(({ day, dateStr, dayEvents, isToday, theme }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    className={`rounded-2xl p-3 border transition-all min-h-[120px] flex flex-col ${
      isToday ? `bg-white/5 ${theme.primaryBorder}` : 'bg-[#0A0A0A] border-white/5 hover:border-white/10'
    }`}
  >
    <div className={`text-sm font-bold mb-2 flex justify-between items-center ${isToday ? theme.accentText : 'text-gray-500'}`}>
      <span>{day}</span>
      {dayEvents.length > 0 && <span className="text-[10px] bg-white/10 px-1.5 rounded-full text-gray-400">{dayEvents.length}</span>}
    </div>
    <div className="space-y-1.5 overflow-y-auto max-h-[80px] custom-scrollbar flex-1">
      {dayEvents.map((event, idx) => (
        <div
          key={event.id || idx}
          className={`text-[10px] px-2 py-1.5 rounded truncate font-medium ${getEventColor(event.type, false)}`}
          title={`${event.title}${event.time ? ` at ${event.time}` : ''}`}
        >
          {event.time && <span className="opacity-75 mr-1">{event.time}</span>}
          {event.title}
        </div>
      ))}
    </div>
  </motion.div>
));

CalendarDay.displayName = 'CalendarDay';

const WeekView = React.memo(({ currentDate, eventsByDate, theme }) => {
  const weekDates = useMemo(() => {
    const days = [];
    const curr = new Date(currentDate);
    const first = curr.getDate() - curr.getDay(); 
    
    for (let i = 0; i < 7; i++) {
      const next = new Date(curr.setDate(first + i));
      days.push(new Date(next));
    }
    return days;
  }, [currentDate]);

  const hours = Array.from({ length: 17 }, (_, i) => i + 6); // 6 AM to 10 PM

  return (
    <div className="flex flex-col h-full bg-[#0A0A0A] border border-white/5 rounded-2xl overflow-hidden">
      <div className="grid grid-cols-8 border-b border-white/5 bg-[#111]">
        <div className="p-3 border-r border-white/5"></div>
        {weekDates.map((date, i) => {
          const isToday = formatDate(date) === formatDate(new Date());
          return (
            <div key={i} className={`p-3 text-center border-r border-white/5 last:border-r-0 ${isToday ? 'bg-white/5' : ''}`}>
              <div className="text-xs text-gray-500 uppercase font-bold">{date.toLocaleDateString('en-US', { weekday: 'short' })}</div>
              <div className={`text-sm font-bold mt-1 ${isToday ? theme.accentText : 'text-white'}`}>
                {date.getDate()}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar relative">
        <div className="grid grid-cols-8">
           <div className="border-r border-white/5">
              {hours.map(hour => (
                <div key={hour} className="h-20 border-b border-white/5 text-[10px] text-gray-500 p-2 text-right">
                  {hour > 12 ? `${hour - 12} PM` : `${hour} AM`}
                </div>
              ))}
           </div>
           
           {weekDates.map((date, i) => {
             const dStr = formatDate(date);
             const dayEvents = eventsByDate[dStr] || [];
             
             return (
              <div key={i} className="border-r border-white/5 last:border-r-0 relative">
                {hours.map(h => <div key={h} className="h-20 border-b border-white/[0.02]"></div>)}
                
                {dayEvents.map((ev, idx) => {
                  let top = 0;
                  if (ev.time) {
                    const [h, m] = ev.time.split(':').map(Number);
                    if (h >= 6 && h <= 22) {
                       const minutesFrom6 = (h - 6) * 60 + m;
                       top = (minutesFrom6 / (17 * 60)) * 100;
                    }
                  }
                  
                  return (
                    <div 
                      key={idx}
                      className={`absolute left-1 right-1 p-2 rounded text-[10px] border leading-tight overflow-hidden ${getEventColor(ev.type, false)}`}
                      style={{ top: `${top}%`, height: '40px' }} 
                    >
                      <div className="font-bold truncate">{ev.title}</div>
                      {ev.time && <div className="opacity-75">{ev.time}</div>}
                    </div>
                  );
                })}
              </div>
             );
           })}
        </div>
      </div>
    </div>
  );
});

WeekView.displayName = 'WeekView';

const EventModal = React.memo(
  ({ isOpen, isPlanning, newEventTitle, setNewEventTitle, newEventDate, setNewEventDate, newEventType, setNewEventType, newEventTime, setNewEventTime, newEventPriority, setNewEventPriority, newEventNotes, setNewEventNotes, planTopic, setPlanTopic, planDate, setPlanDate, planDuration, setPlanDuration, planGoals, setPlanGoals, planConstraints, setPlanConstraints, onClose, onAdd, onGenerate, settings, theme, isLoading }) => {
    const handleKeyDown = useCallback(
      (e) => {
        if (e.key === 'Escape') onClose();
      },
      [onClose]
    );

    if (!isOpen) return null;

    const eventTypes = settings.developerMode 
      ? [
          { value: 'deadline', label: 'Deadline' },
          { value: 'release', label: 'Release' },
          { value: 'task', label: 'Task' },
          { value: 'meeting', label: 'Meeting' }
        ]
      : [
          { value: 'exam', label: 'Exam' },
          { value: 'assignment', label: 'Assignment' },
          { value: 'study', label: 'Study Session' },
          { value: 'other', label: 'Other' }
        ];

    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={onClose}
          onKeyDown={handleKeyDown}
        >
          <motion.div
            initial={{ scale: 0.95, y: 10 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 10 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-[#111] border border-white/10 rounded-2xl p-6 w-full max-w-xl shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar relative"
          >
            <div className="flex items-center justify-between mb-6">
               <h3 className="text-lg font-bold text-white flex items-center gap-2">
                {isPlanning ? (
                    <>
                    <div className={`p-1.5 rounded-lg bg-indigo-500/10 ${theme.accentText}`}>
                        <Sparkles size={18} />
                    </div>
                    {settings.developerMode ? "AI Sprint Planner" : "AI Study Plan Generator"}
                    </>
                ) : (
                    <>
                    <div className="p-1.5 rounded-lg bg-white/10 text-white">
                        <Plus size={18} />
                    </div>
                    Create New Event
                    </>
                )}
                </h3>
                <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
                    <span className="sr-only">Close</span>
                    ✕
                </button>
            </div>
            
            {isPlanning ? (
              <div className="space-y-4 mb-6">
                <div>
                  <label className="text-xs font-semibold text-gray-400 block mb-2 flex items-center gap-2">
                    <Tag size={12} />
                    {settings.developerMode ? "Feature / Milestone" : "Subject / Exam Topic"}
                  </label>
                  <input
                    value={planTopic}
                    onChange={(e) => setPlanTopic(e.target.value)}
                    className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-indigo-500 transition-all placeholder:text-gray-600"
                    autoFocus
                    placeholder={settings.developerMode ? "e.g., User Authentication System" : "e.g., Calculus Final Exam"}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                    <div>
                    <label className="text-xs font-semibold text-gray-400 block mb-2 flex items-center gap-2">
                        <Calendar size={12} />
                        {settings.developerMode ? "Target Deadline" : "Exam Date"}
                    </label>
                    <input
                        type="date"
                        value={planDate}
                        onChange={(e) => setPlanDate(e.target.value)}
                        className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-indigo-500 transition-all"
                    />
                    </div>

                    <div>
                    <label className="text-xs font-semibold text-gray-400 block mb-2 flex items-center gap-2">
                        <Clock size={12} />
                        {settings.developerMode ? "Hours/Week" : "Hours/Day"}
                    </label>
                    <input
                        type="number"
                        value={planDuration}
                        onChange={(e) => setPlanDuration(e.target.value)}
                        className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-indigo-500 transition-all"
                        placeholder="e.g., 4"
                        min="1"
                    />
                    </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-400 block mb-2 flex items-center gap-2">
                    <Sparkles size={12} />
                    {settings.developerMode ? "Goals" : "Topics to Cover"}
                  </label>
                  <textarea
                    value={planGoals}
                    onChange={(e) => setPlanGoals(e.target.value)}
                    className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-indigo-500 transition-all resize-none"
                    rows="3"
                    placeholder="List specific topics or requirements..."
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-400 block mb-2 flex items-center gap-2">
                    <AlertCircle size={12} />
                    Context (Optional)
                  </label>
                  <textarea
                    value={planConstraints}
                    onChange={(e) => setPlanConstraints(e.target.value)}
                    className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-indigo-500 transition-all resize-none"
                    rows="2"
                    placeholder="Any constraints or specific focus areas..."
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-4 mb-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-400 block mb-2">Event Type</label>
                    <select
                      value={newEventType}
                      onChange={(e) => setNewEventType(e.target.value)}
                      className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-indigo-500 transition-all"
                    >
                      {eventTypes.map(type => (
                        <option key={type.value} value={type.value}>{type.label}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="text-xs font-semibold text-gray-400 block mb-2">Priority</label>
                    <select
                      value={newEventPriority}
                      onChange={(e) => setNewEventPriority(e.target.value)}
                      className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-indigo-500 transition-all"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-400 block mb-2">Title</label>
                  <input
                    value={newEventTitle}
                    onChange={(e) => setNewEventTitle(e.target.value)}
                    className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-indigo-500 transition-all placeholder:text-gray-600"
                    autoFocus
                    placeholder="What needs to be done?"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-400 block mb-2">Date</label>
                    <input
                      type="date"
                      value={newEventDate}
                      onChange={(e) => setNewEventDate(e.target.value)}
                      className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-indigo-500 transition-all"
                    />
                  </div>
                  
                  <div>
                    <label className="text-xs font-semibold text-gray-400 block mb-2">Time (Optional)</label>
                    <input
                      type="time"
                      value={newEventTime}
                      onChange={(e) => setNewEventTime(e.target.value)}
                      className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-indigo-500 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-400 block mb-2">Notes</label>
                  <textarea
                    value={newEventNotes}
                    onChange={(e) => setNewEventNotes(e.target.value)}
                    className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-indigo-500 transition-all resize-none"
                    rows="3"
                    placeholder="Add details..."
                  />
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
              <button
                onClick={onClose}
                className="px-5 py-2.5 text-sm text-gray-400 hover:text-white transition-colors font-medium rounded-xl hover:bg-white/5"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                onClick={isPlanning ? onGenerate : onAdd}
                disabled={isLoading || (isPlanning ? !planTopic || !planDate : !newEventTitle || !newEventDate)}
                className={`px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all flex items-center gap-2 ${
                  isPlanning
                    ? `${theme.primaryBg} hover:opacity-90 disabled:opacity-50 shadow-lg shadow-indigo-500/20`
                    : 'bg-white text-black hover:bg-gray-200 disabled:bg-gray-700 disabled:cursor-not-allowed'
                }`}
              >
                {isLoading ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    >
                      <Sparkles size={14} />
                    </motion.div>
                    Processing...
                  </>
                ) : (
                  <>
                    {isPlanning ? <Sparkles size={14} /> : <Plus size={14} />}
                    {isPlanning ? "Generate Plan" : "Create Event"}
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  }
);

EventModal.displayName = 'EventModal';

// --- Main Component ---

export const Chronos = React.memo(() => {
  const { calendarEvents, addEvent, generateSchedule, theme, settings, isLoading } = useLumina();
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('month'); // 'month' | 'week'
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPlanning, setIsPlanning] = useState(false);
  
  const [newEventTitle, setNewEventTitle] = useState("");
  const [newEventDate, setNewEventDate] = useState("");
  const [newEventType, setNewEventType] = useState(settings.developerMode ? 'task' : 'assignment');
  const [newEventTime, setNewEventTime] = useState("");
  const [newEventPriority, setNewEventPriority] = useState("medium");
  const [newEventNotes, setNewEventNotes] = useState("");
  
  const [planTopic, setPlanTopic] = useState("");
  const [planDate, setPlanDate] = useState("");
  const [planDuration, setPlanDuration] = useState("");
  const [planGoals, setPlanGoals] = useState("");
  const [planConstraints, setPlanConstraints] = useState("");

  const daysInMonth = useMemo(() => getDaysInMonth(currentDate), [currentDate]);
  const firstDayOfMonth = useMemo(() => getFirstDayOfMonth(currentDate), [currentDate]);

  const changeDate = useCallback((delta) => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (viewMode === 'month') {
        newDate.setMonth(newDate.getMonth() + delta);
      } else {
        newDate.setDate(newDate.getDate() + (delta * 7));
      }
      return newDate;
    });
  }, [viewMode]);

  const handleAdd = useCallback(() => {
    if (newEventTitle && newEventDate) {
      addEvent(
        newEventTitle,
        newEventDate,
        newEventType,
        newEventPriority,
        newEventNotes,
        newEventTime
      );
      closeModal();
    }
  }, [newEventTitle, newEventDate, newEventType, newEventTime, newEventPriority, newEventNotes, addEvent]);

  const handleGenerate = useCallback(() => {
    if (planTopic && planDate) {
      generateSchedule(planTopic, planDate, planDuration, planGoals, planConstraints);
      closeModal();
    }
  }, [planTopic, planDate, planDuration, planGoals, planConstraints, generateSchedule]);

  const openAddModal = useCallback(() => {
    setIsPlanning(false);
    setIsModalOpen(true);
    setNewEventDate(formatDate(new Date()));
  }, []);

  const openPlanModal = useCallback(() => {
    setIsPlanning(true);
    setIsModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    setNewEventTitle("");
    setNewEventDate("");
    setNewEventType(settings.developerMode ? 'task' : 'assignment');
    setNewEventTime("");
    setNewEventPriority("medium");
    setNewEventNotes("");
    setPlanTopic("");
    setPlanDate("");
    setPlanDuration("");
    setPlanGoals("");
    setPlanConstraints("");
    setIsPlanning(false);
  }, [settings.developerMode]);

  const calendarDays = useMemo(() => {
    const days = [];
    for (let i = 0; i < firstDayOfMonth; i++) days.push(null);
    for (let day = 1; day <= daysInMonth; day++) days.push(day);
    return days;
  }, [daysInMonth, firstDayOfMonth]);

  const today = useMemo(() => formatDate(new Date()), []);

  const eventsByDate = useMemo(() => {
    return calendarEvents.reduce((acc, event) => {
      if (!acc[event.date]) acc[event.date] = [];
      acc[event.date].push(event);
      return acc;
    }, {});
  }, [calendarEvents]);

  return (
    <div className="flex-1 h-full flex flex-col p-8 bg-[#030304] relative overflow-hidden">
      <div className="max-w-7xl mx-auto w-full h-full flex flex-col">
        {/* Header */}
        <div className="flex items-end justify-between border-b border-white/5 pb-6 mb-6 flex-shrink-0">
          <div>
            <div
              className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-white/5 border border-white/5 text-[10px] font-bold uppercase tracking-widest ${theme.accentText}`}
            >
              <Calendar size={12} /> {settings.developerMode ? "Sprint Roadmap" : "Study Planner"}
            </div>
            <h1 className="text-4xl font-bold text-white tracking-tight mt-3">
              {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
            </h1>
          </div>

          <div className="flex gap-3">
            {/* View Switcher */}
            <div className="flex bg-[#111] rounded-xl border border-white/10 p-1">
                <button
                    onClick={() => setViewMode('month')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-2 ${viewMode === 'month' ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white'}`}
                >
                    <Grid size={14} /> Month
                </button>
                <button
                    onClick={() => setViewMode('week')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-2 ${viewMode === 'week' ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white'}`}
                >
                    <Layout size={14} /> Week
                </button>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
                <button
                onClick={() => generateICS(calendarEvents)}
                className="flex items-center gap-2 px-3 py-2 bg-[#111] hover:bg-[#1a1a1a] border border-white/10 rounded-xl text-xs font-medium text-gray-400 hover:text-white transition-all"
                title="Export to .ics"
                >
                <Download size={14} />
                </button>
                <button
                onClick={openPlanModal}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white transition-all ${theme.primaryBg} hover:opacity-90 shadow-lg disabled:opacity-50`}
                disabled={isLoading}
                >
                <Sparkles size={14} />
                {settings.developerMode ? "AI Sprint Plan" : "AI Study Plan"}
                </button>
                <button
                onClick={openAddModal}
                className="flex items-center gap-2 px-4 py-2 bg-white text-black hover:bg-gray-200 border border-transparent rounded-xl text-xs font-bold transition-all"
                >
                <Plus size={14} /> New Event
                </button>
            </div>

            {/* Navigation */}
            <div className="flex bg-[#111] rounded-xl border border-white/10 ml-2">
              <button
                onClick={() => changeDate(-1)}
                className="px-3 py-2 hover:bg-white/5 text-gray-400 hover:text-white transition-colors rounded-l-xl"
              >
                <ChevronLeft size={16} />
              </button>
              <div className="w-px bg-white/5"></div>
              <button
                onClick={() => changeDate(1)}
                className="px-3 py-2 hover:bg-white/5 text-gray-400 hover:text-white transition-colors rounded-r-xl"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 min-h-0">
          {viewMode === 'month' ? (
            <div className="h-full flex flex-col overflow-y-auto custom-scrollbar">
                <div className="grid grid-cols-7 gap-4 mb-4 text-center flex-shrink-0">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                    {day}
                    </div>
                ))}
                </div>

                <div className="grid grid-cols-7 gap-4 auto-rows-fr pb-4">
                {calendarDays.map((day, index) => {
                    if (day === null) return <div key={`empty-${index}`} />;
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
          ) : (
             <WeekView 
                currentDate={currentDate} 
                eventsByDate={eventsByDate} 
                theme={theme} 
             />
          )}
        </div>
      </div>

      <EventModal
        isOpen={isModalOpen}
        isPlanning={isPlanning}
        newEventTitle={newEventTitle}
        setNewEventTitle={setNewEventTitle}
        newEventDate={newEventDate}
        setNewEventDate={setNewEventDate}
        newEventType={newEventType}
        setNewEventType={setNewEventType}
        newEventTime={newEventTime}
        setNewEventTime={setNewEventTime}
        newEventPriority={newEventPriority}
        setNewEventPriority={setNewEventPriority}
        newEventNotes={newEventNotes}
        setNewEventNotes={setNewEventNotes}
        planTopic={planTopic}
        setPlanTopic={setPlanTopic}
        planDate={planDate}
        setPlanDate={setPlanDate}
        planDuration={planDuration}
        setPlanDuration={setPlanDuration}
        planGoals={planGoals}
        setPlanGoals={setPlanGoals}
        planConstraints={planConstraints}
        setPlanConstraints={setPlanConstraints}
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