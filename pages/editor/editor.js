const app = getApp();

function toNumber(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function statChangesFrom(prefix, values) {
  const changes = {
    health: toNumber(values[`${prefix}Health`], 0),
    money: toNumber(values[`${prefix}Money`], 0),
    happiness: toNumber(values[`${prefix}Happiness`], 0),
    knowledge: toNumber(values[`${prefix}Knowledge`], 0),
    relationships: toNumber(values[`${prefix}Relationships`], 0),
  };

  Object.keys(changes).forEach((name) => {
    if (changes[name] === 0) {
      delete changes[name];
    }
  });

  return changes;
}

Page({
  data: {
    customEvents: [],
  },

  onShow() {
    this.loadEvents();
  },

  loadEvents() {
    const key = app.globalData.storageKeys.customEvents;
    this.setData({
      customEvents: wx.getStorageSync(key) || [],
    });
  },

  saveEvent(event) {
    const values = event.detail.value;
    const title = values.title.trim();
    const text = values.text.trim();
    const choiceAText = values.choiceAText.trim();
    const choiceBText = values.choiceBText.trim();

    if (!title || !text || !choiceAText || !choiceBText) {
      wx.showToast({
        title: "标题、正文和两个选择都要填写",
        icon: "none",
      });
      return;
    }

    const customEvent = {
      id: `custom_${Date.now()}`,
      title,
      text,
      minAge: toNumber(values.minAge, 0),
      maxAge: toNumber(values.maxAge, 80),
      priority: toNumber(values.priority, 50),
      ageAdvance: toNumber(values.ageAdvance, 3),
      choices: [
        {
          text: choiceAText,
          statChanges: statChangesFrom("choiceA", values),
          addTags: [`custom_${Date.now()}_a`],
        },
        {
          text: choiceBText,
          statChanges: statChangesFrom("choiceB", values),
          addTags: [`custom_${Date.now()}_b`],
        },
      ],
    };

    const key = app.globalData.storageKeys.customEvents;
    const nextEvents = (wx.getStorageSync(key) || []).concat(customEvent);
    wx.setStorageSync(key, nextEvents);
    this.setData({
      customEvents: nextEvents,
    });
    wx.showToast({
      title: "事件已保存",
      icon: "success",
    });
  },

  deleteEvent(event) {
    const id = event.currentTarget.dataset.id;
    const key = app.globalData.storageKeys.customEvents;
    const nextEvents = (wx.getStorageSync(key) || []).filter((item) => item.id !== id);
    wx.setStorageSync(key, nextEvents);
    this.setData({
      customEvents: nextEvents,
    });
  },
});
