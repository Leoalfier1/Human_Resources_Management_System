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
    // We create two different links by adding a "role" parameter at the end
    const applicantUrl = `${process.env.BASE_URL || 'http://localhost:5000'}/api/auth/verify-email?token=${token}&role=applicant`;
    const adminUrl = `${process.env.BASE_URL || 'http://localhost:5000'}/api/auth/verify-email?token=${token}&role=admin`;

    console.log("\n==================================================");
    console.log(`✉️  EMAIL VERIFICATION URLS FOR: ${email}`);
    console.log(`🔗 Confirm as APPLICANT: ${applicantUrl}`);
    console.log(`🔗 Confirm as ADMIN/HR:   ${adminUrl}`);
    console.log("==================================================\n");

    const mailOptions = {
        from: `"DepEd HRMIS" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'Verify your HRMIS Account & Select Role',
        html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; padding: 20px; border-radius: 10px;">
                <h2 style="color: #1B3A6B; text-align: center;">HRMIS Account Verification</h2>
                <p>To complete your registration for the HRMIS, please verify your email by selecting your intended role below:</p>
                
                <div style="display: flex; flex-direction: column; gap: 15px; margin: 30px 0; text-align: center;">
                    <!-- Button for Applicant -->
                    <div style="margin-bottom: 20px;">
                        <a href="${applicantUrl}" style="background-color: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block; width: 250px;">Confirm as APPLICANT</a>
                        <p style="font-size: 11px; color: #64748b; margin-top: 5px;">Select this if you are applying for a teaching position.</p>
                    </div>

                    <!-- Button for Admin/HR -->
                    <div>
                        <a href="${adminUrl}" style="background-color: #1B3A6B; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block; width: 250px;">Confirm as ADMIN / HR</a>
                        <p style="font-size: 11px; color: #64748b; margin-top: 5px;">Select this for HR Office, HRMPSB, or Appointing Authority access.</p>
                    </div>
                </div>

                <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;">
                <p style="font-size: 11px; color: #94a3b8; text-align: center;">By clicking a link above, you verify your email and set your system permissions.</p>
            </div>
        `
    };

    try {
        return await transporter.sendMail(mailOptions);
    } catch (err) {
        console.warn(`⚠️  Nodemailer actual delivery failed (normal for local environments): ${err.message}`);
        return { messageId: 'local-test-bypass' };
    }
};

const sendResetPasswordEmail = async (email, token) => {
    // This link will take the user to a special page to enter a new password
    const url = `${process.env.BASE_URL || 'http://localhost:5000'}/api/auth/reset-password-page?token=${token}`;

    console.log("\n==================================================");
    console.log(`✉️  PASSWORD RESET URL FOR: ${email}`);
    console.log(`🔗 Reset Password Link: ${url}`);
    console.log("==================================================\n");

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

    try {
        return await transporter.sendMail(mailOptions);
    } catch (err) {
        console.warn(`⚠️  Nodemailer actual delivery failed (normal for local environments): ${err.message}`);
        return { messageId: 'local-test-bypass' };
    }
};

const sendRewardNotification = async (employeeEmail, employeeName, awardType, notes) => {
    const mailOptions = {
        from: `"DepEd HRMIS" <${process.env.EMAIL_USER}>`,
        to: employeeEmail,
        subject: `Awards & Recognition - ${awardType}`,
        html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; padding: 20px; border-radius: 10px;">
                <div style="background-color: #1B3A6B; color: white; padding: 20px; border-radius: 10px 10px 0 0; text-align: center;">
                    <h2 style="margin: 0;">DepEd SDO Dapitan City</h2>
                    <p style="margin: 5px 0 0; font-size: 12px; opacity: 0.8;">Schools Division Office - HRMIS</p>
                </div>
                <div style="padding: 20px; background-color: #f8fafc;">
                    <h3 style="color: #1B3A6B; text-align: center;">Awards &amp; Recognition Notification</h3>
                    <p>Dear <strong>${employeeName}</strong>,</p>
                    <p>Congratulations! You have been nominated/received recognition under the following category:</p>
                    <div style="background-color: white; border: 2px solid #D6402F; border-radius: 8px; padding: 15px; margin: 20px 0; text-align: center;">
                        <p style="color: #D6402F; font-size: 16px; font-weight: bold; margin: 0; text-transform: uppercase;">${awardType}</p>
                    </div>
                    ${notes ? `<p><strong>Notes:</strong> ${notes}</p>` : ''}
                    <p>This recognition is part of the DepEd Performance Management System for SDO Dapitan City.</p>
                    <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;">
                    <p style="font-size: 11px; color: #94a3b8; text-align: center;">This is an automated notification from the DepEd HRMIS - Performance Management Module.</p>
                </div>
            </div>
        `
    };

    try {
        return await transporter.sendMail(mailOptions);
    } catch (err) {
        console.warn(`⚠️  Reward notification email failed: ${err.message}`);
        return { messageId: 'local-test-bypass' };
    }
};

// Update your module.exports at the bottom to include it:
module.exports = { sendVerificationEmail, sendResetPasswordEmail, sendRewardNotification };