import * as bcrypt from 'bcrypt';
import {
  Inject,
  UnauthorizedException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { FindOptionsWhere, ObjectLiteral, Repository } from 'typeorm';
import {
  AUTH_CONFIG,
  AuthModuleConfig,
  JwtPayload,
  UserAuthServiceType,
} from './types';
import { encrypt } from './helpers';

export class BaseUserAuthService<
  Entity extends ObjectLiteral = ObjectLiteral,
  JwtPayloadSub extends ObjectLiteral = ObjectLiteral,
  RegisterDto extends ObjectLiteral = ObjectLiteral,
> implements UserAuthServiceType<Entity, JwtPayloadSub, RegisterDto>
{
  // Custom user ID field, defaults to 'id'
  public IDField = 'id';

  // Custom DB fields for checking local user login
  public dbIdentityFields: string[] = ['username', 'email'];
  public dbPasswordField = 'password';

  // Custom request fields for checking local user login
  public requestUsernameField = 'username';
  public requestPasswordField = 'password';

  constructor(
    private readonly userRepository: Repository<Entity>,
    @Inject(AUTH_CONFIG)
    private readonly options: AuthModuleConfig,
  ) {}

  /**
   * Handle the registration
   * @param data
   */
  async register(data: RegisterDto): Promise<{ user: Entity; token: string }> {
    const userData = data as unknown as Entity;

    this.dbIdentityFields.forEach((field) => {
      if (!userData[field]) {
        throw new UnprocessableEntityException('Invalid user register data');
      }
    });

    // Check if user existed by identity fields
    const where = this.dbIdentityFields.map((field) => ({
      [field]: userData[field],
    })) as FindOptionsWhere<Entity>[];
    const existedUser = await this.userRepository.findOne({ where });

    if (existedUser) {
      throw new UnprocessableEntityException('User already existed');
    }

    // Hash password & create user entity (without saving to DB)
    const passwordField = this.dbPasswordField as keyof Entity;
    userData[passwordField] = (await this.hashPassword(
      userData[passwordField] as string,
    )) as unknown as Entity[typeof passwordField];
    const user = this.userRepository.create(userData);

    // Save user to DB
    const savedUser = await this.userRepository.save(user);
    delete savedUser[passwordField];

    // Generate token for user activation
    // Token should be encrypted before sending to user's email
    const token = encrypt(
      JSON.stringify({
        [this.IDField]: savedUser[this.IDField],
        createdAt: new Date().getTime(),
      }),
      this.options.recovery.tokenSecret,
    );

    return {
      user: savedUser,
      token: token,
    };
  }

  /**
   * Handle the login
   * @param username
   * @param password
   */
  async login(username: string, password: string): Promise<Entity> {
    if (!username || !password) {
      throw new UnauthorizedException('Invalid login credentials');
    }

    const user = await this.userRepository.findOne({
      where: this.dbIdentityFields.map((field) => ({
        [field]: username,
      })) as FindOptionsWhere<Entity>[],
    });

    if (!user) {
      throw new UnauthorizedException();
    }

    const validPassword = await this.verifyPassword(
      password,
      user[this.dbPasswordField] as string,
    );

    if (!validPassword) {
      throw new UnauthorizedException();
    }

    return user;
  }

  private hashPassword(input: string): Promise<string> {
    // TODO
    return bcrypt.hash(input, 10);
  }

  private async verifyPassword(
    input: string,
    hashedPassword: string,
  ): Promise<boolean> {
    return bcrypt.compare(input, hashedPassword);
  }

  /**
   * Create the JWT access token payload, default to { sub: { id: user.id } }
   * @param user
   */
  async createJwtAccessTokenPayload(
    user: Entity,
  ): Promise<JwtPayload<JwtPayloadSub>> {
    if (!user[this.IDField]) {
      throw new Error(
        `${this.IDField} is not defined in user object: ${JSON.stringify(
          user,
        )}`,
      );
    }

    const payload = {
      sub: {
        [this.IDField]: user[this.IDField],
      },
    };

    return payload as JwtPayload;
  }

  /**
   * Create the JWT refresh token payload, default to { sub: { id: user.id } }
   * @param user
   */
  createJwtRefreshTokenPayload(
    user: Entity,
  ): Promise<JwtPayload<Partial<JwtPayloadSub>>> {
    return this.createJwtAccessTokenPayload(user);
  }

  /**
   * This method is called after the user is registered.
   * @param body
   * @param user
   * @param token
   */
  async onAfterRegister(
    body: RegisterDto,
    user: Entity,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    token: string,
  ): Promise<any> {
    // You can send verification email in this method (by use the token)
    return {
      // body,
      // token,
      user,
    };
  }

  /**
   * This method is called after the user is logged in.
   * @param _user
   * @param accessToken
   * @param refreshToken
   * @param accessTokenExpiresAt
   * @param refreshTokenExpiresAt
   */
  async onAfterLogin(
    _user: Entity,
    accessToken: any,
    refreshToken: any,
    accessTokenExpiresAt: any,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    refreshTokenExpiresAt: any,
  ): Promise<any> {
    return {
      // user,
      token_type: 'Bearer',
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_at: accessTokenExpiresAt,
    };
  }

  async jwtValidator(payload: JwtPayloadSub) {
    if (!payload.sub[this.IDField]) {
      throw new Error('Invalid JWT payload');
    }

    const user = await this.userRepository.findOneBy({
      [this.IDField]: payload.sub[this.IDField],
    } as FindOptionsWhere<Entity>);

    if (!user) {
      throw new UnauthorizedException();
    }

    // delete user[this.dbPasswordField];
    return user;
  }

  async onAfterLogout(accessToken: string) {
    // TODO custom your logic
    return null;
  }
}
