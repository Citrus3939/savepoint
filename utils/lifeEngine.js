const DEFAULT_STATS = {
  health: 6,
  money: 0,
  happiness: 5,
  knowledge: 0,
  relationships: 0,
};

const STAT_LIMITS = {
  health: { min: 0, max: 10 },
  money: { min: -5, max: 20 },
  happiness: { min: 0, max: 10 },
  knowledge: { min: 0, max: 20 },
  relationships: { min: -5, max: 20 },
};

const YEARLY_EVENT_UNTIL_AGE = 18;
const OLD_AGE_START = 60;
const MAX_AGE = 100;

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function unique(values) {
  return Array.from(new Set((values || []).filter(Boolean)));
}

function clampStat(name, value) {
  const limit = STAT_LIMITS[name] || { min: -999, max: 999 };
  return Math.max(limit.min, Math.min(limit.max, value));
}

function createInitialState(options = {}) {
  return {
    age: 0,
    turn: 0,
    stats: Object.assign({}, DEFAULT_STATS, options.stats || {}),
    tags: unique(options.tags || []),
    activeTalents: unique(options.activeTalents || []),
    ownedAchievements: unique(options.ownedAchievements || []),
    seenEvents: [],
    history: [],
    nextEventId: null,
    ended: false,
    endingTitle: "",
    endingReview: "",
  };
}

function pickActiveTalents(unlockedTalents, random = Math.random, limit = 2) {
  const talents = unique(unlockedTalents || []);
  const pool = talents.slice();
  const picked = [];

  while (pool.length > 0 && picked.length < limit) {
    const index = Math.floor(random() * pool.length);
    picked.push(pool.splice(index, 1)[0]);
  }

  return picked;
}

function hasEvery(source, required) {
  return (required || []).every((item) => (source || []).includes(item));
}

function hasNone(source, blocked) {
  return (blocked || []).every((item) => !(source || []).includes(item));
}

function statsMeetMinimums(stats, minimums) {
  return Object.keys(minimums || {}).every((name) => stats[name] >= minimums[name]);
}

function statsMeetMaximums(stats, maximums) {
  return Object.keys(maximums || {}).every((name) => stats[name] <= maximums[name]);
}

function isEventEligible(event, state, random = Math.random, options = {}) {
  if (!event || state.ended) {
    return false;
  }
  if (!options.ignoreSeen && event.once !== false && state.seenEvents.includes(event.id)) {
    return false;
  }
  if (event.minAge !== undefined && state.age < event.minAge) {
    return false;
  }
  if (event.maxAge !== undefined && state.age > event.maxAge) {
    return false;
  }

  const requires = event.requires || {};
  if (!hasEvery(state.tags, requires.tags)) {
    return false;
  }
  if (!hasNone(state.tags, requires.notTags)) {
    return false;
  }
  if (!hasEvery(state.activeTalents, requires.talents)) {
    return false;
  }
  if (!hasEvery(state.ownedAchievements, requires.achievements)) {
    return false;
  }
  if (!statsMeetMinimums(state.stats, requires.minStats)) {
    return false;
  }
  if (!statsMeetMaximums(state.stats, requires.maxStats)) {
    return false;
  }
  if (event.chance !== undefined && random() > event.chance) {
    return false;
  }

  return true;
}

function weightedPick(events, random = Math.random) {
  const total = events.reduce((sum, event) => sum + Math.max(1, event.priority || 1), 0);
  let roll = random() * total;

  for (const event of events) {
    roll -= Math.max(1, event.priority || 1);
    if (roll <= 0) {
      return event;
    }
  }

  return events[events.length - 1];
}

function getNextEvent(state, events, random = Math.random) {
  if (state.ended) {
    return null;
  }

  if (state.nextEventId) {
    const chainedEvent = events.find((event) => event.id === state.nextEventId);
    if (isEventEligible(chainedEvent, state, random, { ignoreSeen: true })) {
      return chainedEvent;
    }
  }

  const eligible = events.filter((event) => isEventEligible(event, state, random));
  if (eligible.length === 0) {
    return null;
  }

  const highestPriority = Math.max(...eligible.map((event) => event.priority || 1));
  const priorityBand = eligible.filter((event) => (event.priority || 1) >= highestPriority - 20);
  return weightedPick(priorityBand, random);
}

function applyStatChanges(stats, changes) {
  const nextStats = Object.assign({}, stats);

  Object.keys(changes || {}).forEach((name) => {
    nextStats[name] = clampStat(name, (nextStats[name] || 0) + changes[name]);
  });

  return nextStats;
}

function getAchievementById(achievements, id) {
  return achievements.find((achievement) => achievement.id === id);
}

function conditionMatches(condition, state) {
  if (!condition) {
    return false;
  }
  if (!statsMeetMinimums(state.stats, condition.minStats)) {
    return false;
  }
  if (!statsMeetMaximums(state.stats, condition.maxStats)) {
    return false;
  }
  if (!hasEvery(state.tags, condition.tags)) {
    return false;
  }
  if (condition.minAge !== undefined && state.age < condition.minAge) {
    return false;
  }
  return true;
}

function collectAchievements(state, explicitIds, achievements) {
  const unlocked = [];
  const candidates = unique(explicitIds || []);

  achievements.forEach((achievement) => {
    if (conditionMatches(achievement.condition, state)) {
      candidates.push(achievement.id);
    }
  });

  unique(candidates).forEach((id) => {
    if (!state.ownedAchievements.includes(id) && getAchievementById(achievements, id)) {
      unlocked.push(id);
    }
  });

  return unlocked;
}

function getTalentsFromAchievements(achievementIds, achievements) {
  return unique(
    achievementIds
      .map((id) => getAchievementById(achievements, id))
      .filter(Boolean)
      .map((achievement) => achievement.unlockTalent)
  );
}

function getAgeAdvance(state, event, choice) {
  if (state.age < YEARLY_EVENT_UNTIL_AGE) {
    return 1;
  }

  return choice.ageAdvance !== undefined ? choice.ageAdvance : event.ageAdvance || 1;
}

function getNaturalDeathChance(state) {
  if (state.age < OLD_AGE_START) {
    return 0;
  }
  if (state.age >= MAX_AGE) {
    return 1;
  }

  const agePressure = (state.age - OLD_AGE_START) * 0.015;
  const lowHealthPressure = Math.max(0, 6 - state.stats.health) * 0.025;
  return Math.min(0.85, agePressure + lowHealthPressure);
}

function applyChoice(state, event, choice, achievements = [], random = Math.random) {
  const nextState = clone(state);
  const ageAdvance = getAgeAdvance(state, event, choice);
  const tagsToAdd = unique([...(event.addTags || []), ...(choice.addTags || [])]);
  const tagsToRemove = unique(choice.removeTags || []);

  nextState.age += ageAdvance;
  nextState.turn += 1;
  nextState.stats = applyStatChanges(nextState.stats, choice.statChanges);
  nextState.tags = unique(nextState.tags.concat(tagsToAdd)).filter(
    (tag) => !tagsToRemove.includes(tag)
  );
  nextState.seenEvents = unique(nextState.seenEvents.concat(event.id));
  nextState.nextEventId = choice.nextEventId || null;
  nextState.history.push({
    age: state.age,
    eventId: event.id,
    eventTitle: event.title,
    choiceText: choice.text,
  });

  const unlockedAchievements = collectAchievements(
    nextState,
    choice.unlockAchievements,
    achievements
  );
  nextState.ownedAchievements = unique(nextState.ownedAchievements.concat(unlockedAchievements));
  const unlockedTalents = getTalentsFromAchievements(unlockedAchievements, achievements);

  const ending = getEndingIfNeeded(nextState, random);
  if (ending) {
    nextState.ended = true;
    nextState.endingTitle = ending.title;
    nextState.endingReview = ending.review;
  }

  return {
    state: nextState,
    unlockedAchievements,
    unlockedTalents,
  };
}

function getLifeScore(state) {
  const stats = state.stats;
  return (
    state.age +
    stats.health * 3 +
    stats.happiness * 4 +
    stats.knowledge * 3 +
    stats.relationships * 3 +
    stats.money * 2 +
    state.ownedAchievements.length * 8
  );
}

function getEndingIfNeeded(state, random = Math.random) {
  if (state.stats.health <= 0) {
    return {
      title: "生命提前谢幕",
      review: buildReview(state, "你的身体已经无法继续支撑这段人生。"),
    };
  }

  const naturalDeathChance = getNaturalDeathChance(state);
  if (naturalDeathChance >= 1 || random() < naturalDeathChance) {
    return {
      title: "一生落幕",
      review: buildReview(state, "你走完了漫长的一生。"),
    };
  }

  return null;
}

function buildReview(state, opening) {
  const score = getLifeScore(state);
  const highlights = [];

  if (state.stats.knowledge >= 12) {
    highlights.push("你把好奇心变成了理解世界的工具");
  }
  if (state.stats.relationships >= 10) {
    highlights.push("你在人群中留下了许多温暖的连接");
  }
  if (state.stats.money >= 10) {
    highlights.push("你积累了不错的物质基础");
  }
  if (state.stats.happiness >= 8) {
    highlights.push("你经常能在普通日子里找到快乐");
  }
  if (state.tags.includes("wandered_far")) {
    highlights.push("你见过远方，也让远方改变了你");
  }
  if (highlights.length === 0) {
    highlights.push("你的故事没有标准答案，但每个选择都塑造了它");
  }

  return `${opening} 人生评分 ${score}。${highlights.join("；")}。`;
}

module.exports = {
  DEFAULT_STATS,
  STAT_LIMITS,
  YEARLY_EVENT_UNTIL_AGE,
  OLD_AGE_START,
  MAX_AGE,
  createInitialState,
  pickActiveTalents,
  isEventEligible,
  getNextEvent,
  applyChoice,
  getAgeAdvance,
  getNaturalDeathChance,
  getLifeScore,
  buildReview,
};
