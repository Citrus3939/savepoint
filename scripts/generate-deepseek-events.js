#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");

const API_URL = "https://api.deepseek.com/chat/completions";
const MODEL = process.env.DEEPSEEK_MODEL || "deepseek-chat";
const OUTPUT_PATH = path.join(__dirname, "..", "data", "events.js");

function buildPrompt() {
  return `
你是一个文字人生模拟游戏的事件设计助手。请生成正好 100 个微信小程序文字人生事件，输出严格 JSON，不要 Markdown。

游戏设定：
- 游戏模拟一个人的一生。
- 0-17 岁必须每年有至少一个明确年龄事件。
- 18 岁后可以每 2-5 年一个事件。
- 60 岁后逐渐进入晚年、告别、回望、死亡风险。
- 事件要有完整时间线：出生、童年、学校、青春期、成年、工作、亲密关系、家庭、疾病、迁徙、中年转折、晚年、回望。
- 玩法偏休闲体验，不追求最强数值。
- 有些路线互斥，例如读大学/早工作、留在家乡/去大城市、结婚/单身、稳定工作/创作路线。

每个事件必须符合这个结构：
{
  "id": "英文小写下划线唯一id",
  "title": "中文标题",
  "text": "中文正文，50字以内",
  "minAge": 数字,
  "maxAge": 数字,
  "priority": 数字,
  "chance": 0到1之间的小数，可省略,
  "ageAdvance": 数字,
  "requires": {
    "tags": ["可选"],
    "notTags": ["可选"],
    "talents": ["可选"],
    "minStats": {"knowledge": 10},
    "maxStats": {"health": 3}
  },
  "addTags": ["可选"],
  "once": false 可选,
  "choices": [
    {
      "text": "中文选项",
      "statChanges": {"health": 1, "money": -1, "happiness": 1, "knowledge": 1, "relationships": 1},
      "addTags": ["可选"],
      "removeTags": ["可选"],
      "unlockAchievements": ["可选"],
      "nextEventId": "可选"
    }
  ]
}

要求：
- 输出必须是 JSON 数组，数组长度正好 100。
- 每个事件至少 2 个 choices。
- 只能使用属性 health, money, happiness, knowledge, relationships。
- statChanges 数值在 -3 到 +4 之间。
- id 不能重复。
- 互斥路线标签用 route_ 开头。
- 普通人生标签不用 route_ 开头。
- 可以使用已有成就 id：first_choice, warm_heart, bookish, traveler, late_bloom。
- 可以使用已有故事线索 talent：sensitive_heart, empathy_thread, library_door, wanderlust_thread, second_spring。
- 最后加入 3 个兜底事件：growing_year, ordinary_year, elderly_year，其中 once:false。
`;
}

function validateEvents(events) {
  if (!Array.isArray(events)) {
    throw new Error("DeepSeek response is not a JSON array.");
  }
  if (events.length !== 100) {
    throw new Error(`Expected 100 events, got ${events.length}.`);
  }

  const ids = new Set();
  events.forEach((event, index) => {
    if (!event.id || ids.has(event.id)) {
      throw new Error(`Missing or duplicate id at index ${index}: ${event.id}`);
    }
    ids.add(event.id);
    if (!Array.isArray(event.choices) || event.choices.length < 2) {
      throw new Error(`Event ${event.id} must have at least two choices.`);
    }
  });
}

function toEventsModule(events) {
  return `const events = ${JSON.stringify(events, null, 2)};\n\nmodule.exports = {\n  events,\n};\n`;
}

async function main() {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    throw new Error("Missing DEEPSEEK_API_KEY environment variable.");
  }

  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      temperature: 0.8,
      messages: [
        {
          role: "system",
          content: "你只输出可解析 JSON，不输出 Markdown，不输出解释。",
        },
        {
          role: "user",
          content: buildPrompt(),
        },
      ],
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`DeepSeek API failed: ${response.status} ${body}`);
  }

  const data = await response.json();
  const content = data.choices && data.choices[0] && data.choices[0].message.content;
  if (!content) {
    throw new Error("DeepSeek response did not include message content.");
  }

  const events = JSON.parse(content);
  validateEvents(events);
  fs.writeFileSync(OUTPUT_PATH, toEventsModule(events));
  console.log(`Wrote ${events.length} events to ${OUTPUT_PATH}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
