const houseTaskModel = require('../models/houseTaskModel');
const { emitFamilyEveningUpdate } = require('../socket');

module.exports = {
  async createHouseTask(task) {
    // Add validation as needed
    const created = await houseTaskModel.createHouseTask(task);
    if (task.familyId) {
      emitFamilyEveningUpdate(task.familyId, { type: 'houseTask', action: 'created', task: created });
    }
    return created;
  },

  async getHouseTasksByFamily(familyId) {
    return houseTaskModel.getHouseTasksByFamily(familyId);
  },

  async updateHouseTask(id, updates) {
    return houseTaskModel.updateHouseTask(id, updates);
  },

  async deleteHouseTask(id) {
    return houseTaskModel.deleteHouseTask(id);
  }
};
