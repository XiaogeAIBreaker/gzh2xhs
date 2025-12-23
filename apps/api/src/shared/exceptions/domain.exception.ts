export class DomainException extends Error {
  constructor(
    message: string,
    public readonly code?: string,
  ) {
    super(message)
    this.name = 'DomainException'
  }
}

export class BusinessRuleViolationException extends DomainException {
  constructor(message: string, public readonly rule: string) {
    super(message, 'BUSINESS_RULE_VIOLATION')
    this.name = 'BusinessRuleViolationException'
  }
}

export class InvariantViolationException extends DomainException {
  constructor(message: string, public readonly invariant: string) {
    super(message, 'INVARIANT_VIOLATION')
    this.name = 'InvariantViolationException'
  }
}