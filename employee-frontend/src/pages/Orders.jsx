import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Select, Input, InputNumber, Form, message, Modal, Tag, Descriptions, Row, Col, Statistic, Divider } from 'antd';
import { PlusOutlined, ReloadOutlined, EyeOutlined, MedicineBoxOutlined } from '@ant-design/icons';
import { orderApi, drugApi } from '../utils/api';
import dayjs from 'dayjs';

const { Option } = Select;
const { TextArea } = Input;

function Orders() {
  const [orders, setOrders] = useState([]);
  const [drugs, setDrugs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null);
  const [addVisible, setAddVisible] = useState(false);
  const [detailVisible, setDetailVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [form] = Form.useForm();
  const [orderItems, setOrderItems] = useState([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  useEffect(() => {
    fetchDrugs();
    fetchOrders();
  }, []);

  const fetchDrugs = async () => {
    try {
      const res = await drugApi.getList({ page_size: 1000 });
      if (res.code === 200) {
        setDrugs(res.data.list.filter(d => d.status === 1 && d.stock > 0));
      }
    } catch (error) {
      console.error('获取药品列表失败:', error);
    }
  };

  const fetchOrders = async (page = 1, pageSize = 10) => {
    setLoading(true);
    try {
      const params = { page, page_size: pageSize };
      if (status) {
        params.status = status;
      }
      const res = await orderApi.getMyList(params);
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
      'pending': { color: 'orange', text: '待处理' },
      'paid': { color: 'blue', text: '已付款' },
      'shipped': { color: 'cyan', text: '已发货' },
      'completed': { color: 'green', text: '已完成' },
      'cancelled': { color: 'red', text: '已取消' },
    };
    const info = statusMap[status] || { color: 'default', text: status };
    return <Tag color={info.color}>{info.text}</Tag>;
  };

  const columns = [
    {
      title: '订单编号',
      dataIndex: 'order_no',
      key: 'order_no',
      width: 180,
    },
    {
      title: '客户',
      dataIndex: 'customer',
      key: 'customer',
      width: 120,
    },
    {
      title: '电话',
      dataIndex: 'phone',
      key: 'phone',
      width: 120,
    },
    {
      title: '总金额',
      dataIndex: 'total_amount',
      key: 'total_amount',
      width: 100,
      render: (text) => `¥${text?.toFixed(2) || 0}`,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (text) => getStatusTag(text),
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
      width: 100,
      render: (_, record) => (
        <Button
          type="link"
          icon={<EyeOutlined />}
          onClick={() => showDetail(record)}
        >
          详情
        </Button>
      ),
    },
  ];

  const showDetail = (order) => {
    setSelectedOrder(order);
    setDetailVisible(true);
  };

  const addOrderItem = () => {
    setOrderItems([...orderItems, { drug_id: null, quantity: 1 }]);
  };

  const removeOrderItem = (index) => {
    const newItems = [...orderItems];
    newItems.splice(index, 1);
    setOrderItems(newItems);
  };

  const updateOrderItem = (index, field, value) => {
    const newItems = [...orderItems];
    newItems[index][field] = value;
    setOrderItems(newItems);
  };

  const calculateTotal = () => {
    return orderItems.reduce((total, item) => {
      const drug = drugs.find(d => d.id === item.drug_id);
      if (drug) {
        return total + (drug.price * item.quantity);
      }
      return total;
    }, 0);
  };

  const handleSubmit = async (values) => {
    if (orderItems.length === 0) {
      message.error('请至少添加一个药品');
      return;
    }

    const validItems = orderItems.filter(item => item.drug_id && item.quantity > 0);
    if (validItems.length === 0) {
      message.error('请完善药品信息');
      return;
    }

    try {
      const res = await orderApi.create({
        customer: values.customer,
        phone: values.phone,
        address: values.address,
        remark: values.remark,
        order_items: validItems.map(item => ({
          drug_id: item.drug_id,
          quantity: item.quantity,
        })),
      });
      if (res.code === 200) {
        message.success('订单创建成功');
        setAddVisible(false);
        form.resetFields();
        setOrderItems([]);
        fetchOrders();
        fetchDrugs();
      } else {
        message.error(res.message || '创建失败');
      }
    } catch (error) {
      message.error(error.message || '创建失败');
    }
  };

  const handleStatusChange = (value) => {
    setStatus(value);
  };

  const handleTableChange = (page) => {
    fetchOrders(page.current, page.pageSize);
  };

  return (
    <div>
      <h2 style={{ marginBottom: 24 }}>订单管理</h2>
      
      <Card style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <Select
              style={{ width: 150 }}
              placeholder="选择状态"
              allowClear
              value={status || undefined}
              onChange={handleStatusChange}
            >
              <Option value="pending">待处理</Option>
              <Option value="paid">已付款</Option>
              <Option value="shipped">已发货</Option>
              <Option value="completed">已完成</Option>
              <Option value="cancelled">已取消</Option>
            </Select>
            <Button icon={<ReloadOutlined />} onClick={() => fetchOrders()}>
              刷新
            </Button>
          </div>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => {
            setAddVisible(true);
            setOrderItems([]);
          }}>
            新增订单
          </Button>
        </div>
      </Card>

      <Card>
        <Table
          columns={columns}
          dataSource={orders}
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
        title="新增订单"
        open={addVisible}
        onCancel={() => {
          setAddVisible(false);
          form.resetFields();
          setOrderItems([]);
        }}
        footer={null}
        width={700}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="customer"
                label="客户名称"
                rules={[{ required: true, message: '请输入客户名称' }]}
              >
                <Input placeholder="请输入客户名称" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="phone"
                label="联系电话"
                rules={[{ required: true, message: '请输入联系电话' }]}
              >
                <Input placeholder="请输入联系电话" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="address"
            label="收货地址"
          >
            <Input placeholder="请输入收货地址（可选）" />
          </Form.Item>

          <Divider orientation="left">药品列表</Divider>
          
          <div style={{ marginBottom: 16 }}>
            {orderItems.map((item, index) => (
              <Row key={index} gutter={16} style={{ marginBottom: 12, alignItems: 'center' }}>
                <Col xs={24} sm={10}>
                  <Select
                    style={{ width: '100%' }}
                    placeholder="选择药品"
                    value={item.drug_id || undefined}
                    onChange={(value) => updateOrderItem(index, 'drug_id', value)}
                  >
                    {drugs.map((drug) => (
                      <Option key={drug.id} value={drug.id}>
                        {drug.name} - ¥{drug.price.toFixed(2)} (库存: {drug.stock})
                      </Option>
                    ))}
                  </Select>
                </Col>
                <Col xs={24} sm={6}>
                  <InputNumber
                    min={1}
                    style={{ width: '100%' }}
                    placeholder="数量"
                    value={item.quantity}
                    onChange={(value) => updateOrderItem(index, 'quantity', value)}
                  />
                </Col>
                <Col xs={24} sm={6}>
                  <span style={{ lineHeight: '32px' }}>
                    小计: ¥{
                      (() => {
                        const drug = drugs.find(d => d.id === item.drug_id);
                        if (drug) {
                          return (drug.price * item.quantity).toFixed(2);
                        }
                        return '0.00';
                      })()
                    }
                  </span>
                </Col>
                <Col xs={24} sm={2}>
                  <Button danger onClick={() => removeOrderItem(index)}>
                    删除
                  </Button>
                </Col>
              </Row>
            ))}
          </div>

          <div style={{ marginBottom: 16, textAlign: 'right' }}>
            <Button type="dashed" icon={<PlusOutlined />} onClick={addOrderItem}>
              添加药品
            </Button>
          </div>

          <div style={{ textAlign: 'right', marginBottom: 16, fontSize: 18, fontWeight: 'bold' }}>
            总金额: ¥{calculateTotal().toFixed(2)}
          </div>

          <Form.Item
            name="remark"
            label="备注"
          >
            <TextArea rows={2} placeholder="请输入备注（可选）" />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Button
              style={{ marginRight: 8 }}
              onClick={() => {
                setAddVisible(false);
                form.resetFields();
                setOrderItems([]);
              }}
            >
              取消
            </Button>
            <Button type="primary" htmlType="submit">
              确认下单
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="订单详情"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailVisible(false)}>
            关闭
          </Button>,
        ]}
        width={600}
      >
        {selectedOrder && (
          <div>
            <Descriptions bordered column={1}>
              <Descriptions.Item label="订单编号">{selectedOrder.order_no}</Descriptions.Item>
              <Descriptions.Item label="客户名称">{selectedOrder.customer || '-'}</Descriptions.Item>
              <Descriptions.Item label="联系电话">{selectedOrder.phone || '-'}</Descriptions.Item>
              <Descriptions.Item label="收货地址">{selectedOrder.address || '-'}</Descriptions.Item>
              <Descriptions.Item label="总金额">¥{selectedOrder.total_amount?.toFixed(2) || 0}</Descriptions.Item>
              <Descriptions.Item label="状态">{getStatusTag(selectedOrder.status)}</Descriptions.Item>
              <Descriptions.Item label="操作员">{selectedOrder.operator?.real_name || selectedOrder.operator?.username || '-'}</Descriptions.Item>
              <Descriptions.Item label="创建时间">{dayjs(selectedOrder.created_at).format('YYYY-MM-DD HH:mm:ss')}</Descriptions.Item>
              <Descriptions.Item label="备注">{selectedOrder.remark || '-'}</Descriptions.Item>
            </Descriptions>

            <Divider orientation="left">订单药品</Divider>
            {selectedOrder.order_items?.length > 0 ? (
              <Table
                dataSource={selectedOrder.order_items}
                rowKey="id"
                pagination={false}
                columns={[
                  { title: '药品名称', dataIndex: ['drug', 'name'], key: 'name' },
                  { title: '规格', dataIndex: ['drug', 'specification'], key: 'specification', render: (text) => text || '-' },
                  { title: '数量', dataIndex: 'quantity', key: 'quantity', render: (text, record) => `${text} ${record.drug?.unit || ''}` },
                  { title: '单价', dataIndex: 'unit_price', key: 'unit_price', render: (text) => `¥${text?.toFixed(2) || 0}` },
                  { title: '小计', dataIndex: 'amount', key: 'amount', render: (text) => `¥${text?.toFixed(2) || 0}` },
                ]}
              />
            ) : (
              <p style={{ textAlign: 'center', color: '#999' }}>暂无药品数据</p>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}

export default Orders;
