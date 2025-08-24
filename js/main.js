import { initGame } from "./modules/game.js";
import { initData } from "./modules/data.js";
import { initUI } from "./modules/ui.js";
import { initStore } from "./modules/store.js";

document.addEventListener("DOMContentLoaded", () => {
  const gameData = initData();
  const gameStore = initStore();
  const gameModule = initGame();
  const uiModule = initUI();

  gameModule.init(gameData, gameStore);
  uiModule.init(gameModule, gameData, gameStore);
    window.gameStore = gameStore;
});

document.getElementById("btn-reset").addEventListener("click", () => {
  if (window.gameStore) {
    window.gameStore.resetGame();
    // Можно добавить перезагрузку страницы для полного сброса
    location.reload();
  }
});