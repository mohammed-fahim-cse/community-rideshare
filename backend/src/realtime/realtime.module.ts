import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { JWT_SECRET } from '../common/config/jwt.config';
import { RealtimeGateway } from './realtime.gateway';

@Module({
  imports: [JwtModule.register({ secret: JWT_SECRET })],
  providers: [RealtimeGateway],
  exports: [RealtimeGateway],
})
export class RealtimeModule {}
