const jwt = require("jsonwebtoken");
const { Model } = require("sequelize");

const authMiddleware = (req, res, next) => {
    try {
        const authHeader = req.header("Authorization");

        if (!authHeader) {
            return res.status(401).json({ message: "Authorization header not found" });
        }

        // Extract token (expecting "Bearer <token>")
        const token = authHeader.split(" ")[1];
        if (!token) {
            return res.status(401).json({ message: "Token not provided" });
        }

        // Verify token
        const decode = jwt.verify(token, process.env.JWT_SECRET || "MY_SECRET_KEY");

        // Attach decoded user info to request
        req.user = decode;

        // Proceed to next middleware or route
        next();
    } catch (error) {
        console.log("Auth ERROR:", error);
        return res.status(401).json({ message: "Invalid or expired token", error: error.message });
    }
};

module.exports = authMiddleware;
