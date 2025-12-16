<script lang="ts">
    import type { HTMLInputAttributes } from 'svelte/elements'

    import { tv } from 'tailwind-variants'

    type Props = HTMLInputAttributes
    let { value = $bindable(''), ...props }: Props = $props()

    const classes = tv({
        base: 'aria-invalid:ring-red-500/20 dark:aria-invalid:ring-red-500/40 aria-invalid:border-red-500 focus-visible:border-primary focus-visible:ring-primary/20 flex h-9 w-full min-w-0 rounded-md border border-slate-300 px-2 py-1 text-base outline-none ring-offset-white transition-[color,box-shadow] focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm'
    })
</script>

<input
    {...props}
    class={classes({ class: props.class })}
    bind:value
/>
