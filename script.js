/* ==========================
   LIFE RPG – SCRIPT PRINCIPAL
   ========================== */

/* ---------- ESTADO DEL JUEGO ---------- */

let gameData = JSON.parse(localStorage.getItem("lifeRPG")) || {
  life: 100,
  coins: 0,

  aspects: {
    salud: 50,
    disciplina: 40,
    social: 30,
    mente: 45,
    energia: 50
  },

  permissions: {
    skipGym: 0,
    junkFood: 0,
    sleepLate: 0
  },

  avatar: {
    gender: "fem",
    skin: "light",
    hair: "long",
    hairColor: "brown",
    eyes: "brown",
    outfit: "basic"
  },

  unlocked: {
    outfits: ["basic"],
    hair: ["long"],
  },

  stats: {
    gymMissed: 0,
    junkFood: 0,
    nightsLate: 0,
    workouts: 0
  },

  achievements: {},

  claimedAchievements: []
};


/* ---------- HÁBITOS ---------- */

const habits = [
  {
    id: "skipGym",
    name: "No ir al gym",
    type: "bad",
    damage: 15,
    permissionKey: "skipGym",
    aspectImpact: { disciplina: -5 }
  },
  {
    id: "junkFood",
    name: "Comer comida chatarra",
    type: "bad",
    damage: 10,
    permissionKey: "junkFood",
    aspectImpact: { salud: -5 }
  },
  {
    id: "sleepLate",
    name: "Dormir tarde",
    type: "bad",
    damage: 8,
    permissionKey: "sleepLate",
    aspectImpact: { energia: -5 }
  },
  {
    id: "workout",
    name: "Entrenar",
    type: "good",
    reward: 10,
    aspectImpact: { salud: +5, disciplina: +5 }
  }
];


/* ---------- TIENDA (SOLO PERMISOS) ---------- */

const shopItems = [
  {
    id: "perm_skipGym",
    name: "Permiso: faltar al gym",
    price: 40,
    permissionKey: "skipGym"
  },
  {
    id: "perm_junkFood",
    name: "Permiso: comida chatarra",
    price: 30,
    permissionKey: "junkFood"
  },
  {
    id: "perm_sleepLate",
    name: "Permiso: dormir tarde",
    price: 25,
    permissionKey: "sleepLate"
  }
];


/* ---------- LOGROS ---------- */

const achievements = [
  {
    id: "firstWorkout",
    title: "Primer entrenamiento",
    condition: () => gameData.stats.workouts >= 1,
    reward: { coins: 30 },
    hidden: false
  },
  {
    id: "gymGhost",
    title: "Fantasma del gym",
    condition: () => gameData.stats.gymMissed >= 3,
    reward: { outfit: "hoodie" },
    hidden: true
  },
  {
    id: "junkQueen",
    title: "Reina del junk",
    condition: () => gameData.stats.junkFood >= 5,
    reward: { hair: "short" },
    hidden: true
  },
  {
    id: "disciplineUp",
    title: "Disciplina en alza",
    condition: () => gameData.aspects.disciplina >= 70,
    reward: { coins: 50 },
    hidden: false
  }
];


/* ---------- GUARDAR ---------- */

function saveGame() {
  localStorage.setItem("lifeRPG", JSON.stringify(gameData));
}


/* ---------- HÁBITOS ---------- */

function doHabit(habitId) {
  const habit = habits.find(h => h.id === habitId);
  if (!habit) return;

  if (habit.type === "bad") {
    gameData.stats[habitId]++;

    if (gameData.permissions[habit.permissionKey] > 0) {
      gameData.permissions[habit.permissionKey]--;
      playPermissionAnimation();
    } else {
      gameData.life -= habit.damage;
      if (gameData.life < 0) gameData.life = 0;
    }
  }

  if (habit.type === "good") {
    gameData.coins += habit.reward;
    gameData.stats.workouts++;
  }

  applyAspectImpact(habit.aspectImpact);
  checkAchievements();
  saveGame();
  render();
}


/* ---------- ASPECTOS ---------- */

function applyAspectImpact(impact) {
  for (let key in impact) {
    gameData.aspects[key] += impact[key];
    if (gameData.aspects[key] < 0) gameData.aspects[key] = 0;
    if (gameData.aspects[key] > 100) gameData.aspects[key] = 100;
  }
}


/* ---------- TIENDA ---------- */

function buyPermission(itemId) {
  const item = shopItems.find(i => i.id === itemId);
  if (!item) return;

  if (gameData.coins < item.price) {
    alert("No tenés monedas suficientes");
    return;
  }

  gameData.coins -= item.price;
  gameData.permissions[item.permissionKey]++;
  saveGame();
  render();
}


/* ---------- LOGROS ---------- */

function checkAchievements() {
  achievements.forEach(a => {
    if (!gameData.achievements[a.id] && a.condition()) {
      gameData.achievements[a.id] = true;
    }
  });
}

function claimAchievement(id) {
  const ach = achievements.find(a => a.id === id);
  if (!ach) return;
  if (gameData.claimedAchievements.includes(id)) return;

  if (ach.reward.coins) {
    gameData.coins += ach.reward.coins;
  }
  if (ach.reward.outfit) {
    gameData.unlocked.outfits.push(ach.reward.outfit);
  }
  if (ach.reward.hair) {
    gameData.unlocked.hair.push(ach.reward.hair);
  }

  gameData.claimedAchievements.push(id);
  saveGame();
  render();
}


/* ---------- AVATAR ---------- */

function updateAvatar(key, value) {
  gameData.avatar[key] = value;
  saveGame();
  render();
}


/* ---------- ANIMACIÓN PERMISO ---------- */

function playPermissionAnimation() {
  const el = document.getElementById("permissionAnimation");
  if (!el) return;

  el.classList.add("show");
  setTimeout(() => el.classList.remove("show"), 900);
}


/* ---------- RADAR ASPECTOS ---------- */

function drawRadar() {
  const canvas = document.getElementById("radar");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const values = Object.values(gameData.aspects);
  const labels = Object.keys(gameData.aspects);

  const cx = canvas.width / 2;
  const cy = canvas.height / 2;
  const radius = 80;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  values.forEach((v, i) => {
    const angle = (Math.PI * 2 / values.length) * i - Math.PI / 2;
    const r = radius * (v / 100);
    const x = cx + Math.cos(angle) * r;
    const y = cy + Math.sin(angle) * r;

    ctx.lineTo(x, y);
  });

  ctx.closePath();
  ctx.fillStyle = "rgba(0,0,0,0.1)";
  ctx.fill();
  ctx.stroke();
}


/* ---------- RENDER ---------- */

function render() {
  document.getElementById("life").innerText = gameData.life;
  document.getElementById("coins").innerText = gameData.coins;

  drawRadar();
}

render();
