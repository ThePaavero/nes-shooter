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
    spawnEnemy()
  }

  const spawnEnemy = () => {
    const enemyType = 'BlueHeavy'
    const enemyDimensions = {
      width: 33,
      height: 24,
    }
    const imageSlug = `enemy${enemyType}`
    const image = playground.images[imageSlug]
    const imageHit = playground.images[imageSlug + 'Hit']
    const enemy = {
      x: _.random(0, playground.width - enemyDimensions.width),
      y: enemyDimensions.height * -1,
      image,
      imageHit,
      width: enemyDimensions.width,
      height: enemyDimensions.height,
      health: 1,
    }
    state.enemies.push(enemy)

    // Movement with tweens.
    const easing = 'inOutExpo'
    const duration = 5

    const minX = -20
    const maxX = (playground.width + 20) - enemy.width
    const minY = -10

    const tween = playground.tween(enemy)
      .to({
        x: _.random(minX, maxX),
        y: _.random(minY, playground.height / 2),
      }, duration, easing)
      .to({
        x: _.random(minX, maxX),
        y: _.random(minY, playground.height - 30),
      }, duration, easing)

    tween.on('finish', () => {
      const outTween = playground.tween(enemy)
        .to({
          x: _.random(-20, playground.width + 20),
          y: playground.height,
        }, duration, easing)
      outTween.on('finish', () => {
        state.enemies = state.enemies.filter(e => e !== enemy)
      })
    })

    // Next!
    setTimeout(spawnEnemy, _.random(100, 3000))
  }

  const createStars = () => {
    let amount = 60
    while (amount--) {
      const type = _.random(0, 3) === 0 ? 'big' : 'small'
      state.stars.push({
        x: _.random(0, playground.width),
        y: _.random(0, playground.height),
        image: playground.images[`${type}Star`],
        type,
      })
    }
  }

  const preloadAssets = () => {
    playground.loadFont('VT323')
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

  const updateEnemies = () => {
    state.enemies.forEach(enemy => {
      if (_.random(0, 60) === 0) {
        enemyFires(enemy)
      }
    })
  }

  const enemyFires = (enemy) => {
    const type = _.random(0, 10) === 0 ? 'Cannon' : 'Gun'
    state.enemyProjectiles.push({
      x: enemy.x + (enemy.width / 2),
      y: enemy.y + (enemy.height + 2),
      image: playground.images[`enemy${type}Bullet`],
      width: type === 'Cannon' ? 3 : 1,
      height: type === 'Cannon' ? 6 : 5,
      speed: (type === 'Cannon' ? 0.5 : 1) + state.gameSpeed,
      enemy,
    })
  }

  const hurtPlayer = (removeHealth) => {
    state.player.health -= removeHealth
    state.player.hurting = true
    setTimeout(() => {
      state.player.hurting = false
    }, 30)
  }

  const objectsOverlap = (a, b) => {
    return !(
      ((a.y + a.height) < (b.y)) ||
      (a.y > (b.y + b.height)) ||
      ((a.x + a.width) < b.x) ||
      (a.x > (b.x + b.width))
    )
  }

  const createBoom = (x, y, w, h, color) => {
    const magnitude = Math.abs(w / h)
    const spread = 3
    let pixelAmount = Math.round(magnitude) * 3
    while (pixelAmount--) {
      const position = {
        x: (x - w / 2) + _.random(spread * -1, spread),
        y: (x - h / 2) + _.random(spread * -1, spread),
      }
      const pieceOfDebris = {
        x: position.x,
        y: position.y,
        color,
      }
      state.debris.push(pieceOfDebris)
      playground.tween(pieceOfDebris)
        .to({
          x: x += _.random(spread * -1, spread),
          y: y += _.random(spread * -1, spread),
        }, 0.3)
    }
  }

  const punishEnemy = (enemy, projectile) => {
    enemy.health -= projectile.weapon.damage

    enemy.hit = true
    setTimeout(() => {
      enemy.hit = false
    }, 30)

    if (enemy.health < 0) {
      // createBoom(enemy.x, enemy.y, enemy.width, enemy.height, '#31ddef')
      state.enemies = state.enemies.filter(e => e !== enemy)
    }
  }

  const doCollisionDetection = () => {
    // Enemies first.
    const enemiesToTakeHit = []
    const projectilesToDestroy = []
    state.player.weapons.forEach(weapon => {
      weapon.projectiles.forEach(projectile => {
        state.enemies.forEach(enemy => {
          if (objectsOverlap(enemy, projectile)) {
            enemiesToTakeHit.push({
              enemy,
              projectile
            })
            projectilesToDestroy.push(projectile)
          }
        })
      })
    })
    enemiesToTakeHit.forEach(enemyProjectilePair => {
      const enemy = enemyProjectilePair.enemy
      const projectile = enemyProjectilePair.projectile
      punishEnemy(enemy, projectile)
    })
    projectilesToDestroy.forEach(projectile => {
      state.player.weapons.forEach(weapon => {
        weapon.projectiles = weapon.projectiles.filter(p => p !== projectile)
      })
    })

    // Player.
    const enemyProjectilesToDestroy = []
    state.enemyProjectiles.forEach(projectile => {
      const removeHealth = 0.2 // @todo Dynamic!
      if (objectsOverlap(projectile, state.player)) {
        enemyProjectilesToDestroy.push(projectile)
        hurtPlayer(removeHealth)
      }
    })
    enemyProjectilesToDestroy.forEach(projectile => {
      state.enemyProjectiles = state.enemyProjectiles.filter(p => p !== projectile)
    })
    if (state.player.health < 0) {
      state.player.health = 1
      loseLife()
    }
  }

  const gameOver = () => {
    window.location.reload()
  }

  const loseLife = () => {
    state.player.lives--
    if (state.player.lives < 1) {
      gameOver()
    }
  }

  const drawInfoBar = () => {
    const text = `LIVES: ${state.player.lives}`
    playground.layer.fillStyle('#fff')
    playground.layer.font('11px VT323')
    playground.layer.fillText(text, 10, 10)
  }

  const updateState = () => {
    if (!state.gameRunning) {
      return
    }
    updatePlayer()
    updateEnemies()
    updateStars()
    updateDebugView()
    updateWeapons()
    updateProjectiles()
    doCollisionDetection()
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
      weapon,
    })
    weapon.projectiles.push({
      x: state.player.x + state.player.width - 3 - (weapon.projectileWidth / 2),
      y,
      width: weapon.projectileWidth,
      height: weapon.projectileHeight,
      speed: weapon.speed,
      weapon,
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
    // Player projectiles.
    state.player.weapons.forEach(weapon => {
      weapon.projectiles.forEach(projectile => {
        projectile.y -= projectile.speed
        if (projectile.y < 0) {
          weapon.projectiles = weapon.projectiles.filter(p => p !== projectile)
        }
      })
    })
    // Enemy projectiles.
    state.enemyProjectiles.forEach(projectile => {
      projectile.y += projectile.speed
    })
  }

  const updateStars = () => {
    state.stars.forEach(star => {
      const toAdd = (star.type === 'big' ? 0.3 : 0) + state.gameSpeed / 2
      star.y += toAdd

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
    // Player projectiles.
    state.player.weapons.forEach(weapon => {
      weapon.projectiles.forEach(projectile => {
        playground.layer.drawImage(playground.images[weapon.imageSlug], projectile.x, projectile.y, projectile.width, projectile.height)
      })
    })
    // Enemy projectiles.
    state.enemyProjectiles.forEach(projectile => {
      playground.layer.drawImage(projectile.image, projectile.x, projectile.y, projectile.width, projectile.height)
    })
  }

  const drawDebris = () => {
    state.debris.forEach(pieceOfDebris => {
      playground.layer.context.fillStyle = pieceOfDebris.color
      playground.layer.context.fillRect(pieceOfDebris.x, pieceOfDebris.y, 1, 1)
    })
  }

  const drawEnemies = () => {
    state.enemies.forEach(enemy => {

      // "Health bar."
      const context = playground.layer.context
      const healthBarX = enemy.x - 10
      const healthBarY = enemy.y - 10
      const minHealthToColor = {
        0.2: '#b51258',
        0.5: '#fe8358',
        0.7: '#148e00',
        1: '#49ec35',
      }
      context.fillStyle = minHealthToColor[1]
      Object.keys(minHealthToColor).forEach((color, minHealth) => {
        if (enemy.health < minHealth) {
          context.fillStyle = color
        }
      })

      const healthBarWidth = enemy.health * 20
      context.fillRect(healthBarX, healthBarY, healthBarWidth, 3)

      context.strokeStyle = "#fff"
      context.lineWidth = 1
      context.strokeRect(healthBarX, healthBarY, 20, 3)

      playground.layer.drawImage(enemy.hit ? enemy.imageHit : enemy.image, enemy.x, enemy.y)
    })
  }

  const drawStars = () => {
    playground.layer.context.globalAlpha = 0.5
    state.stars.forEach(star => {
      playground.layer.drawImage(star.image, star.x, star.y)
    })
    playground.layer.context.globalAlpha = 1
  }

  const centerPlayer = () => {
    state.player.x = centers.x - state.player.width / 2
    state.player.y = playground.height - 50
  }

  const drawScanLines = () => {
    playground.layer.context.fillStyle = playground.layer.context.createPattern(playground.images.scanlinePattern, 'repeat')
    playground.layer.context.fillRect(0, 0, playground.width, playground.height)
  }

  const drawPlayer = () => {
    const image = playground.images[`playerShip${state.player.hurting ? 'Hit' : ''}`]
    playground.layer.drawImage(image, state.player.x, state.player.y, state.player.width, state.player.height)
  }

  const draw = () => {
    // Clear frame.
    playground.layer.clear('#000')
    drawStars()
    drawEnemies()
    drawProjectiles()
    drawPlayer()
    drawDebris()
    drawInfoBar()
    if (config.drawScanLines) {
      drawScanLines()
    }
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

  const gamePadDown = (event) => {
    switch (event.button) {
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
      case '1': // A
        state.player.weapons.find(w => w.name === 'Gun').triggerDown = true
        break
      case '2': // B
        state.player.weapons.find(w => w.name === 'Cannon').triggerDown = true
        break
    }
  }

  const gamePadUp = (event) => {
    switch (event.button) {
      case 'left':
        state.player.velocities.x = 0
        break
      case 'right':
        state.player.velocities.x = 0
        break
      case 'up':
        state.player.velocities.y = 0
        break
      case 'down':
        state.player.velocities.y = 0
        break
      case '1': // A
        state.player.weapons.find(w => w.name === 'Gun').triggerDown = false
        break
      case '2': // B
        state.player.weapons.find(w => w.name === 'Cannon').triggerDown = false
        break
      case 'start':
        state.gameRunning = !state.gameRunning
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
    playground.gamepaddown = gamePadDown
    playground.gamepadup = gamePadUp
  }

  return {
    init
  }
}

export default Game
