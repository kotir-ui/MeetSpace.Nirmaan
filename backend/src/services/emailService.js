import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Create transporter with environment config or fallback test transport
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT, 10) || 587,
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER || process.env.EMAIL_USER || '',
    pass: process.env.SMTP_PASS || process.env.EMAIL_PASS || '',
  },
});

const DEFAULT_FROM = process.env.EMAIL_FROM || '"MeetSpace Nirmaan" <no-reply@meetspace.nirmaan.com>';

/**
 * Generic send mail helper with error resilience
 */
export const sendMail = async ({ to, subject, html, text }) => {
  try {
    if (!to || (Array.isArray(to) && to.length === 0)) {
      return { success: false, message: 'No recipient email provided' };
    }

    const recipients = Array.isArray(to) ? to.join(', ') : to;

    // If SMTP user is not set, log clean mock email output for development
    if (!process.env.SMTP_USER && !process.env.EMAIL_USER) {
      console.log('---------------------------------------------------------');
      console.log(`[EMAIL DISPATCHED (DEV MODE)]`);
      console.log(`To: ${recipients}`);
      console.log(`Subject: ${subject}`);
      console.log(`Text: ${text || 'HTML Template'}`);
      console.log('---------------------------------------------------------');
      return { success: true, devMode: true };
    }

    const info = await transporter.sendMail({
      from: DEFAULT_FROM,
      to: recipients,
      subject,
      text: text || '',
      html,
    });

    console.log(`[EMAIL SENT] MessageId: ${info.messageId} to ${recipients}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('[EMAIL ERROR] Failed to send email:', error.message);
    return { success: false, error: error.message };
  }
};

/**
 * 1. Email to Manager and Admins when a booking request is submitted
 */
export const sendBookingRequestMail = async ({
  managerEmail,
  managerName = 'Manager',
  adminEmails = [],
  requesterName,
  requesterEmail,
  requesterDept = 'General',
  roomName,
  bookingNumber,
  title,
  purpose,
  meetingDate,
  startTime,
  endTime,
}) => {
  const subject = `📋 Action Required: Room Booking Request #${bookingNumber} - ${roomName}`;

  const html = `
    <div style="font-family: Arial, Helvetica, sans-serif; background-color: #f4f6f9; padding: 25px; color: #333;">
      <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.08);">
        <div style="background: #0f172a; padding: 20px; text-align: center; color: #ffffff;">
          <h2 style="margin: 0; font-size: 20px; letter-spacing: 0.5px;">MeetSpace | Meeting Room Request</h2>
          <p style="margin: 5px 0 0 0; font-size: 13px; color: #94a3b8;">Pending Manager & Admin Approval</p>
        </div>

        <div style="padding: 24px;">
          <p style="font-size: 15px; margin-top: 0;">Hello,</p>
          <p style="font-size: 14px; line-height: 1.5; color: #475569;">
            A new meeting room booking request has been submitted by <strong>${requesterName}</strong> (${requesterDept}) and requires your review.
          </p>

          <table style="width: 100%; border-collapse: collapse; margin: 20px 0; background: #f8fafc; border-radius: 6px; overflow: hidden;">
            <tr>
              <td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0; font-size: 13px; font-weight: bold; color: #64748b; width: 35%;">Booking Number</td>
              <td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0; font-size: 13px; color: #0f172a; font-weight: 600;">${bookingNumber}</td>
            </tr>
            <tr>
              <td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0; font-size: 13px; font-weight: bold; color: #64748b;">Meeting Title</td>
              <td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0; font-size: 13px; color: #0f172a;">${title || 'Meeting'}</td>
            </tr>
            <tr>
              <td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0; font-size: 13px; font-weight: bold; color: #64748b;">Room</td>
              <td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0; font-size: 13px; color: #0284c7; font-weight: bold;">${roomName}</td>
            </tr>
            <tr>
              <td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0; font-size: 13px; font-weight: bold; color: #64748b;">Date & Time</td>
              <td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0; font-size: 13px; color: #0f172a;">${meetingDate} (${startTime} - ${endTime})</td>
            </tr>
            <tr>
              <td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0; font-size: 13px; font-weight: bold; color: #64748b;">Requested By</td>
              <td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0; font-size: 13px; color: #0f172a;">${requesterName} (${requesterEmail || ''})</td>
            </tr>
            ${purpose ? `
            <tr>
              <td style="padding: 10px 14px; font-size: 13px; font-weight: bold; color: #64748b;">Purpose / Notes</td>
              <td style="padding: 10px 14px; font-size: 13px; color: #0f172a;">${purpose}</td>
            </tr>` : ''}
          </table>

          <div style="text-align: center; margin: 25px 0 10px;">
            <span style="display: inline-block; background: #0284c7; color: #ffffff; padding: 10px 22px; text-decoration: none; border-radius: 5px; font-weight: 600; font-size: 14px;">
              Please log in to MeetSpace to Review & Approve
            </span>
          </div>
        </div>

        <div style="background: #f1f5f9; padding: 14px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0;">
          MeetSpace Nirmaan - Automated Notification System
        </div>
      </div>
    </div>
  `;

  // Collect all recipient emails
  const recipients = new Set();
  if (managerEmail) recipients.add(managerEmail);
  if (Array.isArray(adminEmails)) {
    adminEmails.forEach((email) => email && recipients.add(email));
  }

  if (recipients.size > 0) {
    return await sendMail({
      to: Array.from(recipients),
      subject,
      html,
      text: `New Booking Request #${bookingNumber} for ${roomName} on ${meetingDate} (${startTime} - ${endTime}) requested by ${requesterName}.`,
    });
  }
};

/**
 * 2. Email to User (requester) and Manager when Admin approves the booking
 */
export const sendBookingApprovedMail = async ({
  userEmail,
  userName = 'User',
  managerEmail,
  managerName = 'Manager',
  approverName = 'Administrator',
  roomName,
  bookingNumber,
  title,
  meetingDate,
  startTime,
  endTime,
}) => {
  const subject = `🎉 CONFIRMED: Room Booking #${bookingNumber} - ${roomName}`;

  const html = `
    <div style="font-family: Arial, Helvetica, sans-serif; background-color: #f4f6f9; padding: 25px; color: #333;">
      <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.08);">
        <div style="background: #059669; padding: 20px; text-align: center; color: #ffffff;">
          <h2 style="margin: 0; font-size: 20px; letter-spacing: 0.5px;">Booking Approved & Confirmed!</h2>
          <p style="margin: 5px 0 0 0; font-size: 13px; color: #d1fae5;">Approved by ${approverName}</p>
        </div>

        <div style="padding: 24px;">
          <p style="font-size: 15px; margin-top: 0;">Hello <strong>${userName}</strong>,</p>
          <p style="font-size: 14px; line-height: 1.5; color: #475569;">
            Great news! Your meeting room booking has been <strong style="color: #059669;">APPROVED</strong> by the Administrator. The room is now officially reserved for your session.
          </p>

          <table style="width: 100%; border-collapse: collapse; margin: 20px 0; background: #f8fafc; border-radius: 6px; overflow: hidden;">
            <tr>
              <td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0; font-size: 13px; font-weight: bold; color: #64748b; width: 35%;">Booking Number</td>
              <td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0; font-size: 13px; color: #0f172a; font-weight: 600;">${bookingNumber}</td>
            </tr>
            <tr>
              <td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0; font-size: 13px; font-weight: bold; color: #64748b;">Meeting Title</td>
              <td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0; font-size: 13px; color: #0f172a;">${title || 'Meeting'}</td>
            </tr>
            <tr>
              <td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0; font-size: 13px; font-weight: bold; color: #64748b;">Reserved Room</td>
              <td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0; font-size: 13px; color: #059669; font-weight: bold;">${roomName}</td>
            </tr>
            <tr>
              <td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0; font-size: 13px; font-weight: bold; color: #64748b;">Date & Time</td>
              <td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0; font-size: 13px; color: #0f172a; font-weight: 600;">${meetingDate} (${startTime} - ${endTime})</td>
            </tr>
            <tr>
              <td style="padding: 10px 14px; font-size: 13px; font-weight: bold; color: #64748b;">Status</td>
              <td style="padding: 10px 14px; font-size: 13px; color: #059669; font-weight: bold;">CONFIRMED</td>
            </tr>
          </table>

          <p style="font-size: 13px; color: #64748b; margin-bottom: 0;">
            A copy of this confirmation has also been shared with your Manager (${managerName}).
          </p>
        </div>

        <div style="background: #f1f5f9; padding: 14px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0;">
          MeetSpace Nirmaan - Automated Notification System
        </div>
      </div>
    </div>
  `;

  const recipients = new Set();
  if (userEmail) recipients.add(userEmail);
  if (managerEmail) recipients.add(managerEmail);

  if (recipients.size > 0) {
    return await sendMail({
      to: Array.from(recipients),
      subject,
      html,
      text: `Booking #${bookingNumber} for "${roomName}" on ${meetingDate} (${startTime} - ${endTime}) has been APPROVED by ${approverName}.`,
    });
  }
};

/**
 * 3. Email to User and Manager when a booking is rejected
 */
export const sendBookingRejectedMail = async ({
  userEmail,
  userName = 'User',
  managerEmail,
  rejecterName = 'Administrator',
  roomName,
  bookingNumber,
  title,
  meetingDate,
  startTime,
  endTime,
  reason = 'Schedule conflict / administrative decision',
}) => {
  const subject = `❌ Booking Update: Request #${bookingNumber} Rejected`;

  const html = `
    <div style="font-family: Arial, Helvetica, sans-serif; background-color: #f4f6f9; padding: 25px; color: #333;">
      <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.08);">
        <div style="background: #dc2626; padding: 20px; text-align: center; color: #ffffff;">
          <h2 style="margin: 0; font-size: 20px; letter-spacing: 0.5px;">Booking Request Rejected</h2>
          <p style="margin: 5px 0 0 0; font-size: 13px; color: #fee2e2;">Booking #${bookingNumber}</p>
        </div>

        <div style="padding: 24px;">
          <p style="font-size: 15px; margin-top: 0;">Hello <strong>${userName}</strong>,</p>
          <p style="font-size: 14px; line-height: 1.5; color: #475569;">
            Your booking request for <strong>${roomName}</strong> on <strong>${meetingDate} (${startTime} - ${endTime})</strong> has been rejected by <strong>${rejecterName}</strong>.
          </p>

          <div style="background: #fef2f2; border-left: 4px solid #dc2626; padding: 12px 16px; margin: 16px 0; border-radius: 4px;">
            <p style="margin: 0; font-size: 13px; color: #991b1b;">
              <strong>Reason:</strong> ${reason}
            </p>
          </div>

          <p style="font-size: 13px; color: #64748b;">
            You may choose an alternative room or time slot in MeetSpace.
          </p>
        </div>

        <div style="background: #f1f5f9; padding: 14px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0;">
          MeetSpace Nirmaan - Automated Notification System
        </div>
      </div>
    </div>
  `;

  const recipients = new Set();
  if (userEmail) recipients.add(userEmail);
  if (managerEmail) recipients.add(managerEmail);

  if (recipients.size > 0) {
    return await sendMail({
      to: Array.from(recipients),
      subject,
      html,
      text: `Booking request #${bookingNumber} for "${roomName}" on ${meetingDate} was rejected. Reason: ${reason}`,
    });
  }
};

/**
 * 4. Email to User & Manager when booking is cancelled
 */
export const sendBookingCancelledMail = async ({
  userEmail,
  userName = 'User',
  managerEmail,
  cancellerName = 'User',
  roomName,
  bookingNumber,
  title,
  meetingDate,
  startTime,
  endTime,
  reason = 'Cancelled by organizer',
}) => {
  const subject = `🚫 Booking Cancelled: #${bookingNumber} - ${roomName}`;

  const html = `
    <div style="font-family: Arial, Helvetica, sans-serif; background-color: #f4f6f9; padding: 25px; color: #333;">
      <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.08);">
        <div style="background: #64748b; padding: 20px; text-align: center; color: #ffffff;">
          <h2 style="margin: 0; font-size: 20px; letter-spacing: 0.5px;">Booking Cancelled</h2>
          <p style="margin: 5px 0 0 0; font-size: 13px; color: #cbd5e1;">Booking #${bookingNumber}</p>
        </div>

        <div style="padding: 24px;">
          <p style="font-size: 15px; margin-top: 0;">Hello,</p>
          <p style="font-size: 14px; line-height: 1.5; color: #475569;">
            The meeting booking for <strong>${roomName}</strong> on <strong>${meetingDate} (${startTime} - ${endTime})</strong> has been cancelled by <strong>${cancellerName}</strong>.
          </p>

          <table style="width: 100%; border-collapse: collapse; margin: 20px 0; background: #f8fafc; border-radius: 6px; overflow: hidden;">
            <tr>
              <td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0; font-size: 13px; font-weight: bold; color: #64748b; width: 35%;">Meeting Title</td>
              <td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0; font-size: 13px; color: #0f172a;">${title || 'Meeting'}</td>
            </tr>
            <tr>
              <td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0; font-size: 13px; font-weight: bold; color: #64748b;">Released Room</td>
              <td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0; font-size: 13px; color: #0f172a;">${roomName}</td>
            </tr>
            <tr>
              <td style="padding: 10px 14px; font-size: 13px; font-weight: bold; color: #64748b;">Status</td>
              <td style="padding: 10px 14px; font-size: 13px; color: #ef4444; font-weight: bold;">CANCELLED (Slots Freed)</td>
            </tr>
          </table>
        </div>

        <div style="background: #f1f5f9; padding: 14px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0;">
          MeetSpace Nirmaan - Automated Notification System
        </div>
      </div>
    </div>
  `;

  const recipients = new Set();
  if (userEmail) recipients.add(userEmail);
  if (managerEmail) recipients.add(managerEmail);

  if (recipients.size > 0) {
    return await sendMail({
      to: Array.from(recipients),
      subject,
      html,
      text: `Booking #${bookingNumber} for ${roomName} on ${meetingDate} was cancelled.`,
    });
  }
};

/**
 * 5. Email when meeting is extended
 */
export const sendBookingExtendedMail = async ({
  userEmail,
  userName = 'User',
  roomName,
  bookingNumber,
  title,
  extensionMinutes,
  newEndTime,
}) => {
  const subject = `⏱️ Meeting Extended: #${bookingNumber} - ${roomName}`;

  const html = `
    <div style="font-family: Arial, Helvetica, sans-serif; background-color: #f4f6f9; padding: 25px; color: #333;">
      <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.08);">
        <div style="background: #d97706; padding: 20px; text-align: center; color: #ffffff;">
          <h2 style="margin: 0; font-size: 20px; letter-spacing: 0.5px;">Meeting Time Extended</h2>
          <p style="margin: 5px 0 0 0; font-size: 13px; color: #fef3c7;">+${extensionMinutes} Minutes Added</p>
        </div>

        <div style="padding: 24px;">
          <p style="font-size: 15px; margin-top: 0;">Hello <strong>${userName}</strong>,</p>
          <p style="font-size: 14px; line-height: 1.5; color: #475569;">
            Your session in <strong>${roomName}</strong> for <strong>"${title}"</strong> has been extended by <strong>${extensionMinutes} minutes</strong>.
          </p>

          <p style="font-size: 14px; color: #0f172a;">
            <strong>New End Time:</strong> <span style="color: #d97706; font-weight: bold;">${newEndTime}</span>
          </p>
        </div>

        <div style="background: #f1f5f9; padding: 14px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0;">
          MeetSpace Nirmaan - Automated Notification System
        </div>
      </div>
    </div>
  `;

  if (userEmail) {
    return await sendMail({
      to: userEmail,
      subject,
      html,
      text: `Meeting in ${roomName} extended by ${extensionMinutes} min until ${newEndTime}.`,
    });
  }
};

/**
 * 6. Send instant Test Email to verify SMTP configuration
 */
export const sendTestEmail = async (targetEmail) => {
  const subject = `🔔 MeetSpace Email Notification System Test`;

  const html = `
    <div style="font-family: Arial, Helvetica, sans-serif; background-color: #f4f6f9; padding: 25px; color: #333;">
      <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.08);">
        <div style="background: #1e3a8a; padding: 20px; text-align: center; color: #ffffff;">
          <h2 style="margin: 0; font-size: 20px; letter-spacing: 0.5px;">MeetSpace Email Notification Test</h2>
          <p style="margin: 5px 0 0 0; font-size: 13px; color: #bfdbfe;">System Verification</p>
        </div>

        <div style="padding: 24px;">
          <p style="font-size: 15px; margin-top: 0;">Hello,</p>
          <p style="font-size: 14px; line-height: 1.5; color: #475569;">
            This is a test notification confirming that the MeetSpace automated mail notification service is connected and operational.
          </p>

          <div style="background: #eff6ff; border-left: 4px solid #2563eb; padding: 12px 16px; margin: 16px 0; border-radius: 4px;">
            <p style="margin: 0; font-size: 13px; color: #1e40af;">
              ✅ <strong>Status:</strong> Mail delivery is working properly.
            </p>
          </div>
        </div>

        <div style="background: #f1f5f9; padding: 14px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0;">
          MeetSpace Nirmaan - Automated Notification System
        </div>
      </div>
    </div>
  `;

  return await sendMail({
    to: targetEmail,
    subject,
    html,
    text: 'This is a test email from MeetSpace Nirmaan Notification System.',
  });
};
