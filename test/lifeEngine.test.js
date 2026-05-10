const test = require("node:test");
const assert = require("node:assert/strict");

const engine = require("../utils/lifeEngine");
const { achievements } = require("../data/achievements");

test("nextEventId creates a continuous event", () => {
  const state = engine.createInitialState({
    tags: ["met_friend"],
  });
  state.nextEventId = "follow_up";

  const event = engine.getNextEvent(state, [
    {
      id: "random_event",
      title: "Random",
      minAge: 0,
      priority: 100,
      choices: [],
    },
    {
      id: "follow_up",
      title: "Follow up",
      minAge: 0,
      priority: 1,
      requires: {
        tags: ["met_friend"],
      },
      choices: [],
    },
  ]);

  assert.equal(event.id, "follow_up");
});

test("talents only unlock bound events and do not add stats by themselves", () => {
  const state = engine.createInitialState({
    activeTalents: ["library_door"],
  });

  assert.deepEqual(state.stats, engine.DEFAULT_STATS);
  assert.equal(
    engine.isEventEligible(
      {
        id: "library_event",
        minAge: 0,
        requires: {
          talents: ["library_door"],
        },
      },
      state
    ),
    true
  );
});

test("choices can unlock achievements and story talents", () => {
  const state = engine.createInitialState();
  const event = {
    id: "birth_room",
    title: "Birth",
    minAge: 0,
    ageAdvance: 1,
  };
  const choice = {
    text: "Choose",
    unlockAchievements: ["first_choice"],
  };

  const result = engine.applyChoice(state, event, choice, achievements);

  assert.deepEqual(result.unlockedAchievements, ["first_choice"]);
  assert.deepEqual(result.unlockedTalents, ["sensitive_heart"]);
  assert.equal(result.state.ownedAchievements.includes("first_choice"), true);
});

test("health reaching zero ends the life", () => {
  const state = engine.createInitialState({
    stats: {
      health: 1,
    },
  });
  const event = {
    id: "illness",
    title: "Illness",
    minAge: 0,
    ageAdvance: 1,
  };
  const choice = {
    text: "Ignore it",
    statChanges: {
      health: -2,
    },
  };

  const result = engine.applyChoice(state, event, choice, achievements);

  assert.equal(result.state.ended, true);
  assert.equal(result.state.endingTitle, "生命提前谢幕");
});
