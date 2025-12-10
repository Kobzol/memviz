export type ExtractBody<T extends { body: unknown }> = T["body"];

export async function measureAsync<T>(
  name: string,
  block: () => Promise<T>,
): Promise<T> {
  const start = performance.now();
  const result = await block();
  const duration = performance.now() - start;
  console.log(`[TIMER] ${name}: ${duration.toFixed(2)}ms`);
  return result;
}

export async function decodeBase64(base64Bytes: string): Promise<ArrayBuffer> {
  const dataUrl = `data:application/octet-stream;base64,${base64Bytes}`;
  const res = await fetch(dataUrl);
  return await res.arrayBuffer();
}
