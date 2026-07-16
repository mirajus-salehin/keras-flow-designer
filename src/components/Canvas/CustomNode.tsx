import React from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { AlertCircle, ChevronDown, ChevronUp, Copy, Trash2 } from 'lucide-react';
import { useProjectStore } from '../../store/useProjectStore';
import { getCategoryColor } from '../../utils/layerDefinitions';
import { NodeData } from '../../types/network';

export const CustomNode: React.FC<NodeProps> = ({ id, data, selected }) => {
  const nodeData = data as NodeData;
  const catColor = getCategoryColor(nodeData.category);
  const hasErrors = nodeData.errors && nodeData.errors.length > 0;

  // Zustand Store Bindings
  const { toggleNodeCollapse, deleteNode, duplicateNode, setSelectedNode } = useProjectStore();

  const handleToggleCollapse = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleNodeCollapse(id);
  };

  const handleDuplicate = (e: React.MouseEvent) => {
    e.stopPropagation();
    duplicateNode(id);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    deleteNode(id);
  };

  // Helper to compile a small parameters summary string to display on the node
  const getParamsSummary = () => {
    const p = nodeData.params;
    switch (nodeData.layerType) {
      case 'Dense':
        return `Units: ${p.units || 0} (${p.activation || 'linear'})`;
      case 'Conv2D':
        return `Filters: ${p.filters || 0} [${Array.isArray(p.kernel_size) ? p.kernel_size.join('x') : p.kernel_size}]`;
      case 'LSTM':
      case 'GRU':
      case 'SimpleRNN':
        return `Units: ${p.units || 0}${p.return_sequences ? ' (Seq)' : ''}`;
      case 'Dropout':
        return `Rate: ${p.rate || 0}`;
      case 'MaxPooling2D':
      case 'AveragePooling2D':
        return `Pool: [${Array.isArray(p.pool_size) ? p.pool_size.join('x') : p.pool_size}]`;
      case 'Concatenate':
        return `Axis: ${p.axis !== undefined ? p.axis : -1}`;
      case 'Input':
      case 'InputLayer':
        const shape = p.shape || p.input_shape || [];
        return `Shape: [${Array.isArray(shape) ? shape.join(', ') : shape}]`;
      default:
        return '';
    }
  };

  return (
    <div
      onClick={() => setSelectedNode(id)}
      className={`custom-node-border w-52 bg-white dark:bg-cyber-900 border rounded-lg shadow-md hover:shadow-lg transition-all overflow-hidden ${
        selected
          ? 'border-blue-500 ring-2 ring-blue-500/20'
          : hasErrors
          ? 'border-rose-500 ring-1 ring-rose-500/10'
          : 'border-slate-200 dark:border-cyber-800'
      }`}
    >
      {/* Category Border bar */}
      <div className="h-1.5 w-full" style={{ backgroundColor: catColor }} />

      {/* Header */}
      <div className="px-3 py-2 flex items-center justify-between bg-slate-50/50 dark:bg-cyber-900/10 border-b border-slate-100 dark:border-cyber-850">
        <div className="flex-1 min-w-0 pr-2">
          <h4 className="text-[11px] font-bold text-slate-800 dark:text-slate-200 truncate">
            {nodeData.params.name || nodeData.label}
          </h4>
          <span className="text-[9px] font-semibold text-slate-400 dark:text-slate-400 block tracking-wider uppercase -mt-0.5">
            {nodeData.layerType}
          </span>
        </div>

        <div className="flex items-center space-x-1.5 shrink-0">
          {hasErrors && (
            <span title={nodeData.errors?.join('\n')}>
              <AlertCircle className="w-3.5 h-3.5 text-rose-500 animate-pulse cursor-help" />
            </span>
          )}
          <button
            onClick={handleToggleCollapse}
            className="p-0.5 hover:bg-slate-200 dark:hover:bg-cyber-800 text-slate-400 hover:text-slate-600 rounded transition-colors"
          >
            {nodeData.isCollapsed ? (
              <ChevronDown className="w-3 h-3" />
            ) : (
              <ChevronUp className="w-3 h-3" />
            )}
          </button>
        </div>
      </div>

      {/* Body / Content */}
      {!nodeData.isCollapsed && (
        <div className="p-3 space-y-2 bg-white dark:bg-cyber-900">
          {/* Summary params badge */}
          {getParamsSummary() && (
            <div className="text-[9px] font-bold bg-slate-100 dark:bg-cyber-950 text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded tracking-wide max-w-full truncate font-mono">
              {getParamsSummary()}
            </div>
          )}

          {/* Shapes display */}
          <div className="space-y-0.5 border-t border-slate-100 dark:border-cyber-850 pt-2 text-[9px] font-bold font-mono">
            {nodeData.inputShape && nodeData.inputShape !== '()' && (
              <div className="flex justify-between text-slate-400 dark:text-slate-500">
                <span>In:</span>
                <span className="truncate max-w-[150px]">{nodeData.inputShape}</span>
              </div>
            )}
            {nodeData.outputShape && (
              <div className="flex justify-between text-emerald-500 dark:text-emerald-400">
                <span>Out:</span>
                <span className="truncate max-w-[150px]">{nodeData.outputShape}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Quick Action Overlay (shows on node select) */}
      {selected && (
        <div className="absolute -top-8 right-0 bg-white dark:bg-cyber-900 border border-slate-200 dark:border-cyber-800 rounded-md shadow-md py-0.5 px-1.5 flex items-center space-x-1 animate-in fade-in slide-in-from-bottom-2 duration-100">
          <button
            onClick={handleDuplicate}
            className="p-1 hover:bg-slate-100 dark:hover:bg-cyber-850 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded transition-colors"
            title="Duplicate Node"
          >
            <Copy className="w-3 h-3" />
          </button>
          <button
            onClick={handleDelete}
            className="p-1 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-slate-400 hover:text-rose-500 rounded transition-colors"
            title="Delete Node"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Connection Handles */}
      {nodeData.layerType !== 'Input' && nodeData.layerType !== 'InputLayer' && (
        <Handle
          type="target"
          position={Position.Left}
          id="input"
          style={{
            top: nodeData.isCollapsed ? '25px' : '50%',
            borderColor: catColor
          }}
        />
      )}
      <Handle
        type="source"
        position={Position.Right}
        id="output"
        style={{
          top: nodeData.isCollapsed ? '25px' : '50%',
          borderColor: catColor
        }}
      />
    </div>
  );
};
