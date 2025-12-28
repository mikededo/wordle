import type { Browser, Page } from '@playwright/test'

import { expect } from '@playwright/test'

const PREGAME_DIALOG_TEXT = `Game hasn't started yet`
const PLAYERS_LABEL_TEXT = 'Players:'
const SOLUTION_TEXT = 'The solution was WORDS'
const GAME_OVER_TEXT = 'Game over!'

export class GamePlayer {
  get name() {
    return this._name
  }

  get page() {
    if (!this._page) {
      throw new Error('Page not initialized')
    }

    return this._page
  }

  protected _page?: Page
  protected _wordIndex: number = 0

  constructor(protected _name: string, protected words: string[]) {
    this.words = words
  }

  public async clickDisconnect() {
    await this.page.getByRole('button', { name: 'Disconnect' }).click()
  }

  public expectPlayerHidden(playerName: string) {
    const playerList = this.page.getByText(PLAYERS_LABEL_TEXT, { exact: true }).locator('..')
    expect(playerList.getByText(playerName, { exact: true })).toBeHidden()
  }

  public expectPlayerVisible(playerName: string) {
    const playerList = this.page.getByText(PLAYERS_LABEL_TEXT, { exact: true }).locator('..')
    expect(playerList.getByText(playerName, { exact: true })).toBeVisible()
  }

  public gameFinishedNoWinner() {
    expect(this.page.getByText(GAME_OVER_TEXT)).toBeVisible()
    expect(this.page.getByText(SOLUTION_TEXT)).toBeVisible()
  }

  public gameFinishedWithWinner(expectedWinner: string) {
    expect(this.page.getByText(`${expectedWinner} has won`)).toBeVisible()
    expect(this.page.getByText(SOLUTION_TEXT)).toBeVisible()
  }

  public async joinRoom(browser: Browser, roomCode: string) {
    const context = await browser.newContext()
    this._page = await context.newPage()
    await this._page.goto('http://localhost:5173')
    await this._page.getByRole('button', { name: 'Join room' }).click()
    await this._page.getByPlaceholder('Pedri').fill(this._name)
    await this._page.getByPlaceholder('XXXXX').fill(roomCode)
    await this._page.getByRole('button', { name: /Join game/ }).click()
    await this._page.waitForURL('/game/*')
    await this.waitForPregameVisible()
  }

  public async typeNextWord() {
    if (!this._page) {
      throw new Error('Page not initialized')
    }

    const word = this.words[this._wordIndex]
    if (!word) {
      throw new Error('No more words left to type')
    }

    await this.typeWord(word)
    this._wordIndex += 1
  }

  public async waitForKeyboardReady() {
    await expect(this.page.locator('button#keyboard-enter')).toBeVisible()
    await expect(this.page.locator('button#keyboard-backspace')).toBeVisible()
    await expect(this.page.locator('button#keyboard-a')).toBeVisible()
  }

  public async waitForPregameHidden() {
    await expect(this.page.getByText(PREGAME_DIALOG_TEXT)).toBeHidden()
  }

  public async waitForPregameVisible() {
    await expect(this.page.getByText(PREGAME_DIALOG_TEXT)).toBeVisible()
  }

  private async typeWord(word: string) {
    if (!this._page) {
      throw new Error('Page not initialized')
    }

    for (const letter of word.toLowerCase().split('')) {
      await this._page.locator(`button#keyboard-${letter}`).click()
    }
    await this._page.locator('button#keyboard-enter').click()
  }
}

export class Creator extends GamePlayer {
  public room?: string

  public async createRoom(browser: Browser): Promise<string> {
    const browserContext = await browser.newContext()
    this._page = await browserContext.newPage()

    await this._page.goto('http://localhost:5173')
    await this._page.getByPlaceholder('Pedri').fill(this._name)
    await this._page.getByRole('button', { name: /Create room/ }).click()

    await this._page.waitForURL('/game/*')
    await this.waitForPregameVisible()

    const gameCode = new URL(this._page.url()).pathname.split('/').pop()
    if (!gameCode) {
      throw new Error('Game code not found')
    }

    this.room = gameCode
    return this.room
  }
}
