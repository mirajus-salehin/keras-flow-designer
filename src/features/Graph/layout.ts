import dagre from '@dagrejs/dagre';
import { Node, Edge } from '@xyflow/react';
import { NodeData } from '../../types/network';

export const getLayoutedElements = (
  nodes: Node<NodeData>[],
  edges: Edge[],
  direction: 'LR' | 'TB' = 'LR'
): { nodes: Node<NodeData>[]; edges: Edge[] } => {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));

  const isHorizontal = direction === 'LR';
  dagreGraph.setGraph({
    rankdir: direction,
    nodesep: 60,
    ranksep: 100,
    align: 'DL' // Align bottom-left
  });

  nodes.forEach(node => {
    // Standard node dimensions
    let width = 220;
    let height = 120;

    // Handle dimensions for special comment nodes/sticky notes
    if (node.data.layerType === 'Comment' || node.data.layerType === 'Group') {
      width = node.data.width || 250;
      height = node.data.height || 180;
    }

    dagreGraph.setNode(node.id, { width, height });
  });

  edges.forEach(edge => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const layoutedNodes = nodes.map(node => {
    const nodeWithPosition = dagreGraph.node(node.id);
    
    // Standard dimensions for centering correction
    let width = 220;
    let height = 120;
    if (node.data.layerType === 'Comment' || node.data.layerType === 'Group') {
      width = node.data.width || 250;
      height = node.data.height || 180;
    }

    // We shift the coordinates to center the nodes properly
    return {
      ...node,
      position: {
        x: nodeWithPosition.x - width / 2,
        y: nodeWithPosition.y - height / 2,
      },
    };
  });

  return { nodes: layoutedNodes, edges };
};
