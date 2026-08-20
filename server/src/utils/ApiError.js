// Simple typed error the error handler turns into a clean JSON response.
export default class ApiError extends Error {
  constructor(statusCode, message, code = undefined) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
  }
  static badRequest(msg, code) { return new ApiError(400, msg, code); }
  static unauthorized(msg = 'Unauthorized') { return new ApiError(401, msg); }
  static forbidden(msg = 'Forbidden') { return new ApiError(403, msg); }
  static notFound(msg = 'Not found') { return new ApiError(404, msg); }
  static conflict(msg, code) { return new ApiError(409, msg, code); }
}
