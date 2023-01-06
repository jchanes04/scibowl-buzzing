export default async function isEmailTaken(email: string): Promise<boolean> {
    const res = await fetch('/api/register/emailTaken?email=' + email)
    if (res.status !== 200) 
        return true
    
    return (await res.json())?.taken
}