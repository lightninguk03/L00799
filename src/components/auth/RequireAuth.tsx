import { Navigate, useLocation } from 'react-router-dom';
import { TokenManager } from '../../api';

interface RequireAuthProps {
  children: React.ReactNode;
}

/**
 * 路由保护组件
 * 未登录用户会被重定向到登录页
 */
const RequireAuth: React.FC<RequireAuthProps> = ({ children }) => {
  const location = useLocation();
  const isLoggedIn = TokenManager.isLoggedIn();

  if (!isLoggedIn) {
    // 保存当前路径，登录后可以跳转回来
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export default RequireAuth;
