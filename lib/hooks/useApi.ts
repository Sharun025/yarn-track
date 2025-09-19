import { useCallback, useEffect, useMemo, useState } from "react";

type RequestMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

type FetchOptions<TBody> = {
  method?: RequestMethod;
  body?: TBody;
};

type ApiState<T> = {
  data: T | null;
  isLoading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
};

const jsonHeaders = {
  "Content-Type": "application/json",
};

const parseError = async (response: Response) => {
  try {
    const payload = await response.json();
    if (payload?.error) {
      return new Error(payload.error);
    }
    return new Error(`Request failed with status ${response.status}`);
  } catch {
    return new Error(`Request failed with status ${response.status}`);
  }
};

export const useApi = <TResponse = unknown, TBody = unknown>(
  url: string,
  options: FetchOptions<TBody> = {}
): ApiState<TResponse> => {
  const { method = "GET", body } = options;
  const [data, setData] = useState<TResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const requestInit = useMemo<RequestInit>(() => {
    const init: RequestInit = {
      method,
      headers: jsonHeaders,
    };

    if (body !== undefined && body !== null) {
      init.body = JSON.stringify(body);
    }

    return init;
  }, [method, body]);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(url, {
        ...requestInit,
        cache: "no-store",
      });

      if (!response.ok) {
        throw await parseError(response);
      }

      const payload = (await response.json()) as { data?: TResponse };
      setData((payload?.data ?? null) as TResponse | null);
    } catch (err) {
      setError(err as Error);
      setData(null);
    } finally {
      setIsLoading(false);
    }
  }, [requestInit, url]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  return {
    data,
    isLoading,
    error,
    refresh: fetchData,
  };
};
