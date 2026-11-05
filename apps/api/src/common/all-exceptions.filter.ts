import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';

@Catch() // empty = catch EVERYTHING, not only HttpException
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const req = ctx.getRequest<Request>();
    const res = ctx.getResponse<Response>();
    const requestId = req.id;

    if (exception instanceof HttpException) {
      const status = exception.getStatus();

      res.status(status).json({
        error: {
          code: HttpStatus[status],
          message: exception.message,
          requestId,
        },
      });
      return;
    }

    this.logger.error(exception);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Something went wrong.',
        requestId,
      },
    });
  }
}
