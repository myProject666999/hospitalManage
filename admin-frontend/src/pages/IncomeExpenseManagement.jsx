import React, { useState, useEffect } from 'react';
import { Table, Card, Button, Input, Select, DatePicker, Modal, Form, message, Tag, Popconfirm, Space, InputNumber } from 'antd';
import { PlusOutlined, SearchOutlined, ReloadOutlined, EditOutlined, DeleteOutlined, ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';
import { incomeExpenseApi, userApi } from '../utils/api';
import dayjs from 'dayjs';

const { Option } = Select;
const { Search } = Input;
const { TextArea } = Input;

function IncomeExpenseManagement() {
  const [records, setRecords] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [type, setType] = useState(null);
  const [category, setCategory] = useState('');
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [form] = Form.useForm();
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
      if (type) params.type = type;
      if (category) params.category = category;
      if (startDate) params.start_date = startDate.format('YYYY-MM-DD');
      if (endDate) params.end_date = endDate.format('YYYY-MM-DD');
      
      const res = await incomeExpenseApi.getList(params);
      if (res.code === 200) {
        setRecords(res.data.list);
        setPagination({
          current: res.data.page,
          pageSize: res.data.pageSize,
          total: res.data.total,
        });
      }
    } catch (error) {
      message.error('获取收支记录失败');
    } finally {
      setLoading(false);
    }
  };

  const getUserName = (id) => {
    const user = users.find(u => u.id === id);
    return user ? (user.real_name || user.username) : '-';
  };

  const getTypeTag = (type) => {
    if (type === 'income') {
      return <Tag color="green"><ArrowDownOutlined /> 收入</Tag>;
    } else {
      return <Tag color="orange"><ArrowUpOutlined /> 支出</Tag>;
    }
  };

  const columns = [
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: (text) => getTypeTag(text),
    },
    {
      title: '金额',
      dataIndex: 'amount',
      key: 'amount',
      width: 120,
      render: (text, record) => (
        <span style={{ color: record.type === 'income' ? '#52c41a' : '#fa8c16', fontWeight: 'bold' }}>
          {record.type === 'income' ? '+' : '-'}¥{text?.toFixed(2) || 0}
        </span>
      ),
    },
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
      width: 120,
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      width: 150,
      render: (text) => text || '-',
    },
    {
      title: '操作人',
      dataIndex: 'user_id',
      key: 'user_id',
      width: 100,
      render: (id) => getUserName(id),
    },
    {
      title: '备注',
      dataIndex: 'remark',
      key: 'remark',
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

  const handleAdd = () => {
    setEditingRecord(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (record) => {
    setEditingRecord(record);
    form.setFieldsValue(record);
    setModalVisible(true);
  };

  const handleSubmit = async (values) => {
    try {
      if (editingRecord) {
        const res = await incomeExpenseApi.update(editingRecord.id, values);
        if (res.code === 200) {
          message.success('更新成功');
          setModalVisible(false);
          fetchRecords();
        }
      } else {
        const res = await incomeExpenseApi.create(values);
        if (res.code === 200) {
          message.success('创建成功');
          setModalVisible(false);
          fetchRecords();
        }
      }
    } catch (error) {
      message.error(error.message || '操作失败');
    }
  };

  const handleDelete = async (id) => {
    try {
      const res = await incomeExpenseApi.delete(id);
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
      <h2 style={{ marginBottom: 24 }}>收支明细管理</h2>
      
      <Card style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
            <Search
              placeholder="搜索描述/分类/备注"
              allowClear
              enterButton={<SearchOutlined />}
              style={{ width: 220 }}
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onSearch={handleSearch}
            />
            <Select
              style={{ width: 120 }}
              placeholder="选择类型"
              allowClear
              value={type || undefined}
              onChange={(value) => {
                setType(value);
                setTimeout(() => handleSearch(), 100);
              }}
            >
              <Option value="income">收入</Option>
              <Option value="expense">支出</Option>
            </Select>
            <Input
              style={{ width: 120 }}
              placeholder="分类"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              onPressEnter={handleSearch}
            />
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
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            新增记录
          </Button>
        </div>
      </Card>

      <Card>
        <Table
          columns={columns}
          dataSource={records}
          rowKey="id"
          loading={loading}
          scroll={{ x: 1300 }}
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
        title={editingRecord ? '编辑收支记录' : '新增收支记录'}
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
            name="type"
            label="类型"
            rules={[{ required: true, message: '请选择类型' }]}
          >
            <Select placeholder="请选择类型">
              <Option value="income">收入</Option>
              <Option value="expense">支出</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="amount"
            label="金额"
            rules={[{ required: true, message: '请输入金额' }]}
          >
            <InputNumber
              min={0.01}
              precision={2}
              style={{ width: '100%' }}
              placeholder="请输入金额"
              prefix="¥"
            />
          </Form.Item>

          <Form.Item
            name="category"
            label="分类"
            rules={[{ required: true, message: '请输入分类' }]}
          >
            <Input placeholder="请输入分类，如：药品销售、办公用品等" />
          </Form.Item>

          <Form.Item
            name="description"
            label="描述"
          >
            <Input placeholder="请输入描述（可选）" />
          </Form.Item>

          <Form.Item
            name="remark"
            label="备注"
          >
            <TextArea rows={3} placeholder="请输入备注（可选）" />
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

export default IncomeExpenseManagement;
