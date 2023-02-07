<script lang="ts">
    import type { Team } from '$lib/mongo';
    import type { PageData } from './$types';
    import { userStore } from '$lib/stores/user';
    import MemberMenu from '$lib/components/MemberMenu.svelte';
    import Select from "svelte-select"
    import Payment from '$lib/components/Payment.svelte';
    import { getContext } from 'svelte';
    import EditField from '$lib/components/EditField.svelte';
    import type { Writable } from 'svelte/store';
    import Confirm from '$lib/components/Confirm.svelte';
    import Message from '$lib/components/Message.svelte';
    import type { ActionResult } from '@sveltejs/kit';

    export let data: PageData
    let { teams } = data
    $: ({ teams } = data)
    
    const modalStore: Writable<{
        component: ConstructorOfATypedSvelteComponent,
        props: Record<string, unknown>
    } | null> = getContext('modalStore')

    let selectedTeam: Team | null = teams[0] ?? null


    async function createTeam() {
        $modalStore = {
            component: EditField,
            props: {
                headerText: "Create Team",
                initialValue: "",
                actionName: "createTeam",
                cancelCallback: () => {
                    $modalStore = null
                },
                confirmCallback: (_: FormData, result: ActionResult) => {
                    if (result.type === "success") {
                        const created = result.data?.team as Team
                        if (created) {
                            teams = [...teams, created]
                            selectedTeam = created
                        }
                    }
                    $modalStore = null
                }
            }
        }
    }


    function handleRename() {
        if (!selectedTeam) return

        $modalStore = {
            component: EditField,
            props: {
                headerText: "Rename Team",
                initialValue: selectedTeam.name || "",
                actionName: "teamName",
                hiddenInputs: {
                    'team-id': selectedTeam._id
                },
                cancelCallback: () => {
                    $modalStore = null
                },
                confirmCallback: (data: FormData) => {
                    if (selectedTeam) {
                        const name = data.get('teamName') as string
                        selectedTeam.name = name
                    }
                    $modalStore = null
                }
            }
        }
    }


    function handlePayment() {
        $modalStore = {
            component: Payment,
            props: {
                teams,
                closeCallback: () => {
                    $modalStore = null
                }
            }
        }
    }


    function handleDelete() {
        if (!selectedTeam) return

        if (selectedTeam.paid) {
            $modalStore = {
                component: Message,
                props: {
                    headerText: "Failed to Delete",
                    message: "This team has already been paid for and cannot be deleted. Please contact tournament organizers to delete this team.",
                    closeCallback: () => {
                        $modalStore = null
                    }
                }
            }
        } else {
            $modalStore = {
                component: Confirm,
                props: {
                    headerText: "Delete Team",
                    message: `Are you sure you want to delete ${selectedTeam.name}?`,
                    cancelCallback: () => {
                        $modalStore = null
                    },
                    confirmCallback: async () => {
                        if (!selectedTeam) return

                        const res = await fetch("/api/teams/" + selectedTeam._id, {
                            method: "DELETE"
                        })
                        if (res.ok) {
                            teams = teams.filter(x => x._id != selectedTeam?._id)
                            selectedTeam = null
                            $modalStore = null
                        } else {
                            $modalStore = {
                                component: Message,
                                props: {
                                    headerText: "Failure",
                                    message: `Failed to delete ${selectedTeam.name}`,
                                    closeCallback: () => {
                                        $modalStore = null
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
</script>

<svelte:head>
    <title>Edit your teams</title>
    <meta name="description" content="Edit your teams and register new ones to participate in ESBOT" />
</svelte:head>

<main>
    {#if $userStore.verified}
        <div class='menu'>
            <div class="select-wrapper">
                <Select items={teams} itemId="_id" label="name"  bind:value={selectedTeam}
                    showChevron={true} clearable={false} searchable={false} />
            </div>
            <button class="create-team" on:click={createTeam}>New Team</button>
            <button class="rename-team" on:click={handleRename}>Rename</button>
            <button class="pay" on:click={handlePayment}>Pay</button>
            <button class="delete-team" on:click={handleDelete}></button>
        </div>
        {#if selectedTeam}
            {#key selectedTeam}
                <div class="edit-menu">
                    <div class="team-name">
                        <h1>
                            {#if selectedTeam.paid}
                                <span class="paid">$</span>
                            {/if}
                            {selectedTeam.name}
                            <button class="icon edit" on:click={handleRename} />
                        </h1>
                    </div>
                    <MemberMenu teamData={selectedTeam} />
                </div>
            {/key}
        {:else} 
            <div>
                <h2>No team selected</h2>
                <h2>Select a team or make a new team</h2>
            </div>
        {/if}
        
    {:else}
        <h1>You have not verified your email yet</h1>
        <p class="message">
            After registering, you should have received an email with a link to verify your account sent to your primary email (the one used to log in).
            If you have not received a verification email, please reach out to the tournament orgaizers on Discord or at <a href="mailto:enloescibowl@gmail.com">enloescibowl@gmail.com</a>
        </p>
    {/if}
</main>

<style lang="scss">
    h1, h2 {
        text-align: center;
    }

    .message {
        max-width: 70ch;
        text-align: center;
        margin: auto;
    }

    .menu {
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: center;
        flex-wrap: wrap;
        gap: 1em;
        padding: 0 max(3em, 15vw);

        @media (max-width: 600px) {
            flex-direction: column;
            gap: 0;
        }
    }

    .create-team {
        @media (min-width: 600px) {
            margin-right: auto;
        }
    }

    .select-wrapper {
        width: 100%;
        max-width: 30ch;
    }

    .team-name {
        margin-left: max(2em, 15vw);
    }

    main {
        padding-top: 2em;
        column-gap: 2em;
    }

    h1 {
       display: inline-block;
    }

    .icon {
        display: inline-block;
        height: 0.75em;
        width: 0.75em;
        background-size: cover;
        vertical-align: middle;
        border: none;
        border-radius: 0;
        padding: 0;
        margin: 0 0 0 0.5em;
        font-size: inherit;
        cursor: pointer;
        background-color: transparent;
    }

    .paid {
        color: var(--color-2);
        font-weight: bold;
        font-size: 1.2em;
    }

    .edit {
        background-image: url('/pencil.png');
    }

    .delete-team {
        background-image: url('/trash.svg');
        background-repeat: no-repeat;
        background-size: 50%;
        background-position: 50%;
        height: 2.5em;
        padding: 0.5em 1.5em;
    }

    button {
        padding: 0.5em;
        margin: .5em;
        color: #EEE;
        background: var(--color-2);
        border-radius: 0.3em;
        font-weight: bold;
        border: solid black 3px;
        font-size: 18px;
        cursor: pointer;

        &:disabled {
            border: solid var(--color-2) 3px;
            background: transparent;
            color: #444;
            cursor: default;
        }
    }
</style>