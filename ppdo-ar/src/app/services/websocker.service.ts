// src/app/services/websocket.service.ts

import { Injectable } from '@angular/core';
import { Client, IMessage } from '@stomp/stompjs';
import { Subject } from 'rxjs';
import { Comment } from '../models/project.model'; // Ensure path is correct
import SockJS from 'sockjs-client';

@Injectable({
  providedIn: 'root'
})
export class WebsocketService {
  private client: Client;
  private commentSubject = new Subject<Comment>();
  public comment$ = this.commentSubject.asObservable();

  constructor() {
    this.client = new Client();

    // Configure the client to use SockJS
    this.client.webSocketFactory = () => {
      // Use "as any" to bypass the TypeScript type-checking issue
      return new SockJS('http://192.168.139.39:8080/ws') as any; // <-- ✅  APPLY THE FIX HERE
    };

    // --- The rest of your configuration remains the same ---
    this.client.reconnectDelay = 5000;
    this.client.heartbeatIncoming = 4000;
    this.client.heartbeatOutgoing = 4000;

    this.client.onConnect = (frame) => {
      console.log('STOMP: Connected to WebSocket via SockJS: ' + frame);
    };

    this.client.onStompError = (frame) => {
      console.error('STOMP: Broker reported error: ' + frame.headers['message']);
      console.error('STOMP: Additional details: ' + frame.body);
    };
  }

  /**
   * Connects and subscribes to the project-specific comment topic.
   */
  connect(projectId: string): void {
    if (!this.client.active) {
      this.client.onConnect = (frame) => {
        console.log('STOMP: Connected and subscribing to comments for project: ' + projectId);
        this.client.subscribe(`/topic/comments/${projectId}`, (message: IMessage) => {
          const newComment = JSON.parse(message.body) as Comment;
          this.commentSubject.next(newComment);
        });
      };

      this.client.activate();
    }
  }

  /**
   * Deactivates the WebSocket connection.
   */
  disconnect(): void {
    if (this.client.active) {
      this.client.deactivate();
      console.log('STOMP: Disconnected');
    }
  }
}
