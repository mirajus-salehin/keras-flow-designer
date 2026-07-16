import React from 'react';
import { BaseEdge, EdgeProps, getBezierPath, EdgeLabelRenderer } from '@xyflow/react';
import { useProjectStore } from '../../store/useProjectStore';

export const EdgeWithShape: React.FC<EdgeProps> = ({
  id,
  source,
  target,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
}) => {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  // Find source node to get its output shape
  const sourceNode = useProjectStore((state) => state.nodes.find((n) => n.id === source));
  const outputShape = sourceNode?.data?.outputShape || '';

  // Determine line style (pulse if valid, red if error)
  const hasErrors = sourceNode?.data?.errors && sourceNode.data.errors.length > 0;
  const edgeColor = hasErrors ? '#ef4444' : '#64748b'; // red or slate
  const strokeDash = hasErrors ? '5,5' : 'none';

  return (
    <>
      <BaseEdge
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          ...style,
          stroke: edgeColor,
          strokeDasharray: strokeDash,
          strokeWidth: 2.2
        }}
      />
      {outputShape && outputShape !== '()' && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: 'all',
            }}
            className="nodrag nopan select-none bg-slate-50 dark:bg-cyber-900/90 border border-slate-200 dark:border-cyber-850 px-1.5 py-0.5 rounded shadow-sm text-[8px] font-bold text-slate-500 dark:text-slate-400 font-mono tracking-wider cursor-default hover:scale-105 hover:border-blue-500 transition-all"
            title={`Tensor shape: ${outputShape}`}
          >
            {outputShape}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
};
