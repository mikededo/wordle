<script lang="ts">
    import { cn } from 'tailwind-variants'

    const letters = ['W', 'O', 'R', 'D', 'L', 'E']
</script>

<div class="flex items-center justify-center gap-1.5">
    {#each letters as letter, index(index)}
        <div
            class={cn('w-12 h-12 md:w-14 md:h-14 flex items-center justify-center rounded-lg transform hover:scale-105 transition-transform active:scale-105 duration-200', index % 2 === 0 ? 'bg-primary text-primary-foreground active:rotate-12 hover:rotate-12' : 'bg-secondary active:-rotate-12 hover:-rotate-12 text-secondary-foreground')}
        >
            <span class="text-2xl font-bold md:text-3xl">
                {letter}
            </span>
        </div>
    {/each}
</div>

