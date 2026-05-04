import React, { useState, useEffect } from 'react';
import { Table, Card, Button, Input, Select, DatePicker, Modal, message, Tag, Popconfirm, Space, Descriptions, Divider } from 'antd';
import { SearchOutlined, ReloadOutlined, EyeOutlined, DeleteOutlined, DeleteFilled } from '@ant-design/icons';
import { logApi, adminApi, userApi } from '../utils/api';
import dayjs from 'dayjs';

const { Option } = Select;
const { Search } = Input;

function LogManagement() {
  const [logs, setLogs] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [type, setType] = useState(null);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [detailVisible, setDetailVisible] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  useEffect(() => {
    fetchLogs();
    fetchAdmins();
    fetchUsers();
  }, []);

  const fetchAdmins = async () => {
    try {
      const res = await adminApi.getList({ page: 1, page_size: 1000 });
      if (res.code === 200) {
        setAdmins(res.data.list);
      }
    } catch (error) {
      console.error('获取管理员列表失败');
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await userApi.getList({ page: 1, page_size: 1000 });
      if (res.code === 200) {
        setUsers(res.data.list);
      }
    } catch (error) {
      console.error('获取用户列表失败');
    }
  };

  const fetchLogs = async (page = 1, pageSize = 10) => {
    setLoading(true);
    try {
      const params = { page, page_size: pageSize };
      if (keyword) params.keyword = keyword;
      if (type) params.type = type;
      if (startDate) params.start_date = startDate.format('YYYY-MM-DD');
      if (endDate) params.end_date = endDate.format('YYYY-MM-DD');
      
      const res = await logApi.getList(params);
      if (res.code === 200) {
        setLogs(res.data.list);
        setPagination({
          current: res.data.page,
          pageSize: res.data.pageSize,
          total: res.data.total,
        });
      }
    } catch (error) {
      message.error('获取日志列表失败');
    } finally {
      setLoading(false);
    }
  };

  const getOperatorName = (operatorId, operatorType) => {
    if (operatorType === 'admin') {
      const admin = admins.find(a => a.id === operatorId);
      return admin ? (admin.real_name || admin.username) : '-';
    } else {
      const user = users.find(u => u.id === operatorId);
      return user ? (user.real_name || user.username) : '-';
    }
  };

  const getOperatorTypeTag = (type) => {
    if (type === 'admin') {
      return <Tag color="purple">管理员</Tag>;
    }
    return <Tag color="blue">员工</Tag>;
  };

  const getLevelTag = (level) => {
    const levelMap = {
      info: { color: 'blue', text: '信息' },
      warning: { color: 'orange', text: '警告' },
      error: { color: 'red', text: '错误' },
      success: { color: 'green', text: '成功' },
    };
    const info = levelMap[level] || { color: 'default', text: level };
    return <Tag color={info.color}>{info.text}</Tag>;
  };

  const columns = [
    {
      title: '操作类型',
      dataIndex: 'action',
      key: 'action',
      width: 120,
    },
    {
      title: '模块',
      dataIndex: 'module',
      key: 'module',
      width: 120,
      render: (text) => text || '-',
    },
    {
      title: '级别',
      dataIndex: 'level',
      key: 'level',
      width: 80,
      render: (level) => getLevelTag(level),
    },
    {
      title: '操作人',
      dataIndex: 'operator_id',
      key: 'operator',
      width: 100,
      render: (id, record) => getOperatorName(id, record.operator_type),
    },
    {
      title: '操作者类型',
      dataIndex: 'operator_type',
      key: 'operator_type',
      width: 100,
      render: (type) => getOperatorTypeTag(type),
    },
    {
      title: 'IP地址',
      dataIndex: 'ip_address',
      key: 'ip_address',
      width: 120,
      render: (text) => text || '-',
    },
    {
      title: '请求方式',
      dataIndex: 'method',
      key: 'method',
      width: 80,
      render: (text) => text || '-',
    },
    {
      title: '请求路径',
      dataIndex: 'path',
      key: 'path',
      width: 150,
      render: (text) => text || '-',
    },
    {
      title: '操作时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 160,
      render: (text) => dayjs(text).format('YYYY-MM-DD HH:mm:ss'),
    },
    {
      title: '操作',
      key: 'action_col',
      width: 150,
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => showDetail(record)}
          >
            详情
          </Button>
          <Popconfirm
            title="确定要删除该日志吗？"
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
        </Space>
      ),
    },
  ];

  const showDetail = async (log) => {
    try {
      const res = await logApi.getById(log.id);
      if (res.code === 200) {
        setSelectedLog(res.data);
        setDetailVisible(true);
      }
    } catch (error) {
      message.error('获取日志详情失败');
    }
  };

  const handleDelete = async (id) => {
    try {
      const res = await logApi.delete(id);
      if (res.code === 200) {
        message.success('删除成功');
        fetchLogs();
      }
    } catch (error) {
      message.error(error.message || '删除失败');
    }
  };

  const handleClear = async () => {
    try {
      const res = await logApi.clear();
      if (res.code === 200) {
        message.success('清空成功');
        fetchLogs();
      }
    } catch (error) {
      message.error(error.message || '清空失败');
    }
  };

  const handleSearch = () => {
    fetchLogs(1, pagination.pageSize);
  };

  const handleTableChange = (page) => {
    fetchLogs(page.current, page.pageSize);
  };

  return (
    <div>
      <h2 style={{ marginBottom: 24 }}>日志管理</h2>
      
      <Card style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
            <Search
              placeholder="搜索操作类型/模块"
              allowClear
              enterButton={<SearchOutlined />}
              style={{ width: 220 }}
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onSearch={handleSearch}
            />
            <Select
              style={{ width: 120 }}
              placeholder="选择级别"
              allowClear
              value={type || undefined}
              onChange={(value) => {
                setType(value);
                setTimeout(() => handleSearch(), 100);
              }}
            >
              <Option value="info">信息</Option>
              <Option value="warning">警告</Option>
              <Option value="error">错误</Option>
              <Option value="success">成功</Option>
            </Select>
            <DatePicker
              placeholder="开始日期"
              value={startDate}
              onChange={(date) => setStartDate(date)}
            />
            <DatePicker
              placeholder="结束日期"
              value={endDate}
              onChange={(date) => setEndDate(date)}
            />
            <Button icon={<ReloadOutlined />} onClick={() => fetchLogs()}>
              刷新
            </Button>
          </div>
          <Popconfirm
            title="确定要清空所有日志吗？"
            onConfirm={handleClear}
            okText="确定"
            cancelText="取消"
          >
            <Button type="primary" danger icon={<DeleteFilled />}>
              清空日志
            </Button>
          </Popconfirm>
        </div>
      </Card>

      <Card>
        <Table
          columns={columns}
          dataSource={logs}
          rowKey="id"
          loading={loading}
          scroll={{ x: 1700 }}
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
        title="日志详情"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailVisible(false)}>
            关闭
          </Button>,
        ]}
        width={700}
      >
        {selectedLog && (
          <div>
            <Descriptions bordered column={2}>
              <Descriptions.Item label="操作类型">{selectedLog.action}</Descriptions.Item>
              <Descriptions.Item label="模块">{selectedLog.module || '-'}</Descriptions.Item>
              <Descriptions.Item label="级别">{getLevelTag(selectedLog.level)}</Descriptions.Item>
              <Descriptions.Item label="操作人">{getOperatorName(selectedLog.operator_id, selectedLog.operator_type)}</Descriptions.Item>
              <Descriptions.Item label="操作者类型">{getOperatorTypeTag(selectedLog.operator_type)}</Descriptions.Item>
              <Descriptions.Item label="IP地址">{selectedLog.ip_address || '-'}</Descriptions.Item>
              <Descriptions.Item label="请求方式">{selectedLog.method || '-'}</Descriptions.Item>
              <Descriptions.Item label="请求路径">{selectedLog.path || '-'}</Descriptions.Item>
              <Descriptions.Item label="操作时间">{dayjs(selectedLog.created_at).format('YYYY-MM-DD HH:mm:ss')}</Descriptions.Item>
            </Descriptions>

            {selectedLog.request_data && (
              <>
                <Divider orientation="left">请求数据</Divider>
                <pre style={{ background: '#f5f5f5', padding: 16, borderRadius: 4, overflow: 'auto' }}>
                  {typeof selectedLog.request_data === 'string' 
                    ? selectedLog.request_data 
                    : JSON.stringify(selectedLog.request_data, null, 2)}
                </pre>
              </>
            )}

            {selectedLog.response_data && (
              <>
                <Divider orientation="left">响应数据</Divider>
                <pre style={{ background: '#f5f5f5', padding: 16, borderRadius: 4, overflow: 'auto' }}>
                  {typeof selectedLog.response_data === 'string' 
                    ? selectedLog.response_data 
                    : JSON.stringify(selectedLog.response_data, null, 2)}
                </pre>
              </>
            )}

            {selectedLog.error_message && (
              <>
                <Divider orientation="left">错误信息</Divider>
                <pre style={{ background: '#fff2f0', padding: 16, borderRadius: 4, overflow: 'auto', color: '#ff4d4f' }}>
                  {selectedLog.error_message}
                </pre>
              </>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}

export default LogManagement;
