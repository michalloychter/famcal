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
        isParent: typeof data.isParent === 'boolean' ? data.isParent : false,
        // Add any other family-level fields here
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
};

module.exports = FamilyModel;