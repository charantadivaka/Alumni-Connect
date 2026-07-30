'use strict';

const profileService = require('./profile.service');
const { sendSuccess } = require('../../shared/utils/response');

const getMyProfile = async (req, res, next) => {
    try {
        const user = await profileService.getMyProfile(req.user._id);
        sendSuccess(res, user);
    } catch (err) {
        next(err);
    }
};

const getProfileById = async (req, res, next) => {
    try {
        const user = await profileService.getProfileById(req.params.id);
        sendSuccess(res, user);
    } catch (err) {
        next(err);
    }
};

const updateProfile = async (req, res, next) => {
    try {
        const user = await profileService.updateProfile(req.user._id, req.body);
        sendSuccess(res, user, 'Profile updated successfully');
    } catch (err) {
        next(err);
    }
};

const uploadProfilePicture = async (req, res, next) => {
    try {
        const { image } = req.body;
        const user = await profileService.uploadPicture(req.user._id, image);
        sendSuccess(res, user, 'Profile picture updated successfully');
    } catch (err) {
        next(err);
    }
};

const deleteAccount = async (req, res, next) => {
    try {
        await profileService.deleteAccount(req.user._id);
        // Clear cookie since account is gone
        res.cookie('jwt', '', { httpOnly: true, expires: new Date(0) });
        sendSuccess(res, null, 'Account deleted successfully');
    } catch (err) {
        next(err);
    }
};

module.exports = {
    getMyProfile, getProfileById, updateProfile,
    uploadProfilePicture, deleteAccount
};
