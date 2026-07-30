const cloudinaryLib = require('cloudinary').v2;
const { cloudinary: cloudinaryConfig } = require('../shared/config');

cloudinaryLib.config({
    cloud_name: cloudinaryConfig.cloudName,
    api_key:    cloudinaryConfig.apiKey,
    api_secret: cloudinaryConfig.apiSecret,
});

module.exports = cloudinaryLib;
