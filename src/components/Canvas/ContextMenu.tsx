import React, { useState } from 'react';
import { Copy, Trash2, Clipboard, StickyNote, Box, Layout, Search, Layers } from 'lucide-react';
import { useProjectStore } from '../../store/useProjectStore';
import { LAYER_DEFINITIONS } from '../../utils/layerDefinitions';

interface ContextMenuProps {
  x: number;
  y: number;
  canvasX: number;
  canvasY: number;
  nodeId: string | null;
  onClose: () => void;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({
  x,
  y,
  canvasX,
  canvasY,
  nodeId,
  onClose,
}) => {
  const {
    nodes,
    deleteNode,
    duplicateNode,
    toggleNodeCollapse,
    addNode,
    addCommentNode,
    addGroupNode,
    runEngine,
    saveProject
  } = useProjectStore();

  const [showNodeSpawnList, setShowNodeSpawnList] = useState(false);
  const [nodeSearch, setNodeSearch] = useState('');

  // Clipboard backing (using a static global variable or session/local storage for copy-paste)
  const handleCopy = () => {
    if (!nodeId) return;
    localStorage.setItem('keras_flow_clipboard_node', nodeId);
    onClose();
  };

  const handlePaste = () => {
    const copiedId = localStorage.getItem('keras_flow_clipboard_node');
    if (!copiedId) return;
    const nodeToPaste = nodes.find(n => n.id === copiedId);
    if (!nodeToPaste) return;

    // Create copy with new ID and shifted coords
    const newId = `${nodeToPaste.data.layerType.toLowerCase()}_${crypto.randomUUID().slice(0, 6)}`;
    const newParams = { ...nodeToPaste.data.params };
    if (newParams.name) {
      newParams.name = `${newParams.name}_paste`;
    }

    const pastedNode = {
      ...nodeToPaste,
      id: newId,
      position: { x: canvasX, y: canvasY },
      selected: false,
      data: {
        ...nodeToPaste.data,
        params: newParams,
        errors: []
      }
    };

    useProjectStore.setState({
      nodes: [...nodes, pastedNode]
    });
    runEngine();
    saveProject();
    onClose();
  };

  const handleDuplicate = () => {
    if (nodeId) {
      duplicateNode(nodeId);
    }
    onClose();
  };

  const handleDelete = () => {
    if (nodeId) {
      deleteNode(nodeId);
    }
    onClose();
  };

  const handleToggleCollapse = () => {
    if (nodeId) {
      toggleNodeCollapse(nodeId);
    }
    onClose();
  };

  const handleSpawnLayer = (layerType: string) => {
    addNode(layerType, canvasX, canvasY);
    onClose();
  };

  // Filtered Keras layers list for quick add
  const filteredLayers = Object.keys(LAYER_DEFINITIONS).filter(type =>
    type.toLowerCase().includes(nodeSearch.toLowerCase())
  );

  return (
    <div
      style={{ top: y, left: x }}
      className="absolute bg-white dark:bg-cyber-900 border border-slate-200 dark:border-cyber-800 rounded-lg shadow-xl py-1 w-56 z-50 animate-in fade-in zoom-in-95 duration-100 font-sans select-none text-xs"
    >
      {nodeId ? (
        // --- NODE COMMANDS ---
        <>
          <button
            onClick={handleCopy}
            className="w-full text-left px-4 py-2 hover:bg-slate-50 dark:hover:bg-cyber-850 text-slate-700 dark:text-slate-200 flex items-center space-x-2 font-semibold"
          >
            <span>Copy Layer</span>
          </button>
          <button
            onClick={handleDuplicate}
            className="w-full text-left px-4 py-2 hover:bg-slate-50 dark:hover:bg-cyber-850 text-slate-700 dark:text-slate-200 flex items-center space-x-2 font-semibold"
          >
            <span>Duplicate</span>
          </button>
          <button
            onClick={handleToggleCollapse}
            className="w-full text-left px-4 py-2 hover:bg-slate-50 dark:hover:bg-cyber-850 text-slate-700 dark:text-slate-200 flex items-center space-x-2 font-semibold"
          >
            <span>Toggle Collapse</span>
          </button>
          <div className="h-px bg-slate-100 dark:bg-cyber-850 my-1" />
          <button
            onClick={handleDelete}
            className="w-full text-left px-4 py-2 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-rose-600 dark:text-rose-400 flex items-center space-x-2 font-bold"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete</span>
          </button>
        </>
      ) : (
        // --- CANVAS COMMANDS ---
        <>
          {!showNodeSpawnList ? (
            <>
              <button
                onClick={() => setShowNodeSpawnList(true)}
                className="w-full text-left px-4 py-2 hover:bg-slate-50 dark:hover:bg-cyber-850 text-slate-700 dark:text-slate-200 flex items-center justify-between font-semibold"
              >
                <div className="flex items-center space-x-2">
                  <Layers className="w-3.5 h-3.5 text-blue-500" />
                  <span>Add Layer Node...</span>
                </div>
                <span className="text-[9px] text-slate-400">►</span>
              </button>

              <button
                onClick={() => {
                  addCommentNode(canvasX, canvasY);
                  onClose();
                }}
                className="w-full text-left px-4 py-2 hover:bg-slate-50 dark:hover:bg-cyber-850 text-slate-700 dark:text-slate-200 flex items-center space-x-2 font-semibold"
              >
                <StickyNote className="w-3.5 h-3.5 text-yellow-500" />
                <span>Add Sticky Note</span>
              </button>

              <button
                onClick={() => {
                  addGroupNode(canvasX, canvasY);
                  onClose();
                }}
                className="w-full text-left px-4 py-2 hover:bg-slate-50 dark:hover:bg-cyber-850 text-slate-700 dark:text-slate-200 flex items-center space-x-2 font-semibold"
              >
                <Box className="w-3.5 h-3.5 text-purple-500" />
                <span>Add Group Container</span>
              </button>

              <div className="h-px bg-slate-100 dark:bg-cyber-850 my-1" />

              <button
                disabled={!localStorage.getItem('keras_flow_clipboard_node')}
                onClick={handlePaste}
                className="w-full text-left px-4 py-2 hover:bg-slate-50 dark:hover:bg-cyber-850 text-slate-700 dark:text-slate-200 disabled:opacity-30 flex items-center space-x-2 font-semibold"
              >
                <Clipboard className="w-3.5 h-3.5" />
                <span>Paste Layer</span>
              </button>
            </>
          ) : (
            // --- QUICK LAYER SPAWN PANEL ---
            <div className="px-2 py-1 flex flex-col max-h-72">
              <div className="relative mb-2 shrink-0">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2 top-2" />
                <input
                  type="text"
                  autoFocus
                  placeholder="Search layer..."
                  value={nodeSearch}
                  onChange={(e) => setNodeSearch(e.target.value)}
                  className="w-full bg-slate-100 dark:bg-cyber-950 text-[11px] rounded pl-7 pr-2 py-1.5 border border-transparent dark:border-cyber-800 text-slate-800 dark:text-slate-200 outline-none"
                />
              </div>

              <div className="flex-1 overflow-y-auto space-y-0.5 scrollbar-none pr-1">
                {filteredLayers.map(type => (
                  <button
                    key={type}
                    onClick={() => handleSpawnLayer(type)}
                    className="w-full text-left px-2 py-1.5 rounded hover:bg-blue-500 hover:text-white text-slate-700 dark:text-slate-200 font-semibold transition-colors truncate"
                  >
                    {type}
                  </button>
                ))}
                {filteredLayers.length === 0 && (
                  <div className="text-[10px] text-slate-400 text-center py-2">No matching layers</div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
