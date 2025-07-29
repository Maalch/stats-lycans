import { useState } from 'react';
import { useSessionStats } from '../../hooks/useSessionStats';
import { usePlayerStatsBySession } from '../../hooks/usePlayerStatsBySession';
import { SessionPlayerStats } from './SessionPlayerStats';
import './SessionsKPI.css';

export default function SessionsKPI() {
  const { gameSessionData, isDataFetching, fetchError } = useSessionStats();
  const [activeSession, setActiveSession] = useState<string | null>(null);
  
  // Only fetch player stats when a session is selected
  const { 
    playerStatsBySession, 
    loading: loadingSessionPlayerStats,
    error: sessionPlayerStatsError
  } = usePlayerStatsBySession(activeSession);

  if (isDataFetching) return <div>Chargement des statistiques des sessions...</div>;
  if (fetchError) return <div>Erreur: {fetchError.message}</div>;
  if (!gameSessionData || gameSessionData.length === 0) return <div>Aucune donnée de session disponible</div>;

  const selectedSessionInfo = activeSession 
    ? gameSessionData.find(s => s.DateSession === activeSession)
    : null;

  return (
    <div className="lycans-session-stats">
      <h2>Statistiques par Session de Jeu</h2>
      
      {/* Session Selector */}
      <div className="lycans-session-selector">
        <label>Sélectionner une session: </label>
        <select 
          value={activeSession || ''} 
          onChange={(e) => setActiveSession(e.target.value || null)}
          className="lycans-selector"
        >
          <option value="">Toutes les sessions</option>
          {gameSessionData.map((session) => (
            <option key={session.DateSession} value={session.DateSession}>
              {session.DateSession} ({session.NombreParties} parties)
            </option>
          ))}
        </select>
      </div>

      {/* Sessions Table */}
      {!activeSession && (
        <div className="lycans-sessions-table">
          <h3>Vue d'ensemble des sessions</h3>
          <div className="table-container">
            <table className="lycans-stats-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Parties</th>
                  <th>Durée moyenne</th>
                  <th>Temps total</th>
                  <th>Joueurs/partie</th>
                  <th>Versions</th>
                  <th>Lien Youtube</th>
                </tr>
              </thead>
              <tbody>
                {gameSessionData.map((session) => (
                  <tr 
                    key={session.DateSession} 
                    onClick={() => setActiveSession(session.DateSession)}
                    className="clickable-row"
                  >
                    <td>{session.DateSession}</td>
                    <td>{session.NombreParties}</td>
                    <td>{session.DureeMoyenne}</td>
                    <td>{session.TempsJeuTotal}</td>
                    <td>{session.JoueursMoyen}</td>
                    <td>
                      {session.Versions && session.Versions.length > 0 ? (
                        session.Versions.join(', ')
                      ) : (
                        <span>-</span>
                      )}
                    </td>
                    <td>
                      {session.VideosYoutube && session.VideosYoutube.length > 0 ? (
                        session.VideosYoutube.map((link, idx) => (
                          <a 
                            key={idx} 
                            href={link} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="video-link"
                          >
                            {idx + 1}
                          </a>
                        ))
                      ) : (
                        <span>-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Individual Session Detail */}
      {selectedSessionInfo && (
        <div className="lycans-session-detail">
          <h3>Session du {selectedSessionInfo.DateSession}</h3>
          
          <div className="lycans-stats-summary">
            <div className="lycans-stat-box">
              <h4>Nombre de Parties</h4>
              <p>{selectedSessionInfo.NombreParties}</p>
            </div>
            <div className="lycans-stat-box">
              <h4>Durée Moyenne</h4>
              <p>{selectedSessionInfo.DureeMoyenne}</p>
            </div>
            <div className="lycans-stat-box">
              <h4>Temps de Jeu Total</h4>
              <p>{selectedSessionInfo.TempsJeuTotal}</p>
            </div>
            <div className="lycans-stat-box">
              <h4>Nombre Moyen de Joueurs</h4>
              <p>{selectedSessionInfo.JoueursMoyen}</p>
            </div>
          </div>
          
          {selectedSessionInfo.VideosYoutube && selectedSessionInfo.VideosYoutube.length > 0 && (
            <div className="lycans-video-links">
              <h4>Liens Youtube de la session</h4>
              <div className="lycans-video-grid">
                {selectedSessionInfo.VideosYoutube.map((link, idx) => (
                  <a 
                    key={idx} 
                    href={link} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="lycans-video-button"
                  >
                    Lien {idx + 1}
                  </a>
                ))}
              </div>
            </div>
          )}
          
          {/* Player Statistics for this Session */}

            {loadingSessionPlayerStats && <div>Chargement des statistiques des joueurs...</div>}
            
            {sessionPlayerStatsError && (
              <div className="info-message error">
                <p>Erreur: {sessionPlayerStatsError.message}</p>
              </div>
            )}
            
            {!loadingSessionPlayerStats && !sessionPlayerStatsError && playerStatsBySession && (
              <SessionPlayerStats
                playerStatsBySession={playerStatsBySession}
                loading={loadingSessionPlayerStats}
                error={sessionPlayerStatsError}
              />
            )}
        </div>
      )}
    </div>
  );
}