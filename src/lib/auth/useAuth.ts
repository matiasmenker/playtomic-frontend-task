import { Auth } from "./types";
import { AuthContext } from "@/lib/auth/AuthProvider";
import { useContext } from "react";
/**
 * Returns the current auth state. See {@link Auth} for more information on
 * what is included there.
 *
 * @throws {TypeError} if called from a component not descendant of AuthProvider
 */
function useAuth(): Auth {
  const authContext = useContext(AuthContext);

  if (!authContext) {
    throw new TypeError(
        "useAuth must be used within a descendant of AuthProvider."
    );
  }
  
  return {
    tokens: null,
    currentUser: null,
    login(credentials) {
      const { email, password } = credentials
      return Promise.reject(new Error('Not yet implemented'))
    },
    logout() {
      return Promise.reject(new Error('Not yet implemented'))
    },
  }
}

export { useAuth }
