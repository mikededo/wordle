import { test } from '@playwright/test'

import { Creator, GamePlayer } from './helpers'

const PLAYERS = ['Miquel', 'Joana', 'Toni', 'Tirita']
const WINNER_GUESS = ['hello', 'woird', 'wards', 'works', 'words']
const PLAYER_GUESSES = [
  ['wasps', 'hello', 'woird', 'wurds', 'works']
]

/**
 * When running in playwright, games will always have the 'WORDS' word as
 * solution
 */
for (const count of [2, 3, 4]) {
  test.describe('Game with winner', () => {
    test(`and ${count} players`, async ({ browser }) => {
      const creator = new Creator(PLAYERS[0], WINNER_GUESS)
      const players: GamePlayer[] = []
      for (let i = 1; i < count; i++) {
        players.push(new GamePlayer(PLAYERS[i], PLAYER_GUESSES[0]))
      }

      const gameCode = await creator.createRoom(browser)
      if (!gameCode) {
        throw new Error('Game code not found')
      }

      await Promise.all(players.map((player) => player.joinRoom(browser, gameCode)))

      await creator.page.getByRole('button', { name: 'Start' }).click()
      await Promise.all([
        creator.waitForPregameHidden(),
        ...players.map((player) => player.waitForPregameHidden())
      ])
      await Promise.all([
        creator.waitForKeyboardReady(),
        ...players.map((player) => player.waitForKeyboardReady())
      ])

      for (let i = 0; i < 5; i++) {
        await Promise.all([
          creator.typeNextWord(),
          ...(players.map((player) => player.typeNextWord()) || [])
        ])
      }

      await creator.gameFinishedWithWinner(creator.name)
      await Promise.all(players.map((player) => player.gameFinishedWithWinner(creator.name)))
    })

    test('in less than 5 tries', async ({ browser }) => {
      const creator = new Creator(PLAYERS[0], WINNER_GUESS.slice(3))
      const player = new GamePlayer(PLAYERS[1], PLAYER_GUESSES[0])

      const gameCode = await creator.createRoom(browser)
      if (!gameCode) {
        throw new Error('Game code not found')
      }
      await player.joinRoom(browser, gameCode)

      await creator.page.getByRole('button', { name: 'Start' }).click()
      await Promise.all([
        creator.waitForPregameHidden(),
        player.waitForPregameHidden()
      ])
      await Promise.all([
        creator.waitForKeyboardReady(),
        player.waitForKeyboardReady()
      ])

      for (let i = 0; i < 2; i++) {
        await Promise.all([
          creator.typeNextWord(),
          player.typeNextWord()
        ])
      }

      await creator.gameFinishedWithWinner(creator.name)
      await player.gameFinishedWithWinner(creator.name)
    })
  })
}

