import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useLumina } from '../context/LuminaContext';
import { 
  Calendar as CalendarIcon, 
  Plus, 
  Sparkles, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  Tag, 
  AlertCircle, 
  Download, 
  Layout, 
  Grid, 
  Target, 
  CheckCircle2, 
  Trash2, 
  Edit3,
  X,
  AlignLeft,
  ArrowLeft,
  GripHorizontal,
  BellRing,
  Mic,
  MicOff,
  Volume2,
  Upload,
  RefreshCw,
  Link as LinkIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// [Keep all existing helper functions: parseNaturalLanguage, createLocalDate, formatFriendlyDate, formatDate, getEventColor, generateICS, parseICS, useVoiceRecognition, speakText]

// --- ROBUST NATURAL LANGUAGE PARSER ---
const parseNaturalLanguage = (input) => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    
    let targetDate = new Date(now);
    let title = input;
    let time = "";
    
    const lower = input.toLowerCase();

    const timeRegex = /(\d{1,2})(:(\d{2}))?\s*(am|pm)|(\d{1,2}):(\d{2})/i;
    const timeMatch = input.match(timeRegex);

    if (timeMatch) {
        let [fullMatch, h1, _, m1, amp, h2, m2] = timeMatch;
        let hours = parseInt(h1 || h2);
        let minutes = parseInt(m1 || m2 || 0);
        
        if (amp) {
            const isPM = amp.toLowerCase() === 'pm';
            if (isPM && hours < 12) hours += 12;
            if (!isPM && hours === 12) hours = 0;
        }
        
        time = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
        title = title.replace(fullMatch, '');
    }

    if (lower.includes('tomorrow')) {
        targetDate.setDate(now.getDate() + 1);
        title = title.replace(/tomorrow/gi, '');
    } else if (lower.includes('today')) {
        title = title.replace(/today/gi, '');
    } else if (lower.match(/in \d+ days/)) {
        const days = parseInt(lower.match(/in (\d+) days/)[1]);
        targetDate.setDate(now.getDate() + days);
        title = title.replace(/in \d+ days/gi, '');
    }

    const daysMap = {
        sunday: 0, sun: 0,
        monday: 1, mon: 1,
        tuesday: 2, tue: 2,
        wednesday: 3, wed: 3,
        thursday: 4, thu: 4,
        friday: 5, fri: 5,
        saturday: 6, sat: 6
    };
    
    const dayRegex = new RegExp(`\\b(${Object.keys(daysMap).join('|')})\\b`, 'i');
    const dayMatch = lower.match(dayRegex);

    if (dayMatch) {
        const targetDay = daysMap[dayMatch[1]];
        const currentDay = now.getDay();
        let daysToAdd = targetDay - currentDay;
        
        if (daysToAdd <= 0) daysToAdd += 7;
        
        targetDate.setDate(now.getDate() + daysToAdd);
        title = title.replace(new RegExp(`\\b(on |next |this )?${dayMatch[1]}\\b`, 'gi'), '');
    }

    const slashDateMatch = lower.match(/\b(\d{1,2})\/(\d{1,2})\b/);
    if (slashDateMatch) {
        const month = parseInt(slashDateMatch[1]) - 1;
        const day = parseInt(slashDateMatch[2]);
        targetDate.setMonth(month);
        targetDate.setDate(day);
        
        if (targetDate < now) targetDate.setFullYear(now.getFullYear() + 1);
        
        title = title.replace(slashDateMatch[0], '');
    }

    title = title
        .replace(/\b(at|on|due|by)\b/gi, '')
        .replace(/\s+/g, ' ')
        .trim();

    return { 
        title: title || "New Event", 
        date: formatDate(targetDate),
        time: time 
    };
};

const createLocalDate = (dateStr) => {
    if (!dateStr) return new Date();
    const [y, m, d] = dateStr.split('-').map(Number);
    return new Date(y, m - 1, d);
};

const formatFriendlyDate = (dateStr) => {
  if (!dateStr) return '';
  const date = createLocalDate(dateStr);
  return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
};

const formatDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getEventColor = (type, isDev) => {
  if (isDev) {
    if (type === 'release') return 'bg-rose-500/20 text-rose-200 border-rose-500/30 border-l-2 border-l-rose-500';
    if (type === 'task') return 'bg-orange-500/20 text-orange-200 border-orange-500/30 border-l-2 border-l-orange-500';
    if (type === 'deadline') return 'bg-red-500/20 text-red-200 border-red-500/30 border-l-2 border-l-red-500';
    return 'bg-gray-800 text-gray-400 border-gray-700 border';
  }
  if (type === 'exam') return 'bg-red-500/20 text-red-200 border-red-500/30 border-l-2 border-l-red-500';
  if (type === 'study') return 'bg-indigo-500/20 text-indigo-200 border-indigo-500/30 border-l-2 border-l-indigo-500';
  if (type === 'assignment') return 'bg-blue-500/20 text-blue-200 border-blue-500/30 border-l-2 border-l-blue-500';
  return 'bg-emerald-500/20 text-emerald-200 border-emerald-500/30 border-l-2 border-l-emerald-500';
};

const generateICS = (events) => {
  let icsContent = "BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//OmniLab//Horizon//EN\n";
  events.forEach(event => {
    const start = event.date.replace(/-/g, '');
    icsContent += `BEGIN:VEVENT\nSUMMARY:${event.title}\nDTSTART;VALUE=DATE:${start}\nDESCRIPTION:${event.notes || ''}\nEND:VEVENT\n`;
  });
  icsContent += "END:VCALENDAR";
  const blob = new Blob([icsContent], { type: 'text/calendar' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'omnilab-schedule.ics';
  a.click();
  window.URL.revokeObjectURL(url);
};

const parseICS = (icsContent) => {
  const events = [];
  const eventBlocks = icsContent.split('BEGIN:VEVENT');
  
  for (let i = 1; i < eventBlocks.length; i++) {
    const block = eventBlocks[i];
    const summaryMatch = block.match(/SUMMARY:(.*)/);
    const dateMatch = block.match(/DTSTART[^:]*:(\d{8})/);
    const descMatch = block.match(/DESCRIPTION:(.*)/);
    
    if (summaryMatch && dateMatch) {
      const dateStr = dateMatch[1];
      const year = dateStr.substring(0, 4);
      const month = dateStr.substring(4, 6);
      const day = dateStr.substring(6, 8);
      
      events.push({
        title: summaryMatch[1].trim(),
        date: `${year}-${month}-${day}`,
        type: 'study',
        priority: 'medium',
        notes: descMatch ? descMatch[1].trim() : '',
        time: ''
      });
    }
  }
  
  return events;
};

const useVoiceRecognition = (onResult) => {
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognitionInstance = new SpeechRecognition();
      recognitionInstance.continuous = false;
      recognitionInstance.interimResults = false;
      recognitionInstance.lang = 'en-US';

      recognitionInstance.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        if (onResult) onResult(transcript);
        setIsListening(false);
      };

      recognitionInstance.onerror = () => {
        setIsListening(false);
      };

      recognitionInstance.onend = () => {
        setIsListening(false);
      };

      setRecognition(recognitionInstance);
    }
  }, [onResult]);

  const startListening = useCallback(() => {
    if (recognition) {
      setIsListening(true);
      recognition.start();
    }
  }, [recognition]);

  const stopListening = useCallback(() => {
    if (recognition) {
      recognition.stop();
      setIsListening(false);
    }
  }, [recognition]);

  return { isListening, startListening, stopListening, isSupported: !!recognition };
};

const speakText = (text) => {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;
    window.speechSynthesis.speak(utterance);
  }
};

const DraggableEvent = ({ event, onClick, theme }) => {
    return (
        <div
            draggable
            onDragStart={(e) => {
                e.dataTransfer.setData("eventId", event.id);
                e.dataTransfer.effectAllowed = "move";
            }}
            onClick={(e) => { e.stopPropagation(); onClick(event); }}
            className={`text-[9px] px-2 py-1 rounded truncate font-medium cursor-grab active:cursor-grabbing hover:brightness-110 active:scale-95 transition-transform flex items-center gap-1 group ${getEventColor(event.type, theme.isDev)}`}
            title={`${event.title}${event.time ? ` at ${event.time}` : ''}`}
        >
            <GripHorizontal size={8} className="opacity-0 group-hover:opacity-50" />
            {event.time && <span className="opacity-70 font-mono">{event.time}</span>}
            <span className="truncate">{event.title}</span>
        </div>
    );
};

// [Keep CalendarDay, WeekView, and EventModal components exactly as they are]

const CalendarDay = React.memo(({ day, dateStr, dayEvents, isToday, theme, onDayClick, onEventClick, onDropEvent }) => {
  const [isDragOver, setIsDragOver] = useState(false);

  if (!day) return <div className="bg-[#050505]/50 border border-white/[0.02]" />;

  return (
    <motion.div
      onClick={onDayClick}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={(e) => {
          e.preventDefault();
          setIsDragOver(false);
          const eventId = e.dataTransfer.getData("eventId");
          if (eventId) onDropEvent(eventId, dateStr);
      }}
      className={`relative border p-2 flex flex-col transition-all group hover:bg-white/[0.02] cursor-pointer min-h-[100px] ${
        isDragOver ? 'border-blue-500/50 bg-blue-500/10' : 'border-white/5'
      } ${isToday ? `bg-white/[0.03] ${theme.primaryBorder}` : 'bg-[#0A0A0A]'}`}
    >
      <div className="flex justify-between items-start mb-2">
        <span className={`text-sm font-bold w-7 h-7 flex items-center justify-center rounded-full ${isToday ? `${theme.primaryBg} text-white` : 'text-gray-400'}`}>
          {day}
        </span>
        {dayEvents.length > 0 && (
          <span className="text-[9px] bg-white/10 px-1.5 rounded text-gray-400 font-mono">
            {dayEvents.length}
          </span>
        )}
      </div>
      
      <div className="flex-1 overflow-y-auto custom-scrollbar space-y-1">
        {dayEvents.map((event, idx) => (
            <DraggableEvent 
                key={event.id || idx} 
                event={event} 
                onClick={onEventClick} 
                theme={theme}
            />
        ))}
      </div>
    </motion.div>
  );
});

const WeekView = React.memo(({ currentDate, eventsByDate, theme, onEventClick }) => {
  const weekDates = useMemo(() => {
    const days = [];
    const curr = new Date(currentDate);
    const first = curr.getDate() - curr.getDay(); 
    for (let i = 0; i < 7; i++) {
      const next = new Date(new Date(curr).setDate(first + i));
      days.push(next);
    }
    return days;
  }, [currentDate]);

  const hours = Array.from({ length: 15 }, (_, i) => i + 7);

  return (
    <div className="flex flex-col h-full bg-[#0A0A0A] border border-white/5 rounded-2xl overflow-hidden">
      <div className="grid grid-cols-8 border-b border-white/5 bg-[#111]">
        <div className="p-3 border-r border-white/5 bg-[#080808]"></div>
        {weekDates.map((date, i) => {
          const isToday = formatDate(date) === formatDate(new Date());
          return (
            <div key={i} className={`p-2 text-center border-r border-white/5 last:border-r-0 ${isToday ? 'bg-white/5' : ''}`}>
              <div className="text-[10px] text-gray-500 uppercase font-bold">{date.toLocaleDateString('en-US', { weekday: 'short' })}</div>
              <div className={`text-sm font-bold mt-0.5 ${isToday ? theme.accentText : 'text-white'}`}>
                {date.getDate()}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar relative">
        <div className="grid grid-cols-8">
           <div className="border-r border-white/5 bg-[#080808]">
              {hours.map(hour => (
                <div key={hour} className="h-16 border-b border-white/5 text-[9px] text-gray-500 p-2 text-right font-mono">
                  {hour > 12 ? `${hour - 12} PM` : `${hour} AM`}
                </div>
              ))}
           </div>
           
           {weekDates.map((date, i) => {
             const dStr = formatDate(date);
             const dayEvents = eventsByDate[dStr] || [];
             
             return (
              <div key={i} className="border-r border-white/5 last:border-r-0 relative group hover:bg-white/[0.01]">
                {hours.map(h => <div key={h} className="h-16 border-b border-white/[0.02]"></div>)}
                
                {dayEvents.map((ev, idx) => {
                  let top = 0;
                  if (ev.time) {
                    const [h, m] = ev.time.split(':').map(Number);
                    if (h >= 7 && h <= 21) {
                       const minutesFrom7 = (h - 7) * 60 + m;
                       top = (minutesFrom7 / (15 * 60)) * 100;
                    }
                  }
                  
                  return (
                    <div 
                      key={idx}
                      onClick={(e) => { e.stopPropagation(); onEventClick(ev); }}
                      className={`absolute left-1 right-1 p-1.5 rounded text-[9px] border leading-tight overflow-hidden cursor-pointer hover:brightness-110 z-10 ${getEventColor(ev.type, theme.isDev)}`}
                      style={{ top: `${top}%`, height: '36px' }} 
                    >
                      <div className="font-bold truncate">{ev.title}</div>
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

const EventModal = React.memo(({ isOpen, isPlanning, isEditing, onClose, onAdd, onUpdate, onDelete, onGenerate, settings, theme, isLoading, voiceHandler, ...props }) => {
    const [isEditingState, setIsEditingState] = useState(false);

    useEffect(() => {
        if (isOpen) {
            if (isPlanning || !isEditing) setIsEditingState(true);
            else setIsEditingState(false);
        }
    }, [isOpen, isPlanning, isEditing]);

    if (!isOpen) return null;

    const eventTypes = settings.developerMode 
      ? [ { value: 'task', label: 'Task' }, { value: 'deadline', label: 'Deadline' }, { value: 'release', label: 'Release' } ]
      : [ { value: 'study', label: 'Study Session' }, { value: 'assignment', label: 'Assignment' }, { value: 'exam', label: 'Exam' } ];

    return (
      <AnimatePresence>
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
          <motion.div
            initial={{ scale: 0.95, y: 10, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.95, y: 10, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-[#0F0F0F] border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[85vh] overflow-hidden"
          >
            
            {!isEditingState && !isPlanning ? (
                <>
                    <div className={`p-8 relative overflow-hidden ${theme.softBg} border-b ${theme.primaryBorder}`}>
                        <div className="absolute top-4 right-4 flex gap-2">
                             <button 
                               onClick={() => speakText(`${props.newEventTitle}. ${formatFriendlyDate(props.newEventDate)}${props.newEventTime ? ` at ${props.newEventTime}` : ''}. ${props.newEventNotes || 'No additional notes'}`)} 
                               className="p-2 bg-black/20 hover:bg-black/40 text-white rounded-lg backdrop-blur-sm transition-colors" 
                               title="Read aloud"
                             >
                               <Volume2 size={16} />
                             </button>
                             <button onClick={() => setIsEditingState(true)} className="p-2 bg-black/20 hover:bg-black/40 text-white rounded-lg backdrop-blur-sm transition-colors" title="Edit"><Edit3 size={16} /></button>
                             <button onClick={onClose} className="p-2 bg-black/20 hover:bg-black/40 text-white rounded-lg backdrop-blur-sm transition-colors" title="Close"><X size={16} /></button>
                        </div>

                        <div className="flex gap-2 mb-4">
                            <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider border ${theme.primaryBorder} ${theme.primaryText}`}>{props.newEventType}</span>
                            {props.newEventPriority === 'high' && <span className="px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider border border-red-500/30 text-red-400 bg-red-500/10 flex items-center gap-1"><AlertCircle size={10} /> High Priority</span>}
                        </div>
                        
                        <h2 className="text-3xl font-bold text-white leading-tight mb-2">{props.newEventTitle}</h2>
                        
                        <div className="flex items-center gap-4 text-sm text-gray-300 font-medium">
                            <div className="flex items-center gap-1.5"><CalendarIcon size={14} className={theme.primaryText} />{formatFriendlyDate(props.newEventDate)}</div>
                            {props.newEventTime && <div className="flex items-center gap-1.5"><Clock size={14} className={theme.primaryText} />{props.newEventTime}</div>}
                        </div>
                    </div>

                    <div className="p-6 bg-[#0F0F0F] flex-1 overflow-y-auto">
                        <div className="mb-8">
                            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-2"><AlignLeft size={12} /> Notes & Details</h4>
                            <div className="p-4 rounded-xl bg-[#151515] border border-white/5 text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">
                                {props.newEventNotes || "No additional notes provided for this event."}
                            </div>
                        </div>

                        <div className="flex justify-between items-center pt-6 border-t border-white/5">
                             <button onClick={onDelete} className="text-red-400 hover:text-red-300 text-sm font-medium flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-red-500/10 transition-colors"><Trash2 size={16} /> Delete Event</button>
                             <button onClick={onClose} className="text-gray-400 hover:text-white text-sm font-medium">Close</button>
                        </div>
                    </div>
                </>
            ) : (
                <>
                    <div className="flex items-center justify-between p-5 border-b border-white/10 bg-[#151515]">
                        <div className="flex items-center gap-3">
                            {isEditing && !isPlanning && <button onClick={() => setIsEditingState(false)} className="text-gray-500 hover:text-white transition-colors"><ArrowLeft size={18} /></button>}
                            <h3 className="text-base font-bold text-white flex items-center gap-2">
                                {isPlanning ? (
                                    <><div className={`p-1.5 rounded-lg ${theme.softBg} ${theme.accentText}`}><Sparkles size={16} /></div> {settings.developerMode ? "Sprint Planner" : "Study Plan"}</>
                                ) : (
                                    <><div className="p-1.5 rounded-lg bg-white/10 text-white"><Edit3 size={16} /></div> {isEditing ? "Edit Details" : "New Event"}</>
                                )}
                            </h3>
                        </div>
                        <button onClick={onClose} className="text-gray-500 hover:text-white"><X size={18} /></button>
                    </div>
                    
                    <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-5">
                    {isPlanning ? (
                        <>
                        <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl text-xs text-blue-200">
                            <strong className="block mb-1 flex items-center gap-1"><Sparkles size={10}/> AI Generator</strong>
                            Tell Chronos what to plan, and it will build a schedule for you.
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-400 mb-2 flex items-center gap-2"><Tag size={12}/> Topic</label>
                            <input autoFocus value={props.planTopic} onChange={(e) => props.setPlanTopic(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-white/30" placeholder="e.g. Calculus Final" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-bold text-gray-400 mb-2 flex items-center gap-2"><Target size={12}/> Deadline</label>
                                <input type="date" value={props.planDate} onChange={(e) => props.setPlanDate(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-white/30" />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-400 mb-2 flex items-center gap-2"><Clock size={12}/> Duration</label>
                                <input type="number" value={props.planDuration} onChange={(e) => props.setPlanDuration(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-white/30" placeholder="Hours" />
                            </div>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-400 mb-2 flex items-center gap-2"><AlertCircle size={12}/> Goals</label>
                            <textarea value={props.planGoals} onChange={(e) => props.setPlanGoals(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-white/30 resize-none h-24" placeholder="Specific areas to cover..." />
                        </div>
                        </>
                    ) : (
                        <>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                            <label className="text-xs font-bold text-gray-400 mb-2">Type</label>
                            <select value={props.newEventType} onChange={(e) => props.setNewEventType(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-white/30">
                                {eventTypes.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                            </select>
                            </div>
                            <div>
                            <label className="text-xs font-bold text-gray-400 mb-2">Priority</label>
                            <select value={props.newEventPriority} onChange={(e) => props.setNewEventPriority(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-white/30">
                                <option value="low">Low</option>
                                <option value="medium">Medium</option>
                                <option value="high">High</option>
                            </select>
                            </div>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-400 mb-2 flex items-center justify-between">
                              <span>Title</span>
                              {voiceHandler?.isSupported && (
                                <button
                                  type="button"
                                  onClick={voiceHandler.isListening ? voiceHandler.stopListening : voiceHandler.startListening}
                                  className={`p-1 rounded ${voiceHandler.isListening ? 'bg-red-500/20 text-red-400' : 'bg-white/5 text-gray-400 hover:text-white'}`}
                                  title={voiceHandler.isListening ? "Stop listening" : "Voice input"}
                                >
                                  {voiceHandler.isListening ? <MicOff size={12} /> : <Mic size={12} />}
                                </button>
                              )}
                            </label>
                            <input value={props.newEventTitle} onChange={(e) => props.setNewEventTitle(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-white/30" placeholder="Event name..." />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                            <label className="text-xs font-bold text-gray-400 mb-2">Date</label>
                            <input type="date" value={props.newEventDate} onChange={(e) => props.setNewEventDate(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-white/30" />
                            </div>
                            <div>
                            <label className="text-xs font-bold text-gray-400 mb-2">Time</label>
                            <input type="time" value={props.newEventTime} onChange={(e) => props.setNewEventTime(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-white/30" />
                            </div>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-400 mb-2">Notes</label>
                            <textarea value={props.newEventNotes} onChange={(e) => props.setNewEventNotes(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-white/30 resize-none h-20" placeholder="Add details..." />
                        </div>
                        </>
                    )}
                    </div>

                    <div className="p-5 border-t border-white/10 bg-[#151515] rounded-b-2xl flex justify-end gap-3">
                    <button onClick={() => isEditing && !isPlanning ? setIsEditingState(false) : onClose()} className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors" disabled={isLoading}>Cancel</button>
                    <button 
                        onClick={isPlanning ? onGenerate : (isEditing ? onUpdate : onAdd)} 
                        disabled={isLoading || (isPlanning ? !props.planTopic : !props.newEventTitle)} 
                        className={`px-6 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
                            isPlanning 
                                ? `${theme.primaryBg} text-white hover:opacity-90` 
                                : 'bg-white !text-black hover:bg-gray-200' 
                        }`}
                    >
                        {isLoading ? <Sparkles size={14} className="animate-spin" /> : isPlanning ? <Sparkles size={14}/> : <CheckCircle2 size={14}/>}
                        {isPlanning ? (isLoading ? 'Creating Plan...' : 'Generate Plan') : (isEditing ? 'Save Changes' : 'Save Event')}
                    </button>
                    </div>
                </>
            )}
          </motion.div>
        </div>
      </AnimatePresence>
    );
});

// --- GOOGLE CALENDAR WIDGET (EMBEDDED IN CHRONOS) ---
const GoogleCalendarWidget = ({ onSync, syncing, connected, onConnect }) => {
  return (
    <div className="flex items-center gap-2">
      {connected ? (
        <button
          onClick={onSync}
          disabled={syncing}
          className={`px-3 py-1.5 rounded-lg flex items-center gap-2 text-xs font-medium transition-all
                     ${syncing 
                       ? 'bg-white/5 text-white/30 cursor-not-allowed' 
                       : 'bg-green-500/20 hover:bg-green-500/30 text-green-400'
                     }`}
          title="Sync with Google Calendar"
        >
          <RefreshCw size={12} className={syncing ? 'animate-spin' : ''} />
          <span>{syncing ? 'Syncing' : 'Sync'}</span>
        </button>
      ) : (
        <button
          onClick={onConnect}
          className="px-3 py-1.5 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg 
                     flex items-center gap-2 text-xs font-medium transition-all"
          title="Connect Google Calendar"
        >
          <LinkIcon size={12} />
          <span>Google</span>
        </button>
      )}
    </div>
  );
};

// --- MAIN CHRONOS COMPONENT ---
export const Chronos = React.memo(() => {
  const { calendarEvents, setCalendarEvents, addEvent, updateEvent, deleteEvent, generateSchedule, theme, settings, isLoading } = useLumina();
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('month');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPlanning, setIsPlanning] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [naturalInput, setNaturalInput] = useState("");
  const [notification, setNotification] = useState(null);
  
  // Google Calendar State
  const [gcalAvailable, setGcalAvailable] = useState(false);
  const [gcalConnected, setGcalConnected] = useState(false);
  const [gcalSyncing, setGcalSyncing] = useState(false);
  const [showGcalAuth, setShowGcalAuth] = useState(false);
  const [gcalAuthUrl, setGcalAuthUrl] = useState(null);
  const [gcalAuthCode, setGcalAuthCode] = useState('');
  
  // Form State
  const [newEventTitle, setNewEventTitle] = useState("");
  const [newEventDate, setNewEventDate] = useState("");
  const [newEventType, setNewEventType] = useState(settings.developerMode ? 'task' : 'study');
  const [newEventTime, setNewEventTime] = useState("");
  const [newEventPriority, setNewEventPriority] = useState("medium");
  const [newEventNotes, setNewEventNotes] = useState(""); 
  
  // Planning State
  const [planTopic, setPlanTopic] = useState("");
  const [planDate, setPlanDate] = useState("");
  const [planDuration, setPlanDuration] = useState("");
  const [planGoals, setPlanGoals] = useState("");

  // Check Google Calendar availability on mount
  useEffect(() => {
    checkGcalAvailability();
    checkGcalStatus();
  }, []);

  const checkGcalAvailability = async () => {
    try {
      const result = await window.lumina.checkGCalAvailability();
      setGcalAvailable(result.available);
    } catch (err) {
      setGcalAvailable(false);
    }
  };

  const checkGcalStatus = async () => {
    try {
      const result = await window.lumina.checkGoogleCalendarStatus();
      setGcalConnected(result.connected);
    } catch (err) {
      setGcalConnected(false);
    }
  };

  const handleGcalConnect = () => {
    setShowGcalAuth(true);
  };

  const handleQuickConnect = async () => {
    try {
      const result = await window.lumina.connectGoogleCalendar();
      if (result.success) {
        setGcalConnected(true);
        setShowGcalAuth(false);
        handleGcalSync();
        showNotification('✅ Connected to Google Calendar!');
      }
    } catch (err) {
      console.error('Connect error:', err);
      showNotification('❌ Connection failed');
    }
  };

  const handleManualAuth = async () => {
    try {
      const result = await window.lumina.getGoogleAuthUrl();
      if (result.success) {
        setGcalAuthUrl(result.url);
      }
    } catch (err) {
      console.error('Get URL error:', err);
    }
  };

  const handleSubmitCode = async () => {
    if (!gcalAuthCode.trim()) return;

    try {
      const result = await window.lumina.authenticateWithCode(gcalAuthCode);
      if (result.success) {
        setGcalConnected(true);
        setShowGcalAuth(false);
        setGcalAuthCode('');
        setGcalAuthUrl(null);
        handleGcalSync();
        showNotification('✅ Connected to Google Calendar!');
      } else {
        showNotification('❌ ' + result.error);
      }
    } catch (err) {
      showNotification('❌ Authentication failed');
    }
  };

  const handleGcalSync = async () => {
    setGcalSyncing(true);
    try {
      const localEvents = calendarEvents.filter(e => e.source !== 'google');
      await window.lumina.syncToGoogle(localEvents);

      const today = new Date();
      const nextMonth = new Date(today);
      nextMonth.setMonth(today.getMonth() + 1);
      
      const importResult = await window.lumina.importFromGoogle(
        today.toISOString().split('T')[0],
        nextMonth.toISOString().split('T')[0]
      );

      if (importResult.success) {
        const mergedEvents = [...calendarEvents];
        let imported = 0;
        
        importResult.events.forEach(gEvent => {
          const exists = mergedEvents.some(e => e.googleId === gEvent.googleId);
          if (!exists) {
            mergedEvents.push(gEvent);
            imported++;
          }
        });
        
        setCalendarEvents(mergedEvents);
        await window.lumina.saveCalendar(mergedEvents);
        
        showNotification(`✅ Synced with Google Calendar (${imported} imported)`);
      }
    } catch (err) {
      console.error('Sync error:', err);
      showNotification('❌ Sync failed');
    } finally {
      setGcalSyncing(false);
    }
  };

  const handleVoiceResult = useCallback((transcript) => {
    const parsed = parseNaturalLanguage(transcript);
    setNewEventTitle(parsed.title);
    setNewEventDate(parsed.date);
    if (parsed.time) setNewEventTime(parsed.time);
  }, []);

  const voiceHandler = useVoiceRecognition(handleVoiceResult);

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();

  const changeDate = useCallback((delta) => {
    setCurrentDate(prev => {
      const d = new Date(prev);
      viewMode === 'month' ? d.setMonth(d.getMonth() + delta) : d.setDate(d.getDate() + (delta * 7));
      return d;
    });
  }, [viewMode]);

  const showNotification = (message) => {
      setNotification(message);
      setTimeout(() => setNotification(null), 3000);
  };

  const handleNaturalSubmit = (e) => {
      if (e.key === 'Enter' && naturalInput) {
          const lower = naturalInput.toLowerCase();
          
          if (lower.includes('plan') || lower.includes('schedule') || lower.includes('generate')) {
             const topic = naturalInput.replace(/plan|schedule|generate|sprint|for/gi, '').trim();
             if (topic) {
                 const deadline = new Date();
                 deadline.setDate(deadline.getDate() + 7);
                 const deadlineStr = formatDate(deadline);
                 
                 generateSchedule(topic, deadlineStr, 10, "Generated via Chronos Command Bar", "");
                 showNotification(`Generating plan for "${topic}"...`);
                 setNaturalInput("");
                 return;
             }
          }

          const parsed = parseNaturalLanguage(naturalInput);
          if (parsed.title) {
            addEvent(
                parsed.title, 
                parsed.date, 
                'task', 
                'medium', 
                `Created via command: "${naturalInput}"`, 
                parsed.time
            );
            showNotification(`Scheduled "${parsed.title}" for ${formatFriendlyDate(parsed.date)}`);
            setNaturalInput("");
          }
      }
  };

  const handleDropEvent = (eventId, targetDate) => {
      const event = calendarEvents.find(e => e.id === eventId);
      if (event && updateEvent) {
          updateEvent(eventId, { ...event, date: targetDate });
          showNotification(`"${event.title}" rescheduled to ${formatFriendlyDate(targetDate)}`);
      }
  };

  const openNewEvent = (dateStr) => {
      setEditingEvent(null);
      setIsPlanning(false);
      setNewEventTitle("");
      setNewEventDate(dateStr || formatDate(new Date()));
      setNewEventTime("");
      setNewEventNotes("");
      setIsModalOpen(true);
  };

  const openEditEvent = (event) => {
      setEditingEvent(event);
      setIsPlanning(false);
      setNewEventTitle(event.title);
      setNewEventDate(event.date);
      setNewEventType(event.type);
      setNewEventTime(event.time || "");
      setNewEventPriority(event.priority || "medium");
      setNewEventNotes(event.notes || "");
      setIsModalOpen(true);
  };

  const handleAdd = () => {
    if (newEventTitle && newEventDate) {
      addEvent(newEventTitle, newEventDate, newEventType, newEventPriority, newEventNotes, newEventTime);
      closeModal();
    }
  };

  const handleUpdate = () => {
    if (editingEvent && updateEvent) {
        updateEvent(editingEvent.id, {
            title: newEventTitle,
            date: newEventDate,
            type: newEventType,
            time: newEventTime,
            priority: newEventPriority,
            notes: newEventNotes
        });
        closeModal();
    } else {
        if(deleteEvent) deleteEvent(editingEvent.id);
        addEvent(newEventTitle, newEventDate, newEventType, newEventPriority, newEventNotes, newEventTime);
        closeModal();
    }
  };

  const handleDelete = () => {
    if (editingEvent && deleteEvent) {
        deleteEvent(editingEvent.id);
        closeModal();
    } else {
        console.error("Delete function missing");
        closeModal();
    }
  };

  const handleGenerate = () => {
    if (planTopic && planDate) {
      generateSchedule(planTopic, planDate, planDuration, planGoals, "");
      closeModal();
    }
  };

  const handleImportICS = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.ics';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const icsContent = event.target.result;
          const importedEvents = parseICS(icsContent);
          
          importedEvents.forEach(evt => {
            addEvent(evt.title, evt.date, evt.type, evt.priority, evt.notes, evt.time);
          });
          
          showNotification(`Imported ${importedEvents.length} event(s) from calendar`);
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  const closeModal = () => {
    setIsModalOpen(false); setIsPlanning(false); setEditingEvent(null);
    setNewEventTitle(""); setNewEventDate(""); setNewEventTime(""); setPlanTopic(""); setPlanDate(""); setNewEventNotes("");
  };

  const eventsByDate = useMemo(() => {
    return calendarEvents.reduce((acc, event) => {
      if (!acc[event.date]) acc[event.date] = [];
      acc[event.date].push(event);
      return acc;
    }, {});
  }, [calendarEvents]);

  const todayStr = formatDate(new Date());

  const calendarDays = useMemo(() => {
    const days = Array(firstDayOfMonth).fill(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);
    return days;
  }, [daysInMonth, firstDayOfMonth]);

  return (
    <div className="flex-1 h-full flex flex-col p-6 bg-[#030304] overflow-hidden relative">
      <div className="max-w-[1600px] w-full mx-auto h-full flex flex-col">
        
        <AnimatePresence>
            {notification && (
                <motion.div 
                    initial={{ y: 50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 50, opacity: 0 }}
                    className="absolute bottom-10 left-1/2 -translate-x-1/2 z-50 bg-[#151515] border border-green-500/30 text-green-400 px-4 py-2 rounded-full shadow-2xl flex items-center gap-2 text-sm font-bold"
                >
                    <CheckCircle2 size={16} /> {notification}
                </motion.div>
            )}
        </AnimatePresence>

        <div className="mb-6 relative group z-20">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-gray-500 group-focus-within:text-blue-400 transition-colors">
                <Sparkles size={16} className={naturalInput ? "animate-pulse text-blue-400" : ""} />
            </div>
            <input 
                type="text" 
                value={naturalInput}
                onChange={(e) => setNaturalInput(e.target.value)}
                onKeyDown={handleNaturalSubmit}
                placeholder="Ask Chronos: 'Plan sprint for Physics', 'Meeting on Friday', or 'Call Mom at 5pm'..."
                className="w-full bg-[#0A0A0A] border border-white/10 rounded-xl py-3 pl-10 pr-24 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-all shadow-inner placeholder-gray-600"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
              {voiceHandler.isSupported && (
                <button
                  onClick={voiceHandler.isListening ? voiceHandler.stopListening : voiceHandler.startListening}
                  className={`p-1.5 rounded-lg transition-all ${
                    voiceHandler.isListening 
                      ? 'bg-red-500/20 text-red-400 animate-pulse' 
                      : 'bg-white/5 text-gray-500 hover:text-white hover:bg-white/10'
                  }`}
                  title={voiceHandler.isListening ? "Stop listening" : "Voice input"}
                >
                  {voiceHandler.isListening ? <MicOff size={14} /> : <Mic size={14} />}
                </button>
              )}
              <div className="text-[10px] text-gray-600 border border-white/5 px-1.5 rounded opacity-50 group-focus-within:opacity-100 transition-opacity">ENTER</div>
            </div>
        </div>

        <div className="flex items-center justify-between pb-4 border-b border-white/5 flex-shrink-0 mb-4 z-10">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-white tracking-tight">
              {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
            </h1>
            <div className="flex bg-[#111] rounded-lg border border-white/10 p-0.5">
              <button onClick={() => changeDate(-1)} className="p-1 hover:text-white text-gray-500 rounded hover:bg-white/5"><ChevronLeft size={16}/></button>
              <button onClick={() => setCurrentDate(new Date())} className="px-2 text-xs font-bold text-gray-400 hover:text-white">Today</button>
              <button onClick={() => changeDate(1)} className="p-1 hover:text-white text-gray-500 rounded hover:bg-white/5"><ChevronRight size={16}/></button>
            </div>
          </div>

          <div className="flex gap-2">
            <div className="flex bg-[#111] rounded-lg border border-white/10 p-0.5 mr-2">
                <button onClick={() => setViewMode('month')} className={`px-3 py-1 rounded-md text-xs font-medium transition-all flex items-center gap-2 ${viewMode === 'month' ? 'bg-white/10 text-white' : 'text-gray-500'}`}><Grid size={12}/> Month</button>
                <button onClick={() => setViewMode('week')} className={`px-3 py-1 rounded-md text-xs font-medium transition-all flex items-center gap-2 ${viewMode === 'week' ? 'bg-white/10 text-white' : 'text-gray-500'}`}><Layout size={12}/> Week</button>
            </div>
            
            {/* GOOGLE CALENDAR WIDGET */}
            {gcalAvailable && (
              <GoogleCalendarWidget 
                onSync={handleGcalSync}
                syncing={gcalSyncing}
                connected={gcalConnected}
                onConnect={handleGcalConnect}
              />
            )}
            
            <button onClick={handleImportICS} className="p-2 bg-[#111] border border-white/10 rounded-lg text-gray-400 hover:text-white" title="Import Calendar (.ics)"><Upload size={14}/></button>
            <button onClick={() => generateICS(calendarEvents)} className="p-2 bg-[#111] border border-white/10 rounded-lg text-gray-400 hover:text-white" title="Export ICS"><Download size={14}/></button>
            
            <button onClick={() => openNewEvent(formatDate(new Date()))} className="flex items-center gap-2 px-3 py-1.5 bg-white text-black hover:bg-gray-200 rounded-lg text-xs font-bold">
                <Plus size={12}/> Add
            </button>
          </div>
        </div>

        <div className="flex-1 min-h-0 relative z-0">
          {viewMode === 'month' ? (
            <div className="h-full flex flex-col">
                <div className="grid grid-cols-7 gap-px mb-2">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                    <div key={d} className="text-center text-[10px] font-bold text-gray-500 uppercase tracking-wider">{d}</div>
                  ))}
                </div>
                <div className="flex-1 grid grid-cols-7 grid-rows-5 gap-1">
                  {calendarDays.map((day, i) => {
                    const dateStr = day ? formatDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), day)) : `empty-${i}`;
                    const events = eventsByDate[dateStr] || [];
                    return (
                        <CalendarDay 
                            key={i} 
                            day={day} 
                            dateStr={dateStr} 
                            dayEvents={events} 
                            isToday={todayStr === dateStr} 
                            theme={{...theme, isDev: settings.developerMode}} 
                            onDayClick={() => { if(day) openNewEvent(dateStr); }}
                            onEventClick={openEditEvent}
                            onDropEvent={handleDropEvent}
                        />
                    );
                  })}
                </div>
            </div>
          ) : (
             <WeekView 
                currentDate={currentDate} 
                eventsByDate={eventsByDate} 
                theme={{...theme, isDev: settings.developerMode}} 
                onEventClick={openEditEvent}
             />
          )}
        </div>
      </div>

      {/* GOOGLE CALENDAR AUTH MODAL - IMPROVED DESIGN */}
      {/* GOOGLE CALENDAR AUTH MODAL - DESIGN MATCHED */}
<AnimatePresence>
  {showGcalAuth && (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-xl z-[60] flex items-center justify-center p-4" onClick={() => setShowGcalAuth(false)}>
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-[#0A0A0A] rounded-2xl border border-white/10 shadow-2xl overflow-hidden relative"
      >
        {/* Noise texture overlay */}
        <div className="absolute inset-0 bg-noise opacity-20 pointer-events-none" />
        
        {/* Top accent line */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 opacity-60" />
        
        {/* Header */}
        <div className="relative p-6 border-b border-white/5 bg-[#050505]/80 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                <CalendarIcon size={22} className="text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white tracking-tight">Google Calendar</h3>
                <p className="text-xs text-gray-500 mt-0.5">Sync your schedule</p>
              </div>
            </div>
            <button
              onClick={() => {
                setShowGcalAuth(false);
                setGcalAuthUrl(null);
                setGcalAuthCode('');
              }}
              className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all text-gray-500 hover:text-white"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="relative p-6 space-y-5 bg-[#0A0A0A]">
          {/* Quick Connect */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center">
                <span className="text-xs font-bold text-green-400">1</span>
              </div>
              <p className="text-sm font-semibold text-white">One-Click Connection</p>
              <span className="ml-auto px-2 py-0.5 bg-green-500/10 border border-green-500/20 text-green-400 text-[10px] font-bold rounded uppercase">Recommended</span>
            </div>
            
            <button
              onClick={() => {
                setShowGcalAuth(false);
                handleQuickConnect();
              }}
              className="w-full group relative overflow-hidden bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white rounded-xl py-3.5 transition-all duration-200 shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 hover:scale-[1.01] active:scale-[0.99]"
            >
              <div className="relative flex items-center justify-center gap-3">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span className="font-bold text-sm">Connect with Google</span>
              </div>
            </button>
            
            <div className="flex items-start gap-2 p-3 bg-blue-500/5 border border-blue-500/10 rounded-xl">
              <AlertCircle size={14} className="text-blue-400 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-gray-400 leading-relaxed">
                Browser opens → Sign in → Grant permissions → Done!
              </p>
            </div>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3 my-4">
            <div className="flex-1 h-px bg-white/5" />
            <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">or</span>
            <div className="flex-1 h-px bg-white/5" />
          </div>

          {/* Manual Setup */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                <span className="text-xs font-bold text-purple-400">2</span>
              </div>
              <p className="text-sm font-semibold text-white">Manual Setup</p>
              <span className="ml-auto px-2 py-0.5 bg-white/5 border border-white/10 text-gray-500 text-[10px] font-bold rounded uppercase">Alternative</span>
            </div>
            
            {!gcalAuthUrl ? (
              <button
                onClick={handleManualAuth}
                className="w-full bg-[#111] hover:bg-[#151515] border border-white/10 hover:border-white/20 text-white rounded-xl py-3 transition-all"
              >
                <div className="flex items-center justify-center gap-2">
                  <span className="text-xl">🔑</span>
                  <span className="font-medium text-sm">Get Authorization Code</span>
                </div>
              </button>
            ) : (
              <div className="space-y-3">
                {/* Step 1 */}
                <div className="p-3 bg-purple-500/5 border border-purple-500/10 rounded-xl space-y-2">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-purple-400 uppercase">Step 1</span>
                    <CheckCircle2 size={14} className="text-purple-400" />
                  </div>
                  <button
                    onClick={() => window.open(gcalAuthUrl, '_blank')}
                    className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2 font-medium text-sm shadow-lg shadow-purple-500/20"
                  >
                    <span>🌐</span>
                    <span>Open Google</span>
                  </button>
                </div>

                {/* Step 2 */}
                <div className="p-3 bg-green-500/5 border border-green-500/10 rounded-xl space-y-2">
                  <span className="text-xs font-bold text-green-400 uppercase block mb-2">Step 2</span>
                  <input
                    type="text"
                    value={gcalAuthCode}
                    onChange={(e) => setGcalAuthCode(e.target.value)}
                    placeholder="Paste code here..."
                    className="w-full px-3 py-2 bg-black/50 border border-white/10 focus:border-green-500/50 rounded-lg text-white text-sm placeholder-gray-600 focus:outline-none transition-colors font-mono"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && gcalAuthCode.trim()) {
                        handleSubmitCode();
                      }
                    }}
                  />
                  <button
                    onClick={handleSubmitCode}
                    disabled={!gcalAuthCode.trim()}
                    className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-800 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center justify-center gap-2 font-medium text-sm shadow-lg shadow-green-500/20"
                  >
                    <CheckCircle2 size={16} />
                    <span>Connect</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="relative px-6 py-4 bg-[#050505]/80 backdrop-blur-sm border-t border-white/5">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 text-gray-500">
              <span className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_#22c55e]" />
              <span className="font-medium">Secure OAuth 2.0</span>
            </div>
            <button
              onClick={() => {
                setShowGcalAuth(false);
                setGcalAuthUrl(null);
                setGcalAuthCode('');
              }}
              className="text-gray-500 hover:text-white transition-colors font-medium"
            >
              Close
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  )}
</AnimatePresence>

      <EventModal
        isOpen={isModalOpen}
        isPlanning={isPlanning}
        isEditing={!!editingEvent}
        onClose={closeModal}
        onAdd={handleAdd}
        onUpdate={handleUpdate}
        onDelete={handleDelete}
        onGenerate={handleGenerate}
        settings={settings}
        theme={theme}
        isLoading={isLoading}
        voiceHandler={voiceHandler}
        newEventTitle={newEventTitle} setNewEventTitle={setNewEventTitle}
        newEventDate={newEventDate} setNewEventDate={setNewEventDate}
        newEventType={newEventType} setNewEventType={setNewEventType}
        newEventTime={newEventTime} setNewEventTime={setNewEventTime}
        newEventPriority={newEventPriority} setNewEventPriority={setNewEventPriority}
        newEventNotes={newEventNotes} setNewEventNotes={setNewEventNotes}
        planTopic={planTopic} setPlanTopic={setPlanTopic}
        planDate={planDate} setPlanDate={setPlanDate}
        planDuration={planDuration} setPlanDuration={setPlanDuration}
        planGoals={planGoals} setPlanGoals={setPlanGoals}
      />
    </div>
  );
});