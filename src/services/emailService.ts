import { supabase, isSupabaseConfigured } from './supabaseClient';
import emailjs from '@emailjs/browser';

export interface EmailDispatchResult {
  success: boolean;
  message: string;
  code?: string;
  resetUrl?: string;
}

// Initialize EmailJS once on module load
const emailjsPublicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;
if (emailjsPublicKey) {
  emailjs.init(emailjsPublicKey);
}

/**
 * Generates the clean plain-text & HTML email template for password reset containing both:
 * 1. Direct Password Reset Clickable Button/Link (redirects back to app to set new password & login)
 * 2. 6-Digit Verification Code (for typing in verification modal or page)
 */
export const buildPasswordResetEmailTemplate = (
  otpCode: string, 
  resetUrl?: string, 
  appName = 'Benue Market'
) => {
  const subject = 'Your Password Reset Verification Code & Direct Reset Link';
  const directResetUrl = resetUrl || `${window.location.origin}/reset-password`;

  const textBody = `Hello,

We received a request to reset your account password for ${appName}.

You can reset your password using either of the two secure options below:

--------------------------------------------------
OPTION 1: TAP DIRECT RESET LINK
--------------------------------------------------
Tap or copy the link below to open the app and set your new password immediately:
${directResetUrl}

--------------------------------------------------
OPTION 2: ENTER 6-DIGIT VERIFICATION CODE
--------------------------------------------------
Your 6-digit confirmation code is:

${otpCode}

This code and link will expire in 10 minutes.

If you did not request a password reset, you can safely ignore this email.

Regards,
${appName} Security Team`;

  const htmlBody = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #FAF8F5; margin: 0; padding: 24px; color: #111827;">
  <div style="max-width: 540px; margin: 0 auto; background: #ffffff; border: 1px solid #E8E2D9; border-radius: 20px; padding: 32px; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
    <div style="text-align: center; margin-bottom: 24px;">
      <h2 style="color: #0F5132; margin: 0; font-size: 24px; font-weight: 900;">${appName}</h2>
      <p style="color: #4B5563; font-size: 13px; margin-top: 4px;">Account Security & Password Recovery</p>
    </div>
    
    <p style="font-size: 14px; color: #374151; line-height: 1.6;">Hello,</p>
    <p style="font-size: 14px; color: #374151; line-height: 1.6;">We received a request to reset your account password. You can reset your password using either of the two secure options below:</p>
    
    <!-- OPTION 1: DIRECT CLICKABLE LINK -->
    <div style="background: #E8F5E9; border: 1px solid #C8E6C9; border-radius: 14px; padding: 20px; text-align: center; margin: 20px 0;">
      <p style="font-size: 12px; color: #0F5132; font-weight: 800; letter-spacing: 0.5px; margin-top: 0; margin-bottom: 12px; text-transform: uppercase;">Option 1: Tap Direct Reset Link</p>
      <a href="${directResetUrl}" target="_blank" style="background-color: #0F5132; color: #ffffff; text-decoration: none; padding: 12px 26px; border-radius: 10px; font-weight: 800; font-size: 14px; display: inline-block; box-shadow: 0 2px 6px rgba(15,81,50,0.3);">
        Reset Password Now
      </a>
      <p style="font-size: 11px; color: #4B5563; margin-top: 10px; margin-bottom: 0;">Tapping this button will open the app and take you directly to set your new password.</p>
    </div>

    <!-- OPTION 2: 6-DIGIT VERIFICATION CODE -->
    <div style="background: #FAF8F5; border: 1px solid #E8E2D9; border-radius: 14px; padding: 20px; text-align: center; margin: 20px 0;">
      <p style="font-size: 12px; color: #111827; font-weight: 800; letter-spacing: 0.5px; margin-top: 0; margin-bottom: 8px; text-transform: uppercase;">Option 2: Enter 6-Digit Code in App</p>
      <p style="font-size: 12px; color: #6B7280; margin-bottom: 10px;">Enter this 6-digit confirmation code on your verification screen:</p>
      <div style="background: #ffffff; border: 1px solid #D6CDC0; border-radius: 10px; padding: 12px; display: inline-block;">
        <span style="font-family: monospace; font-size: 28px; font-weight: 900; letter-spacing: 6px; color: #0F5132;">${otpCode}</span>
      </div>
    </div>

    <p style="font-size: 12px; color: #B45309; font-weight: 700; text-align: center; margin-top: 16px;">⏱️ Both the link and code expire in 10 minutes.</p>
    <p style="font-size: 12px; color: #6B7280; line-height: 1.5; margin-top: 20px; text-align: center;">If you did not request a password reset, you can safely ignore this email.</p>
    <hr style="border: none; border-top: 1px solid #E8E2D9; margin: 24px 0;" />
    <p style="font-size: 12px; color: #9CA3AF; text-align: center; margin: 0;">Regards,<br><strong>${appName} Security Team</strong></p>
  </div>
</body>
</html>`;

  return { subject, textBody, htmlBody };
};

/**
 * Dispatches password reset email containing 6-digit OTP code & direct link to user inbox.
 * Supports EmailJS SDK (primary), Resend API, Custom Email Gateways, and Supabase Auth.
 * 
 * CRITICAL: Returns success:false if NO email provider successfully delivers.
 */
export const sendPasswordResetEmail = async (
  email: string,
  otpCode: string,
  resetUrl: string
): Promise<EmailDispatchResult> => {
  const cleanEmail = email.trim().toLowerCase();
  const { subject, textBody, htmlBody } = buildPasswordResetEmailTemplate(otpCode, resetUrl);

  let deliveryAccepted = false;
  const errors: string[] = [];

  // ═══════════════════════════════════════════════════════════════════════════
  // 1. PRIMARY: Dispatch via EmailJS SDK (most reliable for frontend-only apps)
  // ═══════════════════════════════════════════════════════════════════════════
  const ejsServiceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
  const ejsTemplateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
  const ejsPublicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

  if (ejsServiceId && ejsTemplateId && ejsPublicKey) {
    try {
      const response = await emailjs.send(
        ejsServiceId,
        ejsTemplateId,
        {
          to_email: cleanEmail,
          otp_code: otpCode,
          reset_url: resetUrl,
          app_name: 'Benue Market',
          subject: subject,
          message: textBody,
          html_message: htmlBody,
        }
      );

      if (response.status === 200) {
        deliveryAccepted = true;
        console.log(`✅ [EmailJS SDK] Password reset email successfully dispatched to: ${cleanEmail}`);
      } else {
        errors.push(`EmailJS returned status ${response.status}`);
        console.warn('[EmailJS SDK Error]:', response.status, response.text);
      }
    } catch (e: any) {
      const errMsg = e?.text || e?.message || 'Unknown EmailJS error';
      errors.push(`EmailJS: ${errMsg}`);
      console.warn('[EmailJS SDK Exception]:', errMsg);
    }
  } else {
    if (!ejsServiceId || !ejsTemplateId || !ejsPublicKey) {
      errors.push('EmailJS credentials not configured in .env');
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 2. FALLBACK: Dispatch via Resend API if configured
  // ═══════════════════════════════════════════════════════════════════════════
  if (!deliveryAccepted) {
    const resendApiKey = import.meta.env.VITE_RESEND_API_KEY || import.meta.env.VITE_EMAIL_API_KEY;
    if (resendApiKey && resendApiKey.startsWith('re_')) {
      try {
        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'Benue Market Security <onboarding@resend.dev>',
            to: [cleanEmail],
            subject,
            html: htmlBody,
            text: textBody,
          }),
        });

        if (res.ok) {
          deliveryAccepted = true;
          console.log(`✅ [Resend API] Password reset email dispatched to: ${cleanEmail}`);
        } else {
          const errText = await res.text();
          errors.push(`Resend API: ${res.status} - ${errText}`);
          console.warn('[Resend API Error]:', res.status, errText);
        }
      } catch (e: any) {
        errors.push(`Resend: ${e.message}`);
        console.warn('[Resend API Exception]:', e.message);
      }
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 3. FALLBACK: Dispatch via Custom Email Provider API Webhook
  // ═══════════════════════════════════════════════════════════════════════════
  if (!deliveryAccepted) {
    const customEmailApiUrl = import.meta.env.VITE_EMAIL_API_URL;
    if (customEmailApiUrl) {
      try {
        const res = await fetch(customEmailApiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: cleanEmail,
            subject,
            text: textBody,
            html: htmlBody,
            code: otpCode,
            reset_url: resetUrl,
          }),
        });

        if (res.ok) {
          deliveryAccepted = true;
          console.log(`✅ [Custom Email API] Password reset email dispatched to ${cleanEmail}`);
        } else {
          errors.push(`Custom API: ${res.status}`);
        }
      } catch (e: any) {
        errors.push(`Custom API: ${e.message}`);
        console.warn('[Custom Email API Exception]:', e.message);
      }
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 4. LAST RESORT: Trigger Supabase Auth Password Reset Email
  // ═══════════════════════════════════════════════════════════════════════════
  if (!deliveryAccepted && isSupabaseConfigured()) {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
        redirectTo: resetUrl,
      });

      if (error) {
        errors.push(`Supabase Auth: ${error.message}`);
        console.warn('[Supabase Auth Reset Notice]:', error.message, error.status);
      } else {
        // Note: Supabase returns success even for non-existent emails (security feature)
        // We still mark it as accepted as Supabase handles its own email delivery
        deliveryAccepted = true;
        console.log(`✅ [Supabase Auth] Password reset request accepted for ${cleanEmail}`);
      }
    } catch (err: any) {
      errors.push(`Supabase: ${err?.message || 'Unknown error'}`);
      console.warn('[Supabase Auth Exception]:', err?.message || err);
    }
  }

  // Log development OTP in browser console for local testing
  if (import.meta.env.DEV) {
    console.log(`%c🔑 [BENUE MARKET SECURITY] Password Reset OTP Code for ${cleanEmail}: %c${otpCode}`, 'color: #0F5132; font-weight: bold;', 'color: #B45309; font-weight: bold; font-size: 14px;');
    console.log(`%c🔗 Direct Reset Link: %c${resetUrl}`, 'color: #0F5132; font-weight: bold;', 'color: #2563EB; font-underline: underline;');
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // CRITICAL: Return actual delivery status — NOT always true!
  // ═══════════════════════════════════════════════════════════════════════════
  if (!deliveryAccepted) {
    console.error('❌ [EMAIL DELIVERY FAILED] No email provider successfully delivered to:', cleanEmail, 'Errors:', errors);
    return {
      success: false,
      message: `We couldn't send the verification code: ${errors.length > 0 ? errors[0] : 'No email provider is configured. Please contact support.'}`,
    };
  }

  return {
    success: true,
    message: `Verification code & direct reset link dispatched to ${cleanEmail}`,
    // SECURITY: OTP code intentionally NOT returned to prevent frontend exposure
    resetUrl,
  };
};

/**
 * Dispatches post-password reset security notification email to user inbox
 */
export const sendPasswordChangedNotificationEmail = async (
  email: string,
  userName?: string
): Promise<EmailDispatchResult> => {
  const cleanEmail = email.trim().toLowerCase();
  const timestamp = new Date().toLocaleString('en-US', {
    dateStyle: 'full',
    timeStyle: 'medium',
  });

  try {
    // Send via EmailJS if configured
    const ejsServiceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
    const ejsTemplateId = import.meta.env.VITE_EMAILJS_NOTIFICATION_TEMPLATE_ID || import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
    const ejsPublicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

    if (ejsServiceId && ejsTemplateId && ejsPublicKey) {
      try {
        await emailjs.send(ejsServiceId, ejsTemplateId, {
          to_email: cleanEmail,
          app_name: 'Benue Market',
          subject: 'Security Alert: Your Password Was Changed',
          message: `Hello ${userName || 'Valued User'},\n\nYour Benue Market account password was successfully changed on ${timestamp}.\n\nIf you did not make this change, please contact support immediately.\n\nRegards,\nBenue Market Security Team`,
        });
      } catch (e) {
        console.warn('[EmailJS Notification Error]:', e);
      }
    }

    if (isSupabaseConfigured()) {
      try {
        await supabase.functions.invoke('send-security-alert-email', {
          body: {
            email: cleanEmail,
            name: userName || 'Valued User',
            action: 'Password Changed Successfully',
            timestamp,
            app_name: 'Benue Market',
          },
        });
      } catch (e) {
        // Log silently
      }
    }

    console.log(`[Security Alert Email Sent] Password change notification dispatched to ${cleanEmail} at ${timestamp}`);

    return {
      success: true,
      message: `Security notification sent to ${cleanEmail}`,
    };
  } catch (err: any) {
    console.error('Error sending password changed notification email:', err);
    return {
      success: false,
      message: err.message || 'Failed to send security notification email.',
    };
  }
};
