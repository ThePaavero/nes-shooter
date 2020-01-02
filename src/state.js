/**
 * Your Game's state object. Feel free to split it up if your state is complicated/large.
 */
export default {
  player: {
    x: 0,
    y: 0,
    width: 27,
    height: 21,
    speed: 3,
    velocities: {
      x: 0,
      y: 0,
    },
    weapons: [
      {
        name: 'Gun',
        speed: 10,
        triggerDown: false,
        lastShotTimestamp: 0,
        imageSlug: 'playerGunBullet',
        projectiles: [],
      },
      {
        name: 'Cannon',
        speed: 3,
        triggerDown: false,
        lastShotTimestamp: 0,
        imageSlug: 'playerCannonBullet',
        projectiles: [],
      }
    ],
  },
}
