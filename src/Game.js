import state from './state'
import imagesArray from './images'
import config from './config'
import enemies from './enemies'
import sounds from './sounds'
import bonusItems from './bonusItems'
import _ from 'lodash'

const Game = (playground) => {

  const centers = {
    x: playground.width / 2,
    y: playground.height / 2,
  }

  const onReady = () => {
    setHighScoreOnReady()
    centerPlayer()
    createStars()
    window.addEventListener('resize', handleAspectRatio)
    handleAspectRatio()
  }

  const setHighScoreOnReady = () => {
    const highScoreOnDisk = window.localStorage.getItem('highScore')
    if (Number(highScoreOnDisk) > 0) {
      state.player.highScore = Number(highScoreOnDisk)
    } else {
      state.player.highScore = 0
    }
  }

  const getRandomEnemyObject = () => {
    return enemies[_.random(0, enemies.length - 1)]
  }

  const spawnEnemy = () => {
    const enemyBlueprint = getRandomEnemyObject()
    const enemyDimensions = {
      width: enemyBlueprint.width,
      height: enemyBlueprint.height,
    }
    const imageSlug = `enemies/${enemyBlueprint.name}`
    const image = playground.images[imageSlug]
    const imageHit = playground.images[imageSlug + 'Hit']
    const enemy = {
      x: _.random(0, playground.width - enemyDimensions.width),
      y: enemyDimensions.height * -1,
      image,
      imageHit,
      width: enemyDimensions.width,
      height: enemyDimensions.height,
      health: enemyBlueprint.health,
      projectileTypes: enemyBlueprint.projectileTypes,
      damageMultiplier: enemyBlueprint.damageMultiplier,
      baseColor: enemyBlueprint.baseColor,
    }
    state.enemies.push(enemy)

    makeEnemyDance(enemy)

    // Next!
    if (state.scene === 'game') {
      setTimeout(spawnEnemy, _.random(100, 3000))
    }
  }

  const spawnBonusItem = () => {
    const randomItem = bonusItems[_.random(0, bonusItems.length - 1)]
    state.bonusItems.push({
      image: playground.images[`bonusItems/${randomItem.name}`],
      x: _.random(3, playground.width - 3),
      y: randomItem.height * -1,
      width: randomItem.width,
      height: randomItem.height,
      name: randomItem.name,
      action: randomItem.action,
    })

    // Next!
    setTimeout(spawnBonusItem, _.random(4000, 12000))
  }

  const makeEnemyDance = (enemy) => {
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
          y: playground.height + 50,
        }, duration, easing)
      outTween.on('finish', () => {
        state.enemies = state.enemies.filter(e => e !== enemy)
      })
    })
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
    sounds.forEach(soundFile => {
      playground.loadSounds(soundFile)
    })
    playground.loadFont('PixelEmulatorxq08')
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
    const projectileType = enemy.projectileTypes[_.random(0, enemy.projectileTypes.length - 1)]
    const projectileObject = {
      x: enemy.x + (enemy.width / 2),
      y: enemy.y + (enemy.height + 2),
      image: playground.images[`enemies/${projectileType.name}`],
      width: projectileType.width,
      height: projectileType.height,
      speed: projectileType.velocity,
      enemy,
    }
    state.enemyProjectiles.push(projectileObject)
  }

  const hurtPlayer = (removeHealth) => {
    if (config.invincible) {
      return
    }
    if (state.player.shieldUp && state.player.shieldHealth > 0) {
      playground.sound.play('blip')
      state.player.shieldHealth -= 0.1
      return
    }
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

    playground.sound.play('boom')

    const magnitude = w / 10
    const spread = 10
    let pixelAmount = Math.round(magnitude) * 3
    while (pixelAmount--) {
      const position = {
        x: (x + (w / 2)) + _.random(spread * -1, spread),
        y: (y + (h / 2)) + _.random(spread * -1, spread),
      }
      const pieceOfDebris = {
        x: position.x,
        y: position.y,
        size: _.random(1, 4),
        color,
      }
      state.debris.push(pieceOfDebris)
      const tween = playground.tween(pieceOfDebris)
        .to({
          x: position.x + _.random(spread * -1, spread),
          y: (position.y + _.random(spread * -1, spread)) + state.gameSpeed,
        }, 0.3)
      tween.on('finish', () => {
        state.debris = state.debris.filter(d => d !== pieceOfDebris)
      })
    }
  }

  const punishEnemy = (enemy, projectile) => {
    enemy.health -= projectile.weapon.damage * enemy.damageMultiplier

    enemy.hit = true
    setTimeout(() => {
      enemy.hit = false
    }, 30)

    if (enemy.health < 0) {
      createBoom(enemy.x, enemy.y, enemy.width, enemy.height, enemy.baseColor)
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
      state.player.points += 10
      if (state.player.points > state.player.highScore) {
        state.player.highScore = state.player.points
      }
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

    // Bonus items.
    state.bonusItems.forEach(item => {
      if (objectsOverlap(state.player, item)) {
        collectBonusItems(item)
        state.bonusItems = state.bonusItems.filter(i => i !== item)
      }
    })
  }

  const collectBonusItems = (item) => {
    switch (item.action) {
      case 'ADD_HEALTH':
        if (state.player.health < 1) {
          state.player.health = 1
        }
        break
      case 'REPAIR_SHIELD':
        if (state.player.shieldHealth < 1) {
          state.player.shieldHealth = 1
        }
        break
    }
  }

  const gameOver = () => {
    const highScoreOnDisk = window.localStorage.getItem('highScore')
    if (!highScoreOnDisk || Number(highScoreOnDisk) < state.player.points) {
      window.localStorage.setItem('highScore', state.player.points)
    }
    changeScene('gameOver')
  }

  const loseLife = () => {
    playground.sound.play('boom')
    state.player.lives--
    if (state.player.lives < 1) {
      gameOver()
    }
  }

  const drawInfoBar = () => {
    const fontSize = 10

    let text = `LIVES: ${state.player.lives}`
    text += ` HEALTH: `
    playground.layer.fillStyle('#fff')
    playground.layer.font(`${fontSize}px PixelEmulatorxq08`)
    playground.layer.fillText(text, 10, playground.height - 20)

    playground.layer.fillText(`POINTS ${state.player.points}`, 10, 10)
    playground.layer.fillText(`HIGHSCORE ${state.player.highScore}`, playground.width - 120, 10)

    let healthIconsToDraw = Math.ceil(state.player.health * 10)
    let offset = 3
    while (healthIconsToDraw--) {
      playground.layer.drawImage(playground.images.healthItem, 120 + offset, playground.height - 20)
      offset += 4
    }
  }

  const updateStick = () => {
    if (playground.gamepads.length < 1 || !playground.gamepads[0]) {
      return
    }
    const stick = playground.gamepads[0].sticks[0]
    const threshold = 0.5
    if (Math.abs(stick.x) > threshold) {
      state.player.velocities.x = stick.x > 0 ? state.player.speed : state.player.speed * -1
    } else {
      state.player.velocities.x = 0
    }

    if (Math.abs(stick.y) > threshold) {
      state.player.velocities.y = stick.y > 0 ? state.player.speed : state.player.speed * -1
    } else {
      state.player.velocities.y = 0
    }
  }

  const updateShield = () => {
    state.player.shieldUp = (playground.keyboard.keys.comma && playground.keyboard.keys.period) || (playground.gamepads[0] && playground.gamepads[0].buttons['1'] && playground.gamepads[0].buttons['2'])
  }

  const updateBonusItems = () => {
    state.bonusItems.forEach(item => {
      item.y += state.gameSpeed * 0.5
      if (item.y > playground.height) {
        state.bonusItems = state.bonusItems.filter(i => i !== item)
      }
    })
  }

  const changeScene = (into) => {
    state.scene = into
    if (into === 'game') {
      spawnEnemy()
      spawnBonusItem()
    }
  }

  const triggerPlayStartByAnyInput = (doReload = false) => {
    if (playground.gamepads[0]) {
      const pad = playground.gamepads[0]
      if (Object.keys(pad.buttons).filter(buttonIndex => !!buttonIndex).length > 0) {
        if (doReload) {
          window.location.reload()
          return
        }
        changeScene('game')
      }
    }
    if (playground.keyboard.any) {
      if (doReload) {
        window.location.reload()
        return
      }
      changeScene('game')
    }
  }

  const updateState = () => {
    if (!state.gameRunning) {
      return
    }

    switch (state.scene) {
      case 'splash':
      default:
        updateStars()
        triggerPlayStartByAnyInput(false)
        break
      case 'gameOver':
        updateStars()
        state.gameOverScreenTicks--
        if (state.gameOverScreenTicks < 0) {
          state.gameOverScreenTicks = 0
          window.location.reload()
        }
        break
      case 'game':
        updatePlayer()
        updateEnemies()
        updateStars()
        updateWeapons()
        updateProjectiles()
        doCollisionDetection()
        updateShield()
        updateBonusItems()
        break
    }
  }

  const getWeaponObject = (weaponName) => {
    return state.player.weapons.find(w => w.name === weaponName)
  }

  const getCurrentMs = () => {
    return Date.now()
  }

  const okToFireProjectile = (weaponName) => {
    if (state.player.shieldUp) {
      return false
    }
    const weapon = getWeaponObject(weaponName)
    return getCurrentMs() - weapon.lastShotTimestamp > weapon.millisecondsBetweenProjectiles
  }

  const fireProjectile = (weaponName) => {
    playground.sound.play('pew')
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
      playground.layer.context.fillRect(pieceOfDebris.x, pieceOfDebris.y, pieceOfDebris.size, pieceOfDebris.size)
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

      context.strokeStyle = '#fff'
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

    if (state.player.shieldUp) {
      drawShield()
    }
  }

  const drawShield = () => {
    const image = playground.images[state.player.shieldHealth > 0 ? 'shield' : 'shieldBroken']
    playground.layer.drawImage(image, state.player.x - 5, state.player.y - 10, 37, 21)
    playground.layer.fillStyle('#fff')
    playground.layer.font(`7px PixelEmulatorxq08`)
    const text = state.player.shieldHealth < 0 ? 'X' : Math.round(state.player.shieldHealth * 10)
    playground.layer.fillText(text, state.player.x - 13, state.player.y - 7)
  }

  const handleAspectRatio = () => {
    const canvas = document.querySelector('canvas')
    if (window.innerHeight < canvas.getBoundingClientRect().height) {
      canvas.style.height = window.innerHeight + 'px'
      canvas.style.width = 'auto'
    } else {
      canvas.style.width = window.innerWidth + 'px'
      if (canvas.getBoundingClientRect().height > window.innerHeight) {
        canvas.style.height = window.innerHeight + 'px'
      } else {
        canvas.style.height = 'auto'
      }
    }
  }

  const drawBonusItems = () => {
    state.bonusItems.forEach(item => {
      playground.layer.drawImage(item.image, item.x, item.y, item.width, item.height)
    })
  }

  const drawSplashScreen = () => {
    playground.layer.drawImage(playground.images['splash/title'], 38, 10)

    const lineHeight = 10
    let y = 100
    let x = 20

    const lines = `
Keyboard :
■ Arrow keys for moving
■ Comma for gun
■ Period for cannon.
---
Gamepad :
■ D-pad for moving
■ A for gun
■ B for cannon

Gun and cannon combined activates
shield. Press any key or button .
    `.split('\n')

    playground.layer.fillStyle('#fff')
    playground.layer.font(`9px PixelEmulatorxq08`)
    lines.forEach(line => {
      playground.layer.fillText(line, x, y)
      y += lineHeight
    })
  }

  const drawGameOverStats = () => {
    const lineHeight = 10
    let y = 100
    let x = 20

    const lines = `
Game over

Your score : ${state.player.points}

Starting new round in ${Math.round(state.gameOverScreenTicks / 60)}
    `.split('\n')

    playground.layer.fillStyle('#fff')
    playground.layer.font(`9px PixelEmulatorxq08`)
    lines.forEach(line => {
      playground.layer.fillText(line, x, y)
      y += lineHeight
    })
  }

  const draw = () => {

    // Clear frame.
    playground.layer.clear('#000')

    drawStars()

    switch (state.scene) {
      case 'splash':
        drawSplashScreen()
        break
      case 'game':
        drawEnemies()
        drawProjectiles()
        drawPlayer()
        drawDebris()
        drawBonusItems()
        if (config.drawScanLines) {
          drawScanLines()
        }
        drawInfoBar()
        break
      case 'gameOver':
        drawGameOverStats()
        break
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
