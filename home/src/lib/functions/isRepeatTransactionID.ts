export default async function isRepeatTransactionID(transactionID: string, userID:string): Promise<boolean> {
    const params = new URLSearchParams({transactionID:transactionID, userID:userID})
    const res = await fetch('/api/repeatTransactionID?'+params.toString() )
    if (res.status !== 200) 
        return true
    
    return (await res.json())?.repeat
}