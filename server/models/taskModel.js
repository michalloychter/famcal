const { db } = require('../firebaseConfig'); 

const TaskCollection = db.collection('tasks');

/**
 * Helper function to format a raw Firestore document snapshot into a clean object.
 * This is the correct implementation for your Node.js backend.
 * @param {object} doc - The raw Firestore document snapshot
 * @returns {object} The formatted task object
 */
const TasksForUser = (doc) => {
    const data = doc.data();
   
    return {
        id: doc.id,
        title: data.title,
        details: data.details,
        // Use 'userID' to match client payload (frontend uses 'userID')
        userID: data.userID || data.userId || null,
        memberName: data.memberName,
        // Support both Firestore Timestamp (has toDate) and JS Date
        date: data.date ? (data.date.toDate ? data.date.toDate() : data.date) : null,
        end: data.end ? (data.end.toDate ? data.end.toDate() : data.end) : null,
    };
};

const TaskModel = { 
async findAllTasksForUser(userId) {
    try{
        const snapshot = await TaskCollection.where('userID', '==', String(userId)).get();
        return snapshot.docs.map(TasksForUser);
}
catch(error){
      console.error("Database error in getTask:", error);
            // Re-throw the error so the BLL/Controller can handle it
            throw new Error("Failed to get task from database."); 
}
},
async  addTask(taskData){
    try{
        // Add the task and then fetch the created document snapshot to return a formatted object
        const docRef = await TaskCollection.add(taskData);
        const docSnap = await docRef.get();
        return TasksForUser(docSnap);
    }
    catch(error){
 console.error("Database error in addTask:", error);
            // Re-throw the error so the BLL/Controller can handle it
            throw new Error("Failed to add task to database."); 
    }
},
async deleteTask(taskId){
    try{
     const taskPointer= TaskCollection.doc(taskId);
     const deleteTask=await taskPointer.delete();
    return deleteTask
    }

     catch(error){
 console.error("Database error in delete Task:", error);
            // Re-throw the error so the BLL/Controller can handle it
            throw new Error("Failed to delete task to database."); 
    }
},
async editTask(taskId, updateTask){
    try{
     const taskPointer= TaskCollection.doc(taskId);
    // Firestore uses 'update' to modify fields on a document
    const editTask = await taskPointer.update(updateTask);
    return editTask;
    }

     catch(error){
 console.error("Database error in editTask:", error);
            // Re-throw the error so the BLL/Controller can handle it
            throw new Error("Failed to edit task to database."); 
    }
}
};

module.exports = TaskModel;