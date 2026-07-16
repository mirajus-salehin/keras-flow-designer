export interface LayerRecommendation {
  layerType: string;
  reason: string;
  confidence: number; // 0 to 1
}

export const getNextLayerRecommendations = (
  currentLayerType: string | null
): LayerRecommendation[] => {
  if (!currentLayerType) {
    return [
      { layerType: 'Input', reason: 'Every neural network needs an Input layer as the starting point.', confidence: 0.95 },
      { layerType: 'InputLayer', reason: 'Alternative entry point to specify model inputs.', confidence: 0.70 }
    ];
  }

  switch (currentLayerType) {
    case 'Input':
    case 'InputLayer':
      return [
        { layerType: 'Conv2D', reason: 'Common next step for image inputs to extract spatial features.', confidence: 0.90 },
        { layerType: 'Dense', reason: 'Common next step for flat tabular inputs.', confidence: 0.85 },
        { layerType: 'Embedding', reason: 'Required next step for text/sequence inputs before RNNs/Transformers.', confidence: 0.80 },
        { layerType: 'Rescaling', reason: 'Normalize pixel values (e.g. scale by 1/255) at the start.', confidence: 0.75 }
      ];

    case 'Conv2D':
      return [
        { layerType: 'BatchNormalization', reason: 'Normalizes activations to stabilize and accelerate training.', confidence: 0.90 },
        { layerType: 'MaxPooling2D', reason: 'Reduces spatial dimensions, providing translation invariance.', confidence: 0.85 },
        { layerType: 'Activation', reason: 'Applies non-linearity (e.g., ReLU) if not specified in Conv2D.', confidence: 0.70 },
        { layerType: 'Dropout', reason: 'Adds spatial regularization to prevent overfitting.', confidence: 0.60 }
      ];

    case 'BatchNormalization':
      return [
        { layerType: 'Activation', reason: 'Standard practice is Conv -> BatchNorm -> Activation.', confidence: 0.95 },
        { layerType: 'MaxPooling2D', reason: 'Downsamples spatial dimensions after normalization.', confidence: 0.75 },
        { layerType: 'Conv2D', reason: 'Stack another convolution layer to build deeper hierarchies.', confidence: 0.65 }
      ];

    case 'MaxPooling2D':
    case 'AveragePooling2D':
      return [
        { layerType: 'Conv2D', reason: 'Stack another convolution layer to extract higher-level features.', confidence: 0.85 },
        { layerType: 'Flatten', reason: 'Flatten the 2D feature maps before feeding to Dense layers.', confidence: 0.80 },
        { layerType: 'GlobalAveragePooling2D', reason: 'Alternative to Flatten that reduces parameters and overfitting.', confidence: 0.70 }
      ];

    case 'Flatten':
      return [
        { layerType: 'Dense', reason: 'Standard dense layer for classification or regression heads.', confidence: 0.95 },
        { layerType: 'Dropout', reason: 'Regularize dense connections.', confidence: 0.75 }
      ];

    case 'Dense':
      return [
        { layerType: 'Dropout', reason: 'Highly recommended after dense layers to prevent co-adaptation of weights.', confidence: 0.85 },
        { layerType: 'Dense', reason: 'Stack another dense layer to build deep multi-layer perceptrons.', confidence: 0.70 },
        { layerType: 'Activation', reason: 'Applies custom activations like softmax for classification output.', confidence: 0.65 }
      ];

    case 'Embedding':
      return [
        { layerType: 'LSTM', reason: 'Learn sequential dependencies from embedded tokens.', confidence: 0.85 },
        { layerType: 'GRU', reason: 'Computationally cheaper alternative to LSTM.', confidence: 0.80 },
        { layerType: 'GlobalAveragePooling1D', reason: 'Aggregate embedding vectors (common for simple text classification).', confidence: 0.70 }
      ];

    case 'LSTM':
    case 'GRU':
    case 'SimpleRNN':
    case 'Bidirectional':
      return [
        { layerType: 'Dropout', reason: 'Regularize recurrent states.', confidence: 0.75 },
        { layerType: 'Dense', reason: 'Connect hidden states to output prediction layers.', confidence: 0.70 },
        { layerType: 'GlobalMaxPooling1D', reason: 'Extract the most salient features over time.', confidence: 0.60 }
      ];

    case 'GlobalAveragePooling2D':
    case 'GlobalMaxPooling2D':
      return [
        { layerType: 'Dense', reason: 'Feed global descriptors directly to classification output.', confidence: 0.90 },
        { layerType: 'Dropout', reason: 'Apply final regularization before the output layer.', confidence: 0.70 }
      ];

    case 'Rescaling':
    case 'Resizing':
      return [
        { layerType: 'RandomFlip', reason: 'Apply data augmentation straight after image preparation.', confidence: 0.80 },
        { layerType: 'Conv2D', reason: 'Feed preprocessed image inputs into convolutional layers.', confidence: 0.75 }
      ];

    default:
      return [
        { layerType: 'Dense', reason: 'Densely-connected layer is the most versatile builder.', confidence: 0.50 },
        { layerType: 'Dropout', reason: 'Prevent overfitting in downstream connections.', confidence: 0.40 },
        { layerType: 'BatchNormalization', reason: 'Stabilize activations through normalization.', confidence: 0.40 }
      ];
  }
};
