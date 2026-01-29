import { toastStore } from "./toast.svelte";
import { api } from "../../../convex/_generated/api";
import { safeMutation } from "$lib/convex.result";
import type { Tournament } from "../../routes/(app)/tournament/[id]/types";

// Editable settings state
export const editableSettings = $state({
    name: "",
    spectatorsAllowed: true,
    minPlayers: 1,
    maxPlayers: 5,
    tossupTime: 5,
    bonusTime: 20,
    visualTime: 5,
    tossupPoints: 4,
    bonusPoints: 10,
    penaltyPoints: -4,
    isInitialized: false
});

/**
 * Initialize settings from tournament data
 */
export function initSettings(tournament: Tournament) {
    if (editableSettings.isInitialized) return;

    if (tournament.name) {
        editableSettings.name = tournament.name;
    }

    if (tournament.settings) {
        editableSettings.spectatorsAllowed = tournament.settings.spectatorsAllowed;
        editableSettings.minPlayers = tournament.settings.minPlayers;
        editableSettings.maxPlayers = tournament.settings.maxPlayers;
        editableSettings.tossupTime = tournament.settings.times.tossup[0] ?? 5;
        editableSettings.bonusTime = tournament.settings.times.bonus[0] ?? 20;
        editableSettings.visualTime = tournament.settings.times.visual[0] ?? 5;
        editableSettings.tossupPoints = tournament.settings.pointValues.tossup;
        editableSettings.bonusPoints = tournament.settings.pointValues.bonus;
        editableSettings.penaltyPoints = tournament.settings.pointValues.penalty;
    }

    editableSettings.isInitialized = true;
}

/**
 * Save all settings to Convex
 */
export async function saveSettings(convex: any, tournamentId: string) {
    toastStore.add("Saving settings...", "info", 1000);

    // Update tournament name
    const nameResult = await safeMutation(convex, api.tournaments.updateName, {
        tournamentId,
        name: editableSettings.name,
    });

    if (nameResult.isErr()) {
        toastStore.add(`Error saving name: ${nameResult.error.message}`, "error");
        return;
    }

    // Update settings
    const settingsResult = await safeMutation(convex, api.tournaments.updateSettings, {
        tournamentId,
        settings: {
            spectatorsAllowed: editableSettings.spectatorsAllowed,
            times: {
                tossup: [editableSettings.tossupTime, editableSettings.tossupTime],
                bonus: [editableSettings.bonusTime, editableSettings.bonusTime],
                visual: [editableSettings.visualTime, editableSettings.visualTime],
            },
            pointValues: {
                tossup: editableSettings.tossupPoints,
                bonus: editableSettings.bonusPoints,
                penalty: editableSettings.penaltyPoints,
            },
            minPlayers: editableSettings.minPlayers,
            maxPlayers: editableSettings.maxPlayers,
        },
    });

    if (settingsResult.isErr()) {
        toastStore.add(`Error saving settings: ${settingsResult.error.message}`, "error");
        return;
    }

    toastStore.add("Settings saved!", "success");
}
