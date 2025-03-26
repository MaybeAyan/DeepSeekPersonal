import {
  createContext,
  useState,
  useContext,
  useEffect,
  ReactNode,
} from 'react';

interface UserContextType {
  userId: string;
  username: string;
  token: string;
  setUserInfo: (userId: string, username: string, token: string) => void;
  clearUserInfo: () => void;
}

const defaultContext: UserContextType = {
  userId: '',
  username: '',
  token: '',
  setUserInfo: () => {},
  clearUserInfo: () => {},
};

const UserContext = createContext<UserContextType>(defaultContext);

export const useUser = () => useContext(UserContext);

interface UserProviderProps {
  children: ReactNode;
}

export const UserProvider = ({ children }: UserProviderProps) => {
  const [userId, setUserId] = useState<string>('');
  const [username, setUsername] = useState<string>('');
  const [token, setToken] = useState<string>('');

  // 从 localStorage 初始化加载用户信息
  useEffect(() => {
    const storedUserId = localStorage.getItem('userId');
    const storedUsername = localStorage.getItem('username');
    const storedToken = localStorage.getItem('token');

    if (storedUserId) setUserId(storedUserId);
    if (storedUsername) setUsername(storedUsername);
    if (storedToken) setToken(storedToken);
  }, []);

  const setUserInfo = (
    newUserId: string,
    newUsername: string,
    newToken: string
  ) => {
    // 更新状态
    setUserId(newUserId);
    setUsername(newUsername);
    setToken(newToken);

    // 持久化到 localStorage
    localStorage.setItem('userId', newUserId);
    localStorage.setItem('username', newUsername);
    localStorage.setItem('token', newToken);
  };

  const clearUserInfo = () => {
    // 清除状态
    setUserId('');
    setUsername('');
    setToken('');

    // 清除 localStorage
    localStorage.removeItem('userId');
    localStorage.removeItem('username');
    localStorage.removeItem('token');
  };

  return (
    <UserContext.Provider
      value={{
        userId,
        username,
        token,
        setUserInfo,
        clearUserInfo,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};
