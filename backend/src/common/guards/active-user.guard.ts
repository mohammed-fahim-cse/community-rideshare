import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { User, UserStatus } from '@prisma/client';

@Injectable()
export class ActiveUserGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user: User = request.user;

    if (user.status !== UserStatus.ACTIVE) {
      throw new ForbiddenException('Your membership is not active yet');
    }

    return true;
  }
}
