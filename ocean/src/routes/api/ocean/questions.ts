import { getOcean } from "../../../server";

export async function get() {
    let result = await getOcean()
    return {
        status: 302,
        body: result
    }
}