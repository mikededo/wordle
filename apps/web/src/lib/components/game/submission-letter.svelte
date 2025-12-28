<script module>
    import { LetterResult } from '@wordle/server'
    import { tv } from 'tailwind-variants'

    export const resultVariants = tv({
        variants: {
            result: {
                [LetterResult.Absent]: 'border-slate-400 bg-slate-400',
                [LetterResult.Correct]: 'bg-primary text-primary-foreground border-primary',
                [LetterResult.Present]: 'bg-secondary text-secondary-foreground border-secondary'

            }
        }
    })
</script>

<script lang="ts">
    import type { VariantProps } from 'tailwind-variants'

    type Props = {
        index: number
        answer?: VariantProps<typeof submissionLetterClass>['result']
        key?: null | string
    }
    const { answer, index, key }: Props = $props()

    const submissionLetterClass = tv({
        base: 'flex size-16 items-center justify-center rounded-lg border border-slate-300 text-4xl font-bold uppercase transition-colors duration-200 ease-out',
        extend: resultVariants
    })
</script>

<p
    class={submissionLetterClass({ result: answer })}
    style="transition-delay: calc(0.05s * {index})"
>
    {key}
</p>
