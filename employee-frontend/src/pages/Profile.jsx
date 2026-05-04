import React, { useState, useEffect } from 'react';
import { Card, Form, Input, Button, message, Select, Avatar } from 'antd';
import { UserOutlined, EditOutlined } from '@ant-design/icons';
import { authApi } from '../utils/api';

const { Option } = Select;
const { TextArea } = Input;

function Profile() {
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchUserInfo();
  }, []);

  const fetchUserInfo = async () => {
    try {
      const res = await authApi.getUserInfo();
      if (res.code === 200) {
        setUser(res.data);
        form.setFieldsValue({
          real_name: res.data.real_name,
          gender: res.data.gender,
          phone: res.data.phone,
          email: res.data.email,
          department: res.data.department,
          position: res.data.position,
        });
      }
    } catch (error) {
      message.error('获取用户信息失败');
    }
  };

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      const res = await authApi.updateUserInfo({
        real_name: values.real_name,
        gender: values.gender,
        phone: values.phone,
        email: values.email,
        department: values.department,
        position: values.position,
      });
      if (res.code === 200) {
        message.success('更新成功');
        const userStr = localStorage.getItem('user');
        if (userStr) {
          const userInfo = JSON.parse(userStr);
          userInfo.real_name = values.real_name || userInfo.real_name;
          userInfo.gender = values.gender || userInfo.gender;
          userInfo.phone = values.phone || userInfo.phone;
          userInfo.email = values.email || userInfo.email;
          userInfo.department = values.department || userInfo.department;
          userInfo.position = values.position || userInfo.position;
          localStorage.setItem('user', JSON.stringify(userInfo));
        }
        fetchUserInfo();
      } else {
        message.error(res.message || '更新失败');
      }
    } catch (error) {
      message.error(error.message || '更新失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 style={{ marginBottom: 24 }}>个人信息</h2>
      
      <Card style={{ maxWidth: 600 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Avatar size={80} icon={<UserOutlined />} style={{ marginBottom: 16 }} />
          <h3>{user?.real_name || user?.username || '用户'}</h3>
          <p style={{ color: '#999' }}>角色：员工</p>
        </div>

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            name="username"
            label="用户名"
          >
            <Input disabled value={user?.username} />
          </Form.Item>

          <Form.Item
            name="real_name"
            label="真实姓名"
          >
            <Input placeholder="请输入真实姓名" />
          </Form.Item>

          <Form.Item
            name="gender"
            label="性别"
          >
            <Select placeholder="请选择性别" allowClear>
              <Option value="男">男</Option>
              <Option value="女">女</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="phone"
            label="手机号"
          >
            <Input placeholder="请输入手机号" />
          </Form.Item>

          <Form.Item
            name="email"
            label="邮箱"
            rules={[
              { type: 'email', message: '邮箱格式不正确' },
            ]}
          >
            <Input placeholder="请输入邮箱" />
          </Form.Item>

          <Form.Item
            name="department"
            label="部门"
          >
            <Input placeholder="请输入部门" />
          </Form.Item>

          <Form.Item
            name="position"
            label="职位"
          >
            <Input placeholder="请输入职位" />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0 }}>
            <Button type="primary" htmlType="submit" loading={loading} icon={<EditOutlined />}>
              更新信息
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}

export default Profile;
