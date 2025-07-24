function doGet(e) {
  var action = e.parameter.action;
  if (action === 'participationRate') {
    return getParticipationRate();
  } else if (action === 'playersWithColors') {
    return getPlayersWithColors();
  } else if (action === 'gameStats') {
    return getGameDurationStats();
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

function getPlayersWithColors(e) {
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

// Calcule la durée moyenne, la partie la plus courte et la plus longue avec date et lien vidéo
function getGameDurationStats() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var partiesSheet = ss.getSheetByName('Parties');
  var parties = partiesSheet.getDataRange().getValues();
  var richLinks = partiesSheet.getDataRange().getRichTextValues();
  var headers = parties[0];
  var dureeIdx = headers.indexOf('Duree');
  var dateIdx = headers.indexOf('Date');
  var lienIdx = headers.indexOf('LienVideo');
  var partieIdIdx = headers.indexOf('PartieID');

  // Helper pour convertir HH:MM:SS en secondes
  function dureeToSeconds(duree) {
    if (!duree) return null;
    // Si c'est un objet Date
    if (Object.prototype.toString.call(duree) === '[object Date]') {
      return duree.getHours() * 3600 + duree.getMinutes() * 60 + duree.getSeconds();
    }
    // Si c'est une chaîne de type 'Sat Dec 30 1899 00:10:59 GMT+...'
    if (typeof duree === 'string') {
      var match = duree.match(/(\d{2}):(\d{2}):(\d{2})/);
      if (match) {
        var h = parseInt(match[1], 10);
        var m = parseInt(match[2], 10);
        var s = parseInt(match[3], 10);
        if (!isNaN(h) && !isNaN(m) && !isNaN(s)) {
          return h * 3600 + m * 60 + s;
        }
      }
      // Si c'est juste HH:MM:SS
      var parts = duree.split(':');
      if (parts.length === 3) {
        var h2 = parseInt(parts[0], 10);
        var m2 = parseInt(parts[1], 10);
        var s2 = parseInt(parts[2], 10);
        if (!isNaN(h2) && !isNaN(m2) && !isNaN(s2)) {
          return h2 * 3600 + m2 * 60 + s2;
        }
      }
    }
    return null;
  }

  var stats = [];
  function formatDate(d) {
    if (Object.prototype.toString.call(d) === '[object Date]') {
      var year = d.getFullYear();
      var month = (d.getMonth() + 1).toString().padStart(2, '0');
      var day = d.getDate().toString().padStart(2, '0');
      return `${day}/${month}/${year}`;
    }
    // Si déjà au format YYYY-MM-DD, convertir en DD/MM/YYYY
    if (typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d)) {
      var parts = d.split('-');
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return d;
  }
  for (var i = 1; i < parties.length; i++) {
    var row = parties[i];
    var seconds = dureeToSeconds(row[dureeIdx]);
    if (seconds === null) continue;
    // Récupérer l'URL réelle du smart chip (rich text)
    var linkCell = richLinks[i][lienIdx];
    var linkUrl = linkCell && linkCell.getLinkUrl ? linkCell.getLinkUrl() : '';
    stats.push({
      PartieID: row[partieIdIdx],
      Duree: row[dureeIdx],
      DureeSeconds: seconds,
      Date: formatDate(row[dateIdx]),
      LienVideo: linkUrl
    });
  }
  if (stats.length === 0) {
    return ContentService.createTextOutput(JSON.stringify({ error: 'No valid durations found' })).setMimeType(ContentService.MimeType.JSON);
  }

  // Moyenne
  var total = stats.reduce(function(sum, s) { return sum + s.DureeSeconds; }, 0);
  var avgSeconds = total / stats.length;
  function secondsToHHMMSS(sec) {
    var h = Math.floor(sec / 3600);
    var m = Math.floor((sec % 3600) / 60);
    var s = Math.round(sec % 60);
    return (h < 10 ? '0' : '') + h + ':' + (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
  }

  // Partie la plus courte
  var min = stats.reduce(function(a, b) { return a.DureeSeconds < b.DureeSeconds ? a : b; });
  // Partie la plus longue
  var max = stats.reduce(function(a, b) { return a.DureeSeconds > b.DureeSeconds ? a : b; });

  var result = {
    DureeMoyenne: secondsToHHMMSS(avgSeconds),
    TotalParties: stats.length,
    PartiePlusCourte: {
      PartieID: min.PartieID,
      Duree: secondsToHHMMSS(min.DureeSeconds),
      Date: min.Date,
      LienVideo: min.LienVideo
    },
    PartiePlusLongue: {
      PartieID: max.PartieID,
      Duree: secondsToHHMMSS(max.DureeSeconds),
      Date: max.Date,
      LienVideo: max.LienVideo
    }
  };
  return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
}