import React, { useState, useEffect } from 'react';
import { Table, Card, Button, Input, Select, Modal, Form, message, Tag, Popconfirm, Space, Descriptions, Divider } from 'antd';
import { SearchOutlined, ReloadOutlined, EyeOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { orderApi, drugApi, userApi } from '../utils/api';
import dayjs from 'dayjs';

const { Option } = Select;
const { Search } = Input;

function OrderManagement() {
  const [orders, setOrders] = useState([]);
  const [drugs, setDrugs] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState(null);
  const [detailVisible, setDetailVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [statusModalVisible, setStatusModalVisible] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const [form] = Form.useForm();
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  useEffect(() => {
    fetchOrders();
    fetchDrugs();
    fetchUsers();
  }, []);

  const fetchDrugs = async () => {
    try {
      const res = await drugApi.getList({ page: 1, page_size: 1000 });
      if (res.code === 200) {
        setDrugs(res.data.list);
      }
    } catch (error) {
      console.error('获取药品失败');
    }
  };

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

  const fetchOrders = async (page = 1, pageSize = 10) => {
    setLoading(true);
    try {
      const params = { page, page_size: pageSize };
      if (keyword) params.keyword = keyword;
      if (status !== null) params.status = status;
      
      const res = await orderApi.getList(params);
      if (res.code === 200) {
        setOrders(res.data.list);
        setPagination({
          current: res.data.page,
          pageSize: res.data.pageSize,
          total: res.data.total,
        });
      }
    } catch (error) {
      message.error('获取订单列表失败');
    } finally {
      setLoading(false);
    }
  };

  const getStatusTag = (status) => {
    const statusMap = {
      pending: { text: '待处理', color: 'orange' },
      completed: { text: '已完成', color: 'green' },
      cancelled: { text: '已取消', color: 'red' },
    };
    const info = statusMap[status] || { text: '未知', color: 'default' };
    return <Tag color={info.color}>{info.text}</Tag>;
  };

  const getUserName = (id) => {
    const user = users.find(u => u.id === id);
    return user ? (user.real_name || user.username) : '-';
  };

  const getDrugName = (id) => {
    const drug = drugs.find(d => d.id === id);
    return drug ? drug.name : '-';
  };

  const columns = [
    {
      title: '订单编号',
      dataIndex: 'order_no',
      key: 'order_no',
      width: 180,
    },
    {
      title: '客户姓名',
      dataIndex: 'customer_name',
      key: 'customer_name',
      width: 100,
    },
    {
      title: '联系电话',
      dataIndex: 'customer_phone',
      key: 'customer_phone',
      width: 120,
      render: (text) => text || '-',
    },
    {
      title: '开单人',
      dataIndex: 'user_id',
      key: 'user_id',
      width: 100,
      render: (id) => getUserName(id),
    },
    {
      title: '订单金额',
      dataIndex: 'total_amount',
      key: 'total_amount',
      width: 120,
      render: (text) => <span style={{ fontWeight: 'bold', color: '#1890ff' }}>¥{text?.toFixed(2) || 0}</span>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => getStatusTag(status),
    },
    {
      title: '备注',
      dataIndex: 'remark',
      key: 'remark',
      width: 150,
      render: (text) => text || '-',
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 160,
      render: (text) => dayjs(text).format('YYYY-MM-DD HH:mm:ss'),
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
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
          {record.status === 'pending' && (
            <Button
              type="link"
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleStatusEdit(record)}
            >
              状态
            </Button>
          )}
          <Popconfirm
            title="确定要删除该订单吗？"
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

  const showDetail = async (order) => {
    try {
      const res = await orderApi.getById(order.id);
      if (res.code === 200) {
        setSelectedOrder(res.data);
        setDetailVisible(true);
      }
    } catch (error) {
      message.error('获取订单详情失败');
    }
  };

  const handleStatusEdit = (order) => {
    setEditingOrder(order);
    form.setFieldsValue({ status: order.status });
    setStatusModalVisible(true);
  };

  const handleStatusSubmit = async (values) => {
    try {
      const res = await orderApi.updateStatus(editingOrder.id, {
        status: values.status,
      });
      if (res.code === 200) {
        message.success('状态更新成功');
        setStatusModalVisible(false);
        fetchOrders();
      }
    } catch (error) {
      message.error(error.message || '更新失败');
    }
  };

  const handleDelete = async (id) => {
    try {
      const res = await orderApi.delete(id);
      if (res.code === 200) {
        message.success('删除成功');
        fetchOrders();
      }
    } catch (error) {
      message.error(error.message || '删除失败');
    }
  };

  const handleSearch = () => {
    fetchOrders(1, pagination.pageSize);
  };

  const handleTableChange = (page) => {
    fetchOrders(page.current, page.pageSize);
  };

  return (
    <div>
      <h2 style={{ marginBottom: 24 }}>订单管理</h2>
      
      <Card style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
          <Search
            placeholder="搜索订单编号/客户姓名/电话"
            allowClear
            enterButton={<SearchOutlined />}
            style={{ width: 280 }}
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onSearch={handleSearch}
          />
          <Select
            style={{ width: 140 }}
            placeholder="选择状态"
            allowClear
            value={status !== null ? status : undefined}
            onChange={(value) => {
              setStatus(value);
              setTimeout(() => handleSearch(), 100);
            }}
          >
            <Option value="pending">待处理</Option>
            <Option value="completed">已完成</Option>
            <Option value="cancelled">已取消</Option>
          </Select>
          <Button icon={<ReloadOutlined />} onClick={() => fetchOrders()}>
            刷新
          </Button>
        </div>
      </Card>

      <Card>
        <Table
          columns={columns}
          dataSource={orders}
          rowKey="id"
          loading={loading}
          scroll={{ x: 1500 }}
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
        title="订单详情"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailVisible(false)}>
            关闭
          </Button>,
        ]}
        width={800}
      >
        {selectedOrder && (
          <div>
            <Descriptions bordered column={2}>
              <Descriptions.Item label="订单编号">{selectedOrder.order_no}</Descriptions.Item>
              <Descriptions.Item label="状态">{getStatusTag(selectedOrder.status)}</Descriptions.Item>
              <Descriptions.Item label="客户姓名">{selectedOrder.customer_name}</Descriptions.Item>
              <Descriptions.Item label="联系电话">{selectedOrder.customer_phone || '-'}</Descriptions.Item>
              <Descriptions.Item label="开单人">{getUserName(selectedOrder.user_id)}</Descriptions.Item>
              <Descriptions.Item label="订单金额" style={{ color: '#1890ff', fontWeight: 'bold' }}>
                ¥{selectedOrder.total_amount?.toFixed(2) || 0}
              </Descriptions.Item>
              <Descriptions.Item label="备注" span={2}>{selectedOrder.remark || '-'}</Descriptions.Item>
              <Descriptions.Item label="创建时间">{dayjs(selectedOrder.created_at).format('YYYY-MM-DD HH:mm:ss')}</Descriptions.Item>
              <Descriptions.Item label="更新时间">{dayjs(selectedOrder.updated_at).format('YYYY-MM-DD HH:mm:ss')}</Descriptions.Item>
            </Descriptions>

            <Divider orientation="left">药品明细</Divider>
            <Table
              dataSource={selectedOrder.items || []}
              rowKey="id"
              pagination={false}
              size="small"
            >
              <Table.Column title="药品名称" dataIndex="drug_id" render={(id) => getDrugName(id)} />
              <Table.Column title="单价" dataIndex="price" render={(text) => `¥${text?.toFixed(2) || 0}`} />
              <Table.Column title="数量" dataIndex="quantity" />
              <Table.Column title="小计" dataIndex="subtotal" render={(text) => `¥${text?.toFixed(2) || 0}`} />
            </Table>
          </div>
        )}
      </Modal>

      <Modal
        title="修改订单状态"
        open={statusModalVisible}
        onCancel={() => setStatusModalVisible(false)}
        footer={null}
        width={400}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleStatusSubmit}
        >
          <Form.Item
            name="status"
            label="订单状态"
            rules={[{ required: true, message: '请选择状态' }]}
          >
            <Select placeholder="请选择订单状态">
              <Option value="pending">待处理</Option>
              <Option value="completed">已完成</Option>
              <Option value="cancelled">已取消</Option>
            </Select>
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Button style={{ marginRight: 8 }} onClick={() => setStatusModalVisible(false)}>
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

export default OrderManagement;
