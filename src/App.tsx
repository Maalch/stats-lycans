import GeneralKPI from './components/GeneralKPI';
import PlayersKPI from './components/PlayersKPI';

function App() {
  return (
    <div>
      <img
        src="/stats-lycans/lycansBannerSVG.svg"
        alt="Lycans Banner"
        style={{ width: '100%', maxWidth: 900, margin: '0 auto', display: 'block' }}
      />
      <GeneralKPI />
      <PlayersKPI />
    </div>
  );
}

export default App;