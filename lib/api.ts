import { NextResponse } from 'next/server';

export type ApiError = {
  code: string;
  message: string;
};

export type ApiResponse<T> =
  | { success: true; data: T; error: null }
  | { success: false; data: null; error: ApiError };

export function ok<T>(data: T, status = 200): NextResponse<ApiResponse<T>> {
  return NextResponse.json({ success: true, data, error: null } as const, { status });
}

export function fail(
  code: string,
  message: string,
  status = 400,
): NextResponse<ApiResponse<never>> {
  return NextResponse.json(
    { success: false, data: null, error: { code, message } } as const,
    { status },
  );
}

export const unauthorized = () =>
  fail('UNAUTHORIZED', 'Kamu harus masuk dulu untuk mengakses data ini.', 401);

export const notFound = (message = 'Data tidak ditemukan.') =>
  fail('NOT_FOUND', message, 404);

export const validationError = (message: string) => fail('VALIDATION_ERROR', message, 400);

export const conflict = (message: string) => fail('CONFLICT', message, 409);

export const serverError = (message = 'Terjadi kesalahan di server.') =>
  fail('INTERNAL_ERROR', message, 500);
