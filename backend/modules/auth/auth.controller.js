'use strict';

const authService = require('./auth.service');
const { sendSuccess } = require('../../shared/utils/response');
const generateToken = require('../../utils/generateToken');
const { jwt: jwtConfig } = require('../../shared/config');

/** Helper to set JWT cookie — name must match what authMiddleware reads (req.cookies.jwt) */
const setTokenCookie = (res, token) => {
    res.cookie('jwt', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: jwtConfig.cookieMaxAge,
    });
};

/** Initiate OTP registration */
const sendOtp = async (req, res, next) => {
    try {
        const result = await authService.initiateSendOtp(req.body);
        sendSuccess(res, result, 'OTP sent successfully to email.');
    } catch (err) {
        next(err);
    }
};

/** Verify OTP and create user */
const verifyOtp = async (req, res, next) => {
    try {
        const { email, otp } = req.body;
        const user = await authService.verifyAndCreateUser(email, otp);
        const token = generateToken(user._id);
        
        setTokenCookie(res, token);
        sendSuccess(res, { user, token }, 'Registration successful.', 201);
    } catch (err) {
        next(err);
    }
};

/** Resend OTP */
const resendOtp = async (req, res, next) => {
    try {
        const result = await authService.resendOtp(req.body.email);
        if (!result) {
            return res.status(400).json({ message: 'Session expired. Please register again.' });
        }
        sendSuccess(res, { email: req.body.email }, 'OTP resent successfully.');
    } catch (err) {
        next(err);
    }
};

/** Legacy registration without OTP */
const register = async (req, res, next) => {
    try {
        const user = await authService.registerDirectly(req.body);
        const token = generateToken(user._id);
        
        setTokenCookie(res, token);
        sendSuccess(res, { user, token }, 'Registration successful', 201);
    } catch (err) {
        next(err);
    }
};

/** User login */
const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        const user = await authService.loginUser(email, password);
        const token = generateToken(user._id);
        
        setTokenCookie(res, token);
        sendSuccess(res, { user, token }, 'Login successful');
    } catch (err) {
        next(err);
    }
};

/** Change password (authenticated) */
const changePassword = async (req, res, next) => {
    try {
        const { currentPassword, newPassword } = req.body;
        await authService.changePassword(req.user._id, currentPassword, newPassword);
        sendSuccess(res, null, 'Password updated successfully');
    } catch (err) {
        next(err);
    }
};

/** Forgot password (send reset email) */
const forgotPassword = async (req, res, next) => {
    try {
        await authService.initiateForgotPassword(req.body.email);
        sendSuccess(res, null, 'If that email is registered, a password reset link has been sent.');
    } catch (err) {
        next(err);
    }
};

/** Reset password (with token) */
const resetPassword = async (req, res, next) => {
    try {
        const { token, newPassword } = req.body;
        await authService.resetPassword(token, newPassword);
        sendSuccess(res, null, 'Password has been reset successfully. You can now log in.');
    } catch (err) {
        next(err);
    }
};

/** Admin login */
const adminLogin = async (req, res, next) => {
    try {
        const { username, password } = req.body;
        const admin = await authService.loginAdmin(username, password);
        const token = generateToken(admin._id);
        
        setTokenCookie(res, token);
        sendSuccess(res, { token, user: admin }, 'Admin logged in');
    } catch (err) {
        next(err);
    }
};

/** Logout */
const logout = (req, res) => {
    res.cookie('jwt', '', {
        httpOnly: true,
        expires: new Date(0),
    });
    sendSuccess(res, null, 'Logged out successfully');
};

/** Get current authenticated user (session check) */
const getMe = (req, res) => {
    // req.user is populated by the protect middleware
    sendSuccess(res, req.user, 'Authenticated');
};

module.exports = {
    sendOtp, verifyOtp, resendOtp, register,
    login, changePassword, forgotPassword, resetPassword,
    adminLogin, logout, getMe
};
