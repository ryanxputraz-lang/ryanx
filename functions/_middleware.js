
export async function onRequest(context) {
  // CORS & JSON header helper
  return await context.next();
}
