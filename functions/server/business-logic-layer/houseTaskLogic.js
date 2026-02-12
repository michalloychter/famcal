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
    const updated = await houseTaskModel.updateHouseTask(id, updates);
    // Emit socket event for real-time update if familyId is present
    if (updated.familyId) {
      emitFamilyEveningUpdate(updated.familyId, { type: 'houseTask', action: 'updated', task: updated });
    }
    return updated;
  },

  async deleteHouseTask(id) {
    return houseTaskModel.deleteHouseTask(id);
  }
};
