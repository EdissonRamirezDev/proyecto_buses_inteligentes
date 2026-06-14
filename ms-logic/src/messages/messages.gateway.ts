import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class MessagesGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('join')
  handleJoin(@MessageBody() data: { userId: string }, @ConnectedSocket() client: Socket) {
    if (data && data.userId) {
      const room = `user_${data.userId}`;
      client.join(room);
      console.log(`Client ${client.id} joined room: ${room}`);
      return { status: 'joined', room };
    }
    return { status: 'error', message: 'No userId provided' };
  }

  /**
   * Notifies a specific user about an event
   */
  notifyUser(userId: string, event: string, payload: any) {
    this.server.to(`user_${userId}`).emit(event, payload);
  }

  /**
   * Broadcasts an event to multiple users
   */
  notifyUsers(userIds: string[], event: string, payload: any) {
    const rooms = userIds.map(id => `user_${id}`);
    if (rooms.length > 0) {
      this.server.to(rooms).emit(event, payload);
    }
  }
}
