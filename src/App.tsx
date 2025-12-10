
import { useState } from 'react';
import Dashboard from './components/Dashboard';
import GameContainer from './components/GameContainer';
import './App.css';

function App() {
  const [currentModule, setCurrentModule] = useState<string | null>(null);

  const handleSelectModule = (mod: string) => {
    setCurrentModule(mod);
  };

  const handleBack = () => {
    setCurrentModule(null);
  };

  return (
    <main>
      <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', background: 'radial-gradient(circle at 50% 50%, rgba(11, 14, 20, 0) 0%, rgba(11, 14, 20, 0.8) 100%)', zIndex: -1 }}></div>

      {currentModule ? (
        <GameContainer moduleId={currentModule} onExit={handleBack} />
      ) : (
        <Dashboard onSelectModule={handleSelectModule} />
      )}
    </main>
  );
}

export default App;
