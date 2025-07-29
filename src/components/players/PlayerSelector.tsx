// PlayerSelector.tsx
interface PlayerSelectorProps {
  players: { JoueurID: string }[];
  selectedPlayer: string | null;
  onChange: (player: string | null) => void;
}

export function PlayerSelector({ players, selectedPlayer, onChange }: PlayerSelectorProps) {
  return (
    <div className="player-selector">
      <label>Sélectionner un joueur: </label>
      <select
        value={selectedPlayer || ''}
        onChange={e => onChange(e.target.value || null)}
      >
        <option value="">Tous les joueurs</option>
        {players.map(player => (
          <option key={player.JoueurID} value={player.JoueurID}>
            {player.JoueurID}
          </option>
        ))}
      </select>
    </div>
  );
}