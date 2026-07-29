const { Resend } = require('resend');
require('dotenv').config();

const resend = new Resend(process.env.RESEND_API_KEY);

// IMPORTANT: Resend's free tier only allows sending FROM
// "onboarding@resend.dev" until you verify your own domain in the
// Resend dashboard (Domains → Add Domain). Once you verify a domain
// (e.g. deped-dapitan.com), change FROM_ADDRESS below to something
// like "DepEd HRMIS <noreply@deped-dapitan.com>".
const FROM_ADDRESS = 'DepEd HRMIS <onboarding@resend.dev>';

const sendVerificationEmail = async (email, token) => {
    try {
        const teachingUrl = `${process.env.BASE_URL}/api/auth/verify-email?token=${token}&type=teaching`;
        const nonTeachingUrl = `${process.env.BASE_URL}/api/auth/verify-email?token=${token}&type=non_teaching`;
        const teachingRelatedUrl = `${process.env.BASE_URL}/api/auth/verify-email?token=${token}&type=teaching_related`;

        const { data, error } = await resend.emails.send({
            from: FROM_ADDRESS,
            to: email,
            subject: 'Verify your HRMIS Account & Select Applicant Type',
            html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; padding: 20px; border-radius: 10px;">
                    <h2 style="color: #1B3A6B; text-align: center;">HRMIS Account Verification</h2>
                    <p>To complete your registration for the DepEd SDO Dapitan City HRMIS, please verify your email by selecting the type of position you intend to apply for:</p>
                    
                    <div style="display: flex; flex-direction: column; gap: 15px; margin: 30px 0; text-align: center;">
                        <div style="margin-bottom: 20px;">
                            <a href="${teachingUrl}" style="background-color: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block; width: 250px;">Confirm as TEACHING Applicant</a>
                            <p style="font-size: 11px; color: #64748b; margin-top: 5px;">Select this if you are applying for a teaching position (e.g. Teacher I-III, Master Teacher).</p>
                        </div>

                        <div style="margin-bottom: 20px;">
                            <a href="${nonTeachingUrl}" style="background-color: #1B3A6B; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block; width: 250px;">Confirm as NON-TEACHING Applicant</a>
                            <p style="font-size: 11px; color: #64748b; margin-top: 5px;">Select this if you are applying for an administrative or support staff position.</p>
                        </div>

                        <div>
                            <a href="${teachingRelatedUrl}" style="background-color: #7c3aed; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block; width: 250px;">Confirm as TEACHING-RELATED Applicant</a>
                            <p style="font-size: 11px; color: #64748b; margin-top: 5px;">Select this if you are applying for a teaching-related position (e.g. School Registrar, Guidance Counselor, Librarian, ADAS).</p>
                        </div>
                    </div>

                    <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;">
                    <p style="font-size: 11px; color: #94a3b8; text-align: center;">By clicking a link above, you verify your email and set your applicant type.</p>
                </div>
            `
        });

        if (error) {
            console.error('❌ Resend API error (verification email):', error);
            return null;
        }

        return data;
    } catch (err) {
        console.error('❌ Failed to send verification email:', err.message || err);
        return null;
    }
};

const sendResetPasswordEmail = async (email, token) => {
    try {
        const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
        const url = `${clientUrl}/reset-password/${token}`;

        const { data, error } = await resend.emails.send({
            from: FROM_ADDRESS,
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
        });

        if (error) {
            console.error('❌ Resend API error (reset password email):', error);
            return null;
        }

        return data;
    } catch (err) {
        console.error('❌ Failed to send reset password email:', err.message || err);
        return null;
    }
};

const sendAnnexEEmail = async (email, applicantName, positionTitle, letterType, pdfBuffer, applicationCode) => {
    try {
        const subject = letterType === 'qualified'
            ? `Initial Evaluation Result – ${positionTitle} (Qualified)`
            : `Initial Evaluation Result – ${positionTitle} (Disqualified)`;

        const body = letterType === 'qualified'
            ? `<p>Dear ${applicantName},</p>
               <p>Please find attached your Initial Evaluation Advice Letter regarding your application for the position of <strong>${positionTitle}</strong> (Application Code: <strong>${applicationCode}</strong>).</p>
               <p>Congratulations! You have been found qualified based on the initial evaluation of your qualifications vis-à-vis the CSC-approved Qualification Standards.</p>
               <p>You may refer to the attached Annex E for the detailed evaluation results and next steps in the selection process.</p>`
            : `<p>Dear ${applicantName},</p>
               <p>Please find attached your Initial Evaluation Advice Letter regarding your application for the position of <strong>${positionTitle}</strong> (Application Code: <strong>${applicationCode}</strong>).</p>
               <p>After careful review of your qualifications vis-à-vis the CSC-approved Qualification Standards, we regret to inform you that you did not meet the minimum requirements for this position.</p>
               <p>You may, however, continue to submit job applications in response to other vacancy announcements published on our official channels.</p>
               <p>Thank you and we wish you the best of luck in your future endeavors.</p>`;

        const { data, error } = await resend.emails.send({
            from: FROM_ADDRESS,
            to: email,
            subject,
            html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; padding: 20px; border-radius: 10px;">
                    <div style="text-align: center; margin-bottom: 20px;">
                        <h2 style="color: #1B3A6B; margin: 0;">Schools Division Office of Dapitan City</h2>
                        <p style="color: #64748b; font-size: 12px; margin: 4px 0 0;">Department of Education – Region IX</p>
                    </div>
                    <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 16px 0;">
                    ${body}
                    <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;">
                    <p style="font-size: 11px; color: #94a3b8; text-align: center;">
                        This is an official communication from the Human Resource Management Division.<br>
                        Please do not reply to this email. For inquiries, contact us at the numbers provided in the attached letter.
                    </p>
                </div>
            `,
            attachments: pdfBuffer ? [{
                filename: `AnnexE_${applicationCode}_${letterType === 'qualified' ? 'Qualified' : 'Disqualified'}.pdf`,
                content: pdfBuffer
            }] : []
        });

        if (error) {
            console.error('❌ Resend API error (Annex E email):', error);
            return null;
        }

        return data;
    } catch (err) {
        console.error('❌ Failed to send Annex E email:', err.message || err);
        return null;
    }
};

const sendAppointmentConfirmationEmail = async (email, appointeeName, positionTitle, station, employeeNo) => {
    try {
        const { data, error } = await resend.emails.send({
            from: FROM_ADDRESS,
            to: email,
            subject: `Official Notice of Appointment – ${positionTitle}`,
            html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; padding: 20px; border-radius: 10px;">
                    <div style="text-align: center; margin-bottom: 20px;">
                        <h2 style="color: #1B3A6B; margin: 0;">Schools Division Office of Dapitan City</h2>
                        <p style="color: #64748b; font-size: 12px; margin: 4px 0 0;">Department of Education – Region IX</p>
                    </div>
                    <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 16px 0;">
                    <h3 style="color: #166534; text-align: center; margin-top: 0;">Notice of Official Appointment</h3>
                    <p>Dear <strong>${appointeeName}</strong>,</p>
                    <p>We are pleased to inform you that your official appointment for the position of <strong>${positionTitle}</strong> at <strong>${station}</strong> has been issued.</p>
                    <div style="background-color: #f0fdf4; border-left: 4px solid #166534; padding: 15px; margin: 20px 0; border-radius: 4px;">
                        <p style="margin: 0; font-size: 14px;"><strong>Employee No.:</strong> ${employeeNo}</p>
                        <p style="margin: 6px 0 0; font-size: 14px;"><strong>Position:</strong> ${positionTitle}</p>
                        <p style="margin: 6px 0 0; font-size: 14px;"><strong>Station / Office:</strong> ${station}</p>
                    </div>
                    <p>Your record is now active in the DepEd HRMIS Personnel Directory. You may log in to your Personnel Portal to view your profile, service record, and leave credits.</p>
                    <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;">
                    <p style="font-size: 11px; color: #94a3b8; text-align: center;">
                        This is an automated system notification from the Human Resource Management Division.<br>
                        Please do not reply to this email. For inquiries, contact the HRMO directly.
                    </p>
                </div>
            `
        });

        if (error) {
            console.error('❌ Resend API error (appointment confirmation email):', error);
            return null;
        }

        return data;
    } catch (err) {
        console.error('❌ Failed to send appointment confirmation email:', err.message || err);
        return null;
    }
};

const sendCongratulatoryAdviceEmail = async (email, applicantName, positionTitle, station, reportDate, docDeadline) => {
    try {
        if (!email) {
            console.warn('⚠️ sendCongratulatoryAdviceEmail: Recipient email is empty, skipping email send.');
            return null;
        }

        const formattedReportDate = reportDate
            ? new Date(reportDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
            : 'To Be Announced';

        const formattedDeadline = docDeadline
            ? new Date(docDeadline).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
            : '7 days from receipt';

        const { data, error } = await resend.emails.send({
            from: FROM_ADDRESS,
            to: email,
            subject: `Selection & Congratulatory Advice – ${positionTitle}`,
            html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; padding: 20px; border-radius: 10px;">
                    <div style="text-align: center; margin-bottom: 20px;">
                        <h2 style="color: #1B3A6B; margin: 0;">Schools Division Office of Dapitan City</h2>
                        <p style="color: #64748b; font-size: 12px; margin: 4px 0 0;">Department of Education – Region IX</p>
                    </div>
                    <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 16px 0;">
                    <h3 style="color: #15803d; text-align: center; margin-top: 0;">Congratulations on Your Selection!</h3>
                    <p>Dear <strong>${applicantName}</strong>,</p>
                    <p>We are pleased to inform you of your selection for appointment to the position of <strong>${positionTitle}</strong> at <strong>${station}</strong>.</p>
                    <div style="background-color: #f0fdf4; border-left: 4px solid #15803d; padding: 15px; margin: 20px 0; border-radius: 4px;">
                        <p style="margin: 0; font-size: 14px;"><strong>Effective Date of Report:</strong> ${formattedReportDate}</p>
                        <p style="margin: 6px 0 0; font-size: 14px;"><strong>Document Submission Deadline:</strong> ${formattedDeadline}</p>
                    </div>
                    <p>Please log in to your Applicant Portal to view the full Notice of Selection and submit the required appointment documents before the specified deadline.</p>
                    <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;">
                    <p style="font-size: 11px; color: #94a3b8; text-align: center;">
                        This is an official communication from the Human Resource Management Division.<br>
                        Please do not reply to this email.
                    </p>
                </div>
            `
        });

        if (error) {
            console.error('❌ Resend API error (congratulatory advice email):', error);
            return null;
        }

        return data;
    } catch (err) {
        console.error('❌ Failed to send congratulatory advice email:', err.message || err);
        return null;
    }
};

const sendLeaveApprovalEmail = async (email, employeeName, leaveType, dateFrom, dateTo, numDays, daysType, remark) => {
    try {
        if (!email) {
            console.warn('⚠️ sendLeaveApprovalEmail: Recipient email is empty, skipping email send.');
            return null;
        }

        const formattedDaysType = (daysType || 'with_pay').replace(/_/g, ' ');

        const { data, error } = await resend.emails.send({
            from: FROM_ADDRESS,
            to: email,
            subject: `Leave Application Approved – ${leaveType.toUpperCase()}`,
            html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; padding: 20px; border-radius: 10px;">
                    <div style="text-align: center; margin-bottom: 20px;">
                        <h2 style="color: #1B3A6B; margin: 0;">Schools Division Office of Dapitan City</h2>
                        <p style="color: #64748b; font-size: 12px; margin: 4px 0 0;">Department of Education – Region IX</p>
                    </div>
                    <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 16px 0;">
                    <h3 style="color: #166534; text-align: center; margin-top: 0;">Leave Application Approved</h3>
                    <p>Dear <strong>${employeeName}</strong>,</p>
                    <p>Your leave application has been officially approved by the Appointing Authority.</p>
                    <div style="background-color: #f0fdf4; border-left: 4px solid #166534; padding: 15px; margin: 20px 0; border-radius: 4px;">
                        <p style="margin: 0; font-size: 14px;"><strong>Leave Type:</strong> ${leaveType.toUpperCase()}</p>
                        <p style="margin: 6px 0 0; font-size: 14px;"><strong>Inclusive Dates:</strong> ${dateFrom} to ${dateTo} (${numDays || 1} day/s)</p>
                        <p style="margin: 6px 0 0; font-size: 14px;"><strong>Action:</strong> Approved (${formattedDaysType})</p>
                        ${remark ? `<p style="margin: 6px 0 0; font-size: 14px;"><strong>Remarks:</strong> ${remark}</p>` : ''}
                    </div>
                    <p>You may view your updated leave credit balance and application status on your Personnel Portal.</p>
                    <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;">
                    <p style="font-size: 11px; color: #94a3b8; text-align: center;">This is an automated system notification from DepEd SDO Dapitan City HRMIS.</p>
                </div>
            `
        });

        if (error) {
            console.error('❌ Resend API error (leave approval email):', error);
            return null;
        }

        return data;
    } catch (err) {
        console.error('❌ Failed to send leave approval email:', err.message || err);
        return null;
    }
};

const sendLeaveRejectionEmail = async (email, employeeName, leaveType, dateFrom, dateTo, rejectionReason, stage) => {
    try {
        if (!email) {
            console.warn('⚠️ sendLeaveRejectionEmail: Recipient email is empty, skipping email send.');
            return null;
        }

        const stageText = stage === 'final_action' ? 'Final Action' : 'Recommendation';

        const { data, error } = await resend.emails.send({
            from: FROM_ADDRESS,
            to: email,
            subject: `Leave Application Disapproved – ${leaveType.toUpperCase()}`,
            html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; padding: 20px; border-radius: 10px;">
                    <div style="text-align: center; margin-bottom: 20px;">
                        <h2 style="color: #1B3A6B; margin: 0;">Schools Division Office of Dapitan City</h2>
                        <p style="color: #64748b; font-size: 12px; margin: 4px 0 0;">Department of Education – Region IX</p>
                    </div>
                    <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 16px 0;">
                    <h3 style="color: #991b1b; text-align: center; margin-top: 0;">Notice of Leave Disapproval</h3>
                    <p>Dear <strong>${employeeName}</strong>,</p>
                    <p>Regrettably, your application for leave has been disapproved at the <strong>${stageText}</strong> stage.</p>
                    <div style="background-color: #fef2f2; border-left: 4px solid #991b1b; padding: 15px; margin: 20px 0; border-radius: 4px;">
                        <p style="margin: 0; font-size: 14px;"><strong>Leave Type:</strong> ${leaveType.toUpperCase()}</p>
                        <p style="margin: 6px 0 0; font-size: 14px;"><strong>Inclusive Dates:</strong> ${dateFrom} to ${dateTo}</p>
                        <p style="margin: 6px 0 0; font-size: 14px;"><strong>Reason for Disapproval:</strong> ${rejectionReason || 'Not specified'}</p>
                    </div>
                    <p>If you have any questions, please contact the Personnel Unit.</p>
                    <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;">
                    <p style="font-size: 11px; color: #94a3b8; text-align: center;">This is an automated system notification from DepEd SDO Dapitan City HRMIS.</p>
                </div>
            `
        });

        if (error) {
            console.error('❌ Resend API error (leave rejection email):', error);
            return null;
        }

        return data;
    } catch (err) {
        console.error('❌ Failed to send leave rejection email:', err.message || err);
        return null;
    }
};

module.exports = {
    sendVerificationEmail,
    sendResetPasswordEmail,
    sendAnnexEEmail,
    sendAppointmentConfirmationEmail,
    sendCongratulatoryAdviceEmail,
    sendLeaveApprovalEmail,
    sendLeaveRejectionEmail
};
