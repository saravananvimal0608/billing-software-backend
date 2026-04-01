import nodemailer from "nodemailer";

export const emailSend = async (user, token, subject, text) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const message = {
      from: process.env.EMAIL_USER,

      // ✅ IMPORTANT FIX
      to: user.tempEmail || user.email,

      subject: subject,

      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <h2 style="color: #2E86C1;">Hello ${user.email},</h2>
          <p>We received a request to <strong>${text}</strong>.</p>
          <p>Your One-Time Password (OTP) is:</p>
          <h1 style="background: #f2f2f2; padding: 10px; text-align: center; letter-spacing: 5px;">${token}</h1>
          <p>This OTP is valid for <strong>15 minutes</strong>.</p>
          <p>Please do not share this OTP with anyone for security reasons.</p>
          <p>If you did not request a <strong>${subject}</strong>, please ignore this email.</p>
          <br />
          <p>Thank you,<br /><strong>Cotechies Team</strong></p>
        </div>
      `,
    };

    await transporter.sendMail(message);

    return true; 
  } catch (error) {
    console.error("Email Error:", error);
    return false; 
  }
};