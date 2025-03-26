import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useUser } from '../../../contexts/UserContext';

interface LoginResponse {
  code: number;
  msg: string;
  data: {
    token: string;
    username: string;
    userId: string; // 添加 userId 字段
  };
}

export const useAuth = () => {
  const { userId, token, setUserInfo, clearUserInfo } = useUser();
  const navigate = useNavigate();

  // 检查是否登录
  const isLoggedIn = !!token;

  const handleLogin = useCallback(
    async (phoneNo: string, code: number) => {
      try {
        const channel = 111; // 写死 channel
        const response = await axios.post<LoginResponse>(
          '/ai-npc/api/user/login',
          {
            phoneNo: phoneNo,
            code: code,
            channel: channel,
          }
        );

        if (response.data.code === 200) {
          // 使用 UserContext 的 setUserInfo 方法存储用户信息
          setUserInfo(
            response.data.data.userId,
            response.data.data.username,
            response.data.data.token
          );

          navigate('/');
          return true;
        } else {
          console.error('登录失败：', response.data.msg);
          return false;
        }
      } catch (error) {
        console.error('登录时发生错误：', error);
        return false;
      }
    },
    [navigate, setUserInfo]
  );

  const handleLogout = useCallback(() => {
    // 使用 UserContext 的 clearUserInfo 方法清除用户信息
    clearUserInfo();
    navigate('/login');
  }, [navigate, clearUserInfo]);

  return { isLoggedIn, handleLogin, handleLogout };
};
