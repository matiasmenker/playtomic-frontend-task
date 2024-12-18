import { Auth } from "./types";
import useSWR from "swr";
import { AuthContext } from "@/lib/auth/AuthProvider";
import { useContext, useCallback } from "react";
import { useApiFetcher } from "@/lib/api";
import useRefreshToken from "@/lib/auth/useRefreshToken";

/**
 * Returns the current auth state. See {@link Auth} for more information on
 * what is included there.
 *
 * @throws {TypeError} if called from a component not descendant of AuthProvider
 */
function useAuth(): Auth {
  const authContext = useContext(AuthContext);
  const fetcher = useApiFetcher();

  if (!authContext) {
    throw new TypeError(
      "useAuth must be used within a descendant of AuthProvider."
    );
  }

  useRefreshToken();

  useSWR(
    authContext.tokens ? "GET /v1/users/me" : null,
    async (url) => {
      const userResponse = await fetcher(url, {});
      if (!userResponse.ok) {
        throw new Error(userResponse.data.message);
      }
      return userResponse.data;
    },
    {
      onSuccess: (userResponse) => {
        authContext.setCurrentUser({
          email: userResponse.email ?? "",
          userId: userResponse.userId,
          name: userResponse.displayName,
        });
      },
      revalidateOnFocus: false,
      shouldRetryOnError: false,
      revalidateOnMount: false,
    }
  );

  const login = useCallback(
    async (credentials: { email: string; password: string }): Promise<void> => {
      if (authContext.currentUser) {
        throw new Error("User is already logged in.");
      }

      const response = await fetcher("POST /v3/auth/login", {
        data: credentials,
      });

      if (!response.ok) {
        throw new Error("Wrong credentials");
      }

      const {
        accessToken,
        accessTokenExpiresAt,
        refreshToken,
        refreshTokenExpiresAt,
      } = response.data;

      authContext.setTokens({
        access: accessToken,
        accessExpiresAt: accessTokenExpiresAt,
        refresh: refreshToken,
        refreshExpiresAt: refreshTokenExpiresAt,
      });
    },
    [authContext, fetcher]
  );

  const logout = useCallback(async (): Promise<void> => {
    if (!authContext.currentUser) {
      throw new Error("No user is currently logged in.");
    }
    authContext.setTokens(null);
    authContext.setCurrentUser(null);
    return Promise.resolve();
  }, [authContext]);

  return {
    tokens: authContext.tokens,
    currentUser: authContext.currentUser,
    login,
    logout,
  };
}

export { useAuth };
