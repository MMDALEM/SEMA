export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export function notFound(_req, res) {
  res.status(404).json({ message: 'مسیر مورد نظر یافت نشد' });
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, _req, res, _next) {
  if (err instanceof HttpError) {
    return res.status(err.status).json({ message: err.message });
  }
  if (err?.name === 'ZodError') {
    const message = err.issues?.[0]?.message || 'اطلاعات ارسالی نامعتبر است';
    return res.status(400).json({ message });
  }
  if (err?.code === 11000) {
    return res.status(409).json({ message: 'مقدار تکراری است (شماره تلفن یا کد یکتا قبلا ثبت شده)' });
  }
  if (err?.name === 'CastError') {
    return res.status(400).json({ message: 'شناسه نامعتبر است' });
  }
  console.error('Unhandled error:', err);
  return res.status(500).json({ message: 'خطای داخلی سرور' });
}

export function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}
