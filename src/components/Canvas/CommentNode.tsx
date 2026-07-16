import React, { useState } from 'react';
import { NodeResizer, NodeProps } from '@xyflow/react';
import { useProjectStore } from '../../store/useProjectStore';

export const CommentNode: React.FC<NodeProps> = ({ id, data, selected }) => {
  const nodeData = data as any;
  const { updateNodeParams } = useProjectStore();

  const [isEditing, setIsEditing] = useState(false);
  const [tempContent, setTempContent] = useState(nodeData.content || '');

  const handleDoubleClick = () => {
    setIsEditing(true);
    setTempContent(nodeData.content || '');
  };

  const handleBlur = () => {
    setIsEditing(false);
    // Write back to Zustand
    useProjectStore.setState({
      nodes: useProjectStore.getState().nodes.map(n => 
        n.id === id 
          ? { ...n, data: { ...n.data, content: tempContent } } 
          : n
      )
    });
  };

  const colorStyle = nodeData.color || '#fef08a'; // default yellow

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        backgroundColor: colorStyle,
        borderColor: selected ? '#3b82f6' : 'transparent',
      }}
      className={`border-2 rounded-lg shadow-sm p-3 flex flex-col overflow-hidden text-slate-800 relative group`}
      onDoubleClick={handleDoubleClick}
    >
      <NodeResizer
        minWidth={100}
        minHeight={50}
        isVisible={selected}
        lineClassName="border-blue-500"
        handleClassName="w-2 h-2 bg-blue-500 rounded"
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

      {/* Resize handles background layer */}
      <div className="absolute top-1 right-2 text-[9px] font-bold text-slate-400 opacity-30 select-none">
        Sticky Note
      </div>

      {isEditing ? (
        <textarea
          autoFocus
          value={tempContent}
          onChange={(e) => setTempContent(e.target.value)}
          onBlur={handleBlur}
          className="w-full h-full bg-transparent resize-none border-none outline-none font-sans text-xs font-semibold text-slate-800"
        />
      ) : (
        <div className="w-full h-full overflow-y-auto whitespace-pre-wrap font-sans text-xs font-semibold select-text leading-relaxed">
          {nodeData.content || 'Double click to edit note...'}
        </div>
      )}
    </div>
  );
};
