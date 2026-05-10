const events = [
  {
    id: "birth_room",
    title: "出生的房间",
    text: "你来到这个世界。窗外有风，屋里有人小声说：这个孩子以后会成为什么样的人呢？",
    minAge: 0,
    maxAge: 0,
    priority: 100,
    ageAdvance: 1,
    addTags: ["born"],
    choices: [
      {
        text: "好奇地抓住伸来的手",
        statChanges: {
          happiness: 1,
          relationships: 1,
        },
        addTags: ["curious_child"],
        unlockAchievements: ["first_choice"],
      },
      {
        text: "安静地看着光",
        statChanges: {
          knowledge: 1,
          health: 1,
        },
        addTags: ["quiet_child"],
        unlockAchievements: ["first_choice"],
      },
    ],
  },
  {
    id: "childhood_friend",
    title: "操场边的哭声",
    text: "六岁那年，你在操场边看见一个同学因为被嘲笑而哭。上课铃快响了。",
    minAge: 6,
    maxAge: 12,
    priority: 80,
    ageAdvance: 1,
    choices: [
      {
        text: "留下来陪对方一会儿",
        statChanges: {
          relationships: 2,
          happiness: 1,
        },
        addTags: ["loyal_friend"],
        unlockAchievements: ["warm_heart"],
        nextEventId: "friend_secret",
      },
      {
        text: "先回教室，避免惹麻烦",
        statChanges: {
          knowledge: 1,
          relationships: -1,
        },
        addTags: ["careful_child"],
      },
    ],
  },
  {
    id: "friend_secret",
    title: "朋友的小秘密",
    text: "被你陪伴过的朋友悄悄告诉你：家里最近发生了很难过的事，希望你不要告诉别人。",
    minAge: 8,
    maxAge: 16,
    priority: 95,
    ageAdvance: 1,
    requires: {
      tags: ["loyal_friend"],
    },
    choices: [
      {
        text: "尊重秘密，只在对方需要时陪着",
        statChanges: {
          relationships: 2,
          happiness: 1,
        },
        addTags: ["trusted_keeper"],
      },
      {
        text: "告诉老师，希望大人能帮忙",
        statChanges: {
          knowledge: 1,
          relationships: -1,
        },
        addTags: ["asked_adult_help"],
      },
    ],
  },
  {
    id: "exam_crossroad",
    title: "重要考试",
    text: "一场被许多人看重的考试到来了。你感觉人生好像第一次被分成了几条路。",
    minAge: 12,
    maxAge: 18,
    priority: 70,
    ageAdvance: 1,
    choices: [
      {
        text: "把大量时间投入学习",
        statChanges: {
          knowledge: 4,
          happiness: -1,
          health: -1,
        },
        addTags: ["exam_focused"],
      },
      {
        text: "保持节奏，也保留玩耍和朋友",
        statChanges: {
          knowledge: 2,
          happiness: 1,
          relationships: 1,
        },
        addTags: ["balanced_student"],
      },
    ],
  },
  {
    id: "growing_year",
    title: "成长的一年",
    text: "这一年没有惊天动地的大事，但你依然在一点点长大。你开始意识到，普通日子也会塑造一个人。",
    minAge: 1,
    maxAge: 17,
    priority: 10,
    once: false,
    ageAdvance: 1,
    choices: [
      {
        text: "把注意力放在观察世界上",
        statChanges: {
          knowledge: 1,
        },
      },
      {
        text: "把注意力放在身边的人上",
        statChanges: {
          relationships: 1,
          happiness: 1,
        },
      },
    ],
  },
  {
    id: "first_job",
    title: "第一份工作",
    text: "你拿到第一份正式工作。薪水不算高，但你终于可以自己决定很多事。",
    minAge: 18,
    maxAge: 28,
    priority: 70,
    ageAdvance: 5,
    choices: [
      {
        text: "努力赚钱，先让生活稳定",
        statChanges: {
          money: 4,
          health: -1,
          happiness: -1,
        },
        addTags: ["practical_worker"],
      },
      {
        text: "选择喜欢的方向，哪怕收入慢一点",
        statChanges: {
          money: 1,
          happiness: 2,
          knowledge: 1,
        },
        addTags: ["followed_interest"],
      },
    ],
  },
  {
    id: "unexpected_illness",
    title: "一次突然的病",
    text: "连续忙碌之后，你的身体发出警告。医生建议你认真休息一段时间。",
    minAge: 20,
    maxAge: 65,
    priority: 60,
    chance: 0.45,
    ageAdvance: 3,
    choices: [
      {
        text: "停下来调整生活",
        statChanges: {
          health: 2,
          money: -1,
          happiness: 1,
        },
        addTags: ["learned_to_rest"],
      },
      {
        text: "咬牙继续撑过去",
        statChanges: {
          health: -3,
          money: 2,
        },
        addTags: ["ignored_health"],
      },
    ],
  },
  {
    id: "city_move",
    title: "搬去陌生城市",
    text: "一个机会把你带到陌生城市。那里有更大的舞台，也有更孤独的夜晚。",
    minAge: 22,
    maxAge: 45,
    priority: 50,
    ageAdvance: 5,
    choices: [
      {
        text: "接受变化，去新的地方",
        statChanges: {
          money: 2,
          knowledge: 2,
          relationships: -1,
        },
        addTags: ["moved_city"],
        nextEventId: "new_city_night",
      },
      {
        text: "留在熟悉的人身边",
        statChanges: {
          relationships: 2,
          happiness: 1,
        },
        addTags: ["stayed_home"],
      },
    ],
  },
  {
    id: "new_city_night",
    title: "新城市的夜晚",
    text: "搬家后的第一个夜晚，你站在便利店门口，看见陌生街道像一条发光的河。",
    minAge: 22,
    maxAge: 50,
    priority: 90,
    ageAdvance: 2,
    requires: {
      tags: ["moved_city"],
    },
    choices: [
      {
        text: "给老朋友打电话",
        statChanges: {
          relationships: 1,
          happiness: 1,
        },
      },
      {
        text: "一个人散步，记住这座城市",
        statChanges: {
          knowledge: 1,
          happiness: 1,
        },
        addTags: ["wandered_far"],
        unlockAchievements: ["traveler"],
      },
    ],
  },
  {
    id: "volunteer_call",
    title: "深夜热线",
    text: "你看到一则志愿者招募：接听深夜电话，陪陌生人度过难熬的时刻。",
    minAge: 25,
    maxAge: 60,
    priority: 85,
    ageAdvance: 4,
    requires: {
      talents: ["empathy_thread"],
    },
    choices: [
      {
        text: "报名，学习如何倾听",
        statChanges: {
          relationships: 3,
          happiness: 1,
          health: -1,
        },
        addTags: ["night_listener"],
      },
      {
        text: "收藏信息，但暂时没有勇气",
        statChanges: {
          knowledge: 1,
        },
      },
    ],
  },
  {
    id: "old_library",
    title: "旧图书馆的灯",
    text: "一座快要关闭的旧图书馆邀请志愿者整理藏书。你在角落发现许多被遗忘的人生记录。",
    minAge: 20,
    maxAge: 70,
    priority: 85,
    ageAdvance: 4,
    requires: {
      talents: ["library_door"],
    },
    choices: [
      {
        text: "留下来整理，并写下读书笔记",
        statChanges: {
          knowledge: 4,
          happiness: 1,
        },
        addTags: ["library_keeper"],
      },
      {
        text: "只拍几张照片作为纪念",
        statChanges: {
          happiness: 1,
        },
      },
    ],
  },
  {
    id: "midlife_restart",
    title: "中年的重新开始",
    text: "许多人说这时候应该稳定下来，但你心里还有一个没有熄灭的念头。",
    minAge: 40,
    maxAge: 62,
    priority: 90,
    ageAdvance: 6,
    requires: {
      talents: ["second_spring"],
    },
    choices: [
      {
        text: "学习新技能，换一条路",
        statChanges: {
          knowledge: 4,
          money: -2,
          happiness: 2,
        },
        addTags: ["late_restart"],
        unlockAchievements: ["late_bloom"],
      },
      {
        text: "把想法写下来，留给以后",
        statChanges: {
          happiness: 1,
          knowledge: 1,
        },
      },
    ],
  },
  {
    id: "ordinary_year",
    title: "普通的一年",
    text: "这一年没有戏剧性的转折。日子像水一样流过，但你仍然可以选择把注意力放在哪里。",
    minAge: 10,
    maxAge: 59,
    priority: 10,
    once: false,
    ageAdvance: 3,
    choices: [
      {
        text: "照顾身体和作息",
        statChanges: {
          health: 1,
          happiness: 1,
        },
      },
      {
        text: "把时间投入学习或工作",
        statChanges: {
          knowledge: 1,
          money: 1,
          health: -1,
        },
      },
    ],
  },
  {
    id: "elderly_year",
    title: "晚年的一年",
    text: "年岁渐长，身体和记忆都变得更需要照顾。你开始更认真地回望过去，也更珍惜还在身边的人。",
    minAge: 60,
    maxAge: 99,
    priority: 10,
    once: false,
    ageAdvance: 2,
    choices: [
      {
        text: "慢下来，照顾身体",
        statChanges: {
          health: 1,
          happiness: 1,
        },
      },
      {
        text: "整理旧物，回忆一路走来的人",
        statChanges: {
          relationships: 1,
          happiness: 1,
        },
      },
    ],
  },
];

module.exports = {
  events,
};
