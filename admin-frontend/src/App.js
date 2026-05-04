import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu, Dropdown, Avatar, message, Button, Spin } from 'antd';
import {
  DashboardOutlined,
  UserOutlined,
  MedicineBoxOutlined,
  ShopOutlined,
  CalendarOutlined,
  MoneyCollectOutlined,
  SettingOutlined,
  PictureOutlined,
  FileTextOutlined,
  ProfileOutlined,
  KeyOutlined,
  LogoutOutlined,
  MenuUnfoldOutlined,
  MenuFoldOutlined,
} from '@ant-design/icons';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import UserManagement from './pages/UserManagement';
import DrugManagement from './pages/DrugManagement';
import DrugCategoryManagement from './pages/DrugCategoryManagement';
import InventoryManagement from './pages/InventoryManagement';
import OrderManagement from './pages/OrderManagement';
import AttendanceManagement from './pages/AttendanceManagement';
import IncomeExpenseManagement from './pages/IncomeExpenseManagement';
import AdminManagement from './pages/AdminManagement';
import BannerManagement from './pages/BannerManagement';
import NewsManagement from './pages/NewsManagement';
import LogManagement from './pages/LogManagement';
import ChangePassword from './pages/ChangePassword';

const { Header, Sider, Content } = Layout;

function PrivateRoute({ children }) {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" replace />;
}

function AdminLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        setUser(JSON.parse(userStr));
      } catch (e) {
        console.error('解析用户信息失败');
      }
    }
    setLoading(false);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    message.success('已退出登录');
    navigate('/login');
  };

  const userMenu = [
    {
      key: 'change-password',
      icon: <KeyOutlined />,
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
      icon: <DashboardOutlined />,
      label: '数据统计',
    },
    {
      key: '/user-management',
      icon: <UserOutlined />,
      label: '用户管理',
    },
    {
      key: '/admin-management',
      icon: <SettingOutlined />,
      label: '管理员管理',
    },
    {
      key: 'drug',
      icon: <MedicineBoxOutlined />,
      label: '药品管理',
      children: [
        { key: '/drug-management', label: '药品列表' },
        { key: '/drug-category-management', label: '药品类型' },
      ],
    },
    {
      key: '/inventory-management',
      icon: <ShopOutlined />,
      label: '出入库管理',
    },
    {
      key: '/order-management',
      icon: <FileTextOutlined />,
      label: '订单管理',
    },
    {
      key: '/attendance-management',
      icon: <CalendarOutlined />,
      label: '考勤管理',
    },
    {
      key: '/income-expense-management',
      icon: <MoneyCollectOutlined />,
      label: '收支明细',
    },
    {
      key: '/banner-management',
      icon: <PictureOutlined />,
      label: '轮播图管理',
    },
    {
      key: '/news-management',
      icon: <ProfileOutlined />,
      label: '新闻公告',
    },
    {
      key: '/log-management',
      icon: <FileTextOutlined />,
      label: '日志管理',
    },
  ];

  const handleMenuClick = ({ key }) => {
    if (key !== 'drug') {
      navigate(key);
    }
  };

  const getSelectedKeys = () => {
    const path = location.pathname;
    if (path === '/drug-management' || path === '/drug-category-management') {
      return [path];
    }
    return [path];
  };

  const getOpenKeys = () => {
    const path = location.pathname;
    if (path.startsWith('/drug')) {
      return ['drug'];
    }
    return [];
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', paddingTop: 100 }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider 
        trigger={null} 
        collapsible 
        collapsed={collapsed}
        theme="dark"
      >
        <div style={{ 
          height: 64, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          color: '#fff',
          fontSize: collapsed ? 12 : 18,
          fontWeight: 'bold',
        }}>
          {collapsed ? '医院' : '医院管理系统'}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={getSelectedKeys()}
          defaultOpenKeys={getOpenKeys()}
          items={menuItems}
          onClick={handleMenuClick}
        />
      </Sider>
      <Layout className="site-layout">
        <Header
          style={{
            padding: '0 24px',
            background: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 1px 4px rgba(0,21,41,0.08)',
          }}
        >
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{
              fontSize: '16px',
              width: 64,
              height: 64,
            }}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span>欢迎，{user?.real_name || user?.username || '管理员'}</span>
            <Dropdown menu={{ items: userMenu }} placement="bottomRight">
              <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Avatar icon={<UserOutlined />} />
              </div>
            </Dropdown>
          </div>
        </Header>
        <Content
          style={{
            margin: '24px 16px',
            padding: 24,
            minHeight: 280,
            background: '#fff',
          }}
        >
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/user-management" element={<UserManagement />} />
            <Route path="/admin-management" element={<AdminManagement />} />
            <Route path="/drug-management" element={<DrugManagement />} />
            <Route path="/drug-category-management" element={<DrugCategoryManagement />} />
            <Route path="/inventory-management" element={<InventoryManagement />} />
            <Route path="/order-management" element={<OrderManagement />} />
            <Route path="/attendance-management" element={<AttendanceManagement />} />
            <Route path="/income-expense-management" element={<IncomeExpenseManagement />} />
            <Route path="/banner-management" element={<BannerManagement />} />
            <Route path="/news-management" element={<NewsManagement />} />
            <Route path="/log-management" element={<LogManagement />} />
            <Route path="/change-password" element={<ChangePassword />} />
          </Routes>
        </Content>
      </Layout>
    </Layout>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/*"
          element={
            <PrivateRoute>
              <Routes>
                <Route path="/*" element={<AdminLayout />} />
              </Routes>
            </PrivateRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
