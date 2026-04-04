import nodemailer from "nodemailer";

export const confirmationMail = async (email, plan) => {
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
      to: email,
      subject: "Plan Upgrade Scheduled Successfully",
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          
          <h2 style="color: #2E86C1;">Hello,</h2>
          
          <p>Your request to upgrade your subscription plan has been received successfully.</p>

          <p>
            Your plan will be upgraded to <strong>${plan}</strong> 
            once your current subscription expires.
          </p>

          <p>
            Until then, you can continue using your current plan without any interruption.
          </p>

          <br />

       <p style="color:#555;">
  If you have any questions or need assistance, please feel free to raise a support ticket through your admin panel. Our support team will be happy to assist you.
</p>

          <br />

          <p>
            Thank you,<br />
            <strong>Cotechies Team</strong>
          </p>

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
