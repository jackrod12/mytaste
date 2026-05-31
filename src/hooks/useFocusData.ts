import { useCallback, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";

interface FocusDataResult<T> {
  data: T | null;
  loading: boolean;
  /** 수동 새로고침 */
  reload: () => void;
}

/**
 * 화면이 포커스될 때마다 async loader 를 실행해 데이터를 새로 불러온다.
 * (기록 추가 후 대시보드로 돌아오면 자동 갱신되도록)
 */
export function useFocusData<T>(loader: () => Promise<T>): FocusDataResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [nonce, setNonce] = useState(0);

  const reload = useCallback(() => setNonce((n) => n + 1), []);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      setLoading(true);
      loader()
        .then((result) => {
          if (active) {
            setData(result);
            setLoading(false);
          }
        })
        .catch((e) => {
          console.warn("[useFocusData] 로드 실패", e);
          if (active) setLoading(false);
        });
      return () => {
        active = false;
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [nonce]),
  );

  return { data, loading, reload };
}
