import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY 
  ? new Resend(process.env.RESEND_API_KEY) 
  : null;

export async function sendEventConfirmationEmail(
  userEmail: string,
  userName: string,
  eventName: string
) {
  if (!resend) {
    console.error("Resend API key validation failed: Key is missing");
    return { success: false };
  }

  try {
    await resend.emails.send({
      from: "NaviHub <onboarding@resend.dev>",
      to: userEmail,
      subject: `You're confirmed for ${eventName}!`,
      html: `
        <div style="font-family: Arial, sans-serif;">
          <h2>Hi ${userName},</h2>
          <p>You are successfully registered for <strong>${eventName}</strong>.</p>
          <p>We look forward to seeing you!</p>
          <br />
          <p>— NaviHub Team</p>
        </div>
      `,
    });

    return { success: true };
  } catch (error) {
    console.error("Resend error:", error);
    return { success: false };
  }
}

export async function sendEventCancellationEmail(
  userEmail: string,
  userName: string,
  eventName: string
) {
  if (!resend) {
    console.error("Resend API key validation failed: Key is missing");
    return { success: false };
  }

  try {
    await resend.emails.send({
      from: "NaviHub <onboarding@resend.dev>",
      to: userEmail,
      subject: `Cancellation confirmed for ${eventName}`,
      html: `
        <div style="font-family: Arial, sans-serif;">
          <h2>Hi ${userName},</h2>
          <p>You have successfully unregistered from <strong>${eventName}</strong>.</p>
          <p>We're sorry you can't make it! We hope to see you at another event soon.</p>
          <br />
          <p>— NaviHub Team</p>
        </div>
      `,
    });

    return { success: true };
  } catch (error) {
    console.error("Resend error:", error);
    return { success: false };
  }
}
