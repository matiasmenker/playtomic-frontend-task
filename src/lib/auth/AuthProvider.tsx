import {createContext, useState, ReactNode, useMemo} from 'react';
import { Auth, AuthInitializeConfig } from './types';

interface AuthProviderProps extends AuthInitializeConfig {
  children?: ReactNode

  /**
   * @see {@link AuthInitializeConfig.initialTokens}
   */
  initialTokens?: AuthInitializeConfig['initialTokens']

  /**
   * @see {@link AuthInitializeConfig.onAuthChange}
   */
  onAuthChange?: AuthInitializeConfig['onAuthChange']
}


interface AuthContextValue {
  /**
   * The currently authenticated user.
   *
   * This property holds information about the user who is currently logged in.
   * If no user is logged in, this value is `null`.
   *
   * @see {@link Auth.currentUser} for details about the structure of this property.
   */
  currentUser: Auth['currentUser'];

  /**
   * Updates the `currentUser` state.
   *
   * Use this method to set the currently authenticated user.
   * Pass `null` to clear the state when logging out.
   *
   * @param user - The new user information
   * @see {@link Auth.currentUser}
   */
  setCurrentUser(user: Auth['currentUser']): void;

  /**
   * The current authentication tokens.
   *
   * This property contains the access and refresh tokens for the current session.
   * If the user is not authenticated, this value is `null`.
   *
   * @see {@link Auth.tokens} for details about the structure of this property.
   */
  tokens: Auth['tokens'];
  /**
   * Updates the `tokens` state.
   *
   * Use this method to set the current authentication tokens.
   * Pass `null` to clear the tokens when logging out.
   *
   * @param tokens - The new authentication tokens
   * @see {@link Auth.tokens}
   */
  setTokens(tokens: Auth['tokens']): void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);


/**
 * Initializes the auth state and exposes it to the component-tree below.
 *
 * This allow separate calls of `useAuth` to communicate among each-other and share
 * a single source of truth.
 */
function AuthProvider(props: AuthProviderProps): JSX.Element {
  const { initialTokens, onAuthChange, children } = props
  const [tokens, setTokens] = useState<Auth['tokens']>(undefined);
  const [currentUser, setCurrentUser] = useState<Auth['currentUser']>(undefined);

  const updateTokens = (tokens: Exclude<Auth['tokens'], undefined>) => {
    setTokens(tokens);
    setCurrentUser(tokens ? {
      email: '',
      name: '',
      userId: ''
    } : null);
    onAuthChange?.(tokens);
  }

  const value = useMemo(() => {
    return {
      tokens,
      currentUser,
      setTokens: updateTokens,
      setCurrentUser,
    }
  }, [
    tokens,
    currentUser,
  ]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
export { AuthProvider, type AuthProviderProps }
