// 敌机类型配置
export default {
  normal: {
    key: 'enemy',
    hp: 1,
    score: 10,
    speed: () => Phaser.Math.Between(120, 200),
    destroyAnim: 'enemy_destroy',
    spawnY: -40,
    spawnX: () => Phaser.Math.Between(40, 400)
  },
  boss1: {
    key: 'enemy2',
    hp: 100,
    score: 100,
    speed: () => 100,
    destroyAnim: 'boss1_destroy',
    spawnY: -60,
    spawnX: () => Phaser.Math.Between(60, 400)
  },
  boss2: {
    key: 'enemy3',
    hp: 200,
    score: 500,
    speed: () => 80,
    destroyAnim: 'boss2_destroy',
    spawnY: -80,
    spawnX: () => Phaser.Math.Between(80, 400)
  }
};
