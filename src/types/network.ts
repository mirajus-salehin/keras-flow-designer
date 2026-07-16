export type LayerCategory =
  | 'INPUT'
  | 'CORE'
  | 'CONVOLUTION'
  | 'POOLING'
  | 'NORMALIZATION'
  | 'DROPOUT'
  | 'RECURRENT'
  | 'ATTENTION'
  | 'EMBEDDING'
  | 'MERGE'
  | 'IMAGE_PREPROCESSING'
  | 'REGULARIZATION'
  | 'NOISE'
  | 'CUSTOM'
  | 'COMMENT';

export type ParamType =
  | 'text'
  | 'number'
  | 'select'
  | 'boolean'
  | 'tuple'
  | 'json'
  | 'slider';

export interface ParameterDefinition {
  name: string;
  label: string;
  type: ParamType;
  default: any;
  options?: string[];
  min?: number;
  max?: number;
  step?: number;
  description?: string;
  required?: boolean;
}

export interface LayerDefinition {
  type: string;
  category: LayerCategory;
  label: string;
  description: string;
  params: ParameterDefinition[];
  inputsCount: number | 'variable';
  outputsCount: number;
}

export interface NodeData {
  label: string;
  layerType: string;
  category: LayerCategory;
  params: Record<string, any>;
  inputShape?: string; // e.g. "(None, 224, 224, 3)"
  outputShape?: string; // e.g. "(None, 224, 224, 32)"
  inputShapes?: Record<string, string>; // for merge layers with multiple inputs
  errors?: string[];
  isCollapsed?: boolean;
  color?: string; // For comment nodes / sticky notes
  content?: string; // For comment nodes
  width?: number; // Optional for groups/sticky notes
  height?: number; // Optional for groups/sticky notes
  [key: string]: any; // Index signature for React Flow constraint
}

export type OptimizerType = 'Adam' | 'SGD' | 'AdamW' | 'RMSprop' | 'Adagrad' | 'Nadam' | 'FTRL';

export interface CallbackConfig {
  earlyStopping: {
    enabled: boolean;
    monitor: string;
    patience: number;
    restoreBestWeights: boolean;
  };
  reduceLROnPlateau: {
    enabled: boolean;
    monitor: string;
    factor: number;
    patience: number;
    minLR: number;
  };
  checkpoint: {
    enabled: boolean;
    filepath: string;
    saveBestOnly: boolean;
    monitor: string;
  };
  tensorBoard: {
    enabled: boolean;
    logDir: string;
    histogramFreq: number;
  };
}

export interface TrainingConfig {
  optimizer: OptimizerType;
  learningRate: number;
  weightDecay: number;
  loss: string;
  metrics: string[];
  epochs: number;
  batchSize: number;
  mixedPrecision: boolean;
  gradientClipping: {
    enabled: boolean;
    clipValue: number;
  };
  callbacks: CallbackConfig;
}

export type DatasetType =
  | 'MNIST'
  | 'Fashion MNIST'
  | 'CIFAR10'
  | 'CIFAR100'
  | 'Image Folder'
  | 'CSV'
  | 'TFRecord'
  | 'Custom';

export interface DatasetConfig {
  type: DatasetType;
  imageSize: [number, number]; // e.g. [224, 224]
  channels: number; // e.g. 3
  normalization: boolean;
  trainSplit: number; // e.g. 0.8
  shuffle: boolean;
  prefetch: boolean;
  caching: boolean;
  augmentations: {
    randomFlip: boolean;
    randomRotation: boolean;
    randomZoom: boolean;
    randomContrast: boolean;
  };
  csvPath?: string;
  imageFolderPath?: string;
  labelColumn?: string;
}

export interface ProjectMetadata {
  id: string;
  name: string;
  description: string;
  version: string;
  createdAt: string;
  updatedAt: string;
}

export interface TabData {
  id: string;
  name: string;
  nodes: any[];
  edges: any[];
  viewport?: { x: number; y: number; zoom: number };
}

export interface GraphValidationError {
  nodeId: string;
  message: string;
  severity: 'error' | 'warning';
  type: 'cycle' | 'shape_mismatch' | 'disconnected' | 'missing_input' | 'missing_output' | 'invalid_param';
}
