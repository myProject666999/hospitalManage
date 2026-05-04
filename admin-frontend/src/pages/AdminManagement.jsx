import React, { useState, useEffect } from 'react';
import { Table, Card, Button, Input, Select, Modal, Form, message, Tag, Popconfirm, Space } from 'antd';
import { PlusOutlined, SearchOutlined, ReloadOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { adminApi } from '../utils/api';
import dayjs from 'dayjs';

const { Option } = Select;
const { Search } = Input;

function AdminManagement() {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState(null);
  const [form] = Form.useForm();
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  useEffect(() => {
    fetchAdmins();
  }, []);

  const fetchAdmins = async (page = 1, pageSize = 10) => {
    setLoading(true);
    try {
      const params = { page, page_size: pageSize };
      if (keyword) params.keyword = keyword;
      if (status !== null) params.status = status;
      
      const res = await adminApi.getList(params);
      if (res.code === 200) {
        setAdmins(res.data.list);
        setPagination({
          current: res.data.page,
          pageSize: res.data.pageSize,
          total: res.data.total,
        });
      }
    } catch (error) {
      message.error('获取管理员列表失败');
    } finally {
      setLoading(false);
    }
  };

  const getRoleTag = (role) => {
    if (role === 'super_admin') {
      return <Tag color="purple">超级管理员</Tag>;
    }
    return <Tag color="blue">管理员</Tag>;
  };

  const columns = [
    {
      title: '用户名',
      dataIndex: 'username',
      key: 'username',
      width: 150,
    },
    {
      title: '真实姓名',
      dataIndex: 'real_name',
      key: 'real_name',
      width: 120,
      render: (text) => text || '-',
    },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      width: 120,
      render: (role) => getRoleTag(role),
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      key: 'email',
      width: 200,
      render: (text) => text || '-',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => (
        <Tag color={status === 1 ? 'green' : 'red'}>
          {status === 1 ? '正常' : '禁用'}
        </Tag>
      ),
    },
    {
      title: '最后登录时间',
      dataIndex: 'last_login_at',
      key: 'last_login_at',
      width: 180,
      render: (text) => text ? dayjs(text).format('YYYY-MM-DD HH:mm:ss') : '-',
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180,
      render: (text) => dayjs(text).format('YYYY-MM-DD HH:mm:ss'),
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          {record.role !== 'super_admin' && (
            <Popconfirm
              title="确定要删除该管理员吗？"
              onConfirm={() => handleDelete(record.id)}
              okText="确定"
              cancelText="取消"
            >
              <Button
                type="link"
                size="small"
                danger
                icon={<DeleteOutlined />}
              >
                删除
              </Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  const handleAdd = () => {
    setEditingAdmin(null);
    form.resetFields();
    form.setFieldsValue({ status: 1, role: 'admin' });
    setModalVisible(true);
  };

  const handleEdit = (record) => {
    setEditingAdmin(record);
    form.setFieldsValue(record);
    setModalVisible(true);
  };

  const handleSubmit = async (values) => {
    try {
      if (editingAdmin) {
        const res = await adminApi.update(editingAdmin.id, values);
        if (res.code === 200) {
          message.success('更新成功');
          setModalVisible(false);
          fetchAdmins();
        }
      } else {
        const res = await adminApi.create(values);
        if (res.code === 200) {
          message.success('创建成功');
          setModalVisible(false);
          fetchAdmins();
        }
      }
    } catch (error) {
      message.error(error.message || '操作失败');
    }
  };

  const handleDelete = async (id) => {
    try {
      const res = await adminApi.delete(id);
      if (res.code === 200) {
        message.success('删除成功');
        fetchAdmins();
      }
    } catch (error) {
      message.error(error.message || '删除失败');
    }
  };

  const handleSearch = () => {
    fetchAdmins(1, pagination.pageSize);
  };

  const handleTableChange = (page) => {
    fetchAdmins(page.current, page.pageSize);
  };

  return (
    <div>
      <h2 style={{ marginBottom: 24 }}>管理员管理</h2>
      
      <Card style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
            <Search
              placeholder="搜索用户名/姓名"
              allowClear
              enterButton={<SearchOutlined />}
              style={{ width: 250 }}
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onSearch={handleSearch}
            />
            <Select
              style={{ width: 120 }}
              placeholder="选择状态"
              allowClear
              value={status !== null ? status : undefined}
              onChange={(value) => {
                setStatus(value);
                setTimeout(() => handleSearch(), 100);
              }}
            >
              <Option value={1}>正常</Option>
              <Option value={0}>禁用</Option>
            </Select>
            <Button icon={<ReloadOutlined />} onClick={() => fetchAdmins()}>
              刷新
            </Button>
          </div>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            新增管理员
          </Button>
        </div>
      </Card>

      <Card>
        <Table
          columns={columns}
          dataSource={admins}
          rowKey="id"
          loading={loading}
          scroll={{ x: 1400 }}
          pagination={{
            ...pagination,
            showQuickJumper: true,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条记录`,
          }}
          onChange={handleTableChange}
        />
      </Card>

      <Modal
        title={editingAdmin ? '编辑管理员' : '新增管理员'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={500}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            name="username"
            label="用户名"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input placeholder="请输入用户名" disabled={!!editingAdmin} />
          </Form.Item>

          {!editingAdmin && (
            <Form.Item
              name="password"
              label="密码"
              rules={[
                { required: true, message: '请输入密码' },
                { min: 6, message: '密码长度不能少于6位' },
              ]}
            >
              <Input.Password placeholder="请输入密码" />
            </Form.Item>
          )}

          <Form.Item
            name="real_name"
            label="真实姓名"
          >
            <Input placeholder="请输入真实姓名" />
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
            name="role"
            label="角色"
            rules={[{ required: true, message: '请选择角色' }]}
          >
            <Select placeholder="请选择角色">
              <Option value="admin">管理员</Option>
              <Option value="super_admin">超级管理员</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="status"
            label="状态"
          >
            <Select placeholder="请选择状态">
              <Option value={1}>正常</Option>
              <Option value={0}>禁用</Option>
            </Select>
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Button
              style={{ marginRight: 8 }}
              onClick={() => setModalVisible(false)}
            >
              取消
            </Button>
            <Button type="primary" htmlType="submit">
              确认
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default AdminManagement;
