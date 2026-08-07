const { Client } = require('@elastic/elasticsearch');

const ELASTICSEARCH_NODE = process.env.ELASTICSEARCH_NODE || 'http://localhost:9200';

let esClient = null;

try {
    esClient = new Client({
        node: ELASTICSEARCH_NODE,
        maxRetries: process.env.NODE_ENV === 'test' ? 0 : 5,
        requestTimeout: process.env.NODE_ENV === 'test' ? 1000 : 60000,
    });
} catch (error) {
    console.error('Failed to initialize Elasticsearch client', error);
}

/**
 * Ensures the required indices exist.
 */
const initElasticsearch = async () => {
    if (!esClient) return;
    try {
        const jobsIndexExists = await esClient.indices.exists({ index: 'jobs' });
        if (!jobsIndexExists) {
            await esClient.indices.create({
                index: 'jobs',
                body: {
                    mappings: {
                        properties: {
                            title: { type: 'text' },
                            company: { type: 'text' },
                            description: { type: 'text' },
                            location: { type: 'keyword' },
                            jobType: { type: 'keyword' },
                            skills: { type: 'keyword' },
                            isActive: { type: 'boolean' }
                        }
                    }
                }
            });
            console.log('✅ Created "jobs" index in Elasticsearch');
        }

        const usersIndexExists = await esClient.indices.exists({ index: 'users' });
        if (!usersIndexExists) {
            await esClient.indices.create({
                index: 'users',
                body: {
                    mappings: {
                        properties: {
                            name: { type: 'text' },
                            company: { type: 'text' },
                            designation: { type: 'text' },
                            industry: { type: 'keyword' },
                            skills: { type: 'keyword' },
                            role: { type: 'keyword' }
                        }
                    }
                }
            });
            console.log('✅ Created "users" index in Elasticsearch');
        }
    } catch (error) {
        console.error('⚠️ Elasticsearch initialization failed. Is it running?', error.message);
        esClient = null; // Disable ES if it's down
    }
};

module.exports = {
    esClient,
    initElasticsearch
};
