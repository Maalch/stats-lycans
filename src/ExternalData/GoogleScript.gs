function doGet(e) {
  var actionMap = {
    'playersWithColors': { key: 'playersWithColors', fn: getPlayersWithColorsRaw },
    'gameStats': { key: 'gameStats', fn: getGameDurationStatsRaw },
    'playerDetailedStats': { key: 'playerDetailedStats', fn: getPlayerDetailedStatsRaw },
    'sessionStats': { key: 'sessionStats', fn: getSessionStatsRaw },
    'playerStatsBySession': { key: 'playerStatsBySession', fn: getPlayerStatsBySessionRaw }
  };
  
  var action = e.parameter.action;
  var actionData = actionMap[action];
  if (actionData) {
    return getCachedData(actionData.key, actionData.fn, 300, e);
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

// Fonction de test pour les statistiques des joueurs par session
function test_doGet_playerStatsBySession() {
  var cache = CacheService.getScriptCache();
  // Clear the cache for this endpoint
  cache.remove('playerStatsBySession');
  
  // You need to provide a valid date that exists in your data
  // Format should match your data (e.g., "DD/MM/YYYY")
  var sessionDate = "18/07/2025"; // Replace with a real session date from your data
  
  var e = { 
    parameter: { 
      action: 'playerStatsBySession',
      sessionDate: sessionDate
    } 
  };
  
  var result = doGet(e);
  Logger.log("Test playerStatsBySession for date: " + sessionDate);
  Logger.log(result.getContent());
  return result;
}

//Caching data
function getCachedData(cacheKey, generatorFn, cacheSeconds, e) {
  try {
    var cache = CacheService.getScriptCache();
    var cached = cache.get(cacheKey);
    
    if (cached) {
      return ContentService.createTextOutput(cached).setMimeType(ContentService.MimeType.JSON);
    }
    
    var result = generatorFn(e);
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
  // Get participation data to count players per match
  var gameEntryData = getLycanSheetData(LYCAN_TABS.PARTICIPATIONS);
  var playerEntries = gameEntryData.values;
  var playerColumnTitles = playerEntries[0];
  var matchRefColIdx = findColumnIndex(playerColumnTitles, LYCAN_COLS.MATCH_ID);
  
  // Get match data (with dates, durations, etc.)
  var gameInfo = getLycanSheetData(LYCAN_TABS.MATCHES);
  var gameData = gameInfo.values;
  var gameHeaders = gameData[0];
  var gameIdColIdx = findColumnIndex(gameHeaders, LYCAN_COLS.MATCH_ID);
  var dateColIdx = findColumnIndex(gameHeaders, LYCAN_COLS.CALENDAR);
  var durationColIdx = findColumnIndex(gameHeaders, LYCAN_COLS.TIMING);
  var videoColIdx = findColumnIndex(gameHeaders, LYCAN_COLS.YOUTUBE);
  var versionColIdx = findColumnIndex(gameHeaders, LYCAN_COLS.VERSION);
  
  // Process match data to create objects with needed properties
  var lycansMatches = [];
  for (var i = 1; i < gameData.length; i++) {
    var currentMatch = gameData[i];
    var matchId = currentMatch[gameIdColIdx];
    var matchDate = formatLycanDate(currentMatch[dateColIdx]);
    var durationSec = chronoToTicks(currentMatch[durationColIdx]);
    var videoLink = currentMatch[videoColIdx];
    var version = currentMatch[versionColIdx];
    
    if (!matchId || !matchDate || durationSec === null) continue;
    
    lycansMatches.push({
      MatchID: matchId,
      SessionDate: matchDate,
      DurationSeconds: durationSec,
      YouTubeLinkWithTimeStamp: videoLink,
      YouTubeLink: videoLink,
      Version: version
    });
  }
  
  // Helper to clean YouTube link (remove timestamp)
  function cleanYouTubeLink(url) {
    if (!url) return '';
    // Remove ?t= or &t= and everything after
    // For youtu.be
    url = url.replace(/\?t=\d+$/, '');
    url = url.replace(/&t=\d+s?$/, '');
    // For www.youtube.com
    url = url.replace(/(\?|&)t=\d+s?/, '');
    // Remove trailing ? if left
    url = url.replace(/\?$/, '');
    return url;
  }

  // Group matches by session date
  var sessionsLookup = {};
  lycansMatches.forEach(function(match) {
    if (!sessionsLookup[match.SessionDate]) {
      sessionsLookup[match.SessionDate] = {
        SessionDate: match.SessionDate,
        MatchCount: 0,
        TotalPlayTime: 0,
        Matches: [],
        YouTubeLinksWithTimeStamp: [],
        YouTubeLinks: [],
        Versions: []
      };
    }
    
    var currentSession = sessionsLookup[match.SessionDate];
    currentSession.MatchCount++;
    currentSession.TotalPlayTime += match.DurationSeconds;
    currentSession.Matches.push(match.MatchID);
    
    // Add full video link (with timestamp)
    if (match.YouTubeLinkWithTimeStamp && !currentSession.YouTubeLinksWithTimeStamp.includes(match.YouTubeLinkWithTimeStamp)) {
      currentSession.YouTubeLinksWithTimeStamp.push(match.YouTubeLinkWithTimeStamp);
    }

    // Add cleaned video link (without timestamp)
    var cleanedLink = cleanYouTubeLink(match.YouTubeLinkWithTimeStamp);
    if (cleanedLink && !currentSession.YouTubeLinks.includes(cleanedLink)) {
      currentSession.YouTubeLinks.push(cleanedLink);
    }

    if (match.Version && !currentSession.Versions.includes(match.Version)) {
      currentSession.Versions.push(match.Version);
    }
  });
  
  // Count players per match
  var matchPlayerCount = {};
  playerEntries.slice(1).forEach(function(entry) {
    var matchRef = entry[matchRefColIdx];
    if (!matchRef) return;
    
    if (!matchPlayerCount[matchRef]) {
      matchPlayerCount[matchRef] = 0;
    }
    matchPlayerCount[matchRef]++;
  });
  
  // Calculate averages and prepare results
  var sessionStats = [];
  Object.keys(sessionsLookup).forEach(function(dateKey) {
    var sessionGroup = sessionsLookup[dateKey];
    
    // Calculate average players per match
    var totalPlayers = 0;
    sessionGroup.Matches.forEach(function(matchId) {
      totalPlayers += matchPlayerCount[matchId] || 0;
    });
    var avgPlayers = sessionGroup.MatchCount > 0 ? totalPlayers / sessionGroup.MatchCount : 0;
    
    // Format durations
    var avgDurationSecs = sessionGroup.MatchCount > 0 ? 
                          sessionGroup.TotalPlayTime / sessionGroup.MatchCount : 0;
    
    sessionStats.push({
      DateSession: sessionGroup.SessionDate,
      NombreParties: sessionGroup.MatchCount,
      DureeMoyenne: ticksToChronoFormat(avgDurationSecs),
      TempsJeuTotal: ticksToChronoFormat(sessionGroup.TotalPlayTime),
      JoueursMoyen: Math.round(avgPlayers * 10) / 10, // Round to 1 decimal
      VideosYoutubeAvecTemps: sessionGroup.YouTubeLinksWithTimeStamp,
      VideosYoutube: sessionGroup.YouTubeLinks,
      Versions: sessionGroup.Versions,
      PartiesIDs: sessionGroup.Matches
    });
  });
  
  // Sort by date (most recent first)
  sessionStats.sort(function(a, b) {
    var partsA = a.DateSession.split('/');
    var partsB = b.DateSession.split('/');
    
    var dateA = new Date(partsA[2], partsA[1] - 1, partsA[0]);
    var dateB = new Date(partsB[2], partsB[1] - 1, partsB[0]);
    
    return dateB - dateA;
  });
  
  return JSON.stringify(sessionStats);
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

  // Récupérer les données avec nos utilitaires
  var participationInfo = getLycanSheetData(LYCAN_TABS.PARTICIPATIONS);
  var participationData = participationInfo.values;
  var participationHeaders = participationData[0];
  
  // Utiliser notre fonction findColumnIndex
  var partieIdIdx = findColumnIndex(participationHeaders, LYCAN_COLS.MATCH_ID);
  var joueurIdIdx = findColumnIndex(participationHeaders, LYCAN_COLS.PLAYERID);
  var roleIdIdx = findColumnIndex(participationHeaders, LYCAN_COLS.ROLEID);
  var mortIdx = findColumnIndex(participationHeaders, LYCAN_COLS.DEATH);
  var mortRaisonIdx = findColumnIndex(participationHeaders, LYCAN_COLS.DEATHCAUSE);
  var mortTimingIdx = findColumnIndex(participationHeaders, LYCAN_COLS.DEATHTIMING);
  var resultatIdx = findColumnIndex(participationHeaders, LYCAN_COLS.VICTORY);
  var roleSecondaireIdx = findColumnIndex(participationHeaders, LYCAN_COLS.SECONDARY_ROLE);

  // Récupération des données de rôles pour obtenir les types de victoire (camp)
  var rolesInfo = getLycanSheetData(LYCAN_TABS.ROLES);
  var rolesData = rolesInfo.values;
  var roleHeaders = rolesData[0];
  var roleIdIndex = findColumnIndex(roleHeaders, LYCAN_COLS.ROLEID);
  var typeVictoireIndex = findColumnIndex(roleHeaders, LYCAN_COLS.VICTORY_TYPE);

  // Créer un mapping des rôles vers leur type de victoire (camp)
  var roleToCamp = {};
  rolesData.slice(1).forEach(row => {
    if (row[roleIdIndex]) {
      roleToCamp[row[roleIdIndex]] = row[typeVictoireIndex] || 'Inconnu';
    }
  });

  // Calculer le nombre total de parties uniques
  var allPartieIDs = new Set(
    participationData.slice(1)
      .map(row => row[partieIdIdx])
      .filter(id => id !== "" && id !== null && id !== undefined)
  );
  var totalGames = allPartieIDs.size;

  // Initialiser les stats par joueur
  var playerStats = {};

  // Traiter toutes les participations
  participationData.slice(1).forEach(row => {
    var joueur = row[joueurIdIdx];
    var role = row[roleIdIdx];
    var roleSecondaire = row[roleSecondaireIdx];
    var mort = row[mortIdx] === 'OUI';
    var mortRaison = row[mortRaisonIdx];
    var mortTiming = row[mortTimingIdx];
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
        MortRaisons: {},
        MortTimings: {},
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

    if (mortRaison)
    {
       if (!playerStats[joueur].MortRaisons[mortRaison]) {
        playerStats[joueur].MortRaisons[mortRaison] = 0;
      }
      playerStats[joueur].MortRaisons[mortRaison]++;     
    }

    if (mortTiming)
    {
       if (!playerStats[joueur].MortTimings[mortTiming]) {
        playerStats[joueur].MortTimings[mortTiming] = 0;
      }
      playerStats[joueur].MortTimings[mortTiming]++;     
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

    player.DistributionMortTiming = Object.entries(player.MortTimings).map(([mortTiming, count]) => {
      // Parse the timing format (J1, N2, C3, etc.)
      let timingType = '';
      let timingDay = 0;
      let fullTimingName = mortTiming;
      
      if (mortTiming) {
        // Extract type (first character) and day number
        const typeChar = mortTiming.charAt(0);
        const dayNum = parseInt(mortTiming.substring(1), 10);
        
        // Map the timing type
        switch (typeChar) {
          case 'J':
            timingType = 'Jour';
            break;
          case 'N':
            timingType = 'Nuit';
            break;
          case 'C':
            timingType = 'Conseil';
            break;
          default:
            timingType = 'Autre';
        }
        
        // Set the day number if valid
        if (!isNaN(dayNum)) {
          timingDay = dayNum;
        }
        
        // Create the full descriptive name
        fullTimingName = `${timingType} ${timingDay}`;
      }
      
      return {
        MortTiming: fullTimingName,         // "Jour 1" (Full descriptive name)
        TimingType: timingType,             // "Jour" (Category)
        TimingDay: timingDay,               // 1 (Numeric day)
        Count: count,
        Percentage: count / player.TotalParties
      };
    }).sort((a, b) => b.Count - a.Count);

      player.DistributionMortRaisons = Object.entries(player.MortRaisons).map(([mortRaison, count]) => ({
      MortRaison: mortRaison,
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

/**
 * Récupère des stats détaillées sur les sessions
 * @return {string} JSON string contenant les statistiques d'une session (par date)
 */
function getPlayerStatsBySessionRaw(e) {
  var sessionDate = e.parameter.sessionDate;
  if (!sessionDate) {
    return JSON.stringify({ error: 'Session date parameter required' });
  }
  
  // Get all matches for this session
  var gameInfo = getLycanSheetData(LYCAN_TABS.MATCHES);
  var gameData = gameInfo.values;
  var gameHeaders = gameData[0];
  var gameIdColIdx = findColumnIndex(gameHeaders, LYCAN_COLS.MATCH_ID);
  var dateColIdx = findColumnIndex(gameHeaders, LYCAN_COLS.CALENDAR);
  
  // Filter matches by session date
  var sessionMatchIDs = [];
  for (var i = 1; i < gameData.length; i++) {
    var currentMatch = gameData[i];
    var matchDate = formatLycanDate(currentMatch[dateColIdx]);
    var matchId = currentMatch[gameIdColIdx];
    
    if (matchDate === sessionDate && matchId) {
      sessionMatchIDs.push(matchId);
    }
  }
  
  // Get player participation data for these matches
  var participationInfo = getLycanSheetData(LYCAN_TABS.PARTICIPATIONS);
  var participationData = participationInfo.values;
  var participationHeaders = participationData[0];
  var partieIdIdx = findColumnIndex(participationHeaders, LYCAN_COLS.MATCH_ID);
  var joueurIdIdx = findColumnIndex(participationHeaders, LYCAN_COLS.PLAYERID);
  var roleIdIdx = findColumnIndex(participationHeaders, LYCAN_COLS.ROLEID);
  var mortIdx = findColumnIndex(participationHeaders, LYCAN_COLS.DEATH);
  var resultatIdx = findColumnIndex(participationHeaders, LYCAN_COLS.VICTORY);

  // Get role data to map role IDs to role names
  var rolesInfo = getLycanSheetData(LYCAN_TABS.ROLES);
  var rolesData = rolesInfo.values;
  var rolesHeaders = rolesData[0];
  var roleIdColIdx = findColumnIndex(rolesHeaders, LYCAN_COLS.ROLEID);
  var roleNameColIdx = findColumnIndex(rolesHeaders, LYCAN_COLS.ROLENAME);
  
  // Create a mapping from role IDs to role names
  var roleIdToName = {};
  for (var i = 1; i < rolesData.length; i++) {
    var roleRow = rolesData[i];
    var roleId = roleRow[roleIdColIdx];
    var roleName = roleRow[roleNameColIdx];
    
    if (roleId) {
      roleIdToName[roleId] = roleName || roleId;
    }
  }
  
  // Process player stats for this session
  var playerSessionStats = {};
  
  participationData.slice(1).forEach(row => {
    var matchId = row[partieIdIdx];
    // Skip if this participation is not from our session
    if (!sessionMatchIDs.includes(matchId)) return;
    
    var joueur = row[joueurIdIdx];
    var role = row[roleIdIdx];
    var mort = row[mortIdx] === 'OUI';
    var resultat = row[resultatIdx] === 'V';
    
    if (!joueur) return;
    
    // Initialize player stats if needed
    if (!playerSessionStats[joueur]) {
      playerSessionStats[joueur] = {
        JoueurID: joueur,
        PartiesSession: 0,
        VictoiresSession: 0,
        DefaitesSession: 0,
        SurvivantSession: 0,
        MortSession: 0,
        RolesSession: {}
      };
    }
    
    // Update counters
    playerSessionStats[joueur].PartiesSession++;
    
    if (resultat) {
      playerSessionStats[joueur].VictoiresSession++;
    } else {
      playerSessionStats[joueur].DefaitesSession++;
    }
    
    if (mort) {
      playerSessionStats[joueur].MortSession++;
    } else {
      playerSessionStats[joueur].SurvivantSession++;
    }
    
    // Count roles
    if (role) {
      if (!playerSessionStats[joueur].RolesSession[role]) {
        playerSessionStats[joueur].RolesSession[role] = 0;
      }
      playerSessionStats[joueur].RolesSession[role]++;
    }
  });
  
  // Calculate rates and format for output
  var result = Object.values(playerSessionStats).map(player => {
    // Calculate percentage rates
    player.TauxVictoireSession = player.PartiesSession > 0 ? 
      (player.VictoiresSession / player.PartiesSession) : 0;
    player.TauxSurvieSession = player.PartiesSession > 0 ? 
      (player.SurvivantSession / player.PartiesSession) : 0;
    
    // Convert role counts to array for easier frontend use with role names
    player.DistributionRolesSession = Object.entries(player.RolesSession).map(([roleId, count]) => ({
      RoleID: roleId, // Keep the original roleId (e.g., "ChasseurDePrime")
      RoleName: roleIdToName[roleId] || roleId, // Use the name (e.g., "Chasseur de Prime") if available
      Count: count,
      Percentage: count / player.PartiesSession
    })).sort((a, b) => b.Count - a.Count);
    
    // Remove the original object to reduce response size
    delete player.RolesSession;
    
    return player;
  });
  
  return JSON.stringify(result);
}