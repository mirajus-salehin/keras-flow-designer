import { Node, Edge } from '@xyflow/react';
import { NodeData, TrainingConfig, DatasetConfig } from '../../types/network';

// Helper to format parameter values for Python
const formatPythonValue = (key: string, val: any): string => {
  if (val === null || val === undefined || val === 'None' || val === '') {
    return 'None';
  }
  if (typeof val === 'boolean') {
    return val ? 'True' : 'False';
  }
  if (typeof val === 'number') {
    return val.toString();
  }
  if (typeof val === 'string') {
    // Check if it's a JSON or a custom python expression
    if (val.trim().startsWith('{') || val.trim().startsWith('[')) {
      return val; // output JSON string straight as a Python structure
    }
    return `"${val}"`;
  }
  if (Array.isArray(val)) {
    // If it's a tuple, format as (x, y)
    return `(${val.join(', ')})`;
  }
  if (typeof val === 'object') {
    return JSON.stringify(val);
  }
  return val.toString();
};

// Helper: formats Keras parameters into an arguments string
const getKerasArgs = (params: Record<string, any>, layerType: string): string => {
  const args: string[] = [];
  
  Object.entries(params).forEach(([key, val]) => {
    // Skip name, dtype, and irrelevant parameters that are handled separately
    if (key === 'name' || key === 'dtype' || key === 'shape' || key === 'input_shape' || key === 'class_name' || key === 'custom_params' || key === 'call_code' || key === 'function') {
      return;
    }

    // Skip parameters set to default None or empty to keep code clean
    if (val === null || val === undefined || val === 'None' || val === '') {
      return;
    }

    // Special cases
    if (key.includes('regularizer') && val !== 'None') {
      args.push(`${key}=regularizers.${val}()`);
      return;
    }
    if (key.includes('constraint') && val !== 'None') {
      args.push(`${key}=constraints.${val}()`);
      return;
    }

    args.push(`${key}=${formatPythonValue(key, val)}`);
  });

  // Include layer name if provided
  if (params.name) {
    args.push(`name="${params.name}"`);
  }

  return args.join(', ');
};

// Topological Sort for generating code
const getTopologicalOrder = (nodes: Node<NodeData>[], edges: Edge[]): string[] => {
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
  const order: string[] = [];

  while (queue.length > 0) {
    const nodeId = queue.shift()!;
    order.push(nodeId);

    const targets = adjacencyList[nodeId] || [];
    targets.forEach(targetId => {
      inDegree[targetId]--;
      if (inDegree[targetId] === 0) {
        queue.push(targetId);
      }
    });
  }

  return order;
};

// Generate Keras Functional API
export const generateFunctionalCode = (
  nodes: Node<NodeData>[],
  edges: Edge[]
): string => {
  const graphNodes = nodes.filter(n => n.data.layerType !== 'Comment' && n.data.layerType !== 'Group');
  if (graphNodes.length === 0) return '# Create nodes on the canvas to generate code.';

  const topoOrder = getTopologicalOrder(graphNodes, edges);
  const codeLines: string[] = [
    'import tensorflow as tf',
    'from tensorflow import keras',
    'from tensorflow.keras import layers, regularizers, constraints',
    ''
  ];

  const varNames: Record<string, string> = {};
  const inputVars: string[] = [];
  const leafVars: string[] = [];

  // Track outputs connections count
  const outDegree: Record<string, number> = {};
  graphNodes.forEach(n => { outDegree[n.id] = 0; });
  edges.forEach(e => {
    if (outDegree[e.source] !== undefined) outDegree[e.source]++;
  });

  topoOrder.forEach(nodeId => {
    const node = graphNodes.find(n => n.id === nodeId);
    if (!node) return;

    const layerType = node.data.layerType;
    const p = node.data.params;
    const cleanName = p.name ? p.name.replace(/[^a-zA-Z0-9_]/g, '_') : node.id;
    varNames[nodeId] = cleanName;

    // Incoming inputs
    const incoming = edges.filter(e => e.target === nodeId);

    if (layerType === 'Input' || layerType === 'InputLayer') {
      const shapeVal = layerType === 'Input' ? p.shape : p.input_shape;
      const dtype = p.dtype || 'float32';
      const shapeTuple = Array.isArray(shapeVal) ? `(${shapeVal.join(', ')})` : `(${shapeVal})`;
      
      codeLines.push(`${cleanName} = keras.Input(shape=${shapeTuple}, dtype="${dtype}", name="${cleanName}")`);
      inputVars.push(cleanName);
    } 
    else if (layerType === 'CustomLayer') {
      const className = p.class_name || 'MyCustomLayer';
      const customParams = p.custom_params || {};
      const paramsStr = Object.entries(customParams)
        .map(([k, v]) => `${k}=${formatPythonValue(k, v)}`)
        .join(', ');

      // Code block for CustomLayer class (define it at the top of the file)
      // For now, we instantiate it
      const parentVars = incoming.map(e => varNames[e.source] || 'None');
      const callArgs = parentVars.length === 1 ? parentVars[0] : `[${parentVars.join(', ')}]`;
      codeLines.push(`${cleanName} = ${className}(${paramsStr})(${callArgs})`);
    }
    else if (layerType === 'Bidirectional') {
      const rnnType = p.layer_type || 'LSTM';
      const units = p.units || 32;
      const mergeMode = p.merge_mode || 'concat';
      const parentVars = incoming.map(e => varNames[e.source] || 'None');
      const callArgs = parentVars.length === 1 ? parentVars[0] : `[${parentVars.join(', ')}]`;

      codeLines.push(
        `${cleanName} = layers.Bidirectional(\n` +
        `    layers.${rnnType}(${units}, return_sequences=True),\n` +
        `    merge_mode="${mergeMode}"\n` +
        `)(${callArgs})`
      );
    }
    else {
      const args = getKerasArgs(p, layerType);
      const parentVars = incoming.map(e => varNames[e.source] || 'None');
      let callArgs = 'None';
      
      if (parentVars.length === 1) {
        callArgs = parentVars[0];
      } else if (parentVars.length > 1) {
        callArgs = `[${parentVars.join(', ')}]`;
      }

      if (layerType.includes('Add') || layerType.includes('Multiply') || layerType.includes('Average') || layerType.includes('Maximum') || layerType.includes('Minimum') || layerType.includes('Concatenate') || layerType.includes('Dot') || layerType.includes('Subtract')) {
        // Merge layer
        codeLines.push(`${cleanName} = layers.${layerType}(${args})(${callArgs})`);
      } else {
        codeLines.push(`${cleanName} = layers.${layerType}(${args})(${callArgs})`);
      }
    }

    // If it has no outgoing connections and isn't input, it's a leaf node/output
    if (outDegree[nodeId] === 0 && layerType !== 'Input' && layerType !== 'InputLayer') {
      leafVars.push(cleanName);
    }
  });

  // Construct Model instantiation
  codeLines.push('');
  const inputsStr = inputVars.length === 1 ? inputVars[0] : `[${inputVars.join(', ')}]`;
  const outputsStr = leafVars.length === 1 ? leafVars[0] : `[${leafVars.join(', ')}]`;
  codeLines.push(`model = keras.Model(inputs=${inputsStr}, outputs=${outputsStr}, name="visual_keras_model")`);
  codeLines.push('model.summary()');

  return codeLines.join('\n');
};

// Check if a graph is purely sequential (linear chain)
export const checkSequentialPossible = (
  nodes: Node<NodeData>[],
  edges: Edge[]
): boolean => {
  const graphNodes = nodes.filter(n => n.data.layerType !== 'Comment' && n.data.layerType !== 'Group');
  if (graphNodes.length === 0) return false;

  const inputNodes = graphNodes.filter(n => n.data.layerType === 'Input' || n.data.layerType === 'InputLayer');
  if (inputNodes.length !== 1) return false; // Must have exactly 1 input layer

  // Walk from input node
  let currentId = inputNodes[0].id;
  const visited = new Set<string>([currentId]);

  while (visited.size < graphNodes.length) {
    const outgoing = edges.filter(e => e.source === currentId);
    if (outgoing.length !== 1) return false; // Must branch exactly 1

    const targetId = outgoing[0].target;
    if (visited.has(targetId)) return false; // Cycle detected

    const incoming = edges.filter(e => e.target === targetId);
    if (incoming.length !== 1) return false; // Must have exactly 1 input

    visited.add(targetId);
    currentId = targetId;
  }

  return true;
};

// Generate Keras Sequential API
export const generateSequentialCode = (
  nodes: Node<NodeData>[],
  edges: Edge[]
): string => {
  if (!checkSequentialPossible(nodes, edges)) {
    return '# Sequential API is not possible for this graph layout.\n# (Requires a single linear chain of layers starting from exactly one Input layer).';
  }

  const graphNodes = nodes.filter(n => n.data.layerType !== 'Comment' && n.data.layerType !== 'Group');
  const topoOrder = getTopologicalOrder(graphNodes, edges);
  
  const codeLines: string[] = [
    'import tensorflow as tf',
    'from tensorflow import keras',
    'from tensorflow.keras import layers, regularizers, constraints',
    '',
    'model = keras.Sequential(['
  ];

  topoOrder.forEach((nodeId, idx) => {
    const node = graphNodes.find(n => n.id === nodeId)!;
    const layerType = node.data.layerType;
    const p = node.data.params;
    const isLast = idx === topoOrder.length - 1;

    if (layerType === 'Input' || layerType === 'InputLayer') {
      const shapeVal = layerType === 'Input' ? p.shape : p.input_shape;
      const dtype = p.dtype || 'float32';
      const shapeTuple = Array.isArray(shapeVal) ? `(${shapeVal.join(', ')})` : `(${shapeVal})`;
      codeLines.push(`    layers.Input(shape=${shapeTuple}, dtype="${dtype}")${isLast ? '' : ','}`);
    } 
    else if (layerType === 'Bidirectional') {
      const rnnType = p.layer_type || 'LSTM';
      const units = p.units || 32;
      const mergeMode = p.merge_mode || 'concat';
      codeLines.push(
        `    layers.Bidirectional(\n` +
        `        layers.${rnnType}(${units}, return_sequences=True),\n` +
        `        merge_mode="${mergeMode}"\n` +
        `    )${isLast ? '' : ','}`
      );
    }
    else {
      const args = getKerasArgs(p, layerType);
      codeLines.push(`    layers.${layerType}(${args})${isLast ? '' : ','}`);
    }
  });

  codeLines.push('])');
  codeLines.push('');
  codeLines.push('model.summary()');

  return codeLines.join('\n');
};

// Generate PyTorch Model definition code
export const generatePyTorchCode = (
  nodes: Node<NodeData>[],
  edges: Edge[]
): string => {
  const graphNodes = nodes.filter(n => n.data.layerType !== 'Comment' && n.data.layerType !== 'Group');
  if (graphNodes.length === 0) return '# Create nodes on the canvas to generate PyTorch code.';

  const topoOrder = getTopologicalOrder(graphNodes, edges);
  
  const pyTorchImports = [
    'import torch',
    'import torch.nn as nn',
    'import torch.nn.functional as F',
    ''
  ];

  const classDef = [
    'class VisualNeuralNetwork(nn.Module):',
    '    def __init__(self):',
    '        super(VisualNeuralNetwork, self).__init__()'
  ];

  const forwardDef = [
    '    def forward(self, x):'
  ];

  const varNames: Record<string, string> = {};
  const inputVars: string[] = [];

  // Generate constructors and forward operations
  topoOrder.forEach(nodeId => {
    const node = graphNodes.find(n => n.id === nodeId)!;
    const layerType = node.data.layerType;
    const p = node.data.params;
    const cleanName = p.name ? p.name.replace(/[^a-zA-Z0-9_]/g, '_') : node.id;
    varNames[nodeId] = cleanName;

    const incoming = edges.filter(e => e.target === nodeId);
    const parentVars = incoming.map(e => varNames[e.source] || 'x');
    const incomingVal = parentVars.length === 1 ? parentVars[0] : `[${parentVars.join(', ')}]`;

    if (layerType === 'Input' || layerType === 'InputLayer') {
      inputVars.push(cleanName);
      // PyTorch inputs are generally just tensors passed into the forward function
      forwardDef.push(`        ${cleanName} = x`);
    }
    else if (layerType === 'Dense') {
      const units = p.units || 64;
      // In PyTorch we'll mock input feature sizing, default to 128 if unknown
      classDef.push(`        self.${cleanName} = nn.Linear(in_features=128, out_features=${units})`);
      forwardDef.push(`        ${cleanName} = F.relu(self.${cleanName}(${incomingVal}))`);
    }
    else if (layerType === 'Conv2D') {
      const filters = p.filters || 32;
      const kernel = parseTupleParam(p.kernel_size, 2, 3);
      const stride = parseTupleParam(p.strides, 2, 1);
      classDef.push(`        self.${cleanName} = nn.Conv2d(in_channels=3, out_channels=${filters}, kernel_size=(${kernel.join(', ')}), stride=(${stride.join(', ')}))`);
      forwardDef.push(`        ${cleanName} = F.relu(self.${cleanName}(${incomingVal}))`);
    }
    else if (layerType === 'MaxPooling2D') {
      const pool = parseTupleParam(p.pool_size, 2, 2);
      forwardDef.push(`        ${cleanName} = F.max_pool2d(${incomingVal}, kernel_size=(${pool.join(', ')}))`);
    }
    else if (layerType === 'Flatten') {
      forwardDef.push(`        ${cleanName} = torch.flatten(${incomingVal}, 1)`);
    }
    else if (layerType === 'Dropout') {
      const rate = p.rate || 0.5;
      classDef.push(`        self.${cleanName} = nn.Dropout(p=${rate})`);
      forwardDef.push(`        ${cleanName} = self.${cleanName}(${incomingVal})`);
    }
    else if (layerType === 'BatchNormalization') {
      classDef.push(`        self.${cleanName} = nn.BatchNorm2d(num_features=32)`);
      forwardDef.push(`        ${cleanName} = self.${cleanName}(${incomingVal})`);
    }
    else if (layerType === 'Add') {
      forwardDef.push(`        ${cleanName} = ${parentVars.join(' + ')}`);
    }
    else if (layerType === 'Concatenate') {
      const axis = p.axis !== undefined ? p.axis : 1;
      forwardDef.push(`        ${cleanName} = torch.cat((${parentVars.join(', ')}), dim=${axis})`);
    }
    else {
      // General fall back for unsupported PyTorch translation
      forwardDef.push(`        ${cleanName} = ${incomingVal}  # nn.${layerType} is not fully mapped in PyTorch translation`);
    }
  });

  const finalOutput = varNames[topoOrder[topoOrder.length - 1]];
  forwardDef.push(`        return ${finalOutput}`);

  return [...pyTorchImports, ...classDef, '', ...forwardDef].join('\n');
};

// Helper parser to extract parameter tuples for pytorch constructors
const parseTupleParam = (param: any, expectedLen: number, defaultVal: number): number[] => {
  if (typeof param === 'number') {
    return Array(expectedLen).fill(param);
  }
  if (Array.isArray(param)) {
    return param.map(x => parseInt(x, 10) || defaultVal);
  }
  return Array(expectedLen).fill(defaultVal);
};

// Generate TensorFlow.js Code
export const generateJSCode = (
  nodes: Node<NodeData>[],
  edges: Edge[]
): string => {
  const graphNodes = nodes.filter(n => n.data.layerType !== 'Comment' && n.data.layerType !== 'Group');
  if (graphNodes.length === 0) return '// Create nodes on the canvas to generate TensorFlow.js code.';

  const isSeq = checkSequentialPossible(nodes, edges);
  const codeLines: string[] = [
    'import * as tf from "@tensorflow/tfjs";',
    ''
  ];

  const topoOrder = getTopologicalOrder(graphNodes, edges);

  if (isSeq) {
    codeLines.push('const model = tf.sequential();');
    topoOrder.forEach((nodeId, idx) => {
      const node = graphNodes.find(n => n.id === nodeId)!;
      const layerType = node.data.layerType;
      const p = node.data.params;

      if (layerType === 'Input' || layerType === 'InputLayer') {
        // Skip Input node directly, we merge it into first layer's inputShape
        return;
      }

      // Add inputShape to the first actual layer
      let extra = '';
      if (idx === 1 && topoOrder[0]) {
        const inputNode = graphNodes.find(n => n.id === topoOrder[0])!;
        const shapeVal = inputNode.data.params.shape || inputNode.data.params.input_shape || [224, 224, 3];
        extra = `inputShape: [${shapeVal.join(', ')}]`;
      }

      if (layerType === 'Dense') {
        const units = p.units || 64;
        const activation = p.activation === 'linear' ? 'linear' : `'${p.activation}'`;
        const options = [`units: ${units}`, `activation: ${activation}`];
        if (extra) options.push(extra);
        codeLines.push(`model.add(tf.layers.dense({ ${options.join(', ')} }));`);
      }
      else if (layerType === 'Conv2D') {
        const filters = p.filters || 32;
        const kernel = parseTupleParam(p.kernel_size, 2, 3);
        const stride = parseTupleParam(p.strides, 2, 1);
        const padding = p.padding === 'same' ? "'same'" : "'valid'";
        const activation = p.activation === 'linear' ? 'linear' : `'${p.activation}'`;
        
        const options = [
          `filters: ${filters}`,
          `kernelSize: [${kernel.join(', ')}]`,
          `strides: [${stride.join(', ')}]`,
          `padding: ${padding}`,
          `activation: ${activation}`
        ];
        if (extra) options.push(extra);
        codeLines.push(`model.add(tf.layers.conv2d({ ${options.join(', ')} }));`);
      }
      else if (layerType === 'MaxPooling2D') {
        const pool = parseTupleParam(p.pool_size, 2, 2);
        const stride = parseTupleParam(p.strides || p.pool_size, 2, pool[0]);
        const options = [`poolSize: [${pool.join(', ')}]`, `strides: [${stride.join(', ')}]`];
        if (extra) options.push(extra);
        codeLines.push(`model.add(tf.layers.maxPooling2d({ ${options.join(', ')} }));`);
      }
      else if (layerType === 'Flatten') {
        const options = [];
        if (extra) options.push(extra);
        codeLines.push(`model.add(tf.layers.flatten(${extra ? `{ ${extra} }` : ''}));`);
      }
      else if (layerType === 'Dropout') {
        const rate = p.rate || 0.5;
        const options = [`rate: ${rate}`];
        if (extra) options.push(extra);
        codeLines.push(`model.add(tf.layers.dropout({ ${options.join(', ')} }));`);
      }
      else {
        codeLines.push(`// layer type tf.layers.${layerType.toLowerCase()} is not directly scaffolded in JS`);
      }
    });

    codeLines.push('');
    codeLines.push('model.summary();');
  } else {
    // Generate Functional API JS model
    codeLines.push('// Functional API (tf.model) representation');
    const varNames: Record<string, string> = {};
    const inputVars: string[] = [];
    const leafVars: string[] = [];

    // Track outputs connections count
    const outDegree: Record<string, number> = {};
    graphNodes.forEach(n => { outDegree[n.id] = 0; });
    edges.forEach(e => {
      if (outDegree[e.source] !== undefined) outDegree[e.source]++;
    });

    topoOrder.forEach(nodeId => {
      const node = graphNodes.find(n => n.id === nodeId)!;
      const layerType = node.data.layerType;
      const p = node.data.params;
      const cleanName = p.name ? p.name.replace(/[^a-zA-Z0-9_]/g, '_') : node.id;
      varNames[nodeId] = cleanName;

      const incoming = edges.filter(e => e.target === nodeId);
      const parentVars = incoming.map(e => varNames[e.source] || 'None');
      const incomingVal = parentVars.length === 1 ? parentVars[0] : `[${parentVars.join(', ')}]`;

      if (layerType === 'Input' || layerType === 'InputLayer') {
        const shapeVal = layerType === 'Input' ? p.shape : p.input_shape;
        codeLines.push(`const ${cleanName} = tf.input({ shape: [${shapeVal.join(', ')}] });`);
        inputVars.push(cleanName);
      }
      else if (layerType === 'Dense') {
        const units = p.units || 64;
        codeLines.push(`const ${cleanName} = tf.layers.dense({ units: ${units}, activation: '${p.activation || 'relu'}' }).apply(${incomingVal}) as tf.SymbolicTensor;`);
      }
      else if (layerType === 'Conv2D') {
        const filters = p.filters || 32;
        const kernel = parseTupleParam(p.kernel_size, 2, 3);
        codeLines.push(`const ${cleanName} = tf.layers.conv2d({ filters: ${filters}, kernelSize: [${kernel.join(', ')}], activation: 'relu' }).apply(${incomingVal}) as tf.SymbolicTensor;`);
      }
      else if (layerType === 'Flatten') {
        codeLines.push(`const ${cleanName} = tf.layers.flatten().apply(${incomingVal}) as tf.SymbolicTensor;`);
      }
      else {
        codeLines.push(`const ${cleanName} = ${incomingVal}; // tf.layers.${layerType.toLowerCase()} placeholder`);
      }

      if (outDegree[nodeId] === 0 && layerType !== 'Input' && layerType !== 'InputLayer') {
        leafVars.push(cleanName);
      }
    });

    codeLines.push('');
    const inputsStr = inputVars.length === 1 ? inputVars[0] : `[${inputVars.join(', ')}]`;
    const outputsStr = leafVars.length === 1 ? leafVars[0] : `[${leafVars.join(', ')}]`;
    codeLines.push(`const model = tf.model({ inputs: ${inputsStr}, outputs: ${outputsStr} });`);
    codeLines.push('model.summary();');
  }

  return codeLines.join('\n');
};

// Generate Full train.py script
export const generateTrainingScript = (
  nodes: Node<NodeData>[],
  edges: Edge[],
  trainingConfig: TrainingConfig,
  datasetConfig: DatasetConfig
): string => {
  const modelCode = generateFunctionalCode(nodes, edges);
  
  // Custom loss selection
  const lossVal = trainingConfig.loss;
  const optVal = trainingConfig.optimizer;
  const lrVal = trainingConfig.learningRate;
  const metricsVal = trainingConfig.metrics.map(m => `"${m}"`).join(', ');

  // Dataset Setup Snippet
  let datasetLoadingCode = '';
  switch (datasetConfig.type) {
    case 'MNIST':
      datasetLoadingCode = 
        '    # Load MNIST Dataset\n' +
        '    (x_train, y_train), (x_test, y_test) = keras.datasets.mnist.load_data()\n' +
        '    x_train = x_train.reshape(-1, 28, 28, 1).astype("float32") / 255.0\n' +
        '    x_test = x_test.reshape(-1, 28, 28, 1).astype("float32") / 255.0';
      break;
    case 'CIFAR10':
      datasetLoadingCode = 
        '    # Load CIFAR10 Dataset\n' +
        '    (x_train, y_train), (x_test, y_test) = keras.datasets.cifar10.load_data()\n' +
        '    x_train = x_train.astype("float32") / 255.0\n' +
        '    x_test = x_test.astype("float32") / 255.0';
      break;
    case 'CSV':
      datasetLoadingCode = 
        '    # Load CSV Dataset\n' +
        `    import pandas as pd\n` +
        `    df = pd.read_csv("${datasetConfig.csvPath || 'dataset.csv'}")\n` +
        `    # Split target and features\n` +
        `    target_col = "${datasetConfig.labelColumn || 'label'}"\n` +
        `    x = df.drop(columns=[target_col]).values\n` +
        `    y = df[target_col].values\n` +
        `    from sklearn.model_selection import train_test_split\n` +
        `    x_train, x_test, y_train, y_test = train_test_split(x, y, test_size=${1 - datasetConfig.trainSplit})` +
        '';
      break;
    default:
      datasetLoadingCode = 
        '    # Dummy data generator for demonstration\n' +
        '    import numpy as np\n' +
        '    input_shape = model.input_shape[1:]\n' +
        '    num_classes = model.output_shape[-1]\n' +
        '    print(f"Generating dummy data for input shape: {input_shape}")\n' +
        '    x_train = np.random.random((1000, *input_shape)).astype("float32")\n' +
        '    y_train = np.random.randint(0, num_classes, size=(1000,)).astype("float32")\n' +
        '    x_test = np.random.random((200, *input_shape)).astype("float32")\n' +
        '    y_test = np.random.randint(0, num_classes, size=(200,)).astype("float32")';
  }

  // Callbacks list
  const callbacksList: string[] = [];
  const callbacksDefinition: string[] = [];
  
  if (trainingConfig.callbacks.earlyStopping.enabled) {
    callbacksDefinition.push(
      '    early_stopping = keras.callbacks.EarlyStopping(\n' +
      `        monitor="${trainingConfig.callbacks.earlyStopping.monitor}",\n` +
      `        patience=${trainingConfig.callbacks.earlyStopping.patience},\n` +
      `        restore_best_weights=${trainingConfig.callbacks.earlyStopping.restoreBestWeights ? 'True' : 'False'}\n` +
      '    )'
    );
    callbacksList.push('early_stopping');
  }

  if (trainingConfig.callbacks.reduceLROnPlateau.enabled) {
    callbacksDefinition.push(
      '    reduce_lr = keras.callbacks.ReduceLROnPlateau(\n' +
      `        monitor="${trainingConfig.callbacks.reduceLROnPlateau.monitor}",\n` +
      `        factor=${trainingConfig.callbacks.reduceLROnPlateau.factor},\n` +
      `        patience=${trainingConfig.callbacks.reduceLROnPlateau.patience},\n` +
      `        min_lr=${trainingConfig.callbacks.reduceLROnPlateau.minLR}\n` +
      '    )'
    );
    callbacksList.push('reduce_lr');
  }

  if (trainingConfig.callbacks.checkpoint.enabled) {
    callbacksDefinition.push(
      '    checkpoint = keras.callbacks.ModelCheckpoint(\n' +
      `        filepath="${trainingConfig.callbacks.checkpoint.filepath}",\n` +
      `        monitor="${trainingConfig.callbacks.checkpoint.monitor}",\n` +
      `        save_best_only=${trainingConfig.callbacks.checkpoint.saveBestOnly ? 'True' : 'False'}\n` +
      '    )'
    );
    callbacksList.push('checkpoint');
  }

  if (trainingConfig.callbacks.tensorBoard.enabled) {
    callbacksDefinition.push(
      '    tensorboard = keras.callbacks.TensorBoard(\n' +
      `        log_dir="${trainingConfig.callbacks.tensorBoard.logDir}",\n` +
      `        histogram_freq=${trainingConfig.callbacks.tensorBoard.histogramFreq}\n` +
      '    )'
    );
    callbacksList.push('tensorboard');
  }

  const callbackCodeBlock = callbacksDefinition.length > 0 
    ? `${callbacksDefinition.join('\n')}\n    callbacks = [${callbacksList.join(', ')}]` 
    : '    callbacks = []';

  // Gradient clipping options
  let optimizerString = '';
  if (trainingConfig.gradientClipping.enabled) {
    optimizerString = `keras.optimizers.${optVal}(learning_rate=${lrVal}, clipvalue=${trainingConfig.gradientClipping.clipValue})`;
  } else {
    optimizerString = `keras.optimizers.${optVal}(learning_rate=${lrVal})`;
  }

  const fullScript = `\"\"\"
Training Script generated by Keras Flow Designer
Generated on: ${new Date().toLocaleDateString()}
\"\"\"
import os
import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers, regularizers, constraints

def create_model():
    # --- Model Definition (Keras Functional API) ---
${modelCode.split('\n').map(line => '    ' + line).join('\n')}
    return model

def main():
    # 1. Dataset Loading
    print("Loading dataset...")
${datasetLoadingCode}
    
    # 2. Instantiate and compile model
    print("Creating and compiling model...")
    model = create_model()
    
    optimizer = ${optimizerString}
    
    model.compile(
        optimizer=optimizer,
        loss="${lossVal}",
        metrics=[${metricsVal}]
    )
    
    # 3. Setup Callbacks
    print("Setting up callbacks...")
${callbackCodeBlock}

    # 4. Training
    print("Starting training...")
    history = model.fit(
        x_train, y_train,
        validation_data=(x_test, y_test),
        epochs=${trainingConfig.epochs},
        batch_size=${trainingConfig.batchSize},
        callbacks=callbacks
    )
    
    print("Training complete!")
    
if __name__ == "__main__":
    main()
`;

  return fullScript;
};
