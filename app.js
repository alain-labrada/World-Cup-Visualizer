const STORAGE_KEY = "wc-2026-radial-v1";

const ROUND_CONFIG = [
  { key: "round32", matches: 16, radius: 45, pairGap: 62 },
  { key: "round16", matches: 8, radius: 34, pairGap: 48 },
  { key: "quarter", matches: 4, radius: 24, pairGap: 38 },
  { key: "semi", matches: 2, radius: 16, pairGap: 32 },
  { key: "final", matches: 1, radius: 10, pairGap: 28 },
];

const NEXT_ROUND = {
  round32: "round16",
  round16: "quarter",
  quarter: "semi",
  semi: "final",
  final: "winner",
};

const PREV_ROUND = {
  round16: "round32",
  quarter: "round16",
  semi: "quarter",
  final: "semi",
};

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

let state = loadState();

const bracketEl = document.getElementById("bracket");
const ringsEl = document.getElementById("rings");
const linksEl = document.getElementById("links");
const nodesEl = document.getElementById("nodes");
const winnerFlagEl = document.getElementById("winnerFlag");
const winnerLabelEl = document.getElementById("winnerLabel");
const resetRound32Btn = document.getElementById("resetRound32Btn");

window.addEventListener("resize", render);
resetRound32Btn.addEventListener("click", () => {
  state = buildRound32State();
  saveState();
  render();
});

render();

function buildRound32State() {
  return {
    rounds: {
      round32: ROUND32_MATCHES_2026.map((pair) => ({
        teams: [cloneTeam(pair[0]), cloneTeam(pair[1])],
        winner: null,
      })),
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
    return sanitizeState(parsed);
  } catch (_error) {
    return buildRound32State();
  }
}

function sanitizeState(input) {
  const fallback = buildRound32State();
  if (!input || !input.rounds) {
    return fallback;
  }

  const rounds = {
    round32: sanitizeRound(input.rounds.round32, 16, true),
    round16: sanitizeRound(input.rounds.round16, 8, false),
    quarter: sanitizeRound(input.rounds.quarter, 4, false),
    semi: sanitizeRound(input.rounds.semi, 2, false),
    final: sanitizeRound(input.rounds.final, 1, false),
  };

  return {
    rounds,
    winner: sanitizeTeam(input.winner),
  };
}

function sanitizeRound(round, expectedLength, isRound32) {
  if (!Array.isArray(round) || round.length !== expectedLength) {
    if (isRound32) {
      return buildRound32State().rounds.round32;
    }
    return Array.from({ length: expectedLength }, () => ({ teams: [null, null], winner: null }));
  }

  return round.map((match, idx) => {
    const teams = Array.isArray(match?.teams) ? match.teams : [null, null];
    const winner = match?.winner === 0 || match?.winner === 1 ? match.winner : null;

    if (isRound32) {
      return {
        teams: [cloneTeam(ROUND32_MATCHES_2026[idx][0]), cloneTeam(ROUND32_MATCHES_2026[idx][1])],
        winner,
      };
    }

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

  return {
    name: team.name,
    flag: team.flag,
  };
}

function cloneTeam(team) {
  if (!team) {
    return null;
  }
  return {
    name: team.name,
    flag: team.flag,
  };
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function render() {
  drawRings();
  drawNodesAndLinks();
  updateCenter();
}

function drawRings() {
  ringsEl.innerHTML = "";
  const layout = getLayout();

  layout.forEach((round) => {
    const ring = document.createElement("div");
    ring.className = "ring";
    ring.style.width = `${round.radius * 2}%`;
    ring.style.height = `${round.radius * 2}%`;
    ringsEl.appendChild(ring);
  });
}

function drawNodesAndLinks() {
  nodesEl.innerHTML = "";
  linksEl.innerHTML = "";

  const width = bracketEl.clientWidth;
  const height = bracketEl.clientHeight;
  const layout = getLayout();
  const roundMap = Object.fromEntries(layout.map((round) => [round.key, round]));
  const points = buildPointMap(layout, width, height);

  layout.forEach((round) => {
    const matches = state.rounds[round.key];

    matches.forEach((match, matchIndex) => {
      const node = points[round.key][matchIndex];
      const center = node.center;
      const slotA = node.slots[0];
      const slotB = node.slots[1];

      createLine(slotA.x, slotA.y, center.x, center.y, "link-pair");
      createLine(slotB.x, slotB.y, center.x, center.y, "link-pair");

      const nextKey = NEXT_ROUND[round.key];
      if (nextKey && nextKey !== "winner") {
        const nextIndex = Math.floor(matchIndex / 2);
        const nextSlot = matchIndex % 2;
        const target = points[nextKey][nextIndex].slots[nextSlot];
        const inwardA = interpolate(center, target, 0.42);
        const inwardB = interpolate(center, target, 0.78);

        createLine(center.x, center.y, inwardA.x, inwardA.y, "link-next");
        createLine(inwardA.x, inwardA.y, inwardB.x, inwardB.y, "link-next");
        createLine(inwardB.x, inwardB.y, target.x, target.y, "link-next");

        const dropHub = document.createElement("div");
        dropHub.className = "drop-hub";
        dropHub.style.left = `${target.x}px`;
        dropHub.style.top = `${target.y}px`;
        nodesEl.appendChild(dropHub);
      } else if (nextKey === "winner") {
        const cup = { x: width / 2, y: height / 2 };
        createLine(center.x, center.y, cup.x, cup.y, "link-next");
      }

      const hub = document.createElement("div");
      hub.className = "match-hub";
      hub.style.left = `${center.x}px`;
      hub.style.top = `${center.y}px`;
      nodesEl.appendChild(hub);

      const slotElA = createFlagSlot(round.key, matchIndex, 0, match.teams[0], match.winner === 0);
      slotElA.style.left = `${slotA.x}px`;
      slotElA.style.top = `${slotA.y}px`;
      nodesEl.appendChild(slotElA);

      const slotElB = createFlagSlot(round.key, matchIndex, 1, match.teams[1], match.winner === 1);
      slotElB.style.left = `${slotB.x}px`;
      slotElB.style.top = `${slotB.y}px`;
      nodesEl.appendChild(slotElB);
    });
  });
}

function buildPointMap(layout, width, height) {
  const map = {};

  layout.forEach((round) => {
    map[round.key] = [];
    for (let matchIndex = 0; matchIndex < round.matches; matchIndex++) {
      const center = positionPoint(round.matches, matchIndex, round.radius, width, height);
      const perp = getPerpendicular(round.matches, matchIndex);
      const offsetX = perp.x * (round.pairGap / 2);
      const offsetY = perp.y * (round.pairGap / 2);

      map[round.key].push({
        center,
        slots: [
          { x: center.x + offsetX, y: center.y + offsetY },
          { x: center.x - offsetX, y: center.y - offsetY },
        ],
      });
    }
  });

  return map;
}

function interpolate(from, to, ratio) {
  return {
    x: from.x + (to.x - from.x) * ratio,
    y: from.y + (to.y - from.y) * ratio,
  };
}

function getLayout() {
  const width = bracketEl.clientWidth;
  if (width <= 520) {
    return [
      { key: "round32", matches: 16, radius: 45, pairGap: 38 },
      { key: "round16", matches: 8, radius: 34, pairGap: 30 },
      { key: "quarter", matches: 4, radius: 24, pairGap: 24 },
      { key: "semi", matches: 2, radius: 16, pairGap: 20 },
      { key: "final", matches: 1, radius: 10, pairGap: 18 },
    ];
  }

  if (width <= 760) {
    return [
      { key: "round32", matches: 16, radius: 45, pairGap: 46 },
      { key: "round16", matches: 8, radius: 34, pairGap: 37 },
      { key: "quarter", matches: 4, radius: 24, pairGap: 30 },
      { key: "semi", matches: 2, radius: 16, pairGap: 24 },
      { key: "final", matches: 1, radius: 10, pairGap: 20 },
    ];
  }

  return ROUND_CONFIG;
}

function createLine(x1, y1, x2, y2, className) {
  const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
  line.setAttribute("x1", String(x1));
  line.setAttribute("y1", String(y1));
  line.setAttribute("x2", String(x2));
  line.setAttribute("y2", String(y2));
  line.setAttribute("class", className);
  linksEl.appendChild(line);
}

function positionPoint(totalMatches, index, radiusPct, width, height) {
  const angleDeg = (360 / totalMatches) * index - 90;
  const angleRad = (angleDeg * Math.PI) / 180;
  return {
    x: width * 0.5 + width * (radiusPct / 100) * Math.cos(angleRad),
    y: height * 0.5 + height * (radiusPct / 100) * Math.sin(angleRad),
  };
}

function getPerpendicular(totalMatches, index) {
  const angleDeg = (360 / totalMatches) * index - 90;
  const angleRad = (angleDeg * Math.PI) / 180;
  return {
    x: -Math.sin(angleRad),
    y: Math.cos(angleRad),
  };
}

function createFlagSlot(roundKey, matchIndex, slotIndex, team, isWinner) {
  const slotEl = document.createElement("button");
  slotEl.type = "button";
  slotEl.className = "flag-slot";
  slotEl.dataset.round = roundKey;
  slotEl.dataset.match = String(matchIndex);
  slotEl.dataset.slot = String(slotIndex);

  if (roundKey === "round32") {
    slotEl.classList.add("outer");
  }

  if (team) {
    slotEl.textContent = team.flag;
    slotEl.title = team.name;
  } else {
    slotEl.textContent = "";
    slotEl.title = "Drop winner here";
    slotEl.classList.add("empty");
  }

  if (isWinner && team) {
    slotEl.classList.add("selected", "draggable");
    slotEl.setAttribute("draggable", "true");
  }

  slotEl.addEventListener("click", () => {
    const picked = state.rounds[roundKey][matchIndex].teams[slotIndex];
    if (!picked) {
      return;
    }

    state.rounds[roundKey][matchIndex].winner = slotIndex;
    if (roundKey === "final") {
      state.winner = cloneTeam(picked);
    }

    saveState();
    render();
  });

  slotEl.addEventListener("dragstart", (event) => {
    const match = state.rounds[roundKey][matchIndex];
    if (match.winner !== slotIndex || !team) {
      event.preventDefault();
      return;
    }

    event.dataTransfer.setData("text/from-round", roundKey);
    event.dataTransfer.setData("text/from-match", String(matchIndex));
    event.dataTransfer.setData("text/team", JSON.stringify(team));
  });

  slotEl.addEventListener("dragover", (event) => {
    const fromRound = event.dataTransfer.getData("text/from-round");
    const fromMatch = Number(event.dataTransfer.getData("text/from-match"));
    const expectedMatch = Math.floor(fromMatch / 2);
    const expectedSlot = fromMatch % 2;

    if (
      PREV_ROUND[roundKey] === fromRound
      && Number.isFinite(fromMatch)
      && expectedMatch === matchIndex
      && expectedSlot === slotIndex
    ) {
      event.preventDefault();
      slotEl.classList.add("drop-ok");
    }
  });

  slotEl.addEventListener("dragleave", () => {
    slotEl.classList.remove("drop-ok");
  });

  slotEl.addEventListener("drop", (event) => {
    event.preventDefault();
    slotEl.classList.remove("drop-ok");

    const fromRound = event.dataTransfer.getData("text/from-round");
    const fromMatch = Number(event.dataTransfer.getData("text/from-match"));
    const teamRaw = event.dataTransfer.getData("text/team");

    const expectedMatch = Math.floor(fromMatch / 2);
    const expectedSlot = fromMatch % 2;

    if (
      PREV_ROUND[roundKey] !== fromRound
      || !teamRaw
      || !Number.isFinite(fromMatch)
      || expectedMatch !== matchIndex
      || expectedSlot !== slotIndex
    ) {
      return;
    }

    let payload;
    try {
      payload = JSON.parse(teamRaw);
    } catch (_error) {
      return;
    }

    state.rounds[roundKey][matchIndex].teams[slotIndex] = cloneTeam(payload);
    state.rounds[roundKey][matchIndex].winner = null;

    clearDependentRounds(NEXT_ROUND[roundKey]);
    if (roundKey === "final") {
      state.winner = null;
    }

    saveState();
    render();
  });

  return slotEl;
}

function clearDependentRounds(roundKey) {
  if (!roundKey || roundKey === "winner") {
    if (roundKey === "winner") {
      state.winner = null;
    }
    return;
  }

  const matches = state.rounds[roundKey];
  matches.forEach((match) => {
    match.teams = [null, null];
    match.winner = null;
  });

  clearDependentRounds(NEXT_ROUND[roundKey]);
}

function updateCenter() {
  const finalWinner = state.rounds.final[0].winner;
  if (finalWinner !== null) {
    state.winner = cloneTeam(state.rounds.final[0].teams[finalWinner]);
    saveState();
  }

  winnerFlagEl.textContent = state.winner?.flag || "--";
  winnerLabelEl.textContent = state.winner?.name || "Winner TBD";
}
