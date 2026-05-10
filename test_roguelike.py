import unittest

from roguelike import Game, Position, STARTING_HP


class RoguelikeTests(unittest.TestCase):
    def make_small_game(self) -> Game:
        game = Game(seed=7, width=12, height=8)
        game.walls = {
            Position(x, y)
            for y in range(game.height)
            for x in range(game.width)
            if x == 0 or y == 0 or x == game.width - 1 or y == game.height - 1
        }
        game.player.position = Position(1, 1)
        game.exit_position = Position(10, 6)
        game.treasures = set()
        game.potions = set()
        game.monsters = []
        game.message = ""
        return game

    def test_generated_map_has_expected_objects(self) -> None:
        game = Game(seed=1)

        self.assertNotIn(game.player.position, game.walls)
        self.assertNotIn(game.exit_position, game.walls)
        self.assertEqual(len(game.treasures), 7)
        self.assertEqual(len(game.potions), 4)
        self.assertEqual(len(game.monsters), 6)

    def test_player_cannot_walk_through_walls(self) -> None:
        game = self.make_small_game()

        game.handle_command("a")

        self.assertEqual(game.player.position, Position(1, 1))
        self.assertIn("石墙", game.message)

    def test_collecting_treasure_increases_gold(self) -> None:
        game = self.make_small_game()
        game.treasures = {Position(2, 1)}

        game.handle_command("d")

        self.assertEqual(game.player.position, Position(2, 1))
        self.assertEqual(game.player.gold, 1)
        self.assertFalse(game.treasures)

    def test_potion_heals_player(self) -> None:
        game = self.make_small_game()
        game.player.hp = STARTING_HP - 5
        game.potions = {Position(2, 1)}

        game.handle_command("d")

        self.assertEqual(game.player.hp, STARTING_HP)
        self.assertFalse(game.potions)

    def test_reaching_exit_wins_the_game(self) -> None:
        game = self.make_small_game()
        game.player.position = Position(9, 6)

        game.handle_command("d")

        self.assertTrue(game.game_over)
        self.assertTrue(game.victory)


if __name__ == "__main__":
    unittest.main()
