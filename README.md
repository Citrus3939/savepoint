# Savepoint: 终端文字 Roguelike

这是一个用 Python 标准库写的小型文字 Roguelike 游戏，可以直接在终端里运行。

你不需要先理解代码。先把游戏跑起来，再慢慢改一些数字，就能开始做设计实验。

## 如何运行

在项目目录里输入：

```bash
python3 roguelike.py
```

如果你的电脑已经把 `python` 指向 Python 3，也可以用：

```bash
python roguelike.py
```

## 怎么玩

地图符号：

- `@`：你，冒险者
- `#`：墙
- `.`：地面
- `M`：怪物
- `!`：治疗药水
- `*`：宝藏
- `>`：出口

操作：

- `W`：向上
- `A`：向左
- `S`：向下
- `D`：向右
- `H`：显示帮助
- `Q`：退出

目标是探索地牢，收集宝藏，活着走到出口。

## 想调整游戏设计，从这里开始

打开 `roguelike.py`，最上面有一组很容易改的数值：

```python
MAP_WIDTH = 30
MAP_HEIGHT = 15
STARTING_HP = 24
PLAYER_ATTACK = 5
MONSTER_COUNT = 6
POTION_COUNT = 4
TREASURE_COUNT = 7
WALL_CHANCE = 0.10
```

你可以尝试：

- 把 `MONSTER_COUNT` 改大：地牢更危险
- 把 `POTION_COUNT` 改大：玩家更容易活下来
- 把 `STARTING_HP` 改小：游戏更紧张
- 把 `WALL_CHANCE` 改大：地图更像迷宫
- 把 `TREASURE_COUNT` 改大：鼓励玩家多探索

每次保存后重新运行 `python3 roguelike.py`，就能看到变化。

## 运行测试

如果你改了代码，可以用下面的命令检查基础规则有没有坏掉：

```bash
python3 -m unittest
```
