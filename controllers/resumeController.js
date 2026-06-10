const Resume = require('../models/Resume');

// @desc  Upload resume
// @route POST /api/resumes
const uploadResume = async (req, res) => {
    try {
        const { name, fileData, fileType } = req.body;
        if (!name || !fileData) return res.status(400).json({ message: 'Name and file data required' });

        let finalFileData = fileData;

        if (process.env.CLOUDINARY_CLOUD_NAME) {
            const cloudinary = require('../config/cloudinary');
            // Upload base64 PDF/Doc to Cloudinary
            const result = await cloudinary.uploader.upload(fileData, {
                folder: 'alumniconnect/resumes',
                resource_type: 'auto'
            });
            finalFileData = result.secure_url;
        }

        const count = await Resume.countDocuments({ student: req.user._id });
        const isDefault = count === 0;

        const resume = await Resume.create({
            student: req.user._id, name, fileData: finalFileData,
            fileType: fileType || 'application/pdf',
            isDefault,
        });
        res.status(201).json({ _id: resume._id, name: resume.name, isDefault: resume.isDefault, createdAt: resume.createdAt });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc  Get my resumes (no fileData for listing)
// @route GET /api/resumes/my
const getMyResumes = async (req, res) => {
    try {
        const resumes = await Resume.find({ student: req.user._id })
            .select('-fileData')
            .sort({ createdAt: -1 });
        res.json(resumes);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc  Download/view a resume (returns fileData)
// @route GET /api/resumes/:id
const getResumeById = async (req, res) => {
    try {
        const resume = await Resume.findById(req.params.id);
        if (!resume) return res.status(404).json({ message: 'Not found' });
        if (resume.student.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized' });
        }
        res.json(resume);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc  Set a resume as default
// @route PUT /api/resumes/:id/default
const setDefault = async (req, res) => {
    try {
        await Resume.updateMany({ student: req.user._id }, { isDefault: false });
        const resume = await Resume.findOneAndUpdate(
            { _id: req.params.id, student: req.user._id },
            { isDefault: true },
            { new: true }
        );
        if (!resume) return res.status(404).json({ message: 'Not found' });
        res.json({ message: 'Default updated' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc  Delete resume
// @route DELETE /api/resumes/:id
const deleteResume = async (req, res) => {
    try {
        const resume = await Resume.findOneAndDelete({ _id: req.params.id, student: req.user._id });
        if (!resume) return res.status(404).json({ message: 'Not found or not authorized' });
        res.json({ message: 'Resume deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

module.exports = { uploadResume, getMyResumes, getResumeById, setDefault, deleteResume };
