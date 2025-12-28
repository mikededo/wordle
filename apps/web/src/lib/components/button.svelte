<script lang="ts">
    import type { HTMLButtonAttributes } from 'svelte/elements'
    import type { VariantProps } from 'tailwind-variants'

    import { tv } from 'tailwind-variants'

    type Props = HTMLButtonAttributes & VariantProps<typeof classes>
    const { size, variant, ...props }: Props = $props()

    const classes = tv({
        base: 'flex items-center justify-center gap-1 rounded-md px-4 py-2 text-sm font-medium outline-none ring-2 ring-transparent transition-all [&>svg]:size-4',
        defaultVariants: {
            variant: 'default'
        },
        variants: {
            size: {
                default: '',
                sm: 'px-2 py-1'
            },
            variant: {
                default: 'bg-slate-200 text-black focus-visible:ring-slate-400 disabled:bg-slate-50 disabled:text-slate-300',
                muted: 'bg-white text-black hover:bg-slate-200 focus-visible:ring-slate-400',
                primary: 'bg-primary focus-visible:ring-primary/50 text-primary-foreground disabled:bg-primary/50 disabled:text-primary-foreground/75',
                secondary: 'bg-secondary focus-visible:ring-secondary/50 text-secondary-foreground disabled:bg-secondary/50 disabled:text-secondary-foreground/50'
            }
        }
    })
</script>

<button
    {...props}
    class={classes({ class: props.class, size, variant })}
>
    {@render props.children?.()}
</button>
