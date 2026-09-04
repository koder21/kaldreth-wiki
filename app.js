const DATA_URL = "./data/wiki-data.json";
const NUMBER = new Intl.NumberFormat("en-US");
const PERCENT = new Intl.NumberFormat("en-US", {
  style: "percent",
  maximumFractionDigits: 1,
});
const PRECISE_PERCENT = new Intl.NumberFormat("en-US", {
  style: "percent",
  maximumFractionDigits: 2,
});
const DECIMAL = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 });
const PRESET_STORAGE_KEY = "kaldreth_wiki_presets_v1";
const TOUR_STORAGE_KEY = "kaldreth_wiki_tour_done_v1";
const TOUR_STEPS = [
  {
    title: "Use Planner Tabs",
    body: "Swipe or tap the planner tabs to switch tools without long scrolling.",
  },
  {
    title: "Save Presets",
    body: "Save your favorite planner setup to load it instantly next time.",
  },
  {
    title: "Bottom Shortcuts",
    body: "Use the bottom buttons to jump to planners, open filters, share your planner URL, or reset quickly.",
  },
];

const SECTION_ORDER = [
  ["items", "Items"],
  ["monsters", "Monsters"],
  ["skills", "Skills"],
  ["skilltree", "Skill Tree"],
  ["passives", "Passives"],
  ["contracts", "Contracts"],
  ["tasks", "Tasks"],
  ["quests", "Quests"],
  ["fragments", "Memory Fragments"],
  ["npcs", "NPCs"],
  ["vendors", "Vendors"],
  ["dungeons", "Dungeons"],
  ["factions", "Factions"],
  ["achievements", "Achievements"],
  ["titles", "Titles"],
  ["mechanics", "Mechanics"],
  ["whisperwood", "Expansion 1: Whisperwood"],
  ["roadmap", "Roadmap"],
  ["patches", "Patch Notes"],
];

const SECTION_LORE = {
  items: "Relics, reagents, and gear scavenged from a Fractured world.",
  monsters: "What stalks the resonance nodes, and what it leaves behind.",
  skills: "The disciplines that keep a Fracture-crossed wanderer alive.",
  skilltree: "Spend Mastery Points to bend the Fracture in your favour.",
  passives: "Permanent boons earned through sheer persistence.",
  contracts: "Adventurer work-orders posted across the regions.",
  tasks: "Daily and weekly duties for the diligent.",
  quests: "The story of the Shattering, told arc by arc.",
  fragments:
    "Echoes the Fracture scattered: the memories you piece back together.",
  npcs: "The voices of Aetheria: who they are and what they want.",
  vendors: "Where to spend your hard-won gold.",
  dungeons: "Deep places the Order would rather you never found.",
  factions: "The powers shaping Aetheria after the Accord.",
  achievements: "Milestones the world will remember you by.",
  titles: "The names Aetheria has earned you.",
  mechanics: "The rules the Architects wrote into the world.",
  whisperwood:
    "Kaldreth's first paid expansion, and everything it added to the game.",
  roadmap: "What is coming to Aetheria next, and in what order.",
  patches: "How Aetheria has changed, build by build.",
};

// Skills cap at 105 with Expansion 1 owned. Base game still reads 99 on a
// lapsed or non-owner account; the planner models the owned cap.
const SKILL_LEVEL_CAP = 105;

// Per-skill reference copy for the skill codex. `what` answers "what is this
// skill for", `train` answers "how do I actually gain XP in it", and `aliases`
// widens the search net so a player searching "logs" or "thieving" still lands
// on the right card. Everything numeric is derived from the data files instead
// Only prose lives here.
const SKILL_CODEX = {
  mining: {
    role: "Gathering",
    aliases: "ore rock pickaxe prospect smelting quarry",
    what: "Breaks ore out of rock nodes across Aetheria's regions. Ore is the front of the Smithing chain, so nearly every bar, and therefore nearly every piece of melee gear, starts at a Mining node.",
    train:
      "Pick the highest node you meet the level for and leave it running. Each action takes a fixed number of seconds for flat XP, so your XP/hour is decided almost entirely by which node you can reach.",
  },
  woodcutting: {
    role: "Gathering",
    aliases: "felling woodcutting logs trees axe chopping bark",
    what: "Fells trees for logs. Logs feed Cooking fires and the Wardcraft tracks, and the higher-tier logs show up repeatedly as contract and quest turn-ins.",
    train:
      "Chop the best log you have the level for. Node speed and XP are fixed per tree, so upgrading to the next unlocked tree is always the jump in XP/hour.",
  },
  fishing: {
    role: "Gathering",
    aliases: "fish rod bait catch angling",
    what: "Pulls fish out of Aetheria's waters. Fish are the raw input for Cooking, and the leatherwork track of Wardcraft consumes several of them directly.",
    train:
      "Fish the highest spot you can reach. Fishing also rolls double catches and failed attempts, so its real rate drifts a little from the flat table below.",
  },
  spirit_harvesting: {
    role: "Gathering",
    aliases:
      "shard gleaning spirit harvesting dust resonance nodes reagents gleaner",
    what: "Draws shard dust and spirit reagents out of the resonance nodes the Fracture left behind. Its output is what Spiritweaving and the clothwork track of Wardcraft are built on.",
    train:
      "Work the highest-tier resonance node you have unlocked. Gleaning is the main supply line for two artisan skills, so it is rarely wasted time.",
  },
  smithing: {
    role: "Artisan",
    aliases: "smith forge bars smelt anvil hammer armour weapons blueprints",
    what: "Smelts ore into bars, then beats bars into gear. Bars unlock in tiers by level, and each tier carries a full blueprint set, helm through weapon.",
    train:
      "Smelt bars from the recipe list, or spend bars on gear blueprints. Bars are the cheaper XP; blueprints are where the bars go.",
  },
  cooking: {
    role: "Artisan",
    aliases: "cook food fire burn heal rations meals",
    what: "Turns raw fish and ingredients into food that restores HP mid-combat. Food is the thing that makes long unattended combat sessions survivable.",
    train:
      "Cook the best recipe you have stock for. Low-level cooks burn food and lose the input; burn chance falls as that recipe's affinity climbs.",
  },
  spiritweaving: {
    role: "Artisan",
    aliases: "weave spirit focus reagents loom threads",
    what: "Weaves harvested shard material into the spirit reagents and focuses that Fracture Arts and Wardcraft consume.",
    train:
      "Weave the highest recipe your Shard Gleaning stock supports. It is the middle link of the spirit economy: gleaning feeds it, Wardcraft drains it.",
  },
  crafting: {
    role: "Artisan",
    aliases: "wardcraft craft clothwork leatherwork wards charms tracks",
    what: "Builds wards, focuses, and worn gear along parallel material tracks (clothwork, leatherwork, and more), each with its own tier ladder and base material.",
    train:
      "Each track gates separately by level, so the fastest route is usually whichever track's base material you already have stockpiled.",
  },
  shadow_arts: {
    role: "Roguish",
    aliases: "shadow arts thieving steal pickpocket marks stealth stun",
    what: "Period-based theft rather than a repeated action. You choose a mark and attempts resolve on a cooldown, each with its own success chance, and a failure can stun you out of the next window.",
    train:
      "Work the highest-level mark whose success chance is still reasonable. Success rate, cooldown, and stun length all improve with level and with that mark's affinity.",
  },
  magic: {
    role: "Combat / Casting",
    aliases: "fracture arts magic spells runes casting mage staff",
    what: "Doubles as a combat style and a casting discipline. In combat your Fracture Arts level and MAG gear set your damage range and hit chance, and the spell you cast scales both: higher-tier spells hit harder and land more often. Out of combat it burns reagents to bind runes.",
    train:
      "Cast runes for steady flat XP, or fight using the Magic combat style to train it off tick damage. Rune casting consumes its reagent every action.",
  },
  attack: {
    role: "Combat",
    aliases: "attack accuracy melee hit chance fighting",
    what: "Decides how often your melee hits land. It does not raise damage on its own (that is Strength), but a miss deals nothing at all.",
    train:
      "Fight using the Attack combat style. XP comes from damage dealt per tick, so stronger monsters train it faster.",
  },
  strength: {
    role: "Combat",
    aliases: "strength max hit damage power melee",
    what: "Sets your melee max hit, the top of your damage range on every landed swing.",
    train:
      "Fight using the Strength combat style. Like all combat skills it earns XP from damage dealt, so pair it with gear that raises your max hit.",
  },
  defence: {
    role: "Combat",
    aliases: "defence defense armour mitigation tank damage taken",
    what: "Cuts the damage you take. It is what keeps unattended and offline combat from ending in a respawn and a gold loss.",
    train:
      "Fight using the Defence combat style. Slower to level than the offensive styles, but it is what lets you park on higher-tier monsters.",
  },
  hp: {
    role: "Combat",
    aliases: "hitpoints hp health constitution life regen",
    what: "Your health pool and how fast it regenerates. A bigger pool means longer unattended fights before food or a respawn.",
    train:
      "Trains passively from every combat style at once. You cannot train it directly, and it climbs the whole time you fight.",
  },
  meditation: {
    role: "Support",
    aliases: "meditate meditation focus mastery points cinematics memory rest",
    what: "A cooldown skill rather than an action skill, and the main source of Mastery Point rolls. It also gates the cinematic memory story and appears as a requirement on more quests than any other skill.",
    train:
      "Sessions are gated by a cooldown (60s base, reducible by gear and the skill tree). XP per session scales with your Meditation level, so it accelerates as it climbs.",
  },
  adventurer: {
    role: "Progression",
    aliases:
      "adventurer contracts hall quartermaster streaks pathfinder seals reputation",
    what: "Levels off completed Adventurer's Hall contracts. Your Adventurer level sets which contracts are offered, how much gold they pay, and how far the streak bonuses reach.",
    train:
      "Complete contracts. XP uses an effective level window so a single maxed unrelated skill cannot vault a fresh Adventurer up the ladder.",
  },
  root_lore: {
    role: "Gathering",
    aliases:
      "root lore herbs fungi bark yarrow ashblossom mistcap rootveil gleam thistle harvest gather whisperwood sickle",
    what: "Harvests herbs, fungi and bark at Root Lore nodes in the Whisperwood. Those materials feed Alchemy, Aetheric Tending, and Cooking.",
    train:
      "Work the highest Root Lore node you have the level for and leave it running. Each action takes a fixed number of seconds for flat XP, so your XP/hour is decided by which node you can reach.",
  },
  aetheric_tending: {
    role: "Artisan",
    aliases:
      "aetheric tending plots plant harvest crops soil grow garden patch grove herbs trowel",
    what: "Plants herbs in soil plots that grow in real time, offline included, and harvests them on return. It is a plot skill, not an action-slot gather.",
    train:
      "Plant the highest crop you have the level and seed for, then collect when it is ripe. Plots keep growing while you train something else and while the app is closed.",
  },
  spiritbond: {
    role: "Support",
    aliases:
      "spiritbond companion companions bond forage pale hound canopy sprite root stalker whisper drake ancient treant grove guardian heartwood elder tether",
    what: "Bonds with one Whisperwood companion at a time. The companion grants passive bonuses and returns materials from offline forage runs.",
    train:
      "Keep a companion bonded. XP trickles while they are home and the app is open, and a larger grant lands when you collect a forage return.",
  },
  alchemy: {
    role: "Artisan",
    aliases:
      "alchemy brew potions tonic elixir draught flask tincture distillate herbs buffs crucible",
    what: "Brews potions from herbs. These are the first timed buffs in the game: they burn wall-clock time and carry into an offline session.",
    train:
      "Brew the highest recipe you have herbs for. XP is paid per brew, so Root Lore stock is what keeps the queue fed.",
  },
};

// Planned releases in shipping order. Everything here is design-stage and can
// change before release, which every card says out loud. Story hooks are kept
// in a separate `hook` field so they can be rendered behind a collapsed spoiler
// guard. The roadmap should be readable without spoiling the base game.
const ROADMAP_DISCLAIMER =
  "Everything on this page is planned, not promised. Content, names, and numbers are still in design and can change before release.";

const ROADMAP = [
  {
    id: "expansion-2",
    order: 1,
    name: "Expansion 2: The Salt Accord",
    tagline: "Tideward, and the harbour that kept trading",
    status: "Next up, second paid expansion",
    access: "Paid expansion",
    levelCap: "110",
    unlock: "Requires Expansion 1, which shipped in 1.2.0.",
    hook: "A letter signed by the Salt Accord leads to Tideward Harbor, a coastal city-state that has been trading with the old Accord in secret for decades. The Tide Merchants have technology, answers about the Architects, and leverage, but Tideward is not unified, and a resistance has been quietly protecting something in the flooded ruins beneath the harbour.",
    zones: [
      [
        "Tideward Harbor",
        "The main port city and entry zone: human enemies, market access, and faction politics.",
      ],
      [
        "The Open Shallows",
        "Coastal waters beyond the harbour mouth, with sea creatures, cultists, and ten new fish species found nowhere else.",
      ],
      [
        "The Drowned Ruins",
        "A flooded Architect outpost beneath the harbour, reached through a submerged entrance. Both bosses are here.",
      ],
      [
        "The Merchant's Isle",
        "A fortified island seat of power, and the political flashpoint of the expansion's final act.",
      ],
    ],
    skills: [
      [
        "Echomind",
        "Passive",
        "Earns XP on every monster kill, scaled by enemy difficulty. No active interaction; it levels in the background as you fight.",
      ],
      [
        "Wayfaring",
        "Exploration / Passive",
        "Dispatch expeditions to charted destinations while idle. Set a route, come back later, collect the return. Higher levels open more distant and rewarding routes.",
      ],
      [
        "Ironlock",
        "Artisan",
        "Craft ranged weapons and the ammunition that feeds them. Weapons persist; bullets are consumed on every attack, creating a live ore-to-ammunition supply chain.",
      ],
      [
        "Deadeye",
        "Combat",
        "Ranged combat using Ironlock weapons, with three styles and a required ammunition supply. Running dry falls back to melee automatically.",
      ],
    ],
    faction: {
      name: "The Tide Merchants",
      tagline: "Everything is negotiable, including the truth.",
      desc: "A trading power split three ways: a guildmaster who wants a deal, a harbourmaster who wants outsiders gone, and an admiral running a resistance that answers to neither.",
    },
    features: [
      "A twenty-quest arc, The Salt Accord, across five acts.",
      "Two bosses: The Drowned Keeper, and Admiral Vael.",
      "The first ranged combat line in the game, tuned for players around level 105.",
    ],
  },
  {
    id: "expansion-3",
    order: 2,
    name: "Expansion 3: Drakenhollow",
    tagline: "The first site, still running",
    status: "Planned",
    access: "Paid expansion",
    levelCap: "115",
    unlock: "Requires Expansion 2.",
    hook: "The Architect Fragments, the Drowned Ruins, and the Grove Covenant's oldest records all converge on one place: a volcanic underground network beneath the Shrouded Peaks. It was not just a mine. It was the first site. The Architects did not discover Kaldreth. They built it. And the original construction engine is still running.",
    zones: [
      [
        "The Ashfall Descent",
        "The volcanic tunnel system down from the Shrouded Peaks, lined with centuries-stale Accord survey markers. The heat is manageable at first.",
      ],
      [
        "Drakenhollow Proper",
        "The main underground settlement, built over generations from Architect remnants and volcanic stone. Forge-pits, market stalls, and grudging hospitality.",
      ],
      [
        "The Forge Caverns",
        "The deep, partially Architect-operational forge complex. Spiritforging is only possible here, at temperatures no surface forge can match.",
      ],
      [
        "The Origin Chamber",
        "Sealed until the expansion's final acts. No one alive has stood inside it.",
      ],
    ],
    skills: [
      [
        "Hollowing",
        "Gathering",
        "Precision digging for ancient materials and buried caches. Runs in fixed-duration dig sessions that end in a multi-item discovery, with a hidden chance to surface an equippable Relic.",
      ],
      [
        "Spiritforging",
        "Artisan",
        "Combines Smithing bars with spirit materials to produce gear with active trigger effects: conditional bonuses that fire during combat rather than flat stats. The artisan endgame.",
      ],
      [
        "Geomancy",
        "Combat / Magic",
        "An earth-and-fire magic school parallel to Fracture Arts but mechanically distinct: lava spells add damage over time, stone spells hit in burst.",
      ],
    ],
    faction: {
      name: "The Ashborne",
      tagline: "Built from what the Architects left behind.",
      desc: "The generations-old underground community that made Drakenhollow habitable, holding their ground against regular raids and extending hospitality only to outsiders who have earned it.",
    },
    features: [
      "A twenty-quest arc, The First Breath, across five acts.",
      "Fifteen new enemies and three bosses: The Smelter, Forge-Warden Korrath, and The Origin Engine.",
    ],
  },
  {
    id: "expansion-4",
    order: 3,
    name: "Expansion 4, Oraewyn: The Fractured Sky",
    tagline: "The capstone, and the people who have been watching",
    status: "Planned, final expansion",
    access: "Paid expansion",
    levelCap: "120",
    unlock: "Requires Expansion 3. Intended for players who have completed everything before it.",
    hook: "The Origin Engine is not only a construction machine. It is a relay, and it has been broadcasting upward. Oraewyn, the floating island chain visible on clear days above the Shrouded Peaks, is where the signal goes. It is also where the original Architects came from. They have been watching.",
    zones: [
      [
        "The Sky Ascent",
        "The vertical route up to Oraewyn's lower edge, a Wayfaring route series with combat encounters at each altitude threshold. No one from the surface has climbed this high since before the Accord.",
      ],
      [
        "Oraewyn Lowlands",
        "The first solid ground on the islands, deliberately kept accessible as a buffer zone. The landscape is older and more deliberate than anything in Aetheria: built rather than grown.",
      ],
      [
        "The Watcher's Spire",
        "The Conclave's central structure: archives spanning centuries and instruments pointed at the surface. Every faction NPC you have met has a file here. So do you.",
      ],
      [
        "The Threshold",
        "The final zone. A circular chamber at the Spire's peak, open to the sky, built as a convergence point.",
      ],
    ],
    skills: [
      [
        "Astromancy",
        "Combat / Magic",
        "The third and final magic school, drawn from star charts and orbital resonance. Spells key off celestial cycle windows and several require deep investment in Geomancy and Lorekeeper.",
      ],
      [
        "Lorekeeper",
        "Passive / Collection",
        "Levels through discovery rather than active play: memory fragments, flagged Hollowing artifacts, rare achievements, and hidden zone finds. Milestones every ten levels unlock hidden lore entries and passive bonuses.",
      ],
      [
        "Transcendence",
        "Meta-system",
        "A post-mastery prestige loop. Condense any skill at 99 or above to reset it to level 1 in exchange for a Transcendence Point, each granting a permanent global bonus that stacks. Nothing is locked away; all content stays available to re-earn.",
      ],
    ],
    faction: {
      name: "The Watcher Conclave",
      tagline: "They have a file on you.",
      desc: "The observers above the surface, split into two wings whose tension has been building for longer than the Fracture has existed.",
    },
    features: [
      "A twenty-five-quest arc, The Fractured Sky, the longest in the game.",
      "Sixteen new enemies and four bosses, ending with the Resonance Wraith and the Threshold itself.",
      "A significant difficulty spike by design: every system built across four expansions has a moment of payoff here.",
    ],
  },
];

const BUILD_FOCUS_VALUES = ["attack", "magic", "defence"];
const GAME_RESPAWN_TICKS = 2;
const PLAYER_COMBAT_STYLES = new Set([
  "balanced",
  "attack",
  "strength",
  "defence",
  "magic",
]);

// Pale Flicker, the 1.00x power / +0 accuracy spell the whole magic damage
// formula was built around before spells carried their own tuning.
const DEFAULT_SPELL_ID = "cast_spark";

const state = {
  data: null,
  category: "all",
  search: "",
  revealSpoilers: false,
  playerCombatStyle: "balanced",
  // Pale Flicker is the 1.00x baseline, so this default reproduces the
  // pre-1.0.9 magic numbers for anyone loading an older saved preset or URL.
  playerSpellId: DEFAULT_SPELL_ID,
  playerAttackLevel: 1,
  playerStrengthLevel: 1,
  playerDefenceLevel: 1,
  playerMagicLevel: 1,
  playerHitpointsLevel: 10,
  playerAtkGearBonus: 0,
  playerStrGearBonus: 0,
  playerDefGearBonus: 0,
  playerMagGearBonus: 0,
  playerCombatDamageBonusPct: 0,
  playerAttackMasteryHitBonusPct: 0,
  playerStrengthMasteryMaxHitBonusPct: 0,
  playerMagicMasteryHitBonusPct: 0,
  playerMagicMasteryMaxHitBonusPct: 0,
  playerCombatTickSeconds: 1.2,
  skillXpBonusBySkill: {},
  sellPriceBonusPct: 0,
  combatGoldBonusPct: 0,
  artisanMaterialDropBonusPct: 0,
  resonanceCrystalDropBonusPct: 0,
  xpCurrentLevel: 1,
  xpTargetLevel: 50,
  xpRate: 25000,
  dropMonsterId: "",
  dropItemId: "",
  dropKills: 100,
  dropTargetQty: 10,
  dropKillRate: 80,
  affordItemId: "",
  affordGpRate: 100000,
  affordQty: 1,
  routeSkill: "",
  routeCurrentLevel: 1,
  routeTargetLevel: 60,
  routePriority: "xp",
  compareA: "",
  compareB: "",
  compareXpGoal: 100000,
  buildFocus: "attack",
  buildBudget: 250000,
  buildGpRate: 100000,
  buildAttackLevel: 1,
  buildDefenceLevel: 1,
  buildMagicLevel: 1,
  buildDungeonCompletion: "all",
  simXpRate: 25000,
  simGpRate: 100000,
  farmRouteXpTarget: 150000,
  farmRouteGpTarget: 250000,
  farmRouteMaxSteps: 4,
  farmRouteSkillFilter: "all",
  activePlannerTab: "xp",
  compactCards: true,
  expandedCards: {},
  presets: {},
  tourStep: 0,
  tourDone: false,
  touchStartX: null,
};

const dom = {};

init().catch((error) => {
  console.error(error);
  const content = document.getElementById("content");
  if (content) {
    content.innerHTML = `<article class="card"><h3 class="card-title">Unable to load wiki data</h3><p class="muted">${escapeHtml(error.message || String(error))}</p></article>`;
  }
});

async function init() {
  bindDom();
  loadStateFromUrl();
  loadSavedPresets();
  const response = await fetch(DATA_URL, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(
      `Failed to load ${DATA_URL}: ${response.status} ${response.statusText}`,
    );
  }
  state.data = await response.json();
  state.model = buildModel(state.data);
  initializePlannerState();
  wireControls();
  render();
  initializeTour();
}

function bindDom() {
  dom.search = document.getElementById("search");
  dom.category = document.getElementById("category");
  dom.spoilers = document.getElementById("spoilers");
  dom.compactCards = document.getElementById("compact-cards");
  dom.presetSelect = document.getElementById("preset-select");
  dom.presetSave = document.getElementById("preset-save");
  dom.presetLoad = document.getElementById("preset-load");
  dom.presetDelete = document.getElementById("preset-delete");
  dom.playerCombatStyle = document.getElementById("player-combat-style");
  dom.playerSpell = document.getElementById("player-spell");
  dom.playerAttackLevel = document.getElementById("player-attack-level");
  dom.playerStrengthLevel = document.getElementById("player-strength-level");
  dom.playerDefenceLevel = document.getElementById("player-defence-level");
  dom.playerMagicLevel = document.getElementById("player-magic-level");
  dom.playerHitpointsLevel = document.getElementById("player-hitpoints-level");
  dom.playerAtkGearBonus = document.getElementById("player-atk-gear-bonus");
  dom.playerStrGearBonus = document.getElementById("player-str-gear-bonus");
  dom.playerDefGearBonus = document.getElementById("player-def-gear-bonus");
  dom.playerMagGearBonus = document.getElementById("player-mag-gear-bonus");
  dom.playerCombatDamageBonusPct = document.getElementById(
    "player-combat-damage-bonus",
  );
  dom.playerAttackMasteryHitBonusPct = document.getElementById(
    "player-attack-mastery-hit-bonus",
  );
  dom.playerStrengthMasteryMaxHitBonusPct = document.getElementById(
    "player-strength-mastery-max-hit-bonus",
  );
  dom.playerMagicMasteryHitBonusPct = document.getElementById(
    "player-magic-mastery-hit-bonus",
  );
  dom.playerMagicMasteryMaxHitBonusPct = document.getElementById(
    "player-magic-mastery-max-hit-bonus",
  );
  dom.playerCombatTickSeconds = document.getElementById(
    "player-combat-tick-seconds",
  );
  dom.content = document.getElementById("content");
  dom.countTotal = document.getElementById("count-total");
  dom.summaryGrid = document.getElementById("summary-grid");
  dom.bestXp = document.getElementById("best-xp");
  dom.bestGp = document.getElementById("best-gp");
  dom.bestRatio = document.getElementById("best-ratio");
  dom.xpCurrentLevel = document.getElementById("xp-current-level");
  dom.xpTargetLevel = document.getElementById("xp-target-level");
  dom.xpRate = document.getElementById("xp-rate");
  dom.xpPlannerOutput = document.getElementById("xp-planner-output");
  dom.dropMonster = document.getElementById("drop-monster");
  dom.dropItem = document.getElementById("drop-item");
  dom.dropKills = document.getElementById("drop-kills");
  dom.dropTargetQty = document.getElementById("drop-target-qty");
  dom.dropKillRate = document.getElementById("drop-kill-rate");
  dom.dropPlannerOutput = document.getElementById("drop-planner-output");
  dom.affordItem = document.getElementById("afford-item");
  dom.affordGpRate = document.getElementById("afford-gp-rate");
  dom.affordQty = document.getElementById("afford-qty");
  dom.affordPlannerOutput = document.getElementById("afford-planner-output");
  dom.routeSkill = document.getElementById("route-skill");
  dom.routeCurrentLevel = document.getElementById("route-current-level");
  dom.routeTargetLevel = document.getElementById("route-target-level");
  dom.routePriority = document.getElementById("route-priority");
  dom.routePlannerOutput = document.getElementById("route-planner-output");
  dom.compareA = document.getElementById("compare-a");
  dom.compareB = document.getElementById("compare-b");
  dom.compareXpGoal = document.getElementById("compare-xp-goal");
  dom.compareOutput = document.getElementById("compare-output");
  dom.buildFocus = document.getElementById("build-focus");
  dom.buildBudget = document.getElementById("build-budget");
  dom.buildGpRate = document.getElementById("build-gp-rate");
  dom.buildAttackLevel = document.getElementById("build-attack-level");
  dom.buildDefenceLevel = document.getElementById("build-defence-level");
  dom.buildMagicLevel = document.getElementById("build-magic-level");
  dom.buildDungeonComplete = document.getElementById("build-dungeon-complete");
  dom.buildOutput = document.getElementById("build-output");
  dom.simXpRate = document.getElementById("sim-xp-rate");
  dom.simGpRate = document.getElementById("sim-gp-rate");
  dom.simOutput = document.getElementById("sim-output");
  dom.routeXpTarget = document.getElementById("route-xp-target");
  dom.routeGpTarget = document.getElementById("route-gp-target");
  dom.routeMaxSteps = document.getElementById("route-max-steps");
  dom.routeSkillFilter = document.getElementById("route-skill-filter");
  dom.farmRouteOutput = document.getElementById("farm-route-output");
  dom.diagnosticsOutput = document.getElementById("diagnostics-output");
  dom.planners = document.getElementById("planners");
  dom.plannerTabs = document.getElementById("planner-tabs");
  dom.leaderboards = document.querySelector(".leaderboards");
  dom.mobileSectionJump = document.getElementById("mobile-section-jump");
  dom.mobileNav = document.querySelector(".mobile-nav");
  dom.tourOverlay = document.getElementById("tour-overlay");
  dom.tourStepLabel = document.getElementById("tour-step-label");
  dom.tourTitle = document.getElementById("tour-title");
  dom.tourBody = document.getElementById("tour-body");
  dom.tourPrev = document.getElementById("tour-prev");
  dom.tourNext = document.getElementById("tour-next");
  dom.tourClose = document.getElementById("tour-close");
}

function bindNumericInput(
  inputEl,
  stateKey,
  min,
  max,
  fallback,
  onChange = null,
) {
  if (!inputEl) return;

  inputEl.addEventListener("input", () => {
    const raw = String(inputEl.value ?? "").trim();
    if (raw === "" || raw === "-") {
      return;
    }
    const numeric = Number(raw);
    if (!Number.isFinite(numeric)) {
      return;
    }
    state[stateKey] = clampNumber(numeric, min, max, fallback);
    if (onChange) onChange();
    else renderCalculators(state.model);
  });

  inputEl.addEventListener("blur", () => {
    state[stateKey] = clampNumber(inputEl.value, min, max, fallback);
    if (onChange) onChange();
    else renderCalculators(state.model);
  });
}

function rebuildModelAndRender() {
  if (!state.data) return;
  state.model = buildModel(state.data);
  render();
}

function wireControls() {
  dom.search.addEventListener("input", () => {
    state.search = dom.search.value.trim().toLowerCase();
    render();
  });
  dom.category.addEventListener("change", () => {
    state.category = dom.category.value;
    render();
    scrollToCategorySection(state.category);
  });
  dom.spoilers.addEventListener("change", () => {
    state.revealSpoilers = dom.spoilers.checked;
    // Detail/table accordions bake their open state into entry.body at
    // model-build time, so rebuild the model to honour the new setting.
    rebuildModelAndRender();
  });
  if (dom.compactCards) {
    dom.compactCards.addEventListener("change", () => {
      state.compactCards = dom.compactCards.checked;
      render();
    });
  }
  if (dom.presetSave) {
    dom.presetSave.addEventListener("click", () => {
      const name = window.prompt("Preset name:");
      if (!name) return;
      savePreset(name.trim());
    });
  }
  if (dom.presetLoad) {
    dom.presetLoad.addEventListener("click", () => {
      const name = dom.presetSelect?.value || "";
      if (!name) return;
      applyPresetByName(name);
    });
  }
  if (dom.presetDelete) {
    dom.presetDelete.addEventListener("click", () => {
      const name = dom.presetSelect?.value || "";
      if (!name) return;
      deletePreset(name);
    });
  }
  if (dom.presetSelect) {
    dom.presetSelect.addEventListener("change", () => {
      const name = dom.presetSelect.value;
      if (!name) return;
      applyPresetByName(name);
    });
  }
  if (dom.playerCombatStyle) {
    dom.playerCombatStyle.addEventListener("change", () => {
      state.playerCombatStyle = String(
        dom.playerCombatStyle.value || "balanced",
      );
      rebuildModelAndRender();
    });
  }
  if (dom.playerSpell) {
    dom.playerSpell.addEventListener("change", () => {
      state.playerSpellId = String(dom.playerSpell.value || DEFAULT_SPELL_ID);
      rebuildModelAndRender();
    });
  }
  bindNumericInput(
    dom.playerAttackLevel,
    "playerAttackLevel",
    1,
    SKILL_LEVEL_CAP,
    1,
    rebuildModelAndRender,
  );
  bindNumericInput(
    dom.playerStrengthLevel,
    "playerStrengthLevel",
    1,
    SKILL_LEVEL_CAP,
    1,
    rebuildModelAndRender,
  );
  bindNumericInput(
    dom.playerDefenceLevel,
    "playerDefenceLevel",
    1,
    SKILL_LEVEL_CAP,
    1,
    rebuildModelAndRender,
  );
  bindNumericInput(
    dom.playerMagicLevel,
    "playerMagicLevel",
    1,
    SKILL_LEVEL_CAP,
    1,
    rebuildModelAndRender,
  );
  bindNumericInput(
    dom.playerHitpointsLevel,
    "playerHitpointsLevel",
    1,
    SKILL_LEVEL_CAP,
    10,
    rebuildModelAndRender,
  );
  bindNumericInput(
    dom.playerAtkGearBonus,
    "playerAtkGearBonus",
    0,
    999,
    0,
    rebuildModelAndRender,
  );
  bindNumericInput(
    dom.playerStrGearBonus,
    "playerStrGearBonus",
    0,
    999,
    0,
    rebuildModelAndRender,
  );
  bindNumericInput(
    dom.playerDefGearBonus,
    "playerDefGearBonus",
    0,
    999,
    0,
    rebuildModelAndRender,
  );
  bindNumericInput(
    dom.playerMagGearBonus,
    "playerMagGearBonus",
    0,
    999,
    0,
    rebuildModelAndRender,
  );
  bindNumericInput(
    dom.playerCombatDamageBonusPct,
    "playerCombatDamageBonusPct",
    0,
    300,
    0,
    rebuildModelAndRender,
  );
  bindNumericInput(
    dom.playerAttackMasteryHitBonusPct,
    "playerAttackMasteryHitBonusPct",
    0,
    100,
    0,
    rebuildModelAndRender,
  );
  bindNumericInput(
    dom.playerStrengthMasteryMaxHitBonusPct,
    "playerStrengthMasteryMaxHitBonusPct",
    0,
    300,
    0,
    rebuildModelAndRender,
  );
  bindNumericInput(
    dom.playerMagicMasteryHitBonusPct,
    "playerMagicMasteryHitBonusPct",
    0,
    100,
    0,
    rebuildModelAndRender,
  );
  bindNumericInput(
    dom.playerMagicMasteryMaxHitBonusPct,
    "playerMagicMasteryMaxHitBonusPct",
    0,
    300,
    0,
    rebuildModelAndRender,
  );
  bindNumericInput(
    dom.playerCombatTickSeconds,
    "playerCombatTickSeconds",
    0.1,
    10,
    1.2,
    rebuildModelAndRender,
  );

  bindNumericInput(dom.xpCurrentLevel, "xpCurrentLevel", 1, SKILL_LEVEL_CAP, 1);
  bindNumericInput(dom.xpTargetLevel, "xpTargetLevel", 1, SKILL_LEVEL_CAP, 50);
  bindNumericInput(dom.xpRate, "xpRate", 1, 1000000000, 25000);

  if (dom.dropMonster) {
    dom.dropMonster.addEventListener("change", () => {
      state.dropMonsterId = dom.dropMonster.value;
      populateDropItemOptions(state.model);
      renderCalculators(state.model);
    });
  }

  if (dom.dropItem) {
    dom.dropItem.addEventListener("change", () => {
      state.dropItemId = dom.dropItem.value;
      renderCalculators(state.model);
    });
  }

  bindNumericInput(dom.dropKills, "dropKills", 1, 1000000, 100);
  bindNumericInput(dom.dropTargetQty, "dropTargetQty", 1, 1000000, 10);
  bindNumericInput(dom.dropKillRate, "dropKillRate", 1, 1000000, 80);

  if (dom.affordItem) {
    dom.affordItem.addEventListener("change", () => {
      state.affordItemId = dom.affordItem.value;
      renderCalculators(state.model);
    });
  }

  bindNumericInput(dom.affordGpRate, "affordGpRate", 1, 1000000000, 100000);
  bindNumericInput(dom.affordQty, "affordQty", 1, 1000000, 1);

  if (dom.routeSkill) {
    dom.routeSkill.addEventListener("change", () => {
      state.routeSkill = dom.routeSkill.value;
      renderCalculators(state.model);
    });
  }

  bindNumericInput(dom.routeCurrentLevel, "routeCurrentLevel", 1, SKILL_LEVEL_CAP, 1);
  bindNumericInput(dom.routeTargetLevel, "routeTargetLevel", 1, SKILL_LEVEL_CAP, 60);

  if (dom.routePriority) {
    dom.routePriority.addEventListener("change", () => {
      state.routePriority = dom.routePriority.value;
      renderCalculators(state.model);
    });
  }

  if (dom.compareA) {
    dom.compareA.addEventListener("change", () => {
      state.compareA = dom.compareA.value;
      renderCalculators(state.model);
    });
  }

  if (dom.compareB) {
    dom.compareB.addEventListener("change", () => {
      state.compareB = dom.compareB.value;
      renderCalculators(state.model);
    });
  }

  bindNumericInput(dom.compareXpGoal, "compareXpGoal", 1, 1000000000, 100000);

  if (dom.buildFocus) {
    dom.buildFocus.addEventListener("change", () => {
      state.buildFocus = dom.buildFocus.value;
      renderCalculators(state.model);
    });
  }

  bindNumericInput(dom.buildBudget, "buildBudget", 1, 1000000000, 250000);
  bindNumericInput(dom.buildGpRate, "buildGpRate", 1, 1000000000, 100000);
  bindNumericInput(dom.buildAttackLevel, "buildAttackLevel", 1, SKILL_LEVEL_CAP, 1);
  bindNumericInput(dom.buildDefenceLevel, "buildDefenceLevel", 1, SKILL_LEVEL_CAP, 1);
  bindNumericInput(dom.buildMagicLevel, "buildMagicLevel", 1, SKILL_LEVEL_CAP, 1);
  if (dom.buildDungeonComplete) {
    dom.buildDungeonComplete.addEventListener("change", () => {
      state.buildDungeonCompletion = dom.buildDungeonComplete.value || "all";
      renderCalculators(state.model);
    });
  }

  bindNumericInput(dom.simXpRate, "simXpRate", 1, 1000000000, 25000);
  bindNumericInput(dom.simGpRate, "simGpRate", 1, 1000000000, 100000);

  bindNumericInput(
    dom.routeXpTarget,
    "farmRouteXpTarget",
    0,
    1000000000,
    150000,
  );
  bindNumericInput(
    dom.routeGpTarget,
    "farmRouteGpTarget",
    0,
    1000000000,
    250000,
  );
  bindNumericInput(dom.routeMaxSteps, "farmRouteMaxSteps", 1, 10, 4);

  if (dom.routeSkillFilter) {
    dom.routeSkillFilter.addEventListener("change", () => {
      state.farmRouteSkillFilter = dom.routeSkillFilter.value;
      renderCalculators(state.model);
    });
  }

  if (dom.plannerTabs) {
    dom.plannerTabs.addEventListener("click", (event) => {
      const button = event.target.closest("[data-tab]");
      if (!button) return;
      state.activePlannerTab = button.dataset.tab || "xp";
      applyPlannerTabState();
      if (window.matchMedia("(max-width: 720px)").matches) {
        scrollToTarget("planner-tabs");
      }
    });
  }

  if (dom.planners) {
    dom.planners.addEventListener(
      "touchstart",
      (event) => {
        state.touchStartX = event.changedTouches?.[0]?.clientX ?? null;
      },
      { passive: true },
    );
    dom.planners.addEventListener(
      "touchend",
      (event) => {
        const endX = event.changedTouches?.[0]?.clientX;
        if (!Number.isFinite(state.touchStartX) || !Number.isFinite(endX)) {
          state.touchStartX = null;
          return;
        }
        const delta = endX - state.touchStartX;
        state.touchStartX = null;
        if (Math.abs(delta) < 40) return;
        shiftPlannerTab(delta < 0 ? 1 : -1);
      },
      { passive: true },
    );
  }

  if (dom.mobileNav) {
    dom.mobileNav.addEventListener("click", (event) => {
      const button = event.target.closest("button[data-nav]");
      if (!button) return;
      handleQuickNav(button.dataset.nav || "");
    });
  }

  if (dom.mobileSectionJump) {
    dom.mobileSectionJump.addEventListener("change", () => {
      const targetId = dom.mobileSectionJump.value;
      if (!targetId) return;
      scrollToTarget(targetId);
      dom.mobileSectionJump.value = "";
    });
  }

  if (dom.tourPrev) {
    dom.tourPrev.addEventListener("click", () => {
      state.tourStep = Math.max(0, state.tourStep - 1);
      renderTourStep();
    });
  }
  if (dom.tourNext) {
    dom.tourNext.addEventListener("click", () => {
      state.tourStep = Math.min(TOUR_STEPS.length - 1, state.tourStep + 1);
      renderTourStep();
    });
  }
  if (dom.tourClose) {
    dom.tourClose.addEventListener("click", () => {
      closeTour(true);
    });
  }

  if (dom.content) {
    dom.content.addEventListener("click", (event) => {
      const toggle = event.target.closest(".card-toggle");
      if (!toggle) return;
      const key = toggle.dataset.cardKey || "";
      if (!key) return;
      state.expandedCards[key] = !state.expandedCards[key];
      render();
    });
  }

  window.addEventListener("resize", applyPlannerTabState);
}

function buildModel(data) {
  const files = data.sources || {};
  const itemFile = getConstFile(files, "client/data/ItemData.gd");
  const skillFile = getConstFile(files, "client/data/SkillData.gd");
  const questFile = getConstFile(files, "client/data/QuestData.gd");
  const adventurerFile = getConstFile(files, "client/data/AdventurerData.gd");
  const taskFile = getConstFile(files, "client/data/TaskData.gd");
  const factionFile = getConstFile(files, "client/data/FactionData.gd");
  const dungeonFile = getConstFile(files, "client/data/BossDungeonData.gd");
  const companionFile = getConstFile(files, "client/data/CompanionData.gd");
  const patchFile = getConstFile(files, "client/data/PatchNotesData.gd");
  const buildInfoFile = getConstFile(files, "client/data/BuildInfo.gd");
  const achievementFile = getConstFile(files, "client/data/AchievementData.gd");
  const titleFile = getConstFile(files, "client/data/TitleData.gd");
  const milestoneFile = getConstFile(files, "client/data/MilestoneData.gd");
  const autoPassiveFile = getConstFile(files, "client/data/AutoPassiveData.gd");
  const skillTreeFile = getConstFile(files, "client/data/SkillTreeData.gd");
  const monsterFile = getConstFile(files, "client/autoload/GameState.gd");

  const items = itemFile.ITEMS || {};
  const playerCombatProfile = getPlayerCombatProfile();
  const itemIds = Object.keys(items);
  const sourceProfiles = buildItemSourceProfiles(
    itemIds,
    itemFile,
    skillFile,
    monsterFile,
    questFile,
    dungeonFile,
    taskFile,
    adventurerFile,
  );
  const monsters = monsterFile._monster_defs_data || {};
  const quests = questFile.ALL_QUESTS || [];
  const factions = factionFile.ALL_FACTIONS || [];
  const dungeons = dungeonFile.ALL_DUNGEONS || [];
  const companions = companionFile.ALL_COMPANIONS || [];
  const patches = patchFile.RELEASES || [];
  const achievements =
    achievementFile.ALL || achievementFile.ALL_ACHIEVEMENTS || [];
  const titles = titleFile.ALL_TITLES || [];
  const lockedAreas = adventurerFile.LOCKED_AREAS || [];
  const contractPool = adventurerFile.CONTRACT_POOL || {};
  const dailyTaskPool = taskFile.DAILY_POOL || [];
  const weeklyTaskPool = taskFile.WEEKLY_POOL || [];
  const milestones = milestoneFile.SKILL_MILESTONE_LORE || {};
  const autoPassives =
    autoPassiveFile.ALL || autoPassiveFile.ALL_PASSIVES || [];
  const skillTreeBranches =
    skillTreeFile.BRANCHES ||
    skillTreeFile.ALL_BRANCHES ||
    skillTreeFile.TREES ||
    [];

  const skills = buildSkillEntries(
    skillFile,
    itemFile,
    state.data,
    milestones,
    skillTreeBranches,
    monsterFile,
    autoPassives,
    quests,
    milestoneFile.SKILL_MILESTONES || [],
  );
  const itemEntries = buildItemEntries(
    items,
    itemFile,
    skillFile,
    monsterFile,
    questFile,
    dungeonFile,
  );
  const monsterEntries = buildMonsterEntries(
    monsters,
    itemFile,
    playerCombatProfile,
  );
  const questEntries = buildQuestEntries(quests, itemFile, skillFile, questFile);
  const fragmentEntries = buildFragmentEntries(questFile);
  const npcEntries = buildNpcEntries(quests);
  const vendorEntries = buildVendorEntries(itemFile, monsterFile);
  const dungeonEntries = buildDungeonEntries(dungeons, itemFile, questFile);
  const factionEntries = buildFactionEntries(factions);
  const achievementEntries = buildAchievementEntries(achievements);
  const titleEntries = buildTitleEntries(titles);
  const patchEntries = buildPatchEntries(patches);
  const passiveEntries = buildPassiveEntries(autoPassives);
  const skillTreeEntries = buildSkillTreeEntries(
    skillTreeBranches,
    skillTreeFile.ALL_NODES || [],
  );
  const contractEntries = buildContractEntries(
    contractPool,
    lockedAreas,
    itemFile,
    monsterFile,
    skillFile,
    adventurerFile,
  );
  const taskEntries = buildTaskEntries(
    dailyTaskPool,
    weeklyTaskPool,
    taskFile,
    itemFile,
    skillFile,
  );
  const whisperwoodEntries = buildWhisperwoodEntries(
    quests,
    monsterFile,
    items,
    achievements,
    titles,
    dungeons,
    factions,
    companions,
  );
  const roadmapEntries = buildRoadmapEntries(ROADMAP);
  const mechanicsEntries = buildMechanicEntries(
    skillFile,
    monsterFile,
    adventurerFile,
    buildInfoFile,
    itemFile,
  );

  const allEntries = [
    ...itemEntries,
    ...monsterEntries,
    ...skills,
    ...skillTreeEntries,
    ...contractEntries,
    ...taskEntries,
    ...questEntries,
    ...fragmentEntries,
    ...npcEntries,
    ...vendorEntries,
    ...dungeonEntries,
    ...factionEntries,
    ...achievementEntries,
    ...titleEntries,
    ...mechanicsEntries,
    ...whisperwoodEntries,
    ...roadmapEntries,
    ...patchEntries,
    ...passiveEntries,
  ].sort((left, right) => left.sortKey.localeCompare(right.sortKey));

  const boardRows = buildEfficiencyRows({
    itemFile,
    skillFile,
    monsters,
    playerCombatProfile,
  });

  const summary = SECTION_ORDER.map(([key, label]) => ({
    key,
    label,
    count: allEntries.filter((entry) => entry.section === key).length,
  }));

  return {
    files,
    itemFile,
    skillFile,
    questFile,
    adventurerFile,
    taskFile,
    factionFile,
    dungeonFile,
    companionFile,
    patchFile,
    buildInfoFile,
    achievementFile,
    titleFile,
    milestoneFile,
    autoPassiveFile,
    skillTreeFile,
    monsterFile,
    items,
    itemIds,
    sourceProfiles,
    monsters,
    quests,
    vendors: vendorEntries,
    factions,
    dungeons,
    companions,
    patches,
    achievements,
    titles,
    lockedAreas,
    contractPool,
    dailyTaskPool,
    weeklyTaskPool,
    milestones,
    autoPassives,
    skillTreeBranches,
    entries: allEntries,
    summary,
    boardRows,
  };
}

function getConstFile(files, path) {
  const file = files[path] || { consts: {}, specials: {} };
  return {
    ...file.consts,
    ...file.specials,
  };
}

function initializePlannerState() {
  const model = state.model;
  if (!model) {
    return;
  }

  updatePresetOptions();

  if (!BUILD_FOCUS_VALUES.includes(state.buildFocus)) {
    state.buildFocus = "attack";
  }
  if (!PLAYER_COMBAT_STYLES.has(String(state.playerCombatStyle || ""))) {
    state.playerCombatStyle = "balanced";
  }
  if (dom.playerCombatStyle)
    dom.playerCombatStyle.value = String(state.playerCombatStyle);
  syncSpellSelect();
  if (dom.playerAttackLevel)
    dom.playerAttackLevel.value = String(state.playerAttackLevel);
  if (dom.playerStrengthLevel)
    dom.playerStrengthLevel.value = String(state.playerStrengthLevel);
  if (dom.playerDefenceLevel)
    dom.playerDefenceLevel.value = String(state.playerDefenceLevel);
  if (dom.playerMagicLevel)
    dom.playerMagicLevel.value = String(state.playerMagicLevel);
  if (dom.playerHitpointsLevel)
    dom.playerHitpointsLevel.value = String(state.playerHitpointsLevel);
  if (dom.playerAtkGearBonus)
    dom.playerAtkGearBonus.value = String(state.playerAtkGearBonus);
  if (dom.playerStrGearBonus)
    dom.playerStrGearBonus.value = String(state.playerStrGearBonus);
  if (dom.playerDefGearBonus)
    dom.playerDefGearBonus.value = String(state.playerDefGearBonus);
  if (dom.playerMagGearBonus)
    dom.playerMagGearBonus.value = String(state.playerMagGearBonus);
  if (dom.playerCombatDamageBonusPct)
    dom.playerCombatDamageBonusPct.value = String(
      state.playerCombatDamageBonusPct,
    );
  if (dom.playerAttackMasteryHitBonusPct)
    dom.playerAttackMasteryHitBonusPct.value = String(
      state.playerAttackMasteryHitBonusPct,
    );
  if (dom.playerStrengthMasteryMaxHitBonusPct)
    dom.playerStrengthMasteryMaxHitBonusPct.value = String(
      state.playerStrengthMasteryMaxHitBonusPct,
    );
  if (dom.playerMagicMasteryHitBonusPct)
    dom.playerMagicMasteryHitBonusPct.value = String(
      state.playerMagicMasteryHitBonusPct,
    );
  if (dom.playerMagicMasteryMaxHitBonusPct)
    dom.playerMagicMasteryMaxHitBonusPct.value = String(
      state.playerMagicMasteryMaxHitBonusPct,
    );
  if (dom.playerCombatTickSeconds)
    dom.playerCombatTickSeconds.value = String(state.playerCombatTickSeconds);
  if (dom.xpCurrentLevel)
    dom.xpCurrentLevel.value = String(state.xpCurrentLevel);
  if (dom.compactCards) dom.compactCards.checked = state.compactCards;
  if (dom.xpTargetLevel) dom.xpTargetLevel.value = String(state.xpTargetLevel);
  if (dom.xpRate) dom.xpRate.value = String(state.xpRate);
  if (dom.dropKills) dom.dropKills.value = String(state.dropKills);
  if (dom.dropTargetQty) dom.dropTargetQty.value = String(state.dropTargetQty);
  if (dom.dropKillRate) dom.dropKillRate.value = String(state.dropKillRate);
  if (dom.affordGpRate) dom.affordGpRate.value = String(state.affordGpRate);
  if (dom.affordQty) dom.affordQty.value = String(state.affordQty);
  if (dom.routeCurrentLevel)
    dom.routeCurrentLevel.value = String(state.routeCurrentLevel);
  if (dom.routeTargetLevel)
    dom.routeTargetLevel.value = String(state.routeTargetLevel);
  if (dom.routePriority) dom.routePriority.value = String(state.routePriority);
  if (dom.compareXpGoal) dom.compareXpGoal.value = String(state.compareXpGoal);
  if (dom.buildFocus) dom.buildFocus.value = String(state.buildFocus);
  if (dom.buildBudget) dom.buildBudget.value = String(state.buildBudget);
  if (dom.buildGpRate) dom.buildGpRate.value = String(state.buildGpRate);
  if (dom.buildAttackLevel)
    dom.buildAttackLevel.value = String(state.buildAttackLevel);
  if (dom.buildDefenceLevel)
    dom.buildDefenceLevel.value = String(state.buildDefenceLevel);
  if (dom.buildMagicLevel)
    dom.buildMagicLevel.value = String(state.buildMagicLevel);
  const dungeonOptions = [
    { id: "none", label: "None" },
    ...(model?.dungeons || []).map((dungeon) => ({
      id: String(dungeon.id || ""),
      label: String(dungeon.name || dungeon.id || "Unknown dungeon"),
    })),
    { id: "all", label: "All available" },
  ].filter((entry) => entry.id);
  if (dom.buildDungeonComplete) {
    dom.buildDungeonComplete.innerHTML = dungeonOptions
      .map(
        (entry) =>
          `<option value="${escapeHtml(entry.id)}">${escapeHtml(entry.label)}</option>`,
      )
      .join("");
    const validValues = new Set(dungeonOptions.map((entry) => entry.id));
    if (!validValues.has(state.buildDungeonCompletion)) {
      state.buildDungeonCompletion = "all";
    }
    dom.buildDungeonComplete.value = state.buildDungeonCompletion;
  }
  if (dom.mobileSectionJump) {
    const currentJumpValue = String(dom.mobileSectionJump.value || "");
    const jumpOptions = getMobileJumpOptions(model);
    dom.mobileSectionJump.innerHTML = jumpOptions
      .map(
        (option) =>
          `<option value="${escapeHtml(option.value)}">${escapeHtml(option.label)}</option>`,
      )
      .join("");
    const validJumpValues = new Set(jumpOptions.map((option) => option.value));
    dom.mobileSectionJump.value = validJumpValues.has(currentJumpValue)
      ? currentJumpValue
      : "";
  }
  if (dom.simXpRate) dom.simXpRate.value = String(state.simXpRate);
  if (dom.simGpRate) dom.simGpRate.value = String(state.simGpRate);
  if (dom.routeXpTarget)
    dom.routeXpTarget.value = String(state.farmRouteXpTarget);
  if (dom.routeGpTarget)
    dom.routeGpTarget.value = String(state.farmRouteGpTarget);
  if (dom.routeMaxSteps)
    dom.routeMaxSteps.value = String(state.farmRouteMaxSteps);

  const monsterOptions = Object.entries(model.monsters || {})
    .map(([monsterId, monster]) => ({
      id: monsterId,
      name: monster.name || monsterId,
    }))
    .sort((left, right) => left.name.localeCompare(right.name));

  if (dom.dropMonster) {
    dom.dropMonster.innerHTML = monsterOptions
      .map(
        (option) =>
          `<option value="${escapeHtml(option.id)}">${escapeHtml(option.name)}</option>`,
      )
      .join("");
  }

  if (!state.dropMonsterId && monsterOptions.length > 0) {
    state.dropMonsterId = monsterOptions[0].id;
  }

  if (dom.dropMonster) {
    dom.dropMonster.value = state.dropMonsterId;
  }

  populateDropItemOptions(model);

  const pricedItems = Object.entries(model?.itemFile?.PRICE_BY_ID || {})
    .filter(([, price]) => Number(price || 0) > 0)
    .map(([itemId, price]) => ({
      id: itemId,
      name: model?.itemFile?.ITEMS?.[itemId]?.name || itemId,
      price: Number(price || 0),
    }))
    .sort((left, right) => left.name.localeCompare(right.name));

  if (dom.affordItem) {
    dom.affordItem.innerHTML = pricedItems
      .map(
        (item) =>
          `<option value="${escapeHtml(item.id)}">${escapeHtml(item.name)} (${formatNumber(item.price)} gp)</option>`,
      )
      .join("");
  }

  if (!state.affordItemId && pricedItems.length > 0) {
    state.affordItemId = pricedItems[0].id;
  }

  if (dom.affordItem) {
    dom.affordItem.value = state.affordItemId;
  }

  const skillLabels = model?.skillFile?.SKILL_LABELS || {};
  const availableSkillIds = [
    ...new Set(
      (model?.boardRows || [])
        .map((row) => row.skill)
        .filter((skillId) =>
          Object.prototype.hasOwnProperty.call(skillLabels, skillId),
        ),
    ),
  ].sort((left, right) =>
    String(skillLabels[left]).localeCompare(String(skillLabels[right])),
  );

  if (dom.routeSkill) {
    dom.routeSkill.innerHTML = availableSkillIds
      .map(
        (skillId) =>
          `<option value="${escapeHtml(skillId)}">${escapeHtml(skillLabels[skillId])}</option>`,
      )
      .join("");
  }

  if (!state.routeSkill && availableSkillIds.length > 0) {
    state.routeSkill = availableSkillIds[0];
  }

  if (dom.routeSkill) {
    dom.routeSkill.value = state.routeSkill;
  }

  const compareRows = [...(model?.boardRows || [])]
    .filter((row) => Number(row.xpPerHour || 0) > 0)
    .sort(
      (left, right) =>
        Number(right.xpPerHour || 0) - Number(left.xpPerHour || 0),
    );

  const compareOptions = compareRows.map((row, index) => ({
    id: String(index),
    label: `${row.name} (${formatNumber(row.xpPerHour)} XP/hr · ${formatNumber(row.gpPerHour)} gp/hr)`,
  }));

  if (dom.compareA) {
    dom.compareA.innerHTML = compareOptions
      .map(
        (option) =>
          `<option value="${escapeHtml(option.id)}">${escapeHtml(option.label)}</option>`,
      )
      .join("");
  }

  if (dom.compareB) {
    dom.compareB.innerHTML = compareOptions
      .map(
        (option) =>
          `<option value="${escapeHtml(option.id)}">${escapeHtml(option.label)}</option>`,
      )
      .join("");
  }

  if (!compareOptions.some((option) => option.id === state.compareA)) {
    state.compareA = compareOptions[0]?.id || "";
  }

  if (!compareOptions.some((option) => option.id === state.compareB)) {
    state.compareB = compareOptions[1]?.id || compareOptions[0]?.id || "";
  }

  if (dom.compareA) {
    dom.compareA.value = state.compareA;
  }

  if (dom.compareB) {
    dom.compareB.value = state.compareB;
  }

  const routeSkills = getFarmRouteSkillOptions(model);

  if (dom.routeSkillFilter) {
    dom.routeSkillFilter.innerHTML = routeSkills
      .map((skillId) => {
        if (skillId === "all") {
          return `<option value="all">All skills</option>`;
        }
        const label = skillLabels[skillId] || skillId;
        return `<option value="${escapeHtml(skillId)}">${escapeHtml(label)}</option>`;
      })
      .join("");
  }

  if (!routeSkills.includes(state.farmRouteSkillFilter)) {
    state.farmRouteSkillFilter = "all";
  }
  if (dom.routeSkillFilter) {
    dom.routeSkillFilter.value = state.farmRouteSkillFilter;
  }
}

function populateDropItemOptions(model) {
  if (!dom.dropItem) {
    return;
  }
  const monster = model?.monsters?.[state.dropMonsterId] || null;
  const dropOptions = (monster?.drops || [])
    .filter((drop) => drop?.item)
    .map((drop) => {
      const itemId = drop.item;
      const itemName = model?.itemFile?.ITEMS?.[itemId]?.name || itemId;
      return {
        itemId,
        label: `${itemName} (${formatPercent(Number(drop.chance || 0))})`,
      };
    });

  dom.dropItem.innerHTML = dropOptions
    .map(
      (option) =>
        `<option value="${escapeHtml(option.itemId)}">${escapeHtml(option.label)}</option>`,
    )
    .join("");

  if (!dropOptions.some((option) => option.itemId === state.dropItemId)) {
    state.dropItemId = dropOptions[0]?.itemId || "";
  }

  dom.dropItem.value = state.dropItemId;
}

function buildItemEntries(
  items,
  itemFile,
  skillFile,
  monsterFile,
  questFile,
  dungeonFile,
) {
  const itemIds = Object.keys(items);
  const allTables = itemFile;
  const recipeRefs = buildItemRecipeIndex(skillFile, itemIds);
  const craftedRefs = buildItemCraftingIndex(itemFile, itemIds);
  const monsterRefs = buildItemMonsterIndex(monsterFile, itemIds);
  const questRefs = buildItemQuestIndex(questFile, itemIds);
  const dungeonRefs = buildItemDungeonIndex(dungeonFile, itemIds);

  return itemIds.map((itemId) => {
    const info = items[itemId] || {};
    const relatedTables = collectKeyedTables(allTables, itemId);
    const sources = [];
    if (info.source_hint) sources.push(info.source_hint);
    recipeRefs.get(itemId)?.forEach((text) => sources.push(text));
    craftedRefs.get(itemId)?.forEach((text) => sources.push(text));
    monsterRefs.get(itemId)?.forEach((text) => sources.push(text));
    questRefs.get(itemId)?.forEach((text) => sources.push(text));
    dungeonRefs.get(itemId)?.forEach((text) => sources.push(text));

    const lore = synthesizeItemLore(
      info,
      sources,
      recipeRefs.get(itemId) || [],
      monsterRefs.get(itemId) || [],
      dungeonRefs.get(itemId) || [],
    );
    const statRows = relatedTables.map(([name, value]) => [name, value]);
    const badges = [
      info.category,
      info.slot,
      info.source_hint ? "source" : null,
    ].filter(Boolean);
    const tags = [info.category, info.slot, ...sources.slice(0, 2)].filter(
      Boolean,
    );
    const searchText = [
      itemId,
      info.name,
      info.category,
      info.slot,
      info.source_hint,
      lore,
      ...sources,
      ...statRows.flat(),
    ]
      .map(normalizeSearchText)
      .join(" ");
    const price = Number((itemFile.PRICE_BY_ID || {})[itemId] || 0);
    const attackRequirement = Number(
      (itemFile.ATTACK_REQ_BY_ID || {})[itemId] || 0,
    );
    const defenceRequirement = Number(
      (itemFile.DEFENCE_REQ_BY_ID || {})[itemId] || 0,
    );
    const magicRequirement = Number(
      (itemFile.MAGIC_REQ_BY_ID || {})[itemId] || 0,
    );

    return {
      kind: "Item",
      section: "items",
      id: itemId,
      name: info.name || itemId,
      title: info.name || itemId,
      subtitle: info.source_hint || info.category || "Item",
      tags,
      badges,
      searchText,
      sortKey: `${info.name || itemId}`.toLowerCase(),
      spoiler: Boolean(
        recipeRefs.get(itemId)?.length ||
        monsterRefs.get(itemId)?.length ||
        questRefs.get(itemId)?.length ||
        dungeonRefs.get(itemId)?.length,
      ),
      metrics: [
        price > 0
          ? { label: "Price", value: `${formatNumber(price)} gp` }
          : null,
        attackRequirement > 0
          ? { label: "Attack req", value: attackRequirement }
          : null,
        defenceRequirement > 0
          ? { label: "Defence req", value: defenceRequirement }
          : null,
        magicRequirement > 0
          ? { label: "Fracture Arts req", value: magicRequirement }
          : null,
      ].filter(Boolean),
      body: `
        <div class="grid-2">
          <div class="stat-box"><strong>Origin</strong><span>${escapeHtml(info.source_hint || lore)}</span></div>
          <div class="stat-box"><strong>Lore</strong><span>${escapeHtml(lore)}</span></div>
        </div>
        <div class="grid-3">
          <div class="stat-box"><strong>Category</strong><span>${escapeHtml(info.category || "-")}</span></div>
          <div class="stat-box"><strong>Slot</strong><span>${escapeHtml(info.slot || "-")}</span></div>
          <div class="stat-box"><strong>Price</strong><span>${price > 0 ? `${formatNumber(price)} gp` : "No price data"}</span></div>
        </div>
        ${renderDetailBlock("Related sources", [
          ...(recipeRefs.get(itemId) || []),
          ...(craftedRefs.get(itemId) || []),
          ...(monsterRefs.get(itemId) || []),
          ...(questRefs.get(itemId) || []),
          ...(dungeonRefs.get(itemId) || []),
        ])}
        ${renderKeyedTable("Raw item tables", statRows)}
      `,
    };
  });
}

function buildItemRecipeIndex(skillFile, itemIds) {
  const index = new Map();
  const recipes = skillFile.ARTISAN_RECIPES || {};
  for (const [skill, entries] of Object.entries(recipes)) {
    for (const recipe of entries || []) {
      const produced =
        recipe.produces ||
        recipe.item_yield ||
        recipe.itemYield ||
        recipe.item ||
        null;
      const burn = recipe.burn_produces || null;
      const recipeName =
        recipe.name || recipe.id || recipe.produces || "recipe";
      if (produced && itemIds.includes(produced)) {
        addIndexValue(index, produced, `${skill} recipe: ${recipeName}`);
      }
      if (burn && itemIds.includes(burn)) {
        addIndexValue(index, burn, `${skill} burn result: ${recipeName}`);
      }
      if (recipe.item_yield && itemIds.includes(recipe.item_yield)) {
        addIndexValue(
          index,
          recipe.item_yield,
          `${skill} node output: ${recipeName}`,
        );
      }
    }
  }
  return index;
}

function buildItemCraftingIndex(itemFile, itemIds) {
  const index = new Map();
  const smithingPieces = itemFile._SMITHING_PIECES || {};
  const smithingTiers = itemFile._SMITHING_TIER_LABELS || {};
  const craftingTracks = itemFile._CRAFTING_TRACK_PIECES || {};
  const craftingTierOrder = itemFile._CRAFTING_TRACK_TIER_ORDER || {};
  const craftingTrackLabels = itemFile._CRAFTING_TRACK_LABELS || {};
  const craftingTierLabels = itemFile._CRAFTING_TIER_LABELS || {};

  for (const itemId of itemIds) {
    let matched = false;

    for (const pieceKey of Object.keys(smithingPieces)) {
      const suffix = `_${pieceKey}`;
      if (!String(itemId).endsWith(suffix)) continue;
      const tierKey = String(itemId).slice(0, -suffix.length);
      if (!smithingTiers[tierKey]) continue;
      const pieceDef = smithingPieces[pieceKey] || {};
      const tierLabel = smithingTiers[tierKey] || capitalize(tierKey);
      const pieceLabel = pieceDef.name || capitalize(pieceKey);
      addIndexValue(
        index,
        itemId,
        `Smithing recipe: ${tierLabel} ${pieceLabel}`,
      );
      matched = true;
      break;
    }

    if (matched) continue;

    for (const [trackKey, pieces] of Object.entries(craftingTracks)) {
      const prefix = `${trackKey}_`;
      if (!String(itemId).startsWith(prefix)) continue;
      const remainder = String(itemId).slice(prefix.length);
      const trackPieces = pieces || {};
      for (const [pieceKey, pieceDef] of Object.entries(trackPieces)) {
        const suffix = `_${pieceKey}`;
        if (!remainder.endsWith(suffix)) continue;
        const tierKey = remainder.slice(0, -suffix.length);
        const validTiers = craftingTierOrder[trackKey] || [];
        if (!validTiers.includes(tierKey)) continue;
        const trackLabel =
          craftingTrackLabels[trackKey] || capitalize(trackKey);
        const tierLabel = craftingTierLabels[tierKey] || capitalize(tierKey);
        const pieceLabel = pieceDef?.name || capitalize(pieceKey);
        addIndexValue(
          index,
          itemId,
          `Crafting recipe (${trackLabel}): ${tierLabel} ${pieceLabel}`,
        );
        matched = true;
        break;
      }
      if (matched) break;
    }
  }

  return index;
}

function buildItemMonsterIndex(monsterFile, itemIds) {
  const index = new Map();
  // Each pool carries the skill the player uses to reach it and the field that
  // names the zone, so every drop can be shown as a full source chain:
  //   "Combat → <region> → <monster> (<chance>)"
  //   "Shadow Arts → <area> → <target> (<chance>)"
  const pools = [
    { defs: monsterFile._monster_defs_data || {}, skill: "Combat", zoneKey: "region" },
    {
      defs: monsterFile._shadow_target_defs_data || {},
      skill: "Shadow Arts",
      zoneKey: "area",
    },
  ];
  for (const { defs, skill, zoneKey } of pools) {
    for (const [monsterId, monster] of Object.entries(defs)) {
      const target = monster.name || monsterId;
      const zone = String(monster[zoneKey] || "").trim();
      const chain = [skill, zone, target].filter(Boolean).join(" → ");
      for (const drop of monster.drops || []) {
        if (drop.item && itemIds.includes(drop.item)) {
          addIndexValue(
            index,
            drop.item,
            `${chain} (${formatPercent(drop.chance || 0)})`,
          );
        }
      }
    }
  }
  return index;
}

function buildItemQuestIndex(questFile, itemIds) {
  const index = new Map();
  for (const quest of questFile.ALL_QUESTS || []) {
    const matches = findItemIdsInObject(quest, itemIds);
    for (const match of matches) {
      const label = quest.name || quest.title || quest.id || "quest";
      addIndexValue(index, match, `Referenced in quest ${label}`);
    }
  }
  return index;
}

function buildItemDungeonIndex(dungeonFile, itemIds) {
  const index = new Map();
  for (const dungeon of dungeonFile.ALL_DUNGEONS || []) {
    const rewards = dungeon.rewards || {};
    for (const drop of rewards.loot_table || []) {
      if (drop.item_id && itemIds.includes(drop.item_id)) {
        addIndexValue(
          index,
          drop.item_id,
          `Dungeon loot: ${dungeon.name || dungeon.id} (${formatPercent(drop.chance || 0)})`,
        );
      }
    }
    const firstClearItems = rewards.first_clear_bonus?.items || {};
    for (const itemId of Object.keys(firstClearItems)) {
      if (itemIds.includes(itemId)) {
        addIndexValue(
          index,
          itemId,
          `First-clear reward from ${dungeon.name || dungeon.id}`,
        );
      }
    }
  }
  return index;
}

function buildItemTaskIndex(taskFile, itemIds) {
  const index = new Map();
  const pools = [
    ...(taskFile.DAILY_POOL || []).map((task) => ({ cadence: "daily", task })),
    ...(taskFile.WEEKLY_POOL || []).map((task) => ({
      cadence: "weekly",
      task,
    })),
  ];
  for (const { cadence, task } of pools) {
    const matches = findItemIdsInObject(task, itemIds);
    for (const itemId of matches) {
      const label = task.name || task.title || task.id || "task";
      addIndexValue(index, itemId, `${capitalize(cadence)} task: ${label}`);
    }
  }
  return index;
}

function buildItemContractIndex(adventurerFile, itemIds) {
  const index = new Map();
  const pool = adventurerFile.CONTRACT_POOL || {};
  for (const [tier, contracts] of Object.entries(pool)) {
    for (const contract of contracts || []) {
      const matches = findItemIdsInObject(contract, itemIds);
      for (const itemId of matches) {
        const label =
          contract.name || contract.id || contract.target || "contract";
        addIndexValue(index, itemId, `Contract (${tier}): ${label}`);
      }
    }
  }
  return index;
}

function buildMonsterEntries(monsters, itemFile, playerCombatProfile) {
  return Object.entries(monsters).map(([monsterId, monster]) => {
    const baseAvgGold = average(
      Number(monster.gold_min || 0),
      Number(monster.gold_max || 0),
    );
    const avgGold =
      baseAvgGold *
      (1 + Number(playerCombatProfile?.combatGoldBonusPct || 0) / 100);
    const loot = (monster.drops || []).map((drop) => {
      const itemId = drop.item || "";
      const itemName = itemFile.ITEMS?.[itemId]?.name || itemId;
      const price = effectivePriceWithSellBonus(
        Number(itemFile.PRICE_BY_ID?.[itemId] || 0),
        playerCombatProfile,
      );
      const avgQty = average(
        Number(drop.qty_min || 1),
        Number(drop.qty_max || 1),
      );
      const chance = adjustedMonsterDropChance(
        itemId,
        Number(drop.chance || 0),
        itemFile,
        playerCombatProfile,
      );
      const expectedValue = price * avgQty * chance;
      return {
        itemId,
        itemName,
        price,
        chance,
        qtyMin: Number(drop.qty_min || 1),
        qtyMax: Number(drop.qty_max || 1),
        expectedValue,
      };
    });
    const lootValue = loot.reduce((sum, drop) => sum + drop.expectedValue, 0);
    const totalXp = combatXpPerKillWithBonuses(
      Number(monster.hp || 1),
      String(playerCombatProfile?.combatStyle || "balanced"),
      playerCombatProfile,
    );
    const killValue = avgGold + lootValue;
    const estimatedKillsPerHour = estimateMonsterKillsPerHour(
      monster,
      playerCombatProfile,
    );
    const perHour = {
      gold: killValue * estimatedKillsPerHour,
      xp: totalXp * estimatedKillsPerHour,
      loot: lootValue * estimatedKillsPerHour,
    };
    const searchText = [
      monsterId,
      monster.name,
      monster.region,
      monster.attack,
      monster.defence,
      monster.melee_defence,
      monster.magic_defence,
      monster.hp,
      killValue,
      ...loot.map((drop) => drop.itemName),
      monster.lore,
    ]
      .map(normalizeSearchText)
      .join(" ");
    return {
      kind: "Monster",
      section: "monsters",
      id: monsterId,
      name: monster.name || monsterId,
      title: monster.name || monsterId,
      subtitle: monster.region || "Monster",
      badges: [monster.region, `Combat ${monsterCombatLevel(monster)}`].filter(
        Boolean,
      ),
      searchText,
      sortKey:
        `${monster.region || ""} ${monster.name || monsterId}`.toLowerCase(),
      spoiler: true,
      metrics: [
        { label: "Avg gold", value: `${formatNumber(avgGold)} gp` },
        { label: "Expected loot", value: `${formatNumber(lootValue)} gp` },
        { label: "Value / kill", value: `${formatNumber(killValue)} gp` },
        { label: "XP / kill", value: formatCombatXp(totalXp) },
      ],
      body: `
        <div class="grid-3">
          <div class="stat-box"><strong>HP</strong><span>${formatNumber(monster.hp || 0)}</span></div>
          <div class="stat-box"><strong>Attack</strong><span>${formatNumber(monster.attack || 0)}</span></div>
          <div class="stat-box"><strong>Defence</strong><span>${formatNumber(monster.defence || 0)}</span></div>
        </div>
        <div class="grid-3">
          <div class="stat-box"><strong>Melee defence</strong><span>${formatNumber(monster.melee_defence ?? monster.defence ?? 0)}</span></div>
          <div class="stat-box"><strong>Magic defence</strong><span>${formatNumber(monster.magic_defence ?? monster.defence ?? 0)}</span></div>
          <div class="stat-box"><strong>Combat level</strong><span>${monsterCombatLevel(monster)}</span></div>
        </div>
        <div class="grid-2">
          <div class="stat-box"><strong>Average kill value</strong><span>${formatNumber(killValue)} gp</span></div>
          <div class="stat-box"><strong>Estimated hourly value</strong><span>${formatNumber(perHour.gold)} gp/hour at ~${formatNumber(estimatedKillsPerHour)} kills/hour (${escapeHtml(capitalize(String(playerCombatProfile?.combatStyle || "balanced")))} style, ${formatDecimal(Number(playerCombatProfile?.combatTickSeconds || 1.2))}s ticks, fixed 2-tick respawn, offensive-only)</span></div>
        </div>
        ${renderDetailBlock("Lore", [monster.lore || "No lore text in source data."])}
        ${renderSimpleTable(
          "Loot table",
          ["Item", "Chance", "Qty", "Expected value"],
          loot.map((drop) => [
            drop.itemName,
            formatPercent(drop.chance),
            drop.qtyMin === drop.qtyMax
              ? String(drop.qtyMin)
              : `${drop.qtyMin}-${drop.qtyMax}`,
            `${formatNumber(drop.expectedValue)} gp`,
          ]),
          { open: false },
        )}
        ${renderKeyedTable(
          "Raw monster stats",
          Object.entries(monster)
            .filter(([key]) => key !== "drops")
            .map(([key, value]) => [key, renderValue(value)]),
        )}
      `,
      combat: { totalXp, killValue, perHour },
    };
  });
}

// Every repeatable action that trains a skill, flattened to a common shape so
// the XP table can ask "what is the best thing I can do at level N".
// Meditation is deliberately absent: its XP scales with your level rather than
// with the action, so it is modelled in skillActionAtLevel instead.
function buildSkillActionCatalog(skillId, skillFile, gameStateFile) {
  const actions = [];
  for (const node of skillFile.GATHERING_NODES?.[skillId] || []) {
    actions.push({
      name: node.name || node.id,
      level: Number(node.level || 1),
      xp: Number(node.xp_per_action || 0),
      seconds: Number(node.seconds_per_action || 0),
    });
  }
  for (const recipe of skillFile.ARTISAN_RECIPES?.[skillId] || []) {
    actions.push({
      name: recipe.name || recipe.id,
      level: Number(recipe.level || 1),
      xp: Number(recipe.xp_per_action || 0),
      seconds: Number(recipe.seconds || recipe.seconds_per_action || 0),
    });
  }
  if (skillId === "shadow_arts") {
    for (const target of Object.values(
      gameStateFile?._shadow_target_defs_data || {},
    )) {
      actions.push({
        name: target.name,
        level: Number(target.level || 1),
        xp: Number(target.xp || 0),
        // Steals resolve on a period; a failed attempt still burns the window,
        // so this is an optimistic (100%-success) rate.
        seconds: Number(target.period_seconds || 0),
        successChance: Number(target.base_success || 0),
      });
    }
  }
  return actions.filter((action) => action.xp > 0 && action.seconds > 0);
}

// Best XP/hour action available to a player at `level`, or null when the skill
// has no action model (combat skills, Adventurer).
function skillActionAtLevel(skillId, catalog, level, gameStateFile) {
  if (skillId === "meditation") {
    const seconds = Number(gameStateFile?.MEDITATION_COOLDOWN_SECONDS || 60);
    return {
      name: "Meditation session",
      level: 1,
      // GameState.meditate(): (25 + floor(level * 2)) * 2
      xp: (25 + Math.floor(level * 2)) * 2,
      seconds,
    };
  }
  let best = null;
  for (const action of catalog) {
    if (action.level > level) {
      continue;
    }
    if (!best || action.xp / action.seconds > best.xp / best.seconds) {
      best = action;
    }
  }
  return best;
}

// Full 2..cap XP table. Columns after "Total XP" are only meaningful for skills
// with an action model, so they are dropped entirely for combat/Adventurer.
function buildSkillXpTable(skillId, catalog, gameStateFile) {
  const hasActions = catalog.length > 0 || skillId === "meditation";
  const headings = ["Level", "XP for level", "Total XP"];
  if (hasActions) {
    headings.push("Best action at previous level", "Actions", "Time");
  }
  const rows = [];
  for (let level = 2; level <= SKILL_LEVEL_CAP; level += 1) {
    const total = xpForLevel(level);
    const delta = total - xpForLevel(level - 1);
    const row = [formatNumber(level), formatNumber(delta), formatNumber(total)];
    if (hasActions) {
      const action = skillActionAtLevel(
        skillId,
        catalog,
        level - 1,
        gameStateFile,
      );
      if (action) {
        const count = Math.ceil(delta / action.xp);
        row.push(
          action.name,
          formatNumber(count),
          formatDuration((count * action.seconds) / 3600),
        );
      } else {
        row.push("-", "-", "-");
      }
    }
    rows.push(row);
  }
  return { headings, rows };
}

// Everything gated behind a level in this skill, collapsed into one timeline:
// nodes, recipes, tier ladders, marks, milestones, passives, capstone gear and
// the quests that ask for the level.
function buildSkillUnlockTimeline({
  skillId,
  skillFile,
  itemFile,
  gameStateFile,
  milestones,
  passives,
  quests,
}) {
  const items = itemFile.ITEMS || {};
  const labels = skillFile.SKILL_LABELS || {};
  const itemName = (id) => items[id]?.name || titleizeId(id);
  const unlocks = [];
  const add = (level, kind, text) => {
    const numeric = Number(level);
    if (Number.isFinite(numeric) && numeric > 0) {
      unlocks.push({ level: numeric, kind, text });
    }
  };

  for (const node of skillFile.GATHERING_NODES?.[skillId] || []) {
    const cost = Object.entries(node.requires || {})
      .map(([id, qty]) => `${itemName(id)} x${qty}`)
      .join(", ");
    add(
      node.level,
      "Node",
      `${node.name || node.id} - ${formatNumber(Number(node.xp_per_action || 0))} XP / ${formatDecimal(Number(node.seconds_per_action || 0))}s → ${itemName(node.item_yield)}${cost ? ` (uses ${cost})` : ""}`,
    );
  }

  for (const recipe of skillFile.ARTISAN_RECIPES?.[skillId] || []) {
    const output = recipe.produces || recipe.item_yield || recipe.id;
    const inputs = Object.entries(recipe.requires || {})
      .map(([id, qty]) => `${itemName(id)} x${qty}`)
      .join(", ");
    add(
      recipe.level,
      "Recipe",
      `${recipe.name || itemName(output)} - ${formatNumber(Number(recipe.xp_per_action || 0))} XP / ${formatDecimal(Number(recipe.seconds || recipe.seconds_per_action || 0))}s → ${itemName(output)}${inputs ? ` (uses ${inputs})` : ""}`,
    );
  }

  if (skillId === "smithing") {
    for (const tier of skillFile.SMITHING_TIER_BARS || []) {
      add(
        tier.level,
        "Tier",
        `${titleizeId(tier.tier)} smithing tier - ${itemName(tier.bar)} and its gear blueprints`,
      );
    }
  }

  if (skillId === "crafting") {
    for (const [track, tiers] of Object.entries(
      skillFile.CRAFTING_TRACK_TIERS || {},
    )) {
      for (const tier of tiers || []) {
        add(
          tier.level,
          "Tier",
          `${titleizeId(track)} - ${titleizeId(tier.tier)} tier (base material ${itemName(tier.material)})`,
        );
      }
    }
  }

  if (skillId === "shadow_arts") {
    for (const target of Object.values(
      gameStateFile?._shadow_target_defs_data || {},
    )) {
      add(
        target.level,
        "Mark",
        `${target.name} (${target.area}) - ${formatNumber(Number(target.xp || 0))} XP every ${formatDecimal(Number(target.period_seconds || 0))}s, ${formatPercent(Number(target.base_success || 0))} base success`,
      );
    }
  }

  for (const milestone of milestones || []) {
    const perks = [
      `${formatNumber(Number(milestone.gold || 0))} gold`,
      milestone.xp_bonus
        ? `+${formatPercent(Number(milestone.xp_bonus))} ${labels[skillId] || skillId} XP`
        : null,
      milestone.mastery ? "Mastery reward" : null,
    ].filter(Boolean);
    add(milestone.level, "Milestone", perks.join(" · "));
  }

  for (const passive of passives || []) {
    if (passive.trigger !== "skill_level" || passive.skill !== skillId) {
      continue;
    }
    add(passive.threshold, "Passive", `${passive.name} - ${passive.desc}`);
  }

  for (const gear of gameStateFile?.MASTERY_STORE_DEFS || []) {
    if (gear.skill_id !== skillId) {
      continue;
    }
    add(
      gear.level_required,
      "Mastery store",
      `${itemName(gear.item_id)} - ${gear.summary}`,
    );
  }

  for (const quest of quests || []) {
    const required = quest.requirements?.skillLevels?.[skillId];
    if (required) {
      add(required, "Quest", `${quest.name} requires this level`);
    }
  }

  unlocks.sort(
    (left, right) =>
      left.level - right.level ||
      left.kind.localeCompare(right.kind) ||
      left.text.localeCompare(right.text),
  );
  return unlocks;
}

// Affinity is per-action mastery (each node/recipe/mark levels its own track)
// and only exists for the skills listed in AFFINITY_XPA_PER_SKILL. Perk values
// live as constants on GameState.
function describeSkillAffinity(skillId, skillFile, gameStateFile) {
  const perLevel = (value, max, label) => {
    const rate = Number(gameStateFile?.[value] || 0);
    const cap = Number(gameStateFile?.[max] || 0);
    if (!rate) {
      return null;
    }
    return `${label}: +${formatSmallPercent(rate)} per affinity level, capped at ${formatPercent(cap)}.`;
  };
  const perks = {
    mining: [
      perLevel(
        "MINING_AFFINITY_PROSPECT_CHANCE_PER_LEVEL",
        "MINING_AFFINITY_PROSPECT_CHANCE_MAX",
        "Prospect chance",
      ),
    ],
    woodcutting: [
      perLevel(
        "WOODCUTTING_AFFINITY_DOUBLE_YIELD_CHANCE_PER_LEVEL",
        "WOODCUTTING_AFFINITY_DOUBLE_YIELD_CHANCE_MAX",
        "Double log chance",
      ),
      perLevel(
        "WOODCUTTING_AFFINITY_BARK_CHANCE_PER_LEVEL",
        "WOODCUTTING_AFFINITY_BARK_CHANCE_MAX",
        "Bark chance",
      ),
    ],
    fishing: [
      perLevel(
        "FISHING_AFFINITY_DOUBLE_CATCH_CHANCE_PER_LEVEL",
        "FISHING_AFFINITY_DOUBLE_CATCH_CHANCE_MAX",
        "Double catch chance",
      ),
      perLevel(
        "FISHING_AFFINITY_SUCCESS_BONUS_PER_LEVEL",
        "FISHING_AFFINITY_SUCCESS_BONUS_MAX",
        "Catch success",
      ),
    ],
    smithing: [
      perLevel(
        "SMITHING_AFFINITY_EFFICIENCY_PER_LEVEL",
        "SMITHING_AFFINITY_EFFICIENCY_MAX",
        "Material efficiency",
      ),
    ],
    cooking: [
      perLevel(
        "COOKING_AFFINITY_BURN_REDUCTION_PER_LEVEL",
        "COOKING_AFFINITY_BURN_REDUCTION_MAX",
        "Burn reduction",
      ),
    ],
    spiritweaving: [
      perLevel(
        "SPIRITWEAVING_AFFINITY_SHADOW_BLEED_PER_LEVEL",
        "SPIRITWEAVING_AFFINITY_SHADOW_BLEED_MAX",
        "Shadow bleed",
      ),
    ],
    shadow_arts: [
      perLevel(
        "SHADOW_AFFINITY_SUCCESS_BONUS_PER_LEVEL",
        "SHADOW_AFFINITY_SUCCESS_BONUS_MAX",
        "Steal success",
      ),
      perLevel(
        "SHADOW_AFFINITY_COOLDOWN_REDUCTION_PER_LEVEL",
        "SHADOW_AFFINITY_COOLDOWN_REDUCTION_MAX",
        "Cooldown reduction",
      ),
      perLevel(
        "SHADOW_AFFINITY_STUN_REDUCTION_PER_LEVEL",
        "SHADOW_AFFINITY_STUN_REDUCTION_MAX",
        "Stun reduction",
      ),
    ],
  };

  const milestones = {
    spirit_harvesting: [
      `Affinity 25: +${formatNumber(Number(gameStateFile?.SPIRIT_AFFINITY_BONUS_XP_25 || 0))} bonus XP per action.`,
      `Affinity 50: +${formatNumber(Number(gameStateFile?.SPIRIT_AFFINITY_BONUS_XP_50 || 0))} bonus XP per action.`,
    ],
    crafting: [
      `Affinity 25: +${formatPercent(Number(gameStateFile?.CRAFTING_AFFINITY_SELL_BONUS_25 || 0))} sell price on that item.`,
      `Affinity 50: +${formatPercent(Number(gameStateFile?.CRAFTING_AFFINITY_SELL_BONUS_50 || 0))} sell price on that item.`,
    ],
    shadow_arts: [
      `Affinity 50: +${formatPercent(Number(gameStateFile?.SHADOW_AFFINITY_MILESTONE_SUCCESS_50 || 0))} steal success on that mark.`,
    ],
  };

  const isGathering = (skillFile.GATHERING_SKILLS || []).includes(skillId);
  const isArtisan = Boolean(skillFile.ARTISAN_RECIPES?.[skillId]);
  const speedPrefix = isGathering
    ? "GATHERING_AFFINITY"
    : isArtisan
      ? "ARTISAN_AFFINITY"
      : null;
  const speedLines = speedPrefix
    ? [
        `Affinity 25: +${formatPercent(Number(gameStateFile?.[`${speedPrefix}_MILESTONE_SPEED_25`] || 0))} action speed.`,
        `Affinity 50: +${formatPercent(Number(gameStateFile?.[`${speedPrefix}_MILESTONE_SPEED_50`] || 0))} action speed.`,
      ]
    : [];
  if (isArtisan) {
    speedLines.push(
      perLevel(
        "ARTISAN_AFFINITY_DOUBLE_OUTPUT_CHANCE_PER_LEVEL",
        "ARTISAN_AFFINITY_DOUBLE_OUTPUT_CHANCE_MAX",
        "Double output chance",
      ),
    );
  }

  const lines = [
    ...(perks[skillId] || []),
    ...speedLines,
    ...(milestones[skillId] || []),
  ].filter(Boolean);
  if (!lines.length) {
    return [];
  }

  // Affinity XP is a flat per-action amount set per skill, not a share of the
  // action's skill XP.
  const flatRate = Number(skillFile.AFFINITY_XPA_PER_SKILL?.[skillId] || 0);
  const intro = flatRate
    ? `Every node, recipe, or mark levels its own affinity track, earning ${formatNumber(flatRate)} affinity XP per action.`
    : "Every node, recipe, or mark levels its own affinity track.";

  return [
    intro,
    "Affinity uses a much gentler curve than skill levels: roughly 116,000 total XP to affinity 99, against ~9.7M for skill 99.",
    ...lines,
  ];
}

function buildSkillEntries(
  skillFile,
  itemFile,
  wikiData,
  milestoneLore,
  skillTreeBranches,
  gameStateFile,
  autoPassives,
  quests,
  skillMilestones,
) {
  const allSkills = skillFile.ALL_SKILLS || [];
  const labels = skillFile.SKILL_LABELS || {};
  const gathering = skillFile.GATHERING_NODES || {};
  const recipes = skillFile.ARTISAN_RECIPES || {};
  const itemPrices = itemFile.PRICE_BY_ID || {};
  const items = itemFile.ITEMS || {};

  return allSkills.map((skillId) => {
    const name = labels[skillId] || skillId;
    const gatheringNodes = gathering[skillId] || [];
    const recipeList = recipes[skillId] || [];
    const isGathering = gatheringNodes.length > 0;
    const isArtisan = recipeList.length > 0;
    const nodeRows = gatheringNodes.map((node) => {
      const itemName = items[node.item_yield]?.name || node.item_yield;
      const itemPrice = Number(itemPrices[node.item_yield] || 0);
      const actionsPerHour = 3600 / Number(node.seconds_per_action || 1);
      const xpPerHour = Number(node.xp_per_action || 0) * actionsPerHour;
      const gpPerHour = itemPrice * actionsPerHour;
      return {
        name: node.name || node.id,
        level: Number(node.level || 0),
        xp: Number(node.xp_per_action || 0),
        seconds: Number(node.seconds_per_action || 0),
        itemName,
        itemPrice,
        xpPerHour,
        gpPerHour,
      };
    });
    const recipeRows = recipeList.map((recipe) => {
      const outputId = recipe.produces || recipe.item_yield || recipe.id;
      const outputName = items[outputId]?.name || outputId;
      const outputPrice = Number(itemPrices[outputId] || 0);
      const inputs = Object.entries(recipe.requires || {});
      const inputCost = inputs.reduce(
        (sum, [itemId, count]) =>
          sum + Number(itemPrices[itemId] || 0) * Number(count || 0),
        0,
      );
      const profitPerAction = outputPrice - inputCost;
      const actionsPerHour = 3600 / Number(recipe.seconds || 1);
      const xpPerHour = Number(recipe.xp_per_action || 0) * actionsPerHour;
      const gpPerHour = profitPerAction * actionsPerHour;
      const gpPerXp =
        Number(recipe.xp_per_action || 0) > 0
          ? profitPerAction / Number(recipe.xp_per_action || 1)
          : 0;
      return {
        name: recipe.name || recipe.id || outputName,
        level: Number(recipe.level || 0),
        xp: Number(recipe.xp_per_action || 0),
        seconds: Number(recipe.seconds || recipe.seconds_per_action || 0),
        outputName,
        outputPrice,
        inputCost,
        profitPerAction,
        xpPerHour,
        gpPerHour,
        gpPerXp,
        inputs: inputs
          .map(
            ([itemId, count]) => `${items[itemId]?.name || itemId} x${count}`,
          )
          .join(", "),
      };
    });

    const efficiency = [...nodeRows, ...recipeRows];
    const bestXp =
      efficiency
        .slice()
        .sort((left, right) => right.xpPerHour - left.xpPerHour)[0] || null;
    const bestGp =
      efficiency
        .slice()
        .sort((left, right) => right.gpPerHour - left.gpPerHour)[0] || null;
    const bestRatio =
      efficiency
        .slice()
        .filter((entry) => Number.isFinite(entry.gpPerXp))
        .sort((left, right) => right.gpPerXp - left.gpPerXp)[0] || null;
    const codex = SKILL_CODEX[skillId] || {};
    const catalog = buildSkillActionCatalog(skillId, skillFile, gameStateFile);
    const xpTable = buildSkillXpTable(skillId, catalog, gameStateFile);
    const unlocks = buildSkillUnlockTimeline({
      skillId,
      skillFile,
      itemFile,
      gameStateFile,
      milestones: skillMilestones,
      passives: autoPassives,
      quests,
    });
    const affinityLines = describeSkillAffinity(
      skillId,
      skillFile,
      gameStateFile,
    );
    const treeBranch = (skillTreeBranches || []).find(
      (branch) => branch.id === skillId,
    );
    const totalXpToCap = xpForLevel(SKILL_LEVEL_CAP);

    const searchText = [
      skillId,
      name,
      codex.role,
      codex.aliases,
      codex.what,
      codex.train,
      // Let a player find the skill by anything gated behind it: a capstone
      // item, a mark, a quest name, not just the skill's own name.
      ...unlocks.map((unlock) => `${unlock.kind} ${unlock.text}`),
      ...nodeRows.map((row) => row.name),
      ...recipeRows.map((row) => row.name),
      bestXp?.name,
      bestGp?.name,
      bestRatio?.name,
      "xp table levels unlocks requirements skill guide",
    ]
      .map(normalizeSearchText)
      .join(" ");
    // SKILL_MILESTONE_LORE is keyed level -> line. renderSimpleTable escapes
    // its own cells, so pass the raw strings rather than pre-rendered HTML.
    const loreRows = Object.entries(milestoneLore?.[skillId] || {})
      .map(([level, line]) => [Number(level), String(line)])
      .sort((left, right) => left[0] - right[0]);

    return {
      kind: "Skill",
      section: "skills",
      id: skillId,
      name,
      title: name,
      subtitle:
        codex.role ||
        (isGathering ? "Gathering" : isArtisan ? "Artisan" : "Progression"),
      badges: [
        isGathering ? "gathering" : null,
        isArtisan ? "artisan" : null,
        affinityLines.length ? "affinity" : null,
        labels[skillId] ? labels[skillId] : null,
      ].filter(Boolean),
      searchText,
      sortKey: name.toLowerCase(),
      spoiler: false,
      metrics: [
        { label: "Level cap", value: formatNumber(SKILL_LEVEL_CAP) },
        {
          label: `Total XP to ${SKILL_LEVEL_CAP}`,
          value: formatNumber(totalXpToCap),
        },
        unlocks.length
          ? { label: "Level unlocks", value: formatNumber(unlocks.length) }
          : null,
        bestXp
          ? {
              label: "Best XP/hr",
              value: `${formatNumber(bestXp.xpPerHour)} XP/hr`,
            }
          : null,
        bestGp
          ? {
              label: "Best GP/hr",
              value: `${formatNumber(bestGp.gpPerHour)} gp/hr`,
            }
          : null,
        bestRatio
          ? { label: "Best GP/XP", value: formatDecimal(bestRatio.gpPerXp) }
          : null,
      ].filter(Boolean),
      body: `
        <div class="grid-2">
          <div class="stat-box"><strong>Type</strong><span>${escapeHtml(codex.role || (isGathering ? "Gathering" : isArtisan ? "Artisan" : "Progression"))}</span></div>
          <div class="stat-box"><strong>In-game name</strong><span>${escapeHtml(labels[skillId] || skillId)}</span></div>
        </div>
        ${
          codex.what
            ? `<div class="note-box"><strong>What it does</strong><span>${escapeHtml(codex.what)}</span></div>`
            : ""
        }
        ${
          codex.train
            ? `<div class="note-box"><strong>How you train it</strong><span>${escapeHtml(codex.train)}</span></div>`
            : ""
        }
        ${
          treeBranch
            ? `<div class="note-box"><strong>Skill tree</strong><span>Has its own ${escapeHtml(treeBranch.name)} branch in the Mastery tree.</span></div>`
            : ""
        }
        ${bestXp ? renderStatSummary("Best XP/hour", bestXp.name, `${formatNumber(bestXp.xpPerHour)} XP/hr`) : ""}
        ${bestGp ? renderStatSummary("Best GP/hour", bestGp.name, `${formatNumber(bestGp.gpPerHour)} gp/hr`) : ""}
        ${bestRatio ? renderStatSummary("Best GP per XP", bestRatio.name, formatDecimal(bestRatio.gpPerXp)) : ""}
        ${renderSimpleTable(
          `Unlocks by level (${unlocks.length})`,
          ["Level", "Type", "Unlocks"],
          unlocks.map((unlock) => [unlock.level, unlock.kind, unlock.text]),
          { open: false },
        )}
        ${renderSimpleTable(
          `XP table, levels 2 to ${SKILL_LEVEL_CAP}`,
          xpTable.headings,
          xpTable.rows,
          { open: false },
        )}
        ${affinityLines.length ? renderDetailBlock("Affinity", affinityLines) : ""}
        ${isGathering ? renderEfficiencyTable("Gathering nodes", nodeRows, ["Level", "XP/action", "Seconds", "Output", "XP/hr", "GP/hr"]) : ""}
        ${isArtisan ? renderEfficiencyTable("Artisan recipes", recipeRows, ["Level", "XP/action", "Seconds", "Output", "Input cost", "Profit/action", "XP/hr", "GP/hr", "GP/XP"]) : ""}
        ${renderSimpleTable(
          "Milestone lore",
          ["Level", "Lore"],
          loreRows,
          { open: false },
        )}
      `,
      efficiency,
    };
  });
}

const QUEST_ARC_ORDER = {
  early: 0,
  mid: 1,
  late: 2,
  aftermath: 3,
  frostmere: 4,
  whisperwood: 5,
};

function titleizeId(value) {
  return String(value || "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function buildQuestEntries(quests, itemFile, skillFile, questFile) {
  const arcLabels = questFile?.ARC_LABELS || {};
  const arcColors = questFile?.ARC_COLORS || {};
  const fragments = questFile?.QUEST_FRAGMENTS || {};
  const items = itemFile?.ITEMS || {};
  const skillLabels = skillFile?.SKILL_LABELS || {};

  return (quests || []).map((quest, index) => {
    const name = quest.name || quest.title || quest.id || `Quest ${index + 1}`;
    const arcKey = quest.arc || "";
    const arcLabel = arcLabels[arcKey] || (arcKey ? titleizeId(arcKey) : "");
    const arcColor =
      typeof arcColors[arcKey] === "string" && arcColors[arcKey].startsWith("#")
        ? arcColors[arcKey]
        : "var(--accent)";
    const rewards = quest.rewards || {};
    const xpEntries = Object.entries(rewards.xp || {});
    const totalXp = xpEntries.reduce((sum, [, value]) => sum + Number(value || 0), 0);
    const fragment = rewards.memoryFragment
      ? fragments[rewards.memoryFragment]
      : null;

    const rewardChips = [];
    if (totalXp > 0) rewardChips.push(`${formatNumber(totalXp)} XP`);
    if (rewards.masteryPoints) rewardChips.push(`+${rewards.masteryPoints} MP`);
    if (fragment || rewards.memoryFragment) rewardChips.push("Memory fragment");
    if (rewards.items) rewardChips.push("Item");
    if (rewards.factionRep) rewardChips.push("Faction rep");

    const rewardRows = [];
    for (const [skillId, amount] of xpEntries) {
      rewardRows.push([
        `${skillLabels[skillId] || titleizeId(skillId)} XP`,
        formatNumber(Number(amount || 0)),
      ]);
    }
    if (rewards.masteryPoints) {
      rewardRows.push(["Mastery Points", `+${rewards.masteryPoints}`]);
    }
    for (const [factionId, amount] of Object.entries(rewards.factionRep || {})) {
      rewardRows.push([`${titleizeId(factionId)} reputation`, `+${amount}`]);
    }
    for (const [itemId, qty] of Object.entries(rewards.items || {})) {
      rewardRows.push([items[itemId]?.name || titleizeId(itemId), `×${qty}`]);
    }
    if (fragment || rewards.memoryFragment) {
      rewardRows.push([
        "Memory fragment",
        fragment?.title || titleizeId(rewards.memoryFragment),
      ]);
    }

    return {
      kind: "Quest",
      section: "quests",
      id: quest.id || String(index),
      name,
      title: name,
      subtitle: quest.npc_name || quest.quest_giver || "Quest",
      badges: [arcLabel || null, quest.npc_name || null].filter(Boolean),
      tags: rewardChips,
      searchText: `${collectSearchText(quest)} ${normalizeSearchText(arcLabel)}`,
      sortKey: `${QUEST_ARC_ORDER[arcKey] ?? 9}-${String(quest.sort ?? index).padStart(4, "0")}`,
      spoiler: true,
      metrics: [
        arcLabel ? { label: "Story arc", value: arcLabel } : null,
        quest.req_display
          ? { label: "Requirement", value: quest.req_display }
          : null,
        rewardChips.length
          ? { label: "Rewards", value: rewardChips.join(" · ") }
          : null,
      ].filter(Boolean),
      body: `
        ${arcLabel ? `<div class="faction-crest" style="border-color:${escapeHtml(arcColor)}"><span class="faction-dot" style="background:${escapeHtml(arcColor)}"></span><em>${escapeHtml(arcLabel)}</em></div>` : ""}
        ${quest.desc ? renderDetailBlock("Briefing", [quest.desc]) : ""}
        ${quest.npc_dialogue ? renderDetailBlock(`${quest.npc_name || "They"} says`, [quest.npc_dialogue]) : ""}
        ${quest.req_display ? renderDetailBlock("Requirement", [quest.req_display]) : ""}
        ${renderSimpleTable("Rewards", ["Reward", "Amount"], rewardRows)}
        ${fragment?.text ? renderDetailBlock(`Memory recovered: ${fragment.title || ""}`, [fragment.text]) : ""}
      `,
    };
  });
}

function buildFragmentEntries(questFile) {
  const fragments = questFile?.QUEST_FRAGMENTS || {};
  const quests = questFile?.ALL_QUESTS || [];
  const awardedBy = {};
  for (const quest of quests) {
    const fragmentId = quest.rewards?.memoryFragment;
    if (fragmentId) {
      awardedBy[fragmentId] = quest.name || quest.id;
    }
  }
  return Object.keys(fragments).map((fragmentId, index) => {
    const fragment = fragments[fragmentId] || {};
    const source = awardedBy[fragmentId];
    const title = fragment.title || titleizeId(fragmentId);
    const text = fragment.text || "";
    return {
      kind: "Memory Fragment",
      section: "fragments",
      id: fragmentId,
      name: title,
      title,
      subtitle: source ? `Recovered from "${source}"` : "Recovered in the field",
      badges: [source ? "quest reward" : "field recovery"],
      tags: [source || "Field recovery"],
      searchText: normalizeSearchText(
        `${title} ${text} ${source || ""} memory fragment lore`,
      ),
      sortKey: String(index).padStart(3, "0"),
      spoiler: true,
      metrics: [
        {
          label: "Source",
          value: source ? `Quest: ${source}` : "Field recovery",
        },
      ],
      body: `
        <div class="fragment-text">${escapeHtml(text)}</div>
        ${source ? renderDetailBlock("Where it's found", [`Awarded by the quest "${source}".`]) : ""}
      `,
    };
  });
}

function buildNpcEntries(quests) {
  const groups = new Map();
  for (const quest of quests || []) {
    const npcName =
      quest.npc_name || quest.quest_giver || quest.giver || "Unknown NPC";
    if (!groups.has(npcName)) {
      groups.set(npcName, []);
    }
    groups.get(npcName).push(quest);
  }
  return [...groups.entries()].map(([npcName, npcQuests]) => {
    const quotes = npcQuests.map((quest) => quest.npc_dialogue).filter(Boolean);
    const searchText = [
      npcName,
      ...npcQuests.map((quest) => collectSearchText(quest)),
    ].join(" ");
    return {
      kind: "NPC",
      section: "npcs",
      id: npcName.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      name: npcName,
      title: npcName,
      subtitle: `${npcQuests.length} quest${npcQuests.length === 1 ? "" : "s"}`,
      badges: ["dialogue", "quest giver"],
      searchText,
      sortKey: npcName.toLowerCase(),
      spoiler: true,
      metrics: [{ label: "Quests", value: npcQuests.length }],
      body: `
        ${renderDetailBlock("Quest dialogues", quotes.length ? quotes.map((quote) => quote) : ["No dialogue recorded."])}
        ${renderDetailBlock(
          "Quest list",
          npcQuests.map(
            (quest) =>
              `${quest.name || quest.title || quest.id || "Quest"}${quest.id ? ` · ${quest.id}` : ""}`,
          ),
        )}
        ${renderKeyedTable(
          "Raw NPC quest data",
          npcQuests.map((quest, index) => [
            quest.name || quest.title || String(index + 1),
            renderValue(quest),
          ]),
        )}
      `,
    };
  });
}

function buildVendorEntries(itemFile, monsterFile) {
  const items = itemFile?.ITEMS || {};
  const prices = itemFile?.PRICE_BY_ID || {};
  const vendorMap = new Map();

  for (const [itemId, item] of Object.entries(items)) {
    const sourceHint = String(item?.source_hint || "").trim();
    if (!sourceHint) continue;
    const vendorInfo = resolveVendorFromSourceHint(sourceHint);
    if (!vendorInfo) continue;

    if (!vendorMap.has(vendorInfo.id)) {
      vendorMap.set(vendorInfo.id, {
        id: vendorInfo.id,
        title: vendorInfo.title,
        subtitle: vendorInfo.subtitle,
        items: [],
      });
    }

    const gpPrice = Number(prices[itemId] || 0);
    const priceLabel =
      gpPrice > 0
        ? `${formatNumber(gpPrice)} gp`
        : /free\s+starter/i.test(sourceHint)
          ? "Free"
          : "No gp price";

    vendorMap.get(vendorInfo.id).items.push({
      itemId,
      name: String(item?.name || itemId),
      category: String(item?.category || "-"),
      slot: String(item?.slot || "-"),
      sourceHint,
      price: gpPrice,
      priceLabel,
      terms: summarizeVendorTerms(sourceHint),
    });
  }

  return [...vendorMap.values()]
    .map((vendor) => {
      const sortedItems = vendor.items
        .slice()
        .sort((left, right) => left.name.localeCompare(right.name));
      const priced = sortedItems.filter((entry) => entry.price > 0);
      const minPrice = priced.length
        ? Math.min(...priced.map((entry) => entry.price))
        : 0;
      const maxPrice = priced.length
        ? Math.max(...priced.map((entry) => entry.price))
        : 0;
      const exchangeCount = sortedItems.filter((entry) =>
        /exchange/i.test(entry.sourceHint),
      ).length;
      const inventoryRows = sortedItems.map((entry) => ({
        item: entry.name,
        category: entry.category,
        slot: entry.slot,
        price: entry.priceLabel,
        terms: entry.terms,
      }));
      const inventoryExpand =
        vendor.id === "store" ? buildInventoryExpandDetails(monsterFile) : null;
      const searchChunks = [
        vendor.title,
        vendor.subtitle,
        ...sortedItems.map(
          (entry) =>
            `${entry.name} ${entry.itemId} ${entry.sourceHint} ${entry.priceLabel}`,
        ),
      ];
      if (inventoryExpand) {
        searchChunks.push(
          `inventory slots base ${inventoryExpand.baseCost} growth ${inventoryExpand.growthRate} min ${inventoryExpand.minCapacity} max ${inventoryExpand.maxCapacity}`,
        );
      }

      return {
        kind: "Vendor",
        section: "vendors",
        id: vendor.id,
        name: vendor.title,
        title: vendor.title,
        subtitle: vendor.subtitle,
        badges: [
          "inventory",
          exchangeCount > 0 ? "exchange" : "gp",
          priced.length ? `${priced.length} priced` : "no gp prices",
        ],
        tags: ["vendor", vendor.id],
        searchText: searchChunks.map(normalizeSearchText).join(" "),
        sortKey: `vendor ${vendor.title}`.toLowerCase(),
        spoiler: false,
        metrics: [
          { label: "Items sold", value: sortedItems.length },
          { label: "GP-priced", value: priced.length },
          priced.length
            ? {
                label: "Price range",
                value: `${formatNumber(minPrice)}-${formatNumber(maxPrice)} gp`,
              }
            : { label: "Price range", value: "No gp prices" },
          inventoryExpand
            ? {
                label: "Inventory slots",
                value: `${inventoryExpand.minCapacity} to ${inventoryExpand.maxCapacity}`,
              }
            : null,
        ].filter(Boolean),
        body: `
          ${renderDetailBlock("Vendor details", [
            `${vendor.title} inventory is derived directly from item source hints and ItemData price tables.`,
          ])}
          ${renderEfficiencyTable("Inventory", inventoryRows, ["Item", "Category", "Slot", "Price", "Terms"])}
          ${
            inventoryExpand
              ? renderDetailBlock("Inventory slot expansion", [
                  `Base capacity: ${formatNumber(inventoryExpand.minCapacity)} slots`,
                  `Maximum capacity: ${formatNumber(inventoryExpand.maxCapacity)} slots`,
                  `Formula per purchase: round(${formatNumber(inventoryExpand.baseCost)} * ${inventoryExpand.growthRate}^tier), clamped to ${formatNumber(inventoryExpand.maxSlotCost)} gp`,
                  `Tier starts at 0 for the first slot above base capacity.`,
                ])
              : ""
          }
          ${
            inventoryExpand
              ? renderEfficiencyTable(
                  "Inventory slot cost progression (first 30)",
                  inventoryExpand.firstRows,
                  ["Purchase", "Capacity", "Slot cost", "Cumulative cost"],
                )
              : ""
          }
          ${
            inventoryExpand
              ? renderEfficiencyTable(
                  "Inventory slot milestones (every +100 slots)",
                  inventoryExpand.milestoneRows,
                  ["Purchase", "Capacity", "Slot cost", "Cumulative cost"],
                )
              : ""
          }
        `,
      };
    })
    .sort((left, right) => left.title.localeCompare(right.title));
}

function buildInventoryExpandDetails(monsterFile) {
  const minCapacity = Number(monsterFile?.MIN_INVENTORY_CAPACITY || 50);
  const maxCapacity = Number(monsterFile?.MAX_INVENTORY_CAPACITY || 5000);
  const baseCost = Number(
    monsterFile?.INVENTORY_EXPAND_BASE_COST_PER_SLOT || 0,
  );
  const growthRate = Number(monsterFile?.INVENTORY_EXPAND_GROWTH_RATE || 1);
  const maxSlotCost = Number(
    monsterFile?.INVENTORY_EXPAND_MAX_COST_PER_SLOT || 2000000000,
  );

  if (maxCapacity <= minCapacity || baseCost <= 0 || growthRate <= 0) {
    return null;
  }

  const maxPurchases = maxCapacity - minCapacity;
  const slotCostForTier = (tier) => {
    const scaled = baseCost * Math.pow(growthRate, Math.max(0, tier));
    return Math.min(maxSlotCost, Math.max(1, Math.round(scaled)));
  };

  const firstRows = [];
  let cumulative = 0;
  for (
    let purchase = 1;
    purchase <= Math.min(maxPurchases, 30);
    purchase += 1
  ) {
    const tier = purchase - 1;
    const slotCost = slotCostForTier(tier);
    cumulative += slotCost;
    firstRows.push({
      purchase: String(purchase),
      capacity: String(minCapacity + purchase),
      "slot cost": `${formatNumber(slotCost)} gp`,
      "cumulative cost": `${formatNumber(cumulative)} gp`,
    });
  }

  const milestoneRows = [];
  let running = 0;
  for (let purchase = 1; purchase <= maxPurchases; purchase += 1) {
    const tier = purchase - 1;
    running += slotCostForTier(tier);
    const isMilestone = purchase % 100 === 0 || purchase === maxPurchases;
    if (!isMilestone) continue;
    milestoneRows.push({
      purchase: String(purchase),
      capacity: String(minCapacity + purchase),
      "slot cost": `${formatNumber(slotCostForTier(tier))} gp`,
      "cumulative cost": `${formatNumber(running)} gp`,
    });
  }

  return {
    minCapacity,
    maxCapacity,
    baseCost,
    growthRate,
    maxSlotCost,
    firstRows,
    milestoneRows,
  };
}

function resolveVendorFromSourceHint(sourceHint) {
  const hint = String(sourceHint || "").trim();
  const lower = hint.toLowerCase();
  if (!hint) return null;
  if (lower.startsWith("store")) {
    return { id: "store", title: "Store", subtitle: "General store catalog" };
  }
  if (lower.includes("chronicler vendor")) {
    return {
      id: "chronicler_vendor",
      title: "Chronicler Vendor",
      subtitle: "Dungeon exchange vendor",
    };
  }
  if (lower.includes("vendor")) {
    const matched = hint.match(/([A-Za-z0-9'\-\s]+vendor)/i);
    const vendorName = String(matched?.[1] || "Vendor").trim();
    const vendorId = vendorName.toLowerCase().replace(/[^a-z0-9]+/g, "_");
    return {
      id: vendorId,
      title: capitalize(vendorName),
      subtitle: "Vendor inventory",
    };
  }
  return null;
}

function summarizeVendorTerms(sourceHint) {
  const hint = String(sourceHint || "").trim();
  const exchangeMatch = hint.match(/exchange\s+([^\)]+)/i);
  if (exchangeMatch) {
    return `Exchange: ${String(exchangeMatch[1] || "").trim()}`;
  }
  if (/free\s+starter/i.test(hint)) {
    return "Free starter";
  }
  if (/gold\s+purchase/i.test(hint)) {
    return "Gold purchase";
  }
  return hint;
}

function buildDungeonEntries(dungeons, itemFile, questFile) {
  const items = itemFile?.ITEMS || {};
  const prices = itemFile?.PRICE_BY_ID || {};
  const fragments = questFile?.QUEST_FRAGMENTS || {};
  const itemName = (id) => items[id]?.name || titleizeId(id);

  return (dungeons || []).map((dungeon, index) => {
    const rewards = dungeon.rewards || {};
    const boss = dungeon.boss || {};
    const color =
      typeof dungeon.color === "string" && dungeon.color.startsWith("#")
        ? dungeon.color
        : "var(--accent)";

    const lootRows = (rewards.loot_table || []).map((drop) => {
      const price = Number(prices[drop.item_id] || 0);
      const expectedValue =
        price *
        average(Number(drop.qty_min || 1), Number(drop.qty_max || 1)) *
        Number(drop.chance || 0);
      return [
        itemName(drop.item_id),
        formatPercent(drop.chance || 0),
        Number(drop.qty_min) === Number(drop.qty_max)
          ? String(drop.qty_min || 1)
          : `${drop.qty_min || 1}-${drop.qty_max || 1}`,
        `${formatNumber(expectedValue)} gp`,
      ];
    });

    const waveRows = (dungeon.waves || []).map((wave) => [
      wave.name || "Wave",
      `×${wave.count || 1}`,
      capitalize(String(wave.style || "balanced")),
      formatNumber(wave.hp || 0),
      formatNumber(wave.damage || 0),
    ]);

    const phaseRows = (boss.phases || []).map((phase) => [
      phase.name || "Phase",
      `${Math.round(Number(phase.trigger_pct || 0) * 100)}% HP`,
      capitalize(String(phase.style || "balanced")),
      `${formatNumber(phase.damage_per_tick || 0)}/tick`,
      phase.immune_to ? capitalize(phase.immune_to) : "None",
      phase.desc || "",
    ]);

    // A phase can carry a defence-penetrating attack, which is not visible
    // anywhere in the per-tick damage column and is what actually kills people.
    const penetratingLines = (boss.phases || [])
      .filter((phase) => phase.penetrating)
      .flatMap((phase) => {
        const pen = phase.penetrating || {};
        return [
          `${phase.name || "Phase"}: ${formatNumber(pen.damage || 0)} damage every ${formatNumber(pen.every_ticks || 0)} ticks, no sooner than ${formatNumber(pen.min_ticks || 0)} ticks apart.`,
          "This attack ignores your Defence level and the Fracture Tonic. Only damage reduction from gear and the Scar-Ward Draught reduces it.",
          pen.windup ? `Wind-up: ${pen.windup}` : null,
        ].filter(Boolean);
      });

    const firstClear = rewards.first_clear_bonus || {};
    const firstClearLines = [];
    if (firstClear.masteryPoints) {
      firstClearLines.push(`+${firstClear.masteryPoints} Mastery Points`);
    }
    for (const [itemId, qty] of Object.entries(firstClear.items || {})) {
      firstClearLines.push(`${itemName(itemId)} ×${qty}`);
    }
    if (firstClear.memoryFragment) {
      firstClearLines.push(
        `Memory fragment: ${fragments[firstClear.memoryFragment]?.title || titleizeId(firstClear.memoryFragment)}`,
      );
    }

    return {
      kind: "Dungeon",
      section: "dungeons",
      id: dungeon.id || String(index),
      name: dungeon.name || dungeon.id || `Dungeon ${index + 1}`,
      title: dungeon.name || dungeon.id || `Dungeon ${index + 1}`,
      subtitle: dungeon.subtitle || "Boss dungeon",
      badges: [boss.name ? `Boss: ${boss.name}` : null].filter(Boolean),
      tags: [dungeon.req_display].filter(Boolean),
      searchText: collectSearchText(dungeon),
      sortKey: `${dungeon.name || dungeon.id || ""}`.toLowerCase(),
      spoiler: true,
      metrics: [
        dungeon.req_display
          ? { label: "Requirement", value: dungeon.req_display }
          : null,
        boss.max_hp
          ? { label: "Boss HP", value: formatNumber(boss.max_hp) }
          : null,
        lootRows.length
          ? { label: "Loot pool", value: `${lootRows.length} items` }
          : null,
      ].filter(Boolean),
      body: `
        ${dungeon.subtitle ? `<div class="faction-crest" style="border-color:${escapeHtml(color)}"><span class="faction-dot" style="background:${escapeHtml(color)}"></span><em>${escapeHtml(dungeon.subtitle)}</em></div>` : ""}
        ${dungeon.lore ? renderDetailBlock("Lore", [dungeon.lore]) : ""}
        ${dungeon.req_display ? renderDetailBlock("Requirement", [dungeon.req_display]) : ""}
        ${renderSimpleTable("Waves", ["Wave", "Count", "Style", "HP", "Damage"], waveRows, { open: false })}
        ${
          boss.name
            ? `<div class="grid-2">
                 <div class="stat-box"><strong>Boss</strong><span>${escapeHtml(boss.name)}</span></div>
                 <div class="stat-box"><strong>Boss HP</strong><span>${formatNumber(boss.max_hp || 0)}</span></div>
               </div>`
            : ""
        }
        ${boss.lore ? renderDetailBlock(`${boss.name || "Boss"} lore`, [boss.lore]) : ""}
        ${renderSimpleTable("Boss phases", ["Phase", "Triggers", "Style", "Damage", "Immune to", "Behaviour"], phaseRows, { open: false })}
        ${penetratingLines.length ? renderDetailBlock("Defence-penetrating attacks", penetratingLines) : ""}
        ${firstClearLines.length ? renderDetailBlock("First-clear bonus", firstClearLines) : ""}
        ${renderSimpleTable("Loot table", ["Item", "Chance", "Qty", "Expected value"], lootRows)}
      `,
    };
  });
}

function buildFactionEntries(factions) {
  return (factions || []).map((faction, index) => {
    const color =
      typeof faction.color === "string" && faction.color.startsWith("#")
        ? faction.color
        : "var(--accent)";
    const tagline = faction.tagline || faction.subtitle || "Faction";
    const lore = faction.lore || "";
    // bonuses is a dict keyed by reputation threshold ("25", "50", ...).
    const bonusRows = Object.entries(faction.bonuses || {})
      .map(([rep, bonus]) => [Number(rep), String(bonus?.desc || "")])
      .sort((left, right) => left[0] - right[0])
      .map(([rep, desc]) => [`Rep ${rep}`, desc]);
    return {
      kind: "Faction",
      section: "factions",
      id: faction.id || String(index),
      name: faction.name || faction.id || `Faction ${index + 1}`,
      title: faction.name || faction.id || `Faction ${index + 1}`,
      subtitle: faction.leader ? `Led by ${faction.leader}` : "Faction",
      badges: [faction.region].filter(Boolean),
      tags: bonusRows.length
        ? [`${bonusRows.length} reputation tiers`]
        : [],
      searchText: collectSearchText(faction),
      sortKey: `${faction.name || faction.id || ""}`.toLowerCase(),
      spoiler: true,
      metrics: [
        { label: "Leader", value: faction.leader || "Unknown" },
        bonusRows.length
          ? { label: "Reputation tiers", value: String(bonusRows.length) }
          : null,
      ].filter(Boolean),
      body: `
        <div class="faction-crest" style="border-color:${escapeHtml(color)}">
          <span class="faction-dot" style="background:${escapeHtml(color)}"></span>
          <em>${escapeHtml(tagline)}</em>
        </div>
        ${lore ? renderDetailBlock("Lore", [lore]) : ""}
        ${renderSimpleTable("Reputation rewards", ["Reputation", "Reward"], bonusRows)}
      `,
    };
  });
}

function buildAchievementEntries(achievements) {
  return (achievements || []).map((achievement, index) => ({
    kind: "Achievement",
    section: "achievements",
    id: achievement.id || String(index),
    name: achievement.name || achievement.id || `Achievement ${index + 1}`,
    title: achievement.name || achievement.id || `Achievement ${index + 1}`,
    subtitle: achievement.category || achievement.group || "Achievement",
    badges: [
      achievement.category,
      achievement.points ? `${achievement.points} pts` : null,
    ].filter(Boolean),
    searchText: collectSearchText(achievement),
    sortKey: `${achievement.name || achievement.id || ""}`.toLowerCase(),
    spoiler: true,
    metrics: [
      achievement.points
        ? { label: "Points", value: achievement.points }
        : null,
    ].filter(Boolean),
    body: renderGenericObject(achievement, null, "Achievement details"),
  }));
}

function buildTitleEntries(titles) {
  return (titles || []).map((title, index) => ({
    kind: "Title",
    section: "titles",
    id: title.id || String(index),
    name: title.name || title.id || `Title ${index + 1}`,
    title: title.name || title.id || `Title ${index + 1}`,
    subtitle: title.source || title.category || "Title",
    badges: [title.category, title.unlock || title.requirement].filter(Boolean),
    searchText: collectSearchText(title),
    sortKey: `${title.name || title.id || ""}`.toLowerCase(),
    spoiler: true,
    metrics: [],
    body: renderGenericObject(title, null, "Title details"),
  }));
}

// Kaldreth's first paid expansion, released as 1.2.0. Everything that ships
// inside it is tagged "expansion": 1 in the source data (Content Gating Rule,
// docs/EXPANSIONS.md), so the counts below are read from the same records the
// game itself gates on rather than hand-copied from patch notes - they stay
// correct as Whisperwood content changes without anyone remembering to update
// this page.
function buildWhisperwoodEntries(
  quests,
  monsterFile,
  items,
  achievements,
  titles,
  dungeons,
  factions,
  companions,
) {
  const isExp1 = (entry) => Number(entry?.expansion || 0) === 1;

  const expQuests = (quests || [])
    .filter(isExp1)
    .slice()
    .sort((left, right) => Number(left.sort || 0) - Number(right.sort || 0));
  const expMonsters = Object.values(monsterFile?._monster_defs_data || {}).filter(isExp1);
  const expShadowTargets = Object.values(monsterFile?._shadow_target_defs_data || {}).filter(
    isExp1,
  );
  const expItems = Object.values(items || {}).filter(isExp1);
  const expAchievements = (achievements || []).filter(isExp1);
  const expTitles = (titles || []).filter(isExp1);
  const expDungeons = (dungeons || []).filter(isExp1);
  const groveCovenant = (factions || []).find((f) => f.id === "grove_covenant");

  const zones = [
    [
      "Whisperwood",
      "The main forest floor. Dense undergrowth, low visibility, ambient spirit-energy distortion.",
    ],
    [
      "The Canopy",
      "The upper treetop zone, reached by climbable growth. Elite enemies and patrol encounters, and where the higher tending plots live.",
    ],
    [
      "The Root Warren",
      "The underground root network beneath the forest, and the densest concentration of enemies in the expansion. Both bosses are found here, among Architect inscriptions.",
    ],
  ];

  const newSkills = [
    [
      "Root Lore",
      "Gathering",
      "Harvest wildflowers, fungi, bark, and roots from nodes across the Whisperwood and Canopy. Feeds Aetheric Tending, Alchemy, and Cooking.",
    ],
    [
      "Aetheric Tending",
      "Artisan",
      "Plant herbs in soil plots that run on the wall clock rather than your action slot - a deadline, not a rate, so the 4 hour offline cap never applies to them.",
    ],
    [
      "Spiritbond",
      "Passive / Combat",
      "Bond one companion at a time from creatures of the Whisperwood, each giving passive combat or gathering bonuses and able to be sent on an independent offline forage run.",
    ],
    [
      "Alchemy",
      "Artisan",
      "Brew potions across gathering, combat, and artisan categories, one active per category. Potions also run on the wall clock and keep ticking while the app is closed.",
    ],
  ];

  const companionRows = (companions || [])
    .slice()
    .sort((left, right) => Number(left.level || 0) - Number(right.level || 0))
    .map((companion) => {
      const bonuses =
        [
          companion.combat_xp_pct
            ? `+${formatPercent(companion.combat_xp_pct)} combat XP`
            : null,
          companion.gathering_speed_pct
            ? `+${formatPercent(companion.gathering_speed_pct)} gathering speed`
            : null,
          companion.all_xp_pct ? `+${formatPercent(companion.all_xp_pct)} all XP` : null,
        ]
          .filter(Boolean)
          .join(", ") || "-";
      return [
        companion.name || titleizeId(companion.id),
        `Spiritbond ${formatNumber(companion.level || 0)}`,
        bonuses,
        formatDuration(Number(companion.forage_seconds || 0) / 3600),
      ];
    });

  const featureLines = [
    "Four new skills - Root Lore, Aetheric Tending, Spiritbond, and Alchemy - sit alongside the 16 base game skills without replacing anything in them.",
    "Owning Whisperwood raises every skill's level cap from 99 to 105, including the 16 base game skills. A Heartwood rung was added to each of the 8 existing gathering and artisan ladders, and Spiritweaving gains the Warren Call spell at level 102.",
    "Two new equipment slots, hands and companion, appended to the existing ten. Hands closes a long-standing gap: gloves items existed in the data with nowhere to equip them, base game included.",
    `Two boss dungeons, ${expDungeons.map((d) => d.name || titleizeId(d.id)).join(" and ") || "The Hollow Root and The Grove's Warden"}, bringing the total from 5 to 7. Each has its own first-clear key item and memory fragment, and both pay into the same Chronicler currency the base game dungeons do.`,
    "A Nature branch on the skill tree with 12 nodes, 4 new auto passives, and 4 new rows in the Skill Mastery store.",
    "Two new adventurer contract types, tending and foraging, that run against a deadline instead of occupying the action slot.",
    "An arrival cinematic the first time you reach Whisperwood, and a hidden meditation vision at level 105.",
  ];

  const overview = {
    kind: "Expansion",
    section: "whisperwood",
    id: "whisperwood-overview",
    name: "Expansion 1: Whisperwood, The Living Wilds",
    title: "Expansion 1: Whisperwood, The Living Wilds",
    subtitle: "Kaldreth's first paid expansion, shipped in 1.2.0",
    badges: ["paid expansion", "$5.99", "level cap 105", "shipped in 1.2.0"],
    searchText: normalizeSearchText(
      [
        "whisperwood the living wilds expansion 1 paid dlc in-app purchase the_living_wilds",
        "root lore aetheric tending spiritbond alchemy nature branch",
        "grove covenant warden syrel vaethos hollow root groves warden rootkeeper",
        "companion companions spiritbond bond forage pale hound canopy sprite root stalker whisper drake ancient treant grove guardian heartwood elder",
        ...companionRows.flat(),
        ...zones.flat(),
        ...newSkills.flat(),
        ...featureLines,
      ].join(" "),
    ),
    sortKey: "whisperwood 0 overview",
    spoiler: true,
    metrics: [
      { label: "Price", value: "$5.99, one-time purchase" },
      { label: "Level cap", value: "99 -> 105" },
      { label: "New skills", value: formatNumber(newSkills.length) },
      { label: "New quests", value: formatNumber(expQuests.length) },
      { label: "New monsters", value: formatNumber(expMonsters.length) },
      { label: "New items", value: formatNumber(expItems.length) },
      { label: "New dungeons", value: formatNumber(expDungeons.length) },
      {
        label: "New achievements",
        value: formatNumber(expAchievements.length),
      },
      {
        label: "New Shadow Arts targets",
        value: formatNumber(expShadowTargets.length),
      },
      { label: "Companions", value: formatNumber(companions?.length || 0) },
    ],
    body: `
      <div class="note-box"><strong>If you don't buy it</strong><span>The game you already have is unchanged. No base game bar moves, nothing you have already earned is touched, and no existing content becomes harder to complete. Play Console product id <code>the_living_wilds</code>.</span></div>
      ${renderDetailBlock("The hook", [
        'In the aftermath of the Shattering the natural world destabilises. The Whisperwood, an ancient forest west of Caelmora, begins bleeding spirit energy outward. The Grove Covenant, a faction predating the Accord, emerges to warn that what the Architects awakened underground is still active. Their leader\'s last message before going silent: "The roots remember."',
      ])}
      ${renderSimpleTable("Areas", ["Zone", "What it is"], zones)}
      ${renderSimpleTable("New skills", ["Skill", "Type", "What it does"], newSkills)}
      ${
        groveCovenant
          ? `<div class="note-box"><strong>New faction: ${escapeHtml(groveCovenant.name || "The Grove Covenant")}</strong><span>${escapeHtml(groveCovenant.tagline || "")} ${escapeHtml(groveCovenant.lore || "")} 4 reputation tiers.</span></div>`
          : ""
      }
      ${renderSimpleTable(
        "Spiritbond companions",
        ["Companion", "Unlocks at", "Passive bonus", "Forage run"],
        companionRows,
      )}
      ${renderDetailBlock("Also included", featureLines)}
      ${renderDetailBlock("Level cap and lapsed entitlements", [
        "Skill XP already earned is never rewritten - the expansion only changes what the level reads. If the entitlement ever lapses, levels read 99 again and not one point of XP is lost; buying back restores the level immediately.",
        "Every base game achievement stays fully earnable without buying anything: All 99s, Jack of All Trades, Bestiary completion, the all-dungeons-clear achievement, and Affinity Mastery are all frozen to the 16 base game skills, so a non-buyer's base game bar never moves and an owner's base game bar never moves either.",
      ])}
      ${renderDetailBlock("The Root Remembers quest arc", [
        `A twenty-quest arc across five acts, from "${expQuests[0]?.name || "Strange Growth"}" to "${expQuests[expQuests.length - 1]?.name || "A Letter from the Sea"}". Completing it awards the ${expTitles[0]?.name || "Rootkeeper"} title.`,
        "See the Quests section, filtered to the Root Remembers arc, for the full quest-by-quest breakdown with NPC dialogue and rewards.",
      ])}
    `,
  };

  return [overview];
}

function buildRoadmapEntries(releases) {
  const overview = {
    kind: "Roadmap",
    section: "roadmap",
    id: "roadmap-overview",
    name: "Release Order",
    title: "Release Order",
    subtitle: "What ships next, and in what order",
    badges: ["overview", "planned"],
    searchText: normalizeSearchText(
      `roadmap release order upcoming future coming soon whats next expansions level cap ${releases
        .map(
          (release) =>
            `${release.name} ${release.tagline} ${release.levelCap}`,
        )
        .join(" ")}`,
    ),
    sortKey: "roadmap 0 release order",
    spoiler: false,
    metrics: [
      { label: "Planned releases", value: formatNumber(releases.length) },
      { label: "Next up", value: releases[0]?.name || "-" },
      { label: "Final level cap", value: releases[releases.length - 1]?.levelCap || "-" },
    ],
    body: `
      <div class="note-box"><strong>Plans, not promises</strong><span>${escapeHtml(ROADMAP_DISCLAIMER)}</span></div>
      ${renderSimpleTable(
        "Planned order",
        ["#", "Release", "Access", "Level cap"],
        releases.map((release, index) => [
          index + 1,
          `${release.name} - ${release.tagline}`,
          release.access,
          release.levelCap,
        ]),
      )}
      <div class="note-box"><strong>How the order works</strong><span>Frostmere shipped in 1.1.0 as a free base game update, and Expansion 1: Whisperwood shipped in 1.2.0 as the first paid one. Neither is on this page any more - Frostmere lives in Quests, Monsters, Dungeons, and Patch Notes with the rest of the released game, and Whisperwood has its own Expansion 1: Whisperwood section alongside those. The remaining three expansions release one at a time and are sequential; each one requires the one before it.</span></div>
    `,
  };

  const entries = releases.map((release) => {
    const searchText = normalizeSearchText(
      [
        release.name,
        release.tagline,
        release.status,
        release.access,
        release.unlock,
        `level cap ${release.levelCap}`,
        release.faction?.name,
        release.faction?.tagline,
        ...(release.zones || []).flat(),
        ...(release.skills || []).flat(),
        ...(release.features || []),
        ...(release.alongside?.lines || []),
        "roadmap upcoming future coming soon planned",
      ]
        .filter(Boolean)
        .join(" "),
    );

    return {
      kind: "Roadmap",
      section: "roadmap",
      id: release.id,
      name: release.name,
      title: release.name,
      subtitle: release.tagline,
      badges: [
        release.order === 1 ? "next up" : "planned",
        release.access.startsWith("Free") ? "free update" : "paid expansion",
        release.skills ? `${release.skills.length} new skills` : null,
      ].filter(Boolean),
      searchText,
      sortKey: `roadmap ${release.order} ${release.name.toLowerCase()}`,
      spoiler: false,
      metrics: [
        { label: "Status", value: release.status },
        { label: "Level cap", value: release.levelCap },
        release.skills
          ? {
              label: "New skills",
              value: formatNumber(release.skills.length),
            }
          : null,
      ].filter(Boolean),
      body: `
        <div class="grid-2">
          <div class="stat-box"><strong>Access</strong><span>${escapeHtml(release.access)}</span></div>
          <div class="stat-box"><strong>Unlocks</strong><span>${escapeHtml(release.unlock)}</span></div>
        </div>
        ${
          release.skills
            ? renderSimpleTable(
                "New skills",
                ["Skill", "Type", "What it does"],
                release.skills,
              )
            : ""
        }
        ${renderSimpleTable("New areas", ["Area", "What it is"], release.zones)}
        ${
          release.faction
            ? `<div class="note-box"><strong>New faction: ${escapeHtml(release.faction.name)}</strong><span>${escapeHtml(release.faction.tagline)} ${escapeHtml(release.faction.desc)}</span></div>`
            : ""
        }
        ${renderDetailBlock("Also included", release.features)}
        ${
          release.alongside
            ? renderDetailBlock(release.alongside.name, release.alongside.lines)
            : ""
        }
        ${renderDetailBlock("Story setup (spoilers for earlier content)", [release.hook])}
        <p class="helper">${escapeHtml(ROADMAP_DISCLAIMER)}</p>
      `,
    };
  });

  return [overview, ...entries];
}

function buildPatchEntries(patches) {
  return (patches || []).map((patch, index) => ({
    kind: "Patch Note",
    section: "patches",
    id: patch.version_code || patch.version || String(index),
    name: patch.title || patch.version || `Release ${index + 1}`,
    title: patch.title || patch.version || `Release ${index + 1}`,
    subtitle: `${patch.version || "x.x.x"} · ${patch.version_code || 0}`,
    badges: [patch.version, patch.version_code].filter(Boolean),
    searchText: collectSearchText(patch),
    sortKey: `${patch.version_code || 0}`.toString().padStart(12, "0"),
    spoiler: false,
    metrics: [
      patch.changes ? { label: "Changes", value: patch.changes.length } : null,
    ].filter(Boolean),
    body: `
      ${renderDetailBlock(
        "Changes",
        (patch.changes || []).map((change) => change),
      )}
      ${renderKeyedTable(
        "Raw release data",
        Object.entries(patch)
          .filter(([key]) => key !== "changes")
          .map(([key, value]) => [key, renderValue(value)]),
      )}
    `,
  }));
}

const PASSIVE_TRIGGER_LABELS = {
  kill_count: "monsters defeated",
  steal_count: "successful steals",
  meditation_count: "meditations completed",
  skill_level: "skill level reached",
  fragment_count: "memory fragments recovered",
  quest_count: "quests completed",
  total_level: "total level reached",
};

function describePassiveUnlock(passive) {
  const threshold = Number(passive.threshold || 0);
  const trigger = String(passive.trigger || "");
  switch (trigger) {
    case "kill_count":
      return `Defeat ${formatNumber(threshold)} monsters`;
    case "steal_count":
      return `Land ${formatNumber(threshold)} successful steals`;
    case "meditation_count":
      return `Complete ${formatNumber(threshold)} meditations`;
    case "skill_level":
      return `Reach level ${formatNumber(threshold)} ${capitalize((passive.skill || "").replace(/_/g, " "))}`.trim();
    case "fragment_count":
      return `Recover ${formatNumber(threshold)} memory fragments`;
    case "quest_count":
      return `Complete ${formatNumber(threshold)} quests`;
    case "total_level":
      return `Reach ${formatNumber(threshold)} total level`;
    default:
      return `${formatNumber(threshold)} ${PASSIVE_TRIGGER_LABELS[trigger] || trigger || "progress"}`;
  }
}

function buildPassiveEntries(passives) {
  return (passives || []).map((passive, index) => {
    const unlock = describePassiveUnlock(passive);
    const masteryPoints = Number(passive.mastery_points || 0);
    // The desc bundles "Effect - flavour"; split on the hyphen for a clean lore line.
    const desc = String(passive.desc || "");
    const dashIndex = desc.indexOf(" - ");
    const effectText = dashIndex >= 0 ? desc.slice(0, dashIndex).trim() : desc;
    const loreText = dashIndex >= 0 ? desc.slice(dashIndex + 3).trim() : "";
    return {
      kind: "Passive",
      section: "passives",
      id: passive.id || String(index),
      name: passive.name || passive.id || `Passive ${index + 1}`,
      title: passive.name || passive.id || `Passive ${index + 1}`,
      subtitle: unlock,
      tags: [
        PASSIVE_TRIGGER_LABELS[passive.trigger] || passive.trigger,
        passive.skill ? capitalize(passive.skill.replace(/_/g, " ")) : null,
        masteryPoints > 0 ? `+${masteryPoints} MP` : null,
      ].filter(Boolean),
      badges: [
        masteryPoints > 0 ? `+${masteryPoints} MP` : null,
        passive.skill ? capitalize(passive.skill.replace(/_/g, " ")) : null,
      ].filter(Boolean),
      searchText: collectSearchText(passive),
      sortKey: `${String(passive.trigger || "")} ${String(passive.threshold || "").padStart(8, "0")}`,
      spoiler: false,
      metrics: [
        { label: "Unlock", value: unlock },
        { label: "Effect", value: effectText || "-" },
        masteryPoints > 0
          ? { label: "Bonus", value: `+${masteryPoints} Mastery Point${masteryPoints === 1 ? "" : "s"}` }
          : null,
      ].filter(Boolean),
      body: `
        ${renderDetailBlock("Effect", [effectText])}
        ${loreText ? renderDetailBlock("Lore", [loreText]) : ""}
      `,
    };
  });
}

function buildSkillTreeEntries(branches, nodes) {
  const branchList = branches || [];
  const nodeList = nodes || [];
  if (!branchList.length && !nodeList.length) {
    return [];
  }

  const nodeNameById = {};
  for (const node of nodeList) {
    if (node && node.id) {
      nodeNameById[node.id] = node.name || node.id;
    }
  }

  const nodesByBranch = new Map();
  for (const node of nodeList) {
    const key = node.branch || "other";
    if (!nodesByBranch.has(key)) {
      nodesByBranch.set(key, []);
    }
    nodesByBranch.get(key).push(node);
  }
  for (const list of nodesByBranch.values()) {
    list.sort((left, right) => Number(left.sort || 0) - Number(right.sort || 0));
  }

  const branchCost = (branchId) =>
    (nodesByBranch.get(branchId) || []).reduce(
      (sum, node) => sum + Number(node.cost || 0),
      0,
    );

  const totalNodes = nodeList.length;
  const totalCost = nodeList.reduce((sum, node) => sum + Number(node.cost || 0), 0);

  const entries = [];

  entries.push({
    kind: "Skill Tree",
    section: "skilltree",
    id: "skill-tree-overview",
    name: "Mastery Skill Tree",
    title: "Mastery Skill Tree",
    subtitle: "How mastery points and tree bonuses work",
    badges: [
      "overview",
      `${branchList.length} branches`,
      `${totalNodes} nodes`,
    ],
    searchText: normalizeSearchText(
      `mastery skill tree points branches nodes overview ${branchList
        .map((branch) => branch.name || branch.id)
        .join(" ")}`,
    ),
    sortKey: "0 mastery skill tree overview",
    spoiler: false,
    tags: ["mastery", "progression"],
    metrics: [
      { label: "Branches", value: String(branchList.length) },
      { label: "Nodes", value: String(totalNodes) },
      { label: "MP to unlock all", value: formatNumber(totalCost) },
    ],
    body: `
      ${renderDetailBlock("How it works", [
        "Spend Mastery Points (MP) to unlock nodes. Each node grants a permanent passive bonus.",
        "A node can only be unlocked once every node in its prerequisites is unlocked.",
        `Unlocking all ${totalNodes} nodes costs ${formatNumber(totalCost)} MP in total.`,
      ])}
      ${renderDetailBlock("Where Mastery Points come from", [
        "Skill level milestones (Lv 20 / 40 / 60 / 80 / 99) and total-level milestones.",
        "Quest rewards, achievements, and certain passive unlocks.",
        "The Spirit branch's meditation keystone adds a chance for bonus MP on meditation.",
      ])}
      ${renderKeyedTable(
        "Branches",
        branchList.map((branch) => [
          `${branch.icon ? `${branch.icon} ` : ""}${branch.name || branch.id}`,
          `${(nodesByBranch.get(branch.id) || []).length} nodes · ${formatNumber(branchCost(branch.id))} MP`,
        ]),
      )}
    `,
  });

  for (const branch of branchList) {
    const branchNodes = nodesByBranch.get(branch.id) || [];
    if (!branchNodes.length) {
      continue;
    }
    const cost = branchCost(branch.id);
    const capstone = branchNodes[branchNodes.length - 1];
    const rows = branchNodes
      .map((node) => {
        const reqNames = (node.requires || [])
          .map((id) => nodeNameById[id] || id)
          .join(", ");
        return `<tr>
          <td data-label="Tier">${escapeHtml(String(node.sort ?? "-"))}</td>
          <td data-label="Node">${escapeHtml(node.name || node.id || "")}</td>
          <td data-label="MP">${escapeHtml(String(node.cost ?? "-"))}</td>
          <td data-label="Requires">${escapeHtml(reqNames || "None")}</td>
          <td data-label="Effect">${escapeHtml(node.desc || node.effect || "")}</td>
        </tr>`;
      })
      .join("");

    entries.push({
      kind: "Skill Tree",
      section: "skilltree",
      id: `skill-tree-${branch.id}`,
      name: `${branch.name || branch.id} Branch`,
      title: `${branch.icon ? `${branch.icon} ` : ""}${branch.name || branch.id} Branch`,
      subtitle: "Mastery branch",
      badges: [`${branchNodes.length} nodes`, `${cost} MP`],
      searchText: normalizeSearchText(
        [
          branch.name,
          branch.id,
          ...branchNodes.map((node) => `${node.name} ${node.desc}`),
        ].join(" "),
      ),
      sortKey: `1 ${(branch.name || branch.id).toLowerCase()}`,
      spoiler: false,
      tags: ["mastery", branch.id],
      metrics: [
        { label: "Nodes", value: String(branchNodes.length) },
        { label: "Total MP", value: String(cost) },
        { label: "Capstone", value: capstone?.name || "-" },
      ],
      body: `
        <div class="details">
          <details open>
            <summary>${escapeHtml(branch.name || branch.id)} nodes</summary>
            <div class="details-body">
              <table class="raw-table">
                <thead><tr><th>Tier</th><th>Node</th><th>MP</th><th>Requires</th><th>Effect</th></tr></thead>
                <tbody>${rows}</tbody>
              </table>
            </div>
          </details>
        </div>
      `,
    });
  }

  return entries;
}

function buildTaskEntries(
  dailyPool,
  weeklyPool,
  taskFile,
  itemFile,
  skillFile,
) {
  const tiers = [
    { index: 0, label: "Beginner" },
    { index: 1, label: "Journeyman" },
    { index: 2, label: "Veteran" },
    { index: 3, label: "Master" },
  ];

  const makeEntries = (pool, cadence) =>
    (pool || []).map((task, index) => {
      const labelTemplate = task.label_template || "%d actions";
      const qty = task.qty || [1, 1, 1, 1];
      const gold = task.gold || [0, 0, 0, 0];
      const bonusItems = task.bonus_item || ["", "", "", ""];
      const bonusQty = task.bonus_qty || [0, 0, 0, 0];
      const tierRows = tiers.map((tier) => {
        const targetQty = Number(qty[tier.index] || 0);
        const tierLabel = labelTemplate.replace("%d", String(targetQty));
        const itemId = String(bonusItems[tier.index] || "");
        const itemName = itemFile.ITEMS?.[itemId]?.name || itemId || "-";
        const rewardGold = Number(gold[tier.index] || 0);
        const extraQty = Number(bonusQty[tier.index] || 0);
        const rewardText =
          itemId && extraQty > 0
            ? `${formatNumber(rewardGold)} gp + ${itemName} x${formatNumber(extraQty)}`
            : `${formatNumber(rewardGold)} gp`;
        return {
          tier: tier.label,
          objective: tierLabel,
          rewardText,
          gold: rewardGold,
          itemName,
          itemId,
          itemQty: extraQty,
        };
      });

      const topTier = tierRows[tierRows.length - 1];
      const searchText = [
        task.id,
        task.type,
        task.skill,
        cadence,
        labelTemplate,
        ...tierRows.map(
          (row) => `${row.tier} ${row.objective} ${row.rewardText}`,
        ),
      ]
        .map(normalizeSearchText)
        .join(" ");

      return {
        kind: "Task",
        section: "tasks",
        id: task.id || `${cadence}_${index}`,
        name: `${capitalize(cadence)}: ${task.id || `task_${index + 1}`}`,
        title: `${capitalize(cadence)} · ${task.id || `task_${index + 1}`}`,
        subtitle: `${capitalize(cadence)} ${task.type || "task"}`,
        badges: [cadence, task.type, task.skill || null].filter(Boolean),
        searchText,
        sortKey: `${cadence} ${task.id || index}`.toLowerCase(),
        spoiler: false,
        metrics: [
          { label: "Top tier objective", value: topTier.objective },
          {
            label: "Top tier reward",
            value: topTier.rewardText.replace(/<[^>]*>/g, ""),
          },
        ],
        body: `
          <div class="grid-2">
            <div class="stat-box"><strong>Task type</strong><span>${escapeHtml(task.type || "-")}</span></div>
            <div class="stat-box"><strong>Primary skill</strong><span>${escapeHtml(skillFile.SKILL_LABELS?.[task.skill] || task.skill || "Any")}</span></div>
          </div>
          ${renderEfficiencyTable("Tier rewards", tierRows, ["Tier", "Objective", "Reward"])}
          ${renderDetailBlock("Design note", [
            `${capitalize(cadence)} pool task. Rewards scale by tier thresholds from TaskData.reward_tier(total_level).`,
          ])}
        `,
      };
    });

  return [
    ...makeEntries(dailyPool, "daily"),
    ...makeEntries(weeklyPool, "weekly"),
  ];
}

function buildContractEntries(
  contractPool,
  lockedAreas,
  itemFile,
  monsterFile,
  skillFile,
  adventurerFile,
) {
  const areaReqByName = new Map(
    (lockedAreas || []).map((entry) => [
      entry.region,
      Number(entry.adv_req || 0),
    ]),
  );
  const entries = [];
  for (const [tier, contracts] of Object.entries(contractPool || {})) {
    for (const contract of contracts || []) {
      const type = String(contract.type || "");
      const target = String(contract.target || "");
      const qtyMin = Number(contract.qty_min || 0);
      const qtyMax = Number(contract.qty_max || qtyMin);
      const xp = Number(contract.xp || 0);
      const gold = Number(contract.gold || 0);
      const advReq = Number(
        areaReqByName.get(String(contract.area || "")) || 0,
      );
      const parsedTarget = resolveContractTargetLabel(
        type,
        target,
        itemFile,
        monsterFile,
        skillFile,
        adventurerFile,
      );
      const avgQty = average(qtyMin, qtyMax);
      const avgGoldPerObjective = avgQty > 0 ? gold / avgQty : 0;
      const searchText = [
        contract.id,
        tier,
        contract.label,
        contract.area,
        type,
        target,
        parsedTarget.label,
      ]
        .map(normalizeSearchText)
        .join(" ");

      entries.push({
        kind: "Contract",
        section: "contracts",
        id: String(contract.id || `${tier}_${target}`),
        name: String(contract.label || contract.id || "Contract"),
        title: String(contract.label || contract.id || "Contract"),
        subtitle: `${capitalize(tier)} ${type} contract`,
        badges: [
          tier,
          type,
          contract.area || null,
          advReq > 0 ? `Adv ${advReq}+` : null,
        ].filter(Boolean),
        searchText,
        sortKey: `${tier} ${contract.label || contract.id || ""}`.toLowerCase(),
        spoiler: true,
        metrics: [
          {
            label: "Objective range",
            value: `${formatNumber(qtyMin)}-${formatNumber(qtyMax)}`,
          },
          {
            label: "Reward",
            value: `${formatNumber(xp)} XP · ${formatNumber(gold)} gp`,
          },
          {
            label: "Gold per objective",
            value: `${formatDecimal(avgGoldPerObjective)} gp`,
          },
        ],
        body: `
          <div class="grid-2">
            <div class="stat-box"><strong>Target</strong><span>${escapeHtml(parsedTarget.label)}</span></div>
            <div class="stat-box"><strong>Area gate</strong><span>${advReq > 0 ? `Adventurer ${advReq}+` : "No area gate"}</span></div>
          </div>
          ${renderDetailBlock("Contract details", [
            `Tier: ${capitalize(tier)}`,
            `Type: ${type}`,
            `Target key: ${target || "-"}`,
            `Quantity: ${qtyMin} to ${qtyMax}`,
            `XP reward: ${xp}`,
            `Gold reward: ${gold}`,
            `Near-miss level window: +${Number(adventurerFile.CONTRACT_NEAR_MISS_LEVEL_WINDOW || 0)} levels`,
          ])}
          ${parsedTarget.notes.length ? renderDetailBlock("Target notes", parsedTarget.notes) : ""}
        `,
      });
    }
  }
  return entries;
}

function buildMechanicEntries(
  skillFile,
  monsterFile,
  adventurerFile,
  buildInfoFile,
  itemFile,
) {
  const mechanics = [];
  itemFile = itemFile || {};

  const burnSamples = [
    [1, 1],
    [20, 20],
    [40, 30],
    [60, 40],
    [80, 60],
    [99, 85],
  ].map(([player, recipe]) => ({
    player,
    recipe,
    chance: Math.max(0, 0.5 - (player - recipe) * 0.025),
  }));

  const levelMilestones = [1, 10, 20, 40, 60, 80, 99].map((level) => ({
    level,
    xp: xpForLevel(level),
  }));

  mechanics.push({
    kind: "Mechanic",
    section: "mechanics",
    id: "progression-formulas",
    name: "Progression Formulas",
    title: "Progression Formulas",
    subtitle: "XP, burn chance, and affinity rates",
    badges: ["formula", "progression"],
    searchText:
      "xp for level burn chance affinity rate cooking formula progression",
    sortKey: "mechanics progression formulas",
    spoiler: false,
    metrics: [
      {
        label: "Affinity skills",
        value: formatNumber(
          Object.keys(skillFile.AFFINITY_XPA_PER_SKILL || {}).length,
        ),
      },
      { label: "Burn baseline", value: "50% at equal player/recipe level" },
    ],
    body: `
      ${renderDetailBlock("XP formula", [
        "xp_for_level(level): sums floor(((l + 300 * 2^(l/7)) / 4) * multiplier) for l from 1 to level-1.",
        "Multiplier is 0.8 below 50, 1.0 from 50-79, and 0.7 from 80+.",
      ])}
      ${renderEfficiencyTable("Level milestones", levelMilestones, ["Level", "XP"])}
      ${renderDetailBlock("Cooking burn chance formula", [
        "burn chance = max(0, 0.5 - (player_level - recipe_level) * 0.025)",
      ])}
      ${renderEfficiencyTable("Burn chance samples", burnSamples, ["Player", "Recipe", "Chance"])}
    `,
  });

  const lockedAreas = (adventurerFile.LOCKED_AREAS || []).map((entry) => ({
    region: entry.region,
    advReq: Number(entry.adv_req || 0),
  }));

  mechanics.push({
    kind: "Mechanic",
    section: "mechanics",
    id: "adventurer-gating",
    name: "Adventurer Gating",
    title: "Adventurer Gating",
    subtitle: "Area unlocks and contract leniency",
    badges: ["adventurer", "gating"],
    searchText:
      "adventurer level unlock area shrouded peaks ashen vault void edge contract near miss",
    sortKey: "mechanics adventurer gating",
    spoiler: false,
    metrics: [
      {
        label: "Near-miss window",
        value: `+${Number(adventurerFile.CONTRACT_NEAR_MISS_LEVEL_WINDOW || 0)} levels`,
      },
      { label: "Locked regions", value: `${lockedAreas.length}` },
    ],
    body: `
      ${renderEfficiencyTable("Area unlock requirements", lockedAreas, ["Region", "Adventurer"])}
      ${renderDetailBlock("Contract skill leniency", [
        "Contracts allow targets up to the configured near-miss window above your current level.",
        "This applies to craft and shadow target checks.",
      ])}
    `,
  });

  const streakTiers = (adventurerFile.STREAK_TIERS || [])
    .map((t) => ({
      streak: Number(t.min || 0),
      rank: t.rank ? String(t.rank) : "-",
      "xp bonus": `+${Math.round(Number(t.xp_bonus || 0) * 100)}%`,
      "seal mult": `×${Number(t.seal_mult || 1)}`,
    }))
    .sort((a, b) => a.streak - b.streak);

  mechanics.push({
    kind: "Mechanic",
    section: "mechanics",
    id: "adventurer-streaks",
    name: "Contract Streaks",
    title: "Contract Streaks & Pathfinder Seals",
    subtitle: "Per-slot reward scaling for never rerolling",
    badges: ["adventurer", "streak", "seals"],
    searchText:
      "adventurer contract streak pathfinder seals bronze silver gold trail reroll insurance xp bonus seal multiplier",
    sortKey: "mechanics adventurer streaks",
    spoiler: false,
    metrics: [
      { label: "Max XP bonus", value: "+50% (Pathfinder)" },
      { label: "Max seal mult", value: "×3" },
    ],
    body: `
      ${renderEfficiencyTable("Streak tiers", streakTiers, ["Streak", "Rank", "XP bonus", "Seal mult"])}
      ${renderDetailBlock("How streaks work", [
        "Each contract slot tracks its own streak independently.",
        "Claiming a contract advances that slot's streak by 1; rerolling that slot resets it to 0.",
        "Streak grants bonus Adventurer XP (additive, capped at +50%) and multiplies Pathfinder Seal gain.",
        "Streak Insurance (vendor) shields one reroll from resetting the streak; the gold reroll cost is still paid.",
      ])}
    `,
  });

  const vendorCatalog = (adventurerFile.VENDOR_CATALOG || []).map((e) => ({
    item: String(e.name || e.id || "-"),
    advReq: Number(e.level_req || 1),
    cost: `${Number(e.cost || 0)} seals`,
  }));
  const vendorDetails = (adventurerFile.VENDOR_CATALOG || []).map(
    (e) => `${String(e.name || e.id)} - ${String(e.desc || "")}`,
  );

  mechanics.push({
    kind: "Mechanic",
    section: "mechanics",
    id: "adventurer-vendor",
    name: "Pathfinders' Quartermaster",
    title: "Pathfinders' Quartermaster",
    subtitle: "Spend Pathfinder Seals on gear, boosts, and upgrades",
    badges: ["adventurer", "vendor", "seals"],
    searchText:
      "pathfinders quartermaster vendor pathfinder seals trail rations streak insurance cartographer draught veteran charter trailkeeper knot pathfinder ledger",
    sortKey: "mechanics adventurer vendor",
    spoiler: false,
    metrics: [
      { label: "Currency", value: "Pathfinder Seals" },
      { label: "Items", value: `${vendorCatalog.length}` },
    ],
    body: `
      ${renderEfficiencyTable("Stock (level-gated)", vendorCatalog, ["Item", "Adventurer", "Cost"])}
      ${renderDetailBlock("Item effects", vendorDetails)}
    `,
  });

  const buildVersion = String(buildInfoFile.APP_VERSION || "unknown");
  const buildCode = Number(buildInfoFile.VERSION_CODE || 0);
  const fingerprint = String(buildInfoFile.BUILD_FINGERPRINT || "unknown");

  mechanics.push({
    kind: "Mechanic",
    section: "mechanics",
    id: "live-build",
    name: "Live Build",
    title: "Live Build Metadata",
    subtitle: "Version information used by the client",
    badges: ["build", "release"],
    searchText: `build info version code fingerprint ${buildVersion} ${buildCode} ${fingerprint}`,
    sortKey: "mechanics live build",
    spoiler: false,
    metrics: [
      { label: "Version", value: buildVersion },
      { label: "Version code", value: buildCode > 0 ? String(buildCode) : "-" },
    ],
    body: `
      ${renderDetailBlock("Build fingerprint", [fingerprint])}
      ${renderKeyedTable("Raw build info", [
        ["APP_VERSION", escapeHtml(buildVersion)],
        ["VERSION_CODE", escapeHtml(buildCode > 0 ? String(buildCode) : "-")],
        ["BUILD_FINGERPRINT", escapeHtml(fingerprint)],
      ])}
    `,
  });

  const monsterConstants = [
    ["COMBAT_TICK_SECONDS", monsterFile.COMBAT_TICK_SECONDS],
    ["OFFLINE_SECONDS_CAP", monsterFile.OFFLINE_SECONDS_CAP],
    ["RESPAWN_GOLD_LOSS_PERCENT", monsterFile.RESPAWN_GOLD_LOSS_PERCENT],
    ["RESPAWN_GOLD_LOSS_MIN", monsterFile.RESPAWN_GOLD_LOSS_MIN],
    ["RESPAWN_GOLD_LOSS_MAX", monsterFile.RESPAWN_GOLD_LOSS_MAX],
    ["SELL_PRICE_FACTOR_NUM", monsterFile.SELL_PRICE_FACTOR_NUM],
    ["SELL_PRICE_FACTOR_DEN", monsterFile.SELL_PRICE_FACTOR_DEN],
  ].filter(([, value]) => value !== undefined);

  mechanics.push({
    kind: "Mechanic",
    section: "mechanics",
    id: "economy-and-combat-rules",
    name: "Economy and Combat Rules",
    title: "Economy and Combat Rules",
    subtitle: "Core constants from GameState",
    badges: ["economy", "combat"],
    searchText: "combat tick offline cap respawn gold loss sell factor economy",
    sortKey: "mechanics economy combat rules",
    spoiler: false,
    metrics: [
      {
        label: "Combat tick",
        value: `${formatDecimal(Number(monsterFile.COMBAT_TICK_SECONDS || 0))}s`,
      },
      {
        label: "Offline cap",
        value: `${formatNumber(Number(monsterFile.OFFLINE_SECONDS_CAP || 0) / 3600)} hours`,
      },
    ],
    body: `${renderKeyedTable(
      "GameState constants",
      monsterConstants.map(([key, value]) => [key, escapeHtml(String(value))]),
    )}`,
  });

  const gs = monsterFile || {};
  const pct = (value) => formatPercent(Number(value || 0));
  const num = (value) => formatNumber(Number(value || 0));

  // ── Affinity system ────────────────────────────────────────────────
  // Affinity XP is a flat per-action amount that varies by skill; skills absent
  // from the map (combat, Fracture Arts, Meditation, Adventurer) have no
  // affinity system at all.
  const affinityXpaBySkill = skillFile.AFFINITY_XPA_PER_SKILL || {};
  const affinityXpaRows = Object.entries(affinityXpaBySkill)
    .map(([skillId, xpa]) => [
      skillFile.SKILL_LABELS?.[skillId] || titleizeId(skillId),
      `${formatNumber(Number(xpa))} affinity XP per action`,
    ])
    .sort((left, right) => left[0].localeCompare(right[0]));
  const affinityRows = [
    [
      "All gathering",
      "Action speed",
      `+${pct(gs.GATHERING_AFFINITY_MILESTONE_SPEED_25)} at Aff 25, +${pct(gs.GATHERING_AFFINITY_MILESTONE_SPEED_50)} at Aff 50`,
      `+${pct(Number(gs.GATHERING_AFFINITY_MILESTONE_SPEED_25 || 0) + Number(gs.GATHERING_AFFINITY_MILESTONE_SPEED_50 || 0))}`,
    ],
    [
      "Mining",
      "Prospect (rare ore) chance",
      `+${pct(gs.MINING_AFFINITY_PROSPECT_CHANCE_PER_LEVEL)} / Aff level`,
      pct(gs.MINING_AFFINITY_PROSPECT_CHANCE_MAX),
    ],
    [
      "Woodcutting",
      "Double-yield chance",
      `+${pct(gs.WOODCUTTING_AFFINITY_DOUBLE_YIELD_CHANCE_PER_LEVEL)} / Aff level`,
      pct(gs.WOODCUTTING_AFFINITY_DOUBLE_YIELD_CHANCE_MAX),
    ],
    [
      "Woodcutting",
      "Bark (rare drop) chance",
      `+${pct(gs.WOODCUTTING_AFFINITY_BARK_CHANCE_PER_LEVEL)} / Aff level`,
      pct(gs.WOODCUTTING_AFFINITY_BARK_CHANCE_MAX),
    ],
    [
      "Fishing",
      "Catch success",
      `+${pct(gs.FISHING_AFFINITY_SUCCESS_BONUS_PER_LEVEL)} / Aff level`,
      pct(gs.FISHING_AFFINITY_SUCCESS_BONUS_MAX),
    ],
    [
      "Fishing",
      "Double-catch chance",
      `+${pct(gs.FISHING_AFFINITY_DOUBLE_CATCH_CHANCE_PER_LEVEL)} / Aff level`,
      pct(gs.FISHING_AFFINITY_DOUBLE_CATCH_CHANCE_MAX),
    ],
    [
      "Shard Gleaning",
      "Bonus XP per action",
      `+${num(gs.SPIRIT_AFFINITY_BONUS_XP_25)} at Aff 25, +${num(gs.SPIRIT_AFFINITY_BONUS_XP_50)} at Aff 50`,
      `+${num(gs.SPIRIT_AFFINITY_BONUS_XP_50)} XP`,
    ],
    [
      "Spiritweaving",
      "Shadow bleed",
      `+${pct(gs.SPIRITWEAVING_AFFINITY_SHADOW_BLEED_PER_LEVEL)} / Aff level`,
      pct(gs.SPIRITWEAVING_AFFINITY_SHADOW_BLEED_MAX),
    ],
    [
      "All artisan",
      "Double-output chance",
      `+${pct(gs.ARTISAN_AFFINITY_DOUBLE_OUTPUT_CHANCE_PER_LEVEL)} / Aff level`,
      pct(gs.ARTISAN_AFFINITY_DOUBLE_OUTPUT_CHANCE_MAX),
    ],
    [
      "All artisan",
      "Action speed",
      `+${pct(gs.ARTISAN_AFFINITY_MILESTONE_SPEED_25)} at Aff 25, +${pct(gs.ARTISAN_AFFINITY_MILESTONE_SPEED_50)} at Aff 50`,
      `+${pct(Number(gs.ARTISAN_AFFINITY_MILESTONE_SPEED_25 || 0) + Number(gs.ARTISAN_AFFINITY_MILESTONE_SPEED_50 || 0))}`,
    ],
    [
      "Cooking",
      "Burn-chance reduction",
      `-${pct(gs.COOKING_AFFINITY_BURN_REDUCTION_PER_LEVEL)} / Aff level`,
      pct(gs.COOKING_AFFINITY_BURN_REDUCTION_MAX),
    ],
    [
      "Smithing",
      "Material efficiency",
      `+${pct(gs.SMITHING_AFFINITY_EFFICIENCY_PER_LEVEL)} / Aff level`,
      pct(gs.SMITHING_AFFINITY_EFFICIENCY_MAX),
    ],
    [
      "Wardcraft",
      "Sell-price bonus",
      `+${pct(gs.CRAFTING_AFFINITY_SELL_BONUS_25)} at Aff 25, +${pct(gs.CRAFTING_AFFINITY_SELL_BONUS_50)} at Aff 50`,
      pct(gs.CRAFTING_AFFINITY_SELL_BONUS_50),
    ],
    [
      "Shadow Arts",
      "Steal success",
      `+${pct(gs.SHADOW_AFFINITY_SUCCESS_BONUS_PER_LEVEL)} / Aff level (+${pct(gs.SHADOW_AFFINITY_MILESTONE_SUCCESS_50)} at Aff 50)`,
      pct(gs.SHADOW_AFFINITY_SUCCESS_BONUS_MAX),
    ],
    [
      "Shadow Arts",
      "Cooldown reduction",
      `-${pct(gs.SHADOW_AFFINITY_COOLDOWN_REDUCTION_PER_LEVEL)} / Aff level`,
      pct(gs.SHADOW_AFFINITY_COOLDOWN_REDUCTION_MAX),
    ],
    [
      "Shadow Arts",
      "Stun-chance reduction",
      `-${pct(gs.SHADOW_AFFINITY_STUN_REDUCTION_PER_LEVEL)} / Aff level`,
      pct(gs.SHADOW_AFFINITY_STUN_REDUCTION_MAX),
    ],
  ];

  mechanics.push({
    kind: "Mechanic",
    section: "mechanics",
    id: "affinity-system",
    name: "Affinity System",
    title: "Affinity System",
    subtitle: "Per-action mastery and its bonuses",
    badges: ["affinity", "mastery", "gathering", "artisan"],
    searchText:
      "affinity per action mastery prospect double yield bark catch burn reduction efficiency shadow bleed sell bonus stun cooldown success speed",
    sortKey: "mechanics affinity system",
    spoiler: false,
    metrics: [
      {
        label: "Skills with affinity",
        value: formatNumber(affinityXpaRows.length),
      },
      { label: "Tracked per", value: "Node / recipe / target" },
      { label: "Milestones", value: "Aff 25 & 50" },
    ],
    body: `
      ${renderDetailBlock("How affinity works", [
        "Every gathering node, artisan recipe, and shadow target builds its own Affinity track, earning a flat amount of affinity XP each time you complete that action.",
        "Affinity raises that specific action's bonuses; it is separate from your skill level. Some bonuses scale per affinity level up to a cap; others unlock at the Affinity 25 and 50 milestones.",
        "Affinity uses a much gentler curve than skill levels: roughly 116,000 total XP to affinity 99, against ~9.7M for skill 99.",
        "Skills not listed below (the combat skills, Fracture Arts, Meditation, and Adventurer) have no affinity system.",
      ])}
      ${renderKeyedTable("Affinity XP per action", affinityXpaRows)}
      ${renderSimpleTable("Affinity bonuses by skill", ["Skill", "Bonus", "Scaling", "Cap / best"], affinityRows)}
    `,
  });

  // ── Combat system ──────────────────────────────────────────────────
  const cw = {
    attack: Number(gs.COMBAT_LEVEL_WEIGHT_ATTACK || 0),
    strength: Number(gs.COMBAT_LEVEL_WEIGHT_STRENGTH || 0),
    defence: Number(gs.COMBAT_LEVEL_WEIGHT_DEFENCE || 0),
    hp: Number(gs.COMBAT_LEVEL_WEIGHT_HP || 0),
    magic: Number(gs.COMBAT_LEVEL_WEIGHT_MAGIC || 0),
  };
  const respawnPct = Number(gs.RESPAWN_GOLD_LOSS_PERCENT || 0);
  const respawnMin = Number(gs.RESPAWN_GOLD_LOSS_MIN || 0);
  const respawnMax = Number(gs.RESPAWN_GOLD_LOSS_MAX || 0);

  mechanics.push({
    kind: "Mechanic",
    section: "mechanics",
    id: "combat-system",
    name: "Combat System",
    title: "Combat System",
    subtitle: "Combat level, HP, dual-wield, and death",
    badges: ["combat", "formula"],
    searchText:
      "combat level formula weights attack strength defence hitpoints magic dual wield offhand hp max respawn death gold loss tick",
    sortKey: "mechanics combat system",
    spoiler: false,
    metrics: [
      {
        label: "Combat tick",
        value: `${formatDecimal(Number(gs.COMBAT_TICK_SECONDS || 0))}s`,
      },
      {
        label: "Death gold loss",
        value: `${pct(respawnPct)} (${num(respawnMin)}-${num(respawnMax)})`,
      },
      {
        label: "HP regen",
        value: `every ${formatDecimal(Number(gs.HP_REGEN_INTERVAL_SECONDS || 0))}s`,
      },
    ],
    body: `
      ${renderDetailBlock("Combat level", [
        "combat_level = round(0.3·Attack + 0.3·Strength + 0.3·Defence + 0.2·Hitpoints + 0.15·Fracture Arts), minimum 1.",
      ])}
      ${renderSimpleTable(
        "Combat level weights",
        ["Skill", "Weight"],
        [
          ["Attack", cw.attack],
          ["Strength", cw.strength],
          ["Defence", cw.defence],
          ["Hitpoints", cw.hp],
          ["Fracture Arts (Magic)", cw.magic],
        ],
      )}
      ${renderDetailBlock("Hitpoints & regen", [
        `Max HP = max(${num(gs.MIN_STARTING_HP_LEVEL)}, Hitpoints level + floor(equipped Defence bonus × 0.5)).`,
        `Out of combat, HP regenerates one point every ${formatDecimal(Number(gs.HP_REGEN_INTERVAL_SECONDS || 0))} seconds.`,
        `Combat resolves one tick every ${formatDecimal(Number(gs.COMBAT_TICK_SECONDS || 0))} seconds.`,
      ])}
      ${renderDetailBlock("Dual wield", [
        `Off-hand weapon stats apply at ${pct(gs.DUAL_WIELD_OFFHAND_STAT_FACTOR_BASE)} effectiveness, scaling up to ${pct(gs.DUAL_WIELD_OFFHAND_STAT_FACTOR_MAX)} as the relevant skill grows.`,
        "Blades grant Attack/Strength only; staves grant Fracture Arts (Magic) only.",
      ])}
      ${renderDetailBlock("Death penalty", [
        `On defeat you lose ${pct(respawnPct)} of carried gold, clamped between ${num(respawnMin)} and ${num(respawnMax)} gp.`,
      ])}
    `,
  });

  // -- Damage reduction --------------------------------------------
  // Gear DR, the Scar-Ward Draught, and the defence-penetrating attacks that
  // read them. The DR table is keyed by item id in ItemData, so this stays
  // correct as pieces are added without touching this renderer.
  const drItems = Object.entries(itemFile._MASTERY_FLAT_DMG_REDUCTION || {})
    .map(([itemId, value]) => ({
      itemId,
      name: (itemFile.ITEMS || {})[itemId]?.name || titleizeId(itemId),
      slot: (itemFile.ITEMS || {})[itemId]?.slot || "-",
      dr: Number(value || 0),
    }))
    .sort((left, right) => right.dr - left.dr || left.name.localeCompare(right.name));

  if (drItems.length) {
    const gearMax = drItems.reduce((sum, row) => sum + row.dr, 0);
    const wardDr = Number(gs.SCAR_WARD_DR || 0);
    const wardMinutes = Math.round(Number(gs.SCAR_WARD_SECONDS || 0) / 60);

    mechanics.push({
      kind: "Mechanic",
      section: "mechanics",
      id: "damage-reduction",
      name: "Damage Reduction",
      title: "Damage Reduction & Penetrating Attacks",
      subtitle: "The one stat that answers a hit your defence cannot",
      badges: ["combat", "defence", "endgame"],
      searchText:
        "damage reduction dr gear percent scar ward draught penetrating attack defence penetrating index echo death ward warden permafrost unwritten bulwark null seal fracture scar final compilation cap",
      sortKey: "mechanics damage reduction",
      spoiler: true,
      metrics: [
        { label: "Pieces with DR", value: String(drItems.length) },
        { label: "Draught", value: `${pct(wardDr)} for ${wardMinutes} min` },
        { label: "Hard cap", value: "90%" },
      ],
      body: `
        ${renderDetailBlock("What it is", [
          "Damage reduction is a flat percentage taken off every hit you receive, applied after your defence has already done its work. It comes from two places only: gear that carries a DR value, and the Scar-Ward Draught.",
          `Gear DR and the draught add together and are then clamped at 90%. Wearing every DR piece at once totals ${pct(gearMax)} before the draught.`,
        ])}
        ${renderSimpleTable(
          "Gear that carries damage reduction",
          ["Item", "Slot", "Damage reduction"],
          drItems.map((row) => [row.name, titleizeId(row.slot), pct(row.dr)]),
        )}
        ${renderDetailBlock("Scar-Ward Draught", [
          `Drunk from the Inventory. Grants ${pct(wardDr)} damage reduction for ${wardMinutes} minutes, on top of whatever your gear already provides.`,
          "Bought from the Store with gold and materials once the Frostmere arc has opened it. Its sell-back price is capped at its discounted buy price, so it can never be traded at a profit.",
        ])}
        ${renderDetailBlock("Penetrating attacks", [
          "The Fracture Scar's final boss phase, Final Compilation, uses defence-penetrating attacks. They ignore your Defence level and the Fracture Tonic entirely: damage reduction is the only thing that reduces them.",
          "That is the whole reason the DR gear exists. A character in full endgame gear with no DR takes a penetrating hit at full value.",
        ])}
        ${renderDetailBlock("Index Echo", [
          `A separate death ward, not damage reduction. Armed deliberately from the Inventory, ${num(gs.INDEX_ECHO_MAX_CHARGES)} charge at a time.`,
          "The next blow that would kill you instead leaves you at 1 HP and ends the fight. It does not trigger automatically from your bag, and it deliberately does nothing inside boss dungeons - a failed dungeon run is still a failed run.",
        ])}
      `,
    });
  }

  // ── Mastery store ──────────────────────────────────────────────────
  const masteryStore = (gs.MASTERY_STORE_DEFS || []).map((entry) => [
    String(entry.skill_id || "")
      .replace(/_/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase()),
    `Lv ${num(entry.level_required)}`,
    String(entry.summary || ""),
  ]);

  if (masteryStore.length) {
    mechanics.push({
      kind: "Mechanic",
      section: "mechanics",
      id: "mastery-store",
      name: "Mastery Store",
      title: "Mastery Store",
      subtitle: "Level-99 capstone rewards per skill",
      badges: ["mastery", "endgame", "rewards"],
      searchText: `mastery store capstone level 99 reward ${(gs.MASTERY_STORE_DEFS || []).map((entry) => `${entry.skill_id} ${entry.summary}`).join(" ")}`,
      sortKey: "mechanics mastery store",
      spoiler: false,
      metrics: [
        { label: "Rewards", value: String(masteryStore.length) },
        { label: "Unlock", value: "Skill level 99" },
      ],
      body: `
        ${renderDetailBlock("How it works", [
          "Reaching level 99 in a skill unlocks that skill's signature Mastery Store item, a permanent capstone reward.",
        ])}
        ${renderSimpleTable("Capstone rewards", ["Skill", "Requires", "Effect"], masteryStore)}
      `,
    });
  }

  // ── Gathering tools ────────────────────────────────────────────────
  const toolDefs = gs.GATHERING_TOOL_DEFS || {};
  const toolSkills = Object.keys(toolDefs);
  if (toolSkills.length) {
    const toolBody = toolSkills
      .map((skillId) => {
        const label =
          skillFile.SKILL_LABELS?.[skillId] || capitalize(skillId);
        const rows = (toolDefs[skillId] || []).map((tool) => [
          tool.name || tool.item_id,
          `${formatPercent(Math.max(0, Number(tool.speed_multiplier || 1) - 1))} faster`,
          tool.is_starting ? "Starting tool" : "Upgrade",
        ]);
        return renderSimpleTable(`${label} tools`, ["Tool", "Speed", "Source"], rows, {
          open: false,
        });
      })
      .join("");

    mechanics.push({
      kind: "Mechanic",
      section: "mechanics",
      id: "gathering-tools",
      name: "Gathering Tools",
      title: "Gathering Tools",
      subtitle: "Tool tiers and their speed bonuses",
      badges: ["gathering", "tools", "mining", "fishing", "woodcutting"],
      searchText: `gathering tools pickaxe axe rod speed multiplier ${toolSkills.join(" ")}`,
      sortKey: "mechanics gathering tools",
      spoiler: false,
      metrics: [
        { label: "Tool lines", value: String(toolSkills.length) },
        {
          label: "Top speed",
          value: `${formatPercent(
            Math.max(
              0,
              ...toolSkills.flatMap((skillId) =>
                (toolDefs[skillId] || []).map(
                  (tool) => Number(tool.speed_multiplier || 1) - 1,
                ),
              ),
            ),
          )} faster`,
        },
      ],
      body: `
        ${renderDetailBlock("How tools work", [
          "Each gathering skill has a ladder of tools. Equipping a better tool multiplies your action speed; the listed value is the speed gain over the basic starting tool.",
        ])}
        ${toolBody}
      `,
    });
  }

  // ── Worldroot (relic fusion) ───────────────────────────────────────
  const upgradeRecipes = itemFile.UPGRADE_RECIPES || {};
  const itemsById = itemFile.ITEMS || {};
  const itemName = (id) =>
    itemsById[id]?.name || capitalize(String(id).replace(/_/g, " "));
  const worldrootIds = Object.keys(upgradeRecipes);
  if (worldrootIds.length) {
    const worldrootRows = worldrootIds.map((resultId) => {
      const recipe = upgradeRecipes[resultId] || {};
      const ingredients = recipe.ingredients || {};
      const ingText = Object.entries(ingredients)
        .map(([id, qty]) => `${formatNumber(Number(qty || 0))}× ${itemName(id)}`)
        .join(", ");
      return [itemName(resultId), ingText, String(recipe.description || "")];
    });
    mechanics.push({
      kind: "Mechanic",
      section: "mechanics",
      id: "worldroot-fusion",
      name: "Worldroot",
      title: "Worldroot: Relic Fusion",
      subtitle: "Fuse item clusters into powerful relics",
      badges: ["worldroot", "fusion", "relics", "endgame"],
      searchText: `worldroot fusion fuse relic upgrade recipe forge ${worldrootIds
        .map((id) => `${id} ${itemName(id)}`)
        .join(" ")}`,
      sortKey: "mechanics worldroot",
      spoiler: false,
      metrics: [
        { label: "Fusions", value: String(worldrootIds.length) },
        { label: "Where", value: "Worldroot menu" },
      ],
      body: `
        ${renderDetailBlock("How Worldroot works", [
          "Worldroot is a dedicated menu screen. Each recipe is laid out as a tree: the fused relic at the top, its ingredient items rooted below with a live count of how many you own versus how many you need.",
          "When you hold every ingredient, a Forge button consumes them and produces the relic with a celebration. Fusion now lives entirely in Worldroot; the old per-item Upgrade button in the inventory is gone.",
          "Forged relics count toward your Compendium item collection.",
        ])}
        ${renderSimpleTable("Fusion recipes", ["Relic", "Ingredients", "Fusion"], worldrootRows)}
      `,
    });
  }

  // ── Compendium ─────────────────────────────────────────────────────
  mechanics.push({
    kind: "Mechanic",
    section: "mechanics",
    id: "compendium",
    name: "Compendium",
    title: "Compendium: Completion Tracker",
    subtitle: "Every collectible and milestone in one place",
    badges: ["compendium", "completion", "collection"],
    searchText:
      "compendium completion tracker 100 percent collection items titles factions quests dungeons loot",
    sortKey: "mechanics compendium",
    spoiler: false,
    metrics: [
      { label: "Goal", value: "100% completion" },
      { label: "Where", value: "Compendium menu" },
    ],
    body: `
      ${renderDetailBlock("What it tracks", [
        "The Compendium is a 100%-completion panel that aggregates every collectible and progression category into one place: items collected, titles earned, faction reputation, quests completed, boss dungeon loot tables, and more.",
        "Each category shows your progress (e.g. owned / total) so you can see at a glance what is left to chase. Boss dungeon loot tables and Worldroot-forged relics both register toward their respective counts.",
      ])}
    `,
  });

  // ── Fracture Arts spellbook ────────────────────────────────────────
  // Spells carry their own combat tuning (power / accuracy / element) as of
  // 1.0.9. Before that every spell rolled the same damage and only the sigil
  // cost differed, so the per-spell numbers are worth surfacing here.
  const spellNodes = skillFile.GATHERING_NODES?.magic || [];
  const elementLabels = skillFile.SPELL_ELEMENT_LABELS || {};
  if (spellNodes.length) {
    const spellItems = itemFile.ITEMS || {};
    const spellRows = spellNodes.map((spell) => {
      const sigils = Object.entries(spell.requires || {});
      const sigilCount = sigils.reduce(
        (sum, [, qty]) => sum + Number(qty || 0),
        0,
      );
      const power = Number(spell.power || 1);
      const elementId = String(spell.element || "");
      return [
        spell.name || spell.id,
        Number(spell.level || 0),
        elementLabels[elementId] || titleizeId(elementId),
        `${formatDecimal(power)}x`,
        Number(spell.accuracy || 0) === 0
          ? "baseline"
          : `${Number(spell.accuracy) > 0 ? "+" : ""}${pct(spell.accuracy)}`,
        sigils
          .map(([id, qty]) => `${spellItems[id]?.name || titleizeId(id)} x${qty}`)
          .join(", ") || "-",
        sigilCount > 0 ? formatDecimal(power / sigilCount) : "-",
        `${formatNumber(Number(spell.xp_per_action || 0))} XP / ${formatDecimal(Number(spell.seconds_per_action || 0))}s`,
      ];
    });
    const topSpell = spellNodes[spellNodes.length - 1];
    mechanics.push({
      kind: "Mechanic",
      section: "mechanics",
      id: "fracture-arts-spellbook",
      name: "Fracture Arts Spellbook",
      title: "Fracture Arts Spellbook",
      subtitle: "Per-spell damage, hit chance, and sigil efficiency",
      badges: ["spells", "fracture arts", "combat", "sigils"],
      searchText:
        "spellbook spell power damage multiplier accuracy hit chance element sigil cost rune per sigil pale flicker architects unmaking fracture arts magic casting",
      sortKey: "mechanics fracture arts spellbook",
      spoiler: false,
      metrics: [
        { label: "Spells", value: formatNumber(spellNodes.length) },
        {
          label: "Top-tier power",
          value: `${formatDecimal(Number(topSpell?.power || 1))}x baseline`,
        },
      ],
      body: `
        ${renderDetailBlock("How spell damage works", [
          "Your Fracture Arts level and your MAG gear set the base damage range and hit chance. The spell you cast then scales both: Power multiplies the damage range, and the accuracy modifier is added to your hit chance before clamping.",
          "Pale Flicker sits at 1.00x, the baseline the game used for every spell before spells were given their own strength, so it is unchanged.",
          "Power climbs faster than sigil cost in raw damage but slower per sigil spent. That is the deliberate trade: the late spells buy kill speed (and so XP per hour and food saved) with reagent throughput, while the cheap 1-sigil spells stay the efficient choice for long grinding sessions.",
          "In game, the 'i' button beside the Spell dropdown in Combat opens the same listing with your live numbers: damage range, hit chance against your selected monster, casts your current sigil stock affords, and how long that stock lasts.",
        ])}
        ${renderSimpleTable(
          "Every spell",
          [
            "Spell",
            "Level",
            "Element",
            "Power",
            "Hit chance",
            "Sigil cost",
            "Power / sigil",
            "Cast XP",
          ],
          spellRows,
        )}
        ${renderDetailBlock("Notes", [
          "Several spells are also gated behind a quest in addition to the level requirement; the Fracture Arts skill page lists which.",
          "Elements are carried on every spell for a planned elemental rework. They currently have no damage effect of their own.",
        ])}
      `,
    });
  }

  // ── Boosts & rewarded ads ──────────────────────────────────────────
  const offlineCapHours = Number(gs.OFFLINE_SECONDS_CAP || 0) / 3600;
  mechanics.push({
    kind: "Mechanic",
    section: "mechanics",
    id: "boosts-and-ads",
    name: "Boosts & Rewarded Ads",
    title: "Boosts & Rewarded Ads",
    subtitle: "Optional time-savers, ad-gated or unlocked by the Warden's Mark",
    badges: ["boosts", "ads", "fracture surge", "auto-meditate"],
    searchText:
      "boost rewarded ad fracture surge auto meditate extended offline cap wardens mark premium double speed",
    sortKey: "mechanics boosts ads",
    spoiler: false,
    metrics: [
      { label: "Base offline cap", value: `${formatNumber(offlineCapHours)} hours` },
      { label: "Warden's Mark", value: "Always on, no ads" },
    ],
    body: `
      ${renderSimpleTable(
        "Available boosts",
        ["Boost", "Effect", "Where"],
        [
          [
            "Fracture Surge",
            "2x speed for all timed activities (gathering, artisan, Shadow Arts) for 1 hour. Stack up to 4 ads for 4 hours. XP and affinity XP double as a result.",
            "Skills screen",
          ],
          [
            "Auto-Meditate",
            "Meditates automatically every cooldown for 4 hours, even while doing other activities.",
            "Meditation screen",
          ],
          [
            "Extended Offline Cap",
            `Adds 4 hours to your offline cap for 12 hours, up to ${formatNumber(offlineCapHours + 4)} hours of offline progress.`,
            "Store",
          ],
        ],
      )}
      ${renderDetailBlock("Warden's Mark", [
        "Owners of the Warden's Mark have all three boosts permanently active, with no ads and no button presses. Auto-Meditate runs continuously, Fracture Surge holds 2x speed at all times, and the +4h offline cap extension is always in effect.",
        "The durations in the table above are the rewarded-ad durations, which is what non-owners get. For owners they do not apply; the boosts never expire and never need re-activating.",
        "The offline progress cap still applies to Auto-Meditate for owners, so a long absence credits only up to the capped window, exactly as before.",
        "Non-owners are unaffected: rewarded ad boosts work exactly as they always have. When an ad genuinely cannot load, the boost button explains why and offers Warden's Mark activation instead of failing silently.",
      ])}
    `,
  });

  // ── Store & Warden's Mark ──────────────────────────────────────────
  mechanics.push({
    kind: "Mechanic",
    section: "mechanics",
    id: "store-wardens-mark",
    name: "Store & Warden's Mark",
    title: "Store & Warden's Mark",
    subtitle: "Free starter gear and the one-time premium unlock",
    badges: ["store", "wardens mark", "purchase"],
    searchText:
      "store google play purchase wardens mark premium starter tools pickaxe axe rod free iap in-app",
    sortKey: "mechanics store wardens mark",
    spoiler: false,
    metrics: [
      { label: "Premium", value: "Warden's Mark (one-time)" },
      { label: "Free", value: "Starter gathering tools" },
    ],
    body: `
      ${renderDetailBlock("The Store", [
        "Starter gathering tools (pickaxe, axe, and rod) are free to claim directly from the Store. (The old step-by-step mining tutorial has been removed.)",
        "The Extended Offline Cap ad boost is also activated here.",
      ])}
      ${renderDetailBlock("Warden's Mark", [
        "A one-time Google Play purchase that permanently unlocks all ad-gated benefits. Fracture Surge, Auto-Meditate, and Extended Cap are simply always on for owners. No ads, no activation taps, no expiry.",
        "Ownership follows your Google Play account and is restored automatically across devices. A refunded purchase is revoked on the next Play check; re-purchasing restores it immediately.",
      ])}
    `,
  });

  // ── Hardcore auto-eat ──────────────────────────────────────────────
  const stdThresholds = gs.STANDARD_AUTO_EAT_THRESHOLDS || [];
  const hcBands = gs.HC_AUTO_EAT_BANDS || [];
  if (hcBands.length) {
    const hcRows = hcBands.map((band, idx) => [
      `${idx + 1} clear${idx === 0 ? "" : "s"}`,
      (band || []).map((t) => `<${formatPercent(Number(t))}`).join(" / "),
    ]);
    mechanics.push({
      kind: "Mechanic",
      section: "mechanics",
      id: "hardcore-auto-eat",
      name: "Hardcore & Auto-Eat",
      title: "Hardcore & Auto-Eat",
      subtitle: "How auto-eat is earned in Hardcore mode",
      badges: ["hardcore", "auto-eat", "combat", "death"],
      searchText:
        "hardcore auto eat threshold boss dungeon first clear manual eat death permadeath standard",
      sortKey: "mechanics hardcore auto eat",
      spoiler: false,
      metrics: [
        {
          label: "Standard thresholds",
          value: stdThresholds.length
            ? `${formatPercent(Number(stdThresholds[0]))}-${formatPercent(Number(stdThresholds[stdThresholds.length - 1]))}`
            : "All",
        },
        { label: "Hardcore unlock", value: "Boss dungeon first clears" },
      ],
      body: `
        ${renderDetailBlock("Standard vs Hardcore", [
          "Standard characters have every auto-eat threshold available, and combat / Shadow Arts auto-stop when food runs out.",
          "Hardcore characters earn auto-eat through boss dungeon first clears; with no clears, auto-eat is fully locked. Hardcore combat does not auto-stop when food runs out; you can die, including while offline. Death is permanent (delete or roll over to Standard).",
          "Both modes have a manual Eat button in combat and Shadow Arts that consumes one serving of your selected food immediately, regardless of threshold or gating.",
        ])}
        ${renderSimpleTable(
          "Hardcore auto-eat unlocks",
          ["Boss dungeon first clears", "Thresholds unlocked"],
          hcRows,
        )}
      `,
    });
  }

  return mechanics;
}

function resolveContractTargetLabel(
  type,
  target,
  itemFile,
  monsterFile,
  skillFile,
  adventurerFile,
) {
  const notes = [];
  if (type === "kill") {
    const monster = monsterFile._monster_defs_data?.[target];
    return {
      label: monster?.name || target || "Unknown monster",
      notes: monster
        ? [
            `Region: ${monster.region || "Unknown"}`,
            `Combat level: ${monsterCombatLevel(monster)}`,
          ]
        : notes,
    };
  }
  if (type === "gather") {
    return {
      label:
        skillFile.SKILL_LABELS?.[target] || capitalize(target || "gathering"),
      notes,
    };
  }
  if (type === "steal") {
    if (target.startsWith("shadow_arts:")) {
      const targetId = target.split(":", 2)[1] || "";
      const req = Number(
        adventurerFile.SHADOW_TARGET_LEVEL_REQUIREMENTS?.[targetId] || 0,
      );
      return {
        label: capitalize(targetId.replace(/_/g, " ")),
        notes: req > 0 ? [`Shadow Arts requirement: ${req}`] : notes,
      };
    }
    return { label: "Shadow Arts", notes };
  }
  if (type === "craft" && target.includes(":")) {
    const [skillId, recipeId] = target.split(":", 2);
    const recipe = findRecipeById(skillFile, skillId, recipeId);
    if (recipe) {
      const outputId = recipe.produces || recipe.item_yield || recipe.id;
      const outputName = itemFile.ITEMS?.[outputId]?.name || outputId;
      return {
        label: `${skillFile.SKILL_LABELS?.[skillId] || capitalize(skillId)}: ${outputName}`,
        notes: [`Recipe level: ${Number(recipe.level || 1)}`],
      };
    }
    return { label: `${skillId}: ${recipeId}`, notes };
  }
  if (type === "dungeon_clear") {
    return { label: capitalize((target || "").replace(/_/g, " ")), notes };
  }
  return { label: target || "General", notes };
}

function findRecipeById(skillFile, skillId, recipeId) {
  const base = skillFile.ARTISAN_RECIPES?.[skillId] || [];
  for (const recipe of base) {
    if (recipe.id === recipeId) {
      return recipe;
    }
  }
  return null;
}

function xpForLevel(level) {
  if (level <= 1) {
    return 0;
  }
  let total = 0;
  for (let l = 1; l < level; l += 1) {
    const base = Math.floor((l + 300 * Math.pow(2, l / 7)) / 4);
    const mult = l < 50 ? 0.8 : l >= 80 ? 0.7 : 1.0;
    total += Math.floor(base * mult);
  }
  return total;
}

function buildEfficiencyRows({
  itemFile,
  skillFile,
  monsters,
  playerCombatProfile,
}) {
  const rows = [];
  const items = itemFile.ITEMS || {};
  const itemPrices = itemFile.PRICE_BY_ID || {};
  for (const [skill, nodes] of Object.entries(
    skillFile.GATHERING_NODES || {},
  )) {
    for (const node of nodes || []) {
      const itemPrice = effectivePriceWithSellBonus(
        Number(itemPrices[node.item_yield] || 0),
        playerCombatProfile,
      );
      const actionsPerHour = 3600 / Number(node.seconds_per_action || 1);
      const baseXpPerHour = Number(node.xp_per_action || 0) * actionsPerHour;
      const xpPerHour = applySkillXpBonus(
        playerCombatProfile,
        skill,
        baseXpPerHour,
      );
      rows.push({
        kind: "Gathering",
        name: node.name || node.id,
        skill,
        level: Number(node.level || 0),
        xpPerHour,
        gpPerHour: itemPrice * actionsPerHour,
        gpPerXp: xpPerHour > 0 ? (itemPrice * actionsPerHour) / xpPerHour : 0,
        note: items[node.item_yield]?.name || node.item_yield,
      });
    }
  }
  for (const [skill, recipes] of Object.entries(
    skillFile.ARTISAN_RECIPES || {},
  )) {
    for (const recipe of recipes || []) {
      const outputId = recipe.produces || recipe.item_yield || recipe.id;
      const outputPrice = effectivePriceWithSellBonus(
        Number(itemPrices[outputId] || 0),
        playerCombatProfile,
      );
      const inputCost = Object.entries(recipe.requires || {}).reduce(
        (sum, [itemId, count]) =>
          sum +
          effectivePriceWithSellBonus(
            Number(itemPrices[itemId] || 0),
            playerCombatProfile,
          ) *
            Number(count || 0),
        0,
      );
      const profitPerAction = outputPrice - inputCost;
      const actionsPerHour = 3600 / Number(recipe.seconds || 1);
      const baseXpPerHour = Number(recipe.xp_per_action || 0) * actionsPerHour;
      const xpPerHour = applySkillXpBonus(
        playerCombatProfile,
        skill,
        baseXpPerHour,
      );
      rows.push({
        kind: "Artisan",
        name: recipe.name || recipe.id || outputId,
        skill,
        level: Number(recipe.level || 0),
        xpPerHour,
        gpPerHour: profitPerAction * actionsPerHour,
        gpPerXp:
          xpPerHour > 0 ? (profitPerAction * actionsPerHour) / xpPerHour : 0,
        note: items[outputId]?.name || outputId,
      });
    }
  }
  for (const [monsterId, monster] of Object.entries(monsters || {})) {
    const baseAvgGold = average(
      Number(monster.gold_min || 0),
      Number(monster.gold_max || 0),
    );
    const avgGold =
      baseAvgGold *
      (1 + Number(playerCombatProfile?.combatGoldBonusPct || 0) / 100);
    const lootValue = (monster.drops || []).reduce((sum, drop) => {
      const itemPrice = effectivePriceWithSellBonus(
        Number(itemPrices[drop.item] || 0),
        playerCombatProfile,
      );
      const avgQty = average(
        Number(drop.qty_min || 1),
        Number(drop.qty_max || 1),
      );
      const chance = adjustedMonsterDropChance(
        String(drop.item || ""),
        Number(drop.chance || 0),
        itemFile,
        playerCombatProfile,
      );
      return sum + itemPrice * avgQty * chance;
    }, 0);
    const totalXp = combatXpPerKillWithBonuses(
      Number(monster.hp || 1),
      String(playerCombatProfile?.combatStyle || "balanced"),
      playerCombatProfile,
    );
    const estimatedKillsPerHour = estimateMonsterKillsPerHour(
      monster,
      playerCombatProfile,
    );
    rows.push({
      kind: "Monster",
      name: monster.name || monsterId,
      skill: monster.region || "Combat",
      level: monsterCombatLevel(monster),
      xpPerHour: totalXp * estimatedKillsPerHour,
      gpPerHour: (avgGold + lootValue) * estimatedKillsPerHour,
      gpPerXp: totalXp > 0 ? (avgGold + lootValue) / totalXp : 0,
      note: monster.region || "",
    });
  }
  return rows;
}

function render() {
  const model = state.model;
  if (!model) {
    return;
  }
  dom.countTotal.textContent = formatNumber(model.entries.length);
  dom.summaryGrid.innerHTML = model.summary
    .map(
      (entry) => `
    <div class="metric-pill">
      <strong>${formatNumber(entry.count)}</strong>
      <span>${escapeHtml(entry.label)}</span>
    </div>
  `,
    )
    .join("");

  populateCategories();
  renderLeaderboards(model.boardRows);
  renderCalculators(model);

  const matches = model.entries.filter((entry) => {
    const categoryMatches =
      state.category === "all" || entry.section === state.category;
    const searchMatches =
      !state.search || entry.searchText.includes(state.search);
    return categoryMatches && searchMatches;
  });

  const grouped = groupBy(matches, (entry) => entry.section);
  dom.content.innerHTML =
    SECTION_ORDER.map(([sectionKey, sectionLabel]) => {
      const entries = grouped.get(sectionKey) || [];
      if (entries.length === 0) {
        return "";
      }
      const lore = SECTION_LORE[sectionKey];
      return `
      <section class="section" id="section-${escapeHtml(sectionKey)}">
        <div class="section-head">
          <div class="section-head-text">
            <h2>${escapeHtml(sectionLabel)}</h2>
            ${lore ? `<p class="section-lore">${escapeHtml(lore)}</p>` : ""}
          </div>
          <p class="section-count">${formatNumber(entries.length)} entr${entries.length === 1 ? "y" : "ies"}</p>
        </div>
        <div class="list-stack">
          ${entries.map((entry, index) => renderCard(entry, index)).join("")}
        </div>
      </section>
    `;
    }).join("") ||
    `<article class="card"><h3 class="card-title">No matches</h3><p class="muted">Try broadening the search or switching to another category.</p></article>`;

  applyPlannerTabState();
}

function renderLeaderboards(rows) {
  const topXp = [...rows]
    .sort((left, right) => right.xpPerHour - left.xpPerHour)
    .slice(0, 5);
  const topGp = [...rows]
    .sort((left, right) => right.gpPerHour - left.gpPerHour)
    .slice(0, 5);
  const topRatio = [...rows]
    .filter((row) => Number.isFinite(row.gpPerXp))
    .sort((left, right) => right.gpPerXp - left.gpPerXp)
    .slice(0, 5);
  dom.bestXp.innerHTML = renderBoard(
    topXp,
    (row) => `${formatNumber(row.xpPerHour)} XP/hr`,
    (row) =>
      `${escapeHtml(row.kind)} · ${escapeHtml(row.skill)} · ${escapeHtml(row.note || "")}`,
  );
  dom.bestGp.innerHTML = renderBoard(
    topGp,
    (row) => `${formatNumber(row.gpPerHour)} gp/hr`,
    (row) =>
      `${escapeHtml(row.kind)} · ${escapeHtml(row.skill)} · ${escapeHtml(row.note || "")}`,
  );
  dom.bestRatio.innerHTML = renderBoard(
    topRatio,
    (row) => formatDecimal(row.gpPerXp),
    (row) =>
      `${escapeHtml(row.kind)} · ${escapeHtml(row.skill)} · ${escapeHtml(row.note || "")}`,
  );
}

function renderBoard(rows, valueFn, subtitleFn) {
  if (!rows.length) {
    return `<p class="muted">No rows available.</p>`;
  }
  return `<div class="board-list">${rows
    .map(
      (row) => `
    <div class="board-row">
      <div>
        <strong>${escapeHtml(row.name)}</strong>
        <span>${subtitleFn(row)}</span>
      </div>
      <div>${valueFn(row)}</div>
    </div>
  `,
    )
    .join("")}</div>`;
}

function renderCalculators(model) {
  renderXpPlanner(model);
  renderDropPlanner(model);
  renderAffordPlanner(model);
  renderRoutePlanner(model);
  renderComparePlanner(model);
  renderBuildPlanner(model);
  renderUpgradeSimulator(model);
  renderFarmRoutePlanner(model);
  renderDiagnostics(model);
  updateUrlState();
}

function renderXpPlanner(model) {
  if (!dom.xpPlannerOutput) {
    return;
  }

  const currentLevel = clampNumber(state.xpCurrentLevel, 1, SKILL_LEVEL_CAP, 1);
  const targetLevel = clampNumber(state.xpTargetLevel, 1, SKILL_LEVEL_CAP, 50);
  const normalizedTarget = Math.max(currentLevel, targetLevel);
  const xpRate = Math.max(1, clampNumber(state.xpRate, 1, 1000000000, 25000));
  const currentXp = xpForLevel(currentLevel);
  const targetXp = xpForLevel(normalizedTarget);
  const xpNeeded = Math.max(0, targetXp - currentXp);
  const hours = xpNeeded / xpRate;

  const xpCandidates = [...(model?.boardRows || [])]
    .filter((row) => Number(row.xpPerHour || 0) > 0)
    .sort(
      (left, right) =>
        Number(right.xpPerHour || 0) - Number(left.xpPerHour || 0),
    );
  const suggested = xpCandidates[0] || null;

  dom.xpPlannerOutput.innerHTML = [
    plannerRow("Current level XP", `${formatNumber(currentXp)} XP`),
    plannerRow("Target level XP", `${formatNumber(targetXp)} XP`),
    plannerRow("XP needed", `${formatNumber(xpNeeded)} XP`),
    plannerRow("Estimated time", formatDuration(hours)),
    plannerRow(
      "Fastest known activity",
      suggested
        ? `${suggested.name} · ${formatNumber(suggested.xpPerHour)} XP/hr`
        : "No activity data",
    ),
  ].join("");

  if (dom.xpCurrentLevel) dom.xpCurrentLevel.value = String(currentLevel);
  if (dom.xpTargetLevel) dom.xpTargetLevel.value = String(normalizedTarget);
  if (dom.xpRate) dom.xpRate.value = String(Math.round(xpRate));
  state.xpCurrentLevel = currentLevel;
  state.xpTargetLevel = normalizedTarget;
  state.xpRate = xpRate;
}

function renderDropPlanner(model) {
  if (!dom.dropPlannerOutput) {
    return;
  }

  const monster = model?.monsters?.[state.dropMonsterId] || null;
  const kills = Math.max(1, clampNumber(state.dropKills, 1, 1000000, 100));
  if (dom.dropKills) dom.dropKills.value = String(kills);
  state.dropKills = kills;

  if (!monster) {
    dom.dropPlannerOutput.innerHTML = plannerRow("Status", "Select a monster");
    return;
  }

  const drop =
    (monster.drops || []).find(
      (entry) => String(entry.item || "") === state.dropItemId,
    ) || null;
  if (!drop) {
    dom.dropPlannerOutput.innerHTML = plannerRow("Status", "No drop selected");
    return;
  }

  const profile = getPlayerCombatProfile();
  const chance = adjustedMonsterDropChance(
    state.dropItemId,
    Number(drop.chance || 0),
    model?.itemFile || {},
    profile,
  );
  const chanceAtLeastOne = 1 - Math.pow(1 - chance, kills);
  const avgQty = average(Number(drop.qty_min || 1), Number(drop.qty_max || 1));
  const expectedCount = kills * chance * avgQty;
  const expectedPerKill = chance * avgQty;
  const targetQty = Math.max(
    1,
    clampNumber(state.dropTargetQty, 1, 1000000, 10),
  );
  const killsPerHour = Math.max(
    1,
    clampNumber(state.dropKillRate, 1, 1000000, 80),
  );
  const expectedKillsForTarget =
    expectedPerKill > 0
      ? Math.ceil(targetQty / expectedPerKill)
      : Number.POSITIVE_INFINITY;
  const expectedHoursForTarget = Number.isFinite(expectedKillsForTarget)
    ? expectedKillsForTarget / killsPerHour
    : Number.POSITIVE_INFINITY;
  const killsFor50 = killsToReachChance(chance, 0.5);
  const killsFor90 = killsToReachChance(chance, 0.9);
  const itemPrice = effectivePriceWithSellBonus(
    Number(model?.itemFile?.PRICE_BY_ID?.[state.dropItemId] || 0),
    profile,
  );
  const expectedValue = expectedCount * itemPrice;
  const itemName =
    model?.itemFile?.ITEMS?.[state.dropItemId]?.name || state.dropItemId;

  dom.dropPlannerOutput.innerHTML = [
    plannerRow("Drop", itemName),
    plannerRow("Single-kill chance", formatPercent(chance)),
    plannerRow(
      "At least one in N kills",
      formatAtLeastOneChance(chanceAtLeastOne, chance),
    ),
    plannerRow("Expected count", formatDecimal(expectedCount)),
    plannerRow("Target quantity", formatNumber(targetQty)),
    plannerRow(
      "Expected kills to target",
      Number.isFinite(expectedKillsForTarget)
        ? formatNumber(expectedKillsForTarget)
        : "Unobtainable",
    ),
    plannerRow(
      "Expected time to target",
      Number.isFinite(expectedHoursForTarget)
        ? formatDuration(expectedHoursForTarget)
        : "Unobtainable",
    ),
    plannerRow(
      "Kills for 50% chance",
      Number.isFinite(killsFor50) ? formatNumber(killsFor50) : "Unobtainable",
    ),
    plannerRow(
      "Kills for 90% chance",
      Number.isFinite(killsFor90) ? formatNumber(killsFor90) : "Unobtainable",
    ),
    plannerRow("Expected value", `${formatNumber(expectedValue)} gp`),
  ].join("");

  if (dom.dropTargetQty) dom.dropTargetQty.value = String(targetQty);
  if (dom.dropKillRate) dom.dropKillRate.value = String(killsPerHour);
  state.dropTargetQty = targetQty;
  state.dropKillRate = killsPerHour;
}

function renderAffordPlanner(model) {
  if (!dom.affordPlannerOutput) {
    return;
  }

  const itemId = state.affordItemId;
  const itemName =
    model?.itemFile?.ITEMS?.[itemId]?.name || itemId || "Unknown item";
  const unitPrice = Number(model?.itemFile?.PRICE_BY_ID?.[itemId] || 0);
  const qty = Math.max(1, clampNumber(state.affordQty, 1, 1000000, 1));
  const gpRate = Math.max(
    1,
    clampNumber(state.affordGpRate, 1, 1000000000, 100000),
  );
  const totalCost = unitPrice * qty;
  const hours = totalCost / gpRate;

  const bestGpRow =
    [...(model?.boardRows || [])]
      .filter((row) => Number(row.gpPerHour || 0) > 0)
      .sort(
        (left, right) =>
          Number(right.gpPerHour || 0) - Number(left.gpPerHour || 0),
      )[0] || null;

  dom.affordPlannerOutput.innerHTML = [
    plannerRow("Item", itemName),
    plannerRow("Unit price", `${formatNumber(unitPrice)} gp`),
    plannerRow("Total cost", `${formatNumber(totalCost)} gp`),
    plannerRow("Time at selected rate", formatDuration(hours)),
    plannerRow(
      "Best known GP source",
      bestGpRow
        ? `${bestGpRow.name} · ${formatNumber(bestGpRow.gpPerHour)} gp/hr`
        : "No GP activity data",
    ),
  ].join("");

  if (dom.affordQty) dom.affordQty.value = String(qty);
  if (dom.affordGpRate) dom.affordGpRate.value = String(Math.round(gpRate));
  state.affordQty = qty;
  state.affordGpRate = gpRate;
}

function renderRoutePlanner(model) {
  if (!dom.routePlannerOutput) {
    return;
  }

  const skillId = state.routeSkill;
  const skillLabel =
    model?.skillFile?.SKILL_LABELS?.[skillId] || skillId || "Skill";
  const currentLevel = clampNumber(state.routeCurrentLevel, 1, SKILL_LEVEL_CAP, 1);
  const targetLevel = Math.max(
    currentLevel,
    clampNumber(state.routeTargetLevel, 1, SKILL_LEVEL_CAP, 60),
  );
  const priority = ["xp", "gp", "balanced"].includes(state.routePriority)
    ? state.routePriority
    : "xp";
  const rows = (model?.boardRows || [])
    .filter((row) => row.skill === skillId && Number(row.level || 0) > 0)
    .sort((left, right) => Number(left.level || 0) - Number(right.level || 0));

  if (!rows.length) {
    dom.routePlannerOutput.innerHTML = plannerRow(
      "Status",
      `No route data for ${skillLabel}`,
    );
    return;
  }

  const breakpoints = [
    ...new Set(
      rows
        .map((row) => Number(row.level || 1))
        .filter((level) => level > currentLevel && level <= targetLevel),
    ),
  ];
  const levelSteps = [currentLevel, ...breakpoints, targetLevel + 1];
  const planRows = [];

  for (let index = 0; index < levelSteps.length - 1; index += 1) {
    const start = levelSteps[index];
    const endExclusive = levelSteps[index + 1];
    const bracketEnd = Math.max(start, endExclusive - 1);
    const eligible = rows.filter((row) => Number(row.level || 1) <= start);
    if (!eligible.length) {
      continue;
    }
    const pick = pickBestRouteRow(eligible, priority);
    planRows.push({
      bracket: `Lv ${start}-${bracketEnd}`,
      activity: pick.name,
      xp: `${formatNumber(pick.xpPerHour)} XP/hr`,
      gp: `${formatNumber(pick.gpPerHour)} gp/hr`,
      req: `req ${formatNumber(pick.level || 1)}`,
    });
  }

  const xpNeeded = Math.max(
    0,
    xpForLevel(targetLevel) - xpForLevel(currentLevel),
  );
  const representativeXpr = pickBestRouteRow(rows, priority)?.xpPerHour || 0;
  const eta = representativeXpr > 0 ? xpNeeded / representativeXpr : 0;

  dom.routePlannerOutput.innerHTML = [
    plannerRow("Skill", skillLabel),
    plannerRow(
      "Priority",
      priority === "xp"
        ? "Fastest XP"
        : priority === "gp"
          ? "Best GP"
          : "Balanced",
    ),
    plannerRow("XP needed", `${formatNumber(xpNeeded)} XP`),
    plannerRow(
      "Rough ETA",
      representativeXpr > 0 ? formatDuration(eta) : "No XP data",
    ),
    ...planRows
      .slice(0, 8)
      .map((row) =>
        plannerRow(
          row.bracket,
          `${row.activity} · ${row.xp} · ${row.gp} · ${row.req}`,
        ),
      ),
  ].join("");

  if (dom.routeCurrentLevel) dom.routeCurrentLevel.value = String(currentLevel);
  if (dom.routeTargetLevel) dom.routeTargetLevel.value = String(targetLevel);
  if (dom.routePriority) dom.routePriority.value = priority;
  state.routeCurrentLevel = currentLevel;
  state.routeTargetLevel = targetLevel;
  state.routePriority = priority;
}

function renderComparePlanner(model) {
  if (!dom.compareOutput) {
    return;
  }

  const rows = [...(model?.boardRows || [])]
    .filter((row) => Number(row.xpPerHour || 0) > 0)
    .sort(
      (left, right) =>
        Number(right.xpPerHour || 0) - Number(left.xpPerHour || 0),
    );

  const rowA = rows[Number(state.compareA)] || null;
  const rowB = rows[Number(state.compareB)] || null;
  const xpGoal = Math.max(
    1,
    clampNumber(state.compareXpGoal, 1, 1000000000, 100000),
  );

  if (!rowA || !rowB) {
    dom.compareOutput.innerHTML = plannerRow(
      "Status",
      "No activities to compare",
    );
    return;
  }

  const aHours = xpGoal / Math.max(1, Number(rowA.xpPerHour || 0));
  const bHours = xpGoal / Math.max(1, Number(rowB.xpPerHour || 0));
  const aGp = aHours * Number(rowA.gpPerHour || 0);
  const bGp = bHours * Number(rowB.gpPerHour || 0);
  const faster = aHours <= bHours ? "A" : "B";
  const timeDelta = Math.abs(aHours - bHours);
  const betterGp = aGp >= bGp ? "A" : "B";
  const gpDelta = Math.abs(aGp - bGp);

  dom.compareOutput.innerHTML = [
    plannerRow("XP goal", `${formatNumber(xpGoal)} XP`),
    plannerRow(
      "Activity A",
      `${rowA.name} · ${formatNumber(rowA.xpPerHour)} XP/hr · ${formatNumber(rowA.gpPerHour)} gp/hr`,
    ),
    plannerRow(
      "Activity B",
      `${rowB.name} · ${formatNumber(rowB.xpPerHour)} XP/hr · ${formatNumber(rowB.gpPerHour)} gp/hr`,
    ),
    plannerRow("Time with A", formatDuration(aHours)),
    plannerRow("Time with B", formatDuration(bHours)),
    plannerRow(
      "Faster option",
      `${faster} (saves ${formatDuration(timeDelta)})`,
    ),
    plannerRow("GP earned with A", `${formatNumber(aGp)} gp`),
    plannerRow("GP earned with B", `${formatNumber(bGp)} gp`),
    plannerRow(
      "Higher GP option",
      `${betterGp} (+${formatNumber(gpDelta)} gp)`,
    ),
  ].join("");

  if (dom.compareXpGoal) dom.compareXpGoal.value = String(Math.round(xpGoal));
  state.compareXpGoal = xpGoal;
}

function renderBuildPlanner(model) {
  if (!dom.buildOutput) {
    return;
  }

  const focus = BUILD_FOCUS_VALUES.includes(state.buildFocus)
    ? state.buildFocus
    : "attack";
  const budget = Math.max(
    1,
    clampNumber(state.buildBudget, 1, 1000000000, 250000),
  );
  const gpRate = Math.max(
    1,
    clampNumber(state.buildGpRate, 1, 1000000000, 100000),
  );
  const attackLevel = clampNumber(state.buildAttackLevel, 1, SKILL_LEVEL_CAP, 1);
  const defenceLevel = clampNumber(state.buildDefenceLevel, 1, SKILL_LEVEL_CAP, 1);
  const magicLevel = clampNumber(state.buildMagicLevel, 1, SKILL_LEVEL_CAP, 1);

  const levelCaps = {
    attack: attackLevel,
    defence: defenceLevel,
    magic: magicLevel,
  };
  const dungeonCompletion = state.buildDungeonCompletion || "all";
  const plan = buildRecommendedSet(model, focus, budget, levelCaps, {
    dungeonCompletion,
  });
  state.currentBuildPlan = plan;
  if (!plan.selected.length) {
    dom.buildOutput.innerHTML = plannerRow(
      "Status",
      "No eligible slotted gear found in item data",
    );
    return;
  }

  const meetsAll =
    attackLevel >= plan.requirements.attack &&
    defenceLevel >= plan.requirements.defence &&
    magicLevel >= plan.requirements.magic;

  const missingGp = Math.max(0, plan.totalCost - budget);
  const extraHours = missingGp > 0 ? missingGp / gpRate : 0;

  const acquisitionRows = plan.selected
    .slice()
    .sort((left, right) => left.gateLevel - right.gateLevel)
    .slice(0, 10)
    .map((item, index) => {
      const reqLabel = summarizeRequirements(item);
      const source =
        item.sourceProfile?.summary ||
        item.sourceHint ||
        `Source mapping missing (item: ${item.id})`;
      const confidence = item.sourceProfile?.confidence || "unknown";
      return plannerRow(
        `Step ${index + 1}`,
        `${item.name} (${capitalize(item.slot)}) · ${formatNumber(item.price)} gp · ${reqLabel} · ${source} · ${confidence}`,
      );
    });

  dom.buildOutput.innerHTML = [
    plannerRow("Focus", getBuildFocusLabel(focus)),
    plannerRow(
      "Dungeon cap",
      getDungeonCompletionLabel(model, dungeonCompletion),
    ),
    plannerRow("Slots covered", `${plan.selected.length}/${plan.slotCount}`),
    plannerRow("Total set cost", `${formatNumber(plan.totalCost)} gp`),
    plannerRow("Source confidence", summarizeBuildSourceConfidence(plan)),
    plannerRow(
      "Budget status",
      missingGp > 0 ? `Over by ${formatNumber(missingGp)} gp` : "Within budget",
    ),
    plannerRow(
      "Time to fund gap",
      missingGp > 0 ? formatDuration(extraHours) : "0h",
    ),
    plannerRow(
      "Required levels",
      `Atk ${plan.requirements.attack} · Def ${plan.requirements.defence} · Fracture Arts ${plan.requirements.magic}`,
    ),
    plannerRow(
      "Can equip now",
      meetsAll
        ? "Yes"
        : `Need Atk +${Math.max(0, plan.requirements.attack - attackLevel)} · Def +${Math.max(0, plan.requirements.defence - defenceLevel)} · Fracture Arts +${Math.max(0, plan.requirements.magic - magicLevel)}`,
    ),
    ...acquisitionRows,
  ].join("");

  if (dom.buildFocus) dom.buildFocus.value = focus;
  if (dom.buildBudget) dom.buildBudget.value = String(Math.round(budget));
  if (dom.buildGpRate) dom.buildGpRate.value = String(Math.round(gpRate));
  if (dom.buildAttackLevel) dom.buildAttackLevel.value = String(attackLevel);
  if (dom.buildDefenceLevel) dom.buildDefenceLevel.value = String(defenceLevel);
  if (dom.buildMagicLevel) dom.buildMagicLevel.value = String(magicLevel);
  if (dom.buildDungeonComplete)
    dom.buildDungeonComplete.value = dungeonCompletion;

  state.buildFocus = focus;
  state.buildBudget = budget;
  state.buildGpRate = gpRate;
  state.buildAttackLevel = attackLevel;
  state.buildDefenceLevel = defenceLevel;
  state.buildMagicLevel = magicLevel;
  state.buildDungeonCompletion = dungeonCompletion;
}

function renderUpgradeSimulator(model) {
  if (!dom.simOutput) {
    return;
  }

  const plan =
    state.currentBuildPlan ||
    buildRecommendedSet(
      model,
      state.buildFocus,
      state.buildBudget,
      {
        attack: clampNumber(state.buildAttackLevel, 1, SKILL_LEVEL_CAP, 1),
        defence: clampNumber(state.buildDefenceLevel, 1, SKILL_LEVEL_CAP, 1),
        magic: clampNumber(state.buildMagicLevel, 1, SKILL_LEVEL_CAP, 1),
      },
      {
        dungeonCompletion: state.buildDungeonCompletion || "all",
      },
    );
  const xpRate = Math.max(
    1,
    clampNumber(state.simXpRate, 1, 1000000000, 25000),
  );
  const gpRate = Math.max(
    1,
    clampNumber(state.simGpRate, 1, 1000000000, 100000),
  );
  const atkNow = clampNumber(state.buildAttackLevel, 1, SKILL_LEVEL_CAP, 1);
  const defNow = clampNumber(state.buildDefenceLevel, 1, SKILL_LEVEL_CAP, 1);
  const magNow = clampNumber(state.buildMagicLevel, 1, SKILL_LEVEL_CAP, 1);
  const req = plan.requirements || { attack: 1, defence: 1, magic: 1 };

  const atkXpNeed = Math.max(0, xpForLevel(req.attack) - xpForLevel(atkNow));
  const defXpNeed = Math.max(0, xpForLevel(req.defence) - xpForLevel(defNow));
  const magXpNeed = Math.max(0, xpForLevel(req.magic) - xpForLevel(magNow));
  const xpHours = (atkXpNeed + defXpNeed + magXpNeed) / xpRate;
  const gpGap = Math.max(
    0,
    plan.totalCost - Math.max(1, Number(state.buildBudget || 0)),
  );
  const gpHours = gpGap / gpRate;
  const unlockHours = Math.max(xpHours, gpHours);

  dom.simOutput.innerHTML = [
    plannerRow("XP rate", `${formatNumber(xpRate)} XP/hr`),
    plannerRow("GP rate", `${formatNumber(gpRate)} gp/hr`),
    plannerRow(
      "Attack req timeline",
      atkXpNeed > 0 ? formatDuration(atkXpNeed / xpRate) : "Ready now",
    ),
    plannerRow(
      "Defence req timeline",
      defXpNeed > 0 ? formatDuration(defXpNeed / xpRate) : "Ready now",
    ),
    plannerRow(
      "Fracture Arts req timeline",
      magXpNeed > 0 ? formatDuration(magXpNeed / xpRate) : "Ready now",
    ),
    plannerRow(
      "Funding gap timeline",
      gpGap > 0 ? formatDuration(gpHours) : "Ready now",
    ),
    plannerRow("Estimated full unlock", formatDuration(unlockHours)),
  ].join("");

  if (dom.simXpRate) dom.simXpRate.value = String(Math.round(xpRate));
  if (dom.simGpRate) dom.simGpRate.value = String(Math.round(gpRate));
  state.simXpRate = xpRate;
  state.simGpRate = gpRate;
}

function renderFarmRoutePlanner(model) {
  if (!dom.farmRouteOutput) {
    return;
  }

  const xpTarget = Math.max(
    0,
    clampNumber(state.farmRouteXpTarget, 0, 1000000000, 150000),
  );
  const gpTarget = Math.max(
    0,
    clampNumber(state.farmRouteGpTarget, 0, 1000000000, 250000),
  );
  const maxSteps = Math.max(1, clampNumber(state.farmRouteMaxSteps, 1, 10, 4));
  const skillFilter = state.farmRouteSkillFilter || "all";
  const route = buildMixedFarmRoute(
    model,
    xpTarget,
    gpTarget,
    maxSteps,
    skillFilter,
  );

  dom.farmRouteOutput.innerHTML = [
    plannerRow("XP target", `${formatNumber(xpTarget)} XP`),
    plannerRow("GP target", `${formatNumber(gpTarget)} gp`),
    plannerRow("Planned duration", formatDuration(route.totalHours)),
    plannerRow(
      "Projected gains",
      `${formatNumber(route.gainedXp)} XP · ${formatNumber(route.gainedGp)} gp`,
    ),
    ...route.steps.map((step, index) =>
      plannerRow(
        `Step ${index + 1}`,
        `${step.name} for ${formatDuration(step.hours)} · ${formatNumber(step.xpGain)} XP · ${formatNumber(step.gpGain)} gp`,
      ),
    ),
  ].join("");

  if (dom.routeXpTarget) dom.routeXpTarget.value = String(Math.round(xpTarget));
  if (dom.routeGpTarget) dom.routeGpTarget.value = String(Math.round(gpTarget));
  if (dom.routeMaxSteps) dom.routeMaxSteps.value = String(Math.round(maxSteps));
  if (dom.routeSkillFilter) dom.routeSkillFilter.value = skillFilter;
  state.farmRouteXpTarget = xpTarget;
  state.farmRouteGpTarget = gpTarget;
  state.farmRouteMaxSteps = maxSteps;
  state.farmRouteSkillFilter = skillFilter;
}

function summarizeSkillXpBonuses(profile) {
  const entries = Object.entries(profile?.skillXpBonusBySkill || {})
    .map(([skillId, pct]) => [String(skillId), Number(pct || 0)])
    .filter(([, pct]) => Number.isFinite(pct) && pct > 0)
    .sort((left, right) => right[1] - left[1]);
  const top = entries
    .slice(0, 6)
    .map(([skillId, pct]) => `${capitalize(skillId)} +${formatDecimal(pct)}%`)
    .join(" · ");
  return {
    count: entries.length,
    top: top || "None",
  };
}

function renderDiagnostics(model) {
  if (!dom.diagnosticsOutput) {
    return;
  }
  const profile = getPlayerCombatProfile();
  const skillXpSummary = summarizeSkillXpBonuses(profile);
  const items = model?.itemFile?.ITEMS || {};
  const prices = model?.itemFile?.PRICE_BY_ID || {};
  const sourceProfiles = model?.sourceProfiles || {};

  const slottedIds = Object.keys(items).filter(
    (itemId) => String(items[itemId]?.slot || "") !== "",
  );
  const missingPrice = slottedIds.filter(
    (itemId) => Number(prices[itemId] || 0) <= 0,
  );
  const unknownSource = slottedIds.filter(
    (itemId) => (sourceProfiles[itemId]?.confidence || "unknown") === "unknown",
  );
  const inferredSource = slottedIds.filter(
    (itemId) =>
      (sourceProfiles[itemId]?.confidence || "unknown") === "inferred",
  );

  dom.diagnosticsOutput.innerHTML = [
    plannerRow(
      "Imported snapshot",
      `${capitalize(String(profile.combatStyle || "balanced"))} · Atk ${formatNumber(profile.attack)} · Str ${formatNumber(profile.strength)} · Def ${formatNumber(profile.defence)} · Fracture Arts ${formatNumber(profile.magic)} · HP ${formatNumber(profile.hitpoints)}`,
    ),
    plannerRow(
      "Imported gear/maths",
      `ATK +${formatNumber(profile.atkBonus)} · STR +${formatNumber(profile.strBonus)} · DEF +${formatNumber(profile.defBonus)} · MAG +${formatNumber(profile.magBonus)} · Tick ${formatDecimal(profile.combatTickSeconds)}s · Respawn ${GAME_RESPAWN_TICKS} ticks (2.4s)`,
    ),
    plannerRow(
      "Imported combat bonuses",
      `Damage +${formatDecimal(profile.combatDamageBonusPct)}% · Attack hit +${formatDecimal(profile.attackMasteryHitBonusPct)}% · Strength max +${formatDecimal(profile.strengthMasteryMaxHitBonusPct)}% · Fracture hit +${formatDecimal(profile.magicMasteryHitBonusPct)}% · Fracture max +${formatDecimal(profile.magicMasteryMaxHitBonusPct)}%`,
    ),
    plannerRow(
      "Imported economy/drop bonuses",
      `Sell +${formatDecimal(profile.sellPriceBonusPct)}% · Combat gold +${formatDecimal(profile.combatGoldBonusPct)}% · Artisan material drop +${formatDecimal(profile.artisanMaterialDropBonusPct)}% · Resonance crystal drop +${formatDecimal(profile.resonanceCrystalDropBonusPct)}%`,
    ),
    plannerRow(
      "Imported skill XP bonuses",
      `${formatNumber(skillXpSummary.count)} skills · ${skillXpSummary.top}`,
    ),
    plannerRow("Slotted items", formatNumber(slottedIds.length)),
    plannerRow("Missing price", formatNumber(missingPrice.length)),
    plannerRow("Inferred sources", formatNumber(inferredSource.length)),
    plannerRow("Unknown sources", formatNumber(unknownSource.length)),
    plannerRow(
      "Top missing price",
      missingPrice
        .slice(0, 3)
        .map((itemId) => items[itemId]?.name || itemId)
        .join(" · ") || "None",
    ),
    plannerRow(
      "Top unknown source",
      unknownSource
        .slice(0, 3)
        .map((itemId) => items[itemId]?.name || itemId)
        .join(" · ") || "None",
    ),
    plannerRow("Share state", "Planner state is encoded in the URL query"),
  ].join("");
}

function buildMixedFarmRoute(model, xpTarget, gpTarget, maxSteps, skillFilter) {
  let remainingXp = Math.max(0, Number(xpTarget || 0));
  let remainingGp = Math.max(0, Number(gpTarget || 0));

  const allowedSkills = new Set(
    getFarmRouteSkillOptions(model).filter((id) => id !== "all"),
  );
  const rows = [...(model?.boardRows || [])]
    .filter(
      (row) => Number(row.xpPerHour || 0) > 0 || Number(row.gpPerHour || 0) > 0,
    )
    .filter((row) => allowedSkills.has(String(row.skill || "")))
    .filter((row) => skillFilter === "all" || row.skill === skillFilter);

  if (!rows.length || (remainingXp <= 0 && remainingGp <= 0)) {
    return { steps: [], totalHours: 0, gainedXp: 0, gainedGp: 0 };
  }

  const steps = [];
  let totalHours = 0;
  let gainedXp = 0;
  let gainedGp = 0;

  for (
    let idx = 0;
    idx < maxSteps && (remainingXp > 1 || remainingGp > 1);
    idx += 1
  ) {
    const pick = pickMixedRouteStep(rows, remainingXp, remainingGp);
    if (!pick) {
      break;
    }

    const xpr = Math.max(0, Number(pick.xpPerHour || 0));
    const gpr = Math.max(0, Number(pick.gpPerHour || 0));
    const timeToXp = xpr > 0 ? remainingXp / xpr : Number.POSITIVE_INFINITY;
    const timeToGp = gpr > 0 ? remainingGp / gpr : Number.POSITIVE_INFINITY;
    let hours = Math.min(timeToXp, timeToGp, 2);
    if (!Number.isFinite(hours) || hours <= 0) {
      hours = 1;
    }

    const xpGain = xpr * hours;
    const gpGain = gpr * hours;

    const previous = steps[steps.length - 1];
    if (previous && previous.name === pick.name) {
      previous.hours += hours;
      previous.xpGain += xpGain;
      previous.gpGain += gpGain;
    } else {
      steps.push({ name: pick.name, hours, xpGain, gpGain });
    }

    remainingXp = Math.max(0, remainingXp - xpGain);
    remainingGp = Math.max(0, remainingGp - gpGain);
    totalHours += hours;
    gainedXp += xpGain;
    gainedGp += gpGain;
  }

  return { steps, totalHours, gainedXp, gainedGp };
}

function pickMixedRouteStep(rows, remainingXp, remainingGp) {
  let best = null;
  let bestScore = -1;
  for (const row of rows) {
    const xpr = Math.max(0, Number(row.xpPerHour || 0));
    const gpr = Math.max(0, Number(row.gpPerHour || 0));
    const xpProgress = remainingXp > 0 ? Math.min(1, xpr / remainingXp) : 0;
    const gpProgress = remainingGp > 0 ? Math.min(1, gpr / remainingGp) : 0;
    const score = xpProgress + gpProgress;
    if (score > bestScore) {
      bestScore = score;
      best = row;
    }
  }
  return best;
}

function getFarmRouteSkillOptions(model) {
  const skillLabels = model?.skillFile?.SKILL_LABELS || {};
  const routeSkills = [
    ...new Set(
      (model?.boardRows || [])
        .map((row) => String(row.skill || ""))
        .filter((skillId) =>
          Object.prototype.hasOwnProperty.call(skillLabels, skillId),
        ),
    ),
  ].sort((left, right) =>
    String(skillLabels[left]).localeCompare(String(skillLabels[right])),
  );
  return ["all", ...routeSkills];
}

function summarizeBuildSourceConfidence(plan) {
  const counts = { explicit: 0, inferred: 0, unknown: 0 };
  for (const item of plan.selected || []) {
    const confidence = item.sourceProfile?.confidence || "unknown";
    counts[confidence] = (counts[confidence] || 0) + 1;
  }
  return `explicit ${counts.explicit} · inferred ${counts.inferred} · unknown ${counts.unknown}`;
}

function buildItemSourceProfiles(
  itemIds,
  itemFile,
  skillFile,
  monsterFile,
  questFile,
  dungeonFile,
  taskFile,
  adventurerFile,
) {
  const recipeRefs = buildItemRecipeIndex(skillFile, itemIds);
  const craftedRefs = buildItemCraftingIndex(itemFile, itemIds);
  const monsterRefs = buildItemMonsterIndex(monsterFile, itemIds);
  const questRefs = buildItemQuestIndex(questFile, itemIds);
  const dungeonRefs = buildItemDungeonIndex(dungeonFile, itemIds);
  const taskRefs = buildItemTaskIndex(taskFile, itemIds);
  const contractRefs = buildItemContractIndex(adventurerFile, itemIds);
  const items = itemFile.ITEMS || {};

  const out = {};
  for (const itemId of itemIds) {
    const item = items[itemId] || {};
    const recipeSources = recipeRefs.get(itemId) || [];
    const craftedSources = craftedRefs.get(itemId) || [];
    const monsterSources = monsterRefs.get(itemId) || [];
    const questSources = questRefs.get(itemId) || [];
    const dungeonSources = dungeonRefs.get(itemId) || [];
    const taskSources = taskRefs.get(itemId) || [];
    const contractSources = contractRefs.get(itemId) || [];
    const tags = [];
    const sourceHint = String(item.source_hint || "");
    if (sourceHint) {
      tags.push(detectSourceTag(sourceHint));
    }
    if (recipeSources.length) tags.push("recipe");
    if (craftedSources.length) tags.push("recipe");
    if (monsterSources.length) tags.push("monster");
    if (questSources.length) tags.push("quest");
    if (dungeonSources.length) tags.push("dungeon");
    if (taskSources.length) tags.push("task");
    if (contractSources.length) tags.push("contract");

    const uniqueTags = [...new Set(tags)];
    const inferredSources = [
      ...recipeSources,
      ...craftedSources,
      ...monsterSources,
      ...questSources,
      ...dungeonSources,
      ...taskSources,
      ...contractSources,
    ];
    const uniqueInferredSources = [...new Set(inferredSources)];
    const inferredSummary = uniqueInferredSources.length
      ? summarizeSourceList(uniqueInferredSources)
      : uniqueTags.join(" + ") || `Source mapping missing (item: ${itemId})`;
    let confidence = "unknown";
    if (sourceHint) confidence = "explicit";
    else if (uniqueTags.length) confidence = "inferred";

    out[itemId] = {
      tags: uniqueTags,
      confidence,
      summary: sourceHint || inferredSummary,
    };
  }
  return out;
}

function summarizeSourceList(sources) {
  const entries = (sources || []).filter(Boolean);
  if (!entries.length) {
    return "Source mapping missing in exported data";
  }
  return entries.join(" | ");
}

function detectSourceTag(sourceHint) {
  const normalized = String(sourceHint || "").toLowerCase();
  if (normalized.includes("vendor")) return "vendor";
  if (normalized.includes("store")) return "store";
  if (normalized.includes("quest")) return "quest";
  if (normalized.includes("dungeon")) return "dungeon";
  return "source_hint";
}

function loadStateFromUrl() {
  const params = new URLSearchParams(window.location.search || "");
  const numberKeys = {
    psl: ["playerStrengthLevel", 1],
    pag: ["playerAtkGearBonus", 0],
    psg: ["playerStrGearBonus", 0],
    pdg: ["playerDefGearBonus", 0],
    pmg: ["playerMagGearBonus", 0],
    pcdmb: ["playerCombatDamageBonusPct", 0],
    pamh: ["playerAttackMasteryHitBonusPct", 0],
    psmh: ["playerStrengthMasteryMaxHitBonusPct", 0],
    pmmh: ["playerMagicMasteryHitBonusPct", 0],
    pmmm: ["playerMagicMasteryMaxHitBonusPct", 0],
    pcts: ["playerCombatTickSeconds", 1.2],
    spb: ["sellPriceBonusPct", 0],
    cgb: ["combatGoldBonusPct", 0],
    amdb: ["artisanMaterialDropBonusPct", 0],
    rcdb: ["resonanceCrystalDropBonusPct", 0],
    pal: ["playerAttackLevel", 1],
    pdl: ["playerDefenceLevel", 1],
    pml: ["playerMagicLevel", 1],
    phl: ["playerHitpointsLevel", 10],
    xl: ["xpCurrentLevel", 1],
    xt: ["xpTargetLevel", 50],
    xr: ["xpRate", 25000],
    dk: ["dropKills", 100],
    dt: ["dropTargetQty", 10],
    dkr: ["dropKillRate", 80],
    ar: ["affordGpRate", 100000],
    aq: ["affordQty", 1],
    rcl: ["routeCurrentLevel", 1],
    rtl: ["routeTargetLevel", 60],
    cx: ["compareXpGoal", 100000],
    bb: ["buildBudget", 250000],
    bgr: ["buildGpRate", 100000],
    bal: ["buildAttackLevel", 1],
    bdl: ["buildDefenceLevel", 1],
    bml: ["buildMagicLevel", 1],
    sx: ["simXpRate", 25000],
    sg: ["simGpRate", 100000],
    frx: ["farmRouteXpTarget", 150000],
    frg: ["farmRouteGpTarget", 250000],
    frs: ["farmRouteMaxSteps", 4],
  };

  for (const [paramKey, [stateKey, fallback]] of Object.entries(numberKeys)) {
    if (params.has(paramKey)) {
      state[stateKey] = clampNumber(
        params.get(paramKey),
        0,
        1000000000,
        fallback,
      );
    }
  }

  const stringKeys = {
    pcs: "playerCombatStyle",
    psp: "playerSpellId",
    dm: "dropMonsterId",
    di: "dropItemId",
    ai: "affordItemId",
    rs: "routeSkill",
    rp: "routePriority",
    ca: "compareA",
    cb: "compareB",
    bf: "buildFocus",
    bdc: "buildDungeonCompletion",
    frf: "farmRouteSkillFilter",
  };

  for (const [paramKey, stateKey] of Object.entries(stringKeys)) {
    if (params.has(paramKey)) {
      state[stateKey] = params.get(paramKey) || state[stateKey];
    }
  }

  const skillXpRaw = params.get("pxp") || "";
  state.skillXpBonusBySkill = parseSkillXpBonusMap(skillXpRaw);
}

function updateUrlState() {
  const params = new URLSearchParams();
  params.set("pcs", state.playerCombatStyle || "balanced");
  params.set("psp", state.playerSpellId || DEFAULT_SPELL_ID);
  params.set("pal", String(Math.round(state.playerAttackLevel || 1)));
  params.set("psl", String(Math.round(state.playerStrengthLevel || 1)));
  params.set("pdl", String(Math.round(state.playerDefenceLevel || 1)));
  params.set("pml", String(Math.round(state.playerMagicLevel || 1)));
  params.set("phl", String(Math.round(state.playerHitpointsLevel || 10)));
  params.set("pag", String(Math.round(state.playerAtkGearBonus || 0)));
  params.set("psg", String(Math.round(state.playerStrGearBonus || 0)));
  params.set("pdg", String(Math.round(state.playerDefGearBonus || 0)));
  params.set("pmg", String(Math.round(state.playerMagGearBonus || 0)));
  params.set(
    "pcdmb",
    String(Math.round(state.playerCombatDamageBonusPct || 0)),
  );
  params.set(
    "pamh",
    String(Math.round(state.playerAttackMasteryHitBonusPct || 0)),
  );
  params.set(
    "psmh",
    String(Math.round(state.playerStrengthMasteryMaxHitBonusPct || 0)),
  );
  params.set(
    "pmmh",
    String(Math.round(state.playerMagicMasteryHitBonusPct || 0)),
  );
  params.set(
    "pmmm",
    String(Math.round(state.playerMagicMasteryMaxHitBonusPct || 0)),
  );
  params.set("pcts", String(Number(state.playerCombatTickSeconds || 1.2)));
  params.set("spb", String(Number(state.sellPriceBonusPct || 0)));
  params.set("cgb", String(Number(state.combatGoldBonusPct || 0)));
  params.set("amdb", String(Number(state.artisanMaterialDropBonusPct || 0)));
  params.set("rcdb", String(Number(state.resonanceCrystalDropBonusPct || 0)));
  if (
    state.skillXpBonusBySkill &&
    Object.keys(state.skillXpBonusBySkill).length
  )
    params.set("pxp", JSON.stringify(state.skillXpBonusBySkill));
  params.set("xl", String(Math.round(state.xpCurrentLevel || 1)));
  params.set("xt", String(Math.round(state.xpTargetLevel || 50)));
  params.set("xr", String(Math.round(state.xpRate || 25000)));
  if (state.dropMonsterId) params.set("dm", state.dropMonsterId);
  if (state.dropItemId) params.set("di", state.dropItemId);
  params.set("dk", String(Math.round(state.dropKills || 100)));
  params.set("dt", String(Math.round(state.dropTargetQty || 10)));
  params.set("dkr", String(Math.round(state.dropKillRate || 80)));
  if (state.affordItemId) params.set("ai", state.affordItemId);
  params.set("ar", String(Math.round(state.affordGpRate || 100000)));
  params.set("aq", String(Math.round(state.affordQty || 1)));
  if (state.routeSkill) params.set("rs", state.routeSkill);
  params.set("rcl", String(Math.round(state.routeCurrentLevel || 1)));
  params.set("rtl", String(Math.round(state.routeTargetLevel || 60)));
  params.set("rp", state.routePriority || "xp");
  params.set("ca", state.compareA || "");
  params.set("cb", state.compareB || "");
  params.set("cx", String(Math.round(state.compareXpGoal || 100000)));
  params.set("bf", state.buildFocus || "attack");
  params.set("bb", String(Math.round(state.buildBudget || 250000)));
  params.set("bgr", String(Math.round(state.buildGpRate || 100000)));
  params.set("bal", String(Math.round(state.buildAttackLevel || 1)));
  params.set("bdl", String(Math.round(state.buildDefenceLevel || 1)));
  params.set("bml", String(Math.round(state.buildMagicLevel || 1)));
  params.set("bdc", state.buildDungeonCompletion || "all");
  params.set("sx", String(Math.round(state.simXpRate || 25000)));
  params.set("sg", String(Math.round(state.simGpRate || 100000)));
  params.set("frx", String(Math.round(state.farmRouteXpTarget || 150000)));
  params.set("frg", String(Math.round(state.farmRouteGpTarget || 250000)));
  params.set("frs", String(Math.round(state.farmRouteMaxSteps || 4)));
  params.set("frf", state.farmRouteSkillFilter || "all");

  const query = params.toString();
  const nextUrl = `${window.location.pathname}?${query}`;
  if (`${window.location.pathname}${window.location.search}` !== nextUrl) {
    window.history.replaceState(null, "", nextUrl);
  }
}

function buildRecommendedSet(
  model,
  focus,
  budget,
  levelCaps = null,
  planOptions = null,
) {
  const dungeonGateByItem = buildItemDungeonGateIndex(model);
  const dungeonCapRank = resolveDungeonCompletionRank(
    model,
    planOptions?.dungeonCompletion || "all",
  );
  const items = model?.itemFile?.ITEMS || {};
  const prices = model?.itemFile?.PRICE_BY_ID || {};
  const attackReq = model?.itemFile?.ATTACK_REQ_BY_ID || {};
  const defenceReq = model?.itemFile?.DEFENCE_REQ_BY_ID || {};
  const magicReq = model?.itemFile?.MAGIC_REQ_BY_ID || {};
  const sourceProfiles = model?.sourceProfiles || {};
  const sourceGateByItem = buildItemSourceGateIndex(model);
  const progressionLevel = levelCaps
    ? Math.max(
        Number(levelCaps.attack || 1),
        Number(levelCaps.defence || 1),
        Number(levelCaps.magic || 1),
      )
    : 99;
  const sourceNearMissWindow = 3;

  const slottedItems = Object.entries(items)
    .map(([itemId, item]) => ({
      id: itemId,
      name: item.name || itemId,
      slot: String(item.slot || ""),
      sourceHint: String(item.source_hint || ""),
      price: Number(prices[itemId] || 0),
      attackReq: Number(attackReq[itemId] || 0),
      defenceReq: Number(defenceReq[itemId] || 0),
      magicReq: Number(magicReq[itemId] || 0),
      sourceGateLevel: Number(sourceGateByItem.get(itemId) || 0),
      dungeonGateRank: Number(dungeonGateByItem.get(itemId) || 0),
      sourceProfile: sourceProfiles[itemId] || null,
    }))
    .filter((item) => {
      if (!item.slot) return false;
      if (item.price > budget) return false;
      const meetsEquipReq = levelCaps
        ? item.attackReq <= Number(levelCaps.attack || 99) &&
          item.defenceReq <= Number(levelCaps.defence || 99) &&
          item.magicReq <= Number(levelCaps.magic || 99)
        : true;
      if (!levelCaps) return true;
      if (!meetsEquipReq) return false;
      if (item.dungeonGateRank > 0 && item.dungeonGateRank > dungeonCapRank) {
        return false;
      }
      if (item.sourceGateLevel <= 0) return true;
      return item.sourceGateLevel <= progressionLevel + sourceNearMissWindow;
    });

  const bySlot = groupBy(slottedItems, (item) => item.slot);
  const slotEntries = [...bySlot.entries()].map(([slot, slotItems]) => {
    const sorted = slotItems
      .map((item) => ({
        ...item,
        gateLevel: Math.max(
          item.attackReq,
          item.defenceReq,
          item.magicReq,
          item.sourceGateLevel,
        ),
        score: buildItemScore(item, focus, progressionLevel),
      }))
      .sort((left, right) => {
        if (right.score !== left.score) return right.score - left.score;
        if (left.price !== right.price) return left.price - right.price;
        return left.name.localeCompare(right.name);
      });

    return {
      slot,
      candidates: sorted,
      selectedIndex: 0,
    };
  });

  const usableSlots = slotEntries.filter(
    (entry) => entry.candidates.length > 0,
  );
  const selected = usableSlots.map(
    (entry) => entry.candidates[entry.selectedIndex],
  );

  let totalCost = selected.reduce((sum, item) => sum + item.price, 0);
  while (totalCost > budget) {
    let bestDowngrade = null;

    for (const entry of usableSlots) {
      const current = entry.candidates[entry.selectedIndex];
      for (
        let index = entry.selectedIndex + 1;
        index < entry.candidates.length;
        index += 1
      ) {
        const candidate = entry.candidates[index];
        const savings = current.price - candidate.price;
        if (savings <= 0) {
          continue;
        }
        const scoreLoss = Math.max(0.01, current.score - candidate.score);
        const efficiency = savings / scoreLoss;
        if (!bestDowngrade || efficiency > bestDowngrade.efficiency) {
          bestDowngrade = { entry, index, efficiency };
        }
      }
    }

    if (!bestDowngrade) {
      break;
    }

    bestDowngrade.entry.selectedIndex = bestDowngrade.index;
    totalCost = usableSlots.reduce(
      (sum, entry) => sum + entry.candidates[entry.selectedIndex].price,
      0,
    );
  }

  let finalItems = usableSlots.map(
    (entry) => entry.candidates[entry.selectedIndex],
  );

  let finalTotal = finalItems.reduce((sum, item) => sum + item.price, 0);
  if (finalTotal > budget) {
    for (const item of [...finalItems].sort((a, b) => b.price - a.price)) {
      if (finalTotal <= budget) break;
      finalItems = finalItems.filter((candidate) => candidate.id !== item.id);
      finalTotal = finalItems.reduce(
        (sum, candidate) => sum + candidate.price,
        0,
      );
    }
  }

  return {
    selected: finalItems,
    slotCount: usableSlots.length,
    totalCost: finalItems.reduce((sum, item) => sum + item.price, 0),
    requirements: {
      attack: finalItems.length
        ? Math.max(1, ...finalItems.map((item) => item.attackReq))
        : 1,
      defence: finalItems.length
        ? Math.max(1, ...finalItems.map((item) => item.defenceReq))
        : 1,
      magic: finalItems.length
        ? Math.max(1, ...finalItems.map((item) => item.magicReq))
        : 1,
    },
  };
}

function buildItemScore(item, focus, progressionLevel = 99) {
  const idAndName = `${item.id} ${item.name}`.toLowerCase();
  const weaponBoost = idAndName.match(
    /blade|sword|stave|staff|shield|aegis|helm/,
  )
    ? 5
    : 0;
  const sourceGatePenalty =
    item.sourceGateLevel > progressionLevel
      ? (item.sourceGateLevel - progressionLevel) * 6
      : 0;
  const base =
    Math.max(item.attackReq, item.defenceReq, item.magicReq) * 3 +
    Math.log10(item.price + 10) * 4 -
    sourceGatePenalty;

  if (focus === "attack") {
    const keyword = idAndName.match(/blade|sword|war|combat|hookknife/) ? 8 : 0;
    return base + item.attackReq * 4 + item.defenceReq + keyword + weaponBoost;
  }
  if (focus === "magic") {
    const keyword = idAndName.match(/stave|staff|mage|arcane|focus|sigil|rune/)
      ? 8
      : 0;
    return (
      base + item.magicReq * 4 + item.defenceReq * 0.8 + keyword + weaponBoost
    );
  }
  if (focus === "defence") {
    const keyword = idAndName.match(
      /shield|aegis|helm|plate|greaves|guard|bastion|mantle|bulwark/,
    )
      ? 8
      : 0;
    return (
      base + item.defenceReq * 4 + item.attackReq * 0.7 + keyword + weaponBoost
    );
  }
  return (
    base +
    item.attackReq * 2 +
    item.defenceReq * 2 +
    item.magicReq * 2 +
    weaponBoost
  );
}

function summarizeRequirements(item) {
  const chunks = [];
  if (item.attackReq > 0) chunks.push(`Atk ${item.attackReq}`);
  if (item.defenceReq > 0) chunks.push(`Def ${item.defenceReq}`);
  if (item.magicReq > 0) chunks.push(`Fracture Arts ${item.magicReq}`);
  if (item.sourceGateLevel > 0) chunks.push(`Src Lv ${item.sourceGateLevel}`);
  return chunks.length ? chunks.join(" / ") : "No level req";
}

function buildItemDungeonGateIndex(model) {
  const index = new Map();
  const dungeons = model?.dungeons || [];
  const itemDefs = model?.itemFile?.ITEMS || {};

  const itemIdByName = new Map();
  for (const [itemId, item] of Object.entries(itemDefs)) {
    const itemName = String(item?.name || "")
      .trim()
      .toLowerCase();
    if (itemName) {
      itemIdByName.set(itemName, itemId);
    }
  }

  const setMinRank = (itemId, rank) => {
    const numericRank = Number(rank || 0);
    if (!itemId || numericRank <= 0) return;
    const existing = Number(index.get(itemId) || 0);
    if (existing <= 0 || numericRank < existing) {
      index.set(itemId, numericRank);
    }
  };

  dungeons.forEach((dungeon, rank) => {
    const rewards = dungeon?.rewards || {};
    for (const drop of rewards.loot_table || []) {
      const itemId = String(drop?.item_id || "");
      setMinRank(itemId, rank + 1);
    }
    const firstClearItems = rewards.first_clear_bonus?.items || {};
    for (const itemId of Object.keys(firstClearItems)) {
      setMinRank(itemId, rank + 1);
    }
  });

  // Chronicler vendor inventory is acquired via dungeon reward exchanges.
  // If a specific exchange target is named, inherit that target's dungeon rank.
  // Otherwise, require at least first dungeon completion.
  for (const [itemId, item] of Object.entries(itemDefs)) {
    const sourceHint = String(item?.source_hint || "");
    if (!/chronicler\s+vendor/i.test(sourceHint)) {
      continue;
    }

    const exchangeMatch = sourceHint.match(/exchange\s+([^\)]+)/i);
    if (exchangeMatch) {
      const exchangeName = String(exchangeMatch[1] || "")
        .trim()
        .toLowerCase();

      if (exchangeName && exchangeName !== "dungeon relics") {
        const exchangeItemId = itemIdByName.get(exchangeName);
        const exchangeRank = exchangeItemId
          ? Number(index.get(exchangeItemId) || 0)
          : 0;
        if (exchangeRank > 0) {
          setMinRank(itemId, exchangeRank);
          continue;
        }
      }
    }

    setMinRank(itemId, 1);
  }

  return index;
}

function resolveDungeonCompletionRank(model, selectedDungeonId) {
  const dungeons = model?.dungeons || [];
  if (!dungeons.length) return Number.POSITIVE_INFINITY;
  const selected = String(selectedDungeonId || "all");
  if (!selected || selected === "all") {
    return dungeons.length;
  }
  if (selected === "none") {
    return 0;
  }
  const idx = dungeons.findIndex(
    (dungeon) => String(dungeon.id || "") === selected,
  );
  if (idx < 0) return dungeons.length;
  return idx + 1;
}

function getDungeonCompletionLabel(model, selectedDungeonId) {
  const selected = String(selectedDungeonId || "all");
  if (selected === "none") return "None";
  if (selected === "all") return "All available";
  const dungeon = (model?.dungeons || []).find(
    (entry) => String(entry.id || "") === selected,
  );
  return dungeon?.name || "All available";
}

function buildItemSourceGateIndex(model) {
  const index = new Map();
  const addGate = (itemId, level) => {
    const numeric = Number(level || 0);
    if (!itemId || numeric <= 0) return;
    const current = Number(index.get(itemId) || 0);
    if (current <= 0 || numeric < current) {
      index.set(itemId, numeric);
    }
  };

  const skillRecipes = model?.skillFile?.ARTISAN_RECIPES || {};
  const itemDefs = model?.itemFile?.ITEMS || {};
  for (const entries of Object.values(skillRecipes)) {
    for (const recipe of entries || []) {
      const recipeLevel = Number(recipe.level || 0);
      const outputs = [
        recipe.produces,
        recipe.item_yield,
        recipe.itemYield,
        recipe.item,
        recipe.burn_produces,
      ];
      for (const outputId of outputs) {
        addGate(outputId, recipeLevel);
      }
    }
  }

  for (const [itemId, itemDef] of Object.entries(itemDefs)) {
    const hint = String(itemDef?.source_hint || "");
    const levelMatch = hint.match(/\bLv\.?\s*(\d{1,3})\b/i);
    if (levelMatch) {
      addGate(itemId, Number(levelMatch[1] || 0));
    }
  }

  const pools = [
    model?.monsterFile?._monster_defs_data || {},
    model?.monsterFile?._shadow_target_defs_data || {},
  ];
  for (const pool of pools) {
    for (const monster of Object.values(pool)) {
      const sourceLevel =
        Number(monster.level || 0) || monsterCombatLevel(monster);
      for (const drop of monster.drops || []) {
        addGate(drop.item, sourceLevel);
      }
    }
  }

  return index;
}

function pickBestRouteRow(rows, priority) {
  if (!rows.length) {
    return null;
  }
  if (priority === "xp") {
    return [...rows].sort(
      (left, right) =>
        Number(right.xpPerHour || 0) - Number(left.xpPerHour || 0),
    )[0];
  }
  if (priority === "gp") {
    return [...rows].sort(
      (left, right) =>
        Number(right.gpPerHour || 0) - Number(left.gpPerHour || 0),
    )[0];
  }

  const maxXp = Math.max(...rows.map((row) => Number(row.xpPerHour || 0)), 1);
  const maxGp = Math.max(...rows.map((row) => Number(row.gpPerHour || 0)), 1);
  return [...rows].sort((left, right) => {
    const leftScore =
      Number(left.xpPerHour || 0) / maxXp + Number(left.gpPerHour || 0) / maxGp;
    const rightScore =
      Number(right.xpPerHour || 0) / maxXp +
      Number(right.gpPerHour || 0) / maxGp;
    return rightScore - leftScore;
  })[0];
}

function killsToReachChance(singleChance, targetChance) {
  const chance = Number(singleChance || 0);
  const target = Number(targetChance || 0);
  if (chance <= 0) {
    return Number.POSITIVE_INFINITY;
  }
  if (chance >= 1) {
    return 1;
  }
  if (target <= 0) {
    return 1;
  }
  if (target >= 1) {
    return Number.POSITIVE_INFINITY;
  }
  return Math.ceil(Math.log(1 - target) / Math.log(1 - chance));
}

function plannerRow(label, value) {
  return `<div class="planner-row"><strong>${escapeHtml(label)}:</strong> <span>${escapeHtml(String(value))}</span></div>`;
}

function renderCard(entry, index) {
  const cardKey = `${entry.section}:${entry.id}`;
  const compact = state.compactCards && !state.expandedCards[cardKey];
  const card = document
    .getElementById("card-template")
    .content.firstElementChild.cloneNode(true);
  if (compact) {
    card.classList.add("collapsed");
  }
  card.style.animationDelay = `${Math.min(index, 12) * 35}ms`;
  card.querySelector(".card-kind").textContent = entry.kind;
  card.querySelector(".card-title").textContent = entry.title;
  const head = card.querySelector(".card-head");
  head.insertAdjacentHTML(
    "beforeend",
    `<button class="card-toggle" type="button" data-card-key="${escapeHtml(cardKey)}">${compact ? "Expand" : "Collapse"}</button>`,
  );
  const badges = card.querySelector(".card-badges");
  badges.innerHTML = [
    ...(entry.badges || []).map(
      (badge) =>
        `<span class="badge ${badge === "spoiler" ? "warn" : ""}">${escapeHtml(String(badge))}</span>`,
    ),
    entry.spoiler && !state.revealSpoilers
      ? `<span class="badge warn">spoiler</span>`
      : null,
  ]
    .filter(Boolean)
    .join("");

  const body = card.querySelector(".card-body");
  body.innerHTML = `
    <div class="grid-2">
      <div class="stat-box"><strong>${escapeHtml(entry.subtitle || entry.kind)}</strong><span>${escapeHtml(entry.id)}</span></div>
      <div class="stat-box"><strong>Tags</strong><span>${escapeHtml((entry.tags || []).filter(Boolean).join(" · ") || "-")}</span></div>
    </div>
    ${renderMetricGrid(entry.metrics || [])}
    <div class="spoiler-body ${entry.spoiler && !state.revealSpoilers ? "hidden" : ""}">${entry.body}</div>
    ${entry.spoiler && !state.revealSpoilers ? `<p class="helper">Spoiler content hidden. Enable reveal spoilers to inspect the full entry.</p>` : ""}
  `;
  return card.outerHTML;
}

function renderMetricGrid(metrics) {
  if (!metrics.length) {
    return "";
  }
  return `<div class="grid-3">${metrics
    .map(
      (metric) => `
    <div class="data-box"><strong>${escapeHtml(String(metric.label))}</strong> <span>${escapeHtml(String(metric.value))}</span></div>
  `,
    )
    .join("")}</div>`;
}

function renderGenericObject(object, itemFile, heading) {
  const rows = Object.entries(object || {}).map(([key, value]) => [
    key,
    renderValue(value, itemFile),
  ]);
  return `${renderKeyedTable(heading, rows)}`;
}

function renderKeyedTable(title, rows) {
  if (!rows || rows.length === 0) {
    return `<p class="muted">No ${escapeHtml(title.toLowerCase())} available.</p>`;
  }
  return `
    <div class="details">
      <details open>
        <summary>${escapeHtml(title)}</summary>
        <div class="details-body">
          <table class="raw-table">
            <tbody>
              ${rows.map(([key, value]) => `<tr><th data-label="Field">${escapeHtml(String(key))}</th><td data-label="Value">${value}</td></tr>`).join("")}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  `;
}

function renderSimpleTable(title, headings, rows, { open = true } = {}) {
  if (!rows || !rows.length) {
    return "";
  }
  return `
    <div class="details">
      <details ${open || state.revealSpoilers ? "open" : ""}>
        <summary>${escapeHtml(title)}</summary>
        <div class="details-body">
          <table class="raw-table">
            <thead><tr>${headings
              .map((heading) => `<th>${escapeHtml(String(heading))}</th>`)
              .join("")}</tr></thead>
            <tbody>${rows
              .map(
                (row) =>
                  `<tr>${row
                    .map(
                      (cell, columnIndex) =>
                        `<td data-label="${escapeHtml(String(headings[columnIndex] ?? ""))}">${escapeHtml(String(cell ?? "-"))}</td>`,
                    )
                    .join("")}</tr>`,
              )
              .join("")}</tbody>
          </table>
        </div>
      </details>
    </div>
  `;
}

function renderDetailBlock(title, lines) {
  const safeLines = (lines || []).filter(
    (line) => line !== null && line !== undefined && String(line).trim() !== "",
  );
  if (!safeLines.length) {
    return "";
  }
  return `
    <div class="details">
      <details ${state.revealSpoilers ? "open" : ""}>
        <summary>${escapeHtml(title)}</summary>
        <div class="details-body list-stack">
          ${safeLines.map((line) => `<p class="quote">${escapeHtml(String(line))}</p>`).join("")}
        </div>
      </details>
    </div>
  `;
}

function renderStatSummary(label, title, value) {
  return `
    <div class="note-box">
      <strong>${escapeHtml(label)}</strong>
      <span>${escapeHtml(title)} · ${escapeHtml(String(value))}</span>
    </div>
  `;
}

function renderEfficiencyTable(title, rows, headings) {
  if (!rows.length) {
    return "";
  }
  return `
    <div class="details">
      <details ${state.revealSpoilers ? "open" : ""}>
        <summary>${escapeHtml(title)}</summary>
        <div class="details-body">
          <table class="raw-table">
            <thead>
              <tr>${headings.map((heading) => `<th>${escapeHtml(heading)}</th>`).join("")}</tr>
            </thead>
            <tbody>
              ${rows.map((row) => renderEfficiencyRow(row, headings)).join("")}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  `;
}

function renderEfficiencyRow(row, headings) {
  const values = [];
  for (const heading of headings) {
    const normalized = heading.toLowerCase();
    if (normalized === "tier") values.push(row.tier ?? "-");
    else if (normalized === "objective") values.push(row.objective ?? "-");
    else if (normalized === "reward") values.push(row.rewardText ?? "-");
    else if (normalized === "region") values.push(row.region ?? "-");
    else if (normalized === "adventurer") values.push(row.advReq ?? "-");
    else if (normalized === "player") values.push(row.player ?? "-");
    else if (normalized === "recipe") values.push(row.recipe ?? "-");
    else if (normalized === "level") values.push(row.level ?? "-");
    else if (normalized === "xp") values.push(row.xp ?? "-");
    else if (normalized === "xp/action") values.push(row.xp ?? "-");
    else if (normalized === "seconds") values.push(row.seconds ?? "-");
    else if (normalized === "output")
      values.push(row.itemName || row.outputName || row.name || "-");
    else if (normalized === "input cost")
      values.push(
        row.inputCost !== undefined ? `${formatNumber(row.inputCost)} gp` : "-",
      );
    else if (normalized === "profit/action")
      values.push(
        row.profitPerAction !== undefined
          ? `${formatNumber(row.profitPerAction)} gp`
          : "-",
      );
    else if (normalized === "xp/hr")
      values.push(`${formatNumber(row.xpPerHour)} XP/hr`);
    else if (normalized === "gp/hr")
      values.push(`${formatNumber(row.gpPerHour)} gp/hr`);
    else if (normalized === "gp/xp") values.push(formatDecimal(row.gpPerXp));
    else if (normalized === "chance")
      values.push(row.chance ? formatPercent(row.chance) : "-");
    else if (normalized === "qty") values.push(`${row.qtyMin}-${row.qtyMax}`);
    else values.push(String(row[normalized] ?? row[heading] ?? "-"));
  }
  return `<tr>${values.map((value, index) => `<td data-label="${escapeHtml(headings[index])}">${escapeHtml(String(value))}</td>`).join("")}</tr>`;
}

function scrollToCategorySection(category) {
  // Picking a specific category should bring its section into view, past the
  // hero, filters, and planner tools that sit above the content list.
  if (!category || category === "all") {
    return;
  }
  // Defer to the next frame so the freshly-rendered section exists in the DOM.
  requestAnimationFrame(() => {
    const target = document.getElementById(`section-${category}`);
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  });
}

function populateCategories() {
  const current = dom.category.value || "all";
  const options = [
    { value: "all", label: "All" },
    ...SECTION_ORDER.map(([section, label]) => ({ value: section, label })),
  ];
  dom.category.innerHTML = options
    .map(
      (option) =>
        `<option value="${option.value}">${escapeHtml(option.label)}</option>`,
    )
    .join("");
  dom.category.value = current;
}

function getMobileJumpOptions(model) {
  const options = [{ value: "", label: "Jump to..." }];
  const baseSections = SECTION_ORDER.map(([section, label]) => ({
    value: `section-${section}`,
    label,
  }));

  const jumpTargets = baseSections
    .filter(
      (entry) =>
        entry.value !== "section-vendors" ||
        Number(model?.vendors?.length || 0) > 0,
    )
    .slice()
    .sort((left, right) => left.label.localeCompare(right.label));
  options.push(...jumpTargets);
  return options;
}

function combatXpDistribution(monsterHp, style) {
  const hpDamage = Math.max(1, Math.round(Number(monsterHp || 1)));
  const xp = { attack: 0, strength: 0, defence: 0, magic: 0, hp: 0 };
  switch (style) {
    case "attack":
      xp.attack = hpDamage * 6;
      break;
    case "strength":
      xp.strength = hpDamage * 6;
      break;
    case "defence":
      xp.defence = hpDamage * 6;
      break;
    case "magic":
      xp.magic = hpDamage * 6;
      break;
    default: {
      xp.attack = hpDamage * 2;
      xp.strength = hpDamage * 2;
      xp.defence = hpDamage * 2;
    }
  }
  xp.hp = hpDamage * 2;
  return xp;
}

function monsterCombatLevel(monster) {
  const level =
    Number(monster.atk_lv || 0) * 0.3 +
    Number(monster.def_lv || 0) * 0.3 +
    Number(monster.hp_lv || 0) * 0.2 +
    Number(monster.magic_lv || 0) * 0.15;
  return Math.max(1, Math.round(level));
}

// ── Fracture Arts spells ─────────────────────────────────────────────
// Spells carry their own power / accuracy as of 1.0.9. Both are read straight
// off the exported data so the planner cannot drift from the game's own
// GameState.spell_profile() resolver.
function getSpellList() {
  const nodes =
    state.data?.sources?.["client/data/SkillData.gd"]?.consts
      ?.GATHERING_NODES?.magic;
  return Array.isArray(nodes) ? nodes : [];
}

// Fills the planner's spell dropdown from the exported spell list and keeps
// state.playerSpellId pointing at a spell that actually exists.
function syncSpellSelect() {
  const spells = getSpellList();
  if (!dom.playerSpell || !spells.length) {
    return;
  }
  const known = new Set(spells.map((spell) => String(spell.id)));
  if (!known.has(String(state.playerSpellId || ""))) {
    state.playerSpellId = known.has(DEFAULT_SPELL_ID)
      ? DEFAULT_SPELL_ID
      : String(spells[0].id);
  }
  const signature = spells.map((spell) => spell.id).join("|");
  if (dom.playerSpell.dataset.signature !== signature) {
    dom.playerSpell.innerHTML = spells
      .map(
        (spell) =>
          `<option value="${escapeHtml(String(spell.id))}">${escapeHtml(
            `${spell.name || spell.id} (Lv ${Number(spell.level || 1)}, ${formatDecimal(Number(spell.power || 1))}x)`,
          )}</option>`,
      )
      .join("");
    dom.playerSpell.dataset.signature = signature;
  }
  dom.playerSpell.value = String(state.playerSpellId);
}

function getSpellById(spellId) {
  const spells = getSpellList();
  return (
    spells.find((spell) => String(spell.id) === String(spellId)) ||
    spells.find((spell) => String(spell.id) === DEFAULT_SPELL_ID) ||
    null
  );
}

function getPlayerCombatProfile() {
  const combatStyle = PLAYER_COMBAT_STYLES.has(
    String(state.playerCombatStyle || "balanced"),
  )
    ? String(state.playerCombatStyle || "balanced")
    : "balanced";
  const spell = getSpellById(state.playerSpellId);
  return {
    combatStyle,
    spellId: spell ? String(spell.id) : DEFAULT_SPELL_ID,
    spellName: spell?.name || "Pale Flicker",
    spellPower: Math.max(0.1, Number(spell?.power ?? 1)),
    spellAccuracy: Number(spell?.accuracy ?? 0),
    attack: clampNumber(state.playerAttackLevel, 1, SKILL_LEVEL_CAP, 1),
    strength: clampNumber(state.playerStrengthLevel, 1, SKILL_LEVEL_CAP, 1),
    defence: clampNumber(state.playerDefenceLevel, 1, SKILL_LEVEL_CAP, 1),
    magic: clampNumber(state.playerMagicLevel, 1, SKILL_LEVEL_CAP, 1),
    hitpoints: clampNumber(state.playerHitpointsLevel, 1, SKILL_LEVEL_CAP, 10),
    atkBonus: clampNumber(state.playerAtkGearBonus, 0, 999, 0),
    strBonus: clampNumber(state.playerStrGearBonus, 0, 999, 0),
    defBonus: clampNumber(state.playerDefGearBonus, 0, 999, 0),
    magBonus: clampNumber(state.playerMagGearBonus, 0, 999, 0),
    combatDamageBonusPct: clampNumber(
      state.playerCombatDamageBonusPct,
      0,
      300,
      0,
    ),
    attackMasteryHitBonusPct: clampNumber(
      state.playerAttackMasteryHitBonusPct,
      0,
      100,
      0,
    ),
    strengthMasteryMaxHitBonusPct: clampNumber(
      state.playerStrengthMasteryMaxHitBonusPct,
      0,
      300,
      0,
    ),
    magicMasteryHitBonusPct: clampNumber(
      state.playerMagicMasteryHitBonusPct,
      0,
      100,
      0,
    ),
    magicMasteryMaxHitBonusPct: clampNumber(
      state.playerMagicMasteryMaxHitBonusPct,
      0,
      300,
      0,
    ),
    combatTickSeconds: clampNumber(state.playerCombatTickSeconds, 0.1, 10, 1.2),
    skillXpBonusBySkill: parseSkillXpBonusMap(
      JSON.stringify(
        isPlainObject(state.skillXpBonusBySkill)
          ? state.skillXpBonusBySkill
          : {},
      ),
    ),
    sellPriceBonusPct: clampNumber(state.sellPriceBonusPct, -100, 10000, 0),
    combatGoldBonusPct: clampNumber(state.combatGoldBonusPct, -100, 10000, 0),
    artisanMaterialDropBonusPct: clampNumber(
      state.artisanMaterialDropBonusPct,
      -100,
      10000,
      0,
    ),
    resonanceCrystalDropBonusPct: clampNumber(
      state.resonanceCrystalDropBonusPct,
      -100,
      10000,
      0,
    ),
  };
}

function getStyleAttackBonus(style) {
  if (style === "attack") return 3;
  if (style === "balanced") return 1;
  return 0;
}

function getStyleStrengthBonus(style) {
  if (style === "strength") return 3;
  if (style === "balanced") return 1;
  return 0;
}

function getStyleDefenceBonus(style) {
  if (style === "defence") return 3;
  if (style === "balanced") return 1;
  return 0;
}

function parseSkillXpBonusMap(raw) {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(String(raw));
    if (!isPlainObject(parsed)) return {};
    const out = {};
    for (const [skillId, pct] of Object.entries(parsed)) {
      const normalized = Number(pct);
      if (!Number.isFinite(normalized)) continue;
      out[String(skillId)] = clampNumber(normalized, -100, 10000, 0);
    }
    return out;
  } catch (_error) {
    return {};
  }
}

function getSkillXpBonusPct(profile, skillId) {
  const map = profile?.skillXpBonusBySkill || {};
  return Number(map?.[skillId] || 0);
}

function applySkillXpBonus(profile, skillId, baseXp) {
  const bonusPct = getSkillXpBonusPct(profile, skillId);
  return Number(baseXp || 0) * (1 + bonusPct / 100);
}

function combatXpPerKillWithBonuses(monsterHp, style, profile) {
  const distribution = combatXpDistribution(monsterHp, style);
  let total = 0;
  for (const [skillId, baseXp] of Object.entries(distribution)) {
    total += applySkillXpBonus(profile, skillId, baseXp);
  }
  return total;
}

function effectivePriceWithSellBonus(basePrice, profile) {
  const base = Number(basePrice || 0);
  const sellBonusPct = Number(profile?.sellPriceBonusPct || 0);
  return base * (1 + sellBonusPct / 100);
}

function isArtisanMaterialItem(itemId, itemFile) {
  const category = String(
    itemFile?.ITEMS?.[itemId]?.category || "",
  ).toLowerCase();
  return [
    "ore",
    "log",
    "fish",
    "spirit",
    "sigil",
    "bar",
    "material",
    "spirit_craft",
  ].includes(category);
}

function adjustedMonsterDropChance(itemId, baseChance, itemFile, profile) {
  let chance = clampNumber(baseChance, 0, 1, 0);
  if (String(itemId) === "resonance_crystal") {
    chance *= 1 + Number(profile?.resonanceCrystalDropBonusPct || 0) / 100;
  }
  if (isArtisanMaterialItem(itemId, itemFile)) {
    chance *= 1 + Number(profile?.artisanMaterialDropBonusPct || 0) / 100;
  }
  return clampNumber(chance, 0, 1, 0);
}

function hitChance(attRoll, defRoll) {
  const attacker = Math.max(1, Number(attRoll || 1));
  const defender = Math.max(1, Number(defRoll || 1));
  let chance = 0;
  if (attacker > defender) {
    chance = 1 - (defender + 2) / (2 * (attacker + 1));
  } else {
    chance = attacker / (2 * (defender + 1));
  }
  return clampNumber(chance, 0.05, 0.95, 0.05);
}

function playerAttackRoll(profile) {
  const style = String(profile.combatStyle || "balanced");
  const attackLevel =
    Number(profile.attack || 1) + Number(getStyleAttackBonus(style));
  const attackBonus = Number(profile.atkBonus || 0);
  return Math.max(1, Math.floor(((attackLevel + 8) * (64 + attackBonus)) / 64));
}

function playerMagicAttackRoll(profile) {
  const magicLevel = Number(profile.magic || 1);
  const magicBonus = Number(profile.magBonus || 0);
  return Math.max(1, Math.floor(((magicLevel + 8) * (64 + magicBonus)) / 64));
}

function playerMaxMeleeHit(profile) {
  const style = String(profile.combatStyle || "balanced");
  const strengthLevel =
    Number(profile.strength || 1) + Number(getStyleStrengthBonus(style));
  const strengthBonus = Number(profile.strBonus || 0);
  let maxHit = Math.max(
    1,
    Math.floor(1 + strengthLevel * 0.35 + strengthBonus * 0.45),
  );
  if (style === "strength") {
    const strengthMasteryBonus =
      Number(profile.strengthMasteryMaxHitBonusPct || 0) / 100;
    if (strengthMasteryBonus > 0) {
      maxHit = Math.max(1, Math.round(maxHit * (1 + strengthMasteryBonus)));
    }
  }
  const combatDamageBonus = Number(profile.combatDamageBonusPct || 0) / 100;
  if (combatDamageBonus > 0) {
    maxHit = Math.max(1, Math.round(maxHit * (1 + combatDamageBonus)));
  }
  return maxHit;
}

function playerMagicDamageRange(profile) {
  const magic = Number(profile.magic || 1) + Number(profile.magBonus || 0);
  let maxHit = Math.max(2, Math.floor(1 + magic * 0.35));
  let minHit = Math.max(1, Math.floor(maxHit / 3));
  // Spell power sits ahead of the gear/mastery multipliers, matching
  // GameState._player_damage_range() so all three compound the same way.
  const spellPower = Math.max(0.1, Number(profile.spellPower ?? 1));
  if (spellPower !== 1) {
    minHit = Math.max(1, Math.round(minHit * spellPower));
    maxHit = Math.max(minHit + 1, Math.round(maxHit * spellPower));
  }
  const combatDamageBonus = Number(profile.combatDamageBonusPct || 0) / 100;
  if (combatDamageBonus > 0) {
    minHit = Math.max(1, Math.round(minHit * (1 + combatDamageBonus)));
    maxHit = Math.max(minHit + 1, Math.round(maxHit * (1 + combatDamageBonus)));
  }
  const magicMasteryBonus =
    Number(profile.magicMasteryMaxHitBonusPct || 0) / 100;
  if (magicMasteryBonus > 0) {
    minHit = Math.max(1, Math.round(minHit * (1 + magicMasteryBonus)));
    maxHit = Math.max(minHit + 1, Math.round(maxHit * (1 + magicMasteryBonus)));
  }
  return { minHit, maxHit };
}

function monsterDefenceRoll(monster) {
  const defenceLevel = Number(monster?.melee_defence ?? monster?.defence ?? 1);
  return Math.max(
    1,
    Math.floor(((defenceLevel + 8) * (64 + defenceLevel)) / 64),
  );
}

function monsterMagicDefenceRoll(monster) {
  const magicDefence = Number(monster?.magic_defence ?? monster?.defence ?? 1);
  return Math.max(
    1,
    Math.floor(((magicDefence + 8) * (64 + magicDefence)) / 64),
  );
}

function estimateMonsterKillsPerHour(monster, playerCombatProfile) {
  const profile = playerCombatProfile || {
    combatStyle: "balanced",
    attack: 1,
    strength: 1,
    defence: 1,
    magic: 1,
    hitpoints: 10,
  };
  const style = String(profile.combatStyle || "balanced");
  const monsterHp = Math.max(1, Number(monster?.hp || 1));
  let chance = 0.05;
  let averageDamageOnHit = 1;

  if (style === "magic") {
    const attRoll = playerMagicAttackRoll(profile);
    const defRoll = monsterMagicDefenceRoll(monster);
    chance = hitChance(attRoll, defRoll);
    const magicHitBonus = Number(profile.magicMasteryHitBonusPct || 0) / 100;
    const spellAccuracy = Number(profile.spellAccuracy || 0);
    chance = clampNumber(
      chance + magicHitBonus + spellAccuracy,
      0.05,
      0.99,
      0.05,
    );
    const range = playerMagicDamageRange(profile);
    averageDamageOnHit = (range.minHit + range.maxHit) / 2;
  } else {
    const attRoll = playerAttackRoll(profile);
    const defRoll = monsterDefenceRoll(monster);
    chance = hitChance(attRoll, defRoll);
    if (style === "attack") {
      const attackHitBonus =
        Number(profile.attackMasteryHitBonusPct || 0) / 100;
      chance = clampNumber(chance + attackHitBonus, 0.05, 0.99, 0.05);
    }
    const maxHit = playerMaxMeleeHit(profile);
    averageDamageOnHit = (1 + maxHit) / 2;
  }

  const expectedDamagePerTick = Math.max(0.01, chance * averageDamageOnHit);
  const ticksToKill = monsterHp / expectedDamagePerTick;
  const tickSeconds = Math.max(0.1, Number(profile.combatTickSeconds || 1.2));
  const cycleSeconds = (ticksToKill + GAME_RESPAWN_TICKS) * tickSeconds;
  if (cycleSeconds <= 0) {
    return 0;
  }
  return 3600 / cycleSeconds;
}

function formatCombatXp(totalXp) {
  return `${formatNumber(totalXp)} XP`;
}

function buildItemLoreFallback(info) {
  return `${info.name || "This item"} belongs to ${info.category || "its"} line of equipment.`;
}

function synthesizeItemLore(
  info,
  sources,
  recipeSources,
  monsterSources,
  dungeonSources,
) {
  const chunks = [];
  if (info.source_hint) {
    chunks.push(
      info.source_hint.replace(/^Store\s+-\s*/, "Issued through the store as "),
    );
  }
  if (recipeSources.length) {
    chunks.push(`Crafted or produced through ${recipeSources.join(", ")}.`);
  }
  if (monsterSources.length) {
    chunks.push(`Known to drop from ${monsterSources.join(", ")}.`);
  }
  if (dungeonSources.length) {
    chunks.push(`Bound to dungeon rewards from ${dungeonSources.join(", ")}.`);
  }
  if (!chunks.length) {
    chunks.push(buildItemLoreFallback(info));
  }
  return chunks.join(" ");
}

function addIndexValue(index, key, value) {
  if (!index.has(key)) {
    index.set(key, []);
  }
  index.get(key).push(value);
}

function collectKeyedTables(sourceFile, key) {
  const rows = [];
  for (const [tableName, tableValue] of Object.entries(sourceFile || {})) {
    if (
      isPlainObject(tableValue) &&
      Object.prototype.hasOwnProperty.call(tableValue, key)
    ) {
      rows.push([tableName, renderValue(tableValue[key])]);
    }
  }
  return rows;
}

function findItemIdsInObject(value, itemIds, seen = new Set()) {
  const matches = new Set();
  if (value === null || value === undefined) {
    return matches;
  }
  if (typeof value === "string") {
    if (itemIds.includes(value)) {
      matches.add(value);
    }
    return matches;
  }
  if (typeof value !== "object") {
    return matches;
  }
  if (seen.has(value)) {
    return matches;
  }
  seen.add(value);
  if (Array.isArray(value)) {
    for (const item of value) {
      for (const match of findItemIdsInObject(item, itemIds, seen)) {
        matches.add(match);
      }
    }
    return matches;
  }
  for (const child of Object.values(value)) {
    for (const match of findItemIdsInObject(child, itemIds, seen)) {
      matches.add(match);
    }
  }
  return matches;
}

function renderValue(value, itemFile) {
  if (value === null || value === undefined) {
    return "<span class='muted'>-</span>";
  }
  if (typeof value === "string") {
    return escapeHtml(value);
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return escapeHtml(String(value));
  }
  if (Array.isArray(value)) {
    if (value.length === 0) {
      return "<span class='muted'>[]</span>";
    }
    return `<ul class="list-stack">${value.map((item) => `<li class="quote">${renderValue(item, itemFile)}</li>`).join("")}</ul>`;
  }
  if (isPlainObject(value)) {
    const entries = Object.entries(value);
    return `<div class="list-stack">${entries.map(([key, child]) => `<div><strong>${escapeHtml(key)}</strong>: ${renderValue(child, itemFile)}</div>`).join("")}</div>`;
  }
  return escapeHtml(String(value));
}

function renderKeyedObjectAsTable(entries) {
  return `<table class="raw-table"><tbody>${entries.map(([key, value]) => `<tr><th>${escapeHtml(String(key))}</th><td>${escapeHtml(String(value))}</td></tr>`).join("")}</tbody></table>`;
}

function isPlainObject(value) {
  return value && typeof value === "object" && !Array.isArray(value);
}

function normalizeSearchText(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function collectSearchText(value, seen = new Set()) {
  if (value === null || value === undefined) {
    return "";
  }
  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return String(value);
  }
  if (typeof value !== "object" || seen.has(value)) {
    return "";
  }
  seen.add(value);
  if (Array.isArray(value)) {
    return value.map((item) => collectSearchText(item, seen)).join(" ");
  }
  return Object.entries(value)
    .map(([key, child]) => `${key} ${collectSearchText(child, seen)}`)
    .join(" ");
}

function groupBy(items, getter) {
  const groups = new Map();
  for (const item of items) {
    const key = getter(item);
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key).push(item);
  }
  return groups;
}

function average(a, b) {
  return (Number(a || 0) + Number(b || 0)) / 2;
}

function formatNumber(value) {
  return NUMBER.format(Math.round(Number(value || 0)));
}

function formatDecimal(value) {
  return DECIMAL.format(Number(value || 0));
}

function formatPercent(value) {
  return PERCENT.format(Number(value || 0));
}

// Per-level affinity rates are fractions of a percent (0.0035 -> 0.35%), which
// the 1-decimal PERCENT formatter would round away.
function formatSmallPercent(value) {
  return PRECISE_PERCENT.format(Number(value || 0));
}

function formatAtLeastOneChance(totalChance, singleChance) {
  const normalizedTotal = Number(totalChance || 0);
  const normalizedSingle = Number(singleChance || 0);
  if (normalizedSingle >= 1) {
    return formatPercent(1);
  }
  const capped = Math.min(0.999, Math.max(0, normalizedTotal));
  return formatPercent(capped);
}

function clampNumber(value, min, max, fallback) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }
  return Math.min(max, Math.max(min, parsed));
}

function formatDuration(hoursFloat) {
  if (!Number.isFinite(hoursFloat) || hoursFloat <= 0) {
    return "0h";
  }
  const totalMinutes = Math.round(hoursFloat * 60);
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;
  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  return parts.join(" ");
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function capitalize(value) {
  return String(value)
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function getBuildFocusLabel(focus) {
  if (focus === "attack") return "Melee - Offence Optimized";
  if (focus === "defence") return "Melee - Defence Optimized";
  if (focus === "magic") return "Fracture Arts";
  return "Melee - Offence Optimized";
}

function applyPlannerTabState() {
  const cards = [...document.querySelectorAll(".planner-card[data-tab]")];
  const tabButtons = [...document.querySelectorAll(".planner-tab[data-tab]")];
  const isMobile = window.matchMedia("(max-width: 720px)").matches;

  for (const card of cards) {
    const tab = card.dataset.tab || "";
    if (isMobile) {
      card.classList.toggle("active-mobile", tab === state.activePlannerTab);
    } else {
      card.classList.remove("active-mobile");
    }
  }

  for (const button of tabButtons) {
    button.classList.toggle(
      "active",
      button.dataset.tab === state.activePlannerTab,
    );
  }

  if (dom.leaderboards) {
    const focusedTabs = new Set(["compare", "diag"]);
    const hideForFocus = isMobile && focusedTabs.has(state.activePlannerTab);
    dom.leaderboards.classList.toggle("hidden", hideForFocus);
  }
}

function handleQuickNav(action) {
  if (action === "planners") {
    scrollToTarget("planner-tabs");
    return;
  }
  if (action === "filters") {
    scrollToTarget("search");
    dom.category?.focus();
    return;
  }
  if (action === "share") {
    void shareCurrentStateFromNav();
    return;
  }
  if (action === "reset") {
    resetPlannerStateToDefaults();
  }
}

function resetPlannerStateToDefaults() {
  Object.assign(state, {
    playerCombatStyle: "balanced",
    playerSpellId: DEFAULT_SPELL_ID,
    playerAttackLevel: 1,
    playerStrengthLevel: 1,
    playerDefenceLevel: 1,
    playerMagicLevel: 1,
    playerHitpointsLevel: 10,
    playerAtkGearBonus: 0,
    playerStrGearBonus: 0,
    playerDefGearBonus: 0,
    playerMagGearBonus: 0,
    playerCombatDamageBonusPct: 0,
    playerAttackMasteryHitBonusPct: 0,
    playerStrengthMasteryMaxHitBonusPct: 0,
    playerMagicMasteryHitBonusPct: 0,
    playerMagicMasteryMaxHitBonusPct: 0,
    playerCombatTickSeconds: 1.2,
    skillXpBonusBySkill: {},
    sellPriceBonusPct: 0,
    combatGoldBonusPct: 0,
    artisanMaterialDropBonusPct: 0,
    resonanceCrystalDropBonusPct: 0,
    xpCurrentLevel: 1,
    xpTargetLevel: 50,
    xpRate: 25000,
    dropMonsterId: "",
    dropItemId: "",
    dropKills: 100,
    dropTargetQty: 10,
    dropKillRate: 80,
    affordItemId: "",
    affordGpRate: 100000,
    affordQty: 1,
    routeSkill: "",
    routeCurrentLevel: 1,
    routeTargetLevel: 60,
    routePriority: "xp",
    compareA: "",
    compareB: "",
    compareXpGoal: 100000,
    buildFocus: "attack",
    buildBudget: 250000,
    buildGpRate: 100000,
    buildAttackLevel: 1,
    buildDefenceLevel: 1,
    buildMagicLevel: 1,
    buildDungeonCompletion: "all",
    simXpRate: 25000,
    simGpRate: 100000,
    farmRouteXpTarget: 150000,
    farmRouteGpTarget: 250000,
    farmRouteMaxSteps: 4,
    farmRouteSkillFilter: "all",
    activePlannerTab: "xp",
  });

  initializePlannerState();
  render();
}

function scrollToTarget(targetId) {
  const el = document.getElementById(targetId);
  if (!el) return;
  el.scrollIntoView({ behavior: "smooth", block: "start" });
}

async function shareCurrentStateFromNav() {
  const url = window.location.href;
  let feedback = "Share failed";
  try {
    if (navigator.share) {
      await navigator.share({ title: "Kaldreth Wiki Planner", url });
      feedback = "Shared";
    } else if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(url);
      feedback = "Copied";
    } else {
      window.prompt("Copy this planner link:", url);
      feedback = "Copy Link";
    }
  } catch (_error) {
    feedback = "Share failed";
  }
  showMobileNavFeedback("share", feedback);
}

function showMobileNavFeedback(action, label) {
  const button = document.querySelector(
    `.mobile-nav button[data-nav="${action}"]`,
  );
  if (!button) return;
  const base = button.dataset.baseLabel || button.textContent || "Share";
  button.dataset.baseLabel = base;
  button.textContent = label;
  window.setTimeout(() => {
    button.textContent = button.dataset.baseLabel || base;
  }, 1600);
}

function getPresetSnapshot() {
  return {
    playerCombatStyle: state.playerCombatStyle,
    playerSpellId: state.playerSpellId,
    playerAttackLevel: state.playerAttackLevel,
    playerStrengthLevel: state.playerStrengthLevel,
    playerDefenceLevel: state.playerDefenceLevel,
    playerMagicLevel: state.playerMagicLevel,
    playerHitpointsLevel: state.playerHitpointsLevel,
    playerAtkGearBonus: state.playerAtkGearBonus,
    playerStrGearBonus: state.playerStrGearBonus,
    playerDefGearBonus: state.playerDefGearBonus,
    playerMagGearBonus: state.playerMagGearBonus,
    playerCombatDamageBonusPct: state.playerCombatDamageBonusPct,
    playerAttackMasteryHitBonusPct: state.playerAttackMasteryHitBonusPct,
    playerStrengthMasteryMaxHitBonusPct:
      state.playerStrengthMasteryMaxHitBonusPct,
    playerMagicMasteryHitBonusPct: state.playerMagicMasteryHitBonusPct,
    playerMagicMasteryMaxHitBonusPct: state.playerMagicMasteryMaxHitBonusPct,
    playerCombatTickSeconds: state.playerCombatTickSeconds,
    skillXpBonusBySkill: state.skillXpBonusBySkill,
    sellPriceBonusPct: state.sellPriceBonusPct,
    combatGoldBonusPct: state.combatGoldBonusPct,
    artisanMaterialDropBonusPct: state.artisanMaterialDropBonusPct,
    resonanceCrystalDropBonusPct: state.resonanceCrystalDropBonusPct,
    xpCurrentLevel: state.xpCurrentLevel,
    xpTargetLevel: state.xpTargetLevel,
    xpRate: state.xpRate,
    dropMonsterId: state.dropMonsterId,
    dropItemId: state.dropItemId,
    dropKills: state.dropKills,
    dropTargetQty: state.dropTargetQty,
    dropKillRate: state.dropKillRate,
    affordItemId: state.affordItemId,
    affordGpRate: state.affordGpRate,
    affordQty: state.affordQty,
    routeSkill: state.routeSkill,
    routeCurrentLevel: state.routeCurrentLevel,
    routeTargetLevel: state.routeTargetLevel,
    routePriority: state.routePriority,
    compareA: state.compareA,
    compareB: state.compareB,
    compareXpGoal: state.compareXpGoal,
    buildFocus: state.buildFocus,
    buildBudget: state.buildBudget,
    buildGpRate: state.buildGpRate,
    buildAttackLevel: state.buildAttackLevel,
    buildDefenceLevel: state.buildDefenceLevel,
    buildMagicLevel: state.buildMagicLevel,
    buildDungeonCompletion: state.buildDungeonCompletion,
    simXpRate: state.simXpRate,
    simGpRate: state.simGpRate,
    farmRouteXpTarget: state.farmRouteXpTarget,
    farmRouteGpTarget: state.farmRouteGpTarget,
    farmRouteMaxSteps: state.farmRouteMaxSteps,
    farmRouteSkillFilter: state.farmRouteSkillFilter,
  };
}

function applyPresetSnapshot(snapshot) {
  if (!snapshot || typeof snapshot !== "object") return;
  Object.assign(state, snapshot);
  initializePlannerState();
  render();
}

function loadSavedPresets() {
  try {
    const raw = window.localStorage.getItem(PRESET_STORAGE_KEY);
    state.presets = raw ? JSON.parse(raw) : {};
  } catch (_error) {
    state.presets = {};
  }
}

function persistPresets() {
  try {
    window.localStorage.setItem(
      PRESET_STORAGE_KEY,
      JSON.stringify(state.presets),
    );
  } catch (_error) {
    // Ignore localStorage quota and privacy mode failures.
  }
}

function updatePresetOptions() {
  if (!dom.presetSelect) return;
  const names = Object.keys(state.presets || {}).sort((a, b) =>
    a.localeCompare(b),
  );
  const current = dom.presetSelect.value || "";
  dom.presetSelect.innerHTML = [
    `<option value="">Default</option>`,
    ...names.map(
      (name) =>
        `<option value="${escapeHtml(name)}">${escapeHtml(name)}</option>`,
    ),
  ].join("");
  if (names.includes(current)) {
    dom.presetSelect.value = current;
  }
}

function savePreset(name) {
  if (!name) return;
  state.presets[name] = getPresetSnapshot();
  persistPresets();
  updatePresetOptions();
  if (dom.presetSelect) dom.presetSelect.value = name;
}

function applyPresetByName(name) {
  const snapshot = state.presets?.[name] || null;
  if (!snapshot) return;
  applyPresetSnapshot(snapshot);
}

function deletePreset(name) {
  if (!name || !state.presets?.[name]) return;
  delete state.presets[name];
  persistPresets();
  updatePresetOptions();
  if (dom.presetSelect) dom.presetSelect.value = "";
}

function shiftPlannerTab(direction) {
  const ids = [...document.querySelectorAll(".planner-tab[data-tab]")].map(
    (node) => node.dataset.tab || "",
  );
  if (!ids.length) return;
  const currentIndex = Math.max(0, ids.indexOf(state.activePlannerTab));
  const nextIndex = Math.min(
    ids.length - 1,
    Math.max(0, currentIndex + direction),
  );
  state.activePlannerTab = ids[nextIndex] || ids[0];
  applyPlannerTabState();
}

function initializeTour() {
  try {
    state.tourDone = window.localStorage.getItem(TOUR_STORAGE_KEY) === "1";
  } catch (_error) {
    state.tourDone = false;
  }
  if (state.tourDone) {
    closeTour(false);
    return;
  }
  state.tourStep = 0;
  renderTourStep();
}

function renderTourStep() {
  if (!dom.tourOverlay || !dom.tourTitle || !dom.tourBody || !dom.tourStepLabel)
    return;
  const step =
    TOUR_STEPS[Math.max(0, Math.min(state.tourStep, TOUR_STEPS.length - 1))];
  dom.tourOverlay.removeAttribute("hidden");
  dom.tourStepLabel.textContent = `Quick Tour ${state.tourStep + 1}/${TOUR_STEPS.length}`;
  dom.tourTitle.textContent = step.title;
  dom.tourBody.textContent = step.body;
  if (dom.tourPrev) dom.tourPrev.disabled = state.tourStep === 0;
  if (dom.tourNext)
    dom.tourNext.disabled = state.tourStep >= TOUR_STEPS.length - 1;
}

function closeTour(remember) {
  if (dom.tourOverlay) {
    dom.tourOverlay.setAttribute("hidden", "");
  }
  if (remember) {
    try {
      window.localStorage.setItem(TOUR_STORAGE_KEY, "1");
    } catch (_error) {
      // Ignore localStorage failures.
    }
  }
}
