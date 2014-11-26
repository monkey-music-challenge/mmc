var compact = require('mout/array/compact');
var SpriteFactory = require('./SpriteFactory');

function Animator(options) {

  var tileWidth = options.tileWidth;
  var tileHeight = options.tileHeight;
  var tileOptions = {
    tileWidth: tileWidth,
    tileHeight: tileHeight
  };

  var onGoingInterpolations = [];
  var onGoingBubbleRemovals = [];
  var onGoingEffects = [];

  var effects = {
    fade: function (sprite, turnDuration, options) {
      var effectDuration = turnDuration * options.nTurns;
      var timeLeft = effectDuration / 2;

      var to = options.to;

      var fadeIn = function (timeSinceLastFrame) {
        if (timeLeft <= 0) {
          sprite.alpha = 1;
          return undefined;
        }

        var t = timeSinceLastFrame / effectDuration;
        sprite.alpha += t;

        timeLeft -= timeSinceLastFrame;
        return fadeIn;
      };

      var fadeOut = function (timeSinceLastFrame) {
        if (timeLeft <= 0) {
          timeLeft += effectDuration / 2;
          sprite.alpha = 0;

          sprite.position.x = (to.x + 1) * tileWidth;
          sprite.position.y = (to.y + 1) * tileHeight;
          return fadeIn;
        }

        var t = timeSinceLastFrame / effectDuration;
        sprite.alpha -= t;

        timeLeft -= timeSinceLastFrame;
        return fadeOut;
      };

      return fadeOut;
    },

    tween: function (sprite, turnDuration, options) {
      var effectDuration = turnDuration * options.nTurns;
      var timeLeft = effectDuration;

      var from = options.from;
      var to = options.to;

      var tween = function (timeSinceLastFrame) {
        if (timeLeft <= 0) {
          sprite.position.x = (to.x + 1) * tileWidth;
          sprite.position.y = (to.y + 1) * tileHeight;
          return undefined;
        }

        var t = timeSinceLastFrame / effectDuration;
        sprite.position.x -= (t * (from.x - to.x)) * tileWidth;
        sprite.position.y -= (t * (from.y - to.y)) * tileHeight;

        timeLeft -= timeSinceLastFrame;
        return tween;
      };

      return tween;
    },

    explode: function (sprite, turnDuration, options) {
      var effectDuration = turnDuration * options.nTurns;
      var timeLeft = effectDuration;
      var delayLeft = turnDuration * options.delayTurns;

      var explosionSprite = SpriteFactory.build('explosion', {
        tileWidth: tileWidth,
        tileHeight: tileHeight
      });

      // Make em big!
      explosionSprite.scale.x += explosionSprite.scale.x;
      explosionSprite.scale.y += explosionSprite.scale.y;
      explosionSprite.anchor.x = 0.25;
      explosionSprite.anchor.y = 0.25;

      // Pause animation
      explosionSprite.loop = false;
      explosionSprite.stop();

      var insert = function (timeSinceLastFrame) {
        delayLeft -= timeSinceLastFrame;

        if (delayLeft <= 0) {
          // Play animation
          explosionSprite.play();
          sprite.addChild(explosionSprite);

          return remove;
        }

        return insert;
      };

      var remove = function (timeSinceLastFrame) {
        timeLeft -= timeSinceLastFrame;

        if (timeLeft <= 0) {
          sprite.removeChild(explosionSprite);
          return undefined;
        }

        return remove;
      };

      return insert;
    },

    halt: function (sprite, turnDuration, options) {
      var effectDuration = turnDuration * options.nTurns;
      var timeLeft = effectDuration;
      var delayLeft = turnDuration * options.delayTurns;


      var halt = function (timeSinceLastFrame) {
        delayLeft -= timeSinceLastFrame;

        if (delayLeft <= 0) {
          // Stop monkey animation
          sprite.stop();

          // Stop headgear as well
          if (sprite.children[0]) {
            sprite.children[0].stop();
          }

          return resume;
        }

        return halt;
      };

      var resume = function (timeSinceLastFrame) {
        timeLeft -= timeSinceLastFrame;

        if (timeLeft <= 0) {
          sprite.play();

          // Start headgear as well
          if (sprite.children[0]) {
            sprite.children[0].play();
          }
          return undefined;
        }

        return resume;
      };

      return halt;
    }
  };

  var animateBubbleRemoval = function (timeSinceLastFrame, removal) {
    removal.timeLeft -= timeSinceLastFrame;
    var sprite = removal.sprite;

    if (removal.timeLeft <= 0) {
      if (sprite.parent) {
        sprite.parent.removeChild(sprite);
      }
      return null;
    }

    sprite.scale.x -= (timeSinceLastFrame / removal.duration) * removal.origScale;
    sprite.scale.y -= (timeSinceLastFrame / removal.duration) * removal.origScale;

    return removal;
  };

  this.addRemoval = function (removal) {
    onGoingBubbleRemovals.push(removal);
  };

  this.addInterpolation = function (interpolation) {
    onGoingInterpolations.push(interpolation);
  };

  this.update = function (timeSinceLastFrame) {

    var remainingEffects = onGoingEffects.map(function (handler) {
      return handler(timeSinceLastFrame);
    });
    onGoingEffects = compact(remainingEffects);

    var remainingRemovals = onGoingBubbleRemovals.map(
      animateBubbleRemoval.bind(null, timeSinceLastFrame));
    onGoingBubbleRemovals = compact(remainingRemovals);
  };

  var addEffect = this.addEffect = function (sprite, turnDuration, effect) {
    if (!effects[effect.type]) {
      return console.error('Tried to add missing effect ' + effect.type, effect);
    }

    var handler = effects[effect.type].apply(this, arguments);
    onGoingEffects.push(handler);
  };
}

module.exports = Animator;