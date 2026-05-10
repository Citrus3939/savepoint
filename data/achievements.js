const achievements = [
  {
    id: "first_choice",
    name: "第一次选择",
    description: "完成你人生中的第一次选择。",
    unlockTalent: "sensitive_heart",
  },
  {
    id: "warm_heart",
    name: "温柔的人",
    description: "在重要时刻选择帮助别人。",
    unlockTalent: "empathy_thread",
  },
  {
    id: "bookish",
    name: "书页之间",
    description: "知识达到 10。",
    unlockTalent: "library_door",
    condition: {
      minStats: {
        knowledge: 10,
      },
    },
  },
  {
    id: "traveler",
    name: "见过远方",
    description: "踏上一段真正的远行。",
    unlockTalent: "wanderlust_thread",
  },
  {
    id: "late_bloom",
    name: "大器晚成",
    description: "中年之后仍然改变人生方向。",
    unlockTalent: "second_spring",
  },
];

const talents = [
  {
    id: "sensitive_heart",
    name: "敏感的心",
    description: "不会增加数值，只会让某些细腻的人生事件有机会出现。",
  },
  {
    id: "empathy_thread",
    name: "共情线索",
    description: "让你更容易遇见需要倾听和陪伴的人。",
  },
  {
    id: "library_door",
    name: "旧图书馆的门",
    description: "开启与阅读、研究、写作有关的特殊事件。",
  },
  {
    id: "wanderlust_thread",
    name: "远方线索",
    description: "开启旅行和迁徙相关的特殊事件。",
  },
  {
    id: "second_spring",
    name: "第二春",
    description: "开启中后期重新开始的特殊事件。",
  },
];

module.exports = {
  achievements,
  talents,
};
