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
    // ── Core ──────────────────────────────────────────────
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6, select: false },
    role: { type: String, enum: ['student', 'alumni', 'admin'], required: true },
    college: { type: require('mongoose').Schema.Types.ObjectId, ref: 'College', default: null },
    collegeRollNumber: { type: String, required: true, unique: true, trim: true },
    profilePicture: { type: String, default: '' },
    bio: { type: String, default: '', maxlength: 600 },
    department: { type: String, default: '' },
    skills: { type: [String], default: [] },
    careerInterests: { type: [String], default: [] },
    isSuspended: { type: Boolean, default: false },

    // ── Alumni-specific ───────────────────────────────────
    graduationYear: { type: Number },
    company: { type: String, default: '' },
    designation: { type: String, default: '' },
    industry: { type: String, default: '' },
    linkedin: { type: String, default: '' },
    yearsOfExperience: { type: Number, default: 0 },
    mentorshipsCount: { type: Number, default: 0 },
    studentsHelped: { type: Number, default: 0 },
    rating: { type: Number, default: 0.0 },
    mentorshipAvailability: { type: String, enum: ['Available', 'Limited', 'Fully Booked'], default: 'Available' },
    verificationStatus: { type: String, enum: ['Pending', 'Verified', 'Rejected'], default: 'Pending' },
    idProof: { type: String, default: '' },

    // ── Student-specific ──────────────────────────────────
    currentYear: { type: Number },
    gpa: { type: Number },
    portfolio: {
        github: { type: String, default: '' },
        portfolioUrl: { type: String, default: '' },
        projects: [portfolioProjectSchema],
    },

    // ── Shared extras ────────────────────────────────────
    location: {
        city: { type: String, default: '' },
        country: { type: String, default: '' },
        lat: { type: Number, default: null },
        lng: { type: Number, default: null },
    },
    badges: [badgeSchema],
}, { timestamps: true });

// Hash password before save
userSchema.pre('save', async function () {
    if (!this.isModified('password')) return;
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.comparePassword = async function (candidate) {
    return bcrypt.compare(candidate, this.password);
};

// Indexes for performance
userSchema.index({ role: 1, college: 1 });
userSchema.index({ industry: 1 });
userSchema.index({ collegeRollNumber: 1 }, { unique: true });

module.exports = mongoose.model('User', userSchema);
