// Migration script: Add isParent to all members and done to all tasks if missing
const admin = require('firebase-admin');
const serviceAccount = require('../firebase-service-account.json');


if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
  // Print the project ID to verify which Firebase project is being used
  const projectId = serviceAccount.project_id || (admin.app().options.credential && admin.app().options.credential.projectId);
  console.log('Using Firebase project:', projectId);
}

const db = admin.firestore();

async function addIsParentToMembers() {
  const membersRef = db.collection('members');
  const snapshot = await membersRef.get();
  let updated = 0;
  for (const doc of snapshot.docs) {
    const data = doc.data();
    if (typeof data.isParent === 'undefined') {
      await doc.ref.update({ isParent: false });
      updated++;
    }
  }
  console.log(`Updated isParent for ${updated} member(s).`);
}

async function addDoneToTasks() {
  const tasksRef = db.collection('tasks');
  const snapshot = await tasksRef.get();
  let updated = 0;
  for (const doc of snapshot.docs) {
    const data = doc.data();
    if (typeof data.done === 'undefined') {
      await doc.ref.update({ done: false });
      updated++;
    }
  }
  console.log(`Updated done for ${updated} task(s).`);
}

async function runMigration() {
  await addIsParentToMembers();
  await addDoneToTasks();
  console.log('Migration complete.');
  process.exit(0);
}

runMigration().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
