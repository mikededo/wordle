<script lang="ts">
    import { fade } from 'svelte/transition'

    import Button from '$lib/components/button.svelte'
    import { disconnectFromRoom, startGame } from '$lib/context/state.svelte'

    type Props = { room: string }
    const { room }: Props = $props()

    const onStartGame = () => {
        startGame()
    }

    const onDisconnect = () => {
        disconnectFromRoom()
    }
</script>

<div class="fixed inset-0 bg-black opacity-50" transition:fade={{ duration: 150 }}></div>
<div
    class="fixed left-1/2 top-1/2 z-50 flex min-w-80 -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center gap-2 rounded-lg bg-white p-4"
    transition:fade={{ duration: 150 }}
>
    <p class="w-full text-center text-lg font-semibold">Game hasn't started yet</p>
    <p class="w-full text-center">
        Share the code <strong>{room}</strong> with your friends
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
