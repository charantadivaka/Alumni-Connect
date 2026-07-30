'use strict';

/**
 * Resume Service
 * ──────────────
 * Business logic for user resumes.
 */

const Resume = require('../../models/Resume');
const { cloudinary: cloudinaryConfig } = require('../../shared/config');

/**
 * Upload a resume (Cloudinary if configured, else base64 DB store).
 */
const uploadResume = async (data, studentUser) => {
    const { name, fileData, fileType } = data;
    let finalFileData = fileData;

    if (cloudinaryConfig.isConfigured) {
        const cloudinary = require('../../config/cloudinary');
        const result = await cloudinary.uploader.upload(fileData, {
            folder: 'alumniconnect/resumes',
            resource_type: 'auto'
        });
        finalFileData = result.secure_url;
    }

    const count = await Resume.countDocuments({ student: studentUser._id });
    const isDefault = count === 0;

    const resume = await Resume.create({
        student:  studentUser._id, 
        name, 
        fileData: finalFileData,
        fileType: fileType || 'application/pdf',
        isDefault,
    });

    return resume;
};

/** Get resumes for a user without file payload. */
const getMyResumes = async (userId) => {
    return Resume.find({ student: userId })
        .select('-fileData')
        .sort({ createdAt: -1 });
};

/** Get full resume with payload. */
const getResumeById = async (resumeId, user) => {
    const resume = await Resume.findById(resumeId);
    if (!resume) throw Object.assign(new Error('Not found'), { statusCode: 404 });
    
    if (resume.student.toString() !== user._id.toString() && user.role !== 'admin') {
        throw Object.assign(new Error('Not authorized'), { statusCode: 403 });
    }
    
    return resume;
};

/** Set a resume as default. */
const setDefault = async (resumeId, userId) => {
    await Resume.updateMany({ student: userId }, { isDefault: false });
    
    const resume = await Resume.findOneAndUpdate(
        { _id: resumeId, student: userId },
        { isDefault: true },
        { new: true }
    );
    
    if (!resume) throw Object.assign(new Error('Resume not found'), { statusCode: 404 });
    return resume;
};

/** Delete a resume. */
const deleteResume = async (resumeId, userId) => {
    const resume = await Resume.findOneAndDelete({ _id: resumeId, student: userId });
    if (!resume) throw Object.assign(new Error('Not found or not authorized'), { statusCode: 404 });
};

module.exports = { uploadResume, getMyResumes, getResumeById, setDefault, deleteResume };
