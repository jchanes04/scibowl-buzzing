import type { UserClean } from "$lib/mongo";
import { writable, type Writable } from "svelte/store";

export const userStore: Writable<UserClean> = writable(null)