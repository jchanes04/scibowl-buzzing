export default async function isSchoolNameTaken(schoolName: string): Promise<boolean> {
    const res = await fetch('/api/register/schoolNameTaken?schoolName=' + schoolName)
    if (res.status !== 200) 
        return true
    
    return (await res.json())?.taken
}