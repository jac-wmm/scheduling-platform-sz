import { useState } from 'react';
import { useContext } from 'react';
import { ScheduleProvider, ScheduleContext } from './context/ScheduleContext';
import TopToolbar from './components/layout/TopToolbar';
import ControlsPanel from './components/layout/ControlsPanel';
import ContentPanel from './components/layout/ContentPanel';
import LLMChatPanel from './components/layout/LLMChatPanel';
import './App.css';

function AppContent() {
  const { currentView, setCurrentView } = useContext(ScheduleContext);
  const [chatCollapsed, setChatCollapsed] = useState(true);

  const toggleChatPanel = () => {
    setChatCollapsed(!chatCollapsed);
  };

  return (
    <div id="app-container">
      <TopToolbar />
      <div id="main-layout">
        <ControlsPanel currentView={currentView} setCurrentView={setCurrentView} />
        <ContentPanel currentView={currentView} />
        <LLMChatPanel collapsed={chatCollapsed} onToggle={toggleChatPanel} />
      </div>
    </div>
  );
}

function App() {
  return (
    <ScheduleProvider>
      <AppContent />
    </ScheduleProvider>
  );
}

export default App;
