Page({
  startLife() {
    wx.navigateTo({
      url: "/pages/game/game",
    });
  },

  openAchievements() {
    wx.navigateTo({
      url: "/pages/achievements/achievements",
    });
  },

  openEditor() {
    wx.navigateTo({
      url: "/pages/editor/editor",
    });
  },

  exitMiniProgram() {
    if (wx.exitMiniProgram) {
      wx.exitMiniProgram();
      return;
    }

    wx.showToast({
      title: "当前微信版本不支持直接退出",
      icon: "none",
    });
  },

  onShareAppMessage() {
    return {
      title: "来 Savepoint 体验另一种人生",
      path: "/pages/index/index",
    };
  },
});
