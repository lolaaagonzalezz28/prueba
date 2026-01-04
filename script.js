/* ===============================
   CONFIG & STORAGE
================================ */

const STORAGE_KEY = "lifeRPG_game_v1";

const motivationalPhrases = [
  "No necesitás motivación, necesitás constancia.",
  "Hoy cuenta, aunque sea un poco.",
  "No es disciplina perfecta, es volver siempre.",
  "Tu yo del futuro te está mirando.",
  "Entrenar también es una forma de respeto propio.",
  "No hagas todo, hacé algo.",
  "Cada hábito suma identidad.",
  "No es un juego: es tu vida entrenándose."
];

/* ===============================
   ESTADO DEL JUEGO
================================ */

let gameData = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {
  coins: 50,
  life: 100,
  maxLife: 100,

  character: {
  name: "Mi personaje",
  skin: "skin1",
  eyes: "eyes1",
  hair: "hair1",
  outfit: "outfit1"
},


  aspects: [
    { id: "fisico", name: "Salud Física", level: 1, xp: 0, maxXp: 100 },
    { id: "mental", name: "Salud Mental", level: 1, xp: 0, maxXp: 100 },
    { id: "social", name: "Social", level: 1, xp: 0, maxXp: 100 },
    { id: "estudio", name: "Estudio", level: 1, xp: 0, maxXp: 100 }
  ],

  habits: [
    // ejemplo:
    // { id, name, type: "good" | "bad", coins, damage, aspect }
  ],

  achievements: [
    {
      id: 1,
      name: "Primer hábito",
      unlocked: false,
      claimed: false,
      reward: 20
    },
    {
      id: 2,
      name: "10 hábitos buenos",
      unlocked: false,
      claimed: false,
      reward: 50
    }
  ],

  stats: {
    goodHabitsDone: 0,
    badHabitsDone: 0
  }
};

let activeTab = "home";

/* ===============================
   UTILS
================================ */

function saveGame() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(gameData));
}

function randomMotivation() {
  return motivationalPhrases[
    Math.floor(Math.random() * motivationalPhrases.length)
  ];
}

/* ===============================
   NAV
================================ */

function setTab(tab) {
  activeTab = tab;

  document
    .querySelectorAll(".bottom-nav button")
    .forEach(b => b.classList.remove("active"));

  const index = ["home", "character", "aspects", "shop", "achievements"].indexOf(tab);
  document.querySelectorAll(".bottom-nav button")[index].classList.add("active");

  render();
}

/* ===============================
   RENDER GENERAL
================================ */

function render() {
  document.getElementById("coins").textContent = gameData.coins;
  document.getElementById("motivationText").textContent = randomMotivation();

  if (activeTab === "home") renderHabits();
  if (activeTab === "character") renderCharacter();
  if (activeTab === "aspects") renderAspects();
  if (activeTab === "shop") renderShop();
  if (activeTab === "achievements") renderAchievements();

  saveGame();
}

/* ===============================
   HÁBITOS
================================ */

function renderHabits() {
  const app = document.getElementById("app");

  app.innerHTML = `
    <h2>Hábitos</h2>

    <div class="section">
      ${gameData.habits.length === 0
        ? "<p>No hay hábitos todavía.</p>"
        : gameData.habits.map(habit => `
            <div class="habit ${habit.type}">
              <div class="habit-title">${habit.name}</div>
              <div class="habit-info">
                ${habit.type === "good"
                  ? `+${habit.coins} 🪙`
                  : `-${habit.damage} ❤️`}
              </div>
              <button class="button secondary" onclick="completeHabit('${habit.id}')">
                Marcar hecho
              </button>
            </div>
          `).join("")}
    </div>

    <button class="button" onclick="openAddHabitModal()">Agregar hábito</button>
  `;
}

function completeHabit(id) {
  const habit = gameData.habits.find(h => h.id === id);
  if (!habit) return;

  if (habit.type === "good") {
    gameData.coins += habit.coins;
    gameData.stats.goodHabitsDone++;
    gainAspectXP(habit.aspect, 20);
  } else {
    gameData.life -= habit.damage;
    gameData.stats.badHabitsDone++;
    if (gameData.life < 0) gameData.life = 0;
  }

  checkAchievements();
  checkDeath();
  render();
}

function openAddHabitModal() {
  openModal(`
    <h2>Nuevo hábito</h2>

    <input id="habitName" placeholder="Nombre" />
    <select id="habitType">
      <option value="good">Bueno</option>
      <option value="bad">Malo</option>
    </select>

    <select id="habitAspect">
      ${gameData.aspects.map(a =>
        `<option value="${a.id}">${a.name}</option>`
      ).join("")}
    </select>

    <button class="button" onclick="addHabit()">Guardar</button>
  `);
}

function addHabit() {
  const name = document.getElementById("habitName").value;
  const type = document.getElementById("habitType").value;
  const aspect = document.getElementById("habitAspect").value;

  if (!name) return;

  gameData.habits.push({
    id: crypto.randomUUID(),
    name,
    type,
    coins: type === "good" ? 10 : 0,
    damage: type === "bad" ? 10 : 0,
    aspect
  });

  closeModal();
  render();
}

/* ===============================
   PERSONAJE
================================ */

function renderCharacter() {
  const app = document.getElementById("app");
  const lifePercent = (gameData.life / gameData.maxLife) * 100;

  app.innerHTML = `
    <h2>${gameData.character.name}</h2>

    <div class="character-card">
      <div class="avatar" style="background:${gameData.character.skinColor}; border-radius: 12px;">
        Avatar
      </div>

      <div class="life-bar-container">
        <div class="life-text">
          ❤️ ${gameData.life} / ${gameData.maxLife}
        </div>
        <div class="life-bar">
          <div class="life-bar-fill" style="width:${lifePercent}%"></div>
        </div>
      </div>

      <button class="button secondary" onclick="openEditCharacter()">
        Editar personaje
      </button>
    </div>
  `;
}

function openEditCharacter() {
  openModal(`
    <h2>Editar personaje</h2>
    <input id="charName" value="${gameData.character.name}" />
    <input type="color" id="charSkin" value="${gameData.character.skinColor}" />
    <button class="button" onclick="saveCharacter()">Guardar</button>
  `);
}

function saveCharacter() {
  gameData.character.name = document.getElementById("charName").value;
  gameData.character.skinColor = document.getElementById("charSkin").value;
  closeModal();
  render();
}

/* ===============================
   ASPECTOS
================================ */

function renderAspects() {
  const app = document.getElementById("app");

  app.innerHTML = `
    <h2>Aspectos</h2>

    ${gameData.aspects.map(a => `
      <div class="aspect">
        <strong>${a.name}</strong>
        <div class="aspect-level">
          Nivel ${a.level} — ${a.xp}/${a.maxXp} XP
        </div>
      </div>
    `).join("")}
  `;
}

function gainAspectXP(id, amount) {
  const aspect = gameData.aspects.find(a => a.id === id);
  if (!aspect) return;

  aspect.xp += amount;

  if (aspect.xp >= aspect.maxXp) {
    aspect.level++;
    aspect.xp = 0;
    aspect.maxXp += 50;
  }
}

/* ===============================
   LOGROS
================================ */

function renderAchievements() {
  const app = document.getElementById("app");

  app.innerHTML = `
    <h2>Logros</h2>

    ${gameData.achievements.map(a => `
      <div class="achievement
        ${a.unlocked ? "" : "locked"}
        ${a.claimed ? "completed" : ""}">
        <div class="achievement-title">${a.name}</div>

        ${a.unlocked && !a.claimed
          ? `<button class="button secondary" onclick="claimAchievement(${a.id})">
              Reclamar ${a.reward} 🪙
            </button>`
          : a.claimed
            ? "<p>Completado</p>"
            : "<p>🔒 Bloqueado</p>"
        }
      </div>
    `).join("")}
  `;
}

function checkAchievements() {
  const first = gameData.achievements.find(a => a.id === 1);
  if (first && !first.unlocked && gameData.habits.length > 0) {
    first.unlocked = true;
  }

  const ten = gameData.achievements.find(a => a.id === 2);
  if (ten && !ten.unlocked && gameData.stats.goodHabitsDone >= 10) {
    ten.unlocked = true;
  }
}

function claimAchievement(id) {
  const ach = gameData.achievements.find(a => a.id === id);
  if (!ach || ach.claimed) return;

  gameData.coins += ach.reward;
  ach.claimed = true;
  render();
}

/* ===============================
   TIENDA (BASE)
================================ */

function renderShop() {
  const app = document.getElementById("app");
  app.innerHTML = `
    <h2>Tienda</h2>
    <p>Próximamente: permisos para hábitos malos.</p>
  `;
}

/* ===============================
   VIDA 0
================================ */

function checkDeath() {
  if (gameData.life <= 0) {
    alert("Vida en 0. Tenés que cumplir el reto.");
    gameData.life = gameData.maxLife;
  }
}

/* ===============================
   MODAL
================================ */

function openModal(html) {
  document.getElementById("modalBody").innerHTML = html;
  document.getElementById("modal").classList.remove("hidden");
}

function closeModal() {
  document.getElementById("modal").classList.add("hidden");
}
function renderAvatar() {
  return `
    <div class="avatar-stack">
      <img src="assets/avatar/skin/${gameData.character.skin}.png">
      <img src="assets/avatar/eyes/${gameData.character.eyes}.png">
      <img src="assets/avatar/hair/${gameData.character.hair}.png">
      <img src="assets/avatar/outfit/${gameData.character.outfit}.png">
    </div>
  `;
}


/* ===============================
   INIT
================================ */

setTab("home");
render();
