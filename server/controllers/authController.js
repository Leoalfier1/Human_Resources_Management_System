const db = require('../db'); // Your MySQL connection
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const login = async (req, res) => {
    try {
        const { identifier, password, loginType } = req.body; 

        // 1. Look up the user by email (or employee ID if you have that column)
        const [users] = await db.query(
            'SELECT * FROM users WHERE email = ? OR id = ?', 
            [identifier, identifier]
        );

        // 2. If no user found -> return 401 (Unauthorized)
        if (users.length === 0) {
            return res.status(401).json({ message: "Invalid credentials." });
        }

        const user = users[0];

        // 3. Verify password using Bcrypt
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            // Never reveal if it was the email or password that was wrong
            return res.status(401).json({ message: "Invalid credentials." });
        }

        // 4. CRITICAL ROLE CHECK
        // Define which roles are allowed in the Staff Portal
        const staffRoles = ['admin', 'staff', 'hr_staff', 'hrmpsb']; 
        
        // CASE A: User is an Applicant but trying to use the Staff/Admin Portal
        if (loginType === 'staff' && user.role === 'applicant') {
            return res.status(403).json({ 
                message: "Sorry, this account type cannot log in here." 
            });
        }

        // CASE B: User is Staff/Admin but trying to use the Applicant Portal
        if (loginType === 'applicant' && staffRoles.includes(user.role)) {
            return res.status(403).json({ 
                message: "Sorry, this account type cannot log in here." 
            });
        }

        // 5. Generate JWT Token with embedded Role
        const token = jwt.sign(
            { 
                id: user.id, 
                role: user.role, 
                name: user.full_name, 
                email: user.email 
            },
            process.env.JWT_SECRET,
            { expiresIn: '1d' } // Token expires in 24 hours
        );

        // 6. Success Response
        res.status(200).json({
            message: "Login successful",
            token: token,
            user: {
                id: user.id,
                fullName: user.full_name,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {
        console.error("Login Controller Error:", error);
        res.status(500).json({ message: "An internal server error occurred." });
    }
};

module.exports = { login };