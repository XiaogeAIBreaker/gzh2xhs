export interface DomainEvent {
  readonly eventType: string
  readonly occurredAt: Date
  readonly payload: Record<string, unknown>
  readonly eventId: string
}

export abstract class BaseDomainEvent implements DomainEvent {
  public readonly occurredAt: Date
  public readonly eventId: string

  constructor(
    public readonly eventType: string,
    public readonly payload: Record<string, any>,
  ) {
    this.occurredAt = new Date()
    this.eventId = this.generateEventId()
  }

  private generateEventId(): string {
    return `${this.eventType}_${this.occurredAt.getTime()}_${Math.random().toString(36).substr(2, 9)}`
  }
}

export class DomainEventEntity extends BaseDomainEvent {
  constructor(
    eventType: string,
    payload: Record<string, unknown>,
  ) {
    super(eventType, payload)
  }
}
