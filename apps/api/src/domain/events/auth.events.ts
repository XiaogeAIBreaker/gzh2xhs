import { DomainEvent } from '../../shared/entities/domain-event.entity'

export enum AuthDomainEventType {
  USER_REGISTERED = 'user.registered',
  USER_ACTIVATED = 'user.activated',
  USER_DEACTIVATED = 'user.deactivated',
  USER_LOGGED_IN = 'user.logged_in',
  USER_LOGGED_OUT = 'user.logged_out',
  PASSWORD_CHANGED = 'password.changed',
  SUPERUSER_GRANTED = 'superuser.granted',
  SUPERUSER_REVOKED = 'superuser.revoked',
}

/**
 * 用户注册事件
 */
export class UserRegisteredEvent extends DomainEvent {
  constructor(
    public readonly userId: number,
    public readonly email: string,
    public readonly fullName?: string,
  ) {
    super(AuthDomainEventType.USER_REGISTERED, {
      userId,
      email,
      fullName,
    })
  }
}

/**
 * 用户激活事件
 */
export class UserActivatedEvent extends DomainEvent {
  constructor(
    public readonly userId: number,
    public readonly email: string,
  ) {
    super(AuthDomainEventType.USER_ACTIVATED, {
      userId,
      email,
    })
  }
}

/**
 * 用户停用事件
 */
export class UserDeactivatedEvent extends DomainEvent {
  constructor(
    public readonly userId: number,
    public readonly email: string,
  ) {
    super(AuthDomainEventType.USER_DEACTIVATED, {
      userId,
      email,
    })
  }
}

/**
 * 用户登录事件
 */
export class UserLoggedInEvent extends DomainEvent {
  constructor(
    public readonly userId: number,
    public readonly email: string,
    public readonly ipAddress?: string,
    public readonly userAgent?: string,
  ) {
    super(AuthDomainEventType.USER_LOGGED_IN, {
      userId,
      email,
      ipAddress,
      userAgent,
    })
  }
}

/**
 * 用户登出事件
 */
export class UserLoggedOutEvent extends DomainEvent {
  constructor(
    public readonly userId: number,
    public readonly email: string,
  ) {
    super(AuthDomainEventType.USER_LOGGED_OUT, {
      userId,
      email,
    })
  }
}

/**
 * 密码修改事件
 */
export class PasswordChangedEvent extends DomainEvent {
  constructor(
    public readonly userId: number,
    public readonly email: string,
  ) {
    super(AuthDomainEventType.PASSWORD_CHANGED, {
      userId,
      email,
    })
  }
}

/**
 * 超级用户权限授予事件
 */
export class SuperuserGrantedEvent extends DomainEvent {
  constructor(
    public readonly userId: number,
    public readonly email: string,
  ) {
    super(AuthDomainEventType.SUPERUSER_GRANTED, {
      userId,
      email,
    })
  }
}

/**
 * 超级用户权限撤销事件
 */
export class SuperuserRevokedEvent extends DomainEvent {
  constructor(
    public readonly userId: number,
    public readonly email: string,
  ) {
    super(AuthDomainEventType.SUPERUSER_REVOKED, {
      userId,
      email,
    })
  }
}