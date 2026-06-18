const User    = require('../models/User');
const College = require('../models/College');

// @desc  Get own profile
// @route GET /api/profile
const getMyProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id)
            .populate('college', 'name rollNumberPattern exampleFormat patternDescription')
            .select('-password');
        res.json(user);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc  Get any user profile by ID
// @route GET /api/profile/:id
const getProfileById = async (req, res) => {
    try {
        const user = await User.findById(req.params.id)
            .populate('college', 'name')
            .select('-password -idProof');
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json(user);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc  Update own profile
// @route PUT /api/profile
const updateProfile = async (req, res) => {
    try {
        const updates = { ...req.body };
        // Never allow these to be changed via profile update
        delete updates.password;
        delete updates.role;
        delete updates.email;
        delete updates.verificationStatus;

        // ── College / Roll number validation ──────────────────────────────────
        // If the user is changing their college, validate the roll number
        // against the new college's pattern.
        if (updates.college) {
            const collegeDoc = await College.findById(updates.college);
            if (!collegeDoc) {
                return res.status(400).json({ message: 'Selected college not found' });
            }
            // Fetch current roll number (from updates or existing record)
            const currentUser = await User.findById(req.user._id);
            const rollToTest = (updates.collegeRollNumber || currentUser.collegeRollNumber || '').trim();

            try {
                const pattern = new RegExp(collegeDoc.rollNumberPattern);
                if (!pattern.test(rollToTest)) {
                    return res.status(400).json({
                        message: `Your roll number "${rollToTest}" doesn't match the ${collegeDoc.name} format. Expected: ${collegeDoc.exampleFormat}${collegeDoc.patternDescription ? ' — ' + collegeDoc.patternDescription : ''}`,
                    });
                }
            } catch {
                // Malformed pattern — let it through, log it
                console.error(`[College ${collegeDoc._id}] Malformed rollNumberPattern`);
            }
        }

        const user = await User.findByIdAndUpdate(
            req.user._id,
            { $set: updates },
            { new: true, runValidators: true }
        )
            .populate('college', 'name rollNumberPattern exampleFormat patternDescription')
            .select('-password');

        res.json(user);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc  Upload profile picture
// @route PUT /api/profile/picture
const uploadPicture = async (req, res) => {
    try {
        const { imageData } = req.body;
        if (!imageData) return res.status(400).json({ message: 'No image data provided' });

        let finalImageUrl = imageData;

        // Upload to Cloudinary if configured
        if (process.env.CLOUDINARY_CLOUD_NAME) {
            const cloudinary = require('../config/cloudinary');
            const result = await cloudinary.uploader.upload(imageData, {
                folder: 'alumniconnect/profiles',
                width: 300,
                crop: 'scale'
            });
            finalImageUrl = result.secure_url;
        }

        const user = await User.findByIdAndUpdate(
            req.user._id,
            { profilePicture: finalImageUrl },
            { new: true }
        ).select('-password');

        res.json({ profilePicture: user.profilePicture });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc  Delete user account and all associated data
// @route DELETE /api/profile/me
const deleteAccount = async (req, res) => {
    try {
        const userId = req.user._id;

        // Import necessary models
        const Job = require('../models/Job');
        const Event = require('../models/Event');
        const Mentorship = require('../models/Mentorship');
        const MockInterview = require('../models/MockInterview');
        const Story = require('../models/Story');
        const Forum = require('../models/Forum');
        const Connection = require('../models/Connection');
        const Message = require('../models/Message');
        const Notification = require('../models/Notification');
        const JobApplication = require('../models/JobApplication');
        const MentorSlot = require('../models/MentorSlot');

        // Cascade delete all user-related data
        await Promise.all([
            Job.deleteMany({ postedBy: userId }),
            Event.deleteMany({ createdBy: userId }),
            Mentorship.deleteMany({ $or: [{ mentor: userId }, { mentee: userId }, { student: userId }, { alumni: userId }] }),
            MockInterview.deleteMany({ $or: [{ host: userId }, { attendee: userId }, { student: userId }, { alumni: userId }] }),
            Story.deleteMany({ author: userId }),
            Forum.deleteMany({ author: userId }),
            Connection.deleteMany({ $or: [{ sender: userId }, { receiver: userId }] }),
            Message.deleteMany({ $or: [{ sender: userId }, { receiver: userId }] }),
            Notification.deleteMany({ user: userId }),
            JobApplication.deleteMany({ applicant: userId }),
            MentorSlot.deleteMany({ alumni: userId }),
        ]);

        await User.findByIdAndDelete(userId);

        // Clear auth cookie
        res.cookie('jwt', '', { httpOnly: true, expires: new Date(0) });
        res.json({ message: 'Account and all associated data permanently deleted.' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

module.exports = { getMyProfile, getProfileById, updateProfile, uploadPicture, deleteAccount };

