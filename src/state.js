/**
 * Your Game's state object. Feel free to split it up if your state is complicated/large.
 */
export default {
  gameRunning: true,
  gameSpeed: 1,
  player: {
    points: 0,
    highscore: 0,
    lives: 3,
    x: 0,
    y: 0,
    width: 27,
    height: 21,
    speed: 2,
    health: 1,
    hurting: false,
    shieldUp: false,
    velocities: {
      x: 0,
      y: 0,
    },
    weapons: [
      {
        name: 'Gun',
        speed: 3,
        triggerDown: false,
        lastShotTimestamp: Date.now(),
        millisecondsBetweenProjectiles: 60,
        imageSlug: 'playerGunBullet',
        projectileWidth: 1,
        projectileHeight: 3,
        damage: 0.06,
        projectiles: [],
      },
      {
        name: 'Cannon',
        speed: 2,
        triggerDown: false,
        lastShotTimestamp: Date.now(),
        millisecondsBetweenProjectiles: 400,
        imageSlug: 'playerCannonBullet',
        projectileWidth: 3,
        projectileHeight: 5,
        damage: 0.7,
        projectiles: [],
      }
    ],
  },
  stars: [],
  enemies: [],
  debris: [],
  enemyProjectiles: [],
}
