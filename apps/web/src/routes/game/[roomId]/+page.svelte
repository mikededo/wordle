<script lang="ts">
    import type { PageData } from './$types'

    import { ArrowRightToLine, DeleteIcon } from '@lucide/svelte'
    import { fade } from 'svelte/transition'
    import { tv } from 'tailwind-variants'

    import Button from '$lib/components/button.svelte'
    import { disconnectFromRoom, getAppContext, startGame } from '$lib/context/state.svelte'

    type Props = { data: PageData }
    const { data }: Props = $props()

    const ENTER_KEY = 'Enter' as const
    const BACKSPACE_KEY = 'Backspace' as const
    type Key = string | typeof BACKSPACE_KEY | typeof ENTER_KEY

    const appState = getAppContext()

    const round = $state<{ keys: Key[][], count: number }>({
        count: 0,
        keys: []
    })

    const buttonClasses = tv({
        base: 'flex h-11 min-w-8 shrink-0 items-center justify-center rounded bg-slate-200 text-xl font-bold uppercase transition duration-150 focus:bg-slate-400 active:scale-[0.9]',
        defaultVariants: {
            key: undefined
        },
        variants: {
            key: {
                [BACKSPACE_KEY]: 'bg-secondary text-secondary-foreground focus:bg-secondary',
                [ENTER_KEY]: 'bg-primary text-primary-foreground focus:bg-primary',
                undefined: ''
            }
        }
    })

    const onKeypress = (key: Key) => () => {
        if (key === BACKSPACE_KEY) {
            round.keys[round.count] = round.keys[round.count].slice(0, -1)
            return
        }

        if (key === ENTER_KEY) {
            if (round.keys[round.count].length < 5) {
                return
            }
            round.count += 1
            return
        }

        if (round.keys[round.count] === undefined) {
            round.keys[round.count] = []
        }

        if (round.keys[round.count].length === 5) {
            return
        }
        round.keys[round.count].push(key)
    }

    const onStartGame = () => {
        startGame()
    }

    const onDisconnect = () => {
        disconnectFromRoom()
    }
</script>

{#if appState.user && !appState.user.hasGameStarted}
    <div class="fixed inset-0 bg-black opacity-50" transition:fade={{ duration: 150 }}></div>
    <div
        class="fixed left-1/2 top-1/2 z-50 flex min-w-80 -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center gap-2 rounded-lg bg-white p-4"
        transition:fade={{ duration: 150 }}
    >
        <p class="w-full text-center text-lg font-semibold">Game hasn't started yet</p>
        <p class="w-full text-center">
            Share the code <strong>{appState.user.room}</strong> with your friends
        </p>
        <div class="mt-2 flex w-full items-center gap-2">
            <Button class="w-full" variant="default" onclick={onDisconnect}>
                Disconnect
            </Button>
            <Button class="w-full" variant="primary" onclick={onStartGame}>
                Start
            </Button>
        </div>
    </div>
{/if}

<div class="flex h-dvh w-dvw flex-col">
    <header class="flex h-12 shrink-0 items-center justify-between border-b border-slate-200 px-4">
        <p class="text-sm font-medium">{appState.user?.playerName} | {data.roomId}</p>
        <Button size="sm" variant="muted" onclick={onDisconnect}>Disconnect</Button>
    </header>

    <main class="flex w-full flex-1 flex-col items-center justify-center gap-2">
        {#each { length: 6 } as _, roundIndex}
            <div class="grid grid-cols-5 items-center justify-center gap-1">
                {#each { length: 5 } as _, keyIndex}
                    <p class="flex size-16 items-center justify-center rounded-lg border border-slate-300 bg-white text-4xl font-bold uppercase">
                        {round.keys[roundIndex] ? round.keys[roundIndex][keyIndex] : null}
                    </p>
                {/each}
            </div>
        {/each}
    </main>

    <footer class="flex shrink-0 flex-col items-center gap-1  border-t border-slate-200 bg-white px-2 py-3 uppercase">
        <div class="flex w-full items-center justify-center gap-1">
            {#each ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'] as key}
                <button
                    class={buttonClasses()}
                    style="width: calc(100% / 10 - 0.2rem)"
                    onclick={onKeypress(key)}
                >
                    {key}
                </button>
            {/each}
        </div>
        <div class="flex w-full items-center justify-center gap-1">
            {#each ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'] as key}
                <button
                    class={buttonClasses()}
                    style="width: calc(100% / 9 - 0.4rem)"
                    onclick={onKeypress(key)}
                >
                    {key}
                </button>
            {/each}
        </div>
        <div class="flex w-full items-center justify-center gap-1">
            {#each [ENTER_KEY, 'z', 'x', 'c', 'v', 'b', 'n', 'm', BACKSPACE_KEY] as const as key}
                {@const isSpecialKey = key === ENTER_KEY || key === BACKSPACE_KEY}
                <button
                    class={buttonClasses({ key: isSpecialKey ? key : undefined })}
                    style="width: calc(100% / {isSpecialKey ? 7 : 11})"
                    onclick={onKeypress(key)}
                >
                    {#if key === 'Backspace'}
                        <DeleteIcon class="size-5" />
                    {:else if key === 'Enter'}
                        <ArrowRightToLine class="size-5" />
                    {:else}
                        {key}
                    {/if}
                </button>
            {/each}
        </div>
    </footer>
</div>
