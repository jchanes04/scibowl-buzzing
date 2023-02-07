<script lang="ts">
    import type { UserClean } from "$lib/mongo";
    import type { Writable } from "svelte/store";
    import { getContext } from "svelte";
    import EditField from "../EditField.svelte";
    import ConfirmEmailSend from "../Confirm.svelte";
    import Message from "../Message.svelte";
    import Confirm from "../Confirm.svelte";
    import { invalidateAll } from "$app/navigation";

    export let user: UserClean

    const modalStore: Writable<{
        component: ConstructorOfATypedSvelteComponent,
        props: Record<string, unknown>
    } | null> = getContext('modalStore')

    function handleRenameSchool() {
        $modalStore = {
            component: EditField,
            props: {
                headerText: "Rename School",
                initialValue: user.schoolName,
                actionName: "schoolName",
                hiddenInputs: {
                    'user-id': user._id
                },
                cancelCallback: () => {
                    $modalStore = null
                },
                confirmCallback: (data: FormData) => {
                    const value = data.get('schoolName') as string
                    user.schoolName = value
                    $modalStore = null
                }
            }
        }
    }

    function handleChangeEmail() {
        $modalStore = {
            component: EditField,
            props: {
                headerText: "Change Email",
                initialValue: user.email,
                actionName: "email",
                hiddenInputs: {
                    'user-id': user._id
                },
                cancelCallback: () => {
                    $modalStore = null
                },
                confirmCallback: (data: FormData) => {
                    const value = data.get('email') as string
                    user.email = value
                    $modalStore = null
                }
            }
        }
    }

    function handleChangeSecondaryEmail() {
        $modalStore = {
            component: EditField,
            props: {
                headerText: "Change Secondary Email",
                initialValue: user.secondaryEmail || '',
                actionName: "secondaryEmail",
                hiddenInputs: {
                    'user-id': user._id
                },
                cancelCallback: () => {
                    $modalStore = null
                },
                confirmCallback: (data: FormData) => {
                    const value = data.get('secondaryEmail') as string
                    if (value) {
                        user.secondaryEmail = value
                    } else {
                        delete user['secondaryEmail']
                        user = user
                    }
                    $modalStore = null
                }
            }
        }
    }

    function handleSendVerificationLink() {
        $modalStore = {
            component: ConfirmEmailSend,
            props: {
                headerText: "Confirm Email Send",
                message: `Are you sure you want to send another verification link to ${user.schoolName} at ${user.email}? This will invalidate any link that have already been sent.`,
                cancelCallback: () => {
                    $modalStore = null
                },
                confirmCallback: async () => {
                    const res = await fetch("/api/verify", {
                        method: "POST",
                        body: JSON.stringify({
                            userId: user._id
                        })
                    })
                    if (res.ok) {
                        $modalStore = null
                    } else {
                        $modalStore = {
                            component: Message,
                            props: {
                                headerText: "Failure",
                                message: `Failed to send email to ${user.email}`,
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

    function handleDeleteUser() {
        $modalStore = {
            component: Confirm,
            props: {
                headerText: "Confirm Delete",
                message: `Are you sure you want to delete ${user.schoolName}?`,
                cancelCallback: () => {
                    $modalStore = null
                },
                confirmCallback: async () => {
                    await fetch(`/api/user/${user._id}`, {
                        method: "DELETE"
                    })
                    invalidateAll()
                    $modalStore = null
                }
            }
        }
    }
</script>

<div class="user-info">
    <h2>
        {user.schoolName}
        {#if user.verified}
            ✔️
        {/if}
    </h2>
    <div class="flex-wrapper">
        <div>
            <p><b>Email</b>: {user.email}</p>
            {#if user.secondaryEmail}
                <p><b>Secondary Email</b>: {user.secondaryEmail}</p>
            {/if}
        </div>
        <div>
            <h3>Teams:</h3>
            <ul>
                {#each user.teamIds as teamId, i}
                    <li>Team {i + 1}: {teamId}</li>
    
                {:else}
                    <li>No teams</li>
                {/each}
            </ul>
        </div>
    </div>
    <div class="buttons">
        <button on:click={handleRenameSchool}>Rename School</button>
        <button on:click={handleChangeEmail}>Change Email</button>
        <button on:click={handleChangeSecondaryEmail}>Change Secondary Email</button>
        <button on:click={handleSendVerificationLink}>Send Verification Link</button>
        <button on:click={handleDeleteUser}>Delete User</button>
    </div>
</div>

<style lang="scss">
    .user-info {
        padding: 1em 2em;
        border-radius: 15px;
        background-color: var(--color-5);
    }

    .flex-wrapper {
        display: flex;
        flex-direction: row;
        flex-wrap: wrap;
        
        div {
            min-width: min(80vh, 300px);
            flex-grow: 1;
        }
    }

    ul {
        list-style: none;
    }

    .buttons {
        display: flex;
        flex-direction: row;
        flex-wrap: wrap;
        gap: 1em;
    }

    button {
        padding: 0.5em;
        margin-left: 1em;
        color: #EEE;
        background: var(--color-2);
        border-radius: 0.3em;
        font-weight: bold;
        border: solid black 3px;
        font-size: 16px;
        cursor: pointer;
        
        &:disabled {
            border: solid var(--color-2) 3px;
            background: transparent;
            color: #444;
            cursor: default;
        }
    }
</style>