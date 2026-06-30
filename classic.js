const STORAGE_KEY = "wc-2026-classic-v1";

const ROUND32_MATCHES_2026 = [
  [{ name: "South Africa", flag: "🇿🇦" }, { name: "Canada", flag: "🇨🇦" }],
  [{ name: "Brazil", flag: "🇧🇷" }, { name: "Japan", flag: "🇯🇵" }],
  [{ name: "Germany", flag: "🇩🇪" }, { name: "Paraguay", flag: "🇵🇾" }],
  [{ name: "Netherlands", flag: "🇳🇱" }, { name: "Morocco", flag: "🇲🇦" }],
  [{ name: "Ivory Coast", flag: "🇨🇮" }, { name: "Norway", flag: "🇳🇴" }],
  [{ name: "France", flag: "🇫🇷" }, { name: "Sweden", flag: "🇸🇪" }],
  [{ name: "Mexico", flag: "🇲🇽" }, { name: "Ecuador", flag: "🇪🇨" }],
  [{ name: "England", flag: "🏴" }, { name: "DR Congo", flag: "🇨🇩" }],
  [{ name: "Belgium", flag: "🇧🇪" }, { name: "Senegal", flag: "🇸🇳" }],
  [{ name: "United States", flag: "🇺🇸" }, { name: "Bosnia and Herzegovina", flag: "🇧🇦" }],
  [{ name: "Spain", flag: "🇪🇸" }, { name: "Austria", flag: "🇦🇹" }],
  [{ name: "Portugal", flag: "🇵🇹" }, { name: "Croatia", flag: "🇭🇷" }],
  [{ name: "Switzerland", flag: "🇨🇭" }, { name: "Algeria", flag: "🇩🇿" }],
  [{ name: "Australia", flag: "🇦🇺" }, { name: "Egypt", flag: "🇪🇬" }],
  [{ name: "Argentina", flag: "🇦🇷" }, { name: "Cape Verde", flag: "🇨🇻" }],
  [{ name: "Colombia", flag: "🇨🇴" }, { name: "Ghana", flag: "🇬🇭" }],
];

const PREV_ROUND = {
  round16: "round32",
  quarter: "round16",
  semi: "quarter",
  final: "semi",
};

const NEXT_ROUND = {
  round32: "round16",
  round16: "quarter",
  quarter: "semi",
  semi: "final",
  final: "winner",
};

const boardEl = document.getElementById("board");
const linesEl = document.getElementById("lines");
const slotsEl = document.getElementById("slots");
const resetBtn = document.getElementById("resetBtn");
const winnerFlagEl = document.getElementById("winnerFlag");
const winnerNameEl = document.getElementById("winnerName");

let state = loadState();
let selectedAdvance = null;

const FLAG_CODE = {
  "South Africa": "za",
  Canada: "ca",
  Brazil: "br",
  Japan: "jp",
  Germany: "de",
  Paraguay: "py",
  Netherlands: "nl",
  Morocco: "ma",
  "Ivory Coast": "ci",
  Norway: "no",
  France: "fr",
  Sweden: "se",
  Mexico: "mx",
  Ecuador: "ec",
  England: "gb-eng",
  "DR Congo": "cd",
  Belgium: "be",
  Senegal: "sn",
  "United States": "us",
  "Bosnia and Herzegovina": "ba",
  Spain: "es",
  Austria: "at",
  Portugal: "pt",
  Croatia: "hr",
  Switzerland: "ch",
  Algeria: "dz",
  Australia: "au",
  Egypt: "eg",
  Argentina: "ar",
  "Cape Verde": "cv",
  Colombia: "co",
  Ghana: "gh",
};

window.addEventListener("resize", render);
resetBtn.addEventListener("click", () => {
  state = buildRound32State();
  selectedAdvance = null;
  saveState();
  render();
});

render();

function buildRound32State() {
  return {
    rounds: {
      round32: ROUND32_MATCHES_2026.map((pair) => ({ teams: [cloneTeam(pair[0]), cloneTeam(pair[1])], winner: null })),
      round16: Array.from({ length: 8 }, () => ({ teams: [null, null], winner: null })),
      quarter: Array.from({ length: 4 }, () => ({ teams: [null, null], winner: null })),
      semi: Array.from({ length: 2 }, () => ({ teams: [null, null], winner: null })),
      final: [{ teams: [null, null], winner: null }],
    },
    winner: null,
  };
}

function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return buildRound32State();
  }

  try {
    const parsed = JSON.parse(raw);
    if (!parsed || !parsed.rounds || !Array.isArray(parsed.rounds.round32)) {
      return buildRound32State();
    }
    return sanitizeState(parsed);
  } catch (_error) {
    return buildRound32State();
  }
}

function sanitizeState(input) {
  return {
    rounds: {
      round32: sanitizeRound(input.rounds.round32, 16, true),
      round16: sanitizeRound(input.rounds.round16, 8, false),
      quarter: sanitizeRound(input.rounds.quarter, 4, false),
      semi: sanitizeRound(input.rounds.semi, 2, false),
      final: sanitizeRound(input.rounds.final, 1, false),
    },
    winner: sanitizeTeam(input.winner),
  };
}

function sanitizeRound(round, expected, useFixedTeams) {
  if (!Array.isArray(round) || round.length !== expected) {
    if (useFixedTeams) {
      return buildRound32State().rounds.round32;
    }
    return Array.from({ length: expected }, () => ({ teams: [null, null], winner: null }));
  }

  return round.map((match, matchIndex) => {
    const winner = match?.winner === 0 || match?.winner === 1 ? match.winner : null;
    if (useFixedTeams) {
      return {
        teams: [cloneTeam(ROUND32_MATCHES_2026[matchIndex][0]), cloneTeam(ROUND32_MATCHES_2026[matchIndex][1])],
        winner,
      };
    }

    const teams = Array.isArray(match?.teams) ? match.teams : [null, null];
    return {
      teams: [sanitizeTeam(teams[0]), sanitizeTeam(teams[1])],
      winner,
    };
  });
}

function sanitizeTeam(team) {
  if (!team || typeof team !== "object") {
    return null;
  }
  if (typeof team.name !== "string" || typeof team.flag !== "string") {
    return null;
  }
  return { name: team.name, flag: team.flag };
}

function cloneTeam(team) {
  if (!team) {
    return null;
  }
  return { name: team.name, flag: team.flag };
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function render() {
  slotsEl.innerHTML = "";
  linesEl.innerHTML = "";
  linesEl.setAttribute("viewBox", "0 0 100 100");
  linesEl.setAttribute("preserveAspectRatio", "none");

  const geometry = buildGeometry();

  drawRoundSlots(geometry);
  drawPaths(geometry);
  updateWinner();
}

function buildGeometry() {
  const width = boardEl.clientWidth;
  const height = boardEl.clientHeight;
  const mobile = width < 700;

  const x = mobile
    ? {
      left: { round32: 8, round16: 23, quarter: 35, semi: 44, final: 44 },
      right: { round32: 92, round16: 77, quarter: 65, semi: 56, final: 56 },
    }
    : {
      left: { round32: 8, round16: 23, quarter: 36, semi: 45, final: 43 },
      right: { round32: 92, round16: 77, quarter: 64, semi: 55, final: 57 },
    };

  const leftLevels = makeLevels(7, 93);
  const rightLevels = makeLevels(7, 93);

  return { width, height, x, leftLevels, rightLevels };
}

function makeLevels(topPct, bottomPct) {
  const level0 = [];
  const span = bottomPct - topPct;
  for (let i = 0; i < 16; i++) {
    level0.push(topPct + ((i + 0.5) / 16) * span);
  }

  const levels = [level0];
  for (let step = 0; step < 4; step++) {
    const prev = levels[levels.length - 1];
    const next = [];
    for (let i = 0; i < prev.length; i += 2) {
      next.push((prev[i] + prev[i + 1]) / 2);
    }
    levels.push(next);
  }

  return {
    l0: levels[0],
    l1: levels[1],
    l2: levels[2],
    l3: levels[3],
    l4: levels[4],
  };
}

function drawRoundSlots(geometry) {
  drawRound32Slots(geometry);
  drawRound16Slots(geometry);
  drawQuarterSlots(geometry);
  drawSemiSlots(geometry);
  drawFinalSlots(geometry);
}

function drawRound32Slots(geometry) {
  for (let match = 0; match < 16; match++) {
    const side = match < 8 ? "left" : "right";
    const localMatch = side === "left" ? match : match - 8;

    for (let slot = 0; slot < 2; slot++) {
      const yIndex = localMatch * 2 + slot;
      const yPct = side === "left" ? geometry.leftLevels.l0[yIndex] : geometry.rightLevels.l0[yIndex];
      const xPct = geometry.x[side].round32;
      const team = state.rounds.round32[match].teams[slot];
      const selected = state.rounds.round32[match].winner === slot;

      createSlot({ round: "round32", match, slot, xPct, yPct, team, selected });
    }
  }
}

function drawRound16Slots(geometry) {
  for (let match = 0; match < 8; match++) {
    const side = match < 4 ? "left" : "right";
    const localMatch = side === "left" ? match : match - 4;

    for (let slot = 0; slot < 2; slot++) {
      const yIndex = localMatch * 2 + slot;
      const yPct = side === "left" ? geometry.leftLevels.l1[yIndex] : geometry.rightLevels.l1[yIndex];
      const xPct = geometry.x[side].round16;
      const team = state.rounds.round16[match].teams[slot];
      const selected = state.rounds.round16[match].winner === slot;

      createSlot({ round: "round16", match, slot, xPct, yPct, team, selected });
    }
  }
}

function drawQuarterSlots(geometry) {
  for (let match = 0; match < 4; match++) {
    const side = match < 2 ? "left" : "right";
    const localMatch = side === "left" ? match : match - 2;

    for (let slot = 0; slot < 2; slot++) {
      const yIndex = localMatch * 2 + slot;
      const yPct = side === "left" ? geometry.leftLevels.l2[yIndex] : geometry.rightLevels.l2[yIndex];
      const xPct = geometry.x[side].quarter;
      const team = state.rounds.quarter[match].teams[slot];
      const selected = state.rounds.quarter[match].winner === slot;

      createSlot({ round: "quarter", match, slot, xPct, yPct, team, selected });
    }
  }
}

function drawSemiSlots(geometry) {
  for (let match = 0; match < 2; match++) {
    const side = match === 0 ? "left" : "right";

    for (let slot = 0; slot < 2; slot++) {
      const yPct = side === "left" ? geometry.leftLevels.l3[slot] : geometry.rightLevels.l3[slot];
      const xPct = geometry.x[side].semi;
      const team = state.rounds.semi[match].teams[slot];
      const selected = state.rounds.semi[match].winner === slot;

      createSlot({ round: "semi", match, slot, xPct, yPct, team, selected });
    }
  }
}

function drawFinalSlots(geometry) {
  const leftFinalY = geometry.leftLevels.l4[0];
  const rightFinalY = geometry.rightLevels.l4[0];

  createSlot({
    round: "final",
    match: 0,
    slot: 0,
    xPct: geometry.x.left.final,
    yPct: leftFinalY,
    team: state.rounds.final[0].teams[0],
    selected: state.rounds.final[0].winner === 0,
  });

  createSlot({
    round: "final",
    match: 0,
    slot: 1,
    xPct: geometry.x.right.final,
    yPct: rightFinalY,
    team: state.rounds.final[0].teams[1],
    selected: state.rounds.final[0].winner === 1,
  });
}

function createSlot({ round, match, slot, xPct, yPct, team, selected }) {
  const el = document.createElement("button");
  el.type = "button";
  el.className = "slot";
  el.style.left = `${xPct}%`;
  el.style.top = `${yPct}%`;
  el.dataset.round = round;
  el.dataset.match = String(match);
  el.dataset.slot = String(slot);

  if (team) {
    const img = document.createElement("img");
    img.className = "flag-fill";
    img.src = getFlagUrl(team);
    img.alt = `${team.name} flag`;
    img.loading = "lazy";
    img.decoding = "async";
    img.referrerPolicy = "no-referrer";
    img.draggable = false;
    img.addEventListener("error", () => {
      el.textContent = team.flag;
    }, { once: true });
    el.appendChild(img);
    el.title = team.name;
    el.classList.add("draggable");
    el.setAttribute("draggable", "true");
  } else {
    el.textContent = "";
    el.classList.add("empty");
    el.title = "Drop winner here";
  }

  if (round === "final") {
    el.classList.add("final");
  }

  if (team && selected) {
    el.classList.add("selected");
  }

  if (
    selectedAdvance &&
    canDropTo(round, match, slot, selectedAdvance.fromRound, selectedAdvance.fromMatch)
  ) {
    el.classList.add("drop-ok");
  }

  el.addEventListener("click", () => {
    const picked = state.rounds[round][match].teams[slot];

    if (
      selectedAdvance &&
      canDropTo(round, match, slot, selectedAdvance.fromRound, selectedAdvance.fromMatch)
    ) {
      const selectedTeam = getSelectedWinnerTeam();
      if (!selectedTeam) {
        selectedAdvance = null;
        render();
        return;
      }

      state.rounds[round][match].teams[slot] = cloneTeam(selectedTeam);
      state.rounds[round][match].winner = null;

      clearDependentRounds(NEXT_ROUND[round]);
      if (round === "final") {
        state.winner = null;
      }

      selectedAdvance = null;
      saveState();
      render();
      return;
    }

    if (!picked) {
      selectedAdvance = null;
      render();
      return;
    }

    state.rounds[round][match].winner = slot;
    selectedAdvance = round === "final" ? null : { fromRound: round, fromMatch: match };
    if (round === "final") {
      state.winner = cloneTeam(picked);
    }

    saveState();
    render();
  });

  el.addEventListener("dragstart", (event) => {
    if (!team) {
      event.preventDefault();
      return;
    }

    state.rounds[round][match].winner = slot;
    selectedAdvance = round === "final" ? null : { fromRound: round, fromMatch: match };
    saveState();

    event.dataTransfer.setData("text/from-round", round);
    event.dataTransfer.setData("text/from-match", String(match));
    event.dataTransfer.setData("text/team", JSON.stringify(team));
  });

  el.addEventListener("dragover", (event) => {
    const fromRound = event.dataTransfer.getData("text/from-round");
    const fromMatch = Number(event.dataTransfer.getData("text/from-match"));
    if (canDropTo(round, match, slot, fromRound, fromMatch)) {
      event.preventDefault();
      el.classList.add("drop-ok");
    }
  });

  el.addEventListener("dragleave", () => {
    el.classList.remove("drop-ok");
  });

  el.addEventListener("drop", (event) => {
    event.preventDefault();
    el.classList.remove("drop-ok");

    const fromRound = event.dataTransfer.getData("text/from-round");
    const fromMatch = Number(event.dataTransfer.getData("text/from-match"));
    const teamRaw = event.dataTransfer.getData("text/team");

    if (!teamRaw || !canDropTo(round, match, slot, fromRound, fromMatch)) {
      return;
    }

    let payload;
    try {
      payload = JSON.parse(teamRaw);
    } catch (_error) {
      return;
    }

    state.rounds[round][match].teams[slot] = cloneTeam(payload);
    state.rounds[round][match].winner = null;
    selectedAdvance = null;

    clearDependentRounds(NEXT_ROUND[round]);
    if (round === "final") {
      state.winner = null;
    }

    saveState();
    render();
  });

  slotsEl.appendChild(el);
}

function getFlagUrl(team) {
  const code = FLAG_CODE[team.name];
  if (!code) {
    return "";
  }
  return `https://flagcdn.com/w80/${code}.png`;
}

function getSelectedWinnerTeam() {
  if (!selectedAdvance) {
    return null;
  }

  const { fromRound, fromMatch } = selectedAdvance;
  if (!state.rounds[fromRound] || !state.rounds[fromRound][fromMatch]) {
    return null;
  }

  const srcMatch = state.rounds[fromRound][fromMatch];
  if (srcMatch.winner === null) {
    return null;
  }

  return srcMatch.teams[srcMatch.winner] || null;
}

function canDropTo(targetRound, targetMatch, targetSlot, fromRound, fromMatch) {
  const expectedRound = PREV_ROUND[targetRound];
  if (!expectedRound || fromRound !== expectedRound || !Number.isFinite(fromMatch)) {
    return false;
  }

  const expectedMatch = targetMatch * 2 + targetSlot;
  return fromMatch === expectedMatch;
}

function clearDependentRounds(roundKey) {
  if (!roundKey || roundKey === "winner") {
    if (roundKey === "winner") {
      state.winner = null;
    }
    return;
  }

  state.rounds[roundKey].forEach((match) => {
    match.teams = [null, null];
    match.winner = null;
  });

  clearDependentRounds(NEXT_ROUND[roundKey]);
}

function drawPaths(geometry) {
  drawRoundPaths(geometry, "round32");
  drawRoundPaths(geometry, "round16");
  drawRoundPaths(geometry, "quarter");
}

function drawRoundPaths(geometry, round) {
  const matchCount = state.rounds[round].length;

  for (let match = 0; match < matchCount; match++) {
    const sourceA = getSlotPos(geometry, round, match, 0);
    const sourceB = getSlotPos(geometry, round, match, 1);

    const nextRound = NEXT_ROUND[round];
    if (!nextRound || nextRound === "winner") {
      continue;
    }

    const targetMatchA = Math.floor(match / 2);
    const targetSlotA = match % 2;
    const target = getSlotPos(geometry, nextRound, targetMatchA, targetSlotA);

    const side = sourceA.x < 50 ? "left" : "right";
    createBracketPath(sourceA, sourceB, target, side);
  }
}

function getSlotPos(geometry, round, match, slot) {
  const sideMap = {
    round32: match < 8 ? "left" : "right",
    round16: match < 4 ? "left" : "right",
    quarter: match < 2 ? "left" : "right",
    semi: match === 0 ? "left" : "right",
    final: slot === 0 ? "left" : "right",
  };
  const side = sideMap[round];

  if (round === "round32") {
    const localMatch = side === "left" ? match : match - 8;
    const yIndex = localMatch * 2 + slot;
    const y = side === "left" ? geometry.leftLevels.l0[yIndex] : geometry.rightLevels.l0[yIndex];
    return { x: geometry.x[side].round32, y };
  }

  if (round === "round16") {
    const localMatch = side === "left" ? match : match - 4;
    const yIndex = localMatch * 2 + slot;
    const y = side === "left" ? geometry.leftLevels.l1[yIndex] : geometry.rightLevels.l1[yIndex];
    return { x: geometry.x[side].round16, y };
  }

  if (round === "quarter") {
    const localMatch = side === "left" ? match : match - 2;
    const yIndex = localMatch * 2 + slot;
    const y = side === "left" ? geometry.leftLevels.l2[yIndex] : geometry.rightLevels.l2[yIndex];
    return { x: geometry.x[side].quarter, y };
  }

  if (round === "semi") {
    const y = side === "left" ? geometry.leftLevels.l3[slot] : geometry.rightLevels.l3[slot];
    return { x: geometry.x[side].semi, y };
  }

  if (round === "final") {
    const y = side === "left" ? geometry.leftLevels.l4[0] : geometry.rightLevels.l4[0];
    return { x: geometry.x[side].final, y };
  }

  return { x: 50, y: 50 };
}

function createBracketPath(a, b, target, side) {
  const horizontalStub = side === "left" ? 4.6 : -4.6;
  const trunkShift = side === "left" ? 7.8 : -7.8;
  const centerY = (a.y + b.y) / 2;

  const aStubX = a.x + horizontalStub;
  const bStubX = b.x + horizontalStub;
  const trunkX = side === "left" ? a.x + trunkShift : a.x + trunkShift;

  const nearTargetX = side === "left" ? target.x - 2.8 : target.x + 2.8;

  const d = [
    // Match pair: horizontal from each team, then vertical join (half-rectangle look).
    `M ${a.x} ${a.y}`,
    `L ${aStubX} ${a.y}`,
    `L ${trunkX} ${a.y}`,
    `L ${trunkX} ${b.y}`,
    `L ${bStubX} ${b.y}`,
    `L ${b.x} ${b.y}`,
    // Center to next slot: horizontal from join center, then slight bend into target.
    `M ${trunkX} ${centerY}`,
    `L ${nearTargetX} ${centerY}`,
    `Q ${target.x} ${centerY} ${target.x} ${target.y}`,
  ].join(" ");

  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute("d", d);
  path.setAttribute("class", "link");
  linesEl.appendChild(path);
}

function updateWinner() {
  const finalWinner = state.rounds.final[0].winner;
  if (finalWinner !== null) {
    state.winner = cloneTeam(state.rounds.final[0].teams[finalWinner]);
    saveState();
  }

  winnerFlagEl.textContent = state.winner?.flag || "--";
  winnerNameEl.textContent = state.winner?.name || "";
}
