import React, { useState, useEffect } from 'react';
import { useLumina } from '../context/LuminaContext';
import { X, Save, Server, Cpu, Brain, Sliders, Monitor, Type, Database, Terminal, BookOpen, Shield, Zap, Check, ChevronDown, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const Settings = ({ isOpen, onClose }) => {
  const { settings, updateSettings, availableModels, refreshModels, factoryReset } = useLumina();
  const [form, setForm] = useState(settings);
  const [activeTab, setActiveTab] = useState('capabilities');
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => { setForm(settings); }, [settings]);

  // Local theme calculation for immediate feedback
  const isDev = form.developerMode;
  const localTheme = {
    accent: isDev ? 'text-rose-400' : 'text-indigo-400',
    bg: isDev ? 'bg-rose-600' : 'bg-indigo-600',
    border: isDev ? 'focus:border-rose-500/50 focus:ring-rose-500/20' : 'focus:border-indigo-500/50 focus:ring-indigo-500/20',
    glow: isDev ? 'shadow-rose-500/20' : 'shadow-indigo-500/20',
  };

  const handleSave = () => { updateSettings(form); onClose(); };
  const handleRefresh = async () => { setIsRefreshing(true); await refreshModels(); setTimeout(() => setIsRefreshing(false), 800); };
  
  const handleReset = () => {
    if (confirm("Are you sure? This will delete ALL chats and projects.")) {
      factoryReset();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-xl z-[100] flex items-center justify-center p-4 sm:p-8 animate-fade-in">
      <div className="bg-[#030304] w-full max-w-5xl h-[750px] max-h-[90vh] rounded-3xl border border-white/10 shadow-2xl flex flex-col overflow-hidden relative">
        
        <div className="absolute inset-0 bg-noise opacity-20 pointer-events-none"></div>
        <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-${isDev ? 'rose' : 'indigo'}-500 to-transparent opacity-50`}></div>

        <div className="flex items-center justify-between px-8 py-6 border-b border-white/5 bg-[#050505] relative z-10">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg bg-white/5 border border-white/5 ${localTheme.accent}`}><Sliders size={18} /></div>
            <div><h2 className="text-lg font-bold text-white tracking-tight">System Configuration</h2><p className="text-xs text-gray-500 font-mono uppercase tracking-wider">Lumina {isDev ? 'Prime' : 'Core'} OS</p></div>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 text-gray-500 hover:text-white transition-colors"><X size={20} /></button>
        </div>

        <div className="flex flex-1 overflow-hidden relative z-10">
          <div className="w-64 border-r border-white/5 bg-[#020202] p-4 flex flex-col gap-1">
             <NavButton active={activeTab === 'capabilities'} onClick={() => setActiveTab('capabilities')} icon={Terminal} label="Capabilities" desc="Modes & Personas" theme={localTheme} />
             <NavButton active={activeTab === 'neural'} onClick={() => setActiveTab('neural')} icon={Brain} label="Neural Engine" desc="LLM & Connection" theme={localTheme} />
             <NavButton active={activeTab === 'interface'} onClick={() => setActiveTab('interface')} icon={Monitor} label="Interface" desc="Visuals & Layout" theme={localTheme} />
             <NavButton active={activeTab === 'data'} onClick={() => setActiveTab('data')} icon={Database} label="Data Management" desc="Storage & Reset" theme={localTheme} />
          </div>

          <div className="flex-1 p-10 overflow-y-auto custom-scrollbar bg-[#050505]">
            {activeTab === 'capabilities' && (
               <div className="space-y-8 max-w-2xl animate-enter">
                 <div>
                    <h3 className="text-lg font-medium text-white mb-1">Operating Mode</h3>
                    <p className="text-sm text-gray-500 mb-6">Select the primary function of the neural engine.</p>
                    <div className="grid grid-cols-2 gap-4">
                       <ModeCard active={!form.developerMode} onClick={() => setForm({...form, developerMode: false})} icon={BookOpen} title="Student Core" desc="Optimized for learning, summarizing, and essay writing." theme="indigo" />
                       <ModeCard active={form.developerMode} onClick={() => setForm({...form, developerMode: true})} icon={Zap} title="Developer Prime" desc="Unlocks Git integration, Code Analysis, and Security tools." theme="rose" />
                    </div>
                 </div>
               </div>
            )}

            {/* (Other tabs same as previous, using localTheme...) */}
            {activeTab === 'neural' && (
              <div className="space-y-8 max-w-2xl animate-enter">
                <Section title="Ollama Connection" icon={Server} theme={localTheme}>
                  <InputGroup label="API Endpoint" desc="Address of the Ollama instance."><div className="relative"><input value={form.ollamaUrl} onChange={e => setForm({...form, ollamaUrl: e.target.value})} className={`w-full bg-[#0A0A0A] border border-white/10 rounded-xl p-3 text-white text-sm focus:outline-none focus:ring-1 transition-all ${localTheme.border}`} /><div className="absolute right-3 top-3.5 flex items-center gap-2"><div className="w-2 h-2 bg-emerald-500 rounded-full"></div></div></div></InputGroup>
                </Section>
                <Section title="Model Parameters" icon={Cpu} theme={localTheme}>
                  <InputGroup label="Active Model" desc="Select the LLM."><div className="flex gap-2"><div className="relative flex-1"><select value={form.defaultModel} onChange={e => setForm({...form, defaultModel: e.target.value})} className={`w-full bg-[#0A0A0A] border border-white/10 rounded-xl p-3 text-white text-sm appearance-none focus:outline-none focus:ring-1 transition-all ${localTheme.border}`}>{availableModels.length > 0 ? availableModels.map(m => <option key={m} value={m}>{m}</option>) : <option>No models detected</option>}</select><ChevronDown size={14} className="absolute right-4 top-4 text-gray-500 pointer-events-none" /></div><button onClick={handleRefresh} className="bg-white/5 border border-white/10 rounded-xl px-4 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"><RefreshCw size={18} className={isRefreshing ? "animate-spin text-indigo-500" : ""} /></button></div></InputGroup>
                  <div className="grid grid-cols-2 gap-6"><InputGroup label="Context Window" desc="Memory capacity (tokens)."><select value={form.contextLength} onChange={e => setForm({...form, contextLength: parseInt(e.target.value)})} className={`w-full bg-[#0A0A0A] border border-white/10 rounded-xl p-3 text-white text-sm appearance-none focus:outline-none focus:ring-1 transition-all ${localTheme.border}`}><option value="4096">4,096 (Fast)</option><option value="8192">8,192 (Standard)</option><option value="16384">16,384 (Large)</option></select></InputGroup><InputGroup label={`Temperature: ${form.temperature}`} desc="Randomness vs Precision."><input type="range" min="0" max="1" step="0.1" value={form.temperature} onChange={e => setForm({...form, temperature: parseFloat(e.target.value)})} className={`w-full h-1.5 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-${isDev ? 'rose' : 'indigo'}-500 mt-4`} /></InputGroup></div>
                </Section>
              </div>
            )}
            
            {activeTab === 'interface' && (
               <div className="space-y-8 max-w-2xl animate-enter">
                  <Section title="Appearance" icon={Type} theme={localTheme}>
                     <InputGroup label={`Font Size: ${form.fontSize || 14}px`} desc="Chat readability size."><div className="flex items-center gap-4"><span className="text-xs text-gray-500">Aa</span><input type="range" min="12" max="20" step="1" value={form.fontSize || 14} onChange={e => setForm({...form, fontSize: parseInt(e.target.value)})} className={`flex-1 h-1.5 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-${isDev ? 'rose' : 'indigo'}-500`} /><span className="text-lg text-white">Aa</span></div></InputGroup>
                  </Section>
               </div>
            )}

            {activeTab === 'data' && (
               <div className="space-y-8 max-w-2xl animate-enter">
                  <Section title="Danger Zone" icon={Database} theme={localTheme}>
                     <div className="p-5 border border-red-500/20 bg-red-500/5 rounded-xl flex items-center justify-between"><div><h4 className="text-red-400 font-bold text-sm">Factory Reset</h4><p className="text-red-400/60 text-xs mt-1">Deletes all chats, vectors, and project links.</p></div><button onClick={handleReset} className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 rounded-lg text-xs font-bold transition-colors">Reset System</button></div>
                  </Section>
               </div>
            )}

          </div>
        </div>

        <div className="p-6 border-t border-white/5 bg-[#020202] flex justify-between items-center">
          <div className="text-[10px] text-gray-600 font-mono">v2.0.1-stable</div>
          <div className="flex gap-3"><button onClick={onClose} className="px-5 py-2.5 text-gray-400 hover:text-white text-xs font-medium transition-colors">Discard</button><button onClick={handleSave} className={`px-8 py-2.5 rounded-xl text-xs font-bold text-white shadow-lg hover:opacity-90 transition-all flex items-center gap-2 ${localTheme.bg} ${localTheme.glow}`}><Save size={14} /> Save Changes</button></div>
        </div>

      </div>
    </div>
  );
};

const NavButton = ({ active, onClick, icon: Icon, label, desc, theme }) => (<button onClick={onClick} className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl text-left transition-all duration-300 group ${active ? 'bg-[#111] border border-white/5' : 'hover:bg-white/5 border border-transparent'}`}><div className={`p-2.5 rounded-lg transition-colors ${active ? `${theme.bg} text-white` : 'bg-[#151515] text-gray-500 group-hover:text-gray-300'}`}><Icon size={18} /></div><div><div className={`text-xs font-bold transition-colors ${active ? 'text-white' : 'text-gray-400 group-hover:text-gray-200'}`}>{label}</div><div className="text-[10px] text-gray-600 group-hover:text-gray-500">{desc}</div></div></button>);
const ModeCard = ({ active, onClick, icon: Icon, title, desc, theme }) => (<button onClick={onClick} className={`relative p-5 rounded-2xl border text-left transition-all duration-300 ${active ? `bg-white/5 border-${theme}-500/50 ring-1 ring-${theme}-500/50` : 'bg-[#0A0A0A] border-white/5 hover:border-white/10 hover:bg-white/5'}`}>{active && <div className={`absolute top-3 right-3 text-${theme}-500`}><Check size={16} /></div>}<div className={`p-3 rounded-xl w-fit mb-3 ${active ? `bg-${theme}-500 text-white` : 'bg-[#151515] text-gray-500'}`}><Icon size={20} /></div><h4 className="text-sm font-bold text-white">{title}</h4><p className="text-xs text-gray-500 mt-1 leading-relaxed">{desc}</p></button>);
const Section = ({ title, icon: Icon, children, theme }) => (<div className="mb-8"><div className="flex items-center gap-2 text-gray-400 font-bold text-xs uppercase tracking-widest mb-5"><Icon size={14} className={theme.accent}/> {title}</div><div className="space-y-5">{children}</div></div>);
const InputGroup = ({ label, desc, children }) => (<div><div className="flex justify-between items-baseline mb-2.5"><label className="block text-xs font-semibold text-gray-300">{label}</label></div>{children}{desc && <p className="text-[10px] text-gray-500 mt-2 ml-1">{desc}</p>}</div>);