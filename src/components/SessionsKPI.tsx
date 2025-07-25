import { useState } from 'react';
import { useSessionStats } from '../hooks/useSessionStats';
import { usePlayerStatsBySession } from '../hooks/usePlayerStatsBySession';

import { 
  Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell 
} from 'recharts';

const ROLE_COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

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
                  <th>Vidéos</th>
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
              <h4>Vidéos de la session</h4>
              <div className="lycans-video-grid">
                {selectedSessionInfo.VideosYoutube.map((link, idx) => (
                  <a 
                    key={idx} 
                    href={link} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="lycans-video-button"
                  >
                    Vidéo {idx + 1}
                  </a>
                ))}
              </div>
            </div>
          )}
          
          {/* Player Statistics for this Session */}
          <div className="lycans-session-player-stats">
            <h3>Statistiques des joueurs pour cette session</h3>
            
            {loadingSessionPlayerStats && <div>Chargement des statistiques des joueurs...</div>}
            
            {sessionPlayerStatsError && (
              <div className="info-message error">
                <p>⚠️ Erreur: {sessionPlayerStatsError.message}</p>
              </div>
            )}
            
            {!loadingSessionPlayerStats && !sessionPlayerStatsError && playerStatsBySession?.length === 0 && (
              <div className="info-message">
                <p>Aucune donnée de joueur disponible pour cette session.</p>
              </div>
            )}
            
            {!loadingSessionPlayerStats && !sessionPlayerStatsError && playerStatsBySession && playerStatsBySession.length > 0 && (
              <div className="player-session-cards">
                {playerStatsBySession.map(player => (
                  <div key={player.JoueurID} className="player-session-card">
                    <h4>{player.JoueurID}</h4>
                    
                    <div className="player-session-stats">
                      <div className="player-stat">
                        <span>Parties:</span>
                        <strong>{player.PartiesSession}</strong>
                      </div>
                      <div className="player-stat">
                        <span>Victoires:</span>
                        <strong>{player.VictoiresSession} ({(player.TauxVictoireSession * 100).toFixed(1)}%)</strong>
                      </div>
                      <div className="player-stat">
                        <span>Survie:</span>
                        <strong>{player.SurvivantSession} ({(player.TauxSurvieSession * 100).toFixed(1)}%)</strong>
                      </div>
                    </div>
                    
                    {player.DistributionRolesSession.length > 0 && (
                      <div className="player-roles-chart">
                        <h5>Rôles joués</h5>
                        <ResponsiveContainer width="100%" height={100}>
                          <PieChart>
                            <Pie
                              data={player.DistributionRolesSession.slice(0, 5)}
                              cx="50%"
                              cy="50%"
                              innerRadius={15}
                              outerRadius={30}
                              dataKey="Count"
                              nameKey="RoleName"
                            >
                              {player.DistributionRolesSession.slice(0, 5).map((_, index) => (
                                <Cell key={`cell-${index}`} fill={ROLE_COLORS[index % ROLE_COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip formatter={(value) => [`${value} fois`, 'Joué']} />
                          </PieChart>
                        </ResponsiveContainer>
                        <div className="role-legend">
                          {player.DistributionRolesSession.slice(0, 3).map((role, idx) => (
                            <div key={idx} className="role-item">
                              <span 
                                className="role-color" 
                                style={{ backgroundColor: ROLE_COLORS[idx % ROLE_COLORS.length] }}
                              ></span>
                              <span className="role-name">{role.RoleName}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}