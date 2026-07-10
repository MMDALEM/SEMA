/**
 * اعتبارسنجی ورودی با zod. داده‌ی پاک‌شده جایگزین req.body می‌شود.
 */
export function validate(schema, source = 'body') {
  return (req, _res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) return next(result.error);
    req[source === 'query' ? 'validatedQuery' : source] = result.data;
    return next();
  };
}
