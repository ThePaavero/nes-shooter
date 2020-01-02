/**
 * Your Game's state object. Feel free to split it up if your state is complicated/large.
 */
export default {
  player: {
    x: 0,
    y: 0,
    width: 27,
    height: 21,
    speed: 2,
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
        millisecondsBetweenProjectiles: 50,
        imageSlug: 'playerGunBullet',
        projectileWidth: 1,
        projectileHeight: 3,
        projectiles: [],
      },
      {
        name: 'Cannon',
        speed: 2,
        triggerDown: false,
        lastShotTimestamp: Date.now(),
        millisecondsBetweenProjectiles: 200,
        imageSlug: 'playerCannonBullet',
        projectileWidth: 3,
        projectileHeight: 5,
        projectiles: [],
      }
    ],
  },
}
