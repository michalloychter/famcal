// server/scheduleWhatsAppAlerts.js
// Schedules the WhatsApp alert script to run every minute
const cron = require('node-cron');
const { exec } = require('child_process');


cron.schedule('* * * * *', () => {
  console.log('Running WhatsApp alert job...');
  exec('node whatsappAlert.js', { cwd: __dirname, env: process.env }, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error running WhatsApp alert script: ${error.message}`);
      return;
    }
    if (stderr) {
      console.error(`stderr: ${stderr}`);
    }
    console.log(`stdout: ${stdout}`);
  });
});

console.log('WhatsApp alert scheduler started (every minute).');
