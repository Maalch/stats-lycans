/**
 * @fileoverview Fonctions utilitaires réutilisables pour les statistiques Lycans
 */

// Constants pour les noms de feuilles
const LYCAN_TABS = {
  MATCHES: 'Parties',
  PARTICIPATIONS: 'Participations',
  PLAYERS: 'Joueurs',
  ROLES: 'Roles',
  SECONDARYROLES: 'Roles Secondaires'
};

// Constants pour les noms de colonnes
const LYCAN_COLS = {
  MATCH_ID: 'PartieID',
  TIMING: 'Duree',
  CALENDAR: 'Date',
  YOUTUBE: 'LienVideo',
  MAPTYPE: 'Carte',
  PLAYERID: 'JoueurID',
  COLOR: 'Couleur',
  ROLEID: 'RoleID',
  ROLENAME: 'NomDuRole',
  VICTORY_TYPE: 'TypeDeVictoire',
  SECONDARY_ROLE: 'RoleSecondaireID',
  SECONDARY_ROLE_NAME: 'NomDuRoleSecondaire',
  DEATH: 'Mort',
  DEATHCAUSE: 'CauseMort',
  DEATHBY: 'JoueurTuePar',
  DEATHTIMING: 'TimingMort',
  VICTORY: 'Resultat'
};

/**
 * Convertit un format de temps en secondes
 * @param {Date|string} chronoVal - Valeur de temps à convertir
 * @return {number|null} Nombre de secondes ou null si invalide
 */
function chronoToTicks(chronoVal) {
  if (!chronoVal) return null;
  
  // Si c'est un objet Date
  if (Object.prototype.toString.call(chronoVal) === '[object Date]') {
    return chronoVal.getHours() * 3600 + chronoVal.getMinutes() * 60 + chronoVal.getSeconds();
  }
  
  // Si c'est une chaîne avec format heures:minutes:secondes
  if (typeof chronoVal === 'string') {
    var timeSections = chronoVal.match(/(\d{2}):(\d{2}):(\d{2})/);
    if (timeSections) {
      var hoursSegment = parseInt(timeSections[1], 10);
      var minutesSegment = parseInt(timeSections[2], 10);
      var secondsSegment = parseInt(timeSections[3], 10);
      if (!isNaN(hoursSegment) && !isNaN(minutesSegment) && !isNaN(secondsSegment)) {
        return hoursSegment * 3600 + minutesSegment * 60 + secondsSegment;
      }
    }
    
    // Format direct HH:MM:SS
    var clockParts = chronoVal.split(':');
    if (clockParts.length === 3) {
      var hrValue = parseInt(clockParts[0], 10);
      var minValue = parseInt(clockParts[1], 10);
      var secValue = parseInt(clockParts[2], 10);
      if (!isNaN(hrValue) && !isNaN(minValue) && !isNaN(secValue)) {
        return hrValue * 3600 + minValue * 60 + secValue;
      }
    }
  }
  return null;
}

/**
 * Convertit des secondes en format de temps lisible (HH:MM:SS)
 * @param {number} ticksValue - Nombre total de secondes
 * @return {string} Temps formaté en HH:MM:SS
 */
function ticksToChronoFormat(ticksValue) {
  var hrPortion = Math.floor(ticksValue / 3600);
  var minPortion = Math.floor((ticksValue % 3600) / 60);
  var secPortion = Math.round(ticksValue % 60);
  return (hrPortion < 10 ? '0' : '') + hrPortion + ':' + 
         (minPortion < 10 ? '0' : '') + minPortion + ':' + 
         (secPortion < 10 ? '0' : '') + secPortion;
}

/**
 * Formate une date en format DD/MM/YYYY
 * @param {Date|string} calendarEntry - Date à formater
 * @return {string} Date formatée
 */
function formatLycanDate(calendarEntry) {
  if (Object.prototype.toString.call(calendarEntry) === '[object Date]') {
    var fullYear = calendarEntry.getFullYear();
    var monthNum = (calendarEntry.getMonth() + 1).toString().padStart(2, '0');
    var dayNum = calendarEntry.getDate().toString().padStart(2, '0');
    return `${dayNum}/${monthNum}/${fullYear}`;
  }
  
  // Conversion format YYYY-DD-MM en DD/MM/YYYY
  if (typeof calendarEntry === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(calendarEntry)) {
    var datePieces = calendarEntry.split('-');
    return `${datePieces[1]}/${datePieces[2]}/${datePieces[0]}`;
  }
  
  return calendarEntry;
}

/**
 * Récupère les données d'une feuille avec les différents formats
 * @param {string} tabName - Nom de la feuille
 * @return {Object} Données de la feuille (values, backgrounds)
 */
function getLycanSheetData(tabName) {
  var lycanDoc = SpreadsheetApp.getActiveSpreadsheet();
  var targetSheet = lycanDoc.getSheetByName(tabName);
  var dataRange = targetSheet.getDataRange();
  
  return {
    values: dataRange.getValues(),
    backgrounds: dataRange.getBackgrounds()
  };
}

/**
 * Trouve l'index d'une colonne par son nom
 * @param {Array} headerRow - Ligne d'en-tête avec les noms de colonnes
 * @param {string} columnName - Nom de la colonne à trouver
 * @return {number} Index de la colonne (-1 si non trouvée)
 */
function findColumnIndex(headerRow, columnName) {
  return headerRow.indexOf(columnName);
}