# 新手事件设计指南

这份文档专门给不熟悉代码的设计者看。你主要改这个文件：

```text
data/events.js
```

大多数时候，你不需要改 `utils/lifeEngine.js`。那里是游戏规则引擎，先不要动。

## 1. 一个事件长什么样

`data/events.js` 里有很多这样的结构：

```js
{
  id: "rainy_phone_call",
  title: "雨夜的电话",
  text: "深夜，一个很久没联系的朋友突然打来电话。",
  minAge: 18,
  maxAge: 50,
  priority: 70,
  chance: 0.6,
  ageAdvance: 2,
  choices: [
    {
      text: "接起电话",
      statChanges: {
        relationships: 2,
        happiness: 1
      },
      addTags: ["answered_old_friend"]
    },
    {
      text: "假装没听见",
      statChanges: {
        relationships: -1,
        happiness: -1
      },
      addTags: ["ignored_old_friend"]
    }
  ]
}
```

你可以把一个事件理解成：

- `id`：事件的内部名字，不能重复，只用英文、数字、下划线。
- `title`：玩家看到的标题。
- `text`：玩家看到的正文。
- `minAge`：最早几岁会出现。
- `maxAge`：最晚几岁会出现。
- `priority`：优先级，数字越大越容易先出现。
- `chance`：触发概率，`0.6` 就是大约 60%。
- `ageAdvance`：选完后人生推进几岁。
- `choices`：玩家可以选择什么。

特别规则：18 岁前，系统会强制每次事件只推进 1 岁。这样可以保证童年和学生阶段每年都有事件。18 岁之后，`ageAdvance` 才会按你写的数值推进。

## 2. 最重要的关联方法：标签

如果你希望“之前做过某个选择，之后才会发生某个事件”，就用标签。

### 第一步：在前一个事件的选择里添加标签

```js
{
  text: "接起电话",
  addTags: ["answered_old_friend"]
}
```

意思是：玩家选择“接起电话”后，身上会留下一个标签：

```text
answered_old_friend
```

### 第二步：在后一个事件里要求这个标签

```js
{
  id: "old_friend_reunion",
  title: "多年后的重逢",
  text: "几年后，那位朋友邀请你见面。",
  minAge: 25,
  maxAge: 60,
  priority: 80,
  requires: {
    tags: ["answered_old_friend"]
  },
  choices: [
    {
      text: "赴约",
      statChanges: {
        relationships: 2,
        happiness: 1
      }
    },
    {
      text: "婉拒",
      statChanges: {
        relationships: -1
      }
    }
  ]
}
```

这样，只有玩家以前选择过“接起电话”，后面才可能出现“多年后的重逢”。

## 3. 强制连续事件：nextEventId

如果你希望“玩家选完这个选项后，下一次一定接着出现某个事件”，用 `nextEventId`。

前一个事件：

```js
{
  id: "city_move",
  title: "搬去陌生城市",
  text: "一个机会把你带到陌生城市。",
  minAge: 22,
  maxAge: 45,
  priority: 50,
  choices: [
    {
      text: "接受变化，去新的地方",
      addTags: ["moved_city"],
      nextEventId: "new_city_night"
    },
    {
      text: "留在熟悉的人身边",
      addTags: ["stayed_home"]
    }
  ]
}
```

后一个事件：

```js
{
  id: "new_city_night",
  title: "新城市的夜晚",
  text: "搬家后的第一个夜晚，你站在便利店门口。",
  minAge: 22,
  maxAge: 50,
  priority: 90,
  requires: {
    tags: ["moved_city"]
  },
  choices: [
    {
      text: "给老朋友打电话",
      statChanges: {
        relationships: 1,
        happiness: 1
      }
    },
    {
      text: "一个人散步",
      statChanges: {
        knowledge: 1,
        happiness: 1
      }
    }
  ]
}
```

区别：

- `addTags` + `requires.tags`：以后有机会出现。
- `nextEventId`：下一次直接接上。

## 4. 概率怎么写

事件上加：

```js
chance: 0.3
```

意思是这个事件每次被检查时，大约 30% 概率通过。

常用概率：

- `chance: 1`：必定通过概率检查。
- `chance: 0.8`：很常见。
- `chance: 0.5`：一半概率。
- `chance: 0.2`：比较少见。
- `chance: 0.05`：非常稀有。

注意：`chance` 不是唯一条件。年龄、标签、天赋、优先级都会一起影响事件是否出现。

## 5. 优先级怎么写

事件上加：

```js
priority: 80
```

建议这样分：

- `100`：开局、结局、非常关键的主线事件。
- `80`：重要连续故事线。
- `50`：普通人生事件。
- `10`：兜底日常事件。

优先级越高，越容易先出现。

## 6. 触发条件怎么写

触发条件写在 `requires` 里。

### 需要标签

```js
requires: {
  tags: ["moved_city"]
}
```

意思是：玩家必须有 `moved_city` 标签。

### 不能有某个标签

```js
requires: {
  notTags: ["stayed_home"]
}
```

意思是：玩家不能有 `stayed_home` 标签。

### 需要故事线索 / 天赋

```js
requires: {
  talents: ["library_door"]
}
```

意思是：这局人生必须带着 `library_door` 这个故事线索。

### 需要某个成就

```js
requires: {
  achievements: ["bookish"]
}
```

意思是：玩家账号已经解锁过 `bookish` 成就。

### 需要属性达到某个数值

```js
requires: {
  minStats: {
    knowledge: 10
  }
}
```

意思是：知识至少达到 10。

### 需要属性低于某个数值

```js
requires: {
  maxStats: {
    health: 3
  }
}
```

意思是：健康小于等于 3，适合触发疾病、疲惫、危机事件。

## 7. 互斥事件怎么设计

互斥的意思是：玩家走了 A 路线，就不能再走 B 路线。

最推荐的做法是用标签：

- 选择 A 时加 `route_a`
- 选择 B 时加 `route_b`
- A 后续事件要求不能有 `route_b`
- B 后续事件要求不能有 `route_a`

### 方法一：两个选择天然互斥

同一个事件里的两个选择，本来就只能选一个。

```js
{
  id: "after_graduation_choice",
  title: "毕业后的路",
  text: "毕业后，你面前有两条路：继续读书，或者马上工作。",
  minAge: 18,
  maxAge: 22,
  priority: 90,
  choices: [
    {
      text: "继续读书",
      statChanges: {
        knowledge: 3,
        money: -1
      },
      addTags: ["route_university"]
    },
    {
      text: "马上工作",
      statChanges: {
        money: 2,
        knowledge: 1
      },
      addTags: ["route_work_early"]
    }
  ]
}
```

玩家只能得到：

- `route_university`
- 或 `route_work_early`

### 方法二：后续事件互斥

大学路线事件：

```js
{
  id: "university_roommate",
  title: "大学室友",
  text: "你在大学宿舍遇到了性格完全不同的室友。",
  minAge: 18,
  maxAge: 25,
  priority: 80,
  requires: {
    tags: ["route_university"],
    notTags: ["route_work_early"]
  },
  choices: [
    {
      text: "试着融入集体",
      statChanges: {
        relationships: 1,
        happiness: 1
      }
    },
    {
      text: "更多时间留给自己",
      statChanges: {
        knowledge: 1
      }
    }
  ]
}
```

早工作路线事件：

```js
{
  id: "first_paycheck",
  title: "第一笔工资",
  text: "你拿到了人生中第一笔工资，虽然不多，但它完全属于你。",
  minAge: 18,
  maxAge: 25,
  priority: 80,
  requires: {
    tags: ["route_work_early"],
    notTags: ["route_university"]
  },
  choices: [
    {
      text: "存起来",
      statChanges: {
        money: 2
      }
    },
    {
      text: "买一件一直想要的东西",
      statChanges: {
        money: -1,
        happiness: 2
      }
    }
  ]
}
```

关键是：

```js
requires: {
  tags: ["route_university"],
  notTags: ["route_work_early"]
}
```

意思是：必须走了大学路线，并且不能走早工作路线。

### 方法三：用 removeTags 切换路线

有些人生路线不是永久互斥，而是可以转向。

例如：玩家原本是工作路线，后来决定重新读书。

```js
{
  text: "辞职备考，重新读书",
  statChanges: {
    money: -2,
    knowledge: 2,
    happiness: 1
  },
  addTags: ["route_university"],
  removeTags: ["route_work_early"]
}
```

意思是：

- 加上 `route_university`
- 移除 `route_work_early`

这样后面就会进入大学路线，而不是继续早工作路线。

### 方法四：事件只出现一次

默认情况下，一个事件只会出现一次。

所以普通事件不用特别写互斥。

如果你看到：

```js
once: false
```

意思是这个事件可以重复出现，通常只给“普通的一年”“晚年的一年”这种兜底事件用。

### 互斥标签命名建议

建议互斥路线标签用 `route_` 开头：

- `route_university`
- `route_work_early`
- `route_stayed_home`
- `route_moved_city`
- `route_married`
- `route_single_life`
- `route_artist`
- `route_business`

这样你以后看代码时，一眼就知道这是路线选择。

### 新手最稳的互斥模板

前置选择：

```js
{
  text: "选择 A 路线",
  addTags: ["route_a"]
},
{
  text: "选择 B 路线",
  addTags: ["route_b"]
}
```

A 路线后续事件：

```js
requires: {
  tags: ["route_a"],
  notTags: ["route_b"]
}
```

B 路线后续事件：

```js
requires: {
  tags: ["route_b"],
  notTags: ["route_a"]
}
```

如果某个选择会从 A 转到 B：

```js
addTags: ["route_b"],
removeTags: ["route_a"]
```

## 8. 选择能改变什么

选择里可以写：

```js
{
  text: "努力工作",
  statChanges: {
    money: 3,
    health: -1,
    happiness: -1
  },
  addTags: ["workaholic"],
  removeTags: ["carefree"],
  unlockAchievements: ["first_job"],
  nextEventId: "late_night_office"
}
```

含义：

- `statChanges`：改变属性。
- `addTags`：增加标签。
- `removeTags`：移除标签。
- `unlockAchievements`：解锁成就。
- `nextEventId`：下一次接到指定事件。

当前属性有：

- `health`：健康
- `money`：金钱
- `happiness`：快乐
- `knowledge`：知识
- `relationships`：人际关系

## 9. 如何把新事件放进 data/events.js

打开 `data/events.js`，你会看到：

```js
const events = [
  {
    id: "birth_room",
    ...
  },
  {
    id: "childhood_friend",
    ...
  },
];
```

你要做的是：

1. 找到最后一个事件。
2. 在最后一个事件后面加一个英文逗号 `,`。
3. 把你的新事件粘贴进去。
4. 确保最后仍然是：

```js
];

module.exports = {
  events,
};
```

最常见错误：

- 少了英文逗号 `,`
- 中文逗号 `，` 写进代码结构里
- `id` 重复
- 引号少了一边
- 大括号 `{}` 或中括号 `[]` 没有配对

## 10. 一个完整的三段连续故事例子

可以直接复制到 `data/events.js` 的 `events` 数组里试试。

```js
{
  id: "stray_cat_rain",
  title: "雨里的流浪猫",
  text: "下雨的傍晚，你在楼下看见一只浑身湿透的流浪猫。",
  minAge: 16,
  maxAge: 40,
  priority: 70,
  chance: 0.7,
  ageAdvance: 1,
  choices: [
    {
      text: "把它抱回家",
      statChanges: {
        happiness: 1,
        money: -1
      },
      addTags: ["adopted_cat"],
      nextEventId: "cat_first_night"
    },
    {
      text: "给它留一点食物就离开",
      statChanges: {
        happiness: 1
      },
      addTags: ["fed_stray_cat"]
    }
  ]
},
{
  id: "cat_first_night",
  title: "猫的第一个夜晚",
  text: "那只猫躲在沙发下面，一整晚都没有出来。你听见它很轻地叫了一声。",
  minAge: 16,
  maxAge: 45,
  priority: 90,
  ageAdvance: 1,
  requires: {
    tags: ["adopted_cat"]
  },
  choices: [
    {
      text: "耐心等它自己出来",
      statChanges: {
        happiness: 1,
        relationships: 1
      },
      addTags: ["patient_with_cat"]
    },
    {
      text: "试着把它从沙发下抱出来",
      statChanges: {
        happiness: -1,
        relationships: -1
      },
      addTags: ["scared_cat"]
    }
  ]
},
{
  id: "old_cat_goodbye",
  title: "老猫的告别",
  text: "许多年后，那只猫已经很老了。它在午后的阳光里安静地看着你。",
  minAge: 30,
  maxAge: 70,
  priority: 85,
  chance: 0.5,
  ageAdvance: 2,
  requires: {
    tags: ["patient_with_cat"]
  },
  choices: [
    {
      text: "陪它晒完最后一个下午",
      statChanges: {
        happiness: -1,
        relationships: 2
      },
      addTags: ["remembered_cat"]
    },
    {
      text: "把悲伤藏起来，继续生活",
      statChanges: {
        health: -1,
        happiness: -1
      },
      addTags: ["hid_grief"]
    }
  ]
}
```

## 11. 推荐你的设计流程

不要一开始就写很多复杂条件。建议按这个顺序：

1. 先写一个普通事件。
2. 给两个选择分别加不同标签。
3. 写一个后续事件，用 `requires.tags` 关联其中一个标签。
4. 如果想马上接上，就加 `nextEventId`。
5. 如果想稀有一点，就加 `chance`。
6. 如果太常见或太少见，再调 `priority`。

最小目标是：每条故事线先写 3 个事件。

例如：

- 童年朋友：相遇 -> 秘密 -> 成年重逢
- 流浪猫：遇见 -> 收养 -> 告别
- 大城市：搬家 -> 孤独夜晚 -> 找到归属
- 创作：第一次投稿 -> 被拒绝 -> 多年后出版
- 疾病：忽视身体 -> 病倒 -> 改变生活

## 12. 前 18 岁怎么设计

当前游戏规则已经保证：18 岁前每次选择只长 1 岁。

所以你设计事件时可以这样分：

- 0-6 岁：家庭、身体、性格、早期记忆
- 7-12 岁：学校、朋友、兴趣、第一次受挫
- 13-18 岁：考试、青春期、梦想、自我认同

建议前期至少准备 18 个事件，让玩家从 0 岁到 18 岁每一年都能遇到不同内容。现在代码里也有一个 `growing_year` 兜底事件：如果某一年没有更合适的事件，就会出现普通成长事件，保证流程不断。

## 13. 改完后怎么检查

如果你会用命令行，可以运行：

```bash
node --check data/events.js
```

如果不会用命令行，就用微信开发者工具：

1. 保存 `data/events.js`。
2. 回到微信开发者工具。
3. 点击“编译”。
4. 如果下面控制台出现红字，通常是逗号、引号、括号写错了。

看不懂红字也没关系，把报错复制出来，再让 AI 帮你定位。
