
// Ensure Firebase is initialized
require('../firebaseConfig');
const admin = require('firebase-admin');
const db = admin.firestore();

const HOUSE_TASKS_COLLECTION = 'houseTasks';

module.exports = {
  async createHouseTask(task) {
    const docRef = await db.collection(HOUSE_TASKS_COLLECTION).add(task);
    return { id: docRef.id, ...task };
  },

  async getHouseTasksByFamily(familyId) {
    const snapshot = await db.collection(HOUSE_TASKS_COLLECTION)
      .where('familyId', '==', familyId)
      .get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },

  async updateHouseTask(id, updates) {
    await db.collection(HOUSE_TASKS_COLLECTION).doc(id).update(updates);
    return { id, ...updates };
  },

  async deleteHouseTask(id) {
    await db.collection(HOUSE_TASKS_COLLECTION).doc(id).delete();
    return { id };
  }
};
