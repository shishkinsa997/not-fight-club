import { initGame } from "./modules/game.js";
import { initData } from "./modules/data.js";
import { initUI } from "./modules/ui.js";
import { initStore } from "./modules/store.js";

document.addEventListener("DOMContentLoaded", () => {
  initGame();
  initData();
  initUI();
  initStore();
});
