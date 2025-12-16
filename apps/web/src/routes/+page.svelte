<script lang="ts">
    import { ArrowRightIcon, LoaderCircleIcon, SparklesIcon } from '@lucide/svelte'

    import Button from '$lib/components/button.svelte'
    import Input from '$lib/components/input.svelte'
    import Logo from '$lib/components/logo.svelte'
    import { createRoomAndConnect } from '$lib/context/state.svelte'
    import { GameConnection } from '$lib/service'

    let view = $state<'create' | 'join' | null>('create')
    let loading = $state(false)
    const connection = $state<GameConnection | null>(null)

    let name = $state<string>('')

    const setView = (next: typeof view) => () => {
        view = next
    }

    const createRoom = () => {
        loading = true
        createRoomAndConnect(name, {
            onError: () => {
                loading = false
            },
            onSuccess: () => {
                loading = false
            }
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
    <div class="border-secondary/60 border-3 w-full space-y-6 rounded-xl bg-white p-4">
        <div class="p-0.75 flex items-center gap-2 rounded-lg bg-slate-200">
            <Button
                class="w-full py-1.5 focus:scale-100 active:scale-100 data-[active=true]:bg-white"
                onclick={setView('create')}
                data-active={view === 'create'}
            >
                Create room
            </Button>
            <Button
                class="w-full py-1.5 focus:scale-100 active:scale-100 data-[active=true]:bg-white"
                onclick={setView('join')}
                data-active={view === 'join'}
            >
                <span>Join room</span>
            </Button>
        </div>

        {#if view === 'create'}
            <section class="flex w-full flex-col items-center gap-4">
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
            </section>
        {:else if view === 'join'}
            <section class="flex w-full flex-col items-center gap-4">
                <div class="flex w-full flex-col items-start gap-1">
                    <label class="text-sm font-medium" for="name">Name</label>
                    <Input
                        id="name"
                        placeholder="Pedri"
                        type="text"
                    />
                </div>
                <div class="flex w-full flex-col items-start gap-1">
                    <label class="text-sm font-medium" for="name">Room code</label>
                    <Input id="name" placeholder="XXXXX" type="text" />
                </div>
                <Button class="w-full" variant="secondary">
                    <span>Join room</span>
                    <ArrowRightIcon />
                </Button>
            </section>
        {/if}
    </div>
</main>

