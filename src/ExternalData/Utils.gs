function doGet(e) {
  var actionMap = {
    'playersWithColors': { key: 'playersWithColors', fn: getPlayersWithColorsRaw },
    'gameStats': { key: 'gameStats', fn: getGameDurationStatsRaw },
    'playerDetailedStats': { key: 'playerDetailedStats', fn: getPlayerDetailedStatsRaw },
    'sessionStats': { key: 'sessionStats', fn: getSessionStatsRaw }
  };
  
  var action = e.parameter.action;
  var actionData = actionMap[action];
  if (actionData) {
    return getCachedData(actionData.key, actionData.fn, 300);
  } else {
    return ContentService.createTextOutput('Invalid action - not found')
      .setMimeType(ContentService.MimeType.TEXT);
  }
}

// Fonction de test pour les statistiques par session
function test_doGet_sessionStats() {
  var cache = CacheService.getScriptCache();
  cache.remove('gameStats');
  var e = { parameter: { action: 'gameStats' } };
  var result = doGet(e);
  Logger.log(result.getContent());
  return result;
}

//Caching data
function getCachedData(cacheKey, generatorFn, cacheSeconds) {
  try {
    var cache = CacheService.getScriptCache();
    var cached = cache.get(cacheKey);
    
    if (cached) {
      return ContentService.createTextOutput(cached).setMimeType(ContentService.MimeType.JSON);
    }
    
    var result = generatorFn();
    cache.put(cacheKey, result, cacheSeconds);
    return ContentService.createTextOutput(result).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    Logger.log('Error in getCachedData: ' + error.message);
    return ContentService.createTextOutput(JSON.stringify({ error: error.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Récupère les statistiques par session de jeu
 * @return {string} JSON string contenant les statistiques par session
 */
function getSessionStatsRaw() {

  var playerEntriesInfo = getLycanSheetData(LYCAN_TABS.PARTICIPATIONS);
  var playerEntries = playerEntriesInfo.values;
  var playerColumnTitles = playerData[0];

  // Récupérer les participations pour compter le nombre de joueurs
  var matchRefColIdx = playerColumnTitles(playerColumnTitles, LYCAN_COLS.MATCH_ID);
  
  // Regrouper par date de session (clé = date)
  var sessionsLookup = {};
  playerMatches.forEach(function(match) {
    if (!sessionsLookup[match.SessionDate]) {
      sessionsLookup[match.SessionDate] = {
        SessionDate: match.SessionDate,
        MatchCount: 0,
        TotalPlayTime: 0,
        Matches: [],
        YouTubeLinks: []
      };
    }
    
    var currentSession = sessionsLookup[match.SessionDate];
    currentSession.MatchCount++;
    currentSession.TotalPlayTime += match.DurationSeconds;
    currentSession.Matches.push(match.MatchID);
    
    if (match.YouTubeLink && !currentSession.YouTubeLinks.includes(match.YouTubeLink)) {
      currentSession.YouTubeLinks.push(match.YouTubeLink);
    }
  });
  
  // Calculer nombre de joueurs par partie
  var matchPlayerCount = {};
  playerEntries.slice(1).forEach(function(entry) {
    var matchRef = entry[matchRefColIdx];
    if (!matchRef) return;
    
    if (!matchPlayerCount[matchRef]) {
      matchPlayerCount[matchRef] = 0;
    }
    matchPlayerCount[matchRef]++;
  });
  
  // Calculer les moyennes et préparer les résultats
  var playerSessions = [];
  Object.keys(sessionsLookup).forEach(function(dateKey) {
    var sessionGroup = sessionsLookup[dateKey];
    
    // Calculer le nombre moyen de joueurs par partie
    var totalPlayers = 0;
    sessionGroup.Matches.forEach(function(matchId) {
      totalPlayers += matchPlayerCount[matchId] || 0;
    });
    var avgPlayers = sessionGroup.MatchCount > 0 ? totalPlayers / sessionGroup.MatchCount : 0;
    
    // Formater les durées
    var avgDurationSecs = sessionGroup.MatchCount > 0 ? 
                          sessionGroup.TotalPlayTime / sessionGroup.MatchCount : 0;
    
    playerSessions.push({
      DateSession: sessionGroup.SessionDate,
      NombreParties: sessionGroup.MatchCount,
      DureeMoyenne: secondsTotalToTimeString(avgDurationSecs),
      TempsJeuTotal: secondsTotalToTimeString(sessionGroup.TotalPlayTime),
      JoueursMoyen: Math.round(avgPlayers * 10) / 10, // Arrondi à 1 décimale
      VideosYoutube: sessionGroup.YouTubeLinks,
      PartiesIDs: sessionGroup.Matches
    });
  });
  
  // Trier par date (plus récent en premier)
  playerSessions.sort(function(a, b) {
    var partsA = a.DateSession.split('/');
    var partsB = b.DateSession.split('/');
    
    var dateA = new Date(partsA[2], partsA[1] - 1, partsA[0]);
    var dateB = new Date(partsB[2], partsB[1] - 1, partsB[0]);
    
    return dateB - dateA;
  });
  
  return JSON.stringify(playerSessions);
}

/**
 * Récupère la liste des joueurs avec leurs couleurs
 * @return {string} JSON string contenant les joueurs et leurs couleurs
 */
function getPlayersWithColorsRaw() {
  var playerInfo = getLycanSheetData(LYCAN_TABS.PLAYERS);
  var playerData = playerInfo.values;
  var playerBackgrounds = playerInfo.backgrounds;
  var columnTitles = playerData[0];
  var joueurIdIdx = findColumnIndex(columnTitles, LYCAN_COLS.PLAYERID);
  var couleurIdx = findColumnIndex(columnTitles, LYCAN_COLS.COLOR);

  // Skip header row, map each player to their color and background color
  var players = playerData.slice(1).map((row, i) => ({
    JoueurID: row[joueurIdIdx],
    Couleur: row[couleurIdx],
    CouleurBackground: playerBackgrounds[i + 1][couleurIdx] // +1 to skip header row
  }));

  return JSON.stringify(players);
}


/**
 * Récupère des stats générales sur les parties
 * @return {string} JSON string contenant le nombre total de partie, la duree moyenne et les parties les plus courtes et longues
 */
// Calcule la durée moyenne, la partie la plus courte et la plus longue avec date et lien vidéo
function getGameDurationStatsRaw() {
  // Récupérer les données avec nos utilitaires
  var matchInfo = getLycanSheetData(LYCAN_TABS.MATCHES);
  var matchData = matchInfo.values;
  var columnTitles = matchData[0];
  
  // Utiliser notre fonction findColumnIndex
  var durationColIdx = findColumnIndex(columnTitles, LYCAN_COLS.TIMING);
  var dateColIdx = findColumnIndex(columnTitles, LYCAN_COLS.CALENDAR);
  var videoColIdx = findColumnIndex(columnTitles, LYCAN_COLS.YOUTUBE);
  var matchIdColIdx = findColumnIndex(columnTitles, LYCAN_COLS.MATCH_ID);

  var matchStats = [];
  for (var i = 1; i < matchData.length; i++) {
    var currentEntry = matchData[i];
    var durationInSeconds = chronoToTicks(currentEntry[durationColIdx]);
    if (durationInSeconds === null) continue;

    matchStats.push({
      PartieID: currentEntry[matchIdColIdx],
      Duree: currentEntry[durationColIdx],
      DureeSeconds: durationInSeconds,
      Date: formatLycanDate(currentEntry[dateColIdx]),
      LienVideo: currentEntry[videoColIdx]
    });
  }
  
  if (matchStats.length === 0) {
    return JSON.stringify({ error: 'Aucune durée valide trouvée' });
  }

  // Calculs de statistiques
  var totalDuration = matchStats.reduce(function(sum, match) { 
    return sum + match.DureeSeconds; 
  }, 0);
  
  var avgDuration = totalDuration / matchStats.length;
  
  // Trouver les extrêmes
  var shortestMatch = matchStats.reduce(function(a, b) { 
    return a.DureeSeconds < b.DureeSeconds ? a : b; 
  });
  
  var longestMatch = matchStats.reduce(function(a, b) { 
    return a.DureeSeconds > b.DureeSeconds ? a : b; 
  });

  // Formater le résultat
  var summaryData = {
    DureeMoyenne: ticksToChronoFormat(avgDuration),
    TotalParties: matchStats.length,
    PartiePlusCourte: {
      PartieID: shortestMatch.PartieID,
      Duree: ticksToChronoFormat(shortestMatch.DureeSeconds),
      Date: shortestMatch.Date,
      LienVideo: shortestMatch.LienVideo
    },
    PartiePlusLongue: {
      PartieID: longestMatch.PartieID,
      Duree: ticksToChronoFormat(longestMatch.DureeSeconds),
      Date: longestMatch.Date,
      LienVideo: longestMatch.LienVideo
    }
  };
  
  return JSON.stringify(summaryData);
}

/**
 * Récupère des stats détaillées sur les joueurs
 * @return {string} JSON string contenant les statistiques sur les taux de victoires, de morts, des rôles...
 */
function getPlayerDetailedStatsRaw() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var participationsSheet = ss.getSheetByName('Participations');
  var rolesSheet = ss.getSheetByName('Roles');

  // Récupération des données de participation
  var participations = participationsSheet.getDataRange().getValues();
  var participationHeaders = participations[0];
  var partieIdIdx = participationHeaders.indexOf('PartieID');
  var joueurIdIdx = participationHeaders.indexOf('JoueurID');
  var roleIdIdx = participationHeaders.indexOf('RoleID');
  var mortIdx = participationHeaders.indexOf('Mort');
  var resultatIdx = participationHeaders.indexOf('Resultat');
  var roleSecondaireIdx = participationHeaders.indexOf('RoleSecondaireID');

  // Récupération des données de rôles pour obtenir les types de victoire (camp)
  var roles = rolesSheet.getDataRange().getValues();
  var roleHeaders = roles[0];
  var roleIdIndex = roleHeaders.indexOf('RoleID');
  var typeVictoireIndex = roleHeaders.indexOf('TypeDeVictoire');

  // Créer un mapping des rôles vers leur type de victoire (camp)
  var roleToCamp = {};
  roles.slice(1).forEach(row => {
    if (row[roleIdIndex]) {
      roleToCamp[row[roleIdIndex]] = row[typeVictoireIndex] || 'Inconnu';
    }
  });

  // Calculer le nombre total de parties uniques
  var allPartieIDs = new Set(
    participations.slice(1)
      .map(row => row[partieIdIdx])
      .filter(id => id !== "" && id !== null && id !== undefined)
  );
  var totalGames = allPartieIDs.size;

  // Initialiser les stats par joueur
  var playerStats = {};

  // Traiter toutes les participations
  participations.slice(1).forEach(row => {
    var joueur = row[joueurIdIdx];
    var role = row[roleIdIdx];
    var roleSecondaire = row[roleSecondaireIdx];
    var mort = row[mortIdx] === 'OUI';
    var resultat = row[resultatIdx] === 'V';

    if (!joueur) return;

    // Initialiser les stats du joueur si première rencontre
    if (!playerStats[joueur]) {
      playerStats[joueur] = {
        JoueurID: joueur,
        TotalParties: 0,
        Victoires: 0,
        Defaites: 0,
        Survivant: 0,
        Mort: 0,
        Roles: {},
        RolesSecondaires: {},
        CampJoue: {},
        VictoireParCamp: {}
      };
    }

    // Mettre à jour les compteurs
    playerStats[joueur].TotalParties++;

    if (resultat) {
      playerStats[joueur].Victoires++;
    } else {
      playerStats[joueur].Defaites++;
    }

    if (mort) {
      playerStats[joueur].Mort++;
    } else {
      playerStats[joueur].Survivant++;
    }

    // Compter les rôles joués
    if (role) {
      if (!playerStats[joueur].Roles[role]) {
        playerStats[joueur].Roles[role] = 0;
      }
      playerStats[joueur].Roles[role]++;

      // Enregistrer le camp
      var camp = roleToCamp[role] || 'Inconnu';
      if (!playerStats[joueur].CampJoue[camp]) {
        playerStats[joueur].CampJoue[camp] = 0;
        playerStats[joueur].VictoireParCamp[camp] = 0;
      }
      playerStats[joueur].CampJoue[camp]++;
      if (resultat) {
        playerStats[joueur].VictoireParCamp[camp]++;
      }
    }

    // Compter les rôles secondaires
    if (roleSecondaire) {
      if (!playerStats[joueur].RolesSecondaires[roleSecondaire]) {
        playerStats[joueur].RolesSecondaires[roleSecondaire] = 0;
      }
      playerStats[joueur].RolesSecondaires[roleSecondaire]++;
    }
  });

  // Calculer les taux et formater le résultat final
  var result = Object.values(playerStats).map(player => {
    // Calculer les taux en pourcentage
    player.TauxVictoire = player.TotalParties > 0 ? (player.Victoires / player.TotalParties) : 0;
    player.TauxSurvie = player.TotalParties > 0 ? (player.Survivant / player.TotalParties) : 0;

    // Convertir les objets de comptage en tableaux pour faciliter l'utilisation côté client
    player.DistributionRoles = Object.entries(player.Roles).map(([role, count]) => ({
      RoleID: role,
      Count: count,
      Percentage: count / player.TotalParties
    })).sort((a, b) => b.Count - a.Count);

    player.DistributionRolesSecondaires = Object.entries(player.RolesSecondaires).map(([role, count]) => ({
      RoleID: role,
      Count: count,
      Percentage: count / player.TotalParties
    })).sort((a, b) => b.Count - a.Count);

    player.DistributionCamps = Object.entries(player.CampJoue).map(([camp, count]) => ({
      Camp: camp,
      Count: count,
      Percentage: count / player.TotalParties,
      Victoires: player.VictoireParCamp[camp] || 0,
      TauxVictoireCamp: player.VictoireParCamp[camp] ? (player.VictoireParCamp[camp] / count) : 0
    })).sort((a, b) => b.Count - a.Count);

    // Ajouter le nombre total de parties uniques
    player.TotalGames = totalGames;

    // Supprimer les objets originaux pour réduire la taille de la réponse
    delete player.Roles;
    delete player.RolesSecondaires;
    delete player.CampJoue;
    delete player.VictoireParCamp;

    return player;
  }).sort((a, b) => b.TauxVictoire - a.TauxVictoire);

  return JSON.stringify(result);
}