// ── Email notification helpers ─────────────────────────────────────────────────
// These use the shared createTransporter from emailService to send notifications.
const { createTransporter } = require('./emailService');

const sendMentorshipAcceptedEmail = async (studentEmail, alumniName, topic) => {
    if (!process.env.SMTP_USER) return;

    const subject = `Mentorship Session Accepted by ${alumniName}`;
    const text = `Hi there,\n\nGood news! ${alumniName} has accepted your mentorship request regarding "${topic}".\n\nPlease log in to AlumniConnect to view the details and schedule your session.\n\nBest,\nThe AlumniConnect Team`;
    const html = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaeb; border-radius: 8px;">
            <h2 style="color: #6C63FF; margin-top: 0;">Mentorship Request Accepted</h2>
            <p>Hi there,</p>
            <p>Good news! <strong>${alumniName}</strong> has accepted your mentorship request regarding <strong>"${topic}"</strong>.</p>
            <p>Please log in to AlumniConnect to view the details and message them.</p>
            <hr style="border: none; border-top: 1px solid #eaeaeb; margin: 20px 0;" />
            <p style="font-size: 12px; color: #666;">This is an automated message from AlumniConnect.</p>
        </div>
    `;

    try {
        const transporter = await createTransporter();
        await transporter.sendMail({
            from: `"AlumniConnect" <${process.env.SMTP_USER}>`,
            to: studentEmail,
            subject,
            text,
            html,
        });
    } catch (err) {
        console.error('Failed to send mentorship accepted email:', err);
    }
};

const sendJobApplicationEmail = async (alumniEmail, studentName, jobTitle) => {
    if (!process.env.SMTP_USER) return;

    const subject = `New Application for ${jobTitle}`;
    const text = `Hi,\n\n${studentName} has just applied to the job "${jobTitle}" that you posted.\n\nLog in to AlumniConnect to view their application and resume.\n\nBest,\nThe AlumniConnect Team`;
    const html = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaeb; border-radius: 8px;">
            <h2 style="color: #6C63FF; margin-top: 0;">New Job Application</h2>
            <p>Hi,</p>
            <p><strong>${studentName}</strong> has just applied to the job <strong>"${jobTitle}"</strong> that you posted.</p>
            <p>Log in to AlumniConnect to review their application and attached resume.</p>
            <hr style="border: none; border-top: 1px solid #eaeaeb; margin: 20px 0;" />
            <p style="font-size: 12px; color: #666;">This is an automated message from AlumniConnect.</p>
        </div>
    `;

    try {
        const transporter = await createTransporter();
        await transporter.sendMail({
            from: `"AlumniConnect" <${process.env.SMTP_USER}>`,
            to: alumniEmail,
            subject,
            text,
            html,
        });
    } catch (err) {
        console.error('Failed to send job application email:', err);
    }
};

module.exports = {
    sendMentorshipAcceptedEmail,
    sendJobApplicationEmail
};
