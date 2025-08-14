import ObjectPool from '../utils/ObjectPool.js';

class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
    this.player = null;
    this.bullets = null;
    this.enemies = null;
    this.lastEnemyTime = 0;
    this.pool = null;
  }

  preload() {
    // 加载实际资源
    this.load.image('player', 'assets/images/me1.png');
    this.load.image('bullet', 'assets/images/bullet1.png');
    this.load.image('enemy', 'assets/images/enemy1.png');
    this.load.image('bg', 'assets/images/background.png'); // 如有专用背景图请替换
  }

  create() {
    // 背景
    this.add.tileSprite(0, 0, this.scale.width, this.scale.height, 'bg').setOrigin(0);
    // 玩家飞机
    this.player = this.physics.add.sprite(this.scale.width/2, this.scale.height-120, 'player').setDepth(1);
    this.player.setCollideWorldBounds(true);
    // 子弹对象池
    this.pool = new ObjectPool(this, 'bullet', 50);
    // 敌机组
    this.enemies = this.physics.add.group();
    // 触控移动
    this.input.on('pointermove', pointer => {
      this.player.x = Phaser.Math.Clamp(pointer.x, 0, this.scale.width);
      this.player.y = Phaser.Math.Clamp(pointer.y, 0, this.scale.height);
    });
    // 自动射击
    this.time.addEvent({
      delay: 200,
      loop: true,
      callback: () => {
        const bullet = this.pool.spawn(this.player.x, this.player.y-40);
        if (bullet) bullet.setVelocityY(-600);
      }
    });
    // 敌机生成
    this.time.addEvent({
      delay: 800,
      loop: true,
      callback: () => {
        const x = Phaser.Math.Between(40, this.scale.width-40);
        const enemy = this.enemies.create(x, -40, 'enemy');
        enemy.setVelocityY(Phaser.Math.Between(120, 200));
      }
    });
    // 碰撞检测
    this.physics.add.overlap(this.pool.group, this.enemies, this.hitEnemy, null, this);
    this.physics.add.overlap(this.player, this.enemies, this.playerHit, null, this);
  }

  hitEnemy(bullet, enemy) {
    bullet.setActive(false).setVisible(false);
    enemy.destroy();
    // 爆炸动画、分数等可扩展
  }

  playerHit(player, enemy) {
    enemy.destroy();
    this.cameras.main.shake(200, 0.01);
    // 生命值、失败逻辑可扩展
  }

  update() {
    // 敌机超出屏幕销毁
    this.enemies.children.iterate(enemy => {
      if (enemy && enemy.y > this.scale.height+40) enemy.destroy();
    });
    // 子弹超出屏幕回收
    this.pool.group.children.iterate(bullet => {
      if (bullet && bullet.active && bullet.y < -40) {
        bullet.setActive(false).setVisible(false);
        bullet.body.enable = false;
      }
    });
  }
}

export default GameScene;
