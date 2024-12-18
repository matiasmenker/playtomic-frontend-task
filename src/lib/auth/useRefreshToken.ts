import { useContext } from "react";
import useSWR from "swr";
import { useApiFetcher } from "@/lib/api";
import { AuthContext } from "@/lib/auth/AuthProvider";

/**
 * A custom hook to refresh token authentication before expire.
 *
 * @throws {TypeError} If the hook is used outside of an AuthProvider.
 *
 */
function useRefreshToken() {
  const authContext = useContext(AuthContext);
  const fetcher = useApiFetcher();

  if (!authContext) {
    throw new TypeError("useRefreshToken must be used within AuthProvider.");
  }

  useSWR(
    authContext.tokens?.accessExpiresAt ? "auth-refresh" : null,
    async () => {
      if (!authContext.tokens?.accessExpiresAt) {
        throw new Error("Tokens are not available");
      }

      const now = new Date().getTime();
      const accessExpiresAt = new Date(
        authContext.tokens.accessExpiresAt
      ).getTime();
      const timeUntilExpiration = accessExpiresAt - now;

      // If the token expires in less than 10 seconds, refresh it
      if (timeUntilExpiration <= 10 * 1000) {
        const refreshResponse = await fetcher("POST /v3/auth/refresh", {
          data: { refreshToken: authContext.tokens.refresh },
        });

        if (!refreshResponse.ok) {
          throw new Error(refreshResponse.data.message);
        }

        authContext.setTokens({
          access: refreshResponse.data.accessToken,
          accessExpiresAt: refreshResponse.data.accessTokenExpiresAt,
          refresh: refreshResponse.data.refreshToken,
          refreshExpiresAt: refreshResponse.data.refreshTokenExpiresAt,
        });
      }
    },
    {
      onError: () => {
        authContext.setTokens(null);
        authContext.setCurrentUser(null);
      },
      refreshInterval: authContext.tokens?.accessExpiresAt
        ? Math.max(
            new Date(authContext.tokens.accessExpiresAt).getTime() -
              new Date().getTime() -
              10 * 1000,
            0
          )
        : 0,
      revalidateOnFocus: false,
      shouldRetryOnError: false,
    }
  );
}

export default useRefreshToken;
