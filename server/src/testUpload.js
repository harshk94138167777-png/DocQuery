const fs = require('fs');
const mongoose = require('mongoose');
const { connectDatabase, disconnectDatabase } = require('./config/database');
const { getRedis } = require('./config/redis');
const User = require('./models/User');
const Collection = require('./models/Collection');
const { DocumentService } = require('./services/document.service');
const { Queue } = require('bullmq');

const testUpload = async () => {
  try {
    await connectDatabase();
    const redis = getRedis();
    const documentQueue = new Queue('document-processing', { connection: redis });

    const user = await User.findOne({});
    let collection = await Collection.findOne({ ownerId: user._id });
    if (!collection) {
      collection = await Collection.create({ name: 'Test', ownerId: user._id, members: [{ userId: user._id, role: 'owner' }] });
    }
    
    fs.writeFileSync('test.txt', 'Hello world');
    const file = {
      path: 'test.txt',
      mimetype: 'text/plain',
      originalname: 'test.txt',
      size: 11
    };

    const doc = await DocumentService.create(file, collection._id, user._id, []);
    console.log('Doc created:', doc._id);

    await documentQueue.add('process', {
      documentId: doc._id,
      collectionId: collection._id,
      filePath: file.path,
      fileType: doc.fileType
    });
    console.log('Job added');
    
  } catch (error) {
    console.error('Test error:', error);
  } finally {
    fs.unlinkSync('test.txt');
    await disconnectDatabase();
    process.exit();
  }
};

testUpload();
