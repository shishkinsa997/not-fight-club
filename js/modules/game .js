export function initGame() {
  // player
  const player = {
    id: 'player',
    name: 'Игрок',
    avatar: 'assets/a1.png',
    hpMax: 100,
    hp: 100,
    damage: 10,         // базовый урон
    critChance: 0.1,    // 10%
    critMultiplier: 1.5,
    wins: 0,
    losses: 0,
  };

  // fight state
  const fight = {
    id: 'fight-123',
    player,
    enemy,
    turn: 1,
    logs: [],       // массив логов
    inProgress: true
  };

  function pickUnique(zones, count) {
    const copy = [...zones];
    const res = [];
    for (let i=0; i<count; i++) {
      const idx = Math.floor(Math.random()*copy.length);
      res.push(copy.splice(idx,1)[0]);
    }
    return res;
  }

  function resolveTurn(playerAction, enemyAction) {
    const events = [];

    // player -> enemy
    const playerIsCrit = Math.random() < player.critChance;
    const enemyBlockedPlayer = enemyAction.defends.includes(playerAction.attack);
    let playerDamage = player.damage;
    if (playerIsCrit) playerDamage *= player.critMultiplier;

    if (playerIsCrit || !enemyBlockedPlayer) {
      // если крит — пробивает блок по условию
      enemy.hp -= Math.round(playerDamage);
      events.push({ who: 'player', target: 'enemy', zone: playerAction.attack, dmg: Math.round(playerDamage), crit: playerIsCrit });
    } else {
      events.push({ who: 'player', target: 'enemy', zone: playerAction.attack, dmg: 0, blocked: true });
    }

    // enemy -> player : для каждого атаки в enemyAction.attacks
    enemyAction.attacks.forEach(zone => {
      const enemyIsCrit = Math.random() < enemy.critChance;
      const dmg = enemy.damage * (enemyIsCrit ? enemy.critMultiplier : 1);
      const playerBlocked = playerAction.defends.includes(zone);
      if (enemyIsCrit || !playerBlocked) {
        player.hp -= Math.round(dmg);
        events.push({ who: 'enemy', target: 'player', zone, dmg: Math.round(dmg), crit: enemyIsCrit });
      } else {
        events.push({ who: 'enemy', target: 'player', zone, dmg: 0, blocked: true });
      }
    });

    // cap hp to 0
    enemy.hp = Math.max(0, enemy.hp);
    player.hp = Math.max(0, player.hp);

    // push events to fight.logs
    fight.logs.push(...events);

    // increase turn, check end
    fight.turn++;
    if (enemy.hp === 0 || player.hp === 0) finishFight();
  }

}
