const Collection = require('../models/Collection');
const CollectionMember = require('../models/CollectionMember');

class CollectionService {
  static async create(data, userId) {
    const collection = await Collection.create({ ...data, ownerId: userId, memberCount: 1 });
    await CollectionMember.create({ collectionId: collection._id, userId, role: 'owner', invitedBy: userId, status: 'accepted' });
    return collection.toObject();
  }

  static async getUserCollections(userId) {
    const memberships = await CollectionMember.find({ 
      userId, 
      $or: [{ status: 'accepted' }, { status: { $exists: false } }] 
    }).lean();
    const collectionIds = memberships.map((m) => m.collectionId);
    const collections = await Collection.find({ _id: { $in: collectionIds }, deletedAt: null }).sort({ updatedAt: -1 }).lean();
    const roleMap = new Map(memberships.map((m) => [m.collectionId.toString(), m.role]));
    return collections.map((c) => ({ ...c, _id: c._id.toString(), userRole: roleMap.get(c._id.toString()) || 'viewer' }));
  }

  static async getById(collectionId) { return Collection.findOne({ _id: collectionId, deletedAt: null }).lean(); }

  static async update(collectionId, data) {
    return Collection.findOneAndUpdate({ _id: collectionId, deletedAt: null }, { $set: data }, { new: true }).lean();
  }

  static async softDelete(collectionId) {
    await Collection.updateOne({ _id: collectionId }, { $set: { deletedAt: new Date() } });
  }

  static async addMember(collectionId, userId, role, invitedBy) {
    // Check if member already exists (pending or accepted)
    const existing = await CollectionMember.findOne({ collectionId, userId });
    if (existing) throw new Error('User is already invited or a member of this collection');
    
    await CollectionMember.create({ collectionId, userId, role, invitedBy, status: 'pending' });
    // Do not increment memberCount until accepted
  }

  static async removeMember(collectionId, userId) {
    const member = await CollectionMember.findOne({ collectionId, userId });
    if (!member) return;
    await CollectionMember.deleteOne({ collectionId, userId });
    if (member.status === 'accepted' || !member.status) {
      await Collection.updateOne({ _id: collectionId }, { $inc: { memberCount: -1 } });
    }
  }

  static async updateMemberRole(collectionId, userId, role) {
    await CollectionMember.updateOne({ collectionId, userId }, { $set: { role } });
  }

  static async getMembers(collectionId) {
    return CollectionMember.find({ collectionId }).populate('userId', 'email displayName avatarUrl').lean();
  }

  static async getPendingInvitations(userId) {
    const invites = await CollectionMember.find({ userId, status: 'pending' })
      .populate('collectionId', 'name description icon color')
      .populate('invitedBy', 'displayName email')
      .lean();
    
    // Filter out orphaned invites if collection was deleted
    return invites.filter(i => i.collectionId).map(i => ({
      ...i,
      collection: i.collectionId,
      inviter: i.invitedBy,
      collectionId: i.collectionId._id
    }));
  }

  static async acceptInvitation(collectionId, userId) {
    const member = await CollectionMember.findOne({ collectionId, userId, status: 'pending' });
    if (!member) throw new Error('Invitation not found or already processed');
    
    await CollectionMember.updateOne({ _id: member._id }, { $set: { status: 'accepted', joinedAt: new Date() } });
    await Collection.updateOne({ _id: collectionId }, { $inc: { memberCount: 1 } });
  }

  static async rejectInvitation(collectionId, userId) {
    await CollectionMember.deleteOne({ collectionId, userId, status: 'pending' });
  }
}

module.exports = { CollectionService };
