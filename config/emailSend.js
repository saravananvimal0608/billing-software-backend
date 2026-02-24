import nodemailer from 'nodemailer'

export const emailSend = async (user, token, res) => {

    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: "saravananvimal0608@gmail.com",
            pass: "pagu eili flzd kmwh"
        }
    })

    const message = {
        from: "saravananvimal0608@gmail.com",
        to: user.email,
        subject: "Forgot Password",
        text: `
Hello ${user.email},

We received a request to reset your password.

Your One-Time Password (OTP) is:

${token}

This OTP is valid for 15 minutes.

Please do not share this OTP with anyone for security reasons.

If you did not request a password reset, please ignore this email.

Thank you,
Your App Team
`
    }

    transporter.sendMail(message, (err, info) => {
        if (err) {
            return res.status(400).json({
                message: "something went wrong"
            })
        }
        return res.status(200).json({ message: "email sent to your mail id" })
    })

}