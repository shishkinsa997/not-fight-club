export function initStore() {
  function savePlayer(p) { localStorage.setItem('player', JSON.stringify(p)); }
  function loadPlayer() { return JSON.parse(localStorage.getItem('player')); }

  function saveFight(f) { localStorage.setItem('fight', JSON.stringify(f)); }
  function loadFight() { return JSON.parse(localStorage.getItem('fight')); }
}
