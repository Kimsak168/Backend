const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const { User } = require("../../models");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const { Op } = require("sequelize");

// ================= REGISTER =================
router.post("/register", async (req, res) => {
    try {
        const { firstName, lastName, email, password, gender } = req.body;

        if (!password) {
            return res.status(400).json({ message: "Password is required" });
        }
        const hashPassword = await bcrypt.hash(password, 10);
        const createdUser = await User.create({
            firstName,
            lastName,
            email,
            password: hashPassword,
            gender,
            isActive: true
        });

        res.status(201).json({
            message: "User registered successfully",
            data: createdUser
        });

    } catch (error) {
        console.error("Registration error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// ================= LOGIN =================
router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ where: { email } });

        if (!user) {
            return res.status(400).json({ message: "Invalid email or password" });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(400).json({ message: "Invalid email or password" });
        }

        const token = jwt.sign(
            { id: user.id, email: user.email },
            "MY_SECRET_KEY",
            { expiresIn: "1d" }
        );

        user.password = undefined;

        res.status(200).json({
            message: "Login successful",
            data: {
                user,
                token
            }
        });

    } catch (error) {
        console.log("ERROR", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

router.post("/forgot-password", async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                message: "Email is required"
            });
        }

        const user = await User.findOne({ where: { email } });
        if (!user) {
            return res.status(200).json({
                message: "If that email exists, a reset link was sent."
            });
        }

        const resetToken = crypto.randomBytes(32).toString("hex");
        const resetPasswordExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

        await user.update({
            resetPasswordToken: resetToken,
            resetPasswordExpires: resetPasswordExpires
        });

        const resetLink = `${process.env.CLIENT_URL || "http://localhost:5173"}/reset-password?token=${resetToken}`;

        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.MAIL_USER,
                pass: process.env.MAIL_PASS
            }
        });

        await transporter.sendMail({
            from: process.env.MAIL_USER,
            to: user.email,
            subject: "Reset Password",
            html: `
                <h3>Reset Password</h3>
                <p>You requested to reset your password.</p>
                <p>Click the link below to reset your password:</p>
                <a href="${resetLink}">${resetLink}</a>
                <p>This link will expire in 15 minutes.</p>
            `
        });

        return res.status(200).json({
            message: "If that email exists, a reset link was sent."
        });

    } catch (error) {
        console.log("FORGOT PASSWORD ERROR", error);
        return res.status(500).json({
            message: "Internal server error",
            error: error.message
        });
    }
});

// ================= RESET PASSWORD =================
router.post("/reset-password", async (req, res) => {
    try {
        const { token, password, confirmPassword } = req.body;

        if (!token || !password || !confirmPassword) {
            return res.status(400).json({
                message: "Token, password and confirmPassword are required"
            });
        }

        if (password !== confirmPassword) {
            return res.status(400).json({
                message: "Password and confirm password do not match"
            });
        }

        const user = await User.findOne({
            where: {
                resetPasswordToken: token,
                resetPasswordExpires: {
                    [Op.gt]: new Date()
                }
            }
        });

        if (!user) {
            return res.status(400).json({
                message: "Invalid or expired reset token"
            });
        }

        const hashPassword = await bcrypt.hash(password, 10);

        await user.update({
            password: hashPassword,
            resetPasswordToken: null,
            resetPasswordExpires: null
        });

        return res.status(200).json({
            message: "Password reset successful"
        });

    } catch (error) {
        console.log("RESET PASSWORD ERROR", error);
        return res.status(500).json({
            message: "Internal server error",
            error: error.message
        });
    }
});

module.exports = router;
