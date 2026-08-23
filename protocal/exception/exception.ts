export class DomainException extends Error {
  constructor(
    message: string = "Domain Error",
    public status: number = 0,
  ) {
    super(message);
  }
}

export class BadRequestException extends DomainException {
  constructor(message?: string) {
    super(`Bad Request ${message}`, 400);
  }
}
