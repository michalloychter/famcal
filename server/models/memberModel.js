const {db}= require ('../firebaseConfig');
const memberCollection = db.collection('members');

const MemberModel = {
  // Get all members by familyName
  async getMembersByFamilyName(familyName) {
    try {
      const snapshot = await memberCollection.where('familyName', '==', familyName).get();
      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data
        };
      });
    } catch (error) {
      console.error('Database error in getMembersByFamilyName:', error);
      throw new Error('Failed to get members by familyName.');
    }
  },
  // Find members by email and username for login
  async findMembersByEmailAndUsername(email, username) {
    try {
      const snapshot = await memberCollection
        .where('email', '==', email)
        .where('username', '==', username)
        .get();
      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data
        };
      });
    } catch (error) {
      console.error('Database error in findMembersByEmailAndUsername:', error);
      throw new Error('Failed to find member for login.');
    }
  },
  async getMembersByFamilyId(familyId) {
    try {
      console.log('familyId', familyId);
      const membersByFamily = await memberCollection.where('familyId', '==', String(familyId)).get();
      console.log('membersByFamily QuerySnapshot', membersByFamily);
      const membersList = membersByFamily.docs.map(doc => {
        const data = doc.data();
        const memberId = doc.id;
        return {
          id: memberId,
          name: data.name || '',
          username: data.username || '',
          whatsappNumber: data.whatsappNumber || '',
          email: data.email || '',
          familyId: data.familyId || null
        };
      });
      return membersList;
    } catch (error) {
      console.error('Database error in getMembersByFamilyId:', error);
      throw new Error('Failed to get members from database.');
    }
  },
  async addMembers(members, familyId) {
    try {
      const batch = db.batch();
      for (const member of members) {
        if (!member.name || !member.username || !member.email) {
          throw new Error('Each member must have name, username, and email');
        }
        const memberDocRef = memberCollection.doc();
        batch.set(memberDocRef, {
          name: member.name,
          username: member.username,
          whatsappNumber: member.whatsappNumber || '',
          email: member.email,
          familyId: String(familyId),
          familyName: member.familyName || ''
        });
      }
      await batch.commit();
      return { success: true, message: `Added ${members.length} members.` };
    } catch (error) {
      console.error('Database error in addMembers:', error);
      throw new Error('Failed to add members to database.');
    }
  }
};

module.exports = MemberModel;