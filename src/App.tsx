import { useState } from 'react';
import './App.css';
import GeneralKPI from './components/GeneralKPI';
import PlayersKPI from './components/PlayersKPI';
import SessionsKPI from './components/SessionsKPI';
import TabNavigation from './components/TabNavigation';

function App() {
  const [activeTab, setActiveTab] = useState('general');

  const tabs = [
    { id: 'general', label: 'Statistiques Générales' },
    { id: 'sessions', label: 'Sessions de Jeu' },
    { id: 'players', label: 'Joueurs' },
  ];

  return (
    <div>
      <img
        className="lycans-banner"
        src={`${import.meta.env.BASE_URL}lycansBannerSVG.svg`}
        alt="Lycans Banner"
      />
      <div className="main-container">
        <TabNavigation 
          activeTab={activeTab} 
          onTabChange={setActiveTab} 
          tabs={tabs} 
        />

        <div className="section-card">
          {activeTab === 'general' && <GeneralKPI />}
          {activeTab === 'sessions' && <SessionsKPI />}
          {activeTab === 'players' && <PlayersKPI />}
        </div>
      </div>
    </div>
  );
}

export default App;