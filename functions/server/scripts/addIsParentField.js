/**
 * Migration script to add isParent field to all existing members
 * Run this once with: node server/scripts/addIsParentField.js
 */

const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin
const serviceAccount = require(path.join(__dirname, '../firebase-service-account.json'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function addIsParentField() {
  try {
    console.log('Starting migration: Adding isParent field to all members...');
    
    const membersRef = db.collection('members');
    const snapshot = await membersRef.get();
    
    if (snapshot.empty) {
      console.log('No members found in the database.');
      return;
    }
    
    const batch = db.batch();
    let updateCount = 0;
    
    snapshot.forEach((doc) => {
      const data = doc.data();
      
      // Only update if isParent field doesn't exist
      if (data.isParent === undefined) {
        batch.update(doc.ref, { isParent: false });
        updateCount++;
        console.log(`Updating member: ${data.name} (${data.email})`);
      }
    });
    
    if (updateCount > 0) {
      await batch.commit();
      console.log(`✅ Successfully updated ${updateCount} members with isParent: false`);
    } else {
      console.log('✅ All members already have the isParent field.');
    }
    
    // Display summary
    console.log('\n📊 Summary:');
    console.log(`Total members: ${snapshot.size}`);
    console.log(`Updated members: ${updateCount}`);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    process.exit();
  }
}

// Run the migration
addIsParentField();
