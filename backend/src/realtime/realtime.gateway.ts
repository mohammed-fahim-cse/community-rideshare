import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { OnGatewayConnection, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { PrismaService } from '../prisma/prisma.service';

@WebSocketGateway({ cors: { origin: '*' } })
export class RealtimeGateway implements OnGatewayConnection {
  @WebSocketServer() private server!: Server;

  private readonly logger = new Logger(RealtimeGateway.name);

  constructor(
    private readonly jwt: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  // Clients authenticate on connect (io(url, { auth: { token } })) rather than per-message,
  // since a socket represents one already-logged-in member for its whole lifetime.
  async handleConnection(socket: Socket) {
    try {
      const token = this.extractToken(socket);
      const payload = await this.jwt.verifyAsync<{ sub: string }>(token);
      const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
      if (!user) {
        throw new Error('User not found');
      }

      await socket.join(this.userRoom(user.id));
      await socket.join(this.communityRoom(user.communityId));
    } catch (err) {
      this.logger.warn(`Rejected socket connection: ${(err as Error).message}`);
      socket.disconnect(true);
    }
  }

  emitToUser(userId: string, event: string, payload: unknown) {
    this.server.to(this.userRoom(userId)).emit(event, payload);
  }

  emitToCommunity(communityId: string, event: string, payload: unknown) {
    this.server.to(this.communityRoom(communityId)).emit(event, payload);
  }

  private userRoom(userId: string): string {
    return `user:${userId}`;
  }

  private communityRoom(communityId: string): string {
    return `community:${communityId}`;
  }

  private extractToken(socket: Socket): string {
    const fromAuth = socket.handshake.auth?.token as string | undefined;
    const authHeader = socket.handshake.headers.authorization;
    const fromHeader = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined;
    const token = fromAuth ?? fromHeader;
    if (!token) {
      throw new Error('Missing auth token');
    }
    return token;
  }
}
