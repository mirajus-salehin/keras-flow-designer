import { Node, Edge } from '@xyflow/react';
import { NodeData, DatasetConfig } from '../../types/network';

// Helper: parse shape string e.g. "(None, 224, 224, 3)" into [null, 224, 224, 3]
export const parseShapeString = (shapeStr: string): (number | null)[] => {
  if (!shapeStr) return [];
  const clean = shapeStr.replace(/[()\[\]\s]/g, '');
  return clean.split(',').map(part => {
    if (part === 'None' || part === 'null' || part === '?' || part === '') return null;
    const num = parseInt(part, 10);
    return isNaN(num) ? null : num;
  });
};

// Helper: format shape array e.g. [null, 224, 224, 3] into "(None, 224, 224, 3)"
export const formatShapeArray = (shapeArr: (number | null)[]): string => {
  if (!shapeArr || shapeArr.length === 0) return '()';
  const parts = shapeArr.map(dim => (dim === null ? 'None' : dim.toString()));
  return `(${parts.join(', ')})`;
};

// Math Helpers for Padding
const getConvOutputDim = (inputSize: number | null, kernelSize: number, stride: number, padding: string): number | null => {
  if (inputSize === null) return null;
  if (padding === 'same') {
    return Math.ceil(inputSize / stride);
  } else {
    return Math.ceil((inputSize - kernelSize + 1) / stride);
  }
};

const getConvTransposeOutputDim = (inputSize: number | null, kernelSize: number, stride: number, padding: string): number | null => {
  if (inputSize === null) return null;
  if (padding === 'same') {
    return inputSize * stride;
  } else {
    return (inputSize - 1) * stride + kernelSize;
  }
};

// Helper to convert single values or array parameters into a number array
const parseTupleParam = (param: any, expectedLen: number, defaultVal: number): number[] => {
  if (typeof param === 'number') {
    return Array(expectedLen).fill(param);
  }
  if (Array.isArray(param)) {
    const numbers = param.map(x => (typeof x === 'number' ? x : parseInt(x, 10) || defaultVal));
    while (numbers.length < expectedLen) numbers.push(defaultVal);
    return numbers.slice(0, expectedLen);
  }
  if (typeof param === 'string') {
    const cleaned = param.replace(/[()\[\]\s]/g, '');
    const parts = cleaned.split(',').map(x => parseInt(x, 10) || defaultVal);
    while (parts.length < expectedLen) parts.push(defaultVal);
    return parts.slice(0, expectedLen);
  }
  return Array(expectedLen).fill(defaultVal);
};

// Helper to convert single values or array parameters into a number array with variable length
const parseVariableTupleParam = (param: any, defaultVal = 32): number[] => {
  if (typeof param === 'number') {
    return [param];
  }
  if (Array.isArray(param)) {
    return param.map(x => (typeof x === 'number' ? x : parseInt(x, 10) || defaultVal));
  }
  if (typeof param === 'string') {
    const cleaned = param.replace(/[()\[\]\s]/g, '');
    if (!cleaned) return [];
    return cleaned.split(',').map(x => parseInt(x, 10) || defaultVal);
  }
  return [];
};

export const computeOutputShape = (
  layerType: string,
  inputShapes: (number | null)[][],
  params: Record<string, any>,
  dataset: DatasetConfig
): (number | null)[] => {
  const isInputLayer = ['Input', 'InputLayer', 'ImageInput', 'FeatureInput', 'SequenceInput', 'VolumeInput'].includes(layerType);

  // If no inputs and not an Input layer, shape is undetermined
  if (inputShapes.length === 0 && !isInputLayer) {
    return [null, null];
  }

  const primaryInput = inputShapes[0] || [null];

  switch (layerType) {
    case 'Input': {
      const shapeVal = params.shape;
      const parsedShape = parseVariableTupleParam(shapeVal, 224);
      return [params.batch_size !== null ? params.batch_size : null, ...parsedShape];
    }
    
    case 'InputLayer': {
      const shapeVal = params.input_shape;
      const parsedShape = parseVariableTupleParam(shapeVal, 224);
      return [null, ...parsedShape];
    }

    case 'ImageInput': {
      const h = parseInt(params.height, 10) || 224;
      const w = parseInt(params.width, 10) || 224;
      const c = parseInt(params.channels, 10) || 3;
      return [null, h, w, c];
    }

    case 'FeatureInput': {
      const f = parseInt(params.features, 10) || 100;
      return [null, f];
    }

    case 'SequenceInput': {
      const t = parseInt(params.timesteps, 10) || 100;
      const f = parseInt(params.features, 10) || 64;
      return [null, t, f];
    }

    case 'VolumeInput': {
      const d = parseInt(params.depth, 10) || 32;
      const h = parseInt(params.height, 10) || 32;
      const w = parseInt(params.width, 10) || 32;
      const c = parseInt(params.channels, 10) || 1;
      return [null, d, h, w, c];
    }

    case 'Dense': {
      const units = parseInt(params.units, 10) || 32;
      const out = [...primaryInput];
      if (out.length > 0) {
        out[out.length - 1] = units;
      } else {
        out.push(units);
      }
      return out;
    }

    case 'Flatten': {
      const batch = primaryInput[0];
      const rest = primaryInput.slice(1);
      if (rest.some(dim => dim === null)) {
        return [batch, null]; // Undetermined size
      }
      const flatSize = rest.reduce((acc: number, val) => acc * (val || 1), 1);
      return [batch, flatSize];
    }

    case 'Reshape': {
      const batch = primaryInput[0];
      const targetShape = parseVariableTupleParam(params.target_shape, 1);
      return [batch, ...targetShape];
    }

    case 'Permute': {
      const dims = parseVariableTupleParam(params.dims, 1);
      // dims are 1-indexed references to dimensions excluding batch
      const out = [primaryInput[0]];
      for (let i = 0; i < dims.length; i++) {
        const index = dims[i];
        out.push(primaryInput[index] !== undefined ? primaryInput[index] : null);
      }
      return out;
    }

    case 'RepeatVector': {
      const n = parseInt(params.n, 10) || 2;
      const batch = primaryInput[0];
      const feature = primaryInput[1] || null;
      return [batch, n, feature];
    }

    case 'Conv1D': {
      const batch = primaryInput[0];
      const length = primaryInput[1] || null;
      const filters = parseInt(params.filters, 10) || 32;
      const kernelSize = parseInt(params.kernel_size, 10) || 3;
      const strides = parseInt(params.strides, 10) || 1;
      const padding = params.padding || 'valid';
      
      const newLength = getConvOutputDim(length, kernelSize, strides, padding);
      return [batch, newLength, filters];
    }

    case 'Conv2D':
    case 'SeparableConv2D':
    case 'DepthwiseConv2D': {
      const batch = primaryInput[0];
      const h = primaryInput[1] || null;
      const w = primaryInput[2] || null;
      const c = primaryInput[3] || null;
      
      const filters = layerType === 'DepthwiseConv2D' ? c : (parseInt(params.filters, 10) || 32);
      const kernel = parseTupleParam(params.kernel_size, 2, 3);
      const stride = parseTupleParam(params.strides, 2, 1);
      const padding = params.padding || 'same';

      const newH = getConvOutputDim(h, kernel[0], stride[0], padding);
      const newW = getConvOutputDim(w, kernel[1], stride[1], padding);
      return [batch, newH, newW, filters];
    }

    case 'Conv3D': {
      const batch = primaryInput[0];
      const d = primaryInput[1] || null;
      const h = primaryInput[2] || null;
      const w = primaryInput[3] || null;
      
      const filters = parseInt(params.filters, 10) || 32;
      const kernel = parseTupleParam(params.kernel_size, 3, 3);
      const stride = parseTupleParam(params.strides, 3, 1);
      const padding = params.padding || 'valid';

      const newD = getConvOutputDim(d, kernel[0], stride[0], padding);
      const newH = getConvOutputDim(h, kernel[1], stride[1], padding);
      const newW = getConvOutputDim(w, kernel[2], stride[2], padding);
      return [batch, newD, newH, newW, filters];
    }

    case 'Conv1DTranspose': {
      const batch = primaryInput[0];
      const length = primaryInput[1] || null;
      const filters = parseInt(params.filters, 10) || 32;
      const kernelSize = parseInt(params.kernel_size, 10) || 3;
      const strides = parseInt(params.strides, 10) || 1;
      const padding = params.padding || 'valid';
      
      const newLength = getConvTransposeOutputDim(length, kernelSize, strides, padding);
      return [batch, newLength, filters];
    }

    case 'Conv2DTranspose': {
      const batch = primaryInput[0];
      const h = primaryInput[1] || null;
      const w = primaryInput[2] || null;
      
      const filters = parseInt(params.filters, 10) || 32;
      const kernel = parseTupleParam(params.kernel_size, 2, 3);
      const stride = parseTupleParam(params.strides, 2, 2);
      const padding = params.padding || 'same';

      const newH = getConvTransposeOutputDim(h, kernel[0], stride[0], padding);
      const newW = getConvTransposeOutputDim(w, kernel[1], stride[1], padding);
      return [batch, newH, newW, filters];
    }

    case 'Conv3DTranspose': {
      const batch = primaryInput[0];
      const d = primaryInput[1] || null;
      const h = primaryInput[2] || null;
      const w = primaryInput[3] || null;
      
      const filters = parseInt(params.filters, 10) || 32;
      const kernel = parseTupleParam(params.kernel_size, 3, 3);
      const stride = parseTupleParam(params.strides, 3, 2);
      const padding = params.padding || 'same';

      const newD = getConvTransposeOutputDim(d, kernel[0], stride[0], padding);
      const newH = getConvTransposeOutputDim(h, kernel[1], stride[1], padding);
      const newW = getConvTransposeOutputDim(w, kernel[2], stride[2], padding);
      return [batch, newD, newH, newW, filters];
    }

    case 'MaxPooling1D':
    case 'AveragePooling1D': {
      const batch = primaryInput[0];
      const length = primaryInput[1] || null;
      const channels = primaryInput[2] || null;
      
      const poolSize = parseInt(params.pool_size, 10) || 2;
      const strides = parseInt(params.strides, 10) || poolSize;
      const padding = params.padding || 'valid';

      const newLength = getConvOutputDim(length, poolSize, strides, padding);
      return [batch, newLength, channels];
    }

    case 'MaxPooling2D':
    case 'AveragePooling2D': {
      const batch = primaryInput[0];
      const h = primaryInput[1] || null;
      const w = primaryInput[2] || null;
      const c = primaryInput[3] || null;

      const pool = parseTupleParam(params.pool_size, 2, 2);
      const stride = parseTupleParam(params.strides || params.pool_size, 2, pool[0]);
      const padding = params.padding || 'valid';

      const newH = getConvOutputDim(h, pool[0], stride[0], padding);
      const newW = getConvOutputDim(w, pool[1], stride[1], padding);
      return [batch, newH, newW, c];
    }

    case 'MaxPooling3D':
    case 'AveragePooling3D': {
      const batch = primaryInput[0];
      const d = primaryInput[1] || null;
      const h = primaryInput[2] || null;
      const w = primaryInput[3] || null;
      const c = primaryInput[4] || null;

      const pool = parseTupleParam(params.pool_size, 3, 2);
      const stride = parseTupleParam(params.strides || params.pool_size, 3, pool[0]);
      const padding = params.padding || 'valid';

      const newD = getConvOutputDim(d, pool[0], stride[0], padding);
      const newH = getConvOutputDim(h, pool[1], stride[1], padding);
      const newW = getConvOutputDim(w, pool[2], stride[2], padding);
      return [batch, newD, newH, newW, c];
    }

    case 'GlobalAveragePooling1D':
    case 'GlobalMaxPooling1D': {
      const batch = primaryInput[0];
      const c = primaryInput[2] || null;
      const keepdims = params.keepdims === true;
      return keepdims ? [batch, 1, c] : [batch, c];
    }

    case 'GlobalAveragePooling2D':
    case 'GlobalMaxPooling2D': {
      const batch = primaryInput[0];
      const c = primaryInput[3] || null;
      const keepdims = params.keepdims === true;
      return keepdims ? [batch, 1, 1, c] : [batch, c];
    }

    case 'GlobalAveragePooling3D':
    case 'GlobalMaxPooling3D': {
      const batch = primaryInput[0];
      const c = primaryInput[4] || null;
      const keepdims = params.keepdims === true;
      return keepdims ? [batch, 1, 1, 1, c] : [batch, c];
    }

    case 'SimpleRNN':
    case 'LSTM':
    case 'GRU': {
      const batch = primaryInput[0];
      const timesteps = primaryInput[1] || null;
      const units = parseInt(params.units, 10) || 32;
      const returnSequences = params.return_sequences === true;
      
      return returnSequences ? [batch, timesteps, units] : [batch, units];
    }

    case 'Bidirectional': {
      const batch = primaryInput[0];
      const timesteps = primaryInput[1] || null;
      const units = parseInt(params.units, 10) || 32;
      const mergeMode = params.merge_mode || 'concat';
      
      // We assume it wraps LSTM/GRU/RNN
      const returnSequences = true; // Bidirectionals can return sequences or not, let's treat return_sequences as true/false
      const baseUnits = mergeMode === 'concat' ? units * 2 : units;
      return [batch, timesteps, baseUnits];
    }

    case 'Embedding': {
      const batch = primaryInput[0];
      const seqLen = primaryInput[1] || null;
      const outputDim = parseInt(params.output_dim, 10) || 64;
      return [batch, seqLen, outputDim];
    }

    case 'Concatenate': {
      const axis = parseInt(params.axis, 10) || -1;
      const batch = primaryInput[0];
      
      // Calculate axis offset
      const positiveAxis = axis < 0 ? primaryInput.length + axis : axis;

      // Sum dimensions along selected axis
      let sumDim = 0;
      for (const inShape of inputShapes) {
        if (inShape[positiveAxis] === null) {
          sumDim = NaN; // Set to unknown if any input has unknown dim here
          break;
        }
        sumDim += inShape[positiveAxis] || 0;
      }
      
      const out = [...primaryInput];
      out[positiveAxis] = isNaN(sumDim) ? null : sumDim;
      return out;
    }

    case 'Dot': {
      // In Keras, dot product between two inputs reduces dimensions along axes
      const batch = primaryInput[0];
      return [batch, 1];
    }

    case 'Subtract':
    case 'Add':
    case 'Multiply':
    case 'Average':
    case 'Maximum':
    case 'Minimum': {
      // Dimension remains identical to inputs (element-wise)
      return primaryInput;
    }

    case 'Resizing': {
      const batch = primaryInput[0];
      const h = parseInt(params.height, 10) || 224;
      const w = parseInt(params.width, 10) || 224;
      const c = primaryInput[3] || null;
      return [batch, h, w, c];
    }

    case 'CenterCrop': {
      const batch = primaryInput[0];
      const h = parseInt(params.height, 10) || 112;
      const w = parseInt(params.width, 10) || 112;
      const c = primaryInput[3] || null;
      return [batch, h, w, c];
    }

    case 'ActivityRegularization':
    case 'GaussianNoise':
    case 'Rescaling':
    case 'RandomFlip':
    case 'RandomRotation':
    case 'RandomContrast':
    case 'RandomZoom':
    case 'RandomTranslation':
    case 'Dropout':
    case 'AlphaDropout':
    case 'GaussianDropout':
    case 'SpatialDropout1D':
    case 'SpatialDropout2D':
    case 'SpatialDropout3D':
    case 'BatchNormalization':
    case 'LayerNormalization':
    case 'GroupNormalization':
    case 'Activation':
    case 'Masking':
    case 'Lambda':
    case 'CustomLayer':
    default:
      // These layers pass shapes straight through
      return primaryInput;
  }
};

export const propagateShapes = (
  nodes: Node<NodeData>[],
  edges: Edge[],
  dataset: DatasetConfig
): Node<NodeData>[] => {
  const resultNodes = nodes.map(n => ({
    ...n,
    data: { ...n.data, inputShape: undefined, outputShape: undefined, inputShapes: {} } as NodeData
  }));

  // Build Adjacency Matrix & In-degree map
  const adjacencyList: Record<string, string[]> = {};
  const inDegree: Record<string, number> = {};

  resultNodes.forEach(node => {
    adjacencyList[node.id] = [];
    inDegree[node.id] = 0;
  });

  edges.forEach(edge => {
    // Only connect if source and target actually exist
    if (adjacencyList[edge.source] && adjacencyList[edge.target] !== undefined) {
      adjacencyList[edge.source].push(edge.target);
      inDegree[edge.target]++;
    }
  });

  // Queue of nodes with no incoming edges (roots)
  const queue: string[] = resultNodes.filter(node => inDegree[node.id] === 0).map(node => node.id);

  // Map to store calculated shapes during topological traversal
  const computedShapes: Record<string, (number | null)[]> = {};
  
  // Keep track of visited nodes to avoid infinite loop in cycle
  const visitedCount = 0;
  const topoOrder: string[] = [];

  while (queue.length > 0) {
    const nodeId = queue.shift()!;
    topoOrder.push(nodeId);

    const node = resultNodes.find(n => n.id === nodeId)!;
    
    // Gather output shapes of incoming edges
    const incomingEdges = edges.filter(e => e.target === nodeId);
    const incomingShapes: (number | null)[][] = [];
    const sourceShapesMap: Record<string, string> = {};

    incomingEdges.forEach(e => {
      const srcShape = computedShapes[e.source];
      if (srcShape) {
        incomingShapes.push(srcShape);
        sourceShapesMap[e.source] = formatShapeArray(srcShape);
      }
    });

    // Populate input shapes metadata on the node
    node.data.inputShapes = sourceShapesMap;
    if (incomingShapes.length > 0) {
      node.data.inputShape = formatShapeArray(incomingShapes[0]);
    } else if (node.data.layerType !== 'Input' && node.data.layerType !== 'InputLayer') {
      node.data.inputShape = '(?)';
    }

    // Compute this node's output shape
    const outShape = computeOutputShape(node.data.layerType, incomingShapes, node.data.params, dataset);
    computedShapes[nodeId] = outShape;
    node.data.outputShape = formatShapeArray(outShape);

    // Process targets
    const targets = adjacencyList[nodeId] || [];
    targets.forEach(targetId => {
      inDegree[targetId]--;
      if (inDegree[targetId] === 0) {
        queue.push(targetId);
      }
    });
  }

  // Handle remaining nodes in case of cycles (in-degrees never reached 0)
  resultNodes.forEach(node => {
    if (!computedShapes[node.id]) {
      node.data.inputShape = '(Cycle Error)';
      node.data.outputShape = '(Cycle Error)';
    }
  });

  return resultNodes;
};
