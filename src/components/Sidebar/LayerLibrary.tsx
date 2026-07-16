import React, { useState } from 'react';
import {
  Search,
  Layers,
  Database,
  Sliders,
  Grid,
  ChevronRight,
  ChevronDown,
  Sparkles,
  Info
} from 'lucide-react';
import { useProjectStore } from '../../store/useProjectStore';
import { LAYER_DEFINITIONS, getCategoryColor } from '../../utils/layerDefinitions';
import { LayerCategory } from '../../types/network';

export const LayerLibrary: React.FC = () => {
  // Tabs for the sidebar
  const [activeSidebarTab, setActiveSidebarTab] = useState<'layers' | 'dataset' | 'training'>('layers');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Accordion collapsed state for categories
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({
    INPUT: false,
    CORE: false,
    CONVOLUTION: false,
    POOLING: true,
    NORMALIZATION: true,
    DROPOUT: true,
    RECURRENT: true,
    ATTENTION: true,
    EMBEDDING: true,
    MERGE: true,
    IMAGE_PREPROCESSING: true,
    REGULARIZATION: true,
    NOISE: true,
    CUSTOM: false
  });

  // Zustand Store Bindings
  const {
    trainingConfig,
    datasetConfig,
    updateTrainingConfig,
    updateDatasetConfig
  } = useProjectStore();

  const handleDragStart = (e: React.DragEvent, layerType: string) => {
    e.dataTransfer.setData('application/reactflow', layerType);
    e.dataTransfer.effectAllowed = 'move';
  };

  const toggleCategory = (cat: string) => {
    setCollapsedCategories(prev => ({ ...prev, [cat]: !prev[cat] }));
  };

  // Group layers by category
  const categories: Record<LayerCategory, string[]> = {
    INPUT: [],
    CORE: [],
    CONVOLUTION: [],
    POOLING: [],
    NORMALIZATION: [],
    DROPOUT: [],
    RECURRENT: [],
    ATTENTION: [],
    EMBEDDING: [],
    MERGE: [],
    IMAGE_PREPROCESSING: [],
    REGULARIZATION: [],
    NOISE: [],
    CUSTOM: [],
    COMMENT: []
  };

  Object.values(LAYER_DEFINITIONS).forEach(layer => {
    categories[layer.category].push(layer.type);
  });

  // Category labels helper
  const getCategoryLabel = (cat: string): string => {
    return cat.replace('_', ' ');
  };

  return (
    <div className="w-80 border-r border-slate-200 dark:border-cyber-800 bg-white dark:bg-cyber-900 flex flex-row h-full z-10 shrink-0 select-none panel-transition">
      {/* Icon Tab Bar (Vertical) */}
      <div className="w-12 border-r border-slate-100 dark:border-cyber-850 flex flex-col items-center py-4 space-y-4 bg-slate-50 dark:bg-cyber-900/40 shrink-0">
        <button
          onClick={() => setActiveSidebarTab('layers')}
          className={`p-2 rounded-lg transition-all ${
            activeSidebarTab === 'layers'
              ? 'bg-blue-500 text-white shadow-md shadow-blue-500/30'
              : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
          }`}
          title="Layer Library"
        >
          <Layers className="w-5 h-5" />
        </button>

        <button
          onClick={() => setActiveSidebarTab('dataset')}
          className={`p-2 rounded-lg transition-all ${
            activeSidebarTab === 'dataset'
              ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/30'
              : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
          }`}
          title="Dataset Configuration"
        >
          <Database className="w-5 h-5" />
        </button>

        <button
          onClick={() => setActiveSidebarTab('training')}
          className={`p-2 rounded-lg transition-all ${
            activeSidebarTab === 'training'
              ? 'bg-purple-500 text-white shadow-md shadow-purple-500/30'
              : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
          }`}
          title="Training Hyperparameters"
        >
          <Sliders className="w-5 h-5" />
        </button>
      </div>

      {/* Pane Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {activeSidebarTab === 'layers' && (
          <>
            {/* Header */}
            <div className="p-4 border-b border-slate-100 dark:border-cyber-850 shrink-0 bg-slate-50/50 dark:bg-cyber-900/10">
              <h2 className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-2">Layer Catalog</h2>
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search layers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-100 dark:bg-cyber-950 text-xs font-semibold rounded-lg pl-9 pr-4 py-2 border border-transparent dark:border-cyber-800 text-slate-700 dark:text-slate-200 focus:border-blue-500 outline-none"
                />
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {Object.entries(categories).map(([cat, layerTypes]) => {
                if (cat === 'COMMENT') return null; // handled separately or via context menu
                
                // Filter layers by search
                const filteredLayers = layerTypes.filter(type =>
                  type.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  LAYER_DEFINITIONS[type].description.toLowerCase().includes(searchQuery.toLowerCase())
                );

                if (filteredLayers.length === 0) return null;

                const isCollapsed = collapsedCategories[cat];
                const catColor = getCategoryColor(cat as LayerCategory);

                return (
                  <div
                    key={cat}
                    className="border border-slate-200 dark:border-cyber-800 rounded-lg overflow-hidden"
                  >
                    {/* Accordion Trigger */}
                    <button
                      onClick={() => toggleCategory(cat)}
                      className="w-full flex items-center justify-between px-3 py-2 bg-slate-50 dark:bg-cyber-900/30 text-left outline-none"
                    >
                      <div className="flex items-center space-x-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: catColor }}
                        />
                        <span className="text-[11px] font-bold tracking-wide uppercase text-slate-600 dark:text-slate-300">
                          {getCategoryLabel(cat)}
                        </span>
                      </div>
                      {isCollapsed ? (
                        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                      )}
                    </button>

                    {/* Accordion Content */}
                    {!isCollapsed && (
                      <div className="p-2 bg-white dark:bg-cyber-900 space-y-1.5 border-t border-slate-100 dark:border-cyber-850">
                        {filteredLayers.map(type => {
                          const def = LAYER_DEFINITIONS[type];
                          return (
                            <div
                              key={type}
                              draggable
                              onDragStart={(e) => handleDragStart(e, type)}
                              className="group relative cursor-grab active:cursor-grabbing border border-slate-100 dark:border-cyber-800 hover:border-blue-500/50 dark:hover:border-blue-500/50 p-2 rounded-md hover:bg-slate-50/50 dark:hover:bg-cyber-950/40 transition-colors flex items-center justify-between"
                            >
                              <div className="flex-1 min-w-0 pr-2">
                                <h4 className="text-[11px] font-bold text-slate-800 dark:text-slate-200 truncate">
                                  {def.label}
                                </h4>
                                <p className="text-[9px] text-slate-400 dark:text-slate-400 truncate mt-0.5">
                                  {def.description}
                                </p>
                              </div>
                              
                              {/* Hover details tooltip */}
                              <div
                                className="opacity-0 group-hover:opacity-100 transition-opacity duration-150 p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                                title={def.description}
                              >
                                <Info className="w-3.5 h-3.5" />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}

        {activeSidebarTab === 'dataset' && (
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-cyber-850 pb-2">
              Dataset Settings
            </h3>
            
            {/* Dataset Type */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Type</label>
              <select
                value={datasetConfig.type}
                onChange={(e) => updateDatasetConfig({ type: e.target.value as any })}
                className="w-full bg-slate-50 dark:bg-cyber-950 text-xs font-semibold rounded-lg p-2 border border-slate-200 dark:border-cyber-800 text-slate-700 dark:text-slate-200 focus:border-blue-500 outline-none"
              >
                <option value="MNIST">MNIST</option>
                <option value="Fashion MNIST">Fashion MNIST</option>
                <option value="CIFAR10">CIFAR 10</option>
                <option value="CIFAR100">CIFAR 100</option>
                <option value="CSV">Custom CSV</option>
                <option value="TFRecord">TFRecord</option>
                <option value="Custom">Custom Dataset</option>
              </select>
            </div>

            {/* Custom fields for CSV */}
            {datasetConfig.type === 'CSV' && (
              <>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">CSV File Path</label>
                  <input
                    type="text"
                    value={datasetConfig.csvPath || ''}
                    onChange={(e) => updateDatasetConfig({ csvPath: e.target.value })}
                    placeholder="e.g. data/dataset.csv"
                    className="w-full bg-slate-50 dark:bg-cyber-950 text-xs font-semibold rounded-lg p-2 border border-slate-200 dark:border-cyber-800 text-slate-700 dark:text-slate-200 focus:border-blue-500 outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Label Column</label>
                  <input
                    type="text"
                    value={datasetConfig.labelColumn || ''}
                    onChange={(e) => updateDatasetConfig({ labelColumn: e.target.value })}
                    placeholder="e.g. label"
                    className="w-full bg-slate-50 dark:bg-cyber-950 text-xs font-semibold rounded-lg p-2 border border-slate-200 dark:border-cyber-800 text-slate-700 dark:text-slate-200 focus:border-blue-500 outline-none"
                  />
                </div>
              </>
            )}

            {/* Image Specs */}
            {['MNIST', 'Fashion MNIST', 'CIFAR10', 'CIFAR100', 'Custom'].includes(datasetConfig.type) && (
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Width</label>
                  <input
                    type="number"
                    value={datasetConfig.imageSize[0]}
                    onChange={(e) => updateDatasetConfig({ imageSize: [parseInt(e.target.value, 10) || 224, datasetConfig.imageSize[1]] })}
                    className="w-full bg-slate-50 dark:bg-cyber-950 text-xs font-semibold rounded-lg p-2 border border-slate-200 dark:border-cyber-800 text-slate-700 dark:text-slate-200 focus:border-blue-500 outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Height</label>
                  <input
                    type="number"
                    value={datasetConfig.imageSize[1]}
                    onChange={(e) => updateDatasetConfig({ imageSize: [datasetConfig.imageSize[0], parseInt(e.target.value, 10) || 224] })}
                    className="w-full bg-slate-50 dark:bg-cyber-950 text-xs font-semibold rounded-lg p-2 border border-slate-200 dark:border-cyber-800 text-slate-700 dark:text-slate-200 focus:border-blue-500 outline-none"
                  />
                </div>
              </div>
            )}

            {/* Split / Partitioning */}
            <div className="space-y-1">
              <div className="flex justify-between">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Train Split</label>
                <span className="text-xs font-bold text-blue-500">{(datasetConfig.trainSplit * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="0.95"
                step="0.05"
                value={datasetConfig.trainSplit}
                onChange={(e) => updateDatasetConfig({ trainSplit: parseFloat(e.target.value) })}
                className="w-full h-1 bg-slate-200 dark:bg-cyber-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
            </div>

            {/* Options */}
            <div className="space-y-2 border-t border-slate-100 dark:border-cyber-850 pt-3">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Performance Parameters</label>
              
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Normalize (/255.0)</span>
                <input
                  type="checkbox"
                  checked={datasetConfig.normalization}
                  onChange={(e) => updateDatasetConfig({ normalization: e.target.checked })}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Shuffle Train Dataset</span>
                <input
                  type="checkbox"
                  checked={datasetConfig.shuffle}
                  onChange={(e) => updateDatasetConfig({ shuffle: e.target.checked })}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Prefetch Loader</span>
                <input
                  type="checkbox"
                  checked={datasetConfig.prefetch}
                  onChange={(e) => updateDatasetConfig({ prefetch: e.target.checked })}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Image Augmentations */}
            <div className="space-y-2 border-t border-slate-100 dark:border-cyber-850 pt-3">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Augmentations</label>
              
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Random Flip</span>
                <input
                  type="checkbox"
                  checked={datasetConfig.augmentations.randomFlip}
                  onChange={(e) => updateDatasetConfig({ augmentations: { ...datasetConfig.augmentations, randomFlip: e.target.checked } })}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Random Rotation</span>
                <input
                  type="checkbox"
                  checked={datasetConfig.augmentations.randomRotation}
                  onChange={(e) => updateDatasetConfig({ augmentations: { ...datasetConfig.augmentations, randomRotation: e.target.checked } })}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Random Zoom</span>
                <input
                  type="checkbox"
                  checked={datasetConfig.augmentations.randomZoom}
                  onChange={(e) => updateDatasetConfig({ augmentations: { ...datasetConfig.augmentations, randomZoom: e.target.checked } })}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        )}

        {activeSidebarTab === 'training' && (
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-cyber-850 pb-2">
              Hyperparameters
            </h3>

            {/* Optimizer */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Optimizer</label>
              <select
                value={trainingConfig.optimizer}
                onChange={(e) => updateTrainingConfig({ optimizer: e.target.value as any })}
                className="w-full bg-slate-50 dark:bg-cyber-950 text-xs font-semibold rounded-lg p-2 border border-slate-200 dark:border-cyber-800 text-slate-700 dark:text-slate-200 focus:border-blue-500 outline-none"
              >
                <option value="Adam">Adam (Recommended)</option>
                <option value="SGD">SGD</option>
                <option value="AdamW">AdamW</option>
                <option value="RMSprop">RMSprop</option>
                <option value="Adagrad">Adagrad</option>
                <option value="Nadam">Nadam</option>
                <option value="FTRL">FTRL</option>
              </select>
            </div>

            {/* LR & Weight Decay */}
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Learn Rate</label>
                <input
                  type="number"
                  step="0.0001"
                  value={trainingConfig.learningRate}
                  onChange={(e) => updateTrainingConfig({ learningRate: parseFloat(e.target.value) || 0.001 })}
                  className="w-full bg-slate-50 dark:bg-cyber-950 text-xs font-semibold rounded-lg p-2 border border-slate-200 dark:border-cyber-800 text-slate-700 dark:text-slate-200 focus:border-blue-500 outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Weight Decay</label>
                <input
                  type="number"
                  step="0.0001"
                  value={trainingConfig.weightDecay}
                  onChange={(e) => updateTrainingConfig({ weightDecay: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-slate-50 dark:bg-cyber-950 text-xs font-semibold rounded-lg p-2 border border-slate-200 dark:border-cyber-800 text-slate-700 dark:text-slate-200 focus:border-blue-500 outline-none"
                />
              </div>
            </div>

            {/* Loss function */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Loss Function</label>
              <select
                value={trainingConfig.loss}
                onChange={(e) => updateTrainingConfig({ loss: e.target.value })}
                className="w-full bg-slate-50 dark:bg-cyber-950 text-xs font-semibold rounded-lg p-2 border border-slate-200 dark:border-cyber-800 text-slate-700 dark:text-slate-200 focus:border-blue-500 outline-none"
              >
                <option value="sparse_categorical_crossentropy">Sparse Categorical Crossentropy</option>
                <option value="categorical_crossentropy">Categorical Crossentropy</option>
                <option value="binary_crossentropy">Binary Crossentropy</option>
                <option value="mean_squared_error">Mean Squared Error (MSE)</option>
                <option value="mean_absolute_error">Mean Absolute Error (MAE)</option>
              </select>
            </div>

            {/* Epochs & Batch Size */}
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Epochs</label>
                <input
                  type="number"
                  value={trainingConfig.epochs}
                  onChange={(e) => updateTrainingConfig({ epochs: parseInt(e.target.value, 10) || 10 })}
                  className="w-full bg-slate-50 dark:bg-cyber-950 text-xs font-semibold rounded-lg p-2 border border-slate-200 dark:border-cyber-800 text-slate-700 dark:text-slate-200 focus:border-blue-500 outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Batch Size</label>
                <input
                  type="number"
                  value={trainingConfig.batchSize}
                  onChange={(e) => updateTrainingConfig({ batchSize: parseInt(e.target.value, 10) || 32 })}
                  className="w-full bg-slate-50 dark:bg-cyber-950 text-xs font-semibold rounded-lg p-2 border border-slate-200 dark:border-cyber-800 text-slate-700 dark:text-slate-200 focus:border-blue-500 outline-none"
                />
              </div>
            </div>

            {/* Mixed Precision & Gradient clipping */}
            <div className="space-y-2 border-t border-slate-100 dark:border-cyber-850 pt-3">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Training Features</label>
              
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Mixed Precision (float16)</span>
                <input
                  type="checkbox"
                  checked={trainingConfig.mixedPrecision}
                  onChange={(e) => updateTrainingConfig({ mixedPrecision: e.target.checked })}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Gradient Clipping</span>
                <input
                  type="checkbox"
                  checked={trainingConfig.gradientClipping.enabled}
                  onChange={(e) => updateTrainingConfig({ gradientClipping: { ...trainingConfig.gradientClipping, enabled: e.target.checked } })}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
              </div>

              {trainingConfig.gradientClipping.enabled && (
                <div className="space-y-1 pl-4">
                  <label className="text-[9px] font-bold text-slate-400">Clip Value</label>
                  <input
                    type="number"
                    step="0.1"
                    value={trainingConfig.gradientClipping.clipValue}
                    onChange={(e) => updateTrainingConfig({ gradientClipping: { ...trainingConfig.gradientClipping, clipValue: parseFloat(e.target.value) || 1.0 } })}
                    className="w-full bg-slate-50 dark:bg-cyber-950 text-xs font-semibold rounded-lg p-1.5 border border-slate-200 dark:border-cyber-800 text-slate-700 dark:text-slate-200 focus:border-blue-500 outline-none"
                  />
                </div>
              )}
            </div>

            {/* Callbacks */}
            <div className="space-y-2 border-t border-slate-100 dark:border-cyber-850 pt-3">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Keras Callbacks</label>
              
              {/* Early Stopping */}
              <div className="space-y-1.5 border border-slate-100 dark:border-cyber-800 p-2 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Early Stopping</span>
                  <input
                    type="checkbox"
                    checked={trainingConfig.callbacks.earlyStopping.enabled}
                    onChange={(e) => updateTrainingConfig({ callbacks: { ...trainingConfig.callbacks, earlyStopping: { ...trainingConfig.callbacks.earlyStopping, enabled: e.target.checked } } })}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                </div>
                {trainingConfig.callbacks.earlyStopping.enabled && (
                  <div className="grid grid-cols-2 gap-1.5 pt-1">
                    <div>
                      <span className="text-[9px] font-bold text-slate-400">Monitor</span>
                      <input
                        type="text"
                        value={trainingConfig.callbacks.earlyStopping.monitor}
                        onChange={(e) => updateTrainingConfig({ callbacks: { ...trainingConfig.callbacks, earlyStopping: { ...trainingConfig.callbacks.earlyStopping, monitor: e.target.value } } })}
                        className="w-full bg-slate-50 dark:bg-cyber-950 text-[10px] rounded p-1 border border-slate-200 dark:border-cyber-800"
                      />
                    </div>
                    <div>
                      <span className="text-[9px] font-bold text-slate-400">Patience</span>
                      <input
                        type="number"
                        value={trainingConfig.callbacks.earlyStopping.patience}
                        onChange={(e) => updateTrainingConfig({ callbacks: { ...trainingConfig.callbacks, earlyStopping: { ...trainingConfig.callbacks.earlyStopping, patience: parseInt(e.target.value, 10) || 3 } } })}
                        className="w-full bg-slate-50 dark:bg-cyber-950 text-[10px] rounded p-1 border border-slate-200 dark:border-cyber-800"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Reduce LR */}
              <div className="space-y-1.5 border border-slate-100 dark:border-cyber-800 p-2 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Reduce LR on Plateau</span>
                  <input
                    type="checkbox"
                    checked={trainingConfig.callbacks.reduceLROnPlateau.enabled}
                    onChange={(e) => updateTrainingConfig({ callbacks: { ...trainingConfig.callbacks, reduceLROnPlateau: { ...trainingConfig.callbacks.reduceLROnPlateau, enabled: e.target.checked } } })}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                </div>
                {trainingConfig.callbacks.reduceLROnPlateau.enabled && (
                  <div className="grid grid-cols-2 gap-1.5 pt-1">
                    <div>
                      <span className="text-[9px] font-bold text-slate-400">Factor</span>
                      <input
                        type="number"
                        step="0.05"
                        value={trainingConfig.callbacks.reduceLROnPlateau.factor}
                        onChange={(e) => updateTrainingConfig({ callbacks: { ...trainingConfig.callbacks, reduceLROnPlateau: { ...trainingConfig.callbacks.reduceLROnPlateau, factor: parseFloat(e.target.value) || 0.1 } } })}
                        className="w-full bg-slate-50 dark:bg-cyber-950 text-[10px] rounded p-1 border border-slate-200 dark:border-cyber-800"
                      />
                    </div>
                    <div>
                      <span className="text-[9px] font-bold text-slate-400">Patience</span>
                      <input
                        type="number"
                        value={trainingConfig.callbacks.reduceLROnPlateau.patience}
                        onChange={(e) => updateTrainingConfig({ callbacks: { ...trainingConfig.callbacks, reduceLROnPlateau: { ...trainingConfig.callbacks.reduceLROnPlateau, patience: parseInt(e.target.value, 10) || 2 } } })}
                        className="w-full bg-slate-50 dark:bg-cyber-950 text-[10px] rounded p-1 border border-slate-200 dark:border-slate-200"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
