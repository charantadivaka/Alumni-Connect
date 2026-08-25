const mongoose = require('mongoose');
require('dotenv').config();

const Job = require('./models/Job');

mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/alumni_network', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(async () => {
  console.log('Connected to DB');
  
  // Find all jobs where status is missing
  const jobs = await Job.find({ status: { $exists: false } });
  console.log(`Found ${jobs.length} jobs to migrate.`);

  for (let job of jobs) {
    job.status = job.isActive === false ? 'Closed' : 'Active';
    await job.save(); // This will also trigger Elasticsearch sync hook!
  }

  // Double check if there are jobs that have isActive but we still want to migrate them just in case
  const allJobs = await Job.find({});
  let migrated = 0;
  for (let job of allJobs) {
    if (!job.status) {
      job.status = job.isActive === false ? 'Closed' : 'Active';
      await job.save();
      migrated++;
    }
  }

  console.log(`Migration complete. Updated ${migrated} extra jobs.`);
  process.exit(0);
}).catch(err => {
  console.error(err);
  process.exit(1);
});
