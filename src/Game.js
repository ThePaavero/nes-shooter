import state from './state'
import imagesArray from './images'
import config from './config'
import DebugView from './lib/DebugView'
import _ from 'lodash'

const Game = (playground) => {

  const centers = {
    x: playground.width / 2,
    y: playground.height / 2,
  }

  let debugTickSkips = 10
  let debugTickCounter = 0

  const onReady = () => {
    centerPlayer()
    createStars()
  }

  const createStars = () => {
    let amount = 60
    while (amount--) {
      state.stars.push({
        x: _.random(0, playground.width),
        y: _.random(0, playground.height),
        image: playground.images[`${_.random(0, 3) === 0 ? 'big' : 'small'}Star`],
      })
    }
  }

  const preloadAssets = () => {
    imagesArray.forEach(name => {
      playground.loadImage(name)
    })
  }

  const keepWithinArea = (actor) => {
    if (actor.x < 0) {
      actor.x = 0
    } else if (actor.x > playground.width - actor.width) {
      actor.x = playground.width - actor.width
    }

    if (actor.y < 0) {
      actor.y = 0
    } else if (actor.y > playground.height - actor.height) {
      actor.y = playground.height - actor.height
    }
  }

  const updatePlayer = () => {
    state.player.x += state.player.velocities.x
    state.player.y += state.player.velocities.y

    keepWithinArea(state.player)
  }

  const updateState = () => {
    updatePlayer()
    updateStars()
    updateDebugView()
    updateWeapons()
    updateProjectiles()
  }

  const getWeaponObject = (weaponName) => {
    return state.player.weapons.find(w => w.name === weaponName)
  }

  const getCurrentMs = () => {
    return Date.now()
  }

  const okToFireProjectile = (weaponName) => {
    const weapon = getWeaponObject(weaponName)
    return getCurrentMs() - weapon.lastShotTimestamp > weapon.millisecondsBetweenProjectiles
  }

  const fireProjectile = (weaponName) => {
    const weapon = getWeaponObject(weaponName)
    weapon.lastShotTimestamp = getCurrentMs()
    const y = state.player.y + 10
    weapon.projectiles.push({
      x: (state.player.x + 3) - (weapon.projectileWidth / 2),
      y,
      width: weapon.projectileWidth,
      height: weapon.projectileHeight,
      speed: weapon.speed,
    })
    weapon.projectiles.push({
      x: state.player.x + state.player.width - 3 - (weapon.projectileWidth / 2),
      y,
      width: weapon.projectileWidth,
      height: weapon.projectileHeight,
      speed: weapon.speed,
    })
  }

  const updateWeapons = () => {
    state.player.weapons.forEach(weapon => {
      if (weapon.triggerDown && okToFireProjectile(weapon.name)) {
        fireProjectile(weapon.name)
      }
    })
  }

  const updateProjectiles = () => {
    state.player.weapons.forEach(weapon => {
      weapon.projectiles.forEach(projectile => {
        projectile.y -= projectile.speed
      })
    })
  }

  const updateStars = () => {
    state.stars.forEach(star => {
      star.y += state.gameSpeed
      if (star.y > playground.height) {
        star.y = _.random(10, 100) * -1
      }
    })
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

  const drawProjectiles = () => {
    state.player.weapons.forEach(weapon => {
      weapon.projectiles.forEach(projectile => {
        playground.layer.drawImage(playground.images[weapon.imageSlug], projectile.x, projectile.y, projectile.width, projectile.height)
      })
    })
  }

  const drawStars = () => {
    state.stars.forEach(star => {
      playground.layer.drawImage(star.image, star.x, star.y)
    })
  }

  const centerPlayer = () => {
    state.player.x = centers.x - state.player.width / 2
    state.player.y = playground.height - 50
  }

  const drawScanlines = () => {
    playground.layer.context.fillStyle = playground.layer.context.createPattern(playground.images.scanlinePattern, 'repeat')
    playground.layer.context.fillRect(0, 0, playground.width, playground.height)
  }

  const draw = () => {
    // Clear frame.
    playground.layer.clear('#000')

    drawStars()

    // Draw player.
    playground.layer.drawImage(playground.images.playerShip, state.player.x, state.player.y, state.player.width, state.player.height)

    drawProjectiles()
    drawScanlines()
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
      case 'period':
        state.player.weapons.find(w => w.name === 'Cannon').triggerDown = false
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
      case 'period':
        state.player.weapons.find(w => w.name === 'Cannon').triggerDown = true
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
