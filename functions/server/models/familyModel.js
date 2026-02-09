const { db } = require('../firebaseConfig');

const FamilyCollection = db.collection('families');

const FamilyDetails = (doc) => {
    const data = doc.data();
    return {
        id: doc.id,
        familyName: data.familyName,
        whatsappNumber: data.whatsappNumber || null,
        email: data.email || null,
        shoppingList: data.shoppingList || [],
        loveNotes: data.loveNotes || [],
        isParent: typeof data.isParent === 'boolean' ? data.isParent : false,
    };
};

const FamilyModel = {
    async getFamilyById(familyId) {
        try {
            const docRef = FamilyCollection.doc(String(familyId));
            const doc = await docRef.get();
            if (!doc.exists) return null;
            return FamilyDetails(doc);
        } catch (error) {
            console.error("Database error in getFamilyById:", error);
            throw new Error("Failed to get family from database.");
        }
    },
    async registerFamily(family) {
        try {
            const addFamily = await FamilyCollection.add(family);
            const newFamily = await addFamily.get();
            return FamilyDetails(newFamily);
        } catch (error) {
            console.error("Database error in add family: ", error);
            throw new Error("Failed to save family to database.");
        }
    },
    async getFamilyByName(familyName) {
        try {
            const snapshot = await FamilyCollection.where('familyName', '==', familyName).get();
            if (snapshot.empty) return null;
            return FamilyDetails(snapshot.docs[0]);
        } catch (error) {
            console.error('Database error in getFamilyByName:', error);
            throw new Error('Failed to get family by name from database.');
        }
    },
    
    async addLoveNote(familyId, note) {
        try {
            const docRef = FamilyCollection.doc(String(familyId));
            const doc = await docRef.get();
            if (!doc.exists) throw new Error('Family not found');
            
            const currentNotes = doc.data().loveNotes || [];
            const newNote = {
                id: Date.now().toString(),
                message: note.message,
                date: new Date().toISOString(),
                author: note.author
            };
            
            await docRef.update({
                loveNotes: [newNote, ...currentNotes]
            });
            
            return newNote;
        } catch (error) {
            console.error('Database error in addLoveNote:', error);
            throw new Error('Failed to add love note to database.');
        }
    },
    
    async deleteLoveNote(familyId, noteId) {
        try {
            const docRef = FamilyCollection.doc(String(familyId));
            const doc = await docRef.get();
            if (!doc.exists) throw new Error('Family not found');
            
            const currentNotes = doc.data().loveNotes || [];
            const updatedNotes = currentNotes.filter(note => note.id !== noteId);
            
            await docRef.update({
                loveNotes: updatedNotes
            });
            
            return true;
        } catch (error) {
            console.error('Database error in deleteLoveNote:', error);
            throw new Error('Failed to delete love note from database.');
        }
    },
};

module.exports = FamilyModel;