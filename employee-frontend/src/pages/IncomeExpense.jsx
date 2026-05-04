import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Select, Input, InputNumber, Form, message, Modal, Tag, Divider, Statistic, Row, Col } from 'antd';
import { PlusOutlined, ReloadOutlined, ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';
import { incomeExpenseApi } from '../utils/api';
import dayjs from 'dayjs';

const { Option } = Select;
const { TextArea } = Input;

function IncomeExpense() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [type, setType] = useState(null);
  const [addVisible, setAddVisible] = useState(false);
  const [form] = Form.useForm();
  const [stats, setStats] = useState({
    total_income: 0,
    total_expense: 0,
    balance: 0,
  });
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  useEffect(() => {
    fetchRecords();
  }, []);

  const fetchRecords = async (page = 1, pageSize = 10) => {
    setLoading(true);
    try {
      const params = { page, page_size: pageSize };
      if (type) {
        params.type = type;
      }
      const res = await incomeExpenseApi.getMyList(params);
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
      width: 200,
      render: (text) => text || '-',
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
  ];

  const handleSubmit = async (values) => {
    try {
      const res = await incomeExpenseApi.create({
        type: values.type,
        amount: values.amount,
        category: values.category,
        description: values.description,
        remark: values.remark,
      });
      if (res.code === 200) {
        message.success('创建成功');
        setAddVisible(false);
        form.resetFields();
        fetchRecords();
      } else {
        message.error(res.message || '创建失败');
      }
    } catch (error) {
      message.error(error.message || '创建失败');
    }
  };

  const handleTypeChange = (value) => {
    setType(value);
  };

  const handleTableChange = (page) => {
    fetchRecords(page.current, page.pageSize);
  };

  return (
    <div>
      <h2 style={{ marginBottom: 24 }}>收支管理</h2>
      
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="总收入"
              value={stats.total_income}
              precision={2}
              prefix="¥"
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="总支出"
              value={stats.total_expense}
              precision={2}
              prefix="¥"
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="结余"
              value={stats.balance}
              precision={2}
              prefix="¥"
              valueStyle={{ color: stats.balance >= 0 ? '#1890ff' : '#ff4d4f' }}
            />
          </Card>
        </Col>
      </Row>

      <Card style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <Select
              style={{ width: 150 }}
              placeholder="选择类型"
              allowClear
              value={type || undefined}
              onChange={handleTypeChange}
            >
              <Option value="income">收入</Option>
              <Option value="expense">支出</Option>
            </Select>
            <Button icon={<ReloadOutlined />} onClick={() => fetchRecords()}>
              刷新
            </Button>
          </div>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setAddVisible(true)}>
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
        title="新增收支记录"
        open={addVisible}
        onCancel={() => {
          setAddVisible(false);
          form.resetFields();
        }}
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
              onClick={() => {
                setAddVisible(false);
                form.resetFields();
              }}
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

export default IncomeExpense;
