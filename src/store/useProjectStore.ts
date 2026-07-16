import { create } from 'zustand';
import {
  Node,
  Edge,
  Connection,
  addEdge as rfAddEdge,
  applyNodeChanges,
  applyEdgeChanges,
  NodeChange,
  EdgeChange,
} from '@xyflow/react';
import {
  NodeData,
  TrainingConfig,
  DatasetConfig,
  ProjectMetadata,
  TabData,
  GraphValidationError,
} from '../types/network';
import { LAYER_DEFINITIONS } from '../utils/layerDefinitions';
import { propagateShapes } from '../features/TensorFlow/shapePropagation';
import { validateGraph } from '../features/Validation/graphValidator';

interface ProjectState {
  // Metadata & Persistance
  metadata: ProjectMetadata;
  recentProjects: { id: string; name: string; updatedAt: string }[];
  theme: 'dark' | 'light';
  autoSaveStatus: 'Saved' | 'Saving...' | 'Unsaved';
  
  // Tabs (Multi-Model Support)
  tabs: TabData[];
  activeTabId: string;

  // Graph State (Mirroring React Flow active tab)
  nodes: Node<NodeData>[];
  edges: Edge[];
  selectedNodeId: string | null;

  // Configuration Panels
  trainingConfig: TrainingConfig;
  datasetConfig: DatasetConfig;

  // Validation
  validationErrors: GraphValidationError[];

  // Undo/Redo Stacks
  past: { nodes: Node<NodeData>[]; edges: Edge[] }[];
  future: { nodes: Node<NodeData>[]; edges: Edge[] }[];

  // General UI state
  searchQuery: string;
  isSearchOpen: boolean;
  activeBottomTab: 'code' | 'summary' | 'console' | 'training' | 'dataset';

  // Actions - Project Management
  setTheme: (theme: 'dark' | 'light') => void;
  createNewProject: (name: string, description: string) => void;
  saveProject: () => void;
  loadProject: (projectJson: string) => void;
  loadRecentProject: (id: string) => void;
  deleteRecentProject: (id: string) => void;

  // Actions - Tabs
  addTab: (name: string) => void;
  switchTab: (tabId: string) => void;
  closeTab: (tabId: string) => void;
  renameTab: (tabId: string, newName: string) => void;

  // Actions - Graph Editor
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (connection: Connection) => void;
  addNode: (layerType: string, x: number, y: number) => void;
  addCommentNode: (x: number, y: number, color?: string) => void;
  addGroupNode: (x: number, y: number) => void;
  updateNodeParams: (nodeId: string, params: Record<string, any>) => void;
  updateNodeLabel: (nodeId: string, label: string) => void;
  toggleNodeCollapse: (nodeId: string) => void;
  deleteNode: (nodeId: string) => void;
  duplicateNode: (nodeId: string) => void;
  deleteEdge: (edgeId: string) => void;
  clearCanvas: () => void;

  // Actions - History
  takeSnapshot: () => void;
  undo: () => void;
  redo: () => void;

  // Actions - Configurations
  updateTrainingConfig: (config: Partial<TrainingConfig>) => void;
  updateDatasetConfig: (config: Partial<DatasetConfig>) => void;
  setBottomTab: (tab: 'code' | 'summary' | 'console' | 'training' | 'dataset') => void;
  setSelectedNode: (nodeId: string | null) => void;
  
  // Actions - Search Everywhere
  setSearchQuery: (query: string) => void;
  setSearchOpen: (open: boolean) => void;

  // Re-run Engine
  runEngine: () => void;
}

const DEFAULT_TRAINING_CONFIG: TrainingConfig = {
  optimizer: 'Adam',
  learningRate: 0.001,
  weightDecay: 0.0,
  loss: 'sparse_categorical_crossentropy',
  metrics: ['accuracy'],
  epochs: 10,
  batchSize: 32,
  mixedPrecision: false,
  gradientClipping: { enabled: false, clipValue: 1.0 },
  callbacks: {
    earlyStopping: { enabled: false, monitor: 'val_loss', patience: 3, restoreBestWeights: true },
    reduceLROnPlateau: { enabled: false, monitor: 'val_loss', factor: 0.1, patience: 2, minLR: 1e-6 },
    checkpoint: { enabled: false, filepath: 'model_checkpoint.keras', saveBestOnly: true, monitor: 'val_loss' },
    tensorBoard: { enabled: false, logDir: './logs', histogramFreq: 1 }
  }
};

const DEFAULT_DATASET_CONFIG: DatasetConfig = {
  type: 'MNIST',
  imageSize: [28, 28],
  channels: 1,
  normalization: true,
  trainSplit: 0.8,
  shuffle: true,
  prefetch: true,
  caching: true,
  augmentations: { randomFlip: false, randomRotation: false, randomZoom: false, randomContrast: false }
};

export const useProjectStore = create<ProjectState>((set, get) => {
  // LocalStorage Helpers
  const persistToLocalStorage = (_state: Partial<ProjectState>) => {
    try {
      const activeProjId = get().metadata.id;
      const dataToSave = {
        metadata: get().metadata,
        tabs: get().tabs.map(t =>
          t.id === get().activeTabId
            ? { ...t, nodes: get().nodes, edges: get().edges }
            : t
        ),
        activeTabId: get().activeTabId,
        trainingConfig: get().trainingConfig,
        datasetConfig: get().datasetConfig,
      };
      localStorage.setItem(`keras_flow_project_${activeProjId}`, JSON.stringify(dataToSave));
      
      // Update recent list
      const recents = get().recentProjects.filter(p => p.id !== activeProjId);
      const updatedRecents = [
        { id: activeProjId, name: get().metadata.name, updatedAt: new Date().toISOString() },
        ...recents
      ].slice(0, 10);
      localStorage.setItem('keras_flow_recents', JSON.stringify(updatedRecents));
      
      set({ recentProjects: updatedRecents, autoSaveStatus: 'Saved' });
    } catch (e) {
      console.error('Failed to auto-save project', e);
      set({ autoSaveStatus: 'Unsaved' });
    }
  };

  const getInitialTheme = (): 'dark' | 'light' => {
    const saved = localStorage.getItem('keras_flow_theme');
    if (saved === 'dark' || saved === 'light') return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  };

  const getRecentProjects = (): { id: string; name: string; updatedAt: string }[] => {
    try {
      return JSON.parse(localStorage.getItem('keras_flow_recents') || '[]');
    } catch {
      return [];
    }
  };

  return {
    metadata: {
      id: 'default',
      name: 'Untitled Project',
      description: 'A visual Keras network configuration.',
      version: '1.0.0',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    recentProjects: getRecentProjects(),
    theme: getInitialTheme(),
    autoSaveStatus: 'Saved',
    tabs: [{ id: 'main', name: 'model', nodes: [], edges: [] }],
    activeTabId: 'main',
    nodes: [],
    edges: [],
    selectedNodeId: null,
    trainingConfig: DEFAULT_TRAINING_CONFIG,
    datasetConfig: DEFAULT_DATASET_CONFIG,
    validationErrors: [],
    past: [],
    future: [],
    searchQuery: '',
    isSearchOpen: false,
    activeBottomTab: 'code',

    setTheme: (theme) => {
      localStorage.setItem('keras_flow_theme', theme);
      if (theme === 'dark') document.documentElement.classList.add('dark');
      else document.documentElement.classList.remove('dark');
      set({ theme });
    },

    createNewProject: (name, description) => {
      const id = crypto.randomUUID();
      const newProj = {
        metadata: {
          id,
          name: name || 'New Project',
          description: description || 'Visual model builder',
          version: '1.0.0',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        tabs: [{ id: 'model_1', name: 'model', nodes: [], edges: [] }],
        activeTabId: 'model_1',
        nodes: [],
        edges: [],
        selectedNodeId: null,
        trainingConfig: DEFAULT_TRAINING_CONFIG,
        datasetConfig: DEFAULT_DATASET_CONFIG,
        validationErrors: [],
        past: [],
        future: []
      };
      set(newProj);
      persistToLocalStorage(newProj);
    },

    saveProject: () => {
      set({ autoSaveStatus: 'Saving...' });
      persistToLocalStorage({});
    },

    loadProject: (projectJson) => {
      try {
        const parsed = JSON.parse(projectJson);
        if (!parsed.metadata || !parsed.tabs || !parsed.activeTabId) {
          throw new Error('Invalid project JSON structure.');
        }
        
        const activeTab = parsed.tabs.find((t: TabData) => t.id === parsed.activeTabId) || parsed.tabs[0];
        
        set({
          metadata: parsed.metadata,
          tabs: parsed.tabs,
          activeTabId: activeTab.id,
          nodes: activeTab.nodes || [],
          edges: activeTab.edges || [],
          trainingConfig: parsed.trainingConfig || DEFAULT_TRAINING_CONFIG,
          datasetConfig: parsed.datasetConfig || DEFAULT_DATASET_CONFIG,
          selectedNodeId: null,
          past: [],
          future: []
        });
        
        get().runEngine();
        get().saveProject();
      } catch (err) {
        console.error('Failed to load project JSON', err);
        alert('Failed to load project: ' + (err as Error).message);
      }
    },

    loadRecentProject: (id) => {
      const saved = localStorage.getItem(`keras_flow_project_${id}`);
      if (saved) {
        get().loadProject(saved);
      } else {
        alert('Project not found in local storage.');
      }
    },

    deleteRecentProject: (id) => {
      localStorage.removeItem(`keras_flow_project_${id}`);
      const updated = get().recentProjects.filter(p => p.id !== id);
      localStorage.setItem('keras_flow_recents', JSON.stringify(updated));
      set({ recentProjects: updated });
    },

    // Tabs
    addTab: (name) => {
      const id = 'model_' + crypto.randomUUID().slice(0, 8);
      const newTab: TabData = { id, name: name || `model_${get().tabs.length + 1}`, nodes: [], edges: [] };
      const updatedTabs = [
        ...get().tabs.map(t => t.id === get().activeTabId ? { ...t, nodes: get().nodes, edges: get().edges } : t),
        newTab
      ];
      set({
        tabs: updatedTabs,
        activeTabId: id,
        nodes: [],
        edges: [],
        past: [],
        future: [],
        selectedNodeId: null
      });
      get().runEngine();
      get().saveProject();
    },

    switchTab: (tabId) => {
      if (tabId === get().activeTabId) return;
      const currentTabId = get().activeTabId;
      const updatedTabs = get().tabs.map(t =>
        t.id === currentTabId ? { ...t, nodes: get().nodes, edges: get().edges } : t
      );
      const nextTab = updatedTabs.find(t => t.id === tabId);
      if (!nextTab) return;

      set({
        tabs: updatedTabs,
        activeTabId: tabId,
        nodes: nextTab.nodes || [],
        edges: nextTab.edges || [],
        past: [],
        future: [],
        selectedNodeId: null
      });
      
      get().runEngine();
      get().saveProject();
    },

    closeTab: (tabId) => {
      if (get().tabs.length <= 1) return;
      const remainingTabs = get().tabs.filter(t => t.id !== tabId);
      let nextActiveId = get().activeTabId;
      if (get().activeTabId === tabId) {
        nextActiveId = remainingTabs[0].id;
      }
      
      const nextActiveTab = remainingTabs.find(t => t.id === nextActiveId)!;

      set({
        tabs: remainingTabs,
        activeTabId: nextActiveId,
        nodes: nextActiveTab.nodes || [],
        edges: nextActiveTab.edges || [],
        past: [],
        future: [],
        selectedNodeId: null
      });
      
      get().runEngine();
      get().saveProject();
    },

    renameTab: (tabId, newName) => {
      set({
        tabs: get().tabs.map(t => t.id === tabId ? { ...t, name: newName } : t)
      });
      get().saveProject();
    },

    // Graph Actions
    onNodesChange: (changes) => {
      set({
        nodes: applyNodeChanges(changes, get().nodes as any) as any,
      });
      // Filter out position and select changes for undo/redo snapshots to avoid flooding
      const isPosOrSelect = changes.some(c => c.type === 'position' || c.type === 'select');
      if (!isPosOrSelect) {
        get().takeSnapshot();
      }
      get().runEngine();
    },

    onEdgesChange: (changes) => {
      set({
        edges: applyEdgeChanges(changes, get().edges),
      });
      get().takeSnapshot();
      get().runEngine();
    },

    onConnect: (connection) => {
      const sourceNode = get().nodes.find(n => n.id === connection.source);
      const targetNode = get().nodes.find(n => n.id === connection.target);
      if (!sourceNode || !targetNode) return;

      // React Flow creates the connection
      const newEdges = rfAddEdge(connection, get().edges);
      set({ edges: newEdges });
      get().takeSnapshot();
      get().runEngine();
    },

    addNode: (layerType, x, y) => {
      const def = LAYER_DEFINITIONS[layerType];
      if (!def) return;

      const nodeId = `${layerType.toLowerCase()}_${crypto.randomUUID().slice(0, 6)}`;
      
      // Load default parameters
      const defaultParams: Record<string, any> = {};
      def.params.forEach(p => {
        defaultParams[p.name] = p.default;
      });

      // Special naming override
      if (defaultParams.name === '') {
        defaultParams.name = nodeId;
      }

      const newNode: Node<NodeData> = {
        id: nodeId,
        type: 'customLayerNode',
        position: { x, y },
        data: {
          label: layerType,
          layerType,
          category: def.category,
          params: defaultParams,
          isCollapsed: false,
          errors: []
        },
      };

      set({
        nodes: [...get().nodes, newNode],
      });
      get().takeSnapshot();
      get().runEngine();
    },

    addCommentNode: (x, y, color = '#fef08a') => {
      const nodeId = `comment_${crypto.randomUUID().slice(0, 6)}`;
      const newNode: Node<NodeData> = {
        id: nodeId,
        type: 'commentNode',
        position: { x, y },
        data: {
          label: 'Sticky Note',
          layerType: 'Comment',
          category: 'COMMENT',
          params: {},
          color,
          content: 'Double click to edit note...',
          width: 250,
          height: 180
        },
      };

      set({
        nodes: [...get().nodes, newNode],
      });
      get().takeSnapshot();
      get().saveProject();
    },

    addGroupNode: (x, y) => {
      const nodeId = `group_${crypto.randomUUID().slice(0, 6)}`;
      const newNode: Node<NodeData> = {
        id: nodeId,
        type: 'groupNode',
        position: { x, y },
        data: {
          label: 'Layer Group',
          layerType: 'Group',
          category: 'COMMENT',
          params: {},
          width: 400,
          height: 300,
          isCollapsed: false
        },
      };

      set({
        nodes: [...get().nodes, newNode],
      });
      get().takeSnapshot();
      get().saveProject();
    },

    updateNodeParams: (nodeId, params) => {
      set({
        nodes: get().nodes.map(n => {
          if (n.id === nodeId) {
            return {
              ...n,
              data: {
                ...n.data,
                params: {
                  ...n.data.params,
                  ...params,
                },
              },
            };
          }
          return n;
        }),
      });
      get().runEngine();
      get().saveProject();
    },

    updateNodeLabel: (nodeId, label) => {
      set({
        nodes: get().nodes.map(n => {
          if (n.id === nodeId) {
            return {
              ...n,
              data: { ...n.data, label },
            };
          }
          return n;
        }),
      });
      get().runEngine();
      get().saveProject();
    },

    toggleNodeCollapse: (nodeId) => {
      set({
        nodes: get().nodes.map(n => {
          if (n.id === nodeId) {
            return {
              ...n,
              data: { ...n.data, isCollapsed: !n.data.isCollapsed },
            };
          }
          return n;
        }),
      });
      get().saveProject();
    },

    deleteNode: (nodeId) => {
      set({
        nodes: get().nodes.filter(n => n.id !== nodeId),
        edges: get().edges.filter(e => e.source !== nodeId && e.target !== nodeId),
        selectedNodeId: get().selectedNodeId === nodeId ? null : get().selectedNodeId
      });
      get().takeSnapshot();
      get().runEngine();
    },

    duplicateNode: (nodeId) => {
      const nodeToCopy = get().nodes.find(n => n.id === nodeId);
      if (!nodeToCopy) return;

      const dupId = `${nodeToCopy.data.layerType.toLowerCase()}_${crypto.randomUUID().slice(0, 6)}`;
      const newParams = { ...nodeToCopy.data.params };
      if (newParams.name) {
        newParams.name = `${newParams.name}_copy`;
      }

      const duplicatedNode: Node<NodeData> = {
        ...nodeToCopy,
        id: dupId,
        position: {
          x: nodeToCopy.position.x + 40,
          y: nodeToCopy.position.y + 40,
        },
        selected: false,
        data: {
          ...nodeToCopy.data,
          params: newParams,
          errors: []
        },
      };

      set({
        nodes: [...get().nodes, duplicatedNode],
      });
      get().takeSnapshot();
      get().runEngine();
    },

    deleteEdge: (edgeId) => {
      set({
        edges: get().edges.filter(e => e.id !== edgeId),
      });
      get().takeSnapshot();
      get().runEngine();
    },

    clearCanvas: () => {
      set({ nodes: [], edges: [], selectedNodeId: null, past: [], future: [] });
      get().runEngine();
      get().saveProject();
    },

    // Configurations
    updateTrainingConfig: (config) => {
      set({
        trainingConfig: {
          ...get().trainingConfig,
          ...config,
          callbacks: {
            ...get().trainingConfig.callbacks,
            ...(config.callbacks || {})
          }
        }
      });
      get().saveProject();
    },

    updateDatasetConfig: (config) => {
      set({
        datasetConfig: {
          ...get().datasetConfig,
          ...config,
          augmentations: {
            ...get().datasetConfig.augmentations,
            ...(config.augmentations || {})
          }
        }
      });
      get().saveProject();
    },

    setBottomTab: (tab) => set({ activeBottomTab: tab }),

    setSelectedNode: (nodeId) => set({ selectedNodeId: nodeId }),

    setSearchQuery: (query) => set({ searchQuery: query }),
    setSearchOpen: (open) => set({ isSearchOpen: open }),

    // History Actions
    takeSnapshot: () => {
      const currentNodes = JSON.parse(JSON.stringify(get().nodes));
      const currentEdges = JSON.parse(JSON.stringify(get().edges));
      
      const newPast = [...get().past, { nodes: currentNodes, edges: currentEdges }].slice(-50); // limit 50
      set({
        past: newPast,
        future: [],
        autoSaveStatus: 'Unsaved'
      });
    },

    undo: () => {
      const past = get().past;
      if (past.length === 0) return;

      const previous = past[past.length - 1];
      const newPast = past.slice(0, past.length - 1);
      
      const currentNodes = JSON.parse(JSON.stringify(get().nodes));
      const currentEdges = JSON.parse(JSON.stringify(get().edges));

      set({
        nodes: previous.nodes,
        edges: previous.edges,
        past: newPast,
        future: [{ nodes: currentNodes, edges: currentEdges }, ...get().future],
        selectedNodeId: null
      });
      get().runEngine();
      get().saveProject();
    },

    redo: () => {
      const future = get().future;
      if (future.length === 0) return;

      const next = future[0];
      const newFuture = future.slice(1);

      const currentNodes = JSON.parse(JSON.stringify(get().nodes));
      const currentEdges = JSON.parse(JSON.stringify(get().edges));

      set({
        nodes: next.nodes,
        edges: next.edges,
        past: [...get().past, { nodes: currentNodes, edges: currentEdges }],
        future: newFuture,
        selectedNodeId: null
      });
      get().runEngine();
      get().saveProject();
    },

    // The Engine: runs shape propagation and model validation!
    runEngine: () => {
      const nodes = get().nodes;
      const edges = get().edges;
      const dataset = get().datasetConfig;

      // 1. Run Shape Propagation
      const nodesWithShapes = propagateShapes(nodes, edges, dataset);

      // 2. Validate Graph
      const errors = validateGraph(nodesWithShapes, edges);

      // 3. Map validation errors back into the nodes
      const finalNodes = nodesWithShapes.map(n => {
        const nodeErrors = errors.filter(e => e.nodeId === n.id).map(e => e.message);
        return {
          ...n,
          data: {
            ...n.data,
            errors: nodeErrors
          }
        };
      });

      set({
        nodes: finalNodes,
        validationErrors: errors
      });
    }
  };
});
