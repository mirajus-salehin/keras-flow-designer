import React, { useRef, useState } from 'react';
import { useReactFlow } from '@xyflow/react';
import {
  Undo,
  Redo,
  ZoomIn,
  ZoomOut,
  Maximize,
  Layout,
  Download,
  Upload,
  Sun,
  Moon,
  Trash2,
  FolderOpen,
  FilePlus,
  Plus,
  X,
  Edit3,
  CheckCircle2,
  HelpCircle
} from 'lucide-react';
import { useProjectStore } from '../../store/useProjectStore';
import { getLayoutedElements } from '../../features/Graph/layout';
import { exportProjectJsonFile, exportProjectZipFile, downloadTextFile } from '../../features/Export/projectExporter';
import { generateFunctionalCode, generatePyTorchCode, generateJSCode } from '../../features/TensorFlow/codeGen';

export const MainToolbar: React.FC = () => {
  const { fitView, zoomIn, zoomOut } = useReactFlow();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Zustand bindings
  const {
    metadata,
    tabs,
    activeTabId,
    nodes,
    edges,
    past,
    future,
    theme,
    autoSaveStatus,
    trainingConfig,
    datasetConfig,
    setTheme,
    createNewProject,
    loadProject,
    addTab,
    switchTab,
    closeTab,
    renameTab,
    undo,
    redo,
    clearCanvas,
    runEngine,
    saveProject
  } = useProjectStore();

  // Local state
  const [isExportDropdownOpen, setIsExportDropdownOpen] = useState(false);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [isTabRenameOpen, setIsTabRenameOpen] = useState<string | null>(null);
  const [tabRenameValue, setTabRenameValue] = useState('');
  const [newProjName, setNewProjName] = useState('');
  const [newProjDesc, setNewProjDesc] = useState('');

  const handleLayout = (direction: 'LR' | 'TB') => {
    const layouted = getLayoutedElements(nodes, edges, direction);
    useProjectStore.setState({
      nodes: layouted.nodes,
      edges: layouted.edges
    });
    runEngine();
    saveProject();
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result;
      if (typeof result === 'string') {
        loadProject(result);
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset input
  };

  const handleRenameTabSubmit = (tabId: string) => {
    if (tabRenameValue.trim()) {
      renameTab(tabId, tabRenameValue.trim());
    }
    setIsTabRenameOpen(null);
  };

  const handleCreateProjectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createNewProject(newProjName, newProjDesc);
    setIsProjectModalOpen(false);
    setNewProjName('');
    setNewProjDesc('');
  };

  return (
    <header className="h-14 border-b border-slate-200 dark:border-cyber-800 bg-white dark:bg-cyber-900 px-4 flex items-center justify-between z-10 shrink-0 shadow-sm panel-transition select-none">
      {/* Brand & Project Info */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-emerald-500 to-blue-600 flex items-center justify-center text-white font-bold shadow-md">
            K
          </div>
          <div>
            <h1 className="text-sm font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-slate-100 dark:to-slate-300 bg-clip-text text-transparent">
              Keras Flow
            </h1>
            <span className="text-[10px] text-slate-400 font-medium block -mt-1">
              v1.0.0 Stable
            </span>
          </div>
        </div>

        <div className="h-6 w-px bg-slate-200 dark:bg-cyber-800" />

        {/* Project Name and Saver Status */}
        <div className="flex items-center space-x-2">
          <span className="text-sm font-semibold text-slate-700 dark:text-slate-200 max-w-[150px] truncate">
            {metadata.name}
          </span>
          <div className="flex items-center space-x-1 bg-slate-100 dark:bg-cyber-800/60 py-0.5 px-2 rounded text-[10px] font-medium">
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                autoSaveStatus === 'Saved'
                  ? 'bg-emerald-500 shadow-sm shadow-emerald-500/50'
                  : autoSaveStatus === 'Saving...'
                  ? 'bg-amber-500 animate-pulse'
                  : 'bg-rose-500'
              }`}
            />
            <span className="text-slate-500 dark:text-slate-400 text-[10px]">
              {autoSaveStatus}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs (Middle Panel) */}
      <div className="flex-1 max-w-xl mx-4 flex items-center space-x-1.5 overflow-x-auto scrollbar-none px-2 py-1">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            onClick={() => switchTab(tab.id)}
            className={`group relative flex items-center space-x-2 py-1 px-3 rounded-lg text-xs font-semibold cursor-pointer border transition-all duration-150 ${
              tab.id === activeTabId
                ? 'bg-slate-100 dark:bg-cyber-800 border-slate-200 dark:border-cyber-700 text-slate-800 dark:text-slate-100'
                : 'bg-transparent border-transparent hover:bg-slate-50 dark:hover:bg-cyber-900/50 text-slate-500 dark:text-slate-400'
            }`}
          >
            {isTabRenameOpen === tab.id ? (
              <input
                type="text"
                autoFocus
                value={tabRenameValue}
                onChange={(e) => setTabRenameValue(e.target.value)}
                onBlur={() => handleRenameTabSubmit(tab.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleRenameTabSubmit(tab.id);
                  if (e.key === 'Escape') setIsTabRenameOpen(null);
                }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white dark:bg-cyber-900 border border-blue-500 dark:border-blue-400 rounded px-1 text-[11px] text-slate-800 dark:text-slate-200 outline-none w-16"
              />
            ) : (
              <span
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  setIsTabRenameOpen(tab.id);
                  setTabRenameValue(tab.name);
                }}
                className="truncate max-w-[80px]"
              >
                {tab.name}
              </span>
            )}
            
            {/* Rename trigger icon */}
            <Edit3
              onClick={(e) => {
                e.stopPropagation();
                setIsTabRenameOpen(tab.id);
                setTabRenameValue(tab.name);
              }}
              className="w-3 h-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 opacity-0 group-hover:opacity-100 transition-opacity duration-100"
            />

            {/* Close tab */}
            {tabs.length > 1 && (
              <X
                onClick={(e) => {
                  e.stopPropagation();
                  closeTab(tab.id);
                }}
                className="w-3 h-3 text-slate-400 hover:text-rose-500 rounded-full hover:bg-slate-200 dark:hover:bg-cyber-700 p-0.5"
              />
            )}
          </div>
        ))}
        
        <button
          onClick={() => addTab(`model_${tabs.length + 1}`)}
          className="p-1 rounded-md text-slate-400 hover:bg-slate-100 dark:hover:bg-cyber-800 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          title="Add new model tab"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Global Actions (Right Side) */}
      <div className="flex items-center space-x-2">
        {/* Undo/Redo */}
        <div className="flex items-center border border-slate-200 dark:border-cyber-800 rounded-lg p-0.5 overflow-hidden">
          <button
            onClick={undo}
            disabled={past.length === 0}
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-cyber-800 text-slate-500 dark:text-slate-400 disabled:opacity-30 disabled:hover:bg-transparent rounded-md transition-colors"
            title="Undo (Ctrl+Z)"
          >
            <Undo className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={redo}
            disabled={future.length === 0}
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-cyber-800 text-slate-500 dark:text-slate-400 disabled:opacity-30 disabled:hover:bg-transparent rounded-md transition-colors"
            title="Redo (Ctrl+Y)"
          >
            <Redo className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Canvas Controls */}
        <div className="flex items-center border border-slate-200 dark:border-cyber-800 rounded-lg p-0.5 overflow-hidden">
          <button
            onClick={() => zoomIn()}
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-cyber-800 text-slate-500 dark:text-slate-400 rounded-md transition-colors"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => zoomOut()}
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-cyber-800 text-slate-500 dark:text-slate-400 rounded-md transition-colors"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => fitView({ duration: 300 })}
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-cyber-800 text-slate-500 dark:text-slate-400 rounded-md transition-colors"
            title="Zoom to Fit"
          >
            <Maximize className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Auto Layout */}
        <button
          onClick={() => handleLayout('LR')}
          className="p-2 border border-slate-200 dark:border-cyber-800 hover:bg-slate-100 dark:hover:bg-cyber-800 text-slate-500 dark:text-slate-400 rounded-lg transition-colors flex items-center space-x-1 text-xs font-semibold"
          title="Auto layout graph topology"
        >
          <Layout className="w-3.5 h-3.5" />
          <span>Auto Layout</span>
        </button>

        {/* Project Operations */}
        <div className="h-6 w-px bg-slate-200 dark:bg-cyber-800" />

        <button
          onClick={() => setIsProjectModalOpen(true)}
          className="p-2 hover:bg-slate-100 dark:hover:bg-cyber-800 text-slate-500 dark:text-slate-400 rounded-lg transition-colors"
          title="New Project"
        >
          <FilePlus className="w-4 h-4" />
        </button>

        <button
          onClick={handleImportClick}
          className="p-2 hover:bg-slate-100 dark:hover:bg-cyber-800 text-slate-500 dark:text-slate-400 rounded-lg transition-colors"
          title="Import Project JSON"
        >
          <Upload className="w-4 h-4" />
        </button>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".json"
          className="hidden"
        />

        {/* Export dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsExportDropdownOpen(!isExportDropdownOpen)}
            className="p-2 bg-gradient-to-tr from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-lg transition-all shadow-sm flex items-center space-x-1.5 text-xs font-bold"
            title="Export model code and files"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export</span>
          </button>
          
          {isExportDropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-20"
                onClick={() => setIsExportDropdownOpen(false)}
              />
              <div className="absolute right-0 mt-2 w-52 bg-white dark:bg-cyber-900 border border-slate-200 dark:border-cyber-800 rounded-lg shadow-xl py-1 z-30 animate-in fade-in slide-in-from-top-2 duration-100">
                <button
                  onClick={() => {
                    const code = generateFunctionalCode(nodes, edges);
                    downloadTextFile(code, `${metadata.name.replace(/\s+/g, '_')}_model.py`);
                    setIsExportDropdownOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-cyber-800 transition-colors"
                >
                  Export Python (Keras API)
                </button>
                <button
                  onClick={() => {
                    const code = generatePyTorchCode(nodes, edges);
                    downloadTextFile(code, `${metadata.name.replace(/\s+/g, '_')}_pytorch.py`);
                    setIsExportDropdownOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-cyber-800 transition-colors"
                >
                  Export PyTorch (nn.Module)
                </button>
                <button
                  onClick={() => {
                    const code = generateJSCode(nodes, edges);
                    downloadTextFile(code, `${metadata.name.replace(/\s+/g, '_')}_tfjs.js`);
                    setIsExportDropdownOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-cyber-800 transition-colors"
                >
                  Export TensorFlow.js
                </button>
                <div className="h-px bg-slate-100 dark:bg-cyber-800 my-1" />
                <button
                  onClick={() => {
                    exportProjectJsonFile(metadata, tabs, activeTabId, trainingConfig, datasetConfig);
                    setIsExportDropdownOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-cyber-800 transition-colors"
                >
                  Export Project Graph (.json)
                </button>
                <button
                  onClick={() => {
                    exportProjectZipFile(metadata, nodes, edges, trainingConfig, datasetConfig, tabs);
                    setIsExportDropdownOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:bg-slate-50 dark:hover:bg-cyber-800 transition-colors flex items-center space-x-1.5"
                >
                  <span>Export Full Workspace (.ZIP)</span>
                </button>
              </div>
            </>
          )}
        </div>

        {/* Clear Workspace */}
        <button
          onClick={() => {
            if (confirm('Are you sure you want to clear the canvas? All layers will be deleted.')) {
              clearCanvas();
            }
          }}
          className="p-2 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-slate-400 hover:text-rose-500 rounded-lg transition-colors"
          title="Clear Canvas"
        >
          <Trash2 className="w-4 h-4" />
        </button>

        <div className="h-6 w-px bg-slate-200 dark:bg-cyber-800" />

        {/* Theme Toggle */}
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="p-2 hover:bg-slate-100 dark:hover:bg-cyber-800 text-slate-500 dark:text-slate-400 rounded-lg transition-colors"
          title="Toggle Theme"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
      </div>

      {/* New Project Modal */}
      {isProjectModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-cyber-900 border border-slate-200 dark:border-cyber-800 w-full max-w-md rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-cyber-800 flex justify-between items-center bg-slate-50 dark:bg-cyber-900/50">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Create New Project</h3>
              <button
                onClick={() => setIsProjectModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <form onSubmit={handleCreateProjectSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Project Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. My Image Classifier"
                  value={newProjName}
                  onChange={(e) => setNewProjName(e.target.value)}
                  className="w-full text-xs font-semibold bg-slate-50 dark:bg-cyber-950 border border-slate-200 dark:border-cyber-800 rounded-lg px-3 py-2 text-slate-800 dark:text-slate-100 focus:border-blue-500 outline-none"
                />
              </div>
              
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Description
                </label>
                <textarea
                  placeholder="Describe your model goal..."
                  rows={3}
                  value={newProjDesc}
                  onChange={(e) => setNewProjDesc(e.target.value)}
                  className="w-full text-xs font-semibold bg-slate-50 dark:bg-cyber-950 border border-slate-200 dark:border-cyber-800 rounded-lg px-3 py-2 text-slate-800 dark:text-slate-100 focus:border-blue-500 outline-none resize-none"
                />
              </div>

              <div className="flex space-x-3 pt-2 justify-end">
                <button
                  type="button"
                  onClick={() => setIsProjectModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-cyber-850 hover:bg-slate-50 dark:hover:bg-cyber-800 text-xs font-semibold rounded-lg text-slate-600 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-sm"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </header>
  );
};
