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

export async function decodeBase64(base64Bytes: string): Promise<Uint8Array> {
  const dataUrl = `data:application/octet-stream;base64,${base64Bytes}`;
  const res = await fetch(dataUrl);
  return new Uint8Array(await res.arrayBuffer());
}
