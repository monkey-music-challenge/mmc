var MOVE_TIMEOUT = 600;
var GAME_RESTART_TIMEOUT = MOVE_TIMEOUT + 10;

var monkeyMusic = require('monkey-music');
var Scene = require('./Scene');
var tileMap = require('./tilemap.json');
var GUI = require('./gui');
var replay = require('./replay');
var bosses = require('./../../bosses.json');

var teamColors = [
  // Red
  0xFF0000,
  // Blue
  0x0000CC,
  // Green
  0x00FF00
  // TODO Violet
];

var gameContainer = document.querySelector('#game-container');
var sceneWidth = getMaxGameSize();
var sceneHeight = getMaxGameSize();
var scene = new Scene({
  size: { x: sceneWidth, y: sceneHeight },
  backgroundColor: 0x83d135,
  el: gameContainer,
  tileMap: tileMap
});

var runningGame = null;

function getMaxGameSize() {
  // Chrome will produce glitches if we don't make sure to
  // use a resolution that is a power of 2
  var windowSize = Math.min(window.innerWidth, window.innerHeight);
  return windowSize;
}

function displayLevel(info, cb) {
  if (!info || !info.level) {
    throw new Error('Missing level info, failed to display it');
  }

  // Don't mess with a running game. This is
  // only for displaying a static scene anyways
  if (runningGame) return;

  var level = info.level;
  var dummyGame = monkeyMusic.createGameState(['glenn'], level);
  var dummyPlayerState = monkeyMusic.gameStateForTeam(dummyGame, 'glenn');
  scene.onReady(function () {
    scene
      .setLevelLayout(level.layout)
      .parseLayout(dummyPlayerState.layout, []);

    gameContainer.classList.add('ready');

    // Allow for callbacks
    if (cb && typeof cb === 'function') {
      cb();
    }
  });
}

function getMonkeyDetails(state, teamNumber) {
  // Load special boss-headgear for bosses, if they have one
  var headgear = 'headphones';
  if (bosses[state.teamName] !== undefined &&
      bosses[state.teamName].headgear !== undefined) {

    headgear = bosses[state.teamName].headgear;
  }

  return {
    x: state.position[1],
    y: state.position[0],
    id: state.teamName,
    headgear: headgear,
    color: state.color !== undefined ?
      state.color : teamColors[teamNumber]
  };
}

function displayReplay(game) {
  if (runningGame) {
    clearInterval(runningGame);
    runningGame = null;

    GUI.setStatus('Loading new game', true);
    return setTimeout(function () {
      // By faking a reloading time we can
      // wait for the animations to finish
      // and therefore reduce flickering in
      // the scene when restarting during a
      // playing game.
      displayReplay(game);
    }, GAME_RESTART_TIMEOUT);
  }

  GUI.setStatus('preparing');

  var rewindedReplay = replay.prepare(game.teams, game.turns, game.level);
  var statesForPlayer = rewindedReplay.statesForPlayer;
  var interpolations = rewindedReplay.interpolations;

  // Kick of with the first static layout
  var initialStates = statesForPlayer[0];
  var initialPositions = initialStates.map(getMonkeyDetails);
  scene.parseLayout(initialStates[0].layout, initialPositions);

  GUI.setStatus('playing');

  var iTurn = 0;
  runningGame = setInterval(function () {
    var interpolation = interpolations[iTurn];

    // Interpolate moves until we've run out of them
    if (!interpolation) {
      // Stop looping
      clearInterval(runningGame);
      runningGame = null;

      // Update GUI
      GUI.setStatus('Game Over', true);
      return;
    }

    scene.interpolate(interpolation, MOVE_TIMEOUT);
    iTurn++;
  }, MOVE_TIMEOUT);
}

exports.displayLevel = displayLevel;
exports.displayReplay = displayReplay;
