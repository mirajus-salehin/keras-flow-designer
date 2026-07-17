import { LayerDefinition, LayerCategory, ParameterDefinition } from '../types/network';

// Common parameter blocks to reduce boilerplate
const ACTIVATION_OPTIONS = ['linear', 'relu', 'sigmoid', 'softmax', 'tanh', 'selu', 'elu', 'gelu', 'swish', 'exponential'];
const INITIALIZER_OPTIONS = ['glorot_uniform', 'glorot_normal', 'he_uniform', 'he_normal', 'random_uniform', 'random_normal', 'zeros', 'ones', 'orthogonal'];
const REGULARIZER_OPTIONS = ['None', 'l1', 'l2', 'l1_l2'];
const CONSTRAINT_OPTIONS = ['None', 'max_norm', 'non_neg', 'unit_norm', 'min_max_norm'];

const activationParam = (def = 'linear'): ParameterDefinition => ({
  name: 'activation',
  label: 'Activation',
  type: 'select',
  default: def,
  options: ACTIVATION_OPTIONS,
  description: 'Activation function to use.'
});

const useBiasParam = (): ParameterDefinition => ({
  name: 'use_bias',
  label: 'Use Bias',
  type: 'boolean',
  default: true,
  description: 'Whether the layer uses a bias vector.'
});

const kernelInitializerParam = (): ParameterDefinition => ({
  name: 'kernel_initializer',
  label: 'Kernel Initializer',
  type: 'select',
  default: 'glorot_uniform',
  options: INITIALIZER_OPTIONS,
  description: 'Initializer for the kernel weights matrix.'
});

const biasInitializerParam = (): ParameterDefinition => ({
  name: 'bias_initializer',
  label: 'Bias Initializer',
  type: 'select',
  default: 'zeros',
  options: INITIALIZER_OPTIONS,
  description: 'Initializer for the bias vector.'
});

const regularizersParams = (): ParameterDefinition[] => [
  {
    name: 'kernel_regularizer',
    label: 'Kernel Regularizer',
    type: 'select',
    default: 'None',
    options: REGULARIZER_OPTIONS,
    description: 'Regularizer function applied to the kernel weights matrix.'
  },
  {
    name: 'bias_regularizer',
    label: 'Bias Regularizer',
    type: 'select',
    default: 'None',
    options: REGULARIZER_OPTIONS,
    description: 'Regularizer function applied to the bias vector.'
  },
  {
    name: 'activity_regularizer',
    label: 'Activity Regularizer',
    type: 'select',
    default: 'None',
    options: REGULARIZER_OPTIONS,
    description: 'Regularizer function applied to the output of the layer.'
  }
];

const constraintsParams = (): ParameterDefinition[] => [
  {
    name: 'kernel_constraint',
    label: 'Kernel Constraint',
    type: 'select',
    default: 'None',
    options: CONSTRAINT_OPTIONS,
    description: 'Constraint function applied to the kernel weights matrix.'
  },
  {
    name: 'bias_constraint',
    label: 'Bias Constraint',
    type: 'select',
    default: 'None',
    options: CONSTRAINT_OPTIONS,
    description: 'Constraint function applied to the bias vector.'
  }
];

export const LAYER_DEFINITIONS: Record<string, LayerDefinition> = {
  // --- INPUT ---
  Input: {
    type: 'Input',
    category: 'INPUT',
    label: 'Input',
    description: 'Instantiates a Keras tensor. Used to specify the entry point for Keras models.',
    inputsCount: 0,
    outputsCount: 1,
    params: [
      {
        name: 'shape',
        label: 'Shape (tuple)',
        type: 'tuple',
        default: [224, 224, 3],
        description: 'Input shape tuple, excluding the batch size. E.g. [224, 224, 3] or [100].'
      },
      {
        name: 'batch_size',
        label: 'Batch Size',
        type: 'number',
        default: null,
        description: 'Optional static batch size.'
      },
      {
        name: 'dtype',
        label: 'Data Type',
        type: 'select',
        default: 'float32',
        options: ['float32', 'float64', 'int32', 'int64', 'string', 'bool'],
        description: 'The data type expected by the input.'
      },
      {
        name: 'name',
        label: 'Name',
        type: 'text',
        default: 'input_layer',
        description: 'An optional name string for the layer.'
      }
    ]
  },
  InputLayer: {
    type: 'InputLayer',
    category: 'INPUT',
    label: 'Input Layer',
    description: 'Keras layer that is instantiated from a shape.',
    inputsCount: 0,
    outputsCount: 1,
    params: [
      {
        name: 'input_shape',
        label: 'Input Shape',
        type: 'tuple',
        default: [224, 224, 3],
        description: 'Shape of the inputs.'
      },
      {
        name: 'name',
        label: 'Name',
        type: 'text',
        default: 'input_layer_node',
        description: 'An optional name string.'
      }
    ]
  },
  ImageInput: {
    type: 'ImageInput',
    category: 'INPUT',
    label: 'Image Input',
    description: 'Instantiates a Keras Input tensor customized for images. Produces a 4D tensor (batch, height, width, channels).',
    inputsCount: 0,
    outputsCount: 1,
    params: [
      { name: 'height', label: 'Height', type: 'number', default: 224, description: 'Image height.' },
      { name: 'width', label: 'Width', type: 'number', default: 224, description: 'Image width.' },
      { name: 'channels', label: 'Channels', type: 'number', default: 3, description: 'Image color channels (e.g. 3 for RGB, 1 for grayscale).' },
      { name: 'dtype', label: 'Data Type', type: 'select', default: 'float32', options: ['float32', 'float64', 'int32', 'int64'], description: 'Data type expected by the input.' },
      { name: 'name', label: 'Name', type: 'text', default: 'image_input', description: 'An optional name string for the layer.' }
    ]
  },
  FeatureInput: {
    type: 'FeatureInput',
    category: 'INPUT',
    label: '1D Feature Input',
    description: 'Instantiates a Keras Input tensor customized for 1D feature vectors (tabular data). Produces a 2D tensor (batch, features).',
    inputsCount: 0,
    outputsCount: 1,
    params: [
      { name: 'features', label: 'Features Count', type: 'number', default: 100, description: 'Number of input features.' },
      { name: 'dtype', label: 'Data Type', type: 'select', default: 'float32', options: ['float32', 'float64', 'int32', 'int64'], description: 'Data type expected by the input.' },
      { name: 'name', label: 'Name', type: 'text', default: 'feature_input', description: 'An optional name string for the layer.' }
    ]
  },
  SequenceInput: {
    type: 'SequenceInput',
    category: 'INPUT',
    label: 'Sequence Input',
    description: 'Instantiates a Keras Input tensor customized for sequence/temporal data. Produces a 3D tensor (batch, timesteps, features) compatible with Conv1D/LSTMs.',
    inputsCount: 0,
    outputsCount: 1,
    params: [
      { name: 'timesteps', label: 'Timesteps', type: 'number', default: 100, description: 'Sequence length (number of timesteps).' },
      { name: 'features', label: 'Features Per Step', type: 'number', default: 64, description: 'Number of features per timestep.' },
      { name: 'dtype', label: 'Data Type', type: 'select', default: 'float32', options: ['float32', 'float64', 'int32', 'int64'], description: 'Data type expected by the input.' },
      { name: 'name', label: 'Name', type: 'text', default: 'sequence_input', description: 'An optional name string for the layer.' }
    ]
  },
  VolumeInput: {
    type: 'VolumeInput',
    category: 'INPUT',
    label: '3D Volume Input',
    description: 'Instantiates a Keras Input tensor customized for 3D volumes (videos or 3D medical scans). Produces a 5D tensor (batch, depth, height, width, channels) compatible with Conv3D.',
    inputsCount: 0,
    outputsCount: 1,
    params: [
      { name: 'depth', label: 'Depth', type: 'number', default: 32, description: 'Volume depth/timesteps.' },
      { name: 'height', label: 'Height', type: 'number', default: 32, description: 'Volume height.' },
      { name: 'width', label: 'Width', type: 'number', default: 32, description: 'Volume width.' },
      { name: 'channels', label: 'Channels', type: 'number', default: 1, description: 'Number of channels.' },
      { name: 'dtype', label: 'Data Type', type: 'select', default: 'float32', options: ['float32', 'float64', 'int32', 'int64'], description: 'Data type expected by the input.' },
      { name: 'name', label: 'Name', type: 'text', default: 'volume_input', description: 'An optional name string for the layer.' }
    ]
  },

  // --- CORE ---
  Dense: {
    type: 'Dense',
    category: 'CORE',
    label: 'Dense',
    description: 'Just your regular densely-connected NN layer.',
    inputsCount: 1,
    outputsCount: 1,
    params: [
      {
        name: 'units',
        label: 'Units',
        type: 'number',
        default: 64,
        min: 1,
        max: 8192,
        required: true,
        description: 'Dimensionality of the output space.'
      },
      activationParam('relu'),
      useBiasParam(),
      kernelInitializerParam(),
      biasInitializerParam(),
      ...regularizersParams(),
      ...constraintsParams(),
      {
        name: 'name',
        label: 'Name',
        type: 'text',
        default: '',
        description: 'Layer name.'
      }
    ]
  },
  Activation: {
    type: 'Activation',
    category: 'CORE',
    label: 'Activation',
    description: 'Applies an activation function to an output.',
    inputsCount: 1,
    outputsCount: 1,
    params: [
      activationParam('relu'),
      { name: 'name', label: 'Name', type: 'text', default: '' }
    ]
  },
  Flatten: {
    type: 'Flatten',
    category: 'CORE',
    label: 'Flatten',
    description: 'Flattens the input. Does not affect the batch size.',
    inputsCount: 1,
    outputsCount: 1,
    params: [
      {
        name: 'data_format',
        label: 'Data Format',
        type: 'select',
        default: 'channels_last',
        options: ['channels_last', 'channels_first'],
        description: 'The ordering of the dimensions in the inputs.'
      },
      { name: 'name', label: 'Name', type: 'text', default: '' }
    ]
  },
  Reshape: {
    type: 'Reshape',
    category: 'CORE',
    label: 'Reshape',
    description: 'Reshapes an output to a certain shape.',
    inputsCount: 1,
    outputsCount: 1,
    params: [
      {
        name: 'target_shape',
        label: 'Target Shape',
        type: 'tuple',
        default: [-1, 1],
        description: 'The target shape tuple.'
      },
      { name: 'name', label: 'Name', type: 'text', default: '' }
    ]
  },
  Lambda: {
    type: 'Lambda',
    category: 'CORE',
    label: 'Lambda',
    description: 'Wraps arbitrary expression as a Layer object.',
    inputsCount: 1,
    outputsCount: 1,
    params: [
      {
        name: 'function',
        label: 'Lambda Code',
        type: 'text',
        default: 'lambda x: x * 2',
        description: 'Python expression mapping inputs to outputs.'
      },
      { name: 'name', label: 'Name', type: 'text', default: '' }
    ]
  },
  Permute: {
    type: 'Permute',
    category: 'CORE',
    label: 'Permute',
    description: 'Permutes the dimensions of the input according to a given pattern.',
    inputsCount: 1,
    outputsCount: 1,
    params: [
      {
        name: 'dims',
        label: 'Permutation Pattern',
        type: 'tuple',
        default: [2, 1],
        description: '1-indexed permutation pattern. E.g. [2, 1] swaps the first and second dimensions.'
      },
      { name: 'name', label: 'Name', type: 'text', default: '' }
    ]
  },
  RepeatVector: {
    type: 'RepeatVector',
    category: 'CORE',
    label: 'RepeatVector',
    description: 'Repeats the input n times.',
    inputsCount: 1,
    outputsCount: 1,
    params: [
      {
        name: 'n',
        label: 'n (Repetitions)',
        type: 'number',
        default: 2,
        min: 1,
        description: 'Number of repetitions.'
      },
      { name: 'name', label: 'Name', type: 'text', default: '' }
    ]
  },
  Masking: {
    type: 'Masking',
    category: 'CORE',
    label: 'Masking',
    description: 'Masks a sequence by using a mask value to skip timesteps.',
    inputsCount: 1,
    outputsCount: 1,
    params: [
      {
        name: 'mask_value',
        label: 'Mask Value',
        type: 'number',
        default: 0.0,
        description: 'Value to mask.'
      },
      { name: 'name', label: 'Name', type: 'text', default: '' }
    ]
  },

  // --- CONVOLUTION ---
  Conv1D: {
    type: 'Conv1D',
    category: 'CONVOLUTION',
    label: 'Conv1D',
    description: '1D convolution layer (e.g. temporal convolution).',
    inputsCount: 1,
    outputsCount: 1,
    params: [
      { name: 'filters', label: 'Filters', type: 'number', default: 32, min: 1 },
      { name: 'kernel_size', label: 'Kernel Size', type: 'number', default: 3, min: 1 },
      { name: 'strides', label: 'Strides', type: 'number', default: 1, min: 1 },
      { name: 'padding', label: 'Padding', type: 'select', default: 'valid', options: ['valid', 'same'] },
      activationParam('relu'),
      useBiasParam(),
      kernelInitializerParam(),
      biasInitializerParam(),
      { name: 'dilation_rate', label: 'Dilation Rate', type: 'number', default: 1 },
      { name: 'name', label: 'Name', type: 'text', default: '' }
    ]
  },
  Conv2D: {
    type: 'Conv2D',
    category: 'CONVOLUTION',
    label: 'Conv2D',
    description: '2D convolution layer (e.g. spatial convolution over images).',
    inputsCount: 1,
    outputsCount: 1,
    params: [
      { name: 'filters', label: 'Filters', type: 'number', default: 32, min: 1 },
      { name: 'kernel_size', label: 'Kernel Size (tuple)', type: 'tuple', default: [3, 3] },
      { name: 'strides', label: 'Strides (tuple)', type: 'tuple', default: [1, 1] },
      { name: 'padding', label: 'Padding', type: 'select', default: 'same', options: ['valid', 'same'] },
      activationParam('relu'),
      useBiasParam(),
      kernelInitializerParam(),
      biasInitializerParam(),
      { name: 'dilation_rate', label: 'Dilation Rate', type: 'tuple', default: [1, 1] },
      { name: 'groups', label: 'Groups', type: 'number', default: 1 },
      { name: 'name', label: 'Name', type: 'text', default: '' }
    ]
  },
  Conv3D: {
    type: 'Conv3D',
    category: 'CONVOLUTION',
    label: 'Conv3D',
    description: '3D convolution layer (e.g. spatial-temporal convolution).',
    inputsCount: 1,
    outputsCount: 1,
    params: [
      { name: 'filters', label: 'Filters', type: 'number', default: 32, min: 1 },
      { name: 'kernel_size', label: 'Kernel Size (3-tuple)', type: 'tuple', default: [3, 3, 3] },
      { name: 'strides', label: 'Strides (3-tuple)', type: 'tuple', default: [1, 1, 1] },
      { name: 'padding', label: 'Padding', type: 'select', default: 'valid', options: ['valid', 'same'] },
      activationParam('relu'),
      useBiasParam(),
      kernelInitializerParam(),
      biasInitializerParam(),
      { name: 'name', label: 'Name', type: 'text', default: '' }
    ]
  },
  Conv1DTranspose: {
    type: 'Conv1DTranspose',
    category: 'CONVOLUTION',
    label: 'Conv1D Transpose',
    description: 'Transposed 1D convolution layer (sometimes called Deconvolution).',
    inputsCount: 1,
    outputsCount: 1,
    params: [
      { name: 'filters', label: 'Filters', type: 'number', default: 32, min: 1 },
      { name: 'kernel_size', label: 'Kernel Size', type: 'number', default: 3 },
      { name: 'strides', label: 'Strides', type: 'number', default: 1 },
      { name: 'padding', label: 'Padding', type: 'select', default: 'valid', options: ['valid', 'same'] },
      activationParam('relu'),
      { name: 'name', label: 'Name', type: 'text', default: '' }
    ]
  },
  Conv2DTranspose: {
    type: 'Conv2DTranspose',
    category: 'CONVOLUTION',
    label: 'Conv2D Transpose',
    description: 'Transposed 2D convolution layer.',
    inputsCount: 1,
    outputsCount: 1,
    params: [
      { name: 'filters', label: 'Filters', type: 'number', default: 32, min: 1 },
      { name: 'kernel_size', label: 'Kernel Size (tuple)', type: 'tuple', default: [3, 3] },
      { name: 'strides', label: 'Strides (tuple)', type: 'tuple', default: [2, 2] },
      { name: 'padding', label: 'Padding', type: 'select', default: 'same', options: ['valid', 'same'] },
      activationParam('relu'),
      useBiasParam(),
      kernelInitializerParam(),
      biasInitializerParam(),
      { name: 'name', label: 'Name', type: 'text', default: '' }
    ]
  },
  Conv3DTranspose: {
    type: 'Conv3DTranspose',
    category: 'CONVOLUTION',
    label: 'Conv3D Transpose',
    description: 'Transposed 3D convolution layer.',
    inputsCount: 1,
    outputsCount: 1,
    params: [
      { name: 'filters', label: 'Filters', type: 'number', default: 32, min: 1 },
      { name: 'kernel_size', label: 'Kernel Size (3-tuple)', type: 'tuple', default: [3, 3, 3] },
      { name: 'strides', label: 'Strides (3-tuple)', type: 'tuple', default: [2, 2, 2] },
      { name: 'padding', label: 'Padding', type: 'select', default: 'same', options: ['valid', 'same'] },
      activationParam('relu'),
      { name: 'name', label: 'Name', type: 'text', default: '' }
    ]
  },
  SeparableConv2D: {
    type: 'SeparableConv2D',
    category: 'CONVOLUTION',
    label: 'Separable Conv2D',
    description: 'Depthwise separable 2D convolution.',
    inputsCount: 1,
    outputsCount: 1,
    params: [
      { name: 'filters', label: 'Filters', type: 'number', default: 32 },
      { name: 'kernel_size', label: 'Kernel Size', type: 'tuple', default: [3, 3] },
      { name: 'strides', label: 'Strides', type: 'tuple', default: [1, 1] },
      { name: 'padding', label: 'Padding', type: 'select', default: 'valid', options: ['valid', 'same'] },
      activationParam('relu'),
      { name: 'name', label: 'Name', type: 'text', default: '' }
    ]
  },
  DepthwiseConv2D: {
    type: 'DepthwiseConv2D',
    category: 'CONVOLUTION',
    label: 'Depthwise Conv2D',
    description: 'Depthwise 2D convolution.',
    inputsCount: 1,
    outputsCount: 1,
    params: [
      { name: 'kernel_size', label: 'Kernel Size', type: 'tuple', default: [3, 3] },
      { name: 'strides', label: 'Strides', type: 'tuple', default: [1, 1] },
      { name: 'padding', label: 'Padding', type: 'select', default: 'valid', options: ['valid', 'same'] },
      activationParam('relu'),
      { name: 'name', label: 'Name', type: 'text', default: '' }
    ]
  },

  // --- POOLING ---
  MaxPooling1D: {
    type: 'MaxPooling1D',
    category: 'POOLING',
    label: 'Max Pooling 1D',
    description: 'Max pooling operation for 1D temporal data.',
    inputsCount: 1,
    outputsCount: 1,
    params: [
      { name: 'pool_size', label: 'Pool Size', type: 'number', default: 2 },
      { name: 'strides', label: 'Strides', type: 'number', default: null, description: 'Defaults to pool_size.' },
      { name: 'padding', label: 'Padding', type: 'select', default: 'valid', options: ['valid', 'same'] },
      { name: 'name', label: 'Name', type: 'text', default: '' }
    ]
  },
  MaxPooling2D: {
    type: 'MaxPooling2D',
    category: 'POOLING',
    label: 'Max Pooling 2D',
    description: 'Max pooling operation for 2D spatial data.',
    inputsCount: 1,
    outputsCount: 1,
    params: [
      { name: 'pool_size', label: 'Pool Size (tuple)', type: 'tuple', default: [2, 2] },
      { name: 'strides', label: 'Strides (tuple)', type: 'tuple', default: [2, 2], description: 'Defaults to pool_size.' },
      { name: 'padding', label: 'Padding', type: 'select', default: 'valid', options: ['valid', 'same'] },
      { name: 'name', label: 'Name', type: 'text', default: '' }
    ]
  },
  MaxPooling3D: {
    type: 'MaxPooling3D',
    category: 'POOLING',
    label: 'Max Pooling 3D',
    description: 'Max pooling operation for 3D data (spatial or spatio-temporal).',
    inputsCount: 1,
    outputsCount: 1,
    params: [
      { name: 'pool_size', label: 'Pool Size (3-tuple)', type: 'tuple', default: [2, 2, 2] },
      { name: 'strides', label: 'Strides (3-tuple)', type: 'tuple', default: [2, 2, 2] },
      { name: 'padding', label: 'Padding', type: 'select', default: 'valid', options: ['valid', 'same'] },
      { name: 'name', label: 'Name', type: 'text', default: '' }
    ]
  },
  AveragePooling1D: {
    type: 'AveragePooling1D',
    category: 'POOLING',
    label: 'Average Pooling 1D',
    description: 'Average pooling for 1D temporal data.',
    inputsCount: 1,
    outputsCount: 1,
    params: [
      { name: 'pool_size', label: 'Pool Size', type: 'number', default: 2 },
      { name: 'strides', label: 'Strides', type: 'number', default: null },
      { name: 'padding', label: 'Padding', type: 'select', default: 'valid', options: ['valid', 'same'] },
      { name: 'name', label: 'Name', type: 'text', default: '' }
    ]
  },
  AveragePooling2D: {
    type: 'AveragePooling2D',
    category: 'POOLING',
    label: 'Average Pooling 2D',
    description: 'Average pooling for 2D spatial data.',
    inputsCount: 1,
    outputsCount: 1,
    params: [
      { name: 'pool_size', label: 'Pool Size (tuple)', type: 'tuple', default: [2, 2] },
      { name: 'strides', label: 'Strides (tuple)', type: 'tuple', default: [2, 2] },
      { name: 'padding', label: 'Padding', type: 'select', default: 'valid', options: ['valid', 'same'] },
      { name: 'name', label: 'Name', type: 'text', default: '' }
    ]
  },
  AveragePooling3D: {
    type: 'AveragePooling3D',
    category: 'POOLING',
    label: 'Average Pooling 3D',
    description: 'Average pooling for 3D data.',
    inputsCount: 1,
    outputsCount: 1,
    params: [
      { name: 'pool_size', label: 'Pool Size', type: 'tuple', default: [2, 2, 2] },
      { name: 'name', label: 'Name', type: 'text', default: '' }
    ]
  },
  GlobalAveragePooling1D: {
    type: 'GlobalAveragePooling1D',
    category: 'POOLING',
    label: 'Global Avg Pooling 1D',
    description: 'Global average pooling operation for temporal data.',
    inputsCount: 1,
    outputsCount: 1,
    params: [
      { name: 'keepdims', label: 'Keep Dimensions', type: 'boolean', default: false },
      { name: 'name', label: 'Name', type: 'text', default: '' }
    ]
  },
  GlobalAveragePooling2D: {
    type: 'GlobalAveragePooling2D',
    category: 'POOLING',
    label: 'Global Avg Pooling 2D',
    description: 'Global average pooling operation for spatial data.',
    inputsCount: 1,
    outputsCount: 1,
    params: [
      { name: 'keepdims', label: 'Keep Dimensions', type: 'boolean', default: false },
      { name: 'name', label: 'Name', type: 'text', default: '' }
    ]
  },
  GlobalAveragePooling3D: {
    type: 'GlobalAveragePooling3D',
    category: 'POOLING',
    label: 'Global Avg Pooling 3D',
    description: 'Global average pooling operation for 3D data.',
    inputsCount: 1,
    outputsCount: 1,
    params: [
      { name: 'keepdims', label: 'Keep Dimensions', type: 'boolean', default: false },
      { name: 'name', label: 'Name', type: 'text', default: '' }
    ]
  },
  GlobalMaxPooling1D: {
    type: 'GlobalMaxPooling1D',
    category: 'POOLING',
    label: 'Global Max Pooling 1D',
    description: 'Global max pooling operation for temporal data.',
    inputsCount: 1,
    outputsCount: 1,
    params: [
      { name: 'keepdims', label: 'Keep Dimensions', type: 'boolean', default: false },
      { name: 'name', label: 'Name', type: 'text', default: '' }
    ]
  },
  GlobalMaxPooling2D: {
    type: 'GlobalMaxPooling2D',
    category: 'POOLING',
    label: 'Global Max Pooling 2D',
    description: 'Global max pooling operation for spatial data.',
    inputsCount: 1,
    outputsCount: 1,
    params: [
      { name: 'keepdims', label: 'Keep Dimensions', type: 'boolean', default: false },
      { name: 'name', label: 'Name', type: 'text', default: '' }
    ]
  },
  GlobalMaxPooling3D: {
    type: 'GlobalMaxPooling3D',
    category: 'POOLING',
    label: 'Global Max Pooling 3D',
    description: 'Global max pooling operation for 3D data.',
    inputsCount: 1,
    outputsCount: 1,
    params: [
      { name: 'keepdims', label: 'Keep Dimensions', type: 'boolean', default: false },
      { name: 'name', label: 'Name', type: 'text', default: '' }
    ]
  },

  // --- NORMALIZATION ---
  BatchNormalization: {
    type: 'BatchNormalization',
    category: 'NORMALIZATION',
    label: 'Batch Normalization',
    description: 'Normalize the activations of the previous layer at each batch.',
    inputsCount: 1,
    outputsCount: 1,
    params: [
      { name: 'axis', label: 'Axis', type: 'number', default: -1, description: 'Integer axis that should be normalized.' },
      { name: 'momentum', label: 'Momentum', type: 'slider', default: 0.99, min: 0.0, max: 1.0, step: 0.01 },
      { name: 'epsilon', label: 'Epsilon', type: 'number', default: 0.001 },
      { name: 'center', label: 'Center', type: 'boolean', default: true },
      { name: 'scale', label: 'Scale', type: 'boolean', default: true },
      { name: 'name', label: 'Name', type: 'text', default: '' }
    ]
  },
  LayerNormalization: {
    type: 'LayerNormalization',
    category: 'NORMALIZATION',
    label: 'Layer Normalization',
    description: 'Normalize the activations of the previous layer for each given sample.',
    inputsCount: 1,
    outputsCount: 1,
    params: [
      { name: 'axis', label: 'Axis', type: 'number', default: -1 },
      { name: 'epsilon', label: 'Epsilon', type: 'number', default: 0.001 },
      { name: 'center', label: 'Center', type: 'boolean', default: true },
      { name: 'scale', label: 'Scale', type: 'boolean', default: true },
      { name: 'name', label: 'Name', type: 'text', default: '' }
    ]
  },
  GroupNormalization: {
    type: 'GroupNormalization',
    category: 'NORMALIZATION',
    label: 'Group Normalization',
    description: 'Group normalization layer.',
    inputsCount: 1,
    outputsCount: 1,
    params: [
      { name: 'groups', label: 'Groups', type: 'number', default: 32, min: 1 },
      { name: 'axis', label: 'Axis', type: 'number', default: -1 },
      { name: 'epsilon', label: 'Epsilon', type: 'number', default: 0.001 },
      { name: 'name', label: 'Name', type: 'text', default: '' }
    ]
  },

  // --- DROPOUT ---
  Dropout: {
    type: 'Dropout',
    category: 'DROPOUT',
    label: 'Dropout',
    description: 'Applies Dropout to the input.',
    inputsCount: 1,
    outputsCount: 1,
    params: [
      {
        name: 'rate',
        label: 'Rate',
        type: 'slider',
        default: 0.5,
        min: 0.0,
        max: 1.0,
        step: 0.05,
        description: 'Fraction of the input units to drop.'
      },
      { name: 'name', label: 'Name', type: 'text', default: '' }
    ]
  },
  AlphaDropout: {
    type: 'AlphaDropout',
    category: 'DROPOUT',
    label: 'Alpha Dropout',
    description: 'Applies Alpha Dropout (maintains mean and variance of inputs).',
    inputsCount: 1,
    outputsCount: 1,
    params: [
      { name: 'rate', label: 'Rate', type: 'slider', default: 0.5, min: 0.0, max: 1.0, step: 0.05 },
      { name: 'name', label: 'Name', type: 'text', default: '' }
    ]
  },
  GaussianDropout: {
    type: 'GaussianDropout',
    category: 'DROPOUT',
    label: 'Gaussian Dropout',
    description: 'Apply multiplicative 1-centered Gaussian noise.',
    inputsCount: 1,
    outputsCount: 1,
    params: [
      { name: 'rate', label: 'Rate', type: 'slider', default: 0.5, min: 0.0, max: 1.0, step: 0.05 },
      { name: 'name', label: 'Name', type: 'text', default: '' }
    ]
  },
  SpatialDropout1D: {
    type: 'SpatialDropout1D',
    category: 'DROPOUT',
    label: 'Spatial Dropout 1D',
    description: 'Spatial 1D version of Dropout.',
    inputsCount: 1,
    outputsCount: 1,
    params: [
      { name: 'rate', label: 'Rate', type: 'slider', default: 0.5, min: 0.0, max: 1.0, step: 0.05 },
      { name: 'name', label: 'Name', type: 'text', default: '' }
    ]
  },
  SpatialDropout2D: {
    type: 'SpatialDropout2D',
    category: 'DROPOUT',
    label: 'Spatial Dropout 2D',
    description: 'Spatial 2D version of Dropout.',
    inputsCount: 1,
    outputsCount: 1,
    params: [
      { name: 'rate', label: 'Rate', type: 'slider', default: 0.5, min: 0.0, max: 1.0, step: 0.05 },
      { name: 'name', label: 'Name', type: 'text', default: '' }
    ]
  },
  SpatialDropout3D: {
    type: 'SpatialDropout3D',
    category: 'DROPOUT',
    label: 'Spatial Dropout 3D',
    description: 'Spatial 3D version of Dropout.',
    inputsCount: 1,
    outputsCount: 1,
    params: [
      { name: 'rate', label: 'Rate', type: 'slider', default: 0.5, min: 0.0, max: 1.0, step: 0.05 },
      { name: 'name', label: 'Name', type: 'text', default: '' }
    ]
  },

  // --- RECURRENT ---
  SimpleRNN: {
    type: 'SimpleRNN',
    category: 'RECURRENT',
    label: 'Simple RNN',
    description: 'Fully-connected RNN where the output is to be fed back to input.',
    inputsCount: 1,
    outputsCount: 1,
    params: [
      { name: 'units', label: 'Units', type: 'number', default: 32, min: 1 },
      activationParam('tanh'),
      { name: 'return_sequences', label: 'Return Sequences', type: 'boolean', default: false },
      { name: 'return_state', label: 'Return State', type: 'boolean', default: false },
      useBiasParam(),
      { name: 'dropout', label: 'Dropout', type: 'slider', default: 0.0, min: 0.0, max: 1.0, step: 0.05 },
      { name: 'recurrent_dropout', label: 'Recurrent Dropout', type: 'slider', default: 0.0, min: 0.0, max: 1.0, step: 0.05 },
      { name: 'name', label: 'Name', type: 'text', default: '' }
    ]
  },
  LSTM: {
    type: 'LSTM',
    category: 'RECURRENT',
    label: 'LSTM',
    description: 'Long Short-Term Memory layer - Hochreiter & Schmidhuber 1997.',
    inputsCount: 1,
    outputsCount: 1,
    params: [
      { name: 'units', label: 'Units', type: 'number', default: 32, min: 1 },
      activationParam('tanh'),
      { name: 'recurrent_activation', label: 'Recurrent Activation', type: 'select', default: 'sigmoid', options: ACTIVATION_OPTIONS },
      { name: 'return_sequences', label: 'Return Sequences', type: 'boolean', default: false },
      { name: 'return_state', label: 'Return State', type: 'boolean', default: false },
      useBiasParam(),
      { name: 'dropout', label: 'Dropout', type: 'slider', default: 0.0, min: 0.0, max: 1.0, step: 0.05 },
      { name: 'recurrent_dropout', label: 'Recurrent Dropout', type: 'slider', default: 0.0, min: 0.0, max: 1.0, step: 0.05 },
      { name: 'unit_forget_bias', label: 'Unit Forget Bias', type: 'boolean', default: true },
      { name: 'name', label: 'Name', type: 'text', default: '' }
    ]
  },
  GRU: {
    type: 'GRU',
    category: 'RECURRENT',
    label: 'GRU',
    description: 'Gated Recurrent Unit - Cho et al. 2014.',
    inputsCount: 1,
    outputsCount: 1,
    params: [
      { name: 'units', label: 'Units', type: 'number', default: 32, min: 1 },
      activationParam('tanh'),
      { name: 'recurrent_activation', label: 'Recurrent Activation', type: 'select', default: 'sigmoid', options: ACTIVATION_OPTIONS },
      { name: 'return_sequences', label: 'Return Sequences', type: 'boolean', default: false },
      { name: 'return_state', label: 'Return State', type: 'boolean', default: false },
      useBiasParam(),
      { name: 'dropout', label: 'Dropout', type: 'slider', default: 0.0, min: 0.0, max: 1.0, step: 0.05 },
      { name: 'recurrent_dropout', label: 'Recurrent Dropout', type: 'slider', default: 0.0, min: 0.0, max: 1.0, step: 0.05 },
      { name: 'reset_after', label: 'Reset After', type: 'boolean', default: true },
      { name: 'name', label: 'Name', type: 'text', default: '' }
    ]
  },
  Bidirectional: {
    type: 'Bidirectional',
    category: 'RECURRENT',
    label: 'Bidirectional',
    description: 'Bidirectional wrapper for RNNs.',
    inputsCount: 1,
    outputsCount: 1,
    params: [
      {
        name: 'layer_type',
        label: 'Wrapped Layer',
        type: 'select',
        default: 'LSTM',
        options: ['LSTM', 'GRU', 'SimpleRNN'],
        description: 'The RNN layer instance to wrap.'
      },
      { name: 'units', label: 'RNN Units', type: 'number', default: 32 },
      { name: 'merge_mode', label: 'Merge Mode', type: 'select', default: 'concat', options: ['sum', 'mul', 'concat', 'ave', 'None'] },
      { name: 'name', label: 'Name', type: 'text', default: '' }
    ]
  },

  // --- ATTENTION ---
  Attention: {
    type: 'Attention',
    category: 'ATTENTION',
    label: 'Attention',
    description: 'Dot-product attention layer, a.k.a. Luong-style attention.',
    inputsCount: 2, // Query, Value (Optional Key can be added as 3rd, but let's default to 2 inputs in React Flow handles)
    outputsCount: 1,
    params: [
      { name: 'use_scale', label: 'Use Scale', type: 'boolean', default: false },
      { name: 'score_mode', label: 'Score Mode', type: 'select', default: 'dot', options: ['dot', 'concat'] },
      { name: 'name', label: 'Name', type: 'text', default: '' }
    ]
  },
  AdditiveAttention: {
    type: 'AdditiveAttention',
    category: 'ATTENTION',
    label: 'Additive Attention',
    description: 'Additive attention layer, a.k.a. Bahdanau-style attention.',
    inputsCount: 2,
    outputsCount: 1,
    params: [
      { name: 'use_scale', label: 'Use Scale', type: 'boolean', default: true },
      { name: 'name', label: 'Name', type: 'text', default: '' }
    ]
  },
  MultiHeadAttention: {
    type: 'MultiHeadAttention',
    category: 'ATTENTION',
    label: 'Multi-Head Attention',
    description: 'MultiHeadAttention layer.',
    inputsCount: 2, // Query, Value (Key can equal Value if not connected)
    outputsCount: 1,
    params: [
      { name: 'num_heads', label: 'Number of Heads', type: 'number', default: 8, min: 1 },
      { name: 'key_dim', label: 'Key Dimension', type: 'number', default: 64, min: 1 },
      { name: 'value_dim', label: 'Value Dimension (optional)', type: 'number', default: null },
      { name: 'use_bias', label: 'Use Bias', type: 'boolean', default: true },
      { name: 'name', label: 'Name', type: 'text', default: '' }
    ]
  },

  // --- EMBEDDING ---
  Embedding: {
    type: 'Embedding',
    category: 'EMBEDDING',
    label: 'Embedding',
    description: 'Turns positive integers (indexes) into dense vectors of fixed size.',
    inputsCount: 1,
    outputsCount: 1,
    params: [
      { name: 'input_dim', label: 'Input Dim (Vocab)', type: 'number', default: 1000, min: 1 },
      { name: 'output_dim', label: 'Output Dim (Size)', type: 'number', default: 64, min: 1 },
      { name: 'input_length', label: 'Input Length (optional)', type: 'number', default: null },
      { name: 'mask_zero', label: 'Mask Zero', type: 'boolean', default: false },
      { name: 'name', label: 'Name', type: 'text', default: '' }
    ]
  },

  // --- MERGE ---
  Add: {
    type: 'Add',
    category: 'MERGE',
    label: 'Add',
    description: 'Layer that adds a list of inputs.',
    inputsCount: 'variable',
    outputsCount: 1,
    params: [{ name: 'name', label: 'Name', type: 'text', default: '' }]
  },
  Multiply: {
    type: 'Multiply',
    category: 'MERGE',
    label: 'Multiply',
    description: 'Layer that multiplies a list of inputs.',
    inputsCount: 'variable',
    outputsCount: 1,
    params: [{ name: 'name', label: 'Name', type: 'text', default: '' }]
  },
  Average: {
    type: 'Average',
    category: 'MERGE',
    label: 'Average',
    description: 'Layer that averages a list of inputs.',
    inputsCount: 'variable',
    outputsCount: 1,
    params: [{ name: 'name', label: 'Name', type: 'text', default: '' }]
  },
  Maximum: {
    type: 'Maximum',
    category: 'MERGE',
    label: 'Maximum',
    description: 'Layer that computes the maximum (element-wise) of a list of inputs.',
    inputsCount: 'variable',
    outputsCount: 1,
    params: [{ name: 'name', label: 'Name', type: 'text', default: '' }]
  },
  Minimum: {
    type: 'Minimum',
    category: 'MERGE',
    label: 'Minimum',
    description: 'Layer that computes the minimum (element-wise) of a list of inputs.',
    inputsCount: 'variable',
    outputsCount: 1,
    params: [{ name: 'name', label: 'Name', type: 'text', default: '' }]
  },
  Concatenate: {
    type: 'Concatenate',
    category: 'MERGE',
    label: 'Concatenate',
    description: 'Layer that concatenates a list of inputs along a specific axis.',
    inputsCount: 'variable',
    outputsCount: 1,
    params: [
      { name: 'axis', label: 'Axis', type: 'number', default: -1 },
      { name: 'name', label: 'Name', type: 'text', default: '' }
    ]
  },
  Dot: {
    type: 'Dot',
    category: 'MERGE',
    label: 'Dot',
    description: 'Layer that computes a dot product between samples in two tensors.',
    inputsCount: 2,
    outputsCount: 1,
    params: [
      { name: 'axes', label: 'Axes (int or tuple)', type: 'tuple', default: [1, 1] },
      { name: 'normalize', label: 'Normalize', type: 'boolean', default: false },
      { name: 'name', label: 'Name', type: 'text', default: '' }
    ]
  },
  Subtract: {
    type: 'Subtract',
    category: 'MERGE',
    label: 'Subtract',
    description: 'Layer that subtracts two inputs.',
    inputsCount: 2,
    outputsCount: 1,
    params: [{ name: 'name', label: 'Name', type: 'text', default: '' }]
  },

  // --- IMAGE PREPROCESSING ---
  Rescaling: {
    type: 'Rescaling',
    category: 'IMAGE_PREPROCESSING',
    label: 'Rescaling',
    description: 'A preprocessing layer which rescales input values to a new range.',
    inputsCount: 1,
    outputsCount: 1,
    params: [
      { name: 'scale', label: 'Scale Factor', type: 'number', default: 0.0039215686, description: '1/255' },
      { name: 'offset', label: 'Offset', type: 'number', default: 0.0 },
      { name: 'name', label: 'Name', type: 'text', default: '' }
    ]
  },
  Resizing: {
    type: 'Resizing',
    category: 'IMAGE_PREPROCESSING',
    label: 'Resizing',
    description: 'A preprocessing layer which resizes image inputs.',
    inputsCount: 1,
    outputsCount: 1,
    params: [
      { name: 'height', label: 'Target Height', type: 'number', default: 224, min: 1 },
      { name: 'width', label: 'Target Width', type: 'number', default: 224, min: 1 },
      { name: 'interpolation', label: 'Interpolation', type: 'select', default: 'bilinear', options: ['bilinear', 'nearest', 'bicubic'] },
      { name: 'name', label: 'Name', type: 'text', default: '' }
    ]
  },
  CenterCrop: {
    type: 'CenterCrop',
    category: 'IMAGE_PREPROCESSING',
    label: 'Center Crop',
    description: 'A preprocessing layer which crops the central portion of the images.',
    inputsCount: 1,
    outputsCount: 1,
    params: [
      { name: 'height', label: 'Crop Height', type: 'number', default: 112 },
      { name: 'width', label: 'Crop Width', type: 'number', default: 112 },
      { name: 'name', label: 'Name', type: 'text', default: '' }
    ]
  },
  RandomFlip: {
    type: 'RandomFlip',
    category: 'IMAGE_PREPROCESSING',
    label: 'Random Flip',
    description: 'A preprocessing layer which randomly flips images during training.',
    inputsCount: 1,
    outputsCount: 1,
    params: [
      { name: 'mode', label: 'Mode', type: 'select', default: 'horizontal_and_vertical', options: ['horizontal', 'vertical', 'horizontal_and_vertical'] },
      { name: 'name', label: 'Name', type: 'text', default: '' }
    ]
  },
  RandomRotation: {
    type: 'RandomRotation',
    category: 'IMAGE_PREPROCESSING',
    label: 'Random Rotation',
    description: 'A preprocessing layer which randomly rotates images during training.',
    inputsCount: 1,
    outputsCount: 1,
    params: [
      { name: 'factor', label: 'Rotation Factor', type: 'number', default: 0.2, description: 'Percentage of 2pi (e.g. 0.2 = 72 deg).' },
      { name: 'name', label: 'Name', type: 'text', default: '' }
    ]
  },
  RandomContrast: {
    type: 'RandomContrast',
    category: 'IMAGE_PREPROCESSING',
    label: 'Random Contrast',
    description: 'A preprocessing layer which randomly adjusts contrast during training.',
    inputsCount: 1,
    outputsCount: 1,
    params: [
      { name: 'factor', label: 'Contrast Factor', type: 'number', default: 0.2 },
      { name: 'name', label: 'Name', type: 'text', default: '' }
    ]
  },
  RandomZoom: {
    type: 'RandomZoom',
    category: 'IMAGE_PREPROCESSING',
    label: 'Random Zoom',
    description: 'A preprocessing layer which randomly zooms images during training.',
    inputsCount: 1,
    outputsCount: 1,
    params: [
      { name: 'height_factor', label: 'Height Zoom Factor', type: 'number', default: 0.2 },
      { name: 'width_factor', label: 'Width Zoom Factor', type: 'number', default: 0.2 },
      { name: 'name', label: 'Name', type: 'text', default: '' }
    ]
  },
  RandomTranslation: {
    type: 'RandomTranslation',
    category: 'IMAGE_PREPROCESSING',
    label: 'Random Translation',
    description: 'A preprocessing layer which randomly translates images during training.',
    inputsCount: 1,
    outputsCount: 1,
    params: [
      { name: 'height_factor', label: 'Height Translation Factor', type: 'number', default: 0.2 },
      { name: 'width_factor', label: 'Width Translation Factor', type: 'number', default: 0.2 },
      { name: 'name', label: 'Name', type: 'text', default: '' }
    ]
  },

  // --- REGULARIZATION ---
  ActivityRegularization: {
    type: 'ActivityRegularization',
    category: 'REGULARIZATION',
    label: 'Activity Regularization',
    description: 'Layer that applies an update to the cost function based on input activity.',
    inputsCount: 1,
    outputsCount: 1,
    params: [
      { name: 'l1', label: 'L1', type: 'number', default: 0.0 },
      { name: 'l2', label: 'L2', type: 'number', default: 0.0 },
      { name: 'name', label: 'Name', type: 'text', default: '' }
    ]
  },

  // --- NOISE ---
  GaussianNoise: {
    type: 'GaussianNoise',
    category: 'NOISE',
    label: 'Gaussian Noise',
    description: 'Apply additive zero-centered Gaussian noise.',
    inputsCount: 1,
    outputsCount: 1,
    params: [
      { name: 'stddev', label: 'Standard Deviation', type: 'number', default: 0.1, min: 0.0 },
      { name: 'name', label: 'Name', type: 'text', default: '' }
    ]
  },

  // --- CUSTOM ---
  CustomLayer: {
    type: 'CustomLayer',
    category: 'CUSTOM',
    label: 'Custom Layer',
    description: 'Create an arbitrary custom Keras layer with custom variables and operations.',
    inputsCount: 1,
    outputsCount: 1,
    params: [
      { name: 'class_name', label: 'Python Class Name', type: 'text', default: 'MyCustomLayer' },
      { name: 'custom_params', label: 'Constructor Params (JSON)', type: 'json', default: { units: 32 } },
      { name: 'call_code', label: 'Call Operation', type: 'text', default: 'tf.matmul(inputs, self.w) + self.b' },
      { name: 'name', label: 'Name', type: 'text', default: '' }
    ]
  }
};

export const getCategoryColor = (category: LayerCategory): string => {
  switch (category) {
    case 'INPUT': return '#3b82f6'; // Blue
    case 'CORE': return '#10b981'; // Emerald/Green
    case 'CONVOLUTION': return '#8b5cf6'; // Purple
    case 'POOLING': return '#f59e0b'; // Amber/Orange
    case 'NORMALIZATION': return '#ec4899'; // Pink
    case 'DROPOUT': return '#ef4444'; // Red
    case 'RECURRENT': return '#14b8a6'; // Teal
    case 'ATTENTION': return '#6366f1'; // Indigo
    case 'EMBEDDING': return '#a855f7'; // Purple-light
    case 'MERGE': return '#f43f5e'; // Rose
    case 'IMAGE_PREPROCESSING': return '#84cc16'; // Lime
    case 'REGULARIZATION': return '#06b6d4'; // Cyan
    case 'NOISE': return '#6b7280'; // Gray
    case 'CUSTOM': return '#d97706'; // Amber-dark
    case 'COMMENT': return '#eab308'; // Yellow
    default: return '#9ca3af'; // Gray
  }
};
