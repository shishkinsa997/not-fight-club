export function initStore() {
  const STORAGE_KEY = "not-fight-club-game";

  let gameState = {
    player: null,
    currentEnemy: null,
    currentFight: null,
    gamePhase: "main",
    battleLogs: [],
    characterStats: {},
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

  loadState();

  return {
    getState() {
      return { ...gameState };
    },

    updateState(newState) {
      gameState = { ...gameState, ...newState };
      saveState();
    },

    updatePlayer(player) {
      gameState.player = player;
      saveState();
    },

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

    updateFight(fightData) {
      gameState.currentFight = { ...gameState.currentFight, ...fightData };
      saveState();
    },

    addBattleLog(log) {
      if (!gameState.currentFight) return;
      gameState.currentFight.logs.push(log);
      saveState();
    },

    //TODO: Добавить сохранение побед/поражений для каждого персонажа

    finishFight(result) {
      if (gameState.currentFight) {
        gameState.currentFight.inProgress = false;
        gameState.currentFight.result = result;

        if (gameState.player) {
          // Глобальная статистика игрока
          if (result.winner === "player") {
            gameState.player.wins++;
          } else {
            gameState.player.losses++;
          }

          // Статистика по персонажу
          const id = gameState.player.id;
          if (!gameState.characterStats[id]) {
            gameState.characterStats[id] = { wins: 0, losses: 0 };
          }
          if (result.winner === "player") {
            gameState.characterStats[id].wins++;
          } else {
            gameState.characterStats[id].losses++;
          }
        }
      }
      saveState();
    },

    setGamePhase(phase) {
      gameState.gamePhase = phase;
      saveState();
    },

    resetGame() {
      gameState = {
        player: null,
        currentEnemy: null,
        currentFight: null,
        gamePhase: "main",
        battleLogs: [],
        characterStats: {},
      };
      localStorage.removeItem(STORAGE_KEY);
    },
  };
}
