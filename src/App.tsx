import './App.css';
import GeneralKPI from './components/GeneralKPI';
import PlayersKPI from './components/PlayersKPI';

function App() {
  return (
    <div>
      <img
        className="lycans-banner"
        src={`${import.meta.env.BASE_URL}lycansBannerSVG.svg`}
        alt="Lycans Banner"
      />
      <div className="main-container">
        <div className="section-card">
          <GeneralKPI />
        </div>
        <div className="section-card">
          <PlayersKPI />
        </div>
      </div>
    </div>
  );
}

export default App;