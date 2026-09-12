
const mongoose = require('mongoose');
require('dotenv').config();
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/alumni-network');
const Job = require('./models/Job');
const { esClient } = require('./config/elasticsearch');
const { getAllJobs } = require('./modules/jobs/job.service.js');
async function run() {
  try {
      console.log('ES Client available?', !!esClient);
      const filter = {
        isActive: true,
        $and: [
          {
            $or: [
              { title: { $regex: 'Amazon', $options: 'i' } },
              { company: { $regex: 'Amazon', $options: 'i' } },
              { location: { $regex: 'Amazon', $options: 'i' } }
            ]
          }
        ]
      };
      const directMatch = await Job.find(filter);
      console.log('Direct MongoDB match for Amazon:', directMatch.length);
      
      const getAllResult = await getAllJobs({ search: 'Amazon' });
      console.log('getAllJobs result for Amazon:', getAllResult.total);

      process.exit(0);
  } catch(err) {
      console.error(err);
      process.exit(1);
  }
}
run();

