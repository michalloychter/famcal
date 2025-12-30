const {db}= require ('../firebaseConfig');
const memberCollection= db.collection('members');
 
const MemberModel={
async userMembers(userId){
    try{
      console.log("userId",userId);
      
      const membersById=  await memberCollection.where("userID","==",String(userId)).get();
      console.log("membersByIdnn",membersById);
      
      const userMembersList=  membersById.docs.map(doc=>{
        const data=doc.data();
        // Use the document ID as the stable memberId and normalize userID casing
        const memberId = doc.id;
        const userID = data.userID || data.userId || null;
        console.log("member data", { memberId, ...data });
        // Return both 'id' and 'memberId' for compatibility with frontend expectations
        return { id: memberId, memberName: data.memberName, memberId: memberId, userID };
      });
      return  userMembersList
    }
    catch(error){
       console.error("Database error in getMember:", error);
            // Re-throw the error so the BLL/Controller can handle it
            throw new Error("Failed to get members from database.");
    }
},
async addMembers(memberNames,newUserId){
    try {
         const batch = db.batch();

    for (const memberName of memberNames) {
      const memberDocRef = memberCollection.doc(); // Auto-generate ID for member
      batch.set(memberDocRef, {
        memberName: memberName,
        // Persist the owner user id under the consistent 'userID' field name
        userID: String(newUserId)
      });
    }
        await batch.commit(); // Commit all member writes at once
        return { success: true, message: `Added ${memberNames.length} members.` };
    }
    catch(error){
  console.error("Database error in add Member:", error);
            // Re-throw the error so the BLL/Controller can handle it
            throw new Error("Failed to add members from database.");
    }
}

}
module.exports =MemberModel;