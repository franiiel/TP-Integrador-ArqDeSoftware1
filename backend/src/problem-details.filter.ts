import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { STATUS_CODES } from 'node:http';

// Turns every error into Problem Details (RFC 9457). No custom problem types:
// `type` is always about:blank and the HTTP status carries the meaning.
@Catch()
export class ProblemDetailsFilter implements ExceptionFilter {
  private readonly logger = new Logger(ProblemDetailsFilter.name);

  catch(error: unknown, host: ArgumentsHost) {
    const http = host.switchToHttp();
    const req = http.getRequest<Request>();
    const res = http.getResponse<Response>();

    let status: number = HttpStatus.INTERNAL_SERVER_ERROR;
    let detail: string | undefined;
    let errores: string[] | undefined;
    if (error instanceof HttpException) {
      status = error.getStatus();
      const cuerpo = error.getResponse();
      const message =
        typeof cuerpo === 'string'
          ? cuerpo
          : (cuerpo as { message?: string | string[] }).message;
      if (Array.isArray(message)) {
        detail = 'Los datos enviados no cumplen las validaciones';
        errores = message;
      } else {
        detail = message;
      }
    } else {
      // Unexpected: log it, but don't leak internals to the client.
      this.logger.error(error);
    }

    res.status(status).type('application/problem+json').json({
      type: 'about:blank',
      title: STATUS_CODES[status],
      status,
      detail,
      instance: req.originalUrl,
      errores,
    });
  }
}
