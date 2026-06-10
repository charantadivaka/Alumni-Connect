const College = require('../models/College');

// ── Helper: safely compile a regex from a stored string ──────────────────────
const compilePattern = (patternStr) => {
    try {
        return new RegExp(patternStr);
    } catch {
        return null;
    }
};

// @desc  Get all active colleges (public — used in registration dropdown)
// @route GET /api/colleges
const getColleges = async (req, res) => {
    try {
        const colleges = await College.find({ isActive: true })
            .select('name rollNumberPattern exampleFormat patternDescription')
            .sort({ name: 1 });
        res.json(colleges);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc  Get all colleges (admin — includes inactive)
// @route GET /api/admin/colleges
const getAllCollegesAdmin = async (req, res) => {
    try {
        const colleges = await College.find().sort({ name: 1 });
        res.json(colleges);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc  Create a new college
// @route POST /api/admin/colleges
const createCollege = async (req, res) => {
    try {
        const { name, rollNumberPattern, exampleFormat, patternDescription } = req.body;

        if (!name || !rollNumberPattern || !exampleFormat) {
            return res.status(400).json({ message: 'Name, roll number pattern, and example format are required' });
        }

        // Validate the regex is valid before saving
        const compiled = compilePattern(rollNumberPattern);
        if (!compiled) {
            return res.status(400).json({ message: 'Invalid regex pattern. Please check the syntax.' });
        }

        // Make sure the example actually matches its own pattern
        if (!compiled.test(exampleFormat)) {
            return res.status(400).json({ message: 'The example format does not match the provided pattern. Please fix one of them.' });
        }

        const college = await College.create({ name, rollNumberPattern, exampleFormat, patternDescription });
        res.status(201).json(college);
    } catch (err) {
        if (err.code === 11000) {
            return res.status(400).json({ message: 'A college with this name already exists' });
        }
        res.status(500).json({ message: err.message });
    }
};

// @desc  Update a college
// @route PUT /api/admin/colleges/:id
const updateCollege = async (req, res) => {
    try {
        const { name, rollNumberPattern, exampleFormat, patternDescription, isActive } = req.body;

        // Validate regex if provided
        if (rollNumberPattern) {
            const compiled = compilePattern(rollNumberPattern);
            if (!compiled) {
                return res.status(400).json({ message: 'Invalid regex pattern. Please check the syntax.' });
            }
            // Validate example matches updated pattern
            const exampleToTest = exampleFormat || (await College.findById(req.params.id))?.exampleFormat;
            if (exampleToTest && !compiled.test(exampleToTest)) {
                return res.status(400).json({ message: 'The example format does not match the pattern. Please fix one of them.' });
            }
        }

        const college = await College.findByIdAndUpdate(
            req.params.id,
            { name, rollNumberPattern, exampleFormat, patternDescription, isActive },
            { new: true, runValidators: true }
        );

        if (!college) return res.status(404).json({ message: 'College not found' });
        res.json(college);
    } catch (err) {
        if (err.code === 11000) {
            return res.status(400).json({ message: 'A college with this name already exists' });
        }
        res.status(500).json({ message: err.message });
    }
};

// @desc  Delete a college
// @route DELETE /api/admin/colleges/:id
const deleteCollege = async (req, res) => {
    try {
        const college = await College.findByIdAndDelete(req.params.id);
        if (!college) return res.status(404).json({ message: 'College not found' });
        res.json({ message: 'College deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc  Validate a roll number against a college's pattern (utility endpoint)
// @route POST /api/colleges/validate
const validateRollNumber = async (req, res) => {
    try {
        const { collegeId, rollNumber } = req.body;
        if (!collegeId || !rollNumber) {
            return res.status(400).json({ message: 'collegeId and rollNumber are required' });
        }
        const college = await College.findById(collegeId);
        if (!college) return res.status(404).json({ message: 'College not found' });

        const compiled = compilePattern(college.rollNumberPattern);
        if (!compiled) return res.status(500).json({ message: 'Stored pattern is invalid — contact admin' });

        const valid = compiled.test(rollNumber.trim());
        res.json({ valid, exampleFormat: college.exampleFormat, patternDescription: college.patternDescription });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

module.exports = { getColleges, getAllCollegesAdmin, createCollege, updateCollege, deleteCollege, validateRollNumber };
