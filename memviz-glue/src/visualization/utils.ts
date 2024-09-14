import { useCallback, useEffect, useState } from "react";

// Returns [data, isLoading]
export function useAsyncFn<T>(
  asyncCallback: () => Promise<T>,
  deps: unknown[],
): [T, boolean] {
  const [data, setData] = useState<T | null>(null);
  const cachedFn = useCallback(asyncCallback, deps);

  useEffect(() => {
    let ignore = false;
    const cb = async () => {
      const res = await cachedFn();
      if (!ignore) {
        setData(res);
      }
    };
    cb();
    return () => {
      ignore = true;
    };
  }, [cachedFn]);
  return [data as T, data === null];
}
