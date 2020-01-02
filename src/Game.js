import state from './state'
import imagesArray from './images'
import config from './config'
import DebugView from './lib/DebugView'

const Game = (playground) => {

  const centers = {
    x: playground.width / 2,
    y: playground.height / 2,
  }

  let debugTickSkips = 10
  let debugTickCounter = 0

  const onReady = () => {
    centerPlayer()
  }

  const preloadAssets = () => {
    imagesArray.forEach(name => {
      playground.loadImage(name)
    })
  }

  const updateState = () => {
    state.player.x += state.player.velocities.x
    state.player.y += state.player.velocities.y
    updateDebugView()
    updateWeapons()
  }

  const updateWeapons = () => {
    console.log(state.player.weapons.find(w => w.name === 'Gun').triggerDown)
  }

  const updateDebugView = () => {
    if (!config.debugState) {
      return
    }
    debugTickCounter++
    if (debugTickCounter === debugTickSkips) {
      DebugView.update(state)
      debugTickCounter = 0
    }
  }

  const centerPlayer = () => {
    state.player.x = centers.x - state.player.width / 2
    state.player.y = centers.y - state.player.height / 2
  }

  const draw = () => {
    // Clear frame.
    playground.layer.clear('#000')

    // Draw player.
    playground.layer.drawImage(playground.images.playerShip, state.player.x, state.player.y, state.player.width, state.player.height)

    // playground.layer.drawImage(playground.images.scanlines, 0, 0, playground.width, playground.height+1)
    var pattern = playground.layer.context.createPattern(playground.images.scanlinePattern, 'repeat')
    playground.layer.context.fillStyle = pattern
    playground.layer.context.fillRect(0, 0, playground.width, playground.height)
  }

  const onKeyUp = (data) => {
    switch (data.key) {
      case 'left':
        if (state.player.velocities.x < 0) {
          state.player.velocities.x = 0
        }
        break
      case 'right':
        if (state.player.velocities.x > 0) {
          state.player.velocities.x = 0
        }
        break
      case 'up':
        if (state.player.velocities.y < 0) {
          state.player.velocities.y = 0
        }
        break
      case 'down':
        if (state.player.velocities.y > 0) {
          state.player.velocities.y = 0
        }
        break
      case 'comma':
        state.player.weapons.find(w => w.name === 'Gun').triggerDown = false
        break
    }
  }

  const onKeyDown = (data) => {
    // console.log(data.key)
    switch (data.key) {
      case 'left':
        state.player.velocities.x = state.player.speed * -1
        break
      case 'right':
        state.player.velocities.x = state.player.speed
        break
      case 'up':
        state.player.velocities.y = state.player.speed * -1
        break
      case 'down':
        state.player.velocities.y = state.player.speed
        break
      case 'comma':
        state.player.weapons.find(w => w.name === 'Gun').triggerDown = true
        break
    }
  }

  const init = () => {
    // Abstract playground methods.
    playground.create = preloadAssets
    playground.ready = onReady
    playground.render = draw
    playground.step = updateState
    playground.keyup = onKeyUp
    playground.keydown = onKeyDown
  }

  return {
    init
  }
}

export default Game
