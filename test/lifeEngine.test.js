const test = require("node:test");
const assert = require("node:assert/strict");

const engine = require("../utils/lifeEngine");
const { achievements } = require("../data/achievements");
const { events } = require("../data/events");

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

test("life advances one year per event before age 18", () => {
  const state = engine.createInitialState({
    stats: {
      health: 6,
    },
  });
  const event = {
    id: "big_childhood_event",
    title: "Big Childhood Event",
    minAge: 0,
    ageAdvance: 6,
  };
  const choice = {
    text: "Choose",
  };

  const result = engine.applyChoice(state, event, choice, achievements, () => 1);

  assert.equal(result.state.age, 1);
});

test("adult events can advance multiple years", () => {
  const state = engine.createInitialState();
  state.age = 18;
  const event = {
    id: "adult_event",
    title: "Adult Event",
    minAge: 18,
    ageAdvance: 5,
  };
  const choice = {
    text: "Choose",
  };

  const result = engine.applyChoice(state, event, choice, achievements, () => 1);

  assert.equal(result.state.age, 23);
});

test("natural death chance starts in old age and reaches certainty at max age", () => {
  const youngState = engine.createInitialState();
  youngState.age = 59;

  const oldState = engine.createInitialState();
  oldState.age = 80;

  const maxAgeState = engine.createInitialState();
  maxAgeState.age = engine.MAX_AGE;

  assert.equal(engine.getNaturalDeathChance(youngState), 0);
  assert.ok(engine.getNaturalDeathChance(oldState) > 0);
  assert.equal(engine.getNaturalDeathChance(maxAgeState), 1);
});

test("event library contains exactly 100 events", () => {
  assert.equal(events.length, 100);
});

test("ages 0 through 17 each have a dedicated yearly event", () => {
  for (let age = 0; age < 18; age += 1) {
    assert.ok(
      events.some(
        (event) =>
          event.id !== "growing_year" && event.minAge === age && event.maxAge === age
      ),
      `Missing dedicated event for age ${age}`
    );
  }
});

test("fallback events cover childhood, adulthood, and old age", () => {
  assert.ok(events.some((event) => event.id === "growing_year" && event.once === false));
  assert.ok(events.some((event) => event.id === "ordinary_year" && event.once === false));
  assert.ok(events.some((event) => event.id === "elderly_year" && event.once === false));
});
