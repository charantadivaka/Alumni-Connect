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

module.exports = { sendOtpEmail };
