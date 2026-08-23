
require('dotenv').config();
const mongoose = require('mongoose');
require('./models/College');
const User = require('./models/User');
const { escapeRegex } = require('./shared/utils/escapeRegex');

mongoose.connect(process.env.MONGO_URI).then(async () => {
    const student = await User.findOne({ role: 'student' }).populate('college');
    console.log('Student college:', student && student.college ? student.college.name : 'NONE');

    const searches = ['amazon', 'akshitha', 'rishika', 'sde'];
    for (const search of searches) {
        const filter = {
            _id: { \\\: student._id },
            role: 'alumni',
            verificationStatus: 'Verified',
            isSuspended: false,
        };
        if (student.college) filter.college = student.college._id;

        const terms = search.trim().split(/\s+/).map(escapeRegex);
        filter[\\\] = terms.map(term => ({
            \\\: [
                { name: { \\\: term, \\\: 'i' } },
                { company: { \\\: term, \\\: 'i' } },
                { designation: { \\\: term, \\\: 'i' } },
                { industry: { \\\: term, \\\: 'i' } },
                { skills: { \\\: term, \\\: 'i' } }
            ]
        }));
        const results = await User.find(filter).select('name company designation');
        console.log(search + ' ->', results.length, results.map(r => r.name + '/' + r.company + '/' + r.designation));
    }
    process.exit(0);
}).catch(e => { console.error(e); process.exit(1); });

