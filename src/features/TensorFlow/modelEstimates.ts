import { Node } from '@xyflow/react';
import { NodeData } from '../../types/network';
import { parseShapeString } from './shapePropagation';

export interface LayerSummaryItem {
  id: string;
  name: string;
  type: string;
  outputShape: string;
  totalParams: number;
  trainableParams: number;
  nonTrainableParams: number;
  flops: number;
  memoryBytes: number;
}

export interface ModelMetrics {
  layers: LayerSummaryItem[];
  totalParams: number;
  trainableParams: number;
  nonTrainableParams: number;
  totalFlops: number;
  totalMemoryBytes: number;
  depth: number;
}

const getProduct = (dims: (number | null)[]): number => {
  // Replace nulls (batch) with 1 for per-sample estimates
  return dims.reduce((acc: number, val) => acc * (val === null ? 1 : val), 1);
};

export const calculateLayerStats = (
  layerType: string,
  inputShapeStr: string | undefined,
  outputShapeStr: string | undefined,
  params: Record<string, any>
): { totalParams: number; trainableParams: number; flops: number; memoryBytes: number } => {
  let totalParams = 0;
  let trainableParams = 0;
  let flops = 0;
  let memoryBytes = 0;

  const inShape = parseShapeString(inputShapeStr || '');
  const outShape = parseShapeString(outputShapeStr || '');

  const inSize = inShape.length > 0 ? getProduct(inShape) : 0;
  const outSize = outShape.length > 0 ? getProduct(outShape) : 0;

  // Activation memory
  memoryBytes = outSize * 4; // float32 = 4 bytes

  switch (layerType) {
    case 'Dense': {
      const units = parseInt(params.units, 10) || 32;
      const useBias = params.use_bias !== false;
      const inDim = inShape.length > 0 ? inShape[inShape.length - 1] || 128 : 128;
      
      const weights = inDim * units;
      const bias = useBias ? units : 0;
      totalParams = weights + bias;
      trainableParams = totalParams;

      // FLOPs: Multiply-Accumulate is roughly 2 operations per weight
      flops = 2 * inDim * units + (useBias ? units : 0);
      break;
    }

    case 'Conv2D':
    case 'SeparableConv2D': {
      const filters = parseInt(params.filters, 10) || 32;
      const useBias = params.use_bias !== false;
      const inChannels = inShape.length > 3 ? inShape[3] || 3 : 3;
      
      let kernelH = 3;
      let kernelW = 3;
      if (Array.isArray(params.kernel_size)) {
        kernelH = params.kernel_size[0] || 3;
        kernelW = params.kernel_size[1] || 3;
      } else if (typeof params.kernel_size === 'number') {
        kernelH = params.kernel_size;
        kernelW = params.kernel_size;
      }

      if (layerType === 'Conv2D') {
        const weights = kernelH * kernelW * inChannels * filters;
        const bias = useBias ? filters : 0;
        totalParams = weights + bias;
        trainableParams = totalParams;

        // FLOPs: 2 * kernel_h * kernel_w * in_channels * filters * out_h * out_w
        const outH = outShape[1] || 1;
        const outW = outShape[2] || 1;
        flops = 2 * kernelH * kernelW * inChannels * filters * outH * outW;
      } else {
        // SeparableConv2D: depthwise + pointwise
        const depthwiseWeights = kernelH * kernelW * inChannels;
        const pointwiseWeights = inChannels * filters;
        const bias = useBias ? filters : 0;
        totalParams = depthwiseWeights + pointwiseWeights + bias;
        trainableParams = totalParams;

        const outH = outShape[1] || 1;
        const outW = outShape[2] || 1;
        flops = 2 * (kernelH * kernelW + filters) * inChannels * outH * outW;
      }
      break;
    }

    case 'DepthwiseConv2D': {
      const inChannels = inShape.length > 3 ? inShape[3] || 3 : 3;
      const useBias = params.use_bias !== false;
      let kernelH = 3;
      let kernelW = 3;
      if (Array.isArray(params.kernel_size)) {
        kernelH = params.kernel_size[0] || 3;
        kernelW = params.kernel_size[1] || 3;
      }
      
      totalParams = kernelH * kernelW * inChannels + (useBias ? inChannels : 0);
      trainableParams = totalParams;

      const outH = outShape[1] || 1;
      const outW = outShape[2] || 1;
      flops = 2 * kernelH * kernelW * inChannels * outH * outW;
      break;
    }

    case 'BatchNormalization': {
      const inChannels = inShape.length > 0 ? inShape[inShape.length - 1] || 32 : 32;
      // 4 parameters per channel: gamma (trainable), beta (trainable), moving_mean (non-trainable), moving_variance (non-trainable)
      totalParams = 4 * inChannels;
      trainableParams = 2 * inChannels;

      flops = 4 * inSize; // per sample normalize
      break;
    }

    case 'LayerNormalization': {
      const lastDim = inShape.length > 0 ? inShape[inShape.length - 1] || 32 : 32;
      // 2 parameters per feature: gamma (trainable), beta (trainable)
      totalParams = 2 * lastDim;
      trainableParams = totalParams;
      flops = 4 * inSize;
      break;
    }

    case 'LSTM':
    case 'GRU':
    case 'SimpleRNN': {
      const units = parseInt(params.units, 10) || 32;
      const inDim = inShape.length > 2 ? inShape[2] || 64 : 64;
      const useBias = params.use_bias !== false;
      const timesteps = inShape.length > 1 ? inShape[1] || 1 : 1;

      let gateMultiplier = 1;
      if (layerType === 'LSTM') gateMultiplier = 4;
      if (layerType === 'GRU') gateMultiplier = 3;

      // parameters = gates * units * (inputs + units + bias)
      const biasCount = useBias ? units : 0;
      totalParams = gateMultiplier * units * (inDim + units + (useBias ? 1 : 0));
      trainableParams = totalParams;

      // FLOPs: roughly gateMultiplier * units * (inDim + units) * 2 * timesteps
      flops = gateMultiplier * units * (inDim + units) * 2 * (timesteps || 1);
      break;
    }

    case 'Embedding': {
      const inputDim = parseInt(params.input_dim, 10) || 1000;
      const outputDim = parseInt(params.output_dim, 10) || 64;
      totalParams = inputDim * outputDim;
      trainableParams = totalParams;
      
      // Lookups are cheap, practically 0 flops in weight math, but weights are parameters
      flops = outSize; 
      break;
    }

    case 'MaxPooling2D':
    case 'AveragePooling2D': {
      let poolH = 2;
      let poolW = 2;
      if (Array.isArray(params.pool_size)) {
        poolH = params.pool_size[0] || 2;
        poolW = params.pool_size[1] || 2;
      }
      // FLOPs: pool_h * pool_w * outSize
      flops = poolH * poolW * outSize;
      break;
    }

    default:
      // Other layers (Activation, Dropout, Reshape, etc.) have 0 parameters and low operations
      totalParams = 0;
      trainableParams = 0;
      flops = inSize; // simple pass-through/activation flops
  }

  return { totalParams, trainableParams, flops, memoryBytes };
};

export const calculateModelMetrics = (nodes: Node<NodeData>[]): ModelMetrics => {
  const layerStatsList: LayerSummaryItem[] = [];
  let totalParams = 0;
  let trainableParams = 0;
  let nonTrainableParams = 0;
  let totalFlops = 0;
  let totalMemoryBytes = 0;
  let depth = 0;

  nodes.forEach(node => {
    // Skip comments/groups
    if (node.data.layerType === 'Comment' || node.data.layerType === 'Group') return;

    const stats = calculateLayerStats(
      node.data.layerType,
      node.data.inputShape,
      node.data.outputShape,
      node.data.params
    );

    const nonTrainable = stats.totalParams - stats.trainableParams;

    layerStatsList.push({
      id: node.id,
      name: node.data.params.name || node.id,
      type: node.data.layerType,
      outputShape: node.data.outputShape || '()',
      totalParams: stats.totalParams,
      trainableParams: stats.trainableParams,
      nonTrainableParams: nonTrainable,
      flops: stats.flops,
      memoryBytes: stats.memoryBytes
    });

    totalParams += stats.totalParams;
    trainableParams += stats.trainableParams;
    nonTrainableParams += nonTrainable;
    totalFlops += stats.flops;
    totalMemoryBytes += stats.memoryBytes;
    depth++;
  });

  return {
    layers: layerStatsList,
    totalParams,
    trainableParams,
    nonTrainableParams,
    totalFlops,
    totalMemoryBytes,
    depth
  };
};
export const formatSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const formatFlops = (flops: number): string => {
  if (flops === 0) return '0 FLOPs';
  const k = 1000;
  const sizes = ['FLOPs', 'kFLOPs', 'MFLOPs', 'GFLOPs', 'TFLOPs'];
  const i = Math.floor(Math.log(flops) / Math.log(k));
  return parseFloat((flops / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};
