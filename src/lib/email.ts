import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export async function sendVerificationRequestEmail(email: string, itemTitle: string, claimId: string) {
  if (!resend) {
    console.warn('Resend API key not configured. Skipping email.');
    return;
  }

  try {
    const { data, error } = await resend.emails.send({
      from: 'Lost & Found <notifications@fast-isb-exams.vercel.app>',
      to: [email],
      subject: `Action Required: Verify your claim for "${itemTitle}"`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
          <div style="text-align: center; margin-bottom: 20px;">
            <div style="display: inline-block; padding: 12px; background-color: #fff7ed; border-radius: 50%; margin-bottom: 16px;">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ea580c" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
            </div>
            <h2 style="color: #1a202c; margin: 0;">Found Your Item?</h2>
            <p style="color: #64748b; font-size: 14px;">Verification request for "${itemTitle}"</p>
          </div>
          
          <p style="color: #4a5568; line-height: 1.6;">
            Hello, we've matched your lost report with a found item! To help us keep the campus records accurate, please humbly take a few seconds to verify if you have successfully collected this item.
          </p>
          
          <div style="background-color: #f8fafc; padding: 16px; border-radius: 8px; margin: 24px 0; border-left: 4px solid #ea580c;">
            <p style="margin: 0; font-size: 14px; color: #475569; font-style: italic;">
              "Verifying ensures that the finder is notified of your success and the platform record stays clean for other students."
            </p>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="https://fast-isb-exams.vercel.app/lost-found" style="background-color: #ea580c; color: #ffffff; padding: 14px 32px; border-radius: 10px; text-decoration: none; font-weight: bold; font-size: 16px; display: inline-block; box-shadow: 0 4px 6px -1px rgba(234, 88, 12, 0.2);">
              Verify Collection Now
            </a>
          </div>

          <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #f1f5f9;">
            <p style="color: #94a3b8; font-size: 12px; line-height: 1.5;">
              If this wasn't you, or if you've realized this isn't your item, please help us by clicking <strong>unclaim</strong> on the platform so we can stop sending you these reminders.
            </p>
          </div>
          
          <p style="color: #cbd5e1; font-size: 11px; text-align: center; margin-top: 30px;">
            FAST ISB Schedule Platform &middot; Lost & Found Service
          </p>
        </div>
      `,
    });

    if (error) {
      console.error('Error sending email:', error);
    }
    return data;
  } catch (err) {
    console.error('Failed to send verification email:', err);
  }
}

export async function sendUnclaimNotification(email: string, itemTitle: string) {
  if (!resend) return;

  try {
    await resend.emails.send({
      from: 'Lost & Found <notifications@fast-isb-exams.vercel.app>',
      to: [email],
      subject: `Claim Removed for "${itemTitle}"`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #f1f5f9; border-radius: 12px;">
          <h2 style="color: #1a202c;">Claim Cancelled</h2>
          <p style="color: #4a5568; line-height: 1.6;">
            You have successfully removed your claim for <strong>${itemTitle}</strong>. We appreciate you keeping the platform records accurate.
          </p>
          <p style="color: #4a5568;">
            You will no longer receive verification reminders for this item.
          </p>
          <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 20px 0;" />
          <p style="color: #94a3b8; font-size: 11px; text-align: center;">
            FAST ISB Schedule Platform &middot; Lost & Found Service
          </p>
        </div>
      `,
    });
  } catch (err) {
    console.error('Failed to send unclaim email:', err);
  }
}
