import { redirectTo } from "$lib/functions/redirectTo";


export async function get() {
    return redirectTo("/account")
}