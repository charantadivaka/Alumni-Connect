const { esClient } = require('../../config/elasticsearch');

const syncToElasticsearch = async (index, id, body) => {
    if (!esClient) return;
    try {
        await esClient.index({
            index,
            id: id.toString(),
            document: body,
        });
    } catch (err) {
        console.error(`[Elasticsearch] Failed to index ${index} document ${id}:`, err.message);
    }
};

const removeFromElasticsearch = async (index, id) => {
    if (!esClient) return;
    try {
        await esClient.delete({
            index,
            id: id.toString(),
        });
    } catch (err) {
        if (err.meta?.statusCode !== 404) {
            console.error(`[Elasticsearch] Failed to delete ${index} document ${id}:`, err.message);
        }
    }
};

module.exports = {
    syncToElasticsearch,
    removeFromElasticsearch,
};
