import { OperationResult } from 'mvc-common-toolkit';

import { HttpStatus } from '@nestjs/common';

import { ERR_CODE } from '@shared/constants';

export const generateUnauthorizedResult = (
  message: string,
  code = ERR_CODE.UNAUTHORIZED,
): OperationResult => ({
  success: false,
  message,
  code,
  httpCode: HttpStatus.UNAUTHORIZED,
});

export const generateInternalServerResult = (
  message?: string,
): OperationResult => ({
  success: false,
  message: message || 'internal server error',
  code: ERR_CODE.INTERNAL_SERVER_ERROR,
  httpCode: HttpStatus.INTERNAL_SERVER_ERROR,
});

export const generateNotFoundResult = (
  message: string,
  code = ERR_CODE.NOT_FOUND,
): OperationResult => ({
  success: false,
  message,
  code,
  httpCode: HttpStatus.NOT_FOUND,
});

export const generateBadRequestResult = (
  message: string,
  code = ERR_CODE.BAD_REQUEST,
): OperationResult => ({
  success: false,
  message,
  code,
  httpCode: HttpStatus.BAD_REQUEST,
});

export const generateConflictResult = (
  message: string,
  code = ERR_CODE.ALREADY_EXISTS,
): OperationResult => ({
  success: false,
  message,
  code,
  httpCode: HttpStatus.CONFLICT,
});

export const generateForbiddenResult = (
  message: string,
  code = ERR_CODE.FORBIDDEN,
): OperationResult => ({
  success: false,
  message,
  code,
  httpCode: HttpStatus.FORBIDDEN,
});

export const generateUnprocessableEntityResult = (
  message: string,
  code = ERR_CODE.UNPROCESSABLE_ENTITY,
): OperationResult => ({
  success: false,
  message,
  code,
  httpCode: HttpStatus.UNPROCESSABLE_ENTITY,
});

export const generateEmptyPaginationResult = (): OperationResult => ({
  success: true,
  data: { rows: [], total: 0 },
});
