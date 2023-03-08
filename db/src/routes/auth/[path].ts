import {XMLHttpRequest} from 'xmlhttprequest'
import * as dotenv from 'dotenv'
import { generateToken } from '$lib/authentication'
import { updateAvatarHash } from '$lib/mongo'
import type { RequestEvent } from '@sveltejs/kit'
dotenv.config({path: '../.env'})

export async function get({ url, params }: RequestEvent) {
    const code = url.searchParams.get("code") as string
    if (code) {
        try {
            return await new Promise((resolve, reject) => {
                const xhr = new XMLHttpRequest()
                xhr.open("POST", "https://discord.com/api/oauth2/token")
                xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded")
                xhr.onload = async () => {
                    const res = JSON.parse(xhr.responseText)
                    console.dir(res)
                    if (res.error) {
                        resolve({
                            status: 302,
                            body: "boo"
                        })
                    } else {
                        const { id } = await loginUser(res.access_token, res.token_type)
                        resolve({
                            status: 302,
                            headers: {
                                'Location': "/" + params.path,
                                'Set-Cookie': "gameToken=" + generateToken(id) + ";Path=/"
                            }
                        })
                    }
                }
                xhr.send(new URLSearchParams({
                    client_id: "895468421054083112",
                    client_secret: "58RYXZozmWiqGPvlhODBi26fhzau8zX4",
                    code,
                    grant_type: 'authorization_code',
                    redirect_uri: `${import.meta.env.VITE_HOST_URL}/auth/${params.path}`,
                    scope: 'identify',
                }).toString())
            })
		} catch (error) {
			// NOTE: An unauthorized token will not throw an error;
			// it will return a 401 Unauthorized response in the try block above
			console.error(error);
            return  {
                status: 302,
                body: "boo, either you have done something bad or we have done something bad. Either way you are bad"
            }
		}
    }
}

async function loginUser(token: string, type: string): Promise<DiscordUserResponse> {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest()
        xhr.open("GET", "https://discord.com/api/users/@me")
        xhr.setRequestHeader("Authorization", `${type} ${token}`)
        xhr.onload = async () => {
            const userData: DiscordUserResponse = JSON.parse(xhr.responseText)
            console.dir(userData)
            await updateAvatarHash(userData.id, userData.avatar)
            resolve(userData)
        }
        xhr.send()
    })
}

type DiscordUserResponse = {
    id: string;
	username: string;
	discriminator: string;
	avatar: string | null;
	bot?: boolean;
	system?: boolean;
	mfa_enabled?: boolean;
	banner?: string | null;
	accent_color?: number | null;
	locale?: string;
	verified?: boolean;
	email?: string | null;
}