import { initGame } from "./modules/game.js";
import { initData } from "./modules/data.js";
import { initUI } from "./modules/ui.js";
import { initStore } from "./modules/store.js";

document.addEventListener("DOMContentLoaded", () => {
  // Инициализируем модули
  const gameData = initData();
  const gameStore = initStore();
  const gameModule = initGame();
  const uiModule = initUI();

  // Инициализируем игру
  gameModule.init(gameData, gameStore);
  uiModule.init(gameModule, gameData, gameStore);
});
