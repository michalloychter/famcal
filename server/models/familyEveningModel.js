const admin = require('firebase-admin');
const db = admin.firestore();

const COLLECTION = 'familyEvenings';

// Create a new family evening
function createFamilyEvening({ familyId, date, title, tasks = [] }) {
  return db.collection(COLLECTION).add({
    familyId,
    date,
    title,
    tasks, // [{ memberName, task }]
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });
}

// Add a member task to an existing family evening
function addTaskToEvening(eveningId, memberName, task) {
  const ref = db.collection(COLLECTION).doc(eveningId);
  return ref.update({
    tasks: admin.firestore.FieldValue.arrayUnion({ memberName, task })
  });
}

// Get all family evenings for a familyId
function getFamilyEveningsByFamilyId(familyId) {
  return db.collection(COLLECTION)
    .where('familyId', '==', familyId)
    .orderBy('date', 'desc')
    .get();
}

// Delete a family evening by id
function deleteFamilyEvening(eveningId) {
  return db.collection(COLLECTION).doc(eveningId).delete();
}

module.exports = {
  createFamilyEvening,
  addTaskToEvening,
  getFamilyEveningsByFamilyId,
  deleteFamilyEvening,
};
