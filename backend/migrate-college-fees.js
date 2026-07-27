/**
 * migrate-college-fees.js
 * ──────────────────────────────────────────────────────────────────────────────
 * One-time migration: marks all existing colleges as having paid the ₹50,000
 * platform fee (assumed to have paid as founding colleges).
 *
 * Run once from the backend directory:
 *   node migrate-college-fees.js
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const College = require('./models/College');

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB');

        const feePaidUntil = new Date();
        feePaidUntil.setFullYear(feePaidUntil.getFullYear() + 1);

        const result = await College.updateMany(
            { feesPaid: { $ne: true } },
            {
                $set: {
                    feesPaid: true,
                    feePaidUntil,
                    razorpayOrderId: 'LEGACY_FOUNDING_COLLEGE',
                    razorpayPaymentId: 'LEGACY_FOUNDING_COLLEGE',
                },
            }
        );

        console.log(`\n🎓 Migration complete!`);
        console.log(`   Colleges updated: ${result.modifiedCount}`);
        console.log(`   Fee paid until:   ${feePaidUntil.toLocaleDateString('en-IN')}`);
        console.log('\n   These colleges are now marked as active founding members.\n');
    } catch (err) {
        console.error('❌ Migration failed:', err.message);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Disconnected from MongoDB');
    }
};

run();
