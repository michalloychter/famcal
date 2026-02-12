const admin = require('firebase-admin');

async function addMessage(msg) {
  const ref = admin.firestore().collection('messages');
  const doc = await ref.add({
    memberName: msg.memberName,
    familyId: msg.familyId,
    date: msg.date,
    text: msg.text
  });
  return { id: doc.id, ...msg };
}

async function getMessagesByFamily(familyId) {
  const ref = admin.firestore().collection('messages');
  const snap = await ref.where('familyId', '==', familyId).orderBy('date').get();
  return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

module.exports = { addMessage, getMessagesByFamily };
