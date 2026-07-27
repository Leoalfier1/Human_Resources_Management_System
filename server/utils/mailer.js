const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
    service: 'gmail',
    host: 'smtp.gmail.com',
    port: 465,
    secure: true, // Use SSL
    auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
}
});

const sendVerificationEmail = async (email, token) => {
    // Sign-up is applicant-only (see SignUpForm.jsx) — admin/staff accounts are
    // created by the System Administrator, never through self-registration.
    // So instead of asking "which role are you", we ask which kind of position
    // the applicant intends to apply for.
    const teachingUrl = `${process.env.BASE_URL}/api/auth/verify-email?token=${token}&type=teaching`;
    const nonTeachingUrl = `${process.env.BASE_URL}/api/auth/verify-email?token=${token}&type=non_teaching`;
    const teachingRelatedUrl = `${process.env.BASE_URL}/api/auth/verify-email?token=${token}&type=teaching_related`;

    const mailOptions = {
        from: `"DepEd HRMIS" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'Verify your HRMIS Account & Select Applicant Type',
        html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; padding: 20px; border-radius: 10px;">
                <h2 style="color: #1B3A6B; text-align: center;">HRMIS Account Verification</h2>
                <p>To complete your registration for the DepEd SDO Dapitan City HRMIS, please verify your email by selecting the type of position you intend to apply for:</p>
                
                <div style="display: flex; flex-direction: column; gap: 15px; margin: 30px 0; text-align: center;">
                    <!-- Button for Teaching -->
                    <div style="margin-bottom: 20px;">
                        <a href="${teachingUrl}" style="background-color: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block; width: 250px;">Confirm as TEACHING Applicant</a>
                        <p style="font-size: 11px; color: #64748b; margin-top: 5px;">Select this if you are applying for a teaching position (e.g. Teacher I-III, Master Teacher).</p>
                    </div>

                    <!-- Button for Non-Teaching -->
                    <div style="margin-bottom: 20px;">
                        <a href="${nonTeachingUrl}" style="background-color: #1B3A6B; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block; width: 250px;">Confirm as NON-TEACHING Applicant</a>
                        <p style="font-size: 11px; color: #64748b; margin-top: 5px;">Select this if you are applying for an administrative or support staff position.</p>
                    </div>

                    <!-- Button for Teaching-Related -->
                    <div>
                        <a href="${teachingRelatedUrl}" style="background-color: #7c3aed; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block; width: 250px;">Confirm as TEACHING-RELATED Applicant</a>
                        <p style="font-size: 11px; color: #64748b; margin-top: 5px;">Select this if you are applying for a teaching-related position (e.g. School Registrar, Guidance Counselor, Librarian, ADAS).</p>
                    </div>
                </div>

                <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;">
                <p style="font-size: 11px; color: #94a3b8; text-align: center;">By clicking a link above, you verify your email and set your applicant type.</p>
            </div>
        `
    };

    return transporter.sendMail(mailOptions);
};

module.exports = { sendVerificationEmail };

const sendResetPasswordEmail = async (email, token) => {
    // Link directs to the React reset-password page
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const url = `${clientUrl}/reset-password/${token}`;

    const mailOptions = {
        from: `"DepEd HRMIS" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'Password Reset Request - HRMIS',
        html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; padding: 20px; border-radius: 10px;">
                <h2 style="color: #1B3A6B; text-align: center;">Password Reset</h2>
                <p>We received a request to reset the password for your HRMIS account.</p>
                <p>Click the button below to set a new password. This link will expire in 30 minutes.</p>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${url}" style="background-color: #E11D48; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Reset Password</a>
                </div>
                <p style="font-size: 11px; color: #94a3b8; text-align: center;">If you did not request this, please ignore this email and your password will remain unchanged.</p>
            </div>
        `
    };

    return transporter.sendMail(mailOptions);
};

// Update your module.exports at the bottom to include it:
module.exports = { sendVerificationEmail, sendResetPasswordEmail };