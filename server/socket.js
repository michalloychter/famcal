let io = null;

function init(server) {
  const { Server } = require('socket.io');
  io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  });

  io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);
    socket.on('joinFamily', (familyId) => {
      socket.join(`family_${familyId}`);
    });
  });
}

function emitFamilyEveningUpdate(familyId, data) {
  if (io) {
    io.to(`family_${familyId}`).emit('familyEveningUpdated', data);
  }
}

module.exports = { init, emitFamilyEveningUpdate };
