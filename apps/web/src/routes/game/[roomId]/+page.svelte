<script lang="ts">
    import type { KeyboardKey } from '$lib/components/game/keyboard.svelte'

    import type { PageData } from './$types'

    import Button from '$lib/components/button.svelte'
    import EndgameDialog from '$lib/components/game/endgame-dialog.svelte'
    import Keyboard, { isBackspaceKey, isEnterKey } from '$lib/components/game/keyboard.svelte'
    import PlayerList from '$lib/components/game/player-list.svelte'
    import PregameDialog from '$lib/components/game/pregame-dialog.svelte'
    import SubmissionLetter from '$lib/components/game/submission-letter.svelte'
    import { disconnectFromRoom, getAppContext, submitAnswer } from '$lib/context/state.svelte'

    type Props = { data: PageData }
    const { data }: Props = $props()

    const appState = getAppContext()

    const round = $state<{ keys: KeyboardKey[][] }>({ keys: [] })

    const roundNumber = $derived((appState.game?.currentRound ?? 1) - 1)
    const disabledKeys = $derived(appState.game?.keyStates.absentKeys ?? new Set<string>())

    const onKeypress = (key: KeyboardKey) => {
        if (isBackspaceKey(key)) {
            round.keys[roundNumber] = round.keys[roundNumber].slice(0, -1)
            return
        }

        if (isEnterKey(key)) {
            if (round.keys[roundNumber].length < 5) {
                return
            }

            submitAnswer(round.keys[roundNumber].join(''))
            return
        }

        if (round.keys[roundNumber] === undefined) {
            round.keys[roundNumber] = []
        }

        if (round.keys[roundNumber].length === 5) {
            return
        }
        round.keys[roundNumber].push(key)
    }

    const onDisconnect = () => {
        disconnectFromRoom()
    }
</script>

{#if appState.user}
    {#if !appState.game?.isGameStarted}
        <PregameDialog room={data.roomId} />
    {/if}
    {#if appState.game?.winner}
        <EndgameDialog
            solution={appState.game.correctWord ?? ''}
            winner={appState.game.gameWinner}
        />
    {/if}
{/if}

<div class="flex h-dvh w-dvw flex-col" data-app-root>
    <header class="flex h-12 shrink-0 items-center justify-between border-b border-slate-200 px-4">
        <p class="text-sm font-medium">{appState.user?.playerName} | {data.roomId}</p>
        <Button size="sm" variant="muted" onclick={onDisconnect}>Disconnect</Button>
    </header>
    <main class="flex h-full w-full flex-1 flex-col">
        <div class="bg-primary h-1 transition-all" style="width: {(appState.game?.timeRemaining ?? 0) * 100 / 60}%"></div>

        <PlayerList />

        <section class="flex flex-1 flex-col items-center justify-center gap-1">
            {#each { length: 5 } as _, roundIndex}
                <div class="grid grid-cols-5 items-center justify-center gap-1">
                    {#each { length: 5 } as _, keyIndex}
                        {@const roundSubmission = appState.game?.mySubmissions[roundIndex]}
                        {@const answer = roundSubmission?.result[keyIndex]}
                        {@const letter = round.keys[roundIndex] ? round.keys[roundIndex][keyIndex] : null}

                        <SubmissionLetter index={keyIndex} key={letter} {answer} />
                    {/each}
                </div>
            {/each}
        </section>
    </main>

    <Keyboard {disabledKeys} {onKeypress} />
</div>
