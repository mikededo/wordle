<script lang="ts">
    import Button from '$lib/components/button.svelte'
    import Dialog from '$lib/components/dialog.svelte'
    import { disconnectFromRoom, startGame } from '$lib/context/state.svelte'

    type Props = {
        solution: string
        winner?: null | string
    }
    const { solution, winner }: Props = $props()
</script>

<Dialog id="endgame-dialog" transitionDelay={250}>
    {#snippet title()}
        {#if winner}
            {winner} has won!
        {:else}
            Game over!
        {/if}
    {/snippet}
    {#snippet description()}
        The solution was <strong>{solution}</strong>
    {/snippet}
    <Button class="w-full" variant="default" onclick={disconnectFromRoom}>Disconnect</Button>
    <Button class="w-full" variant="primary" onclick={startGame}>New game</Button>
</Dialog>
