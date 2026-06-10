const User = require('../models/User');

const getMyProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password');
        res.json(user);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const getProfileById = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password -idProof');
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json(user);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const updateProfile = async (req, res) => {
    try {
        const updates = { ...req.body };
        delete updates.password;
        delete updates.role;
        delete updates.email;
        delete updates.verificationStatus;

        const user = await User.findByIdAndUpdate(
            req.user._id,
            { $set: updates },
            { new: true, runValidators: true }
        ).select('-password');

        res.json(user);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const uploadPicture = async (req, res) => {
    try {
        const { imageData } = req.body;
        if (!imageData) return res.status(400).json({ message: 'No image data provided' });

        const user = await User.findByIdAndUpdate(
            req.user._id,
            { profilePicture: imageData },
            { new: true }
        ).select('-password');
        res.json({ profilePicture: user.profilePicture });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

module.exports = { getMyProfile, getProfileById, updateProfile, uploadPicture };