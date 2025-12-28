<script lang="ts">
    import { LetterResult } from '@wordle/server'

    import { getAppContext } from '$lib/context/state.svelte'

    import { resultVariants } from './submission-letter.svelte'

    const DEFAULT_GUESS = Array.from({ length: 5 }, () => LetterResult.Absent)

    const appState = getAppContext()
    const players = $derived(appState.game?.players || [])

    const getPlayerLastGuess = (name: string): LetterResult[] => {
        const playerSubmissions = appState.game?.playerSubmissions[name]
        if (!playerSubmissions) {
            return DEFAULT_GUESS
        }

        return playerSubmissions[playerSubmissions.length - 1] || DEFAULT_GUESS
    }
</script>

<div class="h-30 flex-col gap-1 border-b border-slate-200 px-4 pt-2 text-sm">
    <p class="font-semibold">Players:</p>
    {#each players.slice(0, 3) as player}
        <div class="flex items-center justify-between">
            <p>{player}</p>

            <div class="flex gap-0.5">
                {#each getPlayerLastGuess(player) as result}
                    <div class={resultVariants({ class: 'size-4 rounded-sm', result })}></div>
                {/each}
            </div>
        </div>
    {/each}
    {#if players.length > 3}
        <p>and {players.length - 3} more...</p>
    {/if}
</div>

