'use strict';

/**
 * College Service
 * ───────────────
 * Business logic for college management, validation, and fee checks.
 */

const College = require('../../models/College');

/** Safely compile a regex from a stored string */
const compilePattern = (patternStr) => {
    try {
        return new RegExp(patternStr);
    } catch {
        return null;
    }
};

/** Get all active colleges (public use). */
const getActiveColleges = async () => {
    return College.find({ isActive: true })
        .select('name rollNumberPattern exampleFormat patternDescription')
        .sort({ name: 1 });
};

/** Get all colleges (admin use). */
const getAllCollegesAdmin = async () => {
    return College.find().sort({ name: 1 });
};

/**
 * Admin create college manually.
 * Validates regex pattern and example.
 */
const createCollege = async (data) => {
    const { name, rollNumberPattern, exampleFormat, patternDescription } = data;

    const compiled = compilePattern(rollNumberPattern);
    if (!compiled) {
        throw Object.assign(new Error('Invalid regex pattern. Please check the syntax.'), { statusCode: 400 });
    }
    if (!compiled.test(exampleFormat)) {
        throw Object.assign(new Error('The example format does not match the provided pattern.'), { statusCode: 400 });
    }

    const college = await College.create({ name, rollNumberPattern, exampleFormat, patternDescription });
    return college;
};

/**
 * Admin update college.
 * Validates regex if provided.
 */
const updateCollege = async (collegeId, data) => {
    const { name, rollNumberPattern, exampleFormat, patternDescription, isActive } = data;

    if (rollNumberPattern) {
        const compiled = compilePattern(rollNumberPattern);
        if (!compiled) {
            throw Object.assign(new Error('Invalid regex pattern. Please check the syntax.'), { statusCode: 400 });
        }

        const college = await College.findById(collegeId);
        if (!college) throw Object.assign(new Error('College not found'), { statusCode: 404 });

        const exampleToTest = exampleFormat || college.exampleFormat;
        if (exampleToTest && !compiled.test(exampleToTest)) {
            throw Object.assign(new Error('The example format does not match the pattern.'), { statusCode: 400 });
        }
    }

    const college = await College.findByIdAndUpdate(
        collegeId,
        { name, rollNumberPattern, exampleFormat, patternDescription, isActive },
        { new: true, runValidators: true }
    );

    if (!college) throw Object.assign(new Error('College not found'), { statusCode: 404 });
    return college;
};

/** Admin delete college. */
const deleteCollege = async (collegeId) => {
    const college = await College.findByIdAndDelete(collegeId);
    if (!college) throw Object.assign(new Error('College not found'), { statusCode: 404 });
};

/** Validate a roll number against a college's pattern (utility). */
const validateRollNumber = async (collegeId, rollNumber) => {
    const college = await College.findById(collegeId);
    if (!college) throw Object.assign(new Error('College not found'), { statusCode: 404 });

    const compiled = compilePattern(college.rollNumberPattern);
    if (!compiled) throw Object.assign(new Error('Stored pattern is invalid — contact admin'), { statusCode: 500 });

    const valid = compiled.test(rollNumber.trim());
    return { valid, exampleFormat: college.exampleFormat, patternDescription: college.patternDescription };
};

/** Check a college's fee/subscription status by name (public). */
const getCollegeFeeStatus = async (name) => {
    const escapedName = name.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const college = await College.findOne({
        name: { $regex: new RegExp(`^${escapedName}$`, 'i') },
    }).select('name feesPaid feePaidUntil isActive');

    if (!college) {
        return { found: false };
    }

    const now = new Date();
    const expiry = college.feePaidUntil ? new Date(college.feePaidUntil) : null;
    const isExpired = expiry ? expiry < now : true;
    const daysRemaining = expiry
        ? Math.max(0, Math.ceil((expiry - now) / (1000 * 60 * 60 * 24)))
        : 0;

    return {
        found: true,
        collegeName: college.name,
        isActive: college.isActive,
        feesPaid: college.feesPaid,
        feePaidUntil: expiry ? expiry.toISOString() : null,
        isExpired,
        daysRemaining,
    };
};

module.exports = {
    getActiveColleges, getAllCollegesAdmin, createCollege, updateCollege,
    deleteCollege, validateRollNumber, getCollegeFeeStatus,
};
