const express = require('express');
const router = express.Router();
const taskLogic = require('../business-logic-layer/taskLogic');;


// 1. GET all tasks
router.get('/tasks', async (req, res) => {
  try {
    const userId = req.query.userId; // Assuming you pass this via query params

    const tasks = await taskLogic.getTasksForUser(userId); // Call the BLL
    res.json(tasks); // Send the response
  } catch (error) {
    console.error("Error fetching tasks:", error);
    res.status(500).send('Error fetching tasks from Firestore: ' + error.message);
  }
});

// 2. POST a New Task (CREATE)
router.post('/tasks', async (req, res) => {
    try {
        const newTaskData = req.body; 
        const taskId = req.query.taskId; // Example of getting user ID
console.log("taskrId",taskId);

        const newTask = await taskLogic.handleIncomingTaskCreation(newTaskData, taskId);
        res.status(201).json(newTask);

    } catch (error) {
        console.error("Error adding task:", error);
        res.status(500).send('Error adding new task to Firestore: ' + error.message);
    }
});

router.delete('/tasks/:taskId',async (req,res)=>{
  try{
const taskId = req.params.taskId; 
const deleteTask=await taskLogic.handleDeleteTask(taskId);
res.status(201).json(deleteTask);
  }
  catch(error){
 console.error("Error delete task:", error);
        res.status(500).send('Error delete task to Firestore: ' + error.message);
  }
})
router.put('/tasks/:taskId' , async (req,res)=>{
  try{
const taskId=req.params.taskId;
const updateTask= req.body;
const editTask= await taskLogic.handleEditTask(taskId,updateTask);
res.status(201).json(editTask);
  }
   catch(error){
 console.error("Error edit task:", error);
        res.status(500).send('Error edit task to Firestore: ' + error.message);
  }
})

module.exports = router;