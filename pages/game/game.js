const engine = require("../../utils/lifeEngine");
const eventData = require("../../data/events");
const achievementData = require("../../data/achievements");

const app = getApp();

function getStorageArray(key) {
  return wx.getStorageSync(key) || [];
}

function saveUniqueStorageArray(key, values) {
  wx.setStorageSync(key, Array.from(new Set(values || [])));
}

Page({
  data: {
    state: engine.createInitialState(),
    currentEvent: null,
    activeTalentNames: [],
    achievementToast: "",
  },

  onLoad() {
    this.restart();
  },

  restart() {
    const keys = app.globalData.storageKeys;
    const ownedAchievements = getStorageArray(keys.achievements);
    const unlockedTalents = getStorageArray(keys.talents);
    const activeTalents = engine.pickActiveTalents(unlockedTalents);
    const activeTalentNames = activeTalents.map((id) => {
      const talent = achievementData.talents.find((item) => item.id === id);
      return talent ? talent.name : id;
    });

    const state = engine.createInitialState({
      ownedAchievements,
      activeTalents,
    });

    this.setData(
      {
        state,
        activeTalentNames,
        achievementToast: activeTalentNames.length
          ? `本轮随机线索：${activeTalentNames.join("、")}`
          : "",
      },
      () => this.showNextEvent()
    );
  },

  getAllEvents() {
    const keys = app.globalData.storageKeys;
    return eventData.events.concat(getStorageArray(keys.customEvents));
  },

  showNextEvent() {
    const currentEvent = engine.getNextEvent(this.data.state, this.getAllEvents());

    if (!currentEvent) {
      const endedState = Object.assign({}, this.data.state, {
        ended: true,
        endingTitle: "故事暂时停在这里",
        endingReview: engine.buildReview(
          this.data.state,
          "这段人生还没有遇到更多事件，先在这里保存。"
        ),
      });
      this.setData({
        state: endedState,
        currentEvent: null,
      });
      return;
    }

    this.setData({
      currentEvent,
    });
  },

  choose(event) {
    const choiceIndex = Number(event.currentTarget.dataset.index);
    const currentEvent = this.data.currentEvent;
    const choice = currentEvent.choices[choiceIndex];
    const result = engine.applyChoice(
      this.data.state,
      currentEvent,
      choice,
      achievementData.achievements
    );

    this.persistUnlocks(result.unlockedAchievements, result.unlockedTalents);

    this.setData(
      {
        state: result.state,
        achievementToast: this.formatUnlockToast(result.unlockedAchievements, result.unlockedTalents),
      },
      () => {
        if (result.state.ended) {
          this.setData({
            currentEvent: null,
          });
        } else {
          this.showNextEvent();
        }
      }
    );
  },

  persistUnlocks(achievementIds, talentIds) {
    const keys = app.globalData.storageKeys;
    const achievements = getStorageArray(keys.achievements).concat(achievementIds || []);
    const talents = getStorageArray(keys.talents).concat(talentIds || []);
    saveUniqueStorageArray(keys.achievements, achievements);
    saveUniqueStorageArray(keys.talents, talents);
  },

  formatUnlockToast(achievementIds, talentIds) {
    const names = (achievementIds || [])
      .map((id) => achievementData.achievements.find((item) => item.id === id))
      .filter(Boolean)
      .map((item) => item.name);
    const talentNames = (talentIds || [])
      .map((id) => achievementData.talents.find((item) => item.id === id))
      .filter(Boolean)
      .map((item) => item.name);

    if (!names.length && !talentNames.length) {
      return "";
    }

    return [`成就：${names.join("、")}`, `线索：${talentNames.join("、")}`]
      .filter((text) => !text.endsWith("："))
      .join("；");
  },

  goHome() {
    wx.navigateBack();
  },

  onShareAppMessage() {
    return {
      title: `我在 Savepoint 活到了 ${this.data.state.age} 岁`,
      path: "/pages/index/index",
    };
  },
});
