export function initGame() {
  let gameData = null;
  let gameStore = null;

  // Инициализация игры
  function init(data, store) {
    gameData = data;
    gameStore = store;

    // Если нет игрока, создаем нового
    if (!gameStore.getState().player) {
      gameStore.updatePlayer({ ...gameData.player });
    }
  }

  // Выбор уникальных зон
  function pickUniqueZones(zones, count) {
    const copy = [...zones];
    const result = [];
    for (let i = 0; i < count && copy.length > 0; i++) {
      const idx = Math.floor(Math.random() * copy.length);
      result.push(copy.splice(idx, 1)[0]);
    }
    return result;
  }

  // Разрешение хода
  function resolveTurn(playerAction, enemyAction) {
    const events = [];
    const state = gameStore.getState();
    const player = state.player;
    const enemy = state.currentEnemy;

    // Атака игрока
    const playerIsCrit = Math.random() < player.critChance;
    const enemyBlockedPlayer = enemyAction.defends.includes(
      playerAction.attack
    );
    let playerDamage = player.damage;

    if (playerIsCrit) {
      playerDamage *= player.critMultiplier;
    }

    if (playerIsCrit || !enemyBlockedPlayer) {
      // Если крит или удар не заблокирован
      enemy.hp -= Math.round(playerDamage);
      events.push({
        who: "player",
        target: "enemy",
        zone: playerAction.attack,
        damage: Math.round(playerDamage),
        crit: playerIsCrit,
        blocked: false,
      });
    } else {
      events.push({
        who: "player",
        target: "enemy",
        zone: playerAction.attack,
        damage: 0,
        crit: false,
        blocked: true,
      });
    }

    // Атака противника
    enemyAction.attacks.forEach((zone) => {
      const enemyIsCrit = Math.random() < enemy.critChance;
      let enemyDamage = enemy.damage;

      if (enemyIsCrit) {
        enemyDamage *= enemy.critMultiplier;
      }

      const playerBlocked = playerAction.defends.includes(zone);

      if (enemyIsCrit || !playerBlocked) {
        // Если крит или удар не заблокирован
        player.hp -= Math.round(enemyDamage);
        events.push({
          who: "enemy",
          target: "player",
          zone: zone,
          damage: Math.round(enemyDamage),
          crit: enemyIsCrit,
          blocked: false,
        });
      } else {
        events.push({
          who: "enemy",
          target: "player",
          zone: zone,
          damage: 0,
          crit: false,
          blocked: true,
        });
      }
    });

    // Ограничиваем здоровье до 0
    enemy.hp = Math.max(0, enemy.hp);
    player.hp = Math.max(0, player.hp);

    // Обновляем состояние
    gameStore.updatePlayer(player);
    gameStore.updateState({ currentEnemy: enemy });

    // Добавляем события в лог
    events.forEach((event) => {
      gameStore.addBattleLog(event);
    });

    // Проверяем окончание боя
    if (enemy.hp === 0 || player.hp === 0) {
      finishFight();
    } else {
      // Увеличиваем ход
      const currentFight = gameStore.getState().currentFight;
      gameStore.updateFight({ turn: currentFight.turn + 1 });
    }

    return events;
  }

  // Завершение боя
  function finishFight() {
    const state = gameStore.getState();
    const player = state.player;
    const enemy = state.currentEnemy;

    let result;
    if (enemy.hp === 0) {
      result = { winner: "player", message: "YOU WIN! this time" };
    } else {
      result = {
        winner: "enemy",
        message: "YOU DIED!",
      };
    }

    gameStore.finishFight(result);
  }

  // Начать новый бой
  function startNewFight() {
    const enemy = gameData.getRandomEnemy();
    gameData.resetEnemy(enemy);
    gameStore.startNewFight(enemy);
  }

  // Получить текущее состояние
  function getCurrentState() {
    return gameStore.getState();
  }

  // Обновить имя игрока
  function updatePlayerName(name) {
    const state = gameStore.getState();
    const player = { ...state.player, name };
    gameStore.updatePlayer(player);
  }

  // Обновить аватар игрока
  function updatePlayerAvatar(avatar) {
    const state = gameStore.getState();
    const player = { ...state.player, avatar };
    gameStore.updatePlayer(player);
  }

  // Сменить фазу игры
  function setGamePhase(phase) {
    gameStore.setGamePhase(phase);
  }

  return {
    init,
    startNewFight,
    resolveTurn,
    getCurrentState,
    updatePlayerName,
    updatePlayerAvatar,
    setGamePhase,
    pickUniqueZones,
  };
}
