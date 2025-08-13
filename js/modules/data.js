export function initData() {
  // enemy (пример пула)
  const enemies = [
    { id: 'spider', name: 'Паук', hpMax: 80, hp: 80, damage: 6, attackCount: 2, blockCount: 1, critChance: 0.05, critMultiplier: 1.5 },
    { id: 'troll',  name: 'Тролль', hpMax: 150, hp: 150, damage: 12, attackCount: 1, blockCount: 3, critChance: 0.08, critMultiplier: 1.25 },
    // ...
  ];

  const ZONES = ['head', 'body', 'left-leg', 'right-leg', 'chest', 'neck']; // минимум 3-4

}
