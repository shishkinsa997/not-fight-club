export function initUI() {
  const battleLog = { who: 'player'|'enemy', target: 'enemy'|'player', zone: 'head', dmg: 10, crit: boolean, blocked: boolean, turn: 3,
    ts: Date.now() }

  const pct = (entity.hp / entity.hpMax) * 100;
  element.style.width = pct + '%';

}
