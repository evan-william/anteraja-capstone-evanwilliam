export type ApiError = {
  code: string;
  message: string;
};

export type ApiResponse<T> =
  | { success: true; data: T; error: null }
  | { success: false; data: null; error: ApiError };
