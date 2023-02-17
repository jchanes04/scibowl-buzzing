import sgMail from "@sendgrid/mail"
import { env } from "$env/dynamic/private"
import { dev } from "$app/environment"

sgMail.setApiKey(env.SENDGRID_API_KEY)

export async function sendVerificationEmail(email: string, code: string) {
    if (!dev) {
        await sgMail.send({
            to: email,
            from: "automated@enloesciencebowl.xyz",
            subject: "ESBOT Email Verification",
            text: `Thanks for creating an account for the ESBOT Tournament! Below is a verification link used to verify that the primary email provided for your account works. Once you click the link, you will be able to edit your school's teams.
            
            https://enloesciencebowl.xyz/verify?code=${code}`,
            html: `Thanks for creating an account for the ESBOT Tournament! Below is a verification link used to verify that the primary email provided for your account works. Once you click the link, you will be able to edit your school's teams.
            <br /><br />
            <a href="https://enloesciencebowl.xyz/verify?code=${code}">https://enloesciencebowl.xyz/verify?code=${code}</a>`
        })
    } else {
        console.log('Mail sent')
    }
}

export async function sendPasswordResetEmail(email: string, code: string) {
    if (!dev) {
        await sgMail.send({
            to: email,
            from: "automated@enloesciencebowl.xyz",
            subject: "ESBOT Password Reset",
            text: `Use the link below to reset your password:
            
            https://enloesciencebowl.xyz/reset-password?code=${code}`,
            html: `Use the link below to reset your password:
            <br /><br />
            <a href="https://enloesciencebowl.xyz/reset-password?code=${code}">https://enloesciencebowl.xyz/reset-password?code=${code}</a>`
        })
    } else {
        console.log("Mail sent")
    }
}