import { AuthGuard } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';

@Injectable()
export class LocalAuthGuard extends AuthGuard('local') {}

@Injectable()
export class AccessTokenAuthGuard extends AuthGuard('jwt-access-token') {}
