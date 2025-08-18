import ObjectPool from '../utils/ObjectPool.js';
// 常量统一管理
const PLAYER_SPEED = 300;
const PLAYER_REVIVE_Y = 120;
const PLAYER_INVINCIBLE_TIME = 3000;
const ENEMY_HP = 1;
const BULLET_SPEED = -600;
const ENEMY_SPAWN_DELAY = 800;
const BULLET_SPAWN_DELAY = 200;
const LIVES_ICON_GAP = 52;
const LIVES_ICON_Y = 80;
const SCORE_TEXT_X = 16;
const SCORE_TEXT_Y = 16;

class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
    this.player = null;
    this.bullets = null;
    this.enemies = null;
    this.lastEnemyTime = 0;
    this.pool = null;
    this.score = 0;
    this.scoreText = null;
    this.isGameOver = false;
    this.lives = 3;
    this.livesIcons = [];
    this.isInvincible = false;
    this.invincibleTimer = null;
  }

  preload() {
    // 批量加载资源
    const images = [
      ['player', 'me1.png'], ['bullet', 'bullet1.png'], ['enemy', 'enemy1.png'], ['bg', 'background.png'], ['life', 'life.png'],
      ['me_destroy_1', 'me_destroy_1.png'], ['me_destroy_2', 'me_destroy_2.png'], ['me_destroy_3', 'me_destroy_3.png'], ['me_destroy_4', 'me_destroy_4.png'],
      ['me1', 'me1.png'], ['me2', 'me2.png'],
      ['enemy1_down1', 'enemy1_down1.png'], ['enemy1_down2', 'enemy1_down2.png'], ['enemy1_down3', 'enemy1_down3.png'], ['enemy1_down4', 'enemy1_down4.png']
    ];
    images.forEach(([key, file]) => {
      this.load.image(key, `assets/images/${file}`);
    });
  }

  create() {
    this.add.tileSprite(0, 0, this.scale.width, this.scale.height, 'bg').setOrigin(0);
    this.createAnimations();
    this.createPlayer();
    this.createUI();
    this.createPools();
    this.createEnemies();
    this.registerEvents();
    this.isGameOver = false;
  }

  createAnimations() {
    this.anims.create({
      key: 'player_fly',
      frames: [{ key: 'me1' }, { key: 'me2' }],
      frameRate: 8,
      repeat: -1
    });
    this.anims.create({
      key: 'player_destroy',
      frames: [
        { key: 'me_destroy_1' },
        { key: 'me_destroy_2' },
        { key: 'me_destroy_3' },
        { key: 'me_destroy_4' }
      ],
      frameRate: 10,
      repeat: 0
    });
    this.anims.create({
      key: 'enemy_destroy',
      frames: [
        { key: 'enemy1_down1' },
        { key: 'enemy1_down2' },
        { key: 'enemy1_down3' },
        { key: 'enemy1_down4' }
      ],
      frameRate: 10,
      repeat: 0
    });
  }

  createPlayer() {
    this.player = this.physics.add.sprite(this.scale.width/2, this.scale.height-PLAYER_REVIVE_Y, 'me1').setDepth(1);
    this.player.setCollideWorldBounds(true);
    this.player.play('player_fly');
  }

  createUI() {
    this.score = 0;
    this.scoreText = this.add.text(SCORE_TEXT_X, SCORE_TEXT_Y, '分数: 0', { fontSize: '24px', fill: '#fff' }).setDepth(2);
    this.lives = 3;
    this.livesIcons = [];
    for (let i = 0; i < this.lives; i++) {
      const icon = this.add.image(24 + i * LIVES_ICON_GAP, LIVES_ICON_Y, 'life').setScale(0.5).setDepth(2);
      this.livesIcons.push(icon);
    }
  }

  createPools() {
    this.pool = new ObjectPool(this, 'bullet', 50);
  }

  createEnemies() {
    this.enemies = this.physics.add.group();
    this.enemyEvent = this.time.addEvent({
      delay: ENEMY_SPAWN_DELAY,
      loop: true,
      callback: () => {
        const x = Phaser.Math.Between(40, this.scale.width-40);
        const enemy = this.enemies.create(x, -40, 'enemy');
        enemy.setVelocityY(Phaser.Math.Between(120, 200));
        enemy.hp = ENEMY_HP;
      }
    });
  }

  registerEvents() {
    // 触控移动
    this.input.on('pointermove', pointer => {
      this.player.x = Phaser.Math.Clamp(pointer.x, 0, this.scale.width);
      this.player.y = Phaser.Math.Clamp(pointer.y, 0, this.scale.height);
    });
    // 自动射击
    this.shootEvent = this.time.addEvent({
      delay: BULLET_SPAWN_DELAY,
      loop: true,
      callback: () => {
        const bullet = this.pool.spawn(this.player.x, this.player.y-40);
        if (bullet) bullet.setVelocityY(BULLET_SPEED);
      }
    });
    // 键盘输入
    this.cursors = this.input.keyboard.createCursorKeys();
    // 碰撞检测
    this.physics.add.overlap(this.pool.group, this.enemies, this.hitEnemy, null, this);
    this.physics.add.overlap(this.player, this.enemies, this.playerHit, null, this);
  }

  hitEnemy(bullet, enemy) {
    bullet.setActive(false).setVisible(false);
    // 敌机被击中，减少生命值
    if (typeof enemy.hp === 'undefined') enemy.hp = 1;
    if (enemy.isDying) return; // 正在死亡动画时不再处理
    enemy.hp--;
    if (enemy.hp <= 0) {
      enemy.isDying = true;
      // 敌机摧毁动画
      enemy.play('enemy_destroy');
      enemy.once('animationcomplete', () => {
        enemy.destroy();
      });
      if (!this.isGameOver) {
        this.score += 10;
        this.scoreText.setText('分数: ' + this.score);
      }
    }
  }

  playerHit(player, enemy) {
    enemy.destroy();
    if (this.isInvincible || this.isGameOver) return;
    this.cameras.main.shake(200, 0.01);
    this.lives--;
    // 更新命数图标
    if (this.livesIcons[this.lives]) {
      this.livesIcons[this.lives].setVisible(false);
    }
    // 播放我方飞机摧毁动画
    this.player.play('player_destroy');
    this.player.once('animationcomplete', () => {
      if (this.lives <= 0) {
        this.gameOver();
        return;
      }
      // 飞机复活：从下方飞入
      this.player.setY(this.scale.height + 60);
      this.player.setX(this.scale.width / 2);
      this.player.setActive(true).setVisible(true);
      this.player.play('player_fly');
      this.tweens.add({
        targets: this.player,
        y: this.scale.height - 120,
        duration: 600,
        ease: 'Power2',
        onComplete: () => {
          // 进入无敌状态3秒
          this.isInvincible = true;
          this.player.setAlpha(0.5);
          if (this.invincibleTimer) this.invincibleTimer.remove(false);
          this.invincibleTimer = this.time.addEvent({
            delay: 3000,
            callback: () => {
              this.isInvincible = false;
              this.player.setAlpha(1);
            }
          });
        }
      });
    });
  }

  gameOver() {
    this.isGameOver = true;
    this.player.setActive(false).setVisible(false);
    this.shootEvent.remove(false);
    this.enemyEvent.remove(false);
    this.physics.pause();
    // 通知主页面显示遮罩层和分数
    if (window && window.parent) {
      const event = new CustomEvent('gameover', { detail: { score: this.score } });
      window.dispatchEvent(event);
    }
  }

  update() {
    // 键盘左右移动
    if (this.player && this.player.active && this.cursors) {
      const speed = 300;
      if (this.cursors.left.isDown) {
        this.player.setVelocityX(-speed);
      } else if (this.cursors.right.isDown) {
        this.player.setVelocityX(speed);
      } else {
        this.player.setVelocityX(0);
      }
    }
    // 无敌状态闪烁效果
    if (this.isInvincible && this.player && this.player.active) {
      this.player.setAlpha(Math.sin(this.time.now / 100) > 0 ? 0.5 : 1);
    }
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
