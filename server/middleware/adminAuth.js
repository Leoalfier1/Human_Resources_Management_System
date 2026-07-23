const jwt = require('jsonwebtoken');

const verifyAdmin = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: "Access Denied." });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (decoded.role !== 'admin') {
            return res.status(403).json({ message: "Unauthorized. Admin credentials required." });
        }
        req.user = decoded;
        next();
    } catch (error) {
        res.status(400).json({ message: "Invalid Session." });
    }
};

module.exports = { verifyAdmin };
