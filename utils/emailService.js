const nodemailer = require('nodemailer');

/**
 * Creates a nodemailer transporter.
 * In development (no SMTP credentials), falls back to Ethereal (catch-all test inbox).
 */
const createTransporter = async () => {
    // If real SMTP credentials are configured, use them
    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
        return nodemailer.createTransport({
            host:   process.env.SMTP_HOST   || 'smtp.gmail.com',
            port:   Number(process.env.SMTP_PORT) || 587,
            secure: process.env.SMTP_SECURE === 'true',
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });
    }

    // Development fallback — Ethereal (fake SMTP, preview link is logged)
    const testAccount = await nodemailer.createTestAccount();
    const transporter  = nodemailer.createTransport({
        host:   'smtp.ethereal.email',
        port:   587,
        secure: false,
        auth: {
            user: testAccount.user,
            pass: testAccount.pass,
        },
    });
    transporter._isEthereal = true;
    return transporter;
};

/**
 * Sends an OTP verification email.
 * @param {string} toEmail  Recipient email
 * @param {string} otp      6-digit OTP string
 * @param {string} name     Recipient's name for personalisation
 */
const sendOtpEmail = async (toEmail, otp, name = 'there') => {
    const transporter = await createTransporter();

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>Verify Your Email — AlumniConnect</title>
  <style>
    body { margin:0; padding:0; background:#0f172a; font-family:'Segoe UI',Arial,sans-serif; }
    .wrapper { max-width:520px; margin:40px auto; background:#1e293b; border-radius:16px; overflow:hidden; box-shadow:0 20px 60px rgba(0,0,0,0.4); }
    .header { background:linear-gradient(135deg,#6366f1 0%,#8b5cf6 100%); padding:36px 40px 28px; text-align:center; }
    .header h1 { margin:0; color:#fff; font-size:26px; font-weight:700; letter-spacing:-0.5px; }
    .header p  { margin:6px 0 0; color:rgba(255,255,255,0.8); font-size:14px; }
    .body { padding:36px 40px; }
    .greeting { color:#e2e8f0; font-size:16px; margin-bottom:20px; }
    .otp-label { color:#94a3b8; font-size:13px; text-transform:uppercase; letter-spacing:1px; margin-bottom:12px; }
    .otp-box { display:flex; justify-content:center; gap:10px; margin:0 0 28px; }
    .otp-digit { width:48px; height:56px; background:#0f172a; border:2px solid #6366f1; border-radius:12px;
                 display:flex; align-items:center; justify-content:center;
                 color:#a5b4fc; font-size:28px; font-weight:700; font-family:monospace; }
    .info { background:#0f172a; border-radius:10px; padding:14px 18px; margin-bottom:24px; }
    .info p { margin:0; color:#94a3b8; font-size:13px; line-height:1.6; }
    .info strong { color:#c7d2fe; }
    .divider { border:none; border-top:1px solid #334155; margin:24px 0; }
    .footer { color:#64748b; font-size:12px; text-align:center; line-height:1.6; padding-bottom:4px; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <h1>🎓 AlumniConnect</h1>
      <p>Email Verification</p>
    </div>
    <div class="body">
      <p class="greeting">Hi <strong style="color:#a5b4fc">${name}</strong>,</p>
      <p style="color:#94a3b8;font-size:14px;margin-bottom:24px;">
        Thanks for signing up! Use the verification code below to confirm your email address.
        This code expires in <strong style="color:#e2e8f0">10 minutes</strong>.
      </p>
      <p class="otp-label">Your verification code</p>
      <div class="otp-box">
        ${otp.split('').map(d => `<div class="otp-digit">${d}</div>`).join('')}
      </div>
      <div class="info">
        <p>⏱ <strong>Expires in 10 minutes</strong></p>
        <p>🔒 Never share this code with anyone.</p>
        <p>❌ If you didn't create an account, you can safely ignore this email.</p>
      </div>
      <hr class="divider"/>
      <p class="footer">
        © ${new Date().getFullYear()} AlumniConnect · Sent to ${toEmail}<br/>
        This is an automated message — please do not reply.
      </p>
    </div>
  </div>
</body>
</html>`;

    const info = await transporter.sendMail({
        from:    `"AlumniConnect" <${process.env.SMTP_USER || 'noreply@alumniconnect.dev'}>`,
        to:      toEmail,
        subject: 'Your AlumniConnect Verification Code',
        html,
    });

    if (transporter._isEthereal) {
        // In development, log the preview URL so the developer can see the email
        console.log(`📧 [Dev] OTP email preview: ${nodemailer.getTestMessageUrl(info)}`);
        console.log(`📧 [Dev] OTP for ${toEmail}: ${otp}`);
    }

    return info;
};

/**
 * Sends a password reset email.
 * @param {string} toEmail    Recipient email
 * @param {string} resetLink  Full URL with reset token
 * @param {string} name       Recipient's name
 */
const sendPasswordResetEmail = async (toEmail, resetLink, name = 'there') => {
    const transporter = await createTransporter();

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>Reset Your Password — AlumniConnect</title>
  <style>
    body { margin:0; padding:0; background:#0f172a; font-family:'Segoe UI',Arial,sans-serif; }
    .wrapper { max-width:520px; margin:40px auto; background:#1e293b; border-radius:16px; overflow:hidden; box-shadow:0 20px 60px rgba(0,0,0,0.4); }
    .header { background:linear-gradient(135deg,#6366f1 0%,#8b5cf6 100%); padding:36px 40px 28px; text-align:center; }
    .header h1 { margin:0; color:#fff; font-size:26px; font-weight:700; letter-spacing:-0.5px; }
    .header p  { margin:6px 0 0; color:rgba(255,255,255,0.8); font-size:14px; }
    .body { padding:36px 40px; }
    .greeting { color:#e2e8f0; font-size:16px; margin-bottom:20px; }
    .btn { display:block; width:fit-content; margin:24px auto; padding:14px 36px;
           background:linear-gradient(135deg,#6366f1,#8b5cf6); color:#fff; font-size:16px;
           font-weight:600; border-radius:10px; text-decoration:none; text-align:center; }
    .info { background:#0f172a; border-radius:10px; padding:14px 18px; margin-bottom:24px; }
    .info p { margin:0 0 6px; color:#94a3b8; font-size:13px; line-height:1.6; }
    .divider { border:none; border-top:1px solid #334155; margin:24px 0; }
    .footer { color:#64748b; font-size:12px; text-align:center; line-height:1.6; padding-bottom:4px; }
    .link-text { color:#a5b4fc; word-break:break-all; font-size:12px; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <h1>🎓 AlumniConnect</h1>
      <p>Password Reset Request</p>
    </div>
    <div class="body">
      <p class="greeting">Hi <strong style="color:#a5b4fc">${name}</strong>,</p>
      <p style="color:#94a3b8;font-size:14px;margin-bottom:24px;">
        We received a request to reset your password. Click the button below to set a new one.
        This link expires in <strong style="color:#e2e8f0">15 minutes</strong>.
      </p>
      <a href="${resetLink}" class="btn">Reset My Password</a>
      <div class="info">
        <p>⏱ <strong style="color:#c7d2fe">Expires in 15 minutes</strong></p>
        <p>🔒 If you didn't request this, you can safely ignore this email.</p>
        <p>🔗 Or copy this link: <span class="link-text">${resetLink}</span></p>
      </div>
      <hr class="divider"/>
      <p class="footer">
        © ${new Date().getFullYear()} AlumniConnect · Sent to ${toEmail}<br/>
        This is an automated message — please do not reply.
      </p>
    </div>
  </div>
</body>
</html>`;

    const info = await transporter.sendMail({
        from:    `"AlumniConnect" <${process.env.SMTP_USER || 'noreply@alumniconnect.dev'}>`,
        to:      toEmail,
        subject: 'Reset Your AlumniConnect Password',
        html,
    });

    if (transporter._isEthereal) {
        console.log(`📧 [Dev] Reset email preview: ${nodemailer.getTestMessageUrl(info)}`);
    }

    return info;
};

/**
 * Sends an email when a mentorship session is accepted.
 */
const sendMentorshipAcceptedEmail = async (studentEmail, studentName, alumniName, topic) => {
    if (!process.env.SMTP_USER) return; // only fire if SMTP is configured
    try {
        const transporter = await createTransporter();
        await transporter.sendMail({
            from:    `"AlumniConnect" <${process.env.SMTP_USER}>`,
            to:      studentEmail,
            subject: `Your mentorship session with ${alumniName} is confirmed!`,
            html: `<p>Hi ${studentName},</p>
                   <p><strong>${alumniName}</strong> has accepted your mentorship request for <em>"${topic}"</em>.</p>
                   <p>Log in to AlumniConnect to view session details and connect.</p>
                   <p>Best,<br/>The AlumniConnect Team</p>`,
        });
    } catch (err) {
        console.error('[Email] sendMentorshipAcceptedEmail failed:', err.message);
    }
};

/**
 * Sends an email to alumni when a student applies for their job.
 */
const sendJobApplicationEmail = async (alumniEmail, alumniName, studentName, jobTitle) => {
    if (!process.env.SMTP_USER) return; // only fire if SMTP is configured
    try {
        const transporter = await createTransporter();
        await transporter.sendMail({
            from:    `"AlumniConnect" <${process.env.SMTP_USER}>`,
            to:      alumniEmail,
            subject: `New application for "${jobTitle}"`,
            html: `<p>Hi ${alumniName},</p>
                   <p><strong>${studentName}</strong> has applied for your job posting: <em>"${jobTitle}"</em>.</p>
                   <p>Log in to AlumniConnect to review their application.</p>
                   <p>Best,<br/>The AlumniConnect Team</p>`,
        });
    } catch (err) {
        console.error('[Email] sendJobApplicationEmail failed:', err.message);
    }
};

module.exports = { sendOtpEmail, sendPasswordResetEmail, sendMentorshipAcceptedEmail, sendJobApplicationEmail };
