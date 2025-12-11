
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
      {currentModule ? (
        <GameContainer moduleId={currentModule} onExit={handleBack} />
      ) : (
        <Dashboard onSelectModule={handleSelectModule} />
      )}
    </main>
  );
}

export default App;
