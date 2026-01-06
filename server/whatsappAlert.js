// server/whatsappAlert.js
// Script to send WhatsApp alerts for tasks due tomorrow using Twilio
require('dotenv').config();
const { db } = require('./firebaseConfig');
const UserModel = require('./models/userModel');
const TaskModel = require('./models/taskModel');
const twilio = require('twilio');

// TODO: Replace with your Twilio Account SID, Auth Token, and WhatsApp number
const accountSid = process.env.TWILIO_ACCOUNT_SID || 'YOUR_TWILIO_ACCOUNT_SID';
const authToken = process.env.TWILIO_AUTH_TOKEN || 'YOUR_TWILIO_AUTH_TOKEN';
const whatsappFrom = process.env.TWILIO_WHATSAPP_FROM || 'whatsapp:+YOUR_TWILIO_NUMBER';

const client = twilio(accountSid, authToken);

async function sendWhatsAppAlert(to, message) {
  try {
    await client.messages.create({
      from: whatsappFrom,
      to: `whatsapp:${to}`,
      body: message,
    });
    console.log(`WhatsApp alert sent to ${to}`);
  } catch (err) {
    console.error(`Failed to send WhatsApp to ${to}:`, err.message);
  }
}


// Checks if the given reminderDateTime is within the current minute
function isNow(reminderDateTime) {
  if (!reminderDateTime) return false;
  const now = new Date();
  const reminder = reminderDateTime.toDate ? reminderDateTime.toDate() : new Date(reminderDateTime);
  const match = (
    now.getFullYear() === reminder.getFullYear() &&
    now.getMonth() === reminder.getMonth() &&
    now.getDate() === reminder.getDate() &&
    now.getHours() === reminder.getHours() &&
    now.getMinutes() === reminder.getMinutes()
  );
  console.log(`[DEBUG] Checking reminder: now=${now.toISOString()}, reminder=${reminder.toISOString()}, match=${match}`);
  return match;
}

async function alertTasksDueNow() {
  // Get all users
  const usersSnapshot = await db.collection('users').get();
  const users = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  for (const user of users) {
    if (!user.whatsappNumber) continue;
    // Get all tasks for this user
    const tasksSnapshot = await db.collection('tasks').where('userID', '==', user.id).get();
    const tasks = tasksSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    for (const task of tasks) {
      if (!task.reminderDateTime) {
        console.log(`[DEBUG] Skipping task ${task.title}: no reminderDateTime`);
        continue;
      }
      const reminderDateTime = task.reminderDateTime.toDate ? task.reminderDateTime.toDate() : new Date(task.reminderDateTime);
      if (isNow(reminderDateTime)) {
        console.log(`[DEBUG] Sending WhatsApp reminder for task: ${task.title} to ${user.whatsappNumber}`);
        const msg = `Reminder: You have a task now!\nTitle: ${task.title}\nDetails: ${task.details || ''}`;
        await sendWhatsAppAlert(user.whatsappNumber, msg);
      } else {
        console.log(`[DEBUG] Not time for task: ${task.title} (reminderDateTime=${reminderDateTime.toISOString()})`);
      }
    }
  }
}

if (require.main === module) {
  alertTasksDueNow().then(() => {
    console.log('WhatsApp alerts processed.');
    process.exit(0);
  }).catch(err => {
    console.error('Error sending WhatsApp alerts:', err);
    process.exit(1);
  });
}
