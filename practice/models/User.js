const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const portfolioProjectSchema = new mongoose.Schema({
    title: { type: String },
    description: { type: String },
    link: { type: String },
    techStack: [String],
}, { _id: false });

const badgeSchema = new mongoose.Schema({
    type: { type: String, enum: ['top_mentor', 'active_contributor', 'job_helper', 'story_author', 'event_organizer'] },
    label: String,
    icon: String,
    awardedAt: { type: Date, default: Date.now },
}, { _id: false });

const userSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minLength: 6, select: false },
    role: { type: String, enum: ['student', 'alumni', 'admin'], required: true },
    collegeRollNumber: { type: String, required: true, unique: true, trim: true },
    profilePicture: { type: String, default: '' },
    bio: { type: String, default: '', maxlength: 600 },
    department: { type: String, default: '' },
    skills: { type: [String], default: [] },
    careerInterests: { type: [String], default: [] },
    isSuspended: { type: Boolean, default: false },

    graduationYear: { type: Number },
    company: { type: String, default: '' },
    designation: { type: String, default: '' },
    industry: { type: String, default: '' },
    linkedin: { type: String, default: '' },
    availableForMentorship: { type: Boolean, default: false },
    verificationStatus: { type: String, enum: ['Pending', 'Verified', 'Rejected'], default: 'Pending' },
    idProof: { type: String, default: '' },

    currentYear: { type: Number },
    gpa: { type: Number },
    portfolio: {
        github: { type: String, default: '' },
        portfolioUrl: { type: String, default: '' },
        projects: [portfolioProjectSchema],
    },

    location: {
        city: { type: String, default: '' },
        country: { type: String, default: '' },
        lat: { type: Number, default: null },
        lng: { type: Number, default: null },
    },
    badges: [badgeSchema],
}, { timestamps: true });

userSchema.pre('save', async function () {
    if (!this.isModified('password')) return;
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.comparePassword = async function (candidate) {
    return bcrypt.compare(candidate, this.password);
};

module.exports = mongoose.model('User', userSchema);