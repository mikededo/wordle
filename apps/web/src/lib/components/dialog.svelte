<script lang="ts">
    import type { Snippet } from 'svelte'

    import { fade } from 'svelte/transition'

    const FOCUSABLE_SELECTORS = 'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

    type Props = {
        children: Snippet
        title: Snippet
        description: Snippet
        testId?: string
        transitionDelay?: number
    }
    const { children, description, testId, title, transitionDelay = 0 }: Props = $props()

    let dialogElement: HTMLDivElement | null = $state(null)

    const handleKeydown = (event: KeyboardEvent) => {
        if (!dialogElement || event.key !== 'Tab') {
            return
        }

        const focusable = Array.from(
            dialogElement.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTORS)
        ).filter((element) => element.getAttribute('aria-hidden') !== 'true')

        if (focusable.length === 0) {
            event.preventDefault()
            dialogElement.focus()
            return
        }

        const first = focusable[0]!
        const last = focusable[focusable.length - 1]!
        const active = document.activeElement

        if (event.shiftKey && (active === first || active === dialogElement)) {
            event.preventDefault()
            last.focus()
        } else if (!event.shiftKey && active === last) {
            event.preventDefault()
            first.focus()
        }
    }

    $effect(() => {
        if (!dialogElement) {
            return
        }

        const previousActiveEl = document.activeElement as HTMLElement | null
        const backgroundEl = document.querySelector<HTMLElement>('[data-app-root]')

        backgroundEl?.setAttribute('inert', '')
        backgroundEl?.setAttribute('aria-hidden', 'true')
        dialogElement.focus()

        return () => {
            backgroundEl?.removeAttribute('inert')
            backgroundEl?.removeAttribute('aria-hidden')
            previousActiveEl?.focus()
        }
    })
</script>

<div
    class="fixed inset-0 bg-black/50"
    in:fade={{ delay: transitionDelay, duration: 150 }}
    out:fade={{ duration: 150 }}
    aria-hidden="true"
    data-testid={testId ? `${testId}-overlay` : undefined}
></div>
<div
    class="fixed left-1/2 top-1/2 z-50 flex min-w-80 -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-2 rounded-lg bg-white p-4"
    bind:this={dialogElement}
    role="dialog"
    tabindex="-1"
    in:fade={{ delay: transitionDelay, duration: 150 }}
    out:fade={{ duration: 150 }}
    onkeydown={handleKeydown}
    aria-describedby={testId ? `${testId}-description` : undefined}
    aria-labelledby={testId ? `${testId}-title` : undefined}
    aria-modal="true"
    data-testid={testId}
>
    <p class="w-full text-center text-lg font-semibold" id={testId ? `${testId}-title` : undefined}>
        {@render title()}
    </p>
    <p class="w-full text-center" id={testId ? `${testId}-description` : undefined}>
        {@render description()}
    </p>
    <div class="mt-2 flex w-full items-center gap-2">
        {@render children()}
    </div>
</div>

