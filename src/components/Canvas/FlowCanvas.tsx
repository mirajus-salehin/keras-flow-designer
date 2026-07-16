import React, { useCallback, useState, useRef, useEffect } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useReactFlow,
  Panel,
  Node,
  Edge
} from '@xyflow/react';
import { CustomNode } from './CustomNode';
import { CommentNode } from './CommentNode';
import { GroupNode } from './GroupNode';
import { EdgeWithShape } from './EdgeWithShape';
import { ContextMenu } from './ContextMenu';
import { useProjectStore } from '../../store/useProjectStore';
import { getNextLayerRecommendations } from '../../utils/aiAssistant';
import { getCategoryColor } from '../../utils/layerDefinitions';
import { Sparkles, HelpCircle } from 'lucide-react';

const nodeTypes = {
  customLayerNode: CustomNode,
  commentNode: CommentNode,
  groupNode: GroupNode
};

const edgeTypes = {
  default: EdgeWithShape
};

export const FlowCanvas: React.FC = () => {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { screenToFlowPosition } = useReactFlow();

  // Zustand state
  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    addNode,
    deleteNode,
    duplicateNode,
    undo,
    redo,
    selectedNodeId,
    setSelectedNode,
    theme,
    runEngine,
    saveProject
  } = useProjectStore();

  // Context Menu State
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    canvasX: number;
    canvasY: number;
    nodeId: string | null;
  } | null>(null);

  // Keyboard Shortcuts (Undo, Redo, Copy, Paste, Duplicate)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Focus element check (don't trigger shortcuts when typing in inputs/textareas)
      const activeEl = document.activeElement;
      if (
        activeEl &&
        (activeEl.tagName === 'INPUT' ||
          activeEl.tagName === 'TEXTAREA' ||
          activeEl.getAttribute('contenteditable') === 'true')
      ) {
        return;
      }

      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const cmdKey = isMac ? e.metaKey : e.ctrlKey;

      // Undo: Ctrl+Z
      if (cmdKey && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        undo();
      }
      // Redo: Ctrl+Y
      if (cmdKey && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        redo();
      }
      // Duplicate: Ctrl+D
      if (cmdKey && e.key.toLowerCase() === 'd' && selectedNodeId) {
        e.preventDefault();
        duplicateNode(selectedNodeId);
      }
      // Delete: Delete / Backspace
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedNodeId) {
        e.preventDefault();
        deleteNode(selectedNodeId);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo, selectedNodeId, duplicateNode, deleteNode]);

  // Drag & Drop Helpers
  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const layerType = event.dataTransfer.getData('application/reactflow');
      if (!layerType) return;

      // Get bounds and calculate canvas drop coordinate
      if (reactFlowWrapper.current) {
        const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
        const canvasPos = screenToFlowPosition({
          x: event.clientX,
          y: event.clientY,
        });

        addNode(layerType, canvasPos.x, canvasPos.y);
      }
    },
    [screenToFlowPosition, addNode]
  );

  // Context Menu Helpers
  const onPaneContextMenu = useCallback(
    (event: React.MouseEvent) => {
      event.preventDefault();
      if (!reactFlowWrapper.current) return;

      const rect = reactFlowWrapper.current.getBoundingClientRect();
      const canvasPos = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      setContextMenu({
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
        canvasX: canvasPos.x,
        canvasY: canvasPos.y,
        nodeId: null,
      });
    },
    [screenToFlowPosition]
  );

  const onNodeContextMenu = useCallback(
    (event: React.MouseEvent, node: Node) => {
      event.preventDefault();
      if (!reactFlowWrapper.current) return;

      const rect = reactFlowWrapper.current.getBoundingClientRect();
      const canvasPos = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      setSelectedNode(node.id);
      setContextMenu({
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
        canvasX: canvasPos.x,
        canvasY: canvasPos.y,
        nodeId: node.id,
      });
    },
    [screenToFlowPosition, setSelectedNode]
  );

  const onPaneClick = useCallback(() => {
    setContextMenu(null);
    setSelectedNode(null);
  }, [setSelectedNode]);

  // AI assistant recommendation trigger
  const selectedNode = nodes.find(n => n.id === selectedNodeId);
  const recommendations = getNextLayerRecommendations(
    selectedNode ? selectedNode.data.layerType : null
  );

  return (
    <div
      ref={reactFlowWrapper}
      className="flex-1 h-full relative bg-slate-50 dark:bg-cyber-950 panel-transition"
      onContextMenu={onPaneContextMenu}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onPaneClick={onPaneClick}
        onNodeClick={(_, node) => {
          setSelectedNode(node.id);
          setContextMenu(null);
        }}
        onNodeContextMenu={onNodeContextMenu}
        onDragOver={onDragOver}
        onDrop={onDrop}
        snapToGrid={true}
        snapGrid={[15, 15]}
        fitView
        colorMode={theme}
      >
        <Background
          color={theme === 'dark' ? '#23334c' : '#cbd5e1'}
          gap={15}
          size={1}
        />
        <Controls />
        <MiniMap zoomable pannable />

        {/* AI Recommendations Floating Panel */}
        <Panel position="top-right" className="mr-2">
          <div className="bg-white/95 dark:bg-cyber-900/95 border border-slate-200 dark:border-cyber-800 p-3 rounded-xl shadow-lg backdrop-blur-md w-64 space-y-2 animate-in slide-in-from-right duration-200">
            <div className="flex items-center space-x-1.5 text-blue-600 dark:text-blue-400 font-extrabold text-[10px] tracking-wider uppercase">
              <Sparkles className="w-3.5 h-3.5 animate-pulse" />
              <span>AI Layer Recommender</span>
            </div>
            
            <p className="text-[10px] text-slate-400 dark:text-slate-400 leading-normal">
              {selectedNode
                ? `Following a '${selectedNode.data.layerType}', consider adding:`
                : 'Getting started? Place these first:'}
            </p>

            <div className="space-y-1.5 pt-1">
              {recommendations.slice(0, 3).map((rec, i) => (
                <div
                  key={i}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData('application/reactflow', rec.layerType);
                    e.dataTransfer.effectAllowed = 'move';
                  }}
                  className="cursor-grab active:cursor-grabbing bg-slate-50 dark:bg-cyber-950/60 border border-slate-100 dark:border-cyber-850/60 p-2 rounded-lg hover:border-blue-500/50 hover:bg-blue-50/10 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-800 dark:text-slate-200">{rec.layerType}</span>
                    <span className="text-[9px] font-extrabold text-blue-500 bg-blue-50 dark:bg-blue-950/50 px-1 rounded">
                      {(rec.confidence * 100).toFixed(0)}% Match
                    </span>
                  </div>
                  <p className="text-[8px] text-slate-400 dark:text-slate-500 leading-normal mt-0.5">{rec.reason}</p>
                </div>
              ))}
            </div>
          </div>
        </Panel>

        {/* Quick Keyboard shortcuts helper */}
        <Panel position="bottom-left" className="mb-2">
          <div className="bg-slate-100/60 dark:bg-cyber-900/60 border border-transparent backdrop-blur-md px-2 py-1 rounded-md text-[9px] font-bold text-slate-400 dark:text-slate-500 flex items-center space-x-3 select-none">
            <span>Del/Backspace: Delete</span>
            <span>Ctrl+D: Duplicate</span>
            <span>Ctrl+Z: Undo</span>
            <span>Ctrl+Y: Redo</span>
          </div>
        </Panel>
      </ReactFlow>

      {/* Right Click Context Menu */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          canvasX={contextMenu.canvasX}
          canvasY={contextMenu.canvasY}
          nodeId={contextMenu.nodeId}
          onClose={() => setContextMenu(null)}
        />
      )}
    </div>
  );
};
