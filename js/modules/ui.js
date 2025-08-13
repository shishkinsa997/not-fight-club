export function initUI() {
  let gameModule = null;
  let gameData = null;
  let gameStore = null;

  // Инициализация UI
  function init(game, data, store) {
    gameModule = game;
    gameData = data;
    gameStore = store;

    setupEventListeners();
    renderCurrentPhase();
  }

  // Настройка обработчиков событий
  function setupEventListeners() {
    // Навигация
    document.querySelectorAll(".navigation a").forEach((link) => {
      link.addEventListener("click", (e) => {
        e.preventDefault();
        const phase = e.currentTarget.getAttribute("data-phase");
        if (phase) {
          gameModule.setGamePhase(phase);
          renderCurrentPhase();
        }
      });
    });
  }

  // Обработка атаки
  function handleAttack() {
    const attackZone = document.querySelector(
      '#battle-screen input[name="attack"]:checked'
    );
    const defenceZones = document.querySelectorAll(
      '#battle-screen input[name="defence"]:checked'
    );

    if (!attackZone || defenceZones.length !== 2) {
      alert("Выберите 1 зону для атаки и 2 зоны для защиты!");
      return;
    }

    const playerAction = {
      attack: attackZone.value,
      defends: Array.from(defenceZones).map((input) => input.value),
    };

    const state = gameStore.getState();
    const enemy = state.currentEnemy;

    // Действия противника (случайные)
    const enemyAction = {
      attacks: gameModule.pickUniqueZones(gameData.ZONES, enemy.attackCount),
      defends: gameModule.pickUniqueZones(gameData.ZONES, enemy.blockCount),
    };

    // Разрешаем ход
    const events = gameModule.resolveTurn(playerAction, enemyAction);

    // Обновляем UI
    updateBattleUI();
    renderBattleLogs();

    // Проверяем окончание боя
    if (state.currentEnemy.hp === 0 || state.player.hp === 0) {
      setTimeout(() => {
        const result = state.currentFight?.result;
        if (result) {
          alert(result.message);
          gameModule.setGamePhase("main");
          renderCurrentPhase();
        }
      }, 1000);
    }

    // Сбрасываем выбор зон
    attackZone.checked = false;
    defenceZones.forEach((zone) => (zone.checked = false));
  }

  // Обновление UI боя
  function updateBattleUI() {
    const state = gameStore.getState();
    const player = state.player;
    const enemy = state.currentEnemy;

    if (player) {
      const healthElement = document.getElementById("health");
      const healthBar = document.querySelector(
        "#battle-screen .character-health-bar"
      );
      const healthCount = document.querySelector(
        "#battle-screen .character-health-count span"
      );

      if (healthElement) healthElement.textContent = player.hp;
      if (healthBar) {
        healthBar.value = player.hp;
        healthBar.max = player.hpMax;
      }
      if (healthCount)
        healthCount.textContent = `${player.hp} / ${player.hpMax}`;
    }

    if (enemy) {
      const enemyHealthElement = document.getElementById("health-enemy");
      const enemyHealthBar = document.querySelector(
        "#battle-screen .enemy-health-bar"
      );
      const enemyHealthCount = document.querySelector(
        "#battle-screen .enemy-health-count span"
      );

      if (enemyHealthElement) enemyHealthElement.textContent = enemy.hp;
      if (enemyHealthBar) {
        enemyHealthBar.value = enemy.hp;
        enemyHealthBar.max = enemy.hpMax;
      }
      if (enemyHealthCount)
        enemyHealthCount.textContent = `${enemy.hp} / ${enemy.hpMax}`;
    }
  }

  // Рендер логов боя
  function renderBattleLogs() {
    const state = gameStore.getState();
    const logs = state.currentFight?.logs || [];
    const logsContainer = document.querySelector(
      "#battle-content .battle-logs"
    );

    if (!logsContainer) return;

    logsContainer.innerHTML = logs
      .map((log) => {
        const zoneNames = {
          head: "голову",
          neck: "шею",
          body: "тело",
          belly: "живот",
          legs: "ноги",
        };

        const who = log.who === "player" ? "Вы" : "Противник";
        const target = log.target === "player" ? "вас" : "противника";
        const zone = zoneNames[log.zone] || log.zone;
        const damage = log.damage;

        let logText = `${who} атаковали ${target} в ${zone}`;

        if (log.blocked) {
          logText += " - заблокировано!";
        } else if (log.damage > 0) {
          logText += ` и нанесли ${damage} урона`;
          if (log.crit) {
            logText += " (КРИТИЧЕСКИЙ УДАР!)";
          }
        }

        return `<div class="log-entry ${log.who} ${log.crit ? "crit" : ""} ${
          log.blocked ? "blocked" : ""
        }">${logText}</div>`;
      })
      .join("");

    logsContainer.scrollTop = logsContainer.scrollHeight;
  }

  // Рендер текущей фазы
  function renderCurrentPhase() {
    const state = gameStore.getState();
    const phase = state.gamePhase;

    // Скрываем все экраны
    hideAllScreens();

    switch (phase) {
      case "main":
        renderMainScreen();
        break;
      case "character":
        renderCharacterScreen();
        break;
      case "settings":
        renderSettingsScreen();
        break;
      case "battle":
        renderBattleScreen();
        break;
    }
  }

  // Скрыть все экраны
  function hideAllScreens() {
    const screens = [
      "main-screen",
      "character-screen",
      "settings-screen",
      "battle-screen",
    ];
    screens.forEach((screenId) => {
      const screen = document.getElementById(screenId);
      if (screen) screen.style.display = "none";
    });

    // Скрываем логи боя
    const battleContent = document.getElementById("battle-content");
    if (battleContent) battleContent.style.display = "none";

    // Скрываем экран регистрации
    const registrationScreen = document.getElementById("registration-screen");
    if (registrationScreen) {
      registrationScreen.remove();
    }
  }

  // Рендер главного экрана
  function renderMainScreen() {
    const state = gameStore.getState();
    const player = state.player;

    if (!player) {
      // Показываем экран регистрации
      showRegistrationScreen();
      return;
    }

    // Показываем главный экран
    const mainScreen = document.getElementById("main-screen");
    if (mainScreen) {
      mainScreen.style.display = "block";

      // Обновляем статистику
      const winsElement = document.getElementById("player-wins");
      const lossesElement = document.getElementById("player-losses");
      if (winsElement) winsElement.textContent = player.wins;
      if (lossesElement) lossesElement.textContent = player.losses;

      // Обновляем заголовок
      const titleElement = mainScreen.querySelector("h1");
      if (titleElement)
        titleElement.textContent = `Добро пожаловать, ${player.name}!`;
    }
  }

  // Рендер экрана персонажа
  function renderCharacterScreen() {
    const state = gameStore.getState();
    const player = state.player;

    if (!player) return;

    // Показываем экран персонажа
    const characterScreen = document.getElementById("character-screen");
    if (characterScreen) {
      characterScreen.style.display = "block";

      // Обновляем данные персонажа
      const nameElement = document.getElementById("character-name");
      const hpElement = document.getElementById("character-hp");
      const damageElement = document.getElementById("character-damage");
      const critElement = document.getElementById("character-crit");
      const critMultElement = document.getElementById("character-crit-mult");
      const winsElement = document.getElementById("character-wins");
      const lossesElement = document.getElementById("character-losses");
      const avatarElement = document.querySelector(
        "#character-screen .character-avatar-large"
      );

      if (nameElement) nameElement.textContent = player.name;
      if (hpElement) hpElement.textContent = player.hpMax;
      if (damageElement) damageElement.textContent = player.damage;
      if (critElement)
        critElement.textContent = (player.critChance * 100).toFixed(1);
      if (critMultElement) critMultElement.textContent = player.critMultiplier;
      if (winsElement) winsElement.textContent = player.wins;
      if (lossesElement) lossesElement.textContent = player.losses;
      if (avatarElement) avatarElement.src = player.avatar;
    }
  }

  // Рендер экрана настроек
  function renderSettingsScreen() {
    const state = gameStore.getState();
    const player = state.player;

    if (!player) return;

    // Показываем экран настроек
    const settingsScreen = document.getElementById("settings-screen");
    if (settingsScreen) {
      settingsScreen.style.display = "block";

      // Обновляем поле имени
      const nameInput = document.getElementById("player-name");
      if (nameInput) nameInput.value = player.name;
    }
  }

  // Рендер экрана боя
  function renderBattleScreen() {
    const state = gameStore.getState();
    const player = state.player;
    const enemy = state.currentEnemy;

    if (!player || !enemy) return;

    // Показываем экран боя
    const battleScreen = document.getElementById("battle-screen");
    const battleContent = document.getElementById("battle-content");

    if (battleScreen) battleScreen.style.display = "flex";
    if (battleContent) battleContent.style.display = "flex";

    // Обновляем данные боя
    const characterName = document.querySelector(
      "#battle-screen .character-name"
    );
    const enemyName = document.querySelector("#battle-screen .enemy-name");
    const characterAvatar = document.querySelector(
      "#battle-screen .character-avatar img"
    );
    const enemyAvatar = document.querySelector(
      "#battle-screen .enemy-avatar img"
    );

    if (characterName) characterName.textContent = player.name;
    if (enemyName) enemyName.textContent = enemy.name;
    if (characterAvatar) characterAvatar.src = player.avatar;
    if (enemyAvatar) enemyAvatar.src = enemy.avatar;

    // Обновляем здоровье
    updateBattleUI();

    // Рендерим логи
    renderBattleLogs();
  }

  // Показать экран регистрации
  function showRegistrationScreen() {
    // Скрываем все экраны
    hideAllScreens();

    // Создаем экран регистрации
    const mainContent = document.querySelector(".main");
    if (mainContent) {
      const registrationScreen = document.createElement("div");
      registrationScreen.className = "main-content";
      registrationScreen.id = "registration-screen";
      registrationScreen.innerHTML = `
        <div class="registration-screen">
          <h1>Добро пожаловать в Not Fight Club!</h1>
          <div class="registration-form">
            <label for="player-name-input">Введите ваше имя:</label>
            <input type="text" id="player-name-input" placeholder="Ваше имя">
            <button onclick="window.createPlayer()">Создать персонажа</button>
          </div>
        </div>
      `;

      mainContent.appendChild(registrationScreen);
    }
  }

  // Глобальные функции для onclick
  window.startNewBattle = () => {
    gameModule.startNewFight();
    renderCurrentPhase();
  };

  window.createPlayer = () => {
    const nameInput = document.getElementById("player-name-input");
    const name = nameInput.value.trim();

    if (name) {
      const player = { ...gameData.player, name };
      gameStore.updatePlayer(player);
      gameModule.setGamePhase("main");
      renderCurrentPhase();
    } else {
      alert("Пожалуйста, введите имя!");
    }
  };

  window.updatePlayerName = () => {
    const nameInput = document.getElementById("player-name");
    const name = nameInput.value.trim();

    if (name) {
      gameModule.updatePlayerName(name);
      alert("Имя обновлено!");
      // Обновляем UI
      renderCurrentPhase();
    } else {
      alert("Пожалуйста, введите имя!");
    }
  };

  window.handleAttack = handleAttack;

  return {
    init,
    renderCurrentPhase,
    updateBattleUI,
    renderBattleLogs,
  };
}
