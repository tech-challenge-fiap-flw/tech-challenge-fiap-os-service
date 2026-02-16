export class HttpError extends Error {
  status: number;
  details?: any;
  constructor(status: number, message: string, details?: any) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

export function badRequest(message: string, details?: any) {
  return new HttpError(400, message, details);
}
export function notFound(message: string = 'Not Found') {
  return new HttpError(404, message);
}
export function forbidden(message: string = 'Forbidden') {
  return new HttpError(403, message);
}
export function unauthorized(message: string = 'Unauthorized') {
  return new HttpError(401, message);
}
export function conflict(message: string = 'Conflict') {
  return new HttpError(409, message);
}
export function internal(message: string = 'Internal Server Error') {
  return new HttpError(500, message);
}
