<script lang="ts">
    import Button from '$lib/components/button.svelte'
    import Dialog from '$lib/components/dialog.svelte'
    import { disconnectFromRoom, startGame } from '$lib/context/state.svelte'

    type Props = { room: string }
    const { room }: Props = $props()
</script>

<Dialog id="pregame-dialog">
    {#snippet title()}
        Game hasn't started yet
    {/snippet}
    {#snippet description()}
        Share the code <strong>{room}</strong> with your friends
    {/snippet}

    <Button class="w-full" variant="default" onclick={disconnectFromRoom}>Disconnect</Button>
    <Button class="w-full" variant="primary" onclick={startGame}>Start</Button>
</Dialog>
