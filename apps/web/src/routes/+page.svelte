<script lang="ts">
    import { LoaderCircleIcon, LogInIcon, SparklesIcon } from '@lucide/svelte'
    import { cn } from 'tailwind-variants'

    import Button from '$lib/components/button.svelte'
    import Input from '$lib/components/input.svelte'
    import Logo from '$lib/components/logo.svelte'
    import { connectToRoom } from '$lib/context/state.svelte'
    import { GameConnection } from '$lib/service'

    let view = $state<'create' | 'join' | null>('create')
    let formContainerHeight = $state<'auto' | number>('auto')

    let loading = $state(false)
    const connection = $state<GameConnection | null>(null)

    let name = $state<string>('')
    let code = $state<string>('')

    const setView = (next: typeof view) => () => {
        view = next
    }

    const createRoom = () => {
        loading = true
        connectToRoom({
            onError: () => {
                loading = false
            },
            onSuccess: () => {
                loading = false
            },
            playerName: name
        })
    }

    const joinRoom = () => {
        loading = true
        connectToRoom({
            onError: () => {
                loading = false
            },
            onSuccess: () => {
                loading = false
            },
            playerName: name,
            room: code
        })
    }

    $effect(() => () => {
        connection?.close()
    })
</script>

<main class="mx-auto flex h-dvh w-dvw max-w-[calc(100dvw*0.85)] flex-col items-center justify-center gap-8 lg:max-w-sm">
    <div class="flex flex-col items-center gap-4">
        <Logo />
        <p class="text-slate-700">Challenge your friends at Wordle!</p>
    </div>
    <div
        class={cn('border-primary/60 border-3 w-full space-y-6 rounded-xl bg-white p-4 transition-colors duration-150', view === 'join' && 'border-secondary/60')}
    >
        <div class="p-0.75 group relative flex items-center gap-2 rounded-lg bg-slate-200" data-active={view}>
            <div
                class="absolute inset-y-1 left-1 right-1/2 rounded-md bg-white transition-all duration-200 ease-out group-data-[active=join]:left-1/2 group-data-[active=join]:right-1"
            ></div>
            <Button
                class="z-1 w-full bg-transparent py-1.5 focus:scale-100 active:scale-100"
                onclick={setView('create')}
                data-active={view === 'create'}
            >
                Create room
            </Button>
            <Button
                class="z-1 w-full bg-transparent py-1.5 focus:scale-100 active:scale-100"
                onclick={setView('join')}
                data-active={view === 'join'}
            >
                <span>Join room</span>
            </Button>
        </div>

        <section
            class="transition-all duration-150 ease-out"
            style="height: {formContainerHeight === 'auto' ? 'auto' : `${formContainerHeight}px`}"
        >
            <div
                class="flex w-full flex-col items-center gap-4"
                bind:clientHeight={formContainerHeight}
            >
                {#if view === 'create'}
                    <div class="flex w-full flex-col items-start gap-1">
                        <label class="text-sm font-medium" for="name">Name</label>
                        <Input bind:value={name} placeholder="Pedri" />
                    </div>
                    <Button
                        class="w-full"
                        disabled={!name || loading}
                        variant="primary"
                        onclick={createRoom}
                    >
                        <span>Create room</span>
                        {#if loading}
                            <LoaderCircleIcon class="animate-spin" />
                        {:else}
                            <SparklesIcon />
                        {/if}
                    </Button>
                {:else if view === 'join'}
                    <div class="flex w-full flex-col items-start gap-1">
                        <label class="text-sm font-medium" for="name">Name</label>
                        <Input
                            bind:value={name}
                            id="name"
                            placeholder="Pedri"
                            variant="secondary"
                        />
                    </div>
                    <div class="flex w-full flex-col items-start gap-1">
                        <label class="text-sm font-medium" for="name">Room code</label>
                        <Input
                            class="uppercase"
                            bind:value={code}
                            id="code"
                            maxlength={5}
                            placeholder="XXXXX"
                            variant="secondary"
                        />
                    </div>
                    <Button
                        class="w-full"
                        disabled={!name || code.length < 5 || loading}
                        variant="secondary"
                        onclick={joinRoom}
                    >
                        <span>Join room</span>
                        <LogInIcon />
                    </Button>
                {/if}
            </div>
        </section>
    </div>
</main>

