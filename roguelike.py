"""A tiny terminal roguelike written with only the Python standard library.

Run it with:

    python roguelike.py

The values near the top of this file are intentionally easy to tweak for game
design experiments: map size, player health, monster count, potion count, etc.
"""

from __future__ import annotations

from dataclasses import dataclass
import os
import random
from typing import Iterable


# --- Designer-friendly knobs -------------------------------------------------

MAP_WIDTH = 30
MAP_HEIGHT = 15
STARTING_HP = 24
PLAYER_ATTACK = 5
MONSTER_COUNT = 6
POTION_COUNT = 4
TREASURE_COUNT = 7
WALL_CHANCE = 0.10


HELP_TEXT = """
指令:
  W/A/S/D  移动
  H        显示帮助
  Q        退出

目标:
  探索地牢，收集宝藏 (*)，喝药水 (!)，躲开或击败怪物 (M)，最后到达出口 (>).
""".strip()


@dataclass(frozen=True)
class Position:
    x: int
    y: int

    def moved(self, dx: int, dy: int) -> "Position":
        return Position(self.x + dx, self.y + dy)

    def distance_to(self, other: "Position") -> int:
        return abs(self.x - other.x) + abs(self.y - other.y)


@dataclass
class Player:
    position: Position
    hp: int = STARTING_HP
    attack: int = PLAYER_ATTACK
    gold: int = 0


@dataclass
class Monster:
    position: Position
    hp: int
    attack: int
    name: str = "洞穴鼠"


class Game:
    """Turn-based game state and rules.

    This class is separate from keyboard input so the game can be tested and
    changed without needing to play it by hand every time.
    """

    def __init__(
        self,
        *,
        seed: int | None = None,
        width: int = MAP_WIDTH,
        height: int = MAP_HEIGHT,
    ) -> None:
        if width < 12 or height < 8:
            raise ValueError("The map must be at least 12 by 8.")

        self.random = random.Random(seed)
        self.width = width
        self.height = height
        self.player = Player(Position(1, 1))
        self.exit_position = Position(width - 2, height - 2)
        self.turns = 0
        self.message = "你在潮湿的石阶上醒来。出口在远处闪着微光。"
        self.game_over = False
        self.victory = False

        self.walls = self._generate_walls()
        self.treasures = self._place_items(TREASURE_COUNT)
        self.potions = self._place_items(POTION_COUNT)
        self.monsters = self._place_monsters(MONSTER_COUNT)

    def _generate_walls(self) -> set[Position]:
        walls: set[Position] = set()
        for y in range(self.height):
            for x in range(self.width):
                position = Position(x, y)
                is_border = x == 0 or y == 0 or x == self.width - 1 or y == self.height - 1
                is_special = position in {self.player.position, self.exit_position}
                if is_border or (not is_special and self.random.random() < WALL_CHANCE):
                    walls.add(position)

        # Keep the simple diagonal route open so every generated map is solvable.
        for x in range(1, self.width - 1):
            walls.discard(Position(x, 1))
        for y in range(1, self.height - 1):
            walls.discard(Position(self.width - 2, y))
        return walls

    def _place_items(self, amount: int) -> set[Position]:
        items: set[Position] = set()
        while len(items) < amount:
            items.add(self._random_empty_position(extra_occupied=items))
        return items

    def _place_monsters(self, amount: int) -> list[Monster]:
        names = ["洞穴鼠", "骷髅兵", "黏液怪", "影子"]
        monsters: list[Monster] = []
        for _ in range(amount):
            monsters.append(
                Monster(
                    position=self._random_empty_position(
                        extra_occupied={monster.position for monster in monsters}
                    ),
                    hp=self.random.randint(6, 12),
                    attack=self.random.randint(2, 5),
                    name=self.random.choice(names),
                )
            )
        return monsters

    def _random_empty_position(self, extra_occupied: Iterable[Position] = ()) -> Position:
        occupied = {self.player.position, self.exit_position}
        occupied.update(self.treasures if hasattr(self, "treasures") else set())
        occupied.update(self.potions if hasattr(self, "potions") else set())
        occupied.update(monster.position for monster in getattr(self, "monsters", []))
        occupied.update(extra_occupied)

        for _ in range(1_000):
            position = Position(
                self.random.randint(1, self.width - 2),
                self.random.randint(1, self.height - 2),
            )
            if position not in self.walls and position not in occupied:
                return position
        raise RuntimeError("Could not find an empty position on the map.")

    def render(self) -> str:
        rows = []
        for y in range(self.height):
            row = []
            for x in range(self.width):
                position = Position(x, y)
                row.append(self._glyph_at(position))
            rows.append("".join(row))

        status = f"HP {self.player.hp}/{STARTING_HP} | 宝藏 {self.player.gold} | 回合 {self.turns}"
        return "\n".join(rows + [status, self.message])

    def _glyph_at(self, position: Position) -> str:
        if position == self.player.position:
            return "@"
        if position in self.walls:
            return "#"
        if self._monster_at(position):
            return "M"
        if position in self.potions:
            return "!"
        if position in self.treasures:
            return "*"
        if position == self.exit_position:
            return ">"
        return "."

    def _monster_at(self, position: Position) -> Monster | None:
        for monster in self.monsters:
            if monster.position == position:
                return monster
        return None

    def handle_command(self, command: str) -> None:
        if self.game_over:
            return

        command = command.lower().strip()
        directions = {
            "w": (0, -1),
            "a": (-1, 0),
            "s": (0, 1),
            "d": (1, 0),
        }

        if command == "h":
            self.message = HELP_TEXT
            return
        if command == "q":
            self.game_over = True
            self.message = "你收起火把，离开了这次冒险。"
            return
        if command not in directions:
            self.message = "未知指令。输入 H 查看帮助。"
            return

        dx, dy = directions[command]
        self._move_player(dx, dy)
        if not self.game_over:
            self._move_monsters()
        self.turns += 1

    def _move_player(self, dx: int, dy: int) -> None:
        destination = self.player.position.moved(dx, dy)
        if destination in self.walls:
            self.message = "你撞上冰冷的石墙。"
            return

        monster = self._monster_at(destination)
        if monster:
            monster.hp -= self.player.attack
            if monster.hp <= 0:
                self.monsters.remove(monster)
                self.message = f"你击败了{monster.name}！"
            else:
                self.player.hp -= monster.attack
                self.message = f"你攻击{monster.name}，它反击造成 {monster.attack} 点伤害。"
                self._check_defeat()
            return

        self.player.position = destination
        if destination in self.treasures:
            self.treasures.remove(destination)
            self.player.gold += 1
            self.message = "你发现一枚旧王国金币。"
        elif destination in self.potions:
            self.potions.remove(destination)
            healed = min(STARTING_HP - self.player.hp, 8)
            self.player.hp += healed
            self.message = f"你喝下药水，恢复 {healed} 点生命。"
        elif destination == self.exit_position:
            self.victory = True
            self.game_over = True
            self.message = f"你带着 {self.player.gold} 件宝藏逃出了地牢！"
        else:
            self.message = self.random.choice(
                [
                    "远处传来水滴声。",
                    "你的脚步声在石廊中回响。",
                    "黑暗里有什么东西动了一下。",
                    "空气里有铁锈和苔藓的味道。",
                ]
            )

    def _move_monsters(self) -> None:
        for monster in list(self.monsters):
            if monster.position.distance_to(self.player.position) == 1:
                self.player.hp -= monster.attack
                self.message = f"{monster.name}咬住你，造成 {monster.attack} 点伤害！"
                self._check_defeat()
                if self.game_over:
                    return
                continue

            if monster.position.distance_to(self.player.position) <= 5:
                next_position = self._step_toward(monster.position, self.player.position)
                if self._can_monster_move_to(next_position):
                    monster.position = next_position

    def _step_toward(self, start: Position, target: Position) -> Position:
        options = [
            start.moved(1 if target.x > start.x else -1, 0),
            start.moved(0, 1 if target.y > start.y else -1),
        ]
        self.random.shuffle(options)
        for option in options:
            if option.distance_to(target) < start.distance_to(target):
                return option
        return start

    def _can_monster_move_to(self, position: Position) -> bool:
        if position in self.walls or position == self.exit_position:
            return False
        if position == self.player.position:
            return False
        if any(monster.position == position for monster in self.monsters):
            return False
        return True

    def _check_defeat(self) -> None:
        if self.player.hp <= 0:
            self.player.hp = 0
            self.game_over = True
            self.victory = False
            self.message = "你倒在地牢深处。下一位冒险者会找到你的火把吗？"


def clear_screen() -> None:
    os.system("cls" if os.name == "nt" else "clear")


def play() -> None:
    game = Game()
    print(HELP_TEXT)
    input("\n按 Enter 开始冒险...")

    while not game.game_over:
        clear_screen()
        print(game.render())
        command = input("\n你的行动 > ")
        game.handle_command(command)

    clear_screen()
    print(game.render())
    print("\n胜利！" if game.victory else "\n冒险结束。")


if __name__ == "__main__":
    play()
