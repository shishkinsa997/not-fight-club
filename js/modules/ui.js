export function initUI() {
  let gameModule = null;
  let gameData = null;
  let gameStore = null;
  let selectedRegistrationCharacterId = null;


  function init(game, data, store) {
    gameModule = game;
    gameData = data;
    gameStore = store;

    setupEventListeners();
    renderCurrentPhase();
    // По умолчанию выбран крош
    if (gameData && gameData.player && gameData.player.id) {
      selectedRegistrationCharacterId = gameData.player.id;
    }
  }

  function setupEventListeners() {
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

    // Выбор персонажа
    document.addEventListener("click", (e) => {
      const characterOption = e.target.closest(".character-option");
      if (characterOption) {
        const characterId = characterOption.getAttribute("data-character-id");
        if (characterId) {
          selectCharacter(characterId);
        }
      }
    });

    // Выбор персонажа регистрация
    document.addEventListener("click", (e) => {
      const regOption = e.target.closest(".character-option-reg");
      if (regOption) {
        const characterId = regOption.getAttribute("data-character-id");
        if (characterId) {
          selectedRegistrationCharacterId = characterId;
          updateRegistrationSelection(characterId);
        }
      }
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
      alert("Pick 1 Attack zone and 2 Defence zones");
      return;
    }



    const playerAction = {
      attack: attackZone.value,
      defends: Array.from(defenceZones).map((input) => input.value),
    };

    //TODO: Дизейблить атаку при начале боя
    const state = gameStore.getState();
    const enemy = state.currentEnemy;

    const attackBtn = document.querySelector(".btn-attack");

    if (state.currentEnemy.hp === 0 || state.player.hp === 0) {
      if (attackBtn) attackBtn.disabled = true;
    }

    const enemyAction = {
      attacks: gameModule.pickUniqueZones(gameData.ZONES, enemy.attackCount),
      defends: gameModule.pickUniqueZones(gameData.ZONES, enemy.blockCount),
    };

    const events = gameModule.resolveTurn(playerAction, enemyAction);

    updateBattleUI();
    renderBattleLogs();

    const overlay = document.querySelector(".win-message-overlay");
    const msg = document.getElementById("win-message");
    const msgButton = document.getElementById("win-message-button");

    // Проверяем окончание боя
    if (state.currentEnemy.hp === 0 || state.player.hp === 0) {
      if (attackBtn) attackBtn.disabled = true;
      setTimeout(() => {
        const result = state.currentFight?.result;
        if (result) {
          window.showWinMessage = function (message, btn) {
            if (overlay && msg && msgButton) {
              msg.textContent = message;
              msgButton.textContent = btn;
              overlay.style.display = "flex";
            }
            // Кнопка закрытия и Thanks
            const closeBtn = overlay.querySelector(".win-message-close");
            // const thanksBtn = overlay.querySelector('#win-message-thanks');
            function hide() {
              overlay.style.display = "none";
              gameModule.setGamePhase("main");
              renderCurrentPhase();
            }
            if (closeBtn) closeBtn.onclick = hide;
            msgButton.onclick = hide;
            if (attackBtn) attackBtn.disabled = false;

            // if (thanksBtn) thanksBtn.onclick = hide;
          };

          // alert(result.message);
          // gameModule.setGamePhase("main");
          // renderCurrentPhase();
            if (window.showWinMessage) window.showWinMessage(result.message, result.btn);

        }
      }, 1000);
    }
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
          head: "head",
          neck: "neck",
          body: "body",
          belly: "belly",
          legs: "legs",
        };

        const who = log.who === "player" ? "You" : "Enemy";
        const target = log.target === "player" ? "you" : "enemy";
        const zone = zoneNames[log.zone] || log.zone;
        const damage = log.damage;

        let logText = `${who} attack ${target} to ${zone}`;

        if (log.blocked) {
          logText += " - blocked!";
        } else if (log.damage > 0) {
          logText += ` and do ${damage} damage`;
          if (log.crit) {
            logText += " (CRIT!)";
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

    const battleContent = document.getElementById("battle-content");
    if (battleContent) battleContent.style.display = "none";

    const registrationScreen = document.getElementById("registration-screen");
    if (registrationScreen)
      registrationScreen.style.display = "none";
  }

  // Рендер главного экрана
  function renderMainScreen() {
    const state = gameStore.getState();
    const player = state.player;

    if (!player) {
      showRegistrationScreen();
      return;
    }

    const mainScreen = document.getElementById("main-screen");
    if (mainScreen) {
      mainScreen.style.display = "block";

      const winsElement = document.getElementById("player-wins");
      const lossesElement = document.getElementById("player-losses");
      if (winsElement) winsElement.textContent = player.wins;
      if (lossesElement) lossesElement.textContent = player.losses;

      const titleElement = mainScreen.querySelector("h1");

      if (titleElement)
        titleElement.textContent = `Welcome, ${player.name}!`;
    }
  }

  // Рендер экрана персонажа
  function renderCharacterScreen() {
    const state = gameStore.getState();
    const player = state.player;

    if (!player) return;

    const characterScreen = document.getElementById("character-screen");
    if (characterScreen) {
      characterScreen.style.display = "block";

      updateCharacterDisplay(player);

      updateCharacterSelection(player.id);
    }
  }

  // TODO: Добавить абилки для персонажей

  // Обновление отображения персонажа
  function updateCharacterDisplay(player) {
    const nameElement = document.getElementById("character-name");
    const hpElement = document.getElementById("character-hp");
    const damageElement = document.getElementById("character-damage");
    const critElement = document.getElementById("character-crit");
    const critMultElement = document.getElementById("character-crit-mult");
    const winsElement = document.getElementById("character-wins");
    const lossesElement = document.getElementById("character-losses");
    const avatarElement = document.getElementById("selected-character-avatar");
    const weaponElement = document.getElementById("character-weapon");

    const hpElementBar = document.getElementById("character-hp-bar");
    const damageElementBar = document.getElementById("character-damage-bar");
    const critElementBar = document.getElementById("character-crit-bar");
    const critMultElementBar = document.getElementById("character-crit-mult-bar");

    const stats = gameStore.getState().characterStats[player.id];
    // const char = stats.player;

    if (nameElement) nameElement.textContent = player.name;
    if (hpElement) hpElement.textContent = player.hpMax;
    if (damageElement) damageElement.textContent = player.damage;
    if (critElement)
      critElement.textContent = (player.critChance * 100).toFixed(1);
    if (critMultElement) critMultElement.textContent = player.critMultiplier;
    if (winsElement) winsElement.textContent = stats?.wins ?? 0;
    if (lossesElement) lossesElement.textContent = stats?.losses ?? 0;
    if (avatarElement) avatarElement.src = player.avatar;
    if (weaponElement) weaponElement.textContent = player.weapon;

    if (hpElementBar)
      hpElementBar.style.width = (player.hpMax * 100) / 150 + "%";
    if (damageElementBar)
      damageElementBar.style.width = (player.damage * 100) / 30 + "%";
    if (critElementBar)
      critElementBar.style.width = (player.critChance * 10000) / 30 + "%";
    if (critMultElementBar)
      critMultElementBar.style.width = (player.critMultiplier * 100) / 3 + "%";
  }

function updateCharacterSelection(selectedId) {
  document.querySelectorAll(".character-option").forEach((option) => {
    option.classList.remove("selected");
    option.removeAttribute("selected"); // удаляем старый атрибут
  });

  const selectedOption = document.querySelector(
    `.character-option[data-character-id="${selectedId}"]`
  );
  if (selectedOption) {
    selectedOption.classList.add("selected");
    selectedOption.setAttribute("selected", "selected"); // добавляем атрибут
  }
}

  //Обновляем выбор
  function updateRegistrationSelection(selectedId) {
    document.querySelectorAll(".character-option-reg").forEach((option) => {
      option.classList.remove("selected");
      option.removeAttribute("selected");
    });

    const selectedOption = document.querySelector(
      `.character-option-reg[data-character-id="${selectedId}"]`
    );
    if (selectedOption) {
      selectedOption.classList.add("selected");
      selectedOption.setAttribute("selected", "selected");
    }
  }

  function selectCharacter(characterId) {
    const newPlayer = gameData.getPlayerById(characterId);
    if (newPlayer) {
      const currentPlayer = gameStore.getState().player;
      if (currentPlayer) {
        newPlayer.wins = currentPlayer.wins;
        newPlayer.losses = currentPlayer.losses;
      }

      gameStore.updatePlayer(newPlayer);

      updateCharacterDisplay(newPlayer);
      updateCharacterSelection(characterId);

      showMessage(`Character changed to ${newPlayer.name}!`);
    }
  }

  function showMessage(text) {
    const message = document.createElement("div");
    message.className = "message";
    message.textContent = text;
    message.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: var(--save);
      color: white;
      padding: 12px 24px;
      border-radius: 8px;
      font-weight: 600;
      z-index: 1000;
      animation: slideIn 0.3s ease-out;
    `;

    document.body.appendChild(message);

    setTimeout(() => {
      message.remove();
    }, 3000);
  }

  // Рендер экрана настроек
  function renderSettingsScreen() {
    const state = gameStore.getState();
    const player = state.player;

    if (!player) return;

    const settingsScreen = document.getElementById("settings-screen");
    if (settingsScreen) {
      settingsScreen.style.display = "block";

      const nameInput = document.getElementById("player-name");
      if (nameInput) nameInput.value = player.name;
    }
  }

  // Смена темы

  const root = document.documentElement;

  function changeRootVariable(name, value) {
    document.documentElement.style.setProperty(name, value);
  }
  document.getElementById('lightButton').onclick = switchLight;
  document.getElementById('grayButton').onclick = switchGray;
  document.getElementById('darkButton').onclick = switchDark;
  document.getElementById('blackButton').onclick = switchBlack;

  function switchLight() {
    changeRootVariable('--border-color', '#e4e4e7');
    changeRootVariable('--btn-primary', '#ff62a3e0');
    changeRootVariable('--secondary', '#9462ff');
    changeRootVariable('--shadow', '#ff62a33c');
    changeRootVariable('--hover', '#ff4492');
    changeRootVariable('--bg-primary', '#ffffff');
    changeRootVariable('--bg-secondary', '#f9fafb');
    changeRootVariable('--text-primary', '#18181b');
    changeRootVariable('--text-secondary', '#71717a');
    changeRootVariable('--text-reverse', '#fef2f2');
    changeRootVariable('--save', '#10b981');
    changeRootVariable('--save-hover', '#059669');
    changeRootVariable('--invert', '0');
  }

  function switchGray() {
    changeRootVariable('--border-color', '#e2e8f0');
    changeRootVariable('--btn-primary', '#64748b');
    changeRootVariable('--secondary', '#94a3b8');
    changeRootVariable('--shadow', '#64748b39');
    changeRootVariable('--hover', '#475569');
    changeRootVariable('--bg-primary', '#f8fafc');
    changeRootVariable('--bg-secondary', '#f1f5f9');
    changeRootVariable('--text-primary', '#1e293b');
    changeRootVariable('--text-secondary', '#64748b');
    changeRootVariable('--text-reverse', '#f8fafc');
    changeRootVariable('--save', '#64748b');
    changeRootVariable('--save-hover', '#475569');
    changeRootVariable('--invert', '0');
  }

  function switchDark() {
    changeRootVariable('--border-color', '#556075ff');
    changeRootVariable('--btn-primary', '#ff6262ff');
    changeRootVariable('--secondary', '#9333ea');
    changeRootVariable('--shadow', '#ff626240');
    changeRootVariable('--hover', '#ff3f3fff');
    changeRootVariable('--bg-primary', '#323b4aff');
    changeRootVariable('--bg-secondary', '#3c4658ff');
    changeRootVariable('--text-primary', '#ffffffff');
    changeRootVariable('--text-secondary', '#d7d7d7ff');
    changeRootVariable('--text-reverse', '#313131ff');
    changeRootVariable('--save', '#10b981');
    changeRootVariable('--save-hover', '#059669');
    changeRootVariable('--invert', '1');
  }

  function switchBlack() {
    changeRootVariable('--border-color', '#404040ff');
    changeRootVariable('--btn-primary', '#9333ea');
    changeRootVariable('--secondary', '#ff6262ff');
    changeRootVariable('--shadow', '#9333ea40');
    changeRootVariable('--hover', '#6d28d9');
    changeRootVariable('--bg-primary', '#222222ff');
    changeRootVariable('--bg-secondary', '#353535ff');
    changeRootVariable('--text-primary', '#e5e5e5');
    changeRootVariable('--text-secondary', '#a3a3a3');
    changeRootVariable('--text-reverse', '#ffffff');
    changeRootVariable('--save', '#10b981');
    changeRootVariable('--save-hover', '#059669');
    changeRootVariable('--invert', '1');
  }


  // Рендер экрана боя
  function renderBattleScreen() {
    const state = gameStore.getState();
    const player = state.player;
    const enemy = state.currentEnemy;

    if (!player || !enemy) return;

    const battleScreen = document.getElementById("battle-screen");
    const battleContent = document.getElementById("battle-content");

    if (battleScreen) battleScreen.style.display = "flex";
    if (battleContent) battleContent.style.display = "flex";

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

    updateBattleUI();

    renderBattleLogs();
  }

  // Показать экран регистрации
  function showRegistrationScreen() {
    hideAllScreens();

    // const mainContent = document.querySelector(".main");
    const registrationScreen = document.getElementById("registration-screen");
    if (registrationScreen) {
      registrationScreen.style.display = "flex";

      //УБРАТЬ?
      // Подсветка персонажа при регистрации
      // if (!selectedRegistrationCharacterId && gameData && gameData.player) {
      //   selectedRegistrationCharacterId = gameData.player.id;
      // }
      // updateRegistrationSelection(selectedRegistrationCharacterId);

      // mainContent.appendChild(registrationScreen);
    }
  }

  window.showRegistrationScreen = showRegistrationScreen;

  window.startNewBattle = () => {
    gameModule.startNewFight();
    renderCurrentPhase();
  };

  window.createPlayer = () => {
    const nameInput = document.getElementById("player-name-input");
    const name = nameInput.value.trim();

    //TODO: Добавить ресет профиля

    // Теперь сохраняет выбранного персонажа с именем
    if (name) {
      const chosenId =
        selectedRegistrationCharacterId ||
        (gameData && gameData.player && gameData.player.id);
      const base =
        (chosenId && gameData.getPlayerById(chosenId)) || gameData.player;
      const player = {
        ...base,
        name,
        wins: 0,
        losses: 0,
        hp: base.hpMax,
      };
      gameStore.updatePlayer(player);
      gameModule.setGamePhase("main");
      renderCurrentPhase();
    } else {
      alert("Please, enter your name!");
    }
  };

  window.updatePlayerName = () => {
    const nameInput = document.getElementById("player-name");
    const name = nameInput.value.trim();

    if (name) {
      gameModule.updatePlayerName(name);
      alert("Name updated!");
      renderCurrentPhase();
    } else {
      alert("Please, enter your name!");
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
