const { db } = require('../firebaseConfig'); 

const UserCollection = db.collection('users');

const UserDetails = (doc) => {
    const data = doc.data();
   
    return {
        id: doc.id,
        firstName: data.firstName,
        lastName: data.lastName,
        userName: data.userName,
        // Optional contact/info fields
        bankName: data.bankName || null,
        bankUrl: data.bankUrl || null,
        healthFundName: data.healthFundName || null,
        healthFundUrl: data.healthFundUrl || null,
        superName: data.superName || null,
        superUrl: data.superUrl || null,
    
    };
};
const UserModel = { 
    async getUserDetailsById(userId){
        try{
         const snapshot= await UserCollection.where("userId","==",String(userId)).get();
         return snapshot.docs.map(UserDetails)
        }
        catch(error){
            console.error("Database error in getUser:", error);
            throw new Error("Failed to get user to database."); 
        }
    },
    async getUserByName(user){
        try{
        const snapshot= await UserCollection.where("userName","==",String(user.userName)).limit(1).get();
        if(snapshot.empty)
        return null
        const userByName= snapshot.docs[0]
        return UserDetails(userByName);}
   catch(error){
        console.error("Database error in getUser:", error);
        throw new Error("Failed to get user to database."); 
        }
   },
    async ValidUserName (user) {
        try{
        const snapshot= await UserCollection.where("userName","==", String(user.userName))
        .limit(1).get();
        return !snapshot.empty;}
        catch(error){
            console.error("Database error in getUser:", error);
            // Re-throw the error so the BLL/Controller can handle it
            throw new Error("Failed to get user from database."); 
        }
    },
    async registerUser (user) {
      try{
        const addUser=await UserCollection.add(user);
        const newUser= await addUser.get();
        return UserDetails(newUser);
      }
      catch(error){
        console.error("Database error in add user: ", error)
        throw new Error("Failed to save user to database.")
      }
    },
    async getUserById(id){
        try{
            const docRef = UserCollection.doc(String(id));
            const doc = await docRef.get();
            if(!doc.exists) return null;
            return UserDetails(doc);
        }
        catch(error){
            console.error("Database error in getUserById:", error);
            throw new Error("Failed to get user from database.");
        }
    },
    async editUser (id,updates){
        try {
        const findUser= UserCollection.doc(id)
        await findUser.update(updates);
        const updateUser= await findUser.get()
        return UserDetails(updateUser)
        }
        catch(error){
             console.error("Database error in edit user: ", error)
        throw new Error("Failed to save user to database.")
        }
    },
    async deleteUser(user,id){
        try{
        const findUser= UserCollection.doc(id);
        await findUser.delete();
        return
    }
        catch(error){
            console.error("Database error in delete user: ", error)
        throw new Error("Failed to delete user to database.")
        }
    }


}
  

module.exports = UserModel;