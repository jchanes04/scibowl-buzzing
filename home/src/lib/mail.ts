import sgMail from "@sendgrid/mail"
import { env } from "$env/dynamic/private"

sgMail.setApiKey(env.SENDGRID_API_KEY)

export async function sendVerificationEmail(email: string, code: string) {
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
}