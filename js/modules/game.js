export function initGame() {
  let gameData = null;
  let gameStore = null;

  function init(data, store) {
    gameData = data;
    gameStore = store;

    // if (!gameStore.getState().player) {
    //   gameStore.updatePlayer({ ...gameData.player });
    // }
  }

  //TODO: Добавить при атаках игрока в одни и те же зоны, блочить эти зоны
  function pickUniqueZones(zones, count) {
    const copy = [...zones];
    const result = [];
    for (let i = 0; i < count && copy.length > 0; i++) {
      const idx = Math.floor(Math.random() * copy.length);
      result.push(copy.splice(idx, 1)[0]);
    }
    return result;
  }

  function resolveTurn(playerAction, enemyAction) {
    const events = [];
    const state = gameStore.getState();
    const player = state.player;
    const enemy = state.currentEnemy;

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

    enemy.hp = Math.max(0, enemy.hp);
    player.hp = Math.max(0, player.hp);

    gameStore.updatePlayer(player);
    gameStore.updateState(enemy);

    events.forEach((event) => {
      gameStore.addBattleLog(event);
    });

    if (enemy.hp === 0 || player.hp === 0) {
      finishFight();
    } else {
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

    // FIX: Исправить появление окна с ничьей
    let result;
    if (enemy.hp === 0) {
      result = {
        winner: "player",
        message: "YOU WIN! this time",
        btn: "Easy",
      };
    } else if (enemy.hp === 0 && player.hp === 0) {
      result = {
        winner: "draw",
        message: "DRAW!",
        btn: "Next fight",
      };
    } else {
      result = {
        winner: "enemy",
        message: "YOU DIED!",
        btn: "Oh, no",
      };
    }

    gameStore.finishFight(result);

  }

  function startNewFight() {
    const enemy = gameData.getRandomEnemy();
    const player = gameStore.getState().player;
    gameData.resetEnemy(enemy);
    gameData.resetCharacter(player);
    player.hp = player.hpMax;
    gameStore.updatePlayer(player);
    
    gameStore.startNewFight(enemy);
  }

  function getCurrentState() {
    return gameStore.getState();
  }

  function updatePlayerName(name) {
    const state = gameStore.getState();
    const player = { ...state.player, name };
    gameStore.updatePlayer(player);
  }

  function updatePlayerAvatar(avatar) {
    const state = gameStore.getState();
    const player = { ...state.player, avatar };
    gameStore.updatePlayer(player);
  }

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
