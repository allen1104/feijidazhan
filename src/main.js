import GameScene from './scenes/GameScene.js';

window.onload = function() {
  const config = {
    type: Phaser.AUTO,
    width: window.innerWidth,
    height: window.innerHeight,
    parent: 'game-container',
    physics: {
      default: 'arcade',
      arcade: {
        debug: false
      }
    },
    scene: [GameScene]
  };
  new Phaser.Game(config);
};
