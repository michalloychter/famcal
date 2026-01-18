const FamilyModel = require('../models/familyModel');

async function getShoppingList(familyId) {
    console.log('getShoppingList called with familyId:', familyId);
    
  const family = await FamilyModel.getFamilyById(familyId);
  if (!family) throw new Error('Family not found');
  return family.shoppingList || [];
}

async function updateShoppingList(familyId, shoppingList) {
  const { db } = require('../firebaseConfig');
  const FamilyCollection = db.collection('families');
  const docRef = FamilyCollection.doc(String(familyId));
  await docRef.update({ shoppingList });
  return shoppingList;
}

module.exports = {
  getShoppingList,
  updateShoppingList,
};
