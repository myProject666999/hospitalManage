import React, { useState, useEffect } from 'react';
import { Table, Card, Button, Input, Select, DatePicker, message, Tag, Popconfirm, Space, Descriptions, Modal } from 'antd';
import { SearchOutlined, ReloadOutlined, EyeOutlined, DeleteOutlined } from '@ant-design/icons';
import { attendanceApi, userApi } from '../utils/api';
import dayjs from 'dayjs';

const { Option } = Select;
const { Search } = Input;

function AttendanceManagement() {
  const [records, setRecords] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [userId, setUserId] = useState(null);
  const [type, setType] = useState(null);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [detailVisible, setDetailVisible] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  useEffect(() => {
    fetchRecords();
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await userApi.getList({ page: 1, page_size: 1000 });
      if (res.code === 200) {
        setUsers(res.data.list);
      }
    } catch (error) {
      console.error('获取用户失败');
    }
  };

  const fetchRecords = async (page = 1, pageSize = 10) => {
    setLoading(true);
    try {
      const params = { page, page_size: pageSize };
      if (keyword) params.keyword = keyword;
      if (userId) params.user_id = userId;
      if (type) params.type = type;
      if (startDate) params.start_date = startDate.format('YYYY-MM-DD');
      if (endDate) params.end_date = endDate.format('YYYY-MM-DD');
      
      const res = await attendanceApi.getList(params);
      if (res.code === 200) {
        setRecords(res.data.list);
        setPagination({
          current: res.data.page,
          pageSize: res.data.pageSize,
          total: res.data.total,
        });
      }
    } catch (error) {
      message.error('获取考勤记录失败');
    } finally {
      setLoading(false);
    }
  };

  const getUserName = (id) => {
    const user = users.find(u => u.id === id);
    return user ? (user.real_name || user.username) : '-';
  };

  const getTypeTag = (type) => {
    if (type === 'clock_in') {
      return <Tag color="blue">上班打卡</Tag>;
    } else if (type === 'clock_out') {
      return <Tag color="purple">下班签退</Tag>;
    }
    return <Tag>未知</Tag>;
  };

  const getStatusTag = (status) => {
    if (status === 'normal') {
      return <Tag color="green">正常</Tag>;
    } else if (status === 'late') {
      return <Tag color="orange">迟到</Tag>;
    } else if (status === 'early') {
      return <Tag color="gold">早退</Tag>;
    }
    return <Tag>未知</Tag>;
  };

  const columns = [
    {
      title: '员工姓名',
      dataIndex: 'user_id',
      key: 'user_id',
      width: 120,
      render: (id) => getUserName(id),
    },
    {
      title: '打卡类型',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: (type) => getTypeTag(type),
    },
    {
      title: '打卡状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => getStatusTag(status),
    },
    {
      title: '打卡时间',
      dataIndex: 'clock_time',
      key: 'clock_time',
      width: 180,
      render: (text) => text ? dayjs(text).format('YYYY-MM-DD HH:mm:ss') : '-',
    },
    {
      title: '经度',
      dataIndex: 'longitude',
      key: 'longitude',
      width: 120,
      render: (text) => text || '-',
    },
    {
      title: '纬度',
      dataIndex: 'latitude',
      key: 'latitude',
      width: 120,
      render: (text) => text || '-',
    },
    {
      title: '设备信息',
      dataIndex: 'device_info',
      key: 'device_info',
      width: 150,
      render: (text) => text || '-',
    },
    {
      title: '备注',
      dataIndex: 'remark',
      key: 'remark',
      width: 120,
      render: (text) => text || '-',
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
            icon={<EyeOutlined />}
            onClick={() => showDetail(record)}
          >
            详情
          </Button>
          <Popconfirm
            title="确定要删除该记录吗？"
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

  const showDetail = async (record) => {
    try {
      const res = await attendanceApi.getById(record.id);
      if (res.code === 200) {
        setSelectedRecord(res.data);
        setDetailVisible(true);
      }
    } catch (error) {
      message.error('获取详情失败');
    }
  };

  const handleDelete = async (id) => {
    try {
      const res = await attendanceApi.delete(id);
      if (res.code === 200) {
        message.success('删除成功');
        fetchRecords();
      }
    } catch (error) {
      message.error(error.message || '删除失败');
    }
  };

  const handleSearch = () => {
    fetchRecords(1, pagination.pageSize);
  };

  const handleTableChange = (page) => {
    fetchRecords(page.current, page.pageSize);
  };

  return (
    <div>
      <h2 style={{ marginBottom: 24 }}>考勤管理</h2>
      
      <Card style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
          <Search
            placeholder="搜索员工姓名/备注"
            allowClear
            enterButton={<SearchOutlined />}
            style={{ width: 200 }}
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onSearch={handleSearch}
          />
          <Select
            style={{ width: 150 }}
            placeholder="选择员工"
            allowClear
            value={userId || undefined}
            onChange={(value) => {
              setUserId(value);
              setTimeout(() => handleSearch(), 100);
            }}
            showSearch
            optionFilterProp="children"
          >
            {users.map(u => (
              <Option key={u.id} value={u.id}>
                {u.real_name || u.username}
              </Option>
            ))}
          </Select>
          <Select
            style={{ width: 120 }}
            placeholder="打卡类型"
            allowClear
            value={type || undefined}
            onChange={(value) => {
              setType(value);
              setTimeout(() => handleSearch(), 100);
            }}
          >
            <Option value="clock_in">上班打卡</Option>
            <Option value="clock_out">下班签退</Option>
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
          <Button icon={<ReloadOutlined />} onClick={() => fetchRecords()}>
            刷新
          </Button>
        </div>
      </Card>

      <Card>
        <Table
          columns={columns}
          dataSource={records}
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
        title="考勤详情"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailVisible(false)}>
            关闭
          </Button>,
        ]}
        width={600}
      >
        {selectedRecord && (
          <Descriptions bordered column={1}>
            <Descriptions.Item label="员工姓名">{getUserName(selectedRecord.user_id)}</Descriptions.Item>
            <Descriptions.Item label="打卡类型">{getTypeTag(selectedRecord.type)}</Descriptions.Item>
            <Descriptions.Item label="打卡状态">{getStatusTag(selectedRecord.status)}</Descriptions.Item>
            <Descriptions.Item label="打卡时间">
              {selectedRecord.clock_time ? dayjs(selectedRecord.clock_time).format('YYYY-MM-DD HH:mm:ss') : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="经度">{selectedRecord.longitude || '-'}</Descriptions.Item>
            <Descriptions.Item label="纬度">{selectedRecord.latitude || '-'}</Descriptions.Item>
            <Descriptions.Item label="设备信息">{selectedRecord.device_info || '-'}</Descriptions.Item>
            <Descriptions.Item label="备注">{selectedRecord.remark || '-'}</Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  );
}

export default AttendanceManagement;
