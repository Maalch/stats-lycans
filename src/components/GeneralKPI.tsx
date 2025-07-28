
import { useGameStats } from '../hooks/useGameStats';
import './GeneralKPI.css';

export default function GeneralKPI() {
  // Game stats (durée moyenne, plus courte, plus longue)
  const { data: gameStats, loading: loadingGameStats } = useGameStats() as {
    data: {
      TotalParties: number;
      DureeMoyenne: string;
      PartiePlusCourte: { PartieID: string; Duree: string; Date: string; LienVideo: string };
      PartiePlusLongue: { PartieID: string; Duree: string; Date: string; LienVideo: string };
    };
    loading: boolean;
  };

  if (loadingGameStats) return <div>Chargement des stats générales...</div>;

  return (
    <div>
      <h2>Statistiques Générales des Parties</h2>
      <div className="general-kpi-summary-row">
        <div className="general-kpi-stat-box">
          <strong>Nombre total de parties :</strong><br />
          {gameStats?.TotalParties || '-'}
        </div>
        <div className="general-kpi-stat-box">
          <strong>Durée moyenne :</strong><br />
          {gameStats?.DureeMoyenne || '-'}
        </div>
        <div className="general-kpi-stat-box">
          <strong>Partie la plus courte :</strong><br />
          {gameStats?.PartiePlusCourte?.Duree || '-'}<br />
          <small>Date : {gameStats?.PartiePlusCourte?.Date || '-'}</small><br />
          {gameStats?.PartiePlusCourte?.LienVideo && (
            <a href={gameStats.PartiePlusCourte.LienVideo} target="_blank" rel="noopener noreferrer">Lien vidéo</a>
          )}
        </div>
        <div className="general-kpi-stat-box">
          <strong>Partie la plus longue :</strong><br />
          {gameStats?.PartiePlusLongue?.Duree || '-'}<br />
          <small>Date : {gameStats?.PartiePlusLongue?.Date || '-'}</small><br />
          {gameStats?.PartiePlusLongue?.LienVideo && (
            <a href={gameStats.PartiePlusLongue.LienVideo} target="_blank" rel="noopener noreferrer">Lien vidéo</a>
          )}
        </div>
      </div>
    </div>
  );
}