import ObjectPool from '../utils/ObjectPool.js';
import enemyConfig from '../config/enemyConfig.js';
// 常量统一管理
const PLAYER_SPEED = 300;
const PLAYER_REVIVE_Y = 120;
const PLAYER_INVINCIBLE_TIME = 3000;
const ENEMY_HP = 1;
const BULLET_SPEED = -600;
const ENEMY_SPAWN_DELAY = 800;
const BULLET_SPAWN_DELAY = 200;
const LIVES_ICON_GAP = 40;
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
      ['enemy1_down1', 'enemy1_down1.png'], ['enemy1_down2', 'enemy1_down2.png'], ['enemy1_down3', 'enemy1_down3.png'], ['enemy1_down4', 'enemy1_down4.png'],
      ['enemy2', 'enemy2.png'],
      ['enemy2_down1', 'enemy2_down1.png'], ['enemy2_down2', 'enemy2_down2.png'], ['enemy2_down3', 'enemy2_down3.png'], ['enemy2_down4', 'enemy2_down4.png'],
      ['enemy3', 'enemy3_n1.png'],
      ['enemy3_down1', 'enemy3_down1.png'], ['enemy3_down2', 'enemy3_down2.png'], ['enemy3_down3', 'enemy3_down3.png'], ['enemy3_down4', 'enemy3_down4.png'],['enemy3_down5', 'enemy3_down5.png'],['enemy3_down6', 'enemy3_down6.png']
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
    this.difficultyLevel = 1;
    // 炫酷横条预警提示
    this.bossWarningBar = this.add.rectangle(this.scale.width/2, 60, this.scale.width * 0.8, 48, 0xff0000, 0.7).setOrigin(0.5).setDepth(10).setVisible(false);
    this.bossWarningBar.setStrokeStyle(4, 0xffff00, 1);
    this.bossWarningBar.setAlpha(0.7);
    this.bossWarningText = this.add.text(this.scale.width/2, 60, '', {
      fontSize: '32px',
      fill: 'linear-gradient(90deg, #fff, #ff0, #f00)',
      fontWeight: 'bold',
      stroke: '#000',
      strokeThickness: 4,
      shadow: { offsetX: 2, offsetY: 2, color: '#ff0', blur: 8, fill: true }
    }).setOrigin(0.5).setDepth(11).setVisible(false);
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
    this.anims.create({
      key: 'boss1_destroy',
      frames: [
        { key: 'enemy2_down1' },
        { key: 'enemy2_down2' },
        { key: 'enemy2_down3' },
        { key: 'enemy2_down4' }
      ],
      frameRate: 10,
      repeat: 0
    });
    this.anims.create({
      key: 'boss2_destroy',
      frames: [
        { key: 'enemy3_down1' },
        { key: 'enemy3_down2' },
        { key: 'enemy3_down3' },
        { key: 'enemy3_down4' },
        { key: 'enemy3_down5' },
        { key: 'enemy3_down6' },
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
        enemy.hp = ENEMY_HP;
        enemy.type = 'normal';
        // 随机选择轨迹类型
        const pathType = Phaser.Math.Between(1, 3);
        enemy.pathType = pathType;
        enemy.baseX = x;
        enemy.spawnTime = this.time.now;
        // 轨迹1：直线
        if (pathType === 1) {
          enemy.setVelocityY(Phaser.Math.Between(120, 200));
        }
        // 轨迹2：左右摆动
        else if (pathType === 2) {
          enemy.setVelocityY(150);
        }
        // 轨迹3：斜线
        else if (pathType === 3) {
          enemy.setVelocityY(160);
          enemy.setVelocityX(Phaser.Math.Between(-80, 80));
        }
      }
    });
    // 定时出现小boss
    this.scheduleBoss1();
    // 定时出现大boss
    this.scheduleBoss2();
  }

  scheduleBoss1() {
    const base = 8000; // 小boss基础间隔8秒
    const rand = Phaser.Math.Between(0, 4000); // 随机0~4秒
    this.time.addEvent({
      delay: base + rand,
      callback: () => {
        this.spawnBoss1();
        this.scheduleBoss1(); // 递归定时
      }
    });
  }

  scheduleBoss2() {
    const base = 20000; // 大boss基础间隔20秒
    const rand = Phaser.Math.Between(0, 8000); // 随机0~8秒
    this.time.addEvent({
      delay: base + rand,
      callback: () => {
        this.spawnBoss2();
        this.scheduleBoss2(); // 递归定时
      }
    });
  }

  showBossWarning(type) {
    this.bossWarningBar.setVisible(true);
    this.bossWarningText.setText(type === 'boss2' ? '⚡⚡⚡ 大Boss来袭！ ⚡⚡⚡' : '小Boss来袭！');
    this.bossWarningText.setVisible(true);
    // 闪烁动画
    this.tweens.add({
      targets: [this.bossWarningBar, this.bossWarningText],
      alpha: { from: 0.7, to: 1 },
      duration: 300,
      yoyo: true,
      repeat: 8
    });
    this.time.delayedCall(3000, () => {
      this.bossWarningBar.setVisible(false);
      this.bossWarningText.setVisible(false);
    });
  }

  spawnBoss1() {
    const x = Phaser.Math.Between(60, this.scale.width-60);
    const boss = this.enemies.create(x, -60, 'enemy2');
    boss.setVelocityY(100);
    boss.hp = 20;
    boss.type = 'boss1';
    // 随机轨迹
    const pathType = Phaser.Math.Between(1, 3);
    boss.pathType = pathType;
    boss.baseX = x;
    boss.spawnTime = this.time.now;
    if (pathType === 3) {
      boss.setVelocityX(Phaser.Math.Between(-80, 80));
    }
  }

  spawnBoss2() {
    // 仅大boss显示预警
    this.showBossWarning('boss2');
    const x = Phaser.Math.Between(80, this.scale.width-80);
    const boss = this.enemies.create(x, -80, 'enemy3');
    boss.setVelocityY(80);
    boss.hp = 50;
    boss.type = 'boss2';
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
    if (typeof enemy.hp === 'undefined') enemy.hp = 1;
    if (enemy.isDying) return;
    enemy.hp--;
    if (enemy.hp <= 0) {
      enemy.isDying = true;
      let cfg = enemyConfig[enemy.type] || enemyConfig.normal;
      enemy.play(cfg.destroyAnim);
      enemy.once('animationcomplete', () => {
        enemy.destroy();
      });
      if (!this.isGameOver) {
        this.score += cfg.score;
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

  updateDifficulty() {
    // 难度递增：分数越高，敌机速度和数量越大
    const newLevel = Math.floor(this.score / 200) + 1;
    if (newLevel !== this.difficultyLevel) {
      this.difficultyLevel = newLevel;
      // 敌机生成频率提升
      if (this.enemyEvent) {
        this.enemyEvent.remove(false);
      }
      const newDelay = Math.max(ENEMY_SPAWN_DELAY - (this.difficultyLevel-1)*100, 300);
      this.enemyEvent = this.time.addEvent({
        delay: newDelay,
        loop: true,
        callback: () => {
          const x = Phaser.Math.Between(40, this.scale.width-40);
          const enemy = this.enemies.create(x, -40, 'enemy');
          // 敌机速度提升
          enemy.setVelocityY(Phaser.Math.Between(120, 200) + (this.difficultyLevel-1)*30);
          enemy.hp = ENEMY_HP;
          enemy.type = 'normal';
        }
      });
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
    // 敌机轨迹控制（包括小boss）
    this.enemies.children.iterate(enemy => {
      if (!enemy || !enemy.active) return;
      // 轨迹2：左右摆动
      if (enemy.pathType === 2) {
        enemy.x = enemy.baseX + Math.sin((this.time.now-enemy.spawnTime)/400)*60;
      }
      // 超出屏幕销毁
      if (enemy.y > this.scale.height+40) enemy.destroy();
    });
    // 子弹超出屏幕回收
    this.pool.group.children.iterate(bullet => {
      if (bullet && bullet.active && bullet.y < -40) {
        bullet.setActive(false).setVisible(false);
        bullet.body.enable = false;
      }
    });
    this.updateDifficulty();
  }
}

export default GameScene;
