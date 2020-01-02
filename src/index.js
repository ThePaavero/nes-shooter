import PLAYGROUND from './lib/playground'
import Game from './Game'
import config from './config'

const playground = new PLAYGROUND.Application({

  width: config.width,
  height: config.height,
  scale: config.scale,

  // Don't need these, but leaving them commented for reference. Remember to remap these to your own methods (if you want to keep it abstracted).
  /*
  create: function() {
  },
  ready: function() {
  },
  resize: function() {
  },

  step: function(dt) {
  },
  render: function() {
  },

  keydown: function(data) {
  },
  keyup: function(data) {
  },

  mousedown: function(data) {
  },
  mouseup: function(data) {
  },
  mousemove: function(data) {
  },

  touchstart: function(data) {
  },
  touchend: function(data) {
  },
  touchmove: function(data) {
  },

  gamepaddown: function(data) {
  },
  gamepadup: function(data) {
  },
  gamepadmove: function(data) {
  }*/

})

Game(playground).init()
