const { db } = require('../firebaseConfig'); 

const TaskCollection = db.collection('tasks');

/**
 * Helper function to format a raw Firestore document snapshot into a clean object.
 * This is the correct implementation for your Node.js backend.
 * @param {object} doc - The raw Firestore document snapshot
 * @returns {object} The formatted task object
 */
const TaskFromDoc = (doc) => {
    const data = doc.data();
    // For 'class' tasks, return weekday and time instead of date
    if (data.type === 'class') {
        return {
            id: doc.id,
            title: data.title,
            details: data.details,
            email: data.email || null,
            memberName: data.memberName,
            type: data.type,
            weekday: data.weekday, // 0-6 (Sun-Sat)
            time: data.time,       // 'HH:mm'
            end: null,
                done: typeof data.done === 'boolean' ? data.done : false,
        };
    }
    return {
        id: doc.id,
        title: data.title,
        details: data.details,
        email: data.email || null,
        memberName: data.memberName,
        date: data.date ? (data.date.toDate ? data.date.toDate() : data.date) : null,
        end: data.end ? (data.end.toDate ? data.end.toDate() : data.end) : null,
        type: data.type,
            done: typeof data.done === 'boolean' ? data.done : false,
    };
};

const TaskModel = { 
async findAllTasksForEmail(email) {
    try {
        const snapshot = await TaskCollection.where('email', '==', String(email)).get();
        return snapshot.docs.map(TaskFromDoc);
    } catch (error) {
        console.error("Database error in getTask:", error);
        throw new Error("Failed to get task from database.");
    }
},
async findAllTasksForFamilyId(familyId) {
    try {
        const snapshot = await TaskCollection.where('familyId', '==', String(familyId)).get();
        return snapshot.docs.map(TaskFromDoc);
    } catch (error) {
        console.error("Database error in getTasks by familyId:", error);
        throw new Error("Failed to get tasks by familyId from database.");
    }
},
async  addTask(taskData){
    try{
        // If this is a 'class' task, only save weekday and time
        if (taskData.type === 'class') {
            // Expect frontend to send weekday (0-6) and time ('HH:mm')
            const { title, details, email, memberName, type, weekday, time } = taskData;
            const docRef = await TaskCollection.add({
                title,
                details,
                email,
                memberName,
                type,
                weekday,
                time
            });
            const docSnap = await docRef.get();
            return TaskFromDoc(docSnap);
        } else {
            // Normal task with date
            const docRef = await TaskCollection.add(taskData);
            const docSnap = await docRef.get();
            return TaskFromDoc(docSnap);
        }
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