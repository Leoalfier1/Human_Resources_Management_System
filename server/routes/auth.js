const express = require('express');
const router = express.Router();
const db = require('../db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken'); // Needed to create the token
const { sendVerificationEmail } = require('../utils/mailer'); // Needed to send the mail
const { sendResetPasswordEmail } = require('../utils/mailer');

// REGISTER ROUTE
router.post('/register', async (req, res) => {
    try {
        const { fullName, email, mobile, password } = req.body;

        // 1. Check if user already exists
        const [existingUser] = await db.query('SELECT * FROM users WHERE email = ?', [email]);

        // Only block if a VERIFIED account already owns this email.
        // An unverified row (e.g. from a previous attempt where the
        // verification email failed to send) doesn't count as "taken" —
        // we let the applicant try again instead of locking them out
        // of their own email address with no way forward.
        if (existingUser.length > 0 && existingUser[0].is_verified) {
            return res.status(400).json({ message: "Email already registered" });
        }

        // 2. Hash the password (Security)
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // 3. CREATE THE TOKEN
        // This creates a temporary "ID card" for the email link
        const verificationToken = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: '1d' });

        // 4. Save to Database FIRST
        let userId;
        if (existingUser.length > 0) {
            // Re-registering over a stale, never-verified row: refresh their
            // details/password and try sending the verification email again.
            userId = existingUser[0].id;
            await db.query(
                'UPDATE users SET full_name = ?, mobile = ?, password = ? WHERE id = ?',
                [fullName, mobile, hashedPassword, userId]
            );
        } else {
            const [result] = await db.query(
                'INSERT INTO users (full_name, email, mobile, password) VALUES (?, ?, ?, ?)',
                [fullName, email, mobile, hashedPassword]
            );
            userId = result.insertId;
        }

        // 5. ATTEMPT TO SEND THE EMAIL
        console.log("Attempting to send email to:", email); 
        try {
            await sendVerificationEmail(email, verificationToken);
            console.log("✅ Email sent successfully!");
            
            // Only send ONE response back to React
            return res.status(201).json({ 
                message: "User registered! Please check your email to verify.",
                userId 
            });

        } catch (emailError) {
            console.error("❌ NODEMAILER ERROR:", emailError);
            // If email fails, we still tell the user they are registered but the email failed
            return res.status(201).json({ 
                message: "User registered, but verification email failed to send.",
                userId 
            });
        }

    } catch (error) {
        console.error("❌ SERVER ERROR:", error);
        res.status(500).json({ message: "Server error during registration" });
    }
});

// LOGIN ROUTE
// UPDATED LOGIN ROUTE WITH RBAC
router.post('/login', async (req, res) => {
    try {
        const { identifier, password, loginType } = req.body; // loginType is 'staff' or 'applicant'

        const [users] = await db.query('SELECT * FROM users WHERE email = ?', [identifier]);
        if (users.length === 0) {
            return res.status(400).json({ message: "Invalid Credentials" });
        }

        const user = users[0];

        // --- STRICT PORTAL CHECK ---
        if (loginType === 'staff' && user.role === 'applicant') {
            return res.status(403).json({ 
                message: "Sorry, this account is only authorized for the Applicant Portal." 
            });
        }

        if (loginType === 'applicant' && (user.role === 'staff' || user.role === 'admin')) {
            return res.status(403).json({ 
                message: "Sorry, this account is only authorized for the Staff/Admin Portal." 
            });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid Credentials" });
        }

        const token = jwt.sign(
            { id: user.id, role: user.role, applicant_type: user.applicant_type || null },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        res.json({
            token,
            user: { id: user.id, fullName: user.full_name, role: user.role, applicant_type: user.applicant_type || null }
        });
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
});

// VERIFY EMAIL ROUTE
// VERIFY EMAIL ROUTE
router.get('/verify-email', async (req, res) => {
    // 1. Get BOTH the token and the applicant type from the URL link
    const { token, type } = req.query;

    if (!token || !type || !['teaching', 'non_teaching'].includes(type)) {
        return res.status(400).send("Invalid request. Missing or invalid token/type.");
    }

    try {
        // 2. Verify the "Digital ID Card" (token)
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // 3. Update the user in Laragon
        // We set is_verified to 1 and record the applicant_type they selected.
        // NOTE: we deliberately do NOT touch `role` here — sign-up is applicant-only
        // (see SignUpForm.jsx), and role must stay 'applicant' regardless of what's
        // in the query string, otherwise anyone could edit the link to self-promote
        // to admin. Staff/admin accounts are created by the System Administrator only.
        const [result] = await db.query(
            'UPDATE users SET is_verified = TRUE, applicant_type = ? WHERE email = ? AND role = "applicant"', 
            [type, decoded.email]
        );

        if (result.affectedRows === 0) {
            return res.status(404).send("User not found.");
        }

        const typeLabel = type === 'teaching' ? 'TEACHING APPLICANT' : 'NON-TEACHING APPLICANT';

        // 4. Success Page
        res.send(`
            <div style="font-family: sans-serif; text-align: center; padding: 50px;">
                <h1 style="color: #1B3A6B;">Verification Successful!</h1>
                <p>Your account has been verified as: <strong>${typeLabel}</strong></p>
                <p>You may now close this window and log in to the HRMIS system.</p>
                <br/>
                <a href="http://localhost:5173" style="background: #1B3A6B; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Go to Login Page</a>
            </div>
        `);

    } catch (error) {
        console.error("Verification Error:", error);
        res.status(400).send("Link expired or invalid. Please try signing up again.");
    }
});

router.post('/forgot-password', async (req, res) => {
    const { email } = req.body;

    try {
        const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        if (users.length === 0) {
            return res.status(404).json({ message: "User with this email does not exist." });
        }

        // Create a short-lived token (30 mins)
        const resetToken = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: '30m' });

        await sendResetPasswordEmail(email, resetToken);
        res.json({ message: "Reset link sent! Please check your email." });

    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
});

// 2. ROUTE: The page where they type their new password
// For simplicity, we will send a simple HTML form back
router.get('/reset-password-page', (req, res) => {
    const { token } = req.query;
    res.send(`
        <div style="font-family: sans-serif; text-align: center; padding: 50px;">
            <h2 style="color: #1B3A6B;">Set New Password</h2>
            <form action="/api/auth/update-password" method="POST" style="display: inline-block; text-align: left; background: #f8fafc; padding: 20px; border-radius: 10px; border: 1px solid #e2e8f0;">
                <input type="hidden" name="token" value="${token}" />
                <label>New Password:</label><br/>
                <input type="password" name="newPassword" required style="padding: 8px; width: 250px; margin-top: 5px; margin-bottom: 15px;" /><br/>
                <button type="submit" style="background: #1B3A6B; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer;">Update Password</button>
            </form>
        </div>
    `);
});

// 3. ROUTE: Actually update the database
router.post('/update-password', async (req, res) => {
    const { token, newPassword } = req.body;

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        await db.query('UPDATE users SET password = ? WHERE email = ?', [hashedPassword, decoded.email]);

        res.send("<h1>Password Updated!</h1><p>You can now log in with your new password.</p><a href='http://localhost:5173'>Go to Login</a>");
    } catch (error) {
        res.status(400).send("Link expired or invalid.");
    }
});


module.exports = router;