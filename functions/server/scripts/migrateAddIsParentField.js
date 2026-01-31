// Migration script to ensure all members have the isParent field (default false if missing)
// Usage: node server/scripts/migrateAddIsParentField.js

const { db } = require('../firebaseConfig');

async function migrate() {
  const membersRef = db.collection('members');
  const snapshot = await membersRef.get();
  console.log(`Found ${snapshot.size} member documents`);

  const batchSize = 500;
  let batch = db.batch();
  let ops = 0;

  for (const doc of snapshot.docs) {
    const data = doc.data();
    if (typeof data.isParent === 'undefined') {
      batch.update(doc.ref, { isParent: false });
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
