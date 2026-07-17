import { Node, Edge } from '@xyflow/react';
import { NodeData, GraphValidationError } from '../../types/network';
import { parseShapeString } from '../TensorFlow/shapePropagation';

export const validateGraph = (
  nodes: Node<NodeData>[],
  edges: Edge[]
): GraphValidationError[] => {
  const errors: GraphValidationError[] = [];
  
  if (nodes.length === 0) {
    return [];
  }

  // 1. Check for Missing Input Layers
  const inputNodes = nodes.filter(n => ['Input', 'InputLayer', 'ImageInput', 'FeatureInput', 'SequenceInput', 'VolumeInput'].includes(n.data.layerType));
  if (inputNodes.length === 0) {
    // Flag the first node (or add a general warning, but we must associate it with a nodeId or target)
    errors.push({
      nodeId: nodes[0].id,
      message: 'Model is missing an Input layer. Add an "Input" node from the Input category.',
      severity: 'error',
      type: 'missing_input'
    });
  }

  // 2. Kahn's Algorithm for Cycle Detection & Topological Sort Validation
  const adjacencyList: Record<string, string[]> = {};
  const inDegree: Record<string, number> = {};

  nodes.forEach(node => {
    adjacencyList[node.id] = [];
    inDegree[node.id] = 0;
  });

  edges.forEach(edge => {
    if (adjacencyList[edge.source] && adjacencyList[edge.target] !== undefined) {
      adjacencyList[edge.source].push(edge.target);
      inDegree[edge.target]++;
    }
  });

  const queue: string[] = nodes.filter(node => inDegree[node.id] === 0).map(node => node.id);
  const visited: string[] = [];

  while (queue.length > 0) {
    const nodeId = queue.shift()!;
    visited.push(nodeId);

    const targets = adjacencyList[nodeId] || [];
    targets.forEach(targetId => {
      inDegree[targetId]--;
      if (inDegree[targetId] === 0) {
        queue.push(targetId);
      }
    });
  }

  // If visited count < nodes count, there is a cycle!
  if (visited.length < nodes.length) {
    const cycleNodes = nodes.filter(n => !visited.includes(n.id) && n.data.layerType !== 'Comment' && n.data.layerType !== 'Group');
    cycleNodes.forEach(n => {
      errors.push({
        nodeId: n.id,
        message: 'Feedback loop detected. Keras Functional/Sequential models must be directed acyclic graphs (DAGs).',
        severity: 'error',
        type: 'cycle'
      });
    });
  }

  // 3. Check for Disconnected Nodes (excluding comments and groups)
  nodes.forEach(node => {
    if (node.data.layerType === 'Comment' || node.data.layerType === 'Group') return;

    const hasIncoming = edges.some(e => e.target === node.id);
    const hasOutgoing = edges.some(e => e.source === node.id);
    const isInput = ['Input', 'InputLayer', 'ImageInput', 'FeatureInput', 'SequenceInput', 'VolumeInput'].includes(node.data.layerType);

    if (!isInput && !hasIncoming) {
      errors.push({
        nodeId: node.id,
        message: `Disconnected layer: '${node.data.label}' has no inputs. Connect an preceding layer to its input port.`,
        severity: 'error',
        type: 'disconnected'
      });
    }
  });

  // 4. Duplicate Names Check
  const nameCounts: Record<string, number> = {};
  nodes.forEach(node => {
    if (node.data.layerType === 'Comment' || node.data.layerType === 'Group') return;
    const name = node.data.params.name;
    if (name) {
      nameCounts[name] = (nameCounts[name] || 0) + 1;
    }
  });

  nodes.forEach(node => {
    if (node.data.layerType === 'Comment' || node.data.layerType === 'Group') return;
    const name = node.data.params.name;
    if (name && nameCounts[name] > 1) {
      errors.push({
        nodeId: node.id,
        message: `Duplicate layer name: '${name}'. Every layer in Keras must have a unique name.`,
        severity: 'error',
        type: 'invalid_param'
      });
    }
  });

  // 5. Shape Validation / Input Mismatch Checks
  edges.forEach(edge => {
    const srcNode = nodes.find(n => n.id === edge.source);
    const dstNode = nodes.find(n => n.id === edge.target);
    if (!srcNode || !dstNode) return;

    const srcOutShape = srcNode.data.outputShape;
    if (!srcOutShape || srcOutShape === '()' || srcOutShape.includes('Error') || srcOutShape.includes('?')) return;

    const parsedOut = parseShapeString(srcOutShape);

    // E.g. Conv2D expects 4D inputs (None, height, width, channels)
    const dstType = dstNode.data.layerType;
    if (['Conv2D', 'Conv2DTranspose', 'MaxPooling2D', 'AveragePooling2D', 'GlobalAveragePooling2D', 'GlobalMaxPooling2D', 'SpatialDropout2D'].includes(dstType)) {
      if (parsedOut.length !== 4) {
        errors.push({
          nodeId: dstNode.id,
          message: `${dstType} expects a 4D input (batch, height, width, channels), but received a ${parsedOut.length}D tensor of shape ${srcOutShape} from '${srcNode.data.label}'. Consider inserting a Reshape or Flatten layer.`,
          severity: 'error',
          type: 'shape_mismatch'
        });
      }
    }

    // Conv1D expects 3D inputs (None, length, channels)
    if (['Conv1D', 'Conv1DTranspose', 'MaxPooling1D', 'AveragePooling1D', 'GlobalAveragePooling1D', 'GlobalMaxPooling1D', 'SpatialDropout1D', 'LSTM', 'GRU', 'SimpleRNN', 'Bidirectional'].includes(dstType)) {
      if (parsedOut.length !== 3) {
        errors.push({
          nodeId: dstNode.id,
          message: `${dstType} expects a 3D input (batch, timesteps, features), but received a ${parsedOut.length}D tensor of shape ${srcOutShape} from '${srcNode.data.label}'. Consider inserting a Reshape or Dense layer.`,
          severity: 'error',
          type: 'shape_mismatch'
        });
      }
    }

    // Conv3D expects 5D inputs
    if (['Conv3D', 'Conv3DTranspose', 'MaxPooling3D', 'AveragePooling3D', 'GlobalAveragePooling3D', 'GlobalMaxPooling3D', 'SpatialDropout3D'].includes(dstType)) {
      if (parsedOut.length !== 5) {
        errors.push({
          nodeId: dstNode.id,
          message: `${dstType} expects a 5D input (batch, depth, height, width, channels), but received a ${parsedOut.length}D tensor of shape ${srcOutShape} from '${srcNode.data.label}'.`,
          severity: 'error',
          type: 'shape_mismatch'
        });
      }
    }
  });

  // 6. Layer-Specific Parameter Validation
  nodes.forEach(node => {
    if (node.data.layerType === 'Comment' || node.data.layerType === 'Group') return;
    const p = node.data.params;

    if (node.data.layerType === 'Dense') {
      if (parseInt(p.units, 10) <= 0) {
        errors.push({
          nodeId: node.id,
          message: 'Dense Units must be a positive integer greater than 0.',
          severity: 'error',
          type: 'invalid_param'
        });
      }
    }

    if (['Conv1D', 'Conv2D', 'Conv3D', 'Conv1DTranspose', 'Conv2DTranspose', 'Conv3DTranspose', 'SeparableConv2D'].includes(node.data.layerType)) {
      if (parseInt(p.filters, 10) <= 0) {
        errors.push({
          nodeId: node.id,
          message: `${node.data.layerType} Filters must be a positive integer greater than 0.`,
          severity: 'error',
          type: 'invalid_param'
        });
      }
    }

    if (['Dropout', 'AlphaDropout', 'GaussianDropout', 'SpatialDropout1D', 'SpatialDropout2D', 'SpatialDropout3D'].includes(node.data.layerType)) {
      const rate = parseFloat(p.rate);
      if (isNaN(rate) || rate < 0 || rate >= 1) {
        errors.push({
          nodeId: node.id,
          message: 'Dropout rate must be between 0.0 (inclusive) and 1.0 (exclusive).',
          severity: 'error',
          type: 'invalid_param'
        });
      }
    }

    // Merge validation (e.g. Add/Concatenate dimension matching)
    if (node.data.layerType === 'Concatenate') {
      const incomingEdges = edges.filter(e => e.target === node.id);
      if (incomingEdges.length >= 2) {
        const firstEdge = incomingEdges[0];
        const firstSrc = nodes.find(n => n.id === firstEdge.source);
        const firstShapeStr = firstSrc?.data.outputShape;
        
        if (firstShapeStr && firstShapeStr !== '()') {
          const firstShape = parseShapeString(firstShapeStr);
          const axis = parseInt(p.axis, 10) || -1;
          const positiveAxis = axis < 0 ? firstShape.length + axis : axis;

          for (let i = 1; i < incomingEdges.length; i++) {
            const nextEdge = incomingEdges[i];
            const nextSrc = nodes.find(n => n.id === nextEdge.source);
            const nextShapeStr = nextSrc?.data.outputShape;
            
            if (nextShapeStr && nextShapeStr !== '()') {
              const nextShape = parseShapeString(nextShapeStr);
              if (firstShape.length !== nextShape.length) {
                errors.push({
                  nodeId: node.id,
                  message: `Concatenate rank mismatch: Cannot merge tensor of shape ${firstShapeStr} and ${nextShapeStr}. Rank must match.`,
                  severity: 'error',
                  type: 'shape_mismatch'
                });
                break;
              }

              // Check other dimensions
              for (let d = 0; d < firstShape.length; d++) {
                if (d !== positiveAxis && firstShape[d] !== nextShape[d] && firstShape[d] !== null && nextShape[d] !== null) {
                  errors.push({
                    nodeId: node.id,
                    message: `Concatenate dimension mismatch: Incompatible shapes ${firstShapeStr} and ${nextShapeStr} at dimension index ${d}. Only concatenation axis (index ${positiveAxis}) can differ.`,
                    severity: 'error',
                    type: 'shape_mismatch'
                  });
                  break;
                }
              }
            }
          }
        }
      }
    }

    if (['Add', 'Multiply', 'Average', 'Maximum', 'Minimum', 'Subtract'].includes(node.data.layerType)) {
      const incomingEdges = edges.filter(e => e.target === node.id);
      if (incomingEdges.length >= 2) {
        const firstShapeStr = nodes.find(n => n.id === incomingEdges[0].source)?.data.outputShape;
        if (firstShapeStr && firstShapeStr !== '()') {
          const firstShape = parseShapeString(firstShapeStr);
          for (let i = 1; i < incomingEdges.length; i++) {
            const nextShapeStr = nodes.find(n => n.id === incomingEdges[i].source)?.data.outputShape;
            if (nextShapeStr && nextShapeStr !== '()') {
              const nextShape = parseShapeString(nextShapeStr);
              const shapeMismatch = firstShape.length !== nextShape.length || 
                firstShape.some((val, idx) => val !== nextShape[idx] && val !== null && nextShape[idx] !== null);
              
              if (shapeMismatch) {
                errors.push({
                  nodeId: node.id,
                  message: `${node.data.layerType} layer requires all inputs to have identical shapes, but received shapes ${firstShapeStr} and ${nextShapeStr}.`,
                  severity: 'error',
                  type: 'shape_mismatch'
                });
                break;
              }
            }
          }
        }
      }
    }
  });

  return errors;
};
