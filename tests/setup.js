const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

// Ensure required env vars are available during tests
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-for-jest-runs';
process.env.NODE_ENV = process.env.NODE_ENV || 'test';

let mongoServer;

beforeAll(async () => {
  // Use in-memory DB for tests
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  
  // Override environment variable so connectDB() or tests use this URI
  process.env.MONGO_URI = uri;

  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  await mongoose.connect(uri);
});

afterAll(async () => {
  await mongoose.disconnect();
  if (mongoServer) {
    await mongoServer.stop();
  }
});

afterEach(async () => {
  // Clear all collections after each test to ensure test isolation
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});
