<script lang="ts">
    import './layout.css'

    import favicon from '$lib/assets/favicon.svg'
    import { initContext } from '$lib/context/state.svelte'

    const { children } = $props()

    initContext()
</script>

<svelte:head><link href={favicon} rel="icon" /></svelte:head>
{@render children()}
