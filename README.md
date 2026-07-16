# Keras Flow Designer 🧠💻

A professional, web-based visual programming IDE that allows machine learning engineers and developers to visually design, validate, and export **TensorFlow / Keras** neural network architectures. Built with a Node-RED style drag-and-drop interface, this application performs live shape propagation, model parameter estimates (FLOPs, memory footprint), and graph validations entirely in the browser.

---

## Key Features 🚀

- 🌐 **Infinite Canvas**: Interactive zoom, pan, grid snapping, and minimap controls.
- 📂 **Tabbed Workspace**: Manage multiple neural network designs concurrently in a single session.
- 🎨 **Complete Layer Catalog**: Search and drag over 60 Keras layers including Convolutions, LSTMs, Attention heads, Preprocessing transforms, and Custom layers.
- ⚙️ **Parameter customizer panel**: Full widget coverage (sliders, dropdowns, tuple inputs, JSON editors) mapping to Keras constructor APIs.
- 📐 **Live Shape Propagation**: Calculates tensor shape transforms topographically and prints intermediate dimensions directly on edge connections.
- 📊 **Model Metrics Summarizer**: Real-time evaluation of total/trainable weights, FLOP calculations, and activation memory sizes.
- ⚠️ **Validation Engine**: Detects circular paths, disconnected modules, parameter range violations, and rank/dimension mismatch errors.
- ⚡ **Multi-Framework Generators**: Instant compilation to Keras Functional API, Keras Sequential API, PyTorch (`nn.Module`), and TensorFlow.js.
- 📦 **Workspace Exporting**: Download model python files, project graphs (.json), or package the whole setup (scripts, data loaders, `train.py`, requirements, readme) into a `.zip` archive.
- 💡 **AI Layer Recommender**: Recommends relevant downstream layers based on the currently selected layer.

---

## Tech Stack 🛠️

- **Core**: React 19, TypeScript, Vite, Tailwind CSS v3
- **Flow Engine**: React Flow v12 (`@xyflow/react`)
- **State Store**: Zustand
- **Code Highlighting**: Monaco Editor (`@monaco-editor/react`)
- **Auto Layout**: Dagre (`@dagrejs/dagre`)
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Validators**: Zod, React Hook Form

---

## Getting Started ⚙️

### Prerequisites

Ensure you have **Node.js** (v18 or higher) and **npm** (v9 or higher) installed.

### Installation & Local Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/mirajus-salehin/keras-flow-designer.git
   ```

2. **Navigate into the directory**:
   ```bash
   cd keras-flow-designer
   ```

3. **Install dependencies**:
   ```bash
   npm install
   ```

4. **Start the local development server**:
   ```bash
   npm run dev
   ```
   Open your browser and navigate to the displayed URL (usually `http://localhost:5173`).

5. **Build the production assets**:
   ```bash
   npm run build
   ```
   The compiled assets will be built inside the `dist/` directory, ready to be served.

---

## Running with Docker 🐳

You can easily run the application inside a container using the provided `Dockerfile` and Nginx server configuration.

### Option A: Using Docker Compose (Recommended)

1. Ensure Docker is running.
2. Spin up the container:
   ```bash
   docker compose up -d
   ```
3. Open your browser and navigate to:
   ```text
   http://localhost:8080
   ```
4. To stop the service:
   ```bash
   docker compose down
   ```

### Option B: Using Raw Docker CLI

1. Build the Docker image:
   ```bash
   docker build -t keras-flow-designer .
   ```

2. Start the container and map it to port `8080`:
   ```bash
   docker run -d -p 8080:80 --name keras-flow-designer keras-flow-designer
   ```

3. Open your browser and navigate to:
   ```text
   http://localhost:8080
   ```

4. Stop and remove the container:
   ```bash
   docker stop keras-flow-designer
   docker rm keras-flow-designer
   ```

---

## Project Structure 📁

```text
keras-flow-designer/
├── src/
│   ├── assets/             # Brand icons and graphics
│   ├── components/
│   │   ├── Canvas/         # Node handles, comments, groups, custom edges, and menus
│   │   ├── Sidebar/        # Searchable layers catalog, datasets, and optimizer properties
│   │   ├── Toolbar/        # Tabs management, auto-layout, zoom, and ZIP exporter
│   │   ├── PropertyPanel/  # Param widget editor mapping to Keras APIs
│   │   └── BottomPanel/    # Monaco code viewer, metrics, and error console
│   ├── features/
│   │   ├── Graph/          # Auto-layout alignments
│   │   ├── Validation/     # Topology and parameter bounds validator
│   │   ├── TensorFlow/     # Shape propagation, weights estimation, and transpile compile
│   │   └── Export/         # Text and ZIP export configurations
│   ├── store/              # Zustand global workspace store (history, tabs, persistence)
│   ├── styles/             # Stylesheet configuration and tailwind custom grids
│   ├── types/              # TS interface definitions
│   └── utils/              # Keras layer parameter catalog & AI recommendations helper
├── index.html              # Main HTML entrypoint
├── package.json            # Node scripts and dependencies
├── tailwind.config.js      # Tailwind theme extensions
├── tsconfig.json           # TS compiler rules
└── Dockerfile              # Production multi-stage Docker build recipe
```
