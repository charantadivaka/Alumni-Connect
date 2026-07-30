'use strict';

/**
 * Profile Service
 * ────────────────
 * Business logic for user profile operations.
 * Extracted from profileController.js.
 */

const User = require('../../models/User');
const College = require('../../models/College');
const { invalidatePattern } = require('../../config/redis');
const { cloudinary: cloudinaryConfig } = require('../../shared/config');

const MATCH_CACHE_PATTERN = '__express__/api/match*';

/** Get the requesting user's full profile. */
const getMyProfile = async (userId) => {
    return User.findById(userId)
        .populate('college', 'name rollNumberPattern exampleFormat patternDescription')
        .select('-password');
};

/** Get any user's profile by ID (hides sensitive fields). */
const getProfileById = async (id) => {
    const user = await User.findById(id)
        .populate('college', 'name')
        .select('-password -idProof');
    if (!user) throw Object.assign(new Error('User not found'), { statusCode: 404 });
    return user;
};

/**
 * Update the requesting user's profile.
 * Validates college roll-number pattern if college changes.
 * Never allows updating password, role, email, or verificationStatus.
 */
const updateProfile = async (userId, updates) => {
    // Strip fields that must never change via this endpoint
    const safeUpdates = { ...updates };
    delete safeUpdates.password;
    delete safeUpdates.role;
    delete safeUpdates.email;
    delete safeUpdates.verificationStatus;

    // Validate roll number against new college's pattern if college is changing
    if (safeUpdates.college) {
        const collegeDoc = await College.findById(safeUpdates.college);
        if (!collegeDoc) throw Object.assign(new Error('Selected college not found'), { statusCode: 400 });

        const currentUser = await User.findById(userId);
        const rollToTest  = (safeUpdates.collegeRollNumber || currentUser.collegeRollNumber || '').trim();

        try {
            const pattern = new RegExp(collegeDoc.rollNumberPattern);
            if (!pattern.test(rollToTest)) {
                throw Object.assign(
                    new Error(
                        `Your roll number "${rollToTest}" doesn't match the ${collegeDoc.name} format. ` +
                        `Expected: ${collegeDoc.exampleFormat}` +
                        (collegeDoc.patternDescription ? ` — ${collegeDoc.patternDescription}` : '')
                    ),
                    { statusCode: 400 }
                );
            }
        } catch (err) {
            if (err.statusCode) throw err;
            console.error(`[ProfileService] Malformed rollNumberPattern for college ${collegeDoc._id}`);
        }
    }

    const user = await User.findByIdAndUpdate(
        userId,
        { $set: safeUpdates },
        { new: true, runValidators: true }
    )
        .populate('college', 'name rollNumberPattern exampleFormat patternDescription')
        .select('-password');

    await invalidatePattern(MATCH_CACHE_PATTERN);
    return user;
};

/**
 * Upload or update the user's profile picture.
 * Uses Cloudinary if configured, otherwise stores base64 directly.
 */
const uploadPicture = async (userId, imageData) => {
    if (!imageData) throw Object.assign(new Error('No image data provided'), { statusCode: 400 });

    let finalImageUrl = imageData;

    if (cloudinaryConfig.isConfigured) {
        const cloudinary = require('../../config/cloudinary');
        const result = await cloudinary.uploader.upload(imageData, {
            folder: 'alumniconnect/profiles',
            width:  300,
            crop:   'scale',
        });
        finalImageUrl = result.secure_url;
    }

    const user = await User.findByIdAndUpdate(
        userId,
        { profilePicture: finalImageUrl },
        { new: true }
    ).select('-password');

    await invalidatePattern(MATCH_CACHE_PATTERN);
    return user;
};

/**
 * Cascade-delete user account and all associated data.
 * Returns the user ID so the caller can clear the auth cookie.
 */
const deleteAccount = async (userId) => {
    const Job           = require('../../models/Job');
    const Event         = require('../../models/Event');
    const Mentorship    = require('../../models/Mentorship');
    const MockInterview = require('../../models/MockInterview');
    const Story         = require('../../models/Story');
    const Forum         = require('../../models/Forum');
    const Connection    = require('../../models/Connection');
    const Message       = require('../../models/Message');
    const Notification  = require('../../models/Notification');
    const JobApplication = require('../../models/JobApplication');
    const MentorSlot    = require('../../models/MentorSlot');

    await Promise.all([
        Job.deleteMany({ postedBy: userId }),
        Event.deleteMany({ createdBy: userId }),
        Mentorship.deleteMany({ $or: [{ student: userId }, { alumni: userId }] }),
        MockInterview.deleteMany({ $or: [{ student: userId }, { alumni: userId }] }),
        Story.deleteMany({ author: userId }),
        Forum.deleteMany({ author: userId }),
        Connection.deleteMany({ $or: [{ sender: userId }, { receiver: userId }] }),
        Message.deleteMany({ $or: [{ sender: userId }, { receiver: userId }] }),
        Notification.deleteMany({ user: userId }),
        JobApplication.deleteMany({ applicant: userId }),
        MentorSlot.deleteMany({ alumni: userId }),
    ]);

    await User.findByIdAndDelete(userId);
    await invalidatePattern(MATCH_CACHE_PATTERN);
};

module.exports = { getMyProfile, getProfileById, updateProfile, uploadPicture, deleteAccount };
