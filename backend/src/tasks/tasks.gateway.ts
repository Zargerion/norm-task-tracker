import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@WebSocketGateway({
  cors: {
    origin: (origin: string, cb: (err: Error | null, allow?: boolean) => void) => cb(null, true),
    credentials: true,
  },
  namespace: '/tasks',
})
export class TasksGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(
    private jwt: JwtService,
    private config: ConfigService,
  ) {}

  handleConnection(socket: Socket) {
    const cookieHeader = socket.handshake.headers?.cookie ?? '';
    const match = cookieHeader.match(/(?:^|;\s*)ntt_token=([^;]+)/);
    const token = match?.[1];

    if (!token) {
      socket.disconnect();
      return;
    }

    try {
      const payload = this.jwt.verify(token, { secret: this.config.get('JWT_SECRET') });
      socket.data.userId = payload.sub;
    } catch {
      socket.disconnect();
    }
  }

  handleDisconnect(socket: Socket) {
    // cleanup is automatic — socket.io removes it from all rooms
    void socket;
  }

  @SubscribeMessage('join')
  handleJoin(
    @ConnectedSocket() socket: Socket,
    @MessageBody() data: { projectId: string },
  ) {
    if (!data?.projectId) return;
    socket.join(`project:${data.projectId}`);
  }

  @SubscribeMessage('leave')
  handleLeave(
    @ConnectedSocket() socket: Socket,
    @MessageBody() data: { projectId: string },
  ) {
    if (!data?.projectId) return;
    socket.leave(`project:${data.projectId}`);
  }

  emitTaskCreated(projectId: string, task: any) {
    this.server.to(`project:${projectId}`).emit('task:created', task);
  }

  emitTaskUpdated(projectId: string, task: any) {
    this.server.to(`project:${projectId}`).emit('task:updated', task);
  }

  emitTaskStatusChanged(projectId: string, task: any) {
    this.server.to(`project:${projectId}`).emit('task:status', task);
  }

  emitTaskDeleted(projectId: string, taskId: string) {
    this.server.to(`project:${projectId}`).emit('task:deleted', { id: taskId });
  }
}
