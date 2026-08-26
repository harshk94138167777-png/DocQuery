const authSchemas = require('./auth.schema');
const collectionSchemas = require('./collection.schema');
const documentSchemas = require('./document.schema');
const messageSchemas = require('./message.schema');

module.exports = {
  ...authSchemas,
  ...collectionSchemas,
  ...documentSchemas,
  ...messageSchemas,
};
