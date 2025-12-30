const TaskModel = require('../models/taskModel'); 

const taskLogic = {
    async getTasksForUser(userId) {
        if (!userId) {
            throw new Error('User ID is required for task logic.');
        }
        // Call the DAL to get the data
        return await TaskModel.findAllTasksForUser(userId);
    },

    async handleIncomingTaskCreation(taskData, userId) {
        console.log("taskData",taskData);
        
        // Validation and Date Conversion logic
        if (!taskData.title) throw new Error('Title is required.');
        // Ensure there's a user identifier. Frontend sends 'userID' on the payload;
        // if the optional userId param was provided (via query) and payload doesn't
        // include it, set it.
        if (!taskData.userID && userId) {
            taskData.userID = String(userId);
        }

        // Normalize date fields: allow ISO strings, JS Date, or Firestore Timestamp later
        if (typeof taskData.date === 'string') { taskData.date = new Date(taskData.date); }
        if (typeof taskData.end === 'string' && taskData.end) { taskData.end = new Date(taskData.end); }

        // Call the DAL to save it
        return await TaskModel.addTask(taskData);
    },
    async handleDeleteTask(taskId){
        return await TaskModel.deleteTask(taskId)
    },
    async handleEditTask(taskId,updateTask){
        return await TaskModel.editTask(taskId,updateTask)
    }
};

module.exports = taskLogic;