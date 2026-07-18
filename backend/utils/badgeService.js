const User = require('../models/User');
const Mentorship = require('../models/Mentorship');
const Forum = require('../models/Forum');

/**
 * Badge definitions.
 * key = badge type stored in User.badges[]
 * Each badge is awarded once and checked idempotently.
 */
const BADGES = {
    top_mentor:         { label: 'Top Mentor',        threshold: 5 },
    story_author:       { label: 'Story Author',      threshold: 1 },
    event_organizer:    { label: 'Event Organizer',   threshold: 1 },
    job_helper:         { label: 'Job Helper',        threshold: 1 },
    active_contributor: { label: 'Active Contributor',threshold: 10 },
};

/**
 * Awards a badge to a user if they don't already have it.
 * @param {string} userId
 * @param {string} badgeType   — key from BADGES
 */
const awardBadge = async (userId, badgeType) => {
    try {
        await User.updateOne(
            { _id: userId, 'badges.type': { $ne: badgeType } },
            { $push: { badges: { type: badgeType, awardedAt: new Date() } } }
        );
    } catch (err) {
        // Badge award is non-critical — log but don't crash
        console.error(`[Badge] Failed to award ${badgeType} to ${userId}:`, err.message);
    }
};

/**
 * Checks and awards relevant badges after an event trigger.
 * @param {string} userId     — user who performed the action
 * @param {string} trigger    — 'mentorship_complete' | 'story_created' | 'event_created' |
 *                              'referral_submitted' | 'thread_created'
 */
const checkAndAwardBadges = async (userId, trigger) => {
    try {
        switch (trigger) {
            case 'mentorship_complete': {
                // Count all Completed mentorship sessions where this user is alumni
                const count = await Mentorship.countDocuments({ alumni: userId, status: 'Completed' });
                if (count >= BADGES.top_mentor.threshold) {
                    await awardBadge(userId, 'top_mentor');
                }
                break;
            }

            case 'story_created': {
                await awardBadge(userId, 'story_author');
                break;
            }

            case 'event_created': {
                await awardBadge(userId, 'event_organizer');
                break;
            }

            case 'referral_submitted': {
                await awardBadge(userId, 'job_helper');
                break;
            }

            case 'thread_created': {
                // Count forum threads authored by this user
                const count = await Forum.countDocuments({ author: userId });
                if (count >= BADGES.active_contributor.threshold) {
                    await awardBadge(userId, 'active_contributor');
                }
                break;
            }

            default:
                break;
        }
    } catch (err) {
        console.error(`[Badge] checkAndAwardBadges error (${trigger}):`, err.message);
    }
};

module.exports = { checkAndAwardBadges, awardBadge };
