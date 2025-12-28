<script lang="ts" module>
    export type KeyboardKey = string | typeof BACKSPACE_KEY | typeof ENTER_KEY

    const ENTER_KEY = 'Enter' as const
    const BACKSPACE_KEY = 'Backspace' as const

    export const isEnterKey = (key: KeyboardKey): key is typeof ENTER_KEY => key === ENTER_KEY
    export const isBackspaceKey = (key: KeyboardKey): key is typeof BACKSPACE_KEY => key === BACKSPACE_KEY
</script>

<script lang="ts">
    import { ArrowRightToLine, DeleteIcon } from '@lucide/svelte'
    import { tv } from 'tailwind-variants'

    type Props = {
        disabledKeys: Set<string>
        onKeypress: (key: KeyboardKey) => void
    }
    const { disabledKeys, ...props }: Props = $props()

    const onKeypress = (key: KeyboardKey) => () => {
        props.onKeypress(key)
    }

    const keyClasses = tv({
        base: 'flex h-11 min-w-8 shrink-0 items-center justify-center rounded bg-slate-200 text-xl font-bold uppercase transition duration-150 focus:bg-slate-400 active:scale-[0.9]',
        defaultVariants: {
            key: undefined
        },
        variants: {
            disabled: {
                true: 'pointer-events-none bg-slate-50 text-slate-400'
            },
            key: {
                [BACKSPACE_KEY]: 'bg-secondary text-secondary-foreground focus:bg-secondary',
                [ENTER_KEY]: 'bg-primary text-primary-foreground focus:bg-primary',
                undefined: ''
            }
        }
    })
</script>

<div class="flex shrink-0 flex-col items-center gap-1  border-t border-slate-200 bg-white px-2 py-3 uppercase">
    <div class="flex w-full items-center justify-center gap-1">
        {#each ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'] as key}
            <button
                class={keyClasses({ disabled: disabledKeys.has(key) })}
                id="keyboard-{key.toLowerCase()}"
                style="width: calc(100% / 10 - 0.2rem)"
                onclick={onKeypress(key)}
            >
                {key}
            </button>
        {/each}
    </div>
    <div class="flex w-full items-center justify-center gap-1">
        {#each ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'] as key}
            <button
                class={keyClasses({ disabled: disabledKeys.has(key) })}
                id="keyboard-{key.toLowerCase()}"
                style="width: calc(100% / 9 - 0.4rem)"
                onclick={onKeypress(key)}
            >
                {key}
            </button>
        {/each}
    </div>
    <div class="flex w-full items-center justify-center gap-1">
        {#each [ENTER_KEY, 'Z', 'X', 'C', 'V', 'B', 'N', 'M', BACKSPACE_KEY] as const as key}
            {@const isSpecialKey = isEnterKey(key) || isBackspaceKey(key)}
            <button
                class={keyClasses({ disabled: disabledKeys.has(key), key: isSpecialKey ? key : undefined })}
                id="keyboard-{key.toLowerCase()}"
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
</div>
