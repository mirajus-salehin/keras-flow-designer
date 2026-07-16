import React from 'react';
import { Trash2, AlertTriangle, Sparkles, Copy, X } from 'lucide-react';
import { useProjectStore } from '../../store/useProjectStore';
import { LAYER_DEFINITIONS, getCategoryColor } from '../../utils/layerDefinitions';
import { ParameterDefinition } from '../../types/network';

export const NodeProperties: React.FC = () => {
  const {
    nodes,
    selectedNodeId,
    updateNodeParams,
    updateNodeLabel,
    deleteNode,
    duplicateNode,
    setSelectedNode
  } = useProjectStore();

  const node = nodes.find(n => n.id === selectedNodeId);

  if (!node) {
    return (
      <div className="w-80 border-l border-slate-200 dark:border-cyber-800 bg-white dark:bg-cyber-900 flex flex-col items-center justify-center p-6 text-center select-none shrink-0 panel-transition">
        <Sparkles className="w-8 h-8 text-slate-300 dark:text-cyber-700 mb-3 animate-pulse" />
        <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
          No Layer Selected
        </h3>
        <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-normal mt-1 max-w-[200px]">
          Select any node on the canvas to configure its Keras hyperparameters, activation functions, and regularizers.
        </p>
      </div>
    );
  }

  const def = LAYER_DEFINITIONS[node.data.layerType];
  const params = node.data.params;
  const catColor = getCategoryColor(node.data.category);
  const errors = node.data.errors || [];

  const handleParamChange = (name: string, value: any) => {
    // Parse tuple values
    let finalValue = value;
    const paramDef = def?.params.find(p => p.name === name);
    
    if (paramDef && paramDef.type === 'tuple') {
      if (typeof value === 'string') {
        const cleaned = value.replace(/[()\[\]\s]/g, '');
        finalValue = cleaned.split(',').map(x => {
          const num = parseInt(x, 10);
          return isNaN(num) ? null : num;
        });
      }
    }

    updateNodeParams(node.id, { [name]: finalValue });
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value.replace(/[^a-zA-Z0-9_]/g, '_');
    updateNodeParams(node.id, { name: newName });
    updateNodeLabel(node.id, newName);
  };

  const handleDelete = () => {
    deleteNode(node.id);
  };

  const handleDuplicate = () => {
    duplicateNode(node.id);
  };

  // Helper to render widget input based on type
  const renderWidget = (pDef: ParameterDefinition) => {
    const currentVal = params[pDef.name];

    switch (pDef.type) {
      case 'text':
        return (
          <input
            type="text"
            value={currentVal || ''}
            onChange={(e) => handleParamChange(pDef.name, e.target.value)}
            className="w-full bg-slate-50 dark:bg-cyber-950 text-xs font-semibold rounded-lg p-2 border border-slate-200 dark:border-cyber-800 text-slate-700 dark:text-slate-200 focus:border-blue-500 outline-none"
          />
        );

      case 'number':
        return (
          <input
            type="number"
            value={currentVal === null || currentVal === undefined ? '' : currentVal}
            onChange={(e) => {
              const val = e.target.value === '' ? null : parseInt(e.target.value, 10);
              handleParamChange(pDef.name, val);
            }}
            className="w-full bg-slate-50 dark:bg-cyber-950 text-xs font-semibold rounded-lg p-2 border border-slate-200 dark:border-cyber-800 text-slate-700 dark:text-slate-200 focus:border-blue-500 outline-none"
          />
        );

      case 'select':
        return (
          <select
            value={currentVal || pDef.default || ''}
            onChange={(e) => handleParamChange(pDef.name, e.target.value)}
            className="w-full bg-slate-50 dark:bg-cyber-950 text-xs font-semibold rounded-lg p-2 border border-slate-200 dark:border-cyber-800 text-slate-700 dark:text-slate-200 focus:border-blue-500 outline-none"
          >
            {pDef.options?.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        );

      case 'boolean':
        return (
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={!!currentVal}
              onChange={(e) => handleParamChange(pDef.name, e.target.checked)}
              className="w-4 h-4 rounded border-slate-350 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-[11px] text-slate-500 ml-2 font-medium">Enabled</span>
          </div>
        );

      case 'slider':
        return (
          <div className="space-y-1.5">
            <div className="flex justify-between text-[11px] font-semibold text-slate-500">
              <span>Value</span>
              <span className="text-blue-500 font-bold">{currentVal !== undefined ? currentVal : pDef.default}</span>
            </div>
            <input
              type="range"
              min={pDef.min ?? 0}
              max={pDef.max ?? 1}
              step={pDef.step ?? 0.05}
              value={currentVal !== undefined ? currentVal : pDef.default}
              onChange={(e) => handleParamChange(pDef.name, parseFloat(e.target.value))}
              className="w-full h-1 bg-slate-200 dark:bg-cyber-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
          </div>
        );

      case 'tuple':
        const tupleString = Array.isArray(currentVal) ? currentVal.join(', ') : currentVal || '';
        return (
          <input
            type="text"
            value={tupleString}
            onChange={(e) => handleParamChange(pDef.name, e.target.value)}
            placeholder="e.g. 3, 3"
            className="w-full bg-slate-50 dark:bg-cyber-950 text-xs font-semibold rounded-lg p-2 border border-slate-200 dark:border-cyber-800 text-slate-700 dark:text-slate-200 focus:border-blue-500 outline-none font-mono"
          />
        );

      case 'json':
        const jsonString = typeof currentVal === 'object' ? JSON.stringify(currentVal, null, 2) : currentVal || '';
        return (
          <textarea
            value={jsonString}
            rows={4}
            onChange={(e) => {
              try {
                const parsed = JSON.parse(e.target.value);
                handleParamChange(pDef.name, parsed);
              } catch {
                // write raw text while user is typing
                handleParamChange(pDef.name, e.target.value);
              }
            }}
            placeholder="{}"
            className="w-full bg-slate-50 dark:bg-cyber-950 text-xs font-semibold rounded-lg p-2 border border-slate-200 dark:border-cyber-800 text-slate-700 dark:text-slate-200 focus:border-blue-500 outline-none font-mono resize-y"
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="w-80 border-l border-slate-200 dark:border-cyber-800 bg-white dark:bg-cyber-900 flex flex-col h-full z-10 shrink-0 select-none panel-transition">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-100 dark:border-cyber-850 flex items-center justify-between bg-slate-50/50 dark:bg-cyber-900/10">
        <div className="flex items-center space-x-2">
          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: catColor }} />
          <h2 className="text-xs font-bold text-slate-800 dark:text-slate-200">Properties</h2>
        </div>
        <button
          onClick={() => setSelectedNode(null)}
          className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 rounded"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Content Form Scroll container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Validation Errors overlay */}
        {errors.length > 0 && (
          <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50 p-3 rounded-lg space-y-1">
            <div className="flex items-center space-x-1.5 text-rose-600 dark:text-rose-400 text-[10px] font-extrabold tracking-wide uppercase">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Validation Warning</span>
            </div>
            {errors.map((err, i) => (
              <p key={i} className="text-[9px] text-rose-500 dark:text-rose-400 leading-normal font-semibold">
                • {err}
              </p>
            ))}
          </div>
        )}

        {/* Global Node Info */}
        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Layer Class</label>
            <div className="bg-slate-50 dark:bg-cyber-950 border border-slate-100 dark:border-cyber-850 text-xs font-bold rounded-lg p-2 text-slate-800 dark:text-slate-200 font-mono">
              tf.keras.layers.{node.data.layerType}
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Layer Name (Unique ID)</label>
            <input
              type="text"
              value={params.name || ''}
              onChange={handleNameChange}
              className="w-full bg-slate-50 dark:bg-cyber-950 text-xs font-semibold rounded-lg p-2 border border-slate-200 dark:border-cyber-800 text-slate-700 dark:text-slate-200 focus:border-blue-500 outline-none"
            />
          </div>
        </div>

        <div className="h-px bg-slate-100 dark:bg-cyber-850" />

        {/* Keras Specific Parameters */}
        {def && (
          <div className="space-y-3">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Layer Parameters</h3>
            {def.params.map(pDef => (
              <div key={pDef.name} className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400">
                    {pDef.label}
                  </label>
                  {pDef.required && (
                    <span className="text-[8px] font-bold text-rose-500 uppercase">Required</span>
                  )}
                </div>
                
                {renderWidget(pDef)}
                
                {pDef.description && (
                  <p className="text-[8px] text-slate-400 dark:text-slate-500 leading-normal">
                    {pDef.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer operations */}
      <div className="p-4 border-t border-slate-100 dark:border-cyber-850 grid grid-cols-2 gap-2 bg-slate-50 dark:bg-cyber-900/25 shrink-0">
        <button
          onClick={handleDuplicate}
          className="flex items-center justify-center space-x-1.5 px-3 py-2 border border-slate-200 dark:border-cyber-800 hover:bg-slate-100 dark:hover:bg-cyber-850 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-300 transition-colors"
        >
          <Copy className="w-3.5 h-3.5" />
          <span>Duplicate</span>
        </button>
        <button
          onClick={handleDelete}
          className="flex items-center justify-center space-x-1.5 px-3 py-2 bg-rose-50 dark:bg-rose-950/20 hover:bg-rose-100 dark:hover:bg-rose-900/35 border border-transparent rounded-lg text-xs font-bold text-rose-600 dark:text-rose-400 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Delete</span>
        </button>
      </div>
    </div>
  );
};
