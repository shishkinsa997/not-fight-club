export function initStore() {
  const STORAGE_KEY = "not-fight-club-game";

  // Состояние игры
  let gameState = {
    player: null,
    currentEnemy: null,
    currentFight: null,
    gamePhase: "main", // main, character, settings, battle
    battleLogs: [],
  };

  // Загрузка состояния из localStorage
  function loadState() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        gameState = { ...gameState, ...JSON.parse(saved) };
      }
    } catch (error) {
      console.error("Ошибка загрузки состояния:", error);
    }
  }

  // Сохранение состояния в localStorage
  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(gameState));
    } catch (error) {
      console.error("Ошибка сохранения состояния:", error);
    }
  }

  // Инициализация
  loadState();

  return {
    // Получить текущее состояние
    getState() {
      return { ...gameState };
    },

    // Обновить состояние
    updateState(newState) {
      gameState = { ...gameState, ...newState };
      saveState();
    },

    // Обновить игрока
    updatePlayer(player) {
      gameState.player = player;
      saveState();
    },

    // Начать новый бой
    startNewFight(enemy) {
      gameState.currentEnemy = { ...enemy };
      gameState.currentFight = {
        id: Date.now().toString(),
        turn: 1,
        inProgress: true,
        logs: [],
      };
      gameState.gamePhase = "battle";
      saveState();
    },

    // Обновить бой
    updateFight(fightData) {
      gameState.currentFight = { ...gameState.currentFight, ...fightData };
      saveState();
    },

    // Добавить лог боя
    addBattleLog(log) {
      if (!gameState.currentFight) return;
      gameState.currentFight.logs.push(log);
      saveState();
    },

    // Завершить бой
    finishFight(result) {
      if (gameState.currentFight) {
        gameState.currentFight.inProgress = false;
        gameState.currentFight.result = result;

        if (gameState.player) {
          if (result.winner === "player") {
            gameState.player.wins++;
          } else {
            gameState.player.losses++;
          }
        }
      }
      saveState();
    },

    // Сменить фазу игры
    setGamePhase(phase) {
      gameState.gamePhase = phase;
      saveState();
    },

    // Сбросить игру
    resetGame() {
      gameState = {
        player: null,
        currentEnemy: null,
        currentFight: null,
        gamePhase: "main",
        battleLogs: [],
      };
      localStorage.removeItem(STORAGE_KEY);
    },
  };
}
