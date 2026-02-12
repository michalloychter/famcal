// src/app/core/socket.service.ts
import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class SocketService {
  onMessagesUpdate(callback: (msgs: any[]) => void) {
    this.socket.on('messagesUpdated', callback);
  }
  private socket: Socket;

  constructor() {
    this.socket = io(environment.apiUrl, {
      transports: ['websocket'],
      autoConnect: false
    });
  }

  connect(familyId: string) {
    if (!this.socket.connected) {
      this.socket.connect();
      this.socket.emit('joinFamily', familyId);
    }
  }

  onHouseTasksUpdate(callback: (data: any) => void) {
    this.socket.on('houseTasksUpdated', callback);
  }

  disconnect() {
    if (this.socket.connected) {
      this.socket.disconnect();
    }
  }
}
