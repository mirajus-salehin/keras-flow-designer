import React, { useState } from 'react';
import { NodeResizer, NodeProps } from '@xyflow/react';
import { useProjectStore } from '../../store/useProjectStore';

export const GroupNode: React.FC<NodeProps> = ({ id, data, selected }) => {
  const nodeData = data as any;
  const [isEditing, setIsEditing] = useState(false);
  const [tempLabel, setTempLabel] = useState(nodeData.label || 'Layer Group');

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
  };

  const handleBlur = () => {
    setIsEditing(false);
    useProjectStore.setState({
      nodes: useProjectStore.getState().nodes.map(n => 
        n.id === id 
          ? { ...n, data: { ...n.data, label: tempLabel } } 
          : n
      )
    });
  };

  return (
    <div
      className={`w-full h-full border border-dashed rounded-xl bg-slate-50/10 dark:bg-cyber-900/5 transition-all p-3 flex flex-col justify-between select-none ${
        selected
          ? 'border-blue-500 shadow-md shadow-blue-500/10 ring-2 ring-blue-500/15'
          : 'border-slate-300 dark:border-cyber-700'
      }`}
    >
      <NodeResizer
        minWidth={150}
        minHeight={100}
        isVisible={selected}
        lineClassName="border-blue-500"
        handleClassName="w-2.5 h-2.5 bg-blue-500 rounded"
        onResize={(_, { width, height }) => {
          useProjectStore.setState({
            nodes: useProjectStore.getState().nodes.map(n => 
              n.id === id 
                ? { ...n, data: { ...n.data, width, height } } 
                : n
            )
          });
        }}
      />

      {/* Header with double click to edit */}
      <div className="flex items-center justify-between border-b border-slate-200/50 dark:border-cyber-800/40 pb-2">
        {isEditing ? (
          <input
            type="text"
            autoFocus
            value={tempLabel}
            onChange={(e) => setTempLabel(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleBlur();
              if (e.key === 'Escape') setIsEditing(false);
            }}
            className="bg-white dark:bg-cyber-950 border border-blue-500 rounded px-1 text-xs font-bold text-slate-800 dark:text-slate-200 outline-none w-full"
          />
        ) : (
          <h4
            onDoubleClick={handleDoubleClick}
            className="text-xs font-extrabold tracking-wider uppercase text-slate-400 dark:text-slate-500 cursor-text select-text"
          >
            {nodeData.label || 'Layer Group'}
          </h4>
        )}
      </div>

      <div className="flex-1" />
    </div>
  );
};
