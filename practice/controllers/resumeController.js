const Resume = require('../models/Resume');

const uploadResume = async (req, res) => {
    try {
        const { name, fileData, fileType } = req.body;
        if (!name || !fileData) return res.status(400).json({ message: 'Name and file data required' });

        const count = await Resume.countDocuments({ student: req.user._id });
        const isDefault = count === 0;

        const resume = await Resume.create({
            student: req.user._id, name, fileData,
            fileType: fileType || 'application/pdf',
            isDefault,
        });
        res.status(201).json({ _id: resume._id, name: resume.name, isDefault: resume.isDefault, createdAt: resume.createdAt });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

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
