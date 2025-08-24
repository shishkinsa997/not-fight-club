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
        const crit = `<span class="crits"><i>CRIT</i><svg width="20px" height="20px" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg" fill="#000000"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"><path fill="#000000" d="M247 16v23.2C134.4 43.81 43.81 134.4 39.2 247H16v18h23.2c4.61 112.6 95.2 203.2 207.8 207.8V496h18v-23.2c112.6-4.6 203.2-95.2 207.8-207.8H496v-18h-23.2C468.2 134.4 377.6 43.81 265 39.2V16h-18zm0 41.21V80h18V57.21C367.8 61.78 450.2 144.2 454.8 247H432v18h22.8c-4.6 102.8-87 185.2-189.8 189.8V432h-18v22.8c-102.8-4.6-185.22-87-189.79-189.8H80v-18H57.21C61.78 144.2 144.2 61.78 247 57.21zm8.9 38.12c-5 0-9.5 1.1-12.9 2.9L126.8 165.3c-7.3 4.1-7.3 10.9 0 15.2L243 247.4c7.2 4.3 18.5 4.3 25.7 0l115.9-66.9c7.4-4.3 7.4-11.1 0-15.2L268.7 98.23c-3.4-1.8-8.3-2.9-12.8-2.9zm-89 62.57c6 .1 11.7 1.6 16 4.1 8 5.7 7.3 14.1-1.5 19.4-9 5.2-23.1 5.6-32.7.8-14.9-9.3-3.4-24.7 18.2-24.3zm178.6.1h2c6 .2 11.7 1.8 15.9 4.2 8.3 5.7 7.7 14.3-1.2 19.6-9.1 5.3-23.4 5.6-33 .7-15-9-4.5-24.1 16.3-24.5zm-89 0c21.4.2 31.8 15.5 16.8 24.5-9.3 6.2-25.2 6.4-35.1.6-9.8-5.8-9.6-15.3.6-20.9 4.7-2.7 11.1-4.3 17.7-4.2zm-141 41c-4.5 0-7.5 3-7.5 9.2v119.7c0 8.4 5.8 18.3 13.2 22.6l111.4 64.4c7.2 4.1 12.9.7 12.9-7.6V287.6c0-8.3-5.7-18.4-12.9-22.5l-111.5-64.5c-2.2-1.1-4.1-1.5-5.6-1.6zm281.3 0c-1.6.1-3.7.5-5.8 1.6l-111.5 64.5c-7.2 4.1-12.9 14.2-12.9 22.5v119.7c0 8.3 5.7 11.7 12.9 7.6L391 350.5c7-4.3 13-14.2 13-22.6V208.2c0-6.2-3-9.2-7.2-9.2zm-185 65.5c11.2.4 24.7 17.3 24.5 31.5.4 11-7.4 15.5-17.2 9.9-9.7-5.7-17.5-19.4-16.9-29.8 0-6.8 3.2-11.2 8.5-11.6h1.1zm130.9 21.8h1.1c5.2.4 8.5 4.8 8.5 11.5-.1 10.5-7.7 23.3-17.1 28.8-9.5 5.5-17.1 1.5-17.2-8.9-.1-14.2 13.5-31.3 24.7-31.4zm-216.9 22.5c11.4-.5 25.5 16.8 25.5 31.3.4 11.1-7.4 15.6-17.2 10.1-9.7-5.7-17.5-19.3-17-29.8 0-6.9 3.3-11.3 8.7-11.6z"></path></g></svg></span>`;
        let logText = `<span class="who">${who}</span> attack <span class="target">${target}</span> to <span class="zone">${zone}</span>`;

        if (log.blocked) {
          logText += " - blocked!";
        } else if (log.damage > 0) {
          logText += ` and deal <span class="dmg">${damage}</span> damage`;
          if (log.crit) {

            logText += `${crit}`;
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

  const filterTabs = document.querySelector(".switcher-tabs");
  const filterButtons = document.querySelectorAll(".switcher-button");

  filterTabs.addEventListener("click", (event) => {
    const root = document.documentElement;
    const targetTranslateValue = event.target.dataset.translateValue;

    if (event.target.classList.contains("switcher-button")) {
      root.style.setProperty("--translate-filters-slider", targetTranslateValue);
      handleActiveTab(filterButtons, event, "switcher-active");
    }
  });
  const handleActiveTab = (tabs, event, className) => {
    // console.log(event.target.id);
    if (event.target.id === "dark") {
      document.documentElement.setAttribute("data-theme", "dark");
    } else if (event.target.id === "black") {
      document.documentElement.setAttribute("data-theme", "black");
    } else {
      document.documentElement.removeAttribute("data-theme");
    }
    tabs.forEach((tab) => {
      tab.classList.remove(className);
    });

    if (!event.target.classList.contains(className)) {
      event.target.classList.add(className);
    }
  };

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

  // То для чего был создан этот проект
  document.querySelector('body').addEventListener('click', function(e) {
    const rect = this.getBoundingClientRect();
    if (e.clientX > rect.right - 200 && e.clientY > rect.bottom - 200) {
      window.open('https://www.youtube.com/watch?v=cMHcmReOg3c', '_blank');
    }
  });

  return {
    init,
    renderCurrentPhase,
    updateBattleUI,
    renderBattleLogs,
  };
}
