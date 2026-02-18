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
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
        </head>
        <body style="margin: 0; padding: 0; background-color: #f5f0eb; font-family: 'Inter', 'Segoe UI', Arial, sans-serif;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f0eb; padding: 40px 20px;">
            <tr>
              <td align="center">
                <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%;">

                  <!-- Logo / Brand Header -->
                  <tr>
                    <td align="center" style="padding-bottom: 32px;">
                      <table role="presentation" cellpadding="0" cellspacing="0">
                        <tr>
                          <td style="background-color: #1f1f1f; border-radius: 12px; padding: 10px 24px;">
                            <span style="font-family: 'Inter', 'Segoe UI', Arial, sans-serif; font-size: 20px; font-weight: 700; color: #ffffff; letter-spacing: -0.5px;">Navi</span><span style="font-family: 'Inter', 'Segoe UI', Arial, sans-serif; font-size: 20px; font-weight: 700; color: #CCBEB1; letter-spacing: -0.5px;">Hub</span>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>

                  <!-- Main Card -->
                  <tr>
                    <td>
                      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.06);">

                        <!-- Success Banner -->
                        <tr>
                          <td style="background: linear-gradient(135deg, #997e67 0%, #CCBEB1 100%); padding: 48px 40px; text-align: center;">
                            <div style="width: 64px; height: 64px; background-color: rgba(255,255,255,0.2); border-radius: 50%; margin: 0 auto 20px; line-height: 64px; text-align: center;">
                              <span style="font-size: 28px;">&#10003;</span>
                            </div>
                            <h1 style="font-family: 'Inter', 'Segoe UI', Arial, sans-serif; font-size: 26px; font-weight: 700; color: #ffffff; margin: 0 0 8px; letter-spacing: -0.5px;">You&rsquo;re All Set!</h1>
                            <p style="font-family: 'Inter', 'Segoe UI', Arial, sans-serif; font-size: 15px; color: rgba(255,255,255,0.85); margin: 0;">Your registration has been confirmed</p>
                          </td>
                        </tr>

                        <!-- Body Content -->
                        <tr>
                          <td style="padding: 40px;">
                            <p style="font-family: 'Inter', 'Segoe UI', Arial, sans-serif; font-size: 16px; color: #333333; margin: 0 0 24px; line-height: 1.6;">Hi <strong>${userName}</strong>,</p>

                            <p style="font-family: 'Inter', 'Segoe UI', Arial, sans-serif; font-size: 15px; color: #555555; margin: 0 0 28px; line-height: 1.7;">Great news! You have successfully registered for the following event:</p>

                            <!-- Event Details Card -->
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #faf8f6; border-radius: 16px; border: 1px solid #e8e3de; margin-bottom: 28px;">
                              <tr>
                                <td style="padding: 28px;">
                                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                                    <tr>
                                      <td>
                                        <div style="display: inline-block; background-color: #997e67; color: #ffffff; font-family: 'Inter', 'Segoe UI', Arial, sans-serif; font-size: 11px; font-weight: 600; padding: 4px 12px; border-radius: 20px; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px;">Confirmed</div>
                                        <h2 style="font-family: 'Inter', 'Segoe UI', Arial, sans-serif; font-size: 20px; font-weight: 700; color: #1f1f1f; margin: 12px 0 0; letter-spacing: -0.3px;">${eventName}</h2>
                                      </td>
                                    </tr>
                                  </table>
                                </td>
                              </tr>
                            </table>

                            <p style="font-family: 'Inter', 'Segoe UI', Arial, sans-serif; font-size: 15px; color: #555555; margin: 0 0 12px; line-height: 1.7;">We&rsquo;re excited to have you join us! Keep an eye out for any updates or additional details as the event approaches.</p>

                            <p style="font-family: 'Inter', 'Segoe UI', Arial, sans-serif; font-size: 15px; color: #555555; margin: 0; line-height: 1.7;">See you there! &#127881;</p>
                          </td>
                        </tr>

                      </table>
                    </td>
                  </tr>

                  <!-- Footer -->
                  <tr>
                    <td style="padding: 32px 20px; text-align: center;">
                      <p style="font-family: 'Inter', 'Segoe UI', Arial, sans-serif; font-size: 13px; color: #999999; margin: 0 0 8px;">&mdash; The NaviHub Team</p>
                      <p style="font-family: 'Inter', 'Segoe UI', Arial, sans-serif; font-size: 12px; color: #bbbbbb; margin: 0;">Connecting communities, one event at a time.</p>
                    </td>
                  </tr>

                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
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
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
        </head>
        <body style="margin: 0; padding: 0; background-color: #f5f0eb; font-family: 'Inter', 'Segoe UI', Arial, sans-serif;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f0eb; padding: 40px 20px;">
            <tr>
              <td align="center">
                <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%;">

                  <!-- Logo / Brand Header -->
                  <tr>
                    <td align="center" style="padding-bottom: 32px;">
                      <table role="presentation" cellpadding="0" cellspacing="0">
                        <tr>
                          <td style="background-color: #1f1f1f; border-radius: 12px; padding: 10px 24px;">
                            <span style="font-family: 'Inter', 'Segoe UI', Arial, sans-serif; font-size: 20px; font-weight: 700; color: #ffffff; letter-spacing: -0.5px;">Navi</span><span style="font-family: 'Inter', 'Segoe UI', Arial, sans-serif; font-size: 20px; font-weight: 700; color: #CCBEB1; letter-spacing: -0.5px;">Hub</span>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>

                  <!-- Main Card -->
                  <tr>
                    <td>
                      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.06);">

                        <!-- Cancellation Banner -->
                        <tr>
                          <td style="background: linear-gradient(135deg, #4a4a4a 0%, #6b6b6b 100%); padding: 48px 40px; text-align: center;">
                            <div style="width: 64px; height: 64px; background-color: rgba(255,255,255,0.15); border-radius: 50%; margin: 0 auto 20px; line-height: 64px; text-align: center;">
                              <span style="font-size: 28px; color: #ffffff;">&times;</span>
                            </div>
                            <h1 style="font-family: 'Inter', 'Segoe UI', Arial, sans-serif; font-size: 26px; font-weight: 700; color: #ffffff; margin: 0 0 8px; letter-spacing: -0.5px;">Registration Cancelled</h1>
                            <p style="font-family: 'Inter', 'Segoe UI', Arial, sans-serif; font-size: 15px; color: rgba(255,255,255,0.75); margin: 0;">Your spot has been released</p>
                          </td>
                        </tr>

                        <!-- Body Content -->
                        <tr>
                          <td style="padding: 40px;">
                            <p style="font-family: 'Inter', 'Segoe UI', Arial, sans-serif; font-size: 16px; color: #333333; margin: 0 0 24px; line-height: 1.6;">Hi <strong>${userName}</strong>,</p>

                            <p style="font-family: 'Inter', 'Segoe UI', Arial, sans-serif; font-size: 15px; color: #555555; margin: 0 0 28px; line-height: 1.7;">Your registration for the following event has been successfully cancelled:</p>

                            <!-- Event Details Card -->
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #faf8f6; border-radius: 16px; border: 1px solid #e8e3de; margin-bottom: 28px;">
                              <tr>
                                <td style="padding: 28px;">
                                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                                    <tr>
                                      <td>
                                        <div style="display: inline-block; background-color: #888888; color: #ffffff; font-family: 'Inter', 'Segoe UI', Arial, sans-serif; font-size: 11px; font-weight: 600; padding: 4px 12px; border-radius: 20px; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px;">Cancelled</div>
                                        <h2 style="font-family: 'Inter', 'Segoe UI', Arial, sans-serif; font-size: 20px; font-weight: 700; color: #1f1f1f; margin: 12px 0 0; letter-spacing: -0.3px;">${eventName}</h2>
                                      </td>
                                    </tr>
                                  </table>
                                </td>
                              </tr>
                            </table>

                            <p style="font-family: 'Inter', 'Segoe UI', Arial, sans-serif; font-size: 15px; color: #555555; margin: 0 0 12px; line-height: 1.7;">We&rsquo;re sorry you can&rsquo;t make it! Your spot has been freed up for another community member.</p>

                            <p style="font-family: 'Inter', 'Segoe UI', Arial, sans-serif; font-size: 15px; color: #555555; margin: 0; line-height: 1.7;">We hope to see you at another event soon! &#128075;</p>
                          </td>
                        </tr>

                      </table>
                    </td>
                  </tr>

                  <!-- Footer -->
                  <tr>
                    <td style="padding: 32px 20px; text-align: center;">
                      <p style="font-family: 'Inter', 'Segoe UI', Arial, sans-serif; font-size: 13px; color: #999999; margin: 0 0 8px;">&mdash; The NaviHub Team</p>
                      <p style="font-family: 'Inter', 'Segoe UI', Arial, sans-serif; font-size: 12px; color: #bbbbbb; margin: 0;">Connecting communities, one event at a time.</p>
                    </td>
                  </tr>

                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
    });

    return { success: true };
  } catch (error) {
    console.error("Resend error:", error);
    return { success: false };
  }
}
