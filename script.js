/* =========================
   LIFE RPG – SCRIPT GENERAL
   ========================= */

/* ---------- ESTADO BASE ---------- */

const DEFAULT_GAME = {
  day: new Date().toDateString(),

  life: 1000,
  maxLife: 1000,

  coins: 0,

  xp: 0,
  level: 1,

  deathChallenge: "",

  avatar: {
    name: "Mi personaje",
    gender: "fem",
    skin: "light",
    hair: "long",
    hairColor: "brown",
    eyes: "round",
    eyeColor: "brown",
    outfit: "basic"
  },

  unlocked: {
    outfits: ["basic"],
    hair: ["long"]
  },

  aspects: [
    { id: "salud", name: "Salud", xp: 0 },
    { id: "disciplina", name: "Disciplina", xp: 0 },
    { id: "mente", name: "Mente", xp: 0 },
    { id: "social", name: "Social", xp: 0 },
    { id: "energia", name: "Energía", xp: 0 }
  ],

  habits: [],

  permissions: {},

  stats: {
    habitsDone: 0,
    habitsFailed: 0
  },

  achievements: {},
  claimedAchievements: []
};

let game = JSON.parse(localStorage.getItem("lifeRPG")) || structuredClone(DEFAULT_GAME);
let activeTab = "home";

/* ---------- UTILIDADES ---------- */

function saveGame() {
  localStorage.setItem("lifeRPG", JSON.stringify(game));
}

function resetDailyIfNeeded() {
  const today = new Date().toDateString();
  if (game.day !== today) {
    game.day = today;
    game.habits.forEach(h => h.done = null);
    saveGame();
  }
}

/* ---------- EXPERIENCIA ---------- */

function addXP(amount, aspectId = null) {
  game.xp += amount;

  if (aspectId) {
    const asp = game.aspects.find(a => a.id === aspectId);
    if (asp) asp.xp += amount;
  }

  while (game.xp >= game.level * 100) {
    game.xp -= game.level * 100;
    game.level++;
  }
}

/* ---------- VIDA ---------- */

function loseLife(amount) {
  game.life -= amount;
  if (game.life <= 0) {
    game.life = 0;
    handleDeath();
  }
}

function handleDeath() {
  game.coins = Math.floor(game.coins * 0.2);
  game.xp = Math.max(0, game.xp - game.level * 50);
  document.getElementById("deathChallengeScreen").classList.remove("hidden");
  saveGame();
}

/* ---------- HÁBITOS ---------- */

function addHabit() {
  const name = prompt("Nombre del hábito:");
  if (!name) return;

  const aspect = prompt("Aspecto (salud, disciplina, mente, social, energia):");
  const difficulty = Number(prompt("Dificultad 1 a 5:"));

  game.habits.push({
    id: crypto.randomUUID(),
    name,
    aspect,
    difficulty,
    done: null
  });

  saveGame();
  render();
}

function markHabit(id, success) {
  const habit = game.habits.find(h => h.id === id);
  if (!habit || habit.done !== null) return;

  habit.done = success;

  if (success) {
    const xpGain = habit.difficulty * 10;
    game.coins += habit.difficulty * 5;
    addXP(xpGain, habit.aspect);
    game.stats.habitsDone++;
  } else {
    loseLife(habit.difficulty * 20);
    game.stats.habitsFailed++;
  }

  checkAchievements();
  saveGame();
  render();
}

function deleteHabit(id) {
  game.habits = game.habits.filter(h => h.id !== id);
  saveGame();
  render();
}

/* ---------- ASPECTOS ---------- */

function addAspect() {
  const name = prompt("Nombre del aspecto:");
  if (!name) return;

  game.aspects.push({
    id: crypto.randomUUID(),
    name,
    xp: 0
  });

  saveGame();
  render();
}

function deleteAspect(id) {
  game.aspects = game.aspects.filter(a => a.id !== id);
  saveGame();
  render();
}

/* ---------- TIENDA (PERMISOS) ---------- */

const shopPermissions = [
  { id: "skipHabit", name: "Permiso: saltar hábito", price: 50 }
];

function buyPermission(id) {
  const item = shopPermissions.find(p => p.id === id);
  if (!item) return;

  if (game.coins < item.price) {
    alert("Fondos insuficientes");
    return;
  }

  game.coins -= item.price;
  game.permissions[id] = (game.permissions[id] || 0) + 1;

  playPermissionAnimation();
  saveGame();
  render();
}

/* ---------- LOGROS ---------- */

const achievements = [
  {
    id: "firstHabit",
    hidden: false,
    condition: () => game.stats.habitsDone >= 1,
    reward: { coins: 30 }
  },
  {
    id: "discipline5",
    hidden: true,
    condition: () => game.aspects.find(a => a.id === "disciplina")?.xp >= 200,
    reward: { outfit: "hoodie" }
  }
];

function checkAchievements() {
  achievements.forEach(a => {
    if (!game.achievements[a.id] && a.condition()) {
      game.achievements[a.id] = true;
    }
  });
}

function claimAchievement(id) {
  if (game.claimedAchievements.includes(id)) return;

  const ach = achievements.find(a => a.id === id);
  if (!ach) return;

  if (ach.reward.coins) game.coins += ach.reward.coins;
  if (ach.reward.outfit) game.unlocked.outfits.push(ach.reward.outfit);

  game.claimedAchievements.push(id);
  saveGame();
  render();
}

/* ---------- AVATAR ---------- */

function updateAvatar(key, value) {
  game.avatar[key] = value;
  saveGame();
  render();
}

/* ---------- RADAR ---------- */

function drawRadar() {
  const canvas = document.getElementById("aspectsRadar");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  const values = game.aspects.map(a => Math.min(100, a.xp / 5));
  const cx = canvas.width / 2;
  const cy = canvas.height / 2;
  const r = 100;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.beginPath();

  values.forEach((v, i) => {
    const angle = (Math.PI * 2 / values.length) * i - Math.PI / 2;
    const x = cx + Math.cos(angle) * r * (v / 100);
    const y = cy + Math.sin(angle) * r * (v / 100);
    ctx.lineTo(x, y);
  });

  ctx.closePath();
  ctx.fillStyle = "rgba(123,108,255,0.3)";
  ctx.fill();
}

/* ---------- NAVEGACIÓN ---------- */

function setTab(tab) {
  activeTab = tab;
  document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
  document.getElementById(tab).classList.add("active");

  document.querySelectorAll(".bottom-nav button").forEach(b => b.classList.remove("active"));
  document.querySelector(`[data-tab="${tab}"]`).classList.add("active");

  render();
}

/* ---------- RENDER ---------- */

function render() {
  resetDailyIfNeeded();

  document.getElementById("life").innerText = game.life;
  document.getElementById("coins").innerText = game.coins;

  document.getElementById("xpBar").style.width =
    Math.min(100, (game.xp / (game.level * 100)) * 100) + "%";

  renderHabits();
  renderAspects();
  renderAchievements();
  drawRadar();
}

/* ---------- RENDER SECCIONES ---------- */

function renderHabits() {
  const el = document.getElementById("habitList");
  if (!el) return;
  el.innerHTML = "";

  game.habits.forEach(h => {
    const div = document.createElement("div");
    div.className = "habit";
    div.innerHTML = `
      <div class="habit-info">
        <h4>${h.name}</h4>
        <small>${h.aspect} · dificultad ${h.difficulty}</small>
      </div>
      <div class="habit-actions">
        <button class="done" onclick="markHabit('${h.id}', true)">✔</button>
        <button class="fail" onclick="markHabit('${h.id}', false)">✖</button>
        <button class="delete" onclick="deleteHabit('${h.id}')">🗑</button>
      </div>
    `;
    el.appendChild(div);
  });
}

function renderAspects() {
  const el = document.getElementById("aspectList");
  if (!el) return;
  el.innerHTML = "";

  game.aspects.forEach(a => {
    const div = document.createElement("div");
    div.className = "aspect";
    div.innerHTML = `
      <strong>${a.name}</strong>
      <div class="aspect-xp-bar">
        <div class="aspect-xp" style="width:${Math.min(100, a.xp / 5)}%"></div>
      </div>
      <div class="aspect-actions">
        <button onclick="deleteAspect('${a.id}')">🗑</button>
      </div>
    `;
    el.appendChild(div);
  });
}

function renderAchievements() {
  const el = document.getElementById("achievementList");
  if (!el) return;
  el.innerHTML = "";

  achievements.forEach(a => {
    const unlocked = game.achievements[a.id];
    if (a.hidden && !unlocked) {
      el.innerHTML += `<div class="achievement locked">🔒 Logro oculto</div>`;
      return;
    }

    const claimed = game.claimedAchievements.includes(a.id);

    el.innerHTML += `
      <div class="achievement ${claimed ? "claimed" : ""}">
        🏆 ${a.id}
        ${unlocked && !claimed ? `<button class="claim" onclick="claimAchievement('${a.id}')">Reclamar</button>` : ""}
      </div>
    `;
  });
}

/* ---------- ANIMACIÓN ---------- */

function playPermissionAnimation() {
  const el = document.getElementById("permissionAnimation");
  if (!el) return;
  el.classList.remove("hidden");
  setTimeout(() => el.classList.add("hidden"), 900);
}

/* ---------- INIT ---------- */

render();
