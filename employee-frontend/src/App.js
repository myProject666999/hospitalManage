import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu, theme, Avatar, Dropdown, Button } from 'antd';
import {
  HomeOutlined,
  ClockCircleOutlined,
  MedicineBoxOutlined,
  FileTextOutlined,
  TransactionOutlined,
  ShoppingCartOutlined,
  NotificationOutlined,
  UserOutlined,
  LockOutlined,
  LogoutOutlined,
} from '@ant-design/icons';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import Attendance from './pages/Attendance';
import Drugs from './pages/Drugs';
import Inventory from './pages/Inventory';
import Orders from './pages/Orders';
import IncomeExpense from './pages/IncomeExpense';
import News from './pages/News';
import Profile from './pages/Profile';
import ChangePassword from './pages/ChangePassword';
import { authApi } from './utils/api';

const { Header, Sider, Content } = Layout;

function PrivateRoute({ children }) {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" />;
}

function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [user, setUser] = useState(null);
  const {
    token: { colorBgContainer },
  } = theme.useToken();

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      setUser(JSON.parse(userStr));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '个人信息',
      onClick: () => navigate('/profile'),
    },
    {
      key: 'password',
      icon: <LockOutlined />,
      label: '修改密码',
      onClick: () => navigate('/change-password'),
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: handleLogout,
    },
  ];

  const menuItems = [
    {
      key: '/',
      icon: <HomeOutlined />,
      label: '首页',
      onClick: () => navigate('/'),
    },
    {
      key: '/attendance',
      icon: <ClockCircleOutlined />,
      label: '考勤打卡',
      onClick: () => navigate('/attendance'),
    },
    {
      key: '/drugs',
      icon: <MedicineBoxOutlined />,
      label: '药品查询',
      onClick: () => navigate('/drugs'),
    },
    {
      key: '/inventory',
      icon: <FileTextOutlined />,
      label: '药品出入库',
      onClick: () => navigate('/inventory'),
    },
    {
      key: '/orders',
      icon: <ShoppingCartOutlined />,
      label: '订单管理',
      onClick: () => navigate('/orders'),
    },
    {
      key: '/income-expense',
      icon: <TransactionOutlined />,
      label: '收支管理',
      onClick: () => navigate('/income-expense'),
    },
    {
      key: '/news',
      icon: <NotificationOutlined />,
      label: '新闻公告',
      onClick: () => navigate('/news'),
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider collapsible collapsed={collapsed} onCollapse={(value) => setCollapsed(value)}>
        <div style={{ height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <h2 style={{ color: '#fff', margin: 0 }}>
            {collapsed ? 'HMS' : '医院管理系统'}
          </h2>
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
        />
      </Sider>
      <Layout>
        <Header style={{ padding: '0 24px', background: colorBgContainer, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0 }}>员工端</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span>{user?.real_name || user?.username}</span>
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <Avatar icon={<UserOutlined />} />
            </Dropdown>
          </div>
        </Header>
        <Content style={{ margin: '24px', background: colorBgContainer, padding: 24, minHeight: 280 }}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/attendance" element={<Attendance />} />
            <Route path="/drugs" element={<Drugs />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/income-expense" element={<IncomeExpense />} />
            <Route path="/news" element={<News />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/change-password" element={<ChangePassword />} />
          </Routes>
        </Content>
      </Layout>
    </Layout>
  );
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route
        path="/*"
        element={
          <PrivateRoute>
            <AppLayout />
          </PrivateRoute>
        }
      />
    </Routes>
  );
}

export default App;
