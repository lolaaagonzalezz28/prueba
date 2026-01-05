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
    hair: ["long"]
  },

  stats: {
    skipGym: 0,
    junkFood: 0,
    sleepLate: 0,
    workouts: 0
  },

  achievements: {},
  claimedAchievements: []
};

let activeTab = "home";

/* ---------- DATA ---------- */

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
    aspectImpact: { salud: 5, disciplina: 5 }
  }
];

const shopItems = [
  { id: "perm_skipGym", name: "Permiso: faltar al gym", price: 40, key: "skipGym" },
  { id: "perm_junkFood", name: "Permiso: comida chatarra", price: 30, key: "junkFood" },
  { id: "perm_sleepLate", name: "Permiso: dormir tarde", price: 25, key: "sleepLate" }
];

const achievements = [
  {
    id: "firstWorkout",
    title: "Primer entrenamiento",
    hidden: false,
    condition: () => gameData.stats.workouts >= 1,
    reward: { coins: 30 }
  },
  {
    id: "gymGhost",
    title: "Fantasma del gym",
    hidden: true,
    condition: () => gameData.stats.skipGym >= 3,
    reward: { outfit: "hoodie" }
  }
];

/* ---------- NAV ---------- */

function setTab(tab) {
  activeTab = tab;

  document.querySelectorAll(".bottom-nav button")
    .forEach(b => b.classList.remove("active"));

  const tabs = ["home", "character", "aspects", "shop", "achievements"];
  const index = tabs.indexOf(tab);
  if (index !== -1) {
    document.querySelectorAll(".bottom-nav button")[index]
      .classList.add("active");
  }

  render();
}

/* ---------- GUARDAR ---------- */

function saveGame() {
  localStorage.setItem("lifeRPG", JSON.stringify(gameData));
}

/* ---------- HÁBITOS ---------- */

function doHabit(id) {
  const habit = habits.find(h => h.id === id);
  if (!habit) return;

  if (habit.type === "bad") {
    gameData.stats[id]++;

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
  for (let k in impact) {
    gameData.aspects[k] += impact[k];
    gameData.aspects[k] = Math.max(0, Math.min(100, gameData.aspects[k]));
  }
}

/* ---------- TIENDA ---------- */

function buyPermission(id) {
  const item = shopItems.find(i => i.id === id);
  if (!item) return;

  if (gameData.coins < item.price) {
    alert("No tenés monedas suficientes");
    return;
  }

  gameData.coins -= item.price;
  gameData.permissions[item.key]++;
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
  if (gameData.claimedAchievements.includes(id)) return;
  const ach = achievements.find(a => a.id === id);
  if (!ach) return;

  if (ach.reward.coins) gameData.coins += ach.reward.coins;
  if (ach.reward.outfit) gameData.unlocked.outfits.push(ach.reward.outfit);

  gameData.claimedAchievements.push(id);
  saveGame();
  render();
}

/* ---------- ANIMACIÓN ---------- */

function playPermissionAnimation() {
  const el = document.getElementById("permissionAnimation");
  if (!el) return;
  el.classList.add("show");
  setTimeout(() => el.classList.remove("show"), 800);
}

/* ---------- RADAR ---------- */

function drawRadar() {
  const canvas = document.getElementById("radar");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  const values = Object.values(gameData.aspects);
  const cx = canvas.width / 2;
  const cy = canvas.height / 2;
  const r = 80;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.beginPath();

  values.forEach((v, i) => {
    const angle = (Math.PI * 2 / values.length) * i - Math.PI / 2;
    const x = cx + Math.cos(angle) * r * (v / 100);
    const y = cy + Math.sin(angle) * r * (v / 100);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });

  ctx.closePath();
  ctx.fillStyle = "rgba(0,0,0,0.15)";
  ctx.fill();
}

/* ---------- RENDERS ---------- */

function renderHome() {
  app.innerHTML = `
    <h2>Hábitos</h2>
    ${habits.map(h => `
      <button class="habit-btn ${h.type}" onclick="doHabit('${h.id}')">
        ${h.name}
      </button>
    `).join("")}
  `;
}

function renderCharacter() {
  app.innerHTML = `
    <h2>Personaje</h2>
    <p>Vida: ❤️ ${gameData.life}</p>
  `;
}

function renderAspects() {
  app.innerHTML = `
    <h2>Aspectos</h2>
    <canvas id="radar" width="240" height="240"></canvas>
  `;
  drawRadar();
}

function renderShop() {
  app.innerHTML = `
    <h2>Tienda</h2>
    ${shopItems.map(i => `
      <div class="shop-item">
        <strong>${i.name}</strong>
        <button onclick="buyPermission('${i.id}')">
          Comprar (${i.price}🪙)
        </button>
      </div>
    `).join("")}
  `;
}

function renderAchievements() {
  app.innerHTML = `
    <h2>Logros</h2>
    ${achievements.map(a => {
      if (a.hidden && !gameData.achievements[a.id]) return "";
      return `
        <div class="achievement">
          <strong>${a.title}</strong>
          ${gameData.achievements[a.id] && !gameData.claimedAchievements.includes(a.id)
            ? `<button onclick="claimAchievement('${a.id}')">Reclamar</button>`
            : gameData.claimedAchievements.includes(a.id)
              ? "<span>Completado</span>"
              : "<span>Bloqueado</span>"
          }
        </div>
      `;
    }).join("")}
  `;
}

/* ---------- RENDER GENERAL ---------- */

function render() {
  window.app = document.getElementById("app");
  document.getElementById("life").innerText = gameData.life;
  document.getElementById("coins").innerText = gameData.coins;

  if (activeTab === "home") renderHome();
  if (activeTab === "character") renderCharacter();
  if (activeTab === "aspects") renderAspects();
  if (activeTab === "shop") renderShop();
  if (activeTab === "achievements") renderAchievements();
}

/* ---------- INIT ---------- */

render();
