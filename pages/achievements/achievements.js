const achievementData = require("../../data/achievements");

const app = getApp();

Page({
  data: {
    achievements: [],
    ownedTalents: [],
  },

  onShow() {
    const keys = app.globalData.storageKeys;
    const unlockedAchievements = wx.getStorageSync(keys.achievements) || [];
    const unlockedTalents = wx.getStorageSync(keys.talents) || [];

    const achievements = achievementData.achievements.map((achievement) => {
      const talent = achievementData.talents.find(
        (item) => item.id === achievement.unlockTalent
      );
      return Object.assign({}, achievement, {
        unlocked: unlockedAchievements.includes(achievement.id),
        talentName: talent ? talent.name : "",
      });
    });

    const ownedTalents = achievementData.talents.filter((talent) =>
      unlockedTalents.includes(talent.id)
    );

    this.setData({
      achievements,
      ownedTalents,
    });
  },
});
