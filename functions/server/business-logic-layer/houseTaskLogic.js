const houseTaskModel = require('../models/houseTaskModel');

module.exports = {
  async createHouseTask(task) {
    // Add validation as needed
    return houseTaskModel.createHouseTask(task);
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
