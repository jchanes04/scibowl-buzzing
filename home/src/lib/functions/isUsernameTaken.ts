export default async function isUsernameTaken(username: string): Promise<boolean> {
    const res = await fetch('/api/register/usernameTaken?username=' + username)
    if (res.status !== 200) 
        return true
    
    return (await res.json())?.taken
}