// Simple migration script to add optional fields to existing user documents in Firestore
// Usage: node server/scripts/migrateAddUserFields.js

const { db } = require('../firebaseConfig');

async function migrate() {
  const usersRef = db.collection('users');
  const snapshot = await usersRef.get();
  console.log(`Found ${snapshot.size} user documents`);

  const batchSize = 500;
  let batch = db.batch();
  let ops = 0;

  for (const doc of snapshot.docs) {
    const data = doc.data();
    const updates = {};
    // Only set fields if they don't already exist
    if (typeof data.bankName === 'undefined') updates.bankName = null;
    if (typeof data.bankUrl === 'undefined') updates.bankUrl = null;
    if (typeof data.healthFundName === 'undefined') updates.healthFundName = null;
    if (typeof data.healthFundUrl === 'undefined') updates.healthFundUrl = null;
    if (typeof data.superName === 'undefined') updates.superName = null;
    if (typeof data.superUrl === 'undefined') updates.superUrl = null;

    if (Object.keys(updates).length > 0) {
      batch.update(doc.ref, updates);
      ops++;
    }

    if (ops >= batchSize) {
      await batch.commit();
      console.log(`Committed ${ops} updates`);
      batch = db.batch();
      ops = 0;
    }
  }

  if (ops > 0) {
    await batch.commit();
    console.log(`Committed final ${ops} updates`);
  }

  console.log('Migration finished');
}

migrate().catch(err => {
  console.error('Migration error:', err);
  process.exit(1);
});
