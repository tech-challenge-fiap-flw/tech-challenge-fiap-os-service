export class BaseServerException extends Error {
  constructor(message: string) {
    super(message);
  }
}

export class NotFoundServerException extends BaseServerException {
  constructor(message: string = 'Resource not found') {
    super(message);
  }
}

export class BadRequestServerException extends BaseServerException {
  constructor(message: string = 'Bad request') {
    super(message);
  }
}

export class ForbiddenServerException extends BaseServerException {
  constructor(message: string = 'Forbidden') {
    super(message);
  }
}
