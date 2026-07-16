import React, { useEffect } from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import { MainToolbar } from './components/Toolbar/MainToolbar';
import { LayerLibrary } from './components/Sidebar/LayerLibrary';
import { FlowCanvas } from './components/Canvas/FlowCanvas';
import { NodeProperties } from './components/PropertyPanel/NodeProperties';
import { TabbedBottomPanel } from './components/BottomPanel/TabbedBottomPanel';
import { useProjectStore } from './store/useProjectStore';

function App() {
  const theme = useProjectStore((state) => state.theme);
  const runEngine = useProjectStore((state) => state.runEngine);

  // Sync theme class to document body on startup and run engine
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Run the engine loop once on startup to process initial graph
  useEffect(() => {
    runEngine();
  }, [runEngine]);

  return (
    <ReactFlowProvider>
      <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-50 dark:bg-cyber-950 font-sans antialiased text-slate-800 dark:text-slate-100">
        {/* Header Actions & Tabs */}
        <MainToolbar />

        {/* Workspace: Sidebar | Canvas & Console | Parameter customization */}
        <div className="flex-1 flex flex-row overflow-hidden min-h-0">
          <LayerLibrary />

          <div className="flex-1 flex flex-col overflow-hidden min-w-0">
            <FlowCanvas />
            <TabbedBottomPanel />
          </div>

          <NodeProperties />
        </div>
      </div>
    </ReactFlowProvider>
  );
}

export default App;
