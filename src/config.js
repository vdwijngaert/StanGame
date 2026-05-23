export const CONFIG = {
  player: {
    name: 'Stan',
    number: 10,
    scale: 1.75,
    shirtColor: 0xFFD700,
    shirtColorHex: '#FFD700',
    shortsColor: 0x111111,
    sleeveColor: 0x111111,
    bootsColor: 0x222222,
    skinColor: 0xFFDAAB,
    club: 'KVV Duffel',
  },
  birthday: {
    show: true,
    age: 10,
    message: 'Gelukkige verjaardag Stan! 🎂',
  },
  difficulty: {
    levelUpInterval: 15000,   // ms between level increases
    initialSpeed: 200,        // px/s world scroll speed
    speedIncrement: 50,       // px/s per level
    initialSpawnInterval: 2200, // ms between defender spawns
    spawnIntervalDecrement: 150, // ms reduction per level
    minSpawnInterval: 600,
  },
  scoring: {
    distancePerPoint: 5,      // px scrolled = 1 score point
    ballBonus: 10,
  },
  lives: 3,
  invincibilityDuration: 2000, // ms after being hit
  controls: {
    joystick: {
      baseRadius: 60,
      thumbMaxRadius: 50,
      deadzone: 0.15,
    },
    playerMaxSpeed: 350,
  },
  shield: {
    spawnInterval: 8000,
    spawnChance: 0.35,
    duration: 3000,
  },
};
