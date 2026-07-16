import React, { useState } from 'react';
import Editor from '@monaco-editor/react';
import { useReactFlow } from '@xyflow/react';
import {
  Code,
  Table,
  Terminal,
  Download,
  Copy,
  AlertTriangle,
  Play,
  ArrowRight,
  CheckCircle2
} from 'lucide-react';
import { useProjectStore } from '../../store/useProjectStore';
import { calculateModelMetrics, formatFlops, formatSize } from '../../features/TensorFlow/modelEstimates';
import {
  generateFunctionalCode,
  generateSequentialCode,
  generatePyTorchCode,
  generateJSCode,
  generateTrainingScript
} from '../../features/TensorFlow/codeGen';
import { downloadTextFile } from '../../features/Export/projectExporter';

export const TabbedBottomPanel: React.FC = () => {
  const { setCenter } = useReactFlow();

  // Zustand Store Bindings
  const {
    nodes,
    edges,
    trainingConfig,
    datasetConfig,
    activeBottomTab,
    setBottomTab,
    validationErrors,
    setSelectedNode,
    theme
  } = useProjectStore();

  // Local state for active code tab
  const [activeCodeSubTab, setActiveCodeSubTab] = useState<'functional' | 'sequential' | 'pytorch' | 'tfjs' | 'train'>('functional');
  const [copied, setCopied] = useState(false);

  // Compute model stats
  const metrics = calculateModelMetrics(nodes);

  // Generate code dynamically based on selection
  const getSelectedCode = (): string => {
    switch (activeCodeSubTab) {
      case 'functional':
        return generateFunctionalCode(nodes, edges);
      case 'sequential':
        return generateSequentialCode(nodes, edges);
      case 'pytorch':
        return generatePyTorchCode(nodes, edges);
      case 'tfjs':
        return generateJSCode(nodes, edges);
      case 'train':
        return generateTrainingScript(nodes, edges, trainingConfig, datasetConfig);
      default:
        return '';
    }
  };

  const currentCode = getSelectedCode();

  const handleCopyCode = () => {
    navigator.clipboard.writeText(currentCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadCode = () => {
    const extensions = {
      functional: 'py',
      sequential: 'py',
      pytorch: 'py',
      tfjs: 'js',
      train: 'py'
    };
    const ext = extensions[activeCodeSubTab];
    downloadTextFile(currentCode, `model_${activeCodeSubTab}.${ext}`);
  };

  // Center canvas on node in error
  const handleFocusNode = (nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId);
    if (node) {
      setSelectedNode(nodeId);
      // Sweeps viewport to center node
      setCenter(node.position.x + 100, node.position.y + 60, { zoom: 1.4, duration: 800 });
    }
  };

  return (
    <div className="h-72 border-t border-slate-200 dark:border-cyber-800 bg-white dark:bg-cyber-900 flex flex-col overflow-hidden shrink-0 z-10 panel-transition">
      {/* Tab Navigation header */}
      <div className="h-10 border-b border-slate-100 dark:border-cyber-850 px-4 flex items-center justify-between bg-slate-50 dark:bg-cyber-900/40 select-none">
        <div className="flex items-center space-x-1.5 h-full">
          <button
            onClick={() => setBottomTab('code')}
            className={`flex items-center space-x-1.5 px-3 h-full text-xs font-bold border-b-2 transition-all ${
              activeBottomTab === 'code'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            <Code className="w-3.5 h-3.5" />
            <span>Generated Code</span>
          </button>

          <button
            onClick={() => setBottomTab('summary')}
            className={`flex items-center space-x-1.5 px-3 h-full text-xs font-bold border-b-2 transition-all ${
              activeBottomTab === 'summary'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            <Table className="w-3.5 h-3.5" />
            <span>Model Summary</span>
            {nodes.length > 0 && (
              <span className="text-[10px] bg-slate-200/60 dark:bg-cyber-805 text-slate-600 dark:text-slate-400 px-1.5 py-0.5 rounded-full font-bold">
                {metrics.layers.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setBottomTab('console')}
            className={`flex items-center space-x-1.5 px-3 h-full text-xs font-bold border-b-2 transition-all ${
              activeBottomTab === 'console'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Validation Console</span>
            {validationErrors.length > 0 && (
              <span className="text-[10px] bg-rose-100 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 px-1.5 py-0.5 rounded-full font-bold">
                {validationErrors.length}
              </span>
            )}
          </button>
        </div>

        {/* Tab Controls (Action icons) */}
        {activeBottomTab === 'code' && (
          <div className="flex items-center space-x-2">
            <button
              onClick={handleCopyCode}
              className="p-1 hover:bg-slate-200 dark:hover:bg-cyber-800 text-slate-500 dark:text-slate-400 rounded transition-all text-[10px] font-bold flex items-center space-x-1"
              title="Copy code"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>{copied ? 'Copied!' : 'Copy'}</span>
            </button>
            <button
              onClick={handleDownloadCode}
              className="p-1 hover:bg-slate-200 dark:hover:bg-cyber-800 text-slate-500 dark:text-slate-400 rounded transition-all text-[10px] font-bold flex items-center space-x-1"
              title="Download file"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Save</span>
            </button>
          </div>
        )}
      </div>

      {/* Panel Inner Content */}
      <div className="flex-1 overflow-hidden bg-slate-50 dark:bg-cyber-950/15">
        {activeBottomTab === 'code' && (
          <div className="w-full h-full flex flex-col">
            {/* Code subtabs */}
            <div className="h-8 border-b border-slate-100 dark:border-cyber-855 px-4 flex items-center space-x-3 bg-white dark:bg-cyber-900 select-none text-[10px] font-bold">
              <button
                onClick={() => setActiveCodeSubTab('functional')}
                className={`px-2 py-1 rounded transition-colors ${
                  activeCodeSubTab === 'functional'
                    ? 'bg-slate-100 dark:bg-cyber-800 text-slate-700 dark:text-slate-200'
                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                }`}
              >
                Keras Functional
              </button>
              <button
                onClick={() => setActiveCodeSubTab('sequential')}
                className={`px-2 py-1 rounded transition-colors ${
                  activeCodeSubTab === 'sequential'
                    ? 'bg-slate-100 dark:bg-cyber-800 text-slate-700 dark:text-slate-200'
                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                }`}
              >
                Keras Sequential
              </button>
              <button
                onClick={() => setActiveCodeSubTab('pytorch')}
                className={`px-2 py-1 rounded transition-colors ${
                  activeCodeSubTab === 'pytorch'
                    ? 'bg-slate-100 dark:bg-cyber-800 text-slate-700 dark:text-slate-200'
                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                }`}
              >
                PyTorch Model
              </button>
              <button
                onClick={() => setActiveCodeSubTab('tfjs')}
                className={`px-2 py-1 rounded transition-colors ${
                  activeCodeSubTab === 'tfjs'
                    ? 'bg-slate-100 dark:bg-cyber-800 text-slate-700 dark:text-slate-200'
                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                }`}
              >
                TensorFlow.js
              </button>
              <div className="h-4 w-px bg-slate-200 dark:bg-cyber-800" />
              <button
                onClick={() => setActiveCodeSubTab('train')}
                className={`px-2 py-1 rounded transition-colors text-emerald-600 dark:text-emerald-400 flex items-center space-x-1 ${
                  activeCodeSubTab === 'train'
                    ? 'bg-slate-100 dark:bg-cyber-800'
                    : 'hover:text-emerald-700'
                }`}
              >
                <Play className="w-2.5 h-2.5 fill-current" />
                <span>Full train.py pipeline</span>
              </button>
            </div>

            {/* Monaco code view */}
            <div className="flex-1 min-h-0">
              <Editor
                height="100%"
                language={activeCodeSubTab === 'tfjs' ? 'javascript' : 'python'}
                theme={theme === 'dark' ? 'vs-dark' : 'light'}
                value={currentCode}
                options={{
                  readOnly: true,
                  minimap: { enabled: false },
                  fontSize: 11,
                  fontFamily: 'JetBrains Mono, Fira Code, monospace',
                  lineNumbers: 'on',
                  scrollBeyondLastLine: false,
                  automaticLayout: true
                }}
              />
            </div>
          </div>
        )}

        {activeBottomTab === 'summary' && (
          <div className="w-full h-full flex flex-col overflow-hidden p-4">
            {nodes.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center text-slate-400 select-none">
                <Table className="w-8 h-8 opacity-30 mb-2" />
                <span className="text-xs font-bold">No summary details. Add layers to compile stats.</span>
              </div>
            ) : (
              <div className="flex-1 flex flex-col min-h-0">
                {/* Metrics dashboard */}
                <div className="grid grid-cols-5 gap-4 mb-4 shrink-0 select-none">
                  <div className="bg-white dark:bg-cyber-900 border border-slate-200 dark:border-cyber-800 rounded-lg p-2.5">
                    <span className="block text-[8px] font-bold text-slate-400 uppercase tracking-wider">Total Params</span>
                    <span className="text-xs font-extrabold text-slate-800 dark:text-slate-100 font-mono">
                      {metrics.totalParams.toLocaleString()}
                    </span>
                  </div>
                  <div className="bg-white dark:bg-cyber-900 border border-slate-200 dark:border-cyber-800 rounded-lg p-2.5">
                    <span className="block text-[8px] font-bold text-slate-400 uppercase tracking-wider">Trainable Params</span>
                    <span className="text-xs font-extrabold text-blue-500 font-mono">
                      {metrics.trainableParams.toLocaleString()}
                    </span>
                  </div>
                  <div className="bg-white dark:bg-cyber-900 border border-slate-200 dark:border-cyber-800 rounded-lg p-2.5">
                    <span className="block text-[8px] font-bold text-slate-400 uppercase tracking-wider">Non-Trainable</span>
                    <span className="text-xs font-extrabold text-slate-400 font-mono">
                      {metrics.nonTrainableParams.toLocaleString()}
                    </span>
                  </div>
                  <div className="bg-white dark:bg-cyber-900 border border-slate-200 dark:border-cyber-800 rounded-lg p-2.5">
                    <span className="block text-[8px] font-bold text-slate-400 uppercase tracking-wider">Estimated Size</span>
                    <span className="text-xs font-extrabold text-emerald-500 font-mono">
                      {formatSize(metrics.totalMemoryBytes)}
                    </span>
                  </div>
                  <div className="bg-white dark:bg-cyber-900 border border-slate-200 dark:border-cyber-800 rounded-lg p-2.5">
                    <span className="block text-[8px] font-bold text-slate-400 uppercase tracking-wider">Est. FLOPs</span>
                    <span className="text-xs font-extrabold text-purple-500 font-mono">
                      {formatFlops(metrics.totalFlops)}
                    </span>
                  </div>
                </div>

                {/* Table */}
                <div className="flex-1 min-h-0 overflow-y-auto border border-slate-200 dark:border-cyber-800 rounded-lg bg-white dark:bg-cyber-900">
                  <table className="w-full text-left text-[11px] font-sans">
                    <thead className="bg-slate-50 dark:bg-cyber-950 text-slate-500 dark:text-slate-450 uppercase font-bold sticky top-0 border-b border-slate-100 dark:border-cyber-850 select-none">
                      <tr>
                        <th className="px-4 py-2">Layer Name</th>
                        <th className="px-4 py-2">Type</th>
                        <th className="px-4 py-2">Output Shape</th>
                        <th className="px-4 py-2 text-right">Parameters</th>
                        <th className="px-4 py-2 text-right">FLOPs</th>
                        <th className="px-4 py-2 text-right">Size</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-cyber-850 font-semibold text-slate-700 dark:text-slate-300">
                      {metrics.layers.map((l) => (
                        <tr key={l.id} className="hover:bg-slate-50/50 dark:hover:bg-cyber-950/20">
                          <td className="px-4 py-1.5 font-mono">{l.name}</td>
                          <td className="px-4 py-1.5">{l.type}</td>
                          <td className="px-4 py-1.5 font-mono text-emerald-600 dark:text-emerald-450">{l.outputShape}</td>
                          <td className="px-4 py-1.5 text-right font-mono">{l.totalParams.toLocaleString()}</td>
                          <td className="px-4 py-1.5 text-right font-mono">{formatFlops(l.flops)}</td>
                          <td className="px-4 py-1.5 text-right font-mono">{formatSize(l.memoryBytes)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {activeBottomTab === 'console' && (
          <div className="w-full h-full flex flex-col p-4 overflow-y-auto">
            {validationErrors.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center text-slate-400 select-none">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mb-2 opacity-80" />
                <span className="text-xs font-bold">No errors detected. Neural network configuration is valid!</span>
              </div>
            ) : (
              <div className="space-y-2">
                {validationErrors.map((err, i) => (
                  <div
                    key={i}
                    onClick={() => handleFocusNode(err.nodeId)}
                    className="group border border-rose-200/50 dark:border-rose-900/40 bg-rose-50/30 dark:bg-rose-950/10 p-3 rounded-lg flex items-start justify-between cursor-pointer hover:border-rose-500 hover:bg-rose-100/10 transition-all"
                  >
                    <div className="flex items-start space-x-3 pr-4">
                      <AlertTriangle className="w-4.5 h-4.5 text-rose-500 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wide block">
                          {err.type.replace('_', ' ')}
                        </span>
                        <p className="text-xs font-medium text-slate-700 dark:text-slate-300 mt-0.5">
                          {err.message}
                        </p>
                      </div>
                    </div>
                    <button className="text-xs font-bold text-rose-500 group-hover:text-rose-600 flex items-center space-x-1 select-none opacity-0 group-hover:opacity-100 transition-opacity">
                      <span>Inspect Node</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
