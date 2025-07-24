function doGet(e) {
  var action = e.parameter.action;
  if (action === 'participationRate') {
    return getParticipationRate();
  } else if (action === 'playersWithColors') {
    return getPlayersWithColors();
  }
  else {
    return ContentService.createTextOutput('Invalid action - not found').setMimeType(ContentService.MimeType.TEXT);
  }
}

function getParticipationRate(e) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var participationsSheet = ss.getSheetByName('Participations');
  var partiesSheet = ss.getSheetByName('Parties');

  // Get all participations data
  var participations = participationsSheet.getDataRange().getValues();
  var participationHeaders = participations[0];
  var partieIdIdx = participationHeaders.indexOf('PartieID');
  var joueurIdIdx = participationHeaders.indexOf('JoueurID');

// Get all unique PartieID from Parties sheet, ignoring empty rows
var parties = partiesSheet.getDataRange().getValues();
var partiesHeaders = parties[0];
var partieIdIndex = partiesHeaders.indexOf('PartieID');
var allPartieIDs = new Set(
  parties.slice(1)
    .map(row => row[partieIdIndex])
    .filter(id => id !== "" && id !== null && id !== undefined)
);
var totalGames = allPartieIDs.size;

  // Count participations per player
  var playerCounts = {};
  participations.slice(1).forEach(row => {
    var joueur = row[joueurIdIdx];
    var partie = row[partieIdIdx];
    if (!joueur || !partie) return;
    if (!playerCounts[joueur]) playerCounts[joueur] = new Set();
    playerCounts[joueur].add(partie);
  });

  // Calculate participation rate
  var result = Object.entries(playerCounts).map(([joueur, partieSet]) => ({
    JoueurID: joueur,
    ParticipationCount: partieSet.size,
    ParticipationRate: partieSet.size / totalGames
  }));

  return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
}

function getPlayersWithColors() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var joueursSheet = ss.getSheetByName('Joueurs');
  var data = joueursSheet.getDataRange().getValues();
  var backgrounds = joueursSheet.getDataRange().getBackgrounds();
  var headers = data[0];
  var joueurIdIdx = headers.indexOf('JoueurID');
  var couleurIdx = headers.indexOf('Couleur');

  // Skip header row, map each player to their color and background color
  var players = data.slice(1).map((row, i) => ({
    JoueurID: row[joueurIdIdx],
    Couleur: row[couleurIdx],
    CouleurBackground: backgrounds[i + 1][couleurIdx] // +1 to skip header row
  }));

  return ContentService.createTextOutput(JSON.stringify(players)).setMimeType(ContentService.MimeType.JSON);
}