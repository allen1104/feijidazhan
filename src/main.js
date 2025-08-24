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
      li.textContent = `${item.player_name} - ${item.score}`;
      if (highlightName && item.player_name === highlightName) {
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

  async function fetchRankListFromAPI() {
    try {
  const res = await fetch('http://localhost:5050/rankings');
      if (res.ok) {
        const data = await res.json();
        return data;
      }
    } catch {}
    return [];
  }

  async function recordGameStart() {
    try {
      // 获取浏览器信息
      const browser = navigator.userAgent;
      // 获取IP（需后端支持或通过第三方服务，前端无法直接获取真实IP，这里留空或由后端补全）
      const ip = '';
      // 获取玩家姓名（优先输入框，其次当前变量）
      let player_name = '';
      if (playerNameInput && playerNameInput.value.trim()) {
        player_name = playerNameInput.value.trim();
      } else if (currentPlayerName) {
        player_name = currentPlayerName;
      }
      await fetch('http://localhost:5050/game_start_logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ player_name, ip, browser })
      });
    } catch {}
  }

  async function recordRanking(player_name, score) {
    try {
  await fetch('http://localhost:5050/rankings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ player_name, score }) });
    } catch {}
  }

  async function updateRankListUI(container, highlightName) {
    const list = await fetchRankListFromAPI();
    renderRankList(list, container, highlightName);
  }

  // 初始化排行榜显示（API）
  updateRankListUI(rankListStartItems);

  if (startBtn && startScreen) {
    startBtn.addEventListener('click', async function() {
      currentPlayerName = '';
      startScreen.style.display = 'none';
      await recordGameStart(); // 记录访问
      await updateRankListUI(rankListStartItems); // 查询最新榜单
      startGame();
    });
  }

  // 监听游戏结束事件，显示遮罩层和分数
  window.addEventListener('gameover', async function(e) {
    if (gameOverScreen && finalScore) {
      const score = e.detail.score || 0;
      lastScore = score;
      finalScore.textContent = '最终得分：' + score;
      let rankList = await fetchRankListFromAPI();
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
        await updateRankListUI(rankListEndItems, lastHighlightName);
      }
      gameOverScreen.style.display = 'flex';
    }
  });

  // 重新开始按钮逻辑
  if (confirmNameBtn) {
    confirmNameBtn.addEventListener('click', async function() {
      let name = playerNameEndInput.value.trim();
      if (!name) {
        playerNameEndInput.focus();
        return;
      }
      await recordRanking(name, lastScore); // 记录排名
      lastHighlightName = name;
      await updateRankListUI(rankListEndItems, lastHighlightName);
      congratsModal.style.display = 'none';
      rankListEnd.style.display = 'flex';
    });
  }

  if (restartBtn) {
    restartBtn.addEventListener('click', async function() {
      // 重新开始游戏
      if (gameOverScreen) gameOverScreen.style.display = 'none';
      if (congratsModal) gameOverScreen.style.display = 'none';
      if (rankListEnd) rankListEnd.style.display = 'none';
      await recordGameStart(); // 记录访问
      await updateRankListUI(rankListStartItems); // 查询最新榜单
      startGame();
    });
  }
}
