import GameScene from './scenes/GameScene.js';

window.onload = function() {
  // 处理开始游戏按钮点击，点击后初始化游戏并隐藏遮罩层
  const startBtn = document.getElementById('startBtn');
  const startScreen = document.getElementById('startScreen');
  const gameOverScreen = document.getElementById('gameOverScreen');
  const finalScore = document.getElementById('finalScore');
  const restartBtn = document.getElementById('restartBtn');
  const playerNameInput = document.getElementById('playerName');
  const playerNameEndInput = document.getElementById('playerNameEnd');
  const confirmNameBtn = document.getElementById('confirmNameBtn');
  const congratsModal = document.getElementById('congratsModal');
  const rankListStartItems = document.getElementById('rankListStartItems');
  const rankListEndItems = document.getElementById('rankListEndItems');
  const rankListEnd = document.getElementById('rankListEnd');
  let gameInstance = null;
  let currentPlayerName = '';
  let lastScore = 0;
  let lastHighlightName = '';

  function getRankList() {
    // 从本地存储获取排行榜
    const list = localStorage.getItem('feiji_rank_list');
    if (list) {
      try {
        return JSON.parse(list);
      } catch {
        return [];
      }
    }
    return [];
  }

  function saveRankList(rankList) {
    localStorage.setItem('feiji_rank_list', JSON.stringify(rankList));
  }

  function renderRankList(list, container, highlightName) {
    if (!container) return;
    container.innerHTML = '';
    list.forEach((item) => {
      const li = document.createElement('li');
      li.textContent = `${item.name} - ${item.score}`;
      if (highlightName && item.name === highlightName) {
        li.style.color = '#ffd700';
        li.style.fontWeight = 'bold';
      }
      container.appendChild(li);
    });
  }

  function startGame() {
    // 销毁旧实例
    if (gameInstance) {
      gameInstance.destroy(true);
      gameInstance = null;
      // 清空容器内容
      const container = document.getElementById('game-container');
      if (container) container.innerHTML = '';
    }
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
    gameInstance = new Phaser.Game(config);
  }

  // 初始化排行榜显示
  renderRankList(getRankList(), rankListStartItems);

  if (startBtn && startScreen) {
    startBtn.addEventListener('click', function() {
      // 不再读取 playerNameInput，直接开始游戏
      currentPlayerName = '';
      startScreen.style.display = 'none';
      startGame();
    });
  }

  // 监听游戏结束事件，显示遮罩层和分数
  window.addEventListener('gameover', function(e) {
    if (gameOverScreen && finalScore) {
      const score = e.detail.score || 0;
      lastScore = score;
      finalScore.textContent = '最终得分：' + score;
      let rankList = getRankList();
      // 判断是否进入前十
      let tenthScore = rankList.length < 10 ? 0 : rankList[9].score;
      if (score > tenthScore || rankList.length < 10) {
        // 弹窗输入姓名
        if (congratsModal && playerNameEndInput && confirmNameBtn) {
          congratsModal.style.display = 'flex';
          rankListEnd.style.display = 'none';
          playerNameEndInput.value = '';
          playerNameEndInput.focus();
          lastHighlightName = '';
        }
      } else {
        // 直接显示榜单
        congratsModal.style.display = 'none';
        rankListEnd.style.display = 'flex';
        lastHighlightName = '';
        renderRankList(rankList, rankListEndItems, lastHighlightName);
      }
      gameOverScreen.style.display = 'flex';
    }
  });

  // 重新开始按钮逻辑
  if (confirmNameBtn) {
    confirmNameBtn.addEventListener('click', function() {
      let name = playerNameEndInput.value.trim();
      if (!name) {
        playerNameEndInput.focus();
        return;
      }
      let rankList = getRankList();
      rankList.push({ name, score: lastScore });
      rankList = rankList.sort((a, b) => b.score - a.score).slice(0, 10);
      saveRankList(rankList);
      lastHighlightName = name;
      renderRankList(rankList, rankListEndItems, lastHighlightName);
      congratsModal.style.display = 'none';
      rankListEnd.style.display = 'flex';
    });
  }

  if (restartBtn) {
    restartBtn.addEventListener('click', function() {
      // 重新开始游戏
      if (gameOverScreen) gameOverScreen.style.display = 'none';
      if (congratsModal) congratsModal.style.display = 'none';
      if (rankListEnd) rankListEnd.style.display = 'none';
      startGame();
    });
  }
};
