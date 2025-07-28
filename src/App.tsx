import { useState, Suspense, lazy } from 'react';
import './App.css';
import TabNavigation from './components/TabNavigation';

const GeneralKPI = lazy(() => import('./components/GeneralKPI'));
const PlayersKPI = lazy(() => import('./components/PlayersKPI'));
const SessionsKPI = lazy(() => import('./components/SessionsKPI'));

function App() {
  const [activeTab, setActiveTab] = useState('general');

  const tabs = [
    { id: 'general', label: 'Statistiques Générales' },
    { id: 'sessions', label: 'Sessions de Jeu' },
    { id: 'players', label: 'Joueurs' },
  ];

  return (
    <div className="app-container">
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
          <Suspense fallback={<div>Chargement...</div>}>
            {activeTab === 'general' && <GeneralKPI />}
            {activeTab === 'sessions' && <SessionsKPI />}
            {activeTab === 'players' && <PlayersKPI />}
          </Suspense>
        </div>
      </div>
    </div>
  );
}

export default App;