var io = null;

var log = require('./log');
var game = require('./game');

function handleConnection(socket) {
  socket.on('game', function (gameId, cb) {
    if (!game.gameExists(gameId)) return;

    log.info('a team has joined: %s', gameId);
    socket.join(gameId);

    cb({
      level: game.getLevel(gameId),
      teams: null
    });
  });
}

exports.sendProgressTo = function (game, progress) {
  io.to(game).emit('progress', progress);
};

exports.sendReplayTo = function (game, replay) {
  log.info('sending replay to game %s', game);
  io.to(game).emit('replay', replay);
};

exports.setIo = function (instance) {
  if (io) {
    return;
  }
  io = instance;
  io.on('connection', handleConnection);
};
