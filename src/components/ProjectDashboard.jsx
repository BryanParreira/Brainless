import React from 'react';
import { useLumina } from '../context/LuminaContext';
import { Folder, File, Globe, GitBranch, Upload, FolderPlus, Hash, Layout } from 'lucide-react';
import clsx from 'clsx';

export const ProjectDashboard = () => {
  const { activeProject, gitStatus, addFiles, addFolder, addUrl, theme, settings } = useLumina();
  if (!activeProject) return <div className="flex items-center justify-center h-full text-gray-500 font-mono text-xs tracking-widest uppercase">Select a project context</div>;

  return (
    <div className="flex-1 h-full overflow-y-auto custom-scrollbar p-8 bg-[#030304] relative">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex items-end justify-between border-b border-white/5 pb-6">
          <div className="space-y-2">
             <div className={`inline-flex items-center gap-2 px-2 py-1 rounded-md bg-white/5 border border-white/5 text-[10px] font-bold uppercase tracking-widest ${theme.accentText}`}><Layout size={10} /> Project Overview</div>
             <h1 className="text-4xl font-bold text-white tracking-tight flex items-center gap-3">{activeProject.name}</h1>
             <p className="text-sm text-gray-500 font-mono flex items-center gap-2"><Folder size={12} />{activeProject.rootPath || "Virtual Context Container"}</p>
          </div>
          <div className="flex gap-2">
             <button onClick={addFiles} className="flex items-center gap-2 px-4 py-2 bg-[#111] hover:bg-[#1a1a1a] border border-white/10 rounded-xl text-xs font-medium text-gray-300 hover:text-white transition-all group"><Upload size={14} className="text-gray-500 group-hover:text-white transition-colors"/> Add File</button>
             <button onClick={addFolder} className={`flex items-center gap-2 px-4 py-2 bg-[#111] hover:bg-[#1a1a1a] border border-white/10 rounded-xl text-xs font-medium ${theme.accentText} transition-all group`}><FolderPlus size={14} /> Add Folder</button>
             <button onClick={addUrl} className="flex items-center gap-2 px-4 py-2 bg-[#111] hover:bg-[#1a1a1a] border border-white/10 rounded-xl text-xs font-medium text-blue-400 hover:text-blue-300 transition-all"><Globe size={14} /> Add Link</button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
           {settings.developerMode && (
             <div className="col-span-1 space-y-4">
                <div className={`p-6 rounded-2xl bg-[#0A0A0A] border border-white/5 shadow-2xl relative overflow-hidden group`}>
                  <div className={`absolute top-0 left-0 w-full h-1 ${theme.primaryBg} opacity-50`}></div>
                  <div className="flex justify-between items-start mb-6"><h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2"><GitBranch size={14} className={theme.accentText}/> Repository</h3>{gitStatus && <span className={`text-[10px] px-2 py-0.5 rounded-full bg-white/5 border border-white/5 ${theme.accentText} font-mono`}>{gitStatus.current}</span>}</div>
                  {gitStatus ? ( <div className="space-y-4"><div className="flex justify-between items-center p-3 bg-[#111] rounded-lg border border-white/5"><span className="text-xs text-gray-400">Modified</span><span className="text-xs font-mono text-orange-400 font-bold">{gitStatus.modified.length}</span></div><div className="flex justify-between items-center p-3 bg-[#111] rounded-lg border border-white/5"><span className="text-xs text-gray-400">Staged</span><span className="text-xs font-mono text-emerald-400 font-bold">{gitStatus.staged.length}</span></div><div className="pt-2"><div className="flex items-center gap-2 text-[10px] text-gray-500"><div className={`w-2 h-2 rounded-full ${gitStatus.clean ? 'bg-emerald-500' : 'bg-orange-500 animate-pulse'}`}></div>{gitStatus.clean ? "Working tree clean" : "Uncommitted changes present"}</div></div></div> ) : ( <div className="text-center py-8 text-gray-600 text-xs border-2 border-dashed border-white/5 rounded-xl">No Git repository detected.</div> )}
                </div>
                <div className="p-6 rounded-2xl bg-[#0A0A0A] border border-white/5 shadow-xl"><h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2"><Hash size={14}/> Context Stats</h3><div className="grid grid-cols-2 gap-4"><div><div className="text-2xl font-bold text-white">{activeProject.files.length}</div><div className="text-[10px] text-gray-500 uppercase tracking-wide">Total Files</div></div><div><div className="text-2xl font-bold text-white">{activeProject.files.filter(f => f.type === 'url').length}</div><div className="text-[10px] text-gray-500 uppercase tracking-wide">Web Links</div></div></div></div>
             </div>
           )}
           <div className={clsx("p-6 rounded-2xl bg-[#0A0A0A] border border-white/5 shadow-2xl flex flex-col h-[500px]", settings.developerMode ? "col-span-2" : "col-span-3")}>
              <div className="flex justify-between items-center mb-6"><h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2"><File size={14} className="text-blue-400"/> Knowledge Index</h3><span className="text-[10px] text-gray-600 bg-[#151515] px-2 py-1 rounded">Last synced: Just now</span></div>
              {activeProject.files.length === 0 ? ( <div className="flex-1 flex flex-col items-center justify-center text-gray-600 border-2 border-dashed border-white/5 rounded-xl"><FolderPlus size={32} className="mb-2 opacity-20" /><p className="text-xs">Project is empty.</p><button onClick={addFiles} className={`mt-2 text-xs ${theme.accentText} hover:underline`}>Add files to start</button></div> ) : ( <div className="flex-1 overflow-y-auto custom-scrollbar space-y-1 pr-2">{activeProject.files.map((file, i) => ( <div key={i} className="flex items-center justify-between p-3 hover:bg-white/5 rounded-xl group transition-all border border-transparent hover:border-white/5"><div className="flex items-center gap-4 overflow-hidden"><div className={`p-2 rounded-lg ${file.type === 'url' ? 'bg-blue-500/10 text-blue-400' : 'bg-gray-800 text-gray-400'}`}>{file.type === 'url' ? <Globe size={14} /> : <File size={14} />}</div><div className="flex flex-col min-w-0"><span className="text-sm text-gray-200 truncate font-medium">{file.name}</span><span className="text-[10px] text-gray-600 truncate font-mono">{file.path}</span></div></div><div className="flex items-center gap-3"><span className="text-[10px] text-gray-600 font-mono bg-black px-2 py-1 rounded border border-white/5 uppercase">{file.type || "FILE"}</span></div></div> ))}</div> )}
           </div>
        </div>
      </div>
    </div>
  );
};