import React, { useMemo, useCallback } from 'react';
import { useLumina } from '../context/LuminaContext';
import { Folder, File, Globe, GitBranch, Upload, FolderPlus, Hash, Layout } from 'lucide-react';
import clsx from 'clsx';

const FileItem = React.memo(({ file, index, theme }) => (
  <div
    key={`${file.path}-${index}`}
    className="flex items-center justify-between p-3 hover:bg-white/5 rounded-xl group transition-all border border-transparent hover:border-white/5"
  >
    <div className="flex items-center gap-4 overflow-hidden">
      <div
        className={`p-2 rounded-lg shrink-0 ${
          file.type === 'url'
            ? 'bg-blue-500/10 text-blue-400'
            : 'bg-gray-800 text-gray-400'
        }`}
      >
        {file.type === 'url' ? <Globe size={14} /> : <File size={14} />}
      </div>
      <div className="flex flex-col min-w-0">
        <span className="text-sm text-gray-200 truncate font-medium" title={file.name}>
          {file.name}
        </span>
        <span className="text-[10px] text-gray-600 truncate font-mono" title={file.path}>
          {file.path}
        </span>
      </div>
    </div>
    <div className="flex items-center gap-3">
      <span className="text-[10px] text-gray-600 font-mono bg-black px-2 py-1 rounded border border-white/5 uppercase shrink-0">
        {file.type || "FILE"}
      </span>
    </div>
  </div>
));

FileItem.displayName = 'FileItem';

const GitStatusCard = React.memo(({ gitStatus, theme }) => (
  <div className="p-6 rounded-2xl bg-[#0A0A0A] border border-white/5 shadow-2xl relative overflow-hidden group">
    <div className={`absolute top-0 left-0 w-full h-1 opacity-50`} style={{
      background: 'linear-gradient(to right, transparent, rgb(251, 146, 60), transparent)'
    }}></div>
    <div className="flex justify-between items-start mb-6">
      <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
        <GitBranch size={14} className={theme.accentText} /> Repository
      </h3>
      {gitStatus && (
        <span className={`text-[10px] px-2 py-0.5 rounded-full bg-white/5 border border-white/5 ${theme.accentText} font-mono`}>
          {gitStatus.current}
        </span>
      )}
    </div>
    {gitStatus ? (
      <div className="space-y-4">
        <div className="flex justify-between items-center p-3 bg-[#111] rounded-lg border border-white/5">
          <span className="text-xs text-gray-400">Modified</span>
          <span className="text-xs font-mono text-orange-400 font-bold">
            {gitStatus.modified?.length || 0}
          </span>
        </div>
        <div className="flex justify-between items-center p-3 bg-[#111] rounded-lg border border-white/5">
          <span className="text-xs text-gray-400">Staged</span>
          <span className="text-xs font-mono text-emerald-400 font-bold">
            {gitStatus.staged?.length || 0}
          </span>
        </div>
        <div className="pt-2">
          <div className="flex items-center gap-2 text-[10px] text-gray-500">
            <div
              className={`w-2 h-2 rounded-full ${
                gitStatus.clean ? 'bg-emerald-500' : 'bg-orange-500 animate-pulse'
              }`}
              aria-hidden="true"
            ></div>
            {gitStatus.clean ? "Working tree clean" : "Uncommitted changes present"}
          </div>
        </div>
      </div>
    ) : (
      <div className="text-center py-8 text-gray-600 text-xs border-2 border-dashed border-white/5 rounded-xl">
        No Git repository detected.
      </div>
    )}
  </div>
));

GitStatusCard.displayName = 'GitStatusCard';

const ContextStatsCard = React.memo(({ activeProject, theme }) => (
  <div className="p-6 rounded-2xl bg-[#0A0A0A] border border-white/5 shadow-xl">
    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
      <Hash size={14} /> Context Stats
    </h3>
    <div className="grid grid-cols-2 gap-4">
      <div>
        <div className="text-2xl font-bold text-white">{activeProject?.files?.length || 0}</div>
        <div className="text-[10px] text-gray-500 uppercase tracking-wide">Total Files</div>
      </div>
      <div>
        <div className="text-2xl font-bold text-white">
          {activeProject?.files?.filter(f => f.type === 'url')?.length || 0}
        </div>
        <div className="text-[10px] text-gray-500 uppercase tracking-wide">Web Links</div>
      </div>
    </div>
  </div>
));

ContextStatsCard.displayName = 'ContextStatsCard';

const EmptyState = React.memo(({ addFiles, theme }) => (
  <div className="flex-1 flex flex-col items-center justify-center text-gray-600 border-2 border-dashed border-white/5 rounded-xl py-16">
    <FolderPlus size={32} className="mb-3 opacity-20" />
    <p className="text-xs font-medium mb-2">Project is empty</p>
    <button
      onClick={addFiles}
      className={`text-xs ${theme.accentText} hover:underline font-medium`}
      aria-label="Add files to start"
    >
      Add files to start
    </button>
  </div>
));

EmptyState.displayName = 'EmptyState';

export const ProjectDashboard = React.memo(() => {
  const { activeProject, gitStatus, addFiles, addFolder, addUrl, theme, settings } = useLumina();

  // Memoize file list rendering
  const fileList = useMemo(
    () => activeProject?.files || [],
    [activeProject?.files]
  );

  const urlCount = useMemo(
    () => fileList.filter(f => f.type === 'url').length,
    [fileList]
  );

  if (!activeProject) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500 font-mono text-xs tracking-widest uppercase">
        Select a project context
      </div>
    );
  }

  return (
    <div className="flex-1 h-full overflow-y-auto custom-scrollbar p-8 bg-[#030304] relative">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-end justify-between border-b border-white/5 pb-6">
          <div className="space-y-2">
            <div
              className={`inline-flex items-center gap-2 px-2 py-1 rounded-md bg-white/5 border border-white/5 text-[10px] font-bold uppercase tracking-widest ${theme.accentText}`}
            >
              <Layout size={10} /> Project Overview
            </div>
            <h1 className="text-4xl font-bold text-white tracking-tight flex items-center gap-3">
              {activeProject.name}
            </h1>
            <p className="text-sm text-gray-500 font-mono flex items-center gap-2">
              <Folder size={12} />
              {activeProject.rootPath || "Virtual Context Container"}
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={addFiles}
              className="flex items-center gap-2 px-4 py-2 bg-[#111] hover:bg-[#1a1a1a] border border-white/10 rounded-xl text-xs font-medium text-gray-300 hover:text-white transition-all group"
              aria-label="Add files to project"
            >
              <Upload size={14} className="text-gray-500 group-hover:text-white transition-colors" />
              Add File
            </button>
            <button
              onClick={addFolder}
              className={`flex items-center gap-2 px-4 py-2 bg-[#111] hover:bg-[#1a1a1a] border border-white/10 rounded-xl text-xs font-medium ${theme.accentText} transition-all group`}
              aria-label="Add folder to project"
            >
              <FolderPlus size={14} />
              Add Folder
            </button>
            <button
              onClick={addUrl}
              className="flex items-center gap-2 px-4 py-2 bg-[#111] hover:bg-[#1a1a1a] border border-white/10 rounded-xl text-xs font-medium text-blue-400 hover:text-blue-300 transition-all"
              aria-label="Add URL to project"
            >
              <Globe size={14} />
              Add Link
            </button>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sidebar: Git Status & Stats */}
          {settings.developerMode && (
            <div className="col-span-1 space-y-4">
              <GitStatusCard gitStatus={gitStatus} theme={theme} />
              <ContextStatsCard activeProject={activeProject} theme={theme} />
            </div>
          )}

          {/* Main: Knowledge Index */}
          <div
            className={clsx(
              "p-6 rounded-2xl bg-[#0A0A0A] border border-white/5 shadow-2xl flex flex-col",
              settings.developerMode ? "col-span-2 h-[500px]" : "col-span-3 h-[500px]"
            )}
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                <File size={14} className="text-blue-400" /> Knowledge Index
              </h3>
              <span className="text-[10px] text-gray-600 bg-[#151515] px-2 py-1 rounded">
                Last synced: Just now
              </span>
            </div>

            {fileList.length === 0 ? (
              <EmptyState addFiles={addFiles} theme={theme} />
            ) : (
              <div className="flex-1 overflow-y-auto custom-scrollbar space-y-1 pr-2">
                {fileList.map((file, index) => (
                  <FileItem key={`${file.path}-${index}`} file={file} index={index} theme={theme} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

ProjectDashboard.displayName = 'ProjectDashboard';