import React, { useState, useEffect } from 'react';
import { Table, Card, Button, Input, Select, Modal, Form, message, Tag, Popconfirm, Space, InputNumber } from 'antd';
import { PlusOutlined, SearchOutlined, ReloadOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { drugApi } from '../utils/api';
import dayjs from 'dayjs';

const { Option } = Select;
const { Search } = Input;

function DrugManagement() {
  const [drugs, setDrugs] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [categoryId, setCategoryId] = useState(null);
  const [status, setStatus] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingDrug, setEditingDrug] = useState(null);
  const [form] = Form.useForm();
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  useEffect(() => {
    fetchDrugs();
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await drugApi.getAllCategories();
      if (res.code === 200) {
        setCategories(res.data);
      }
    } catch (error) {
      console.error('获取分类失败');
    }
  };

  const fetchDrugs = async (page = 1, pageSize = 10) => {
    setLoading(true);
    try {
      const params = { page, page_size: pageSize };
      if (keyword) params.keyword = keyword;
      if (categoryId) params.category_id = categoryId;
      if (status !== null) params.status = status;
      
      const res = await drugApi.getList(params);
      if (res.code === 200) {
        setDrugs(res.data.list);
        setPagination({
          current: res.data.page,
          pageSize: res.data.pageSize,
          total: res.data.total,
        });
      }
    } catch (error) {
      message.error('获取药品列表失败');
    } finally {
      setLoading(false);
    }
  };

  const getCategoryName = (id) => {
    const cat = categories.find(c => c.id === id);
    return cat ? cat.name : '-';
  };

  const columns = [
    {
      title: '药品编码',
      dataIndex: 'code',
      key: 'code',
      width: 120,
    },
    {
      title: '药品名称',
      dataIndex: 'name',
      key: 'name',
      width: 150,
    },
    {
      title: '分类',
      dataIndex: 'category_id',
      key: 'category',
      width: 120,
      render: (id) => getCategoryName(id),
    },
    {
      title: '规格',
      dataIndex: 'spec',
      key: 'spec',
      width: 100,
      render: (text) => text || '-',
    },
    {
      title: '单位',
      dataIndex: 'unit',
      key: 'unit',
      width: 80,
      render: (text) => text || '-',
    },
    {
      title: '进价',
      dataIndex: 'cost_price',
      key: 'cost_price',
      width: 100,
      render: (text) => `¥${text?.toFixed(2) || 0}`,
    },
    {
      title: '售价',
      dataIndex: 'sale_price',
      key: 'sale_price',
      width: 100,
      render: (text) => `¥${text?.toFixed(2) || 0}`,
    },
    {
      title: '库存',
      dataIndex: 'stock',
      key: 'stock',
      width: 80,
      render: (stock) => (
        <span style={{ color: stock < 10 ? '#ff4d4f' : '#52c41a' }}>
          {stock}
        </span>
      ),
    },
    {
      title: '生产厂家',
      dataIndex: 'manufacturer',
      key: 'manufacturer',
      width: 120,
      render: (text) => text || '-',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: (status) => (
        <Tag color={status === 1 ? 'green' : 'red'}>
          {status === 1 ? '正常' : '停用'}
        </Tag>
      ),
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
            title="确定要删除该药品吗？"
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
    setEditingDrug(null);
    form.resetFields();
    form.setFieldsValue({ status: 1, stock: 0 });
    setModalVisible(true);
  };

  const handleEdit = (record) => {
    setEditingDrug(record);
    form.setFieldsValue(record);
    setModalVisible(true);
  };

  const handleSubmit = async (values) => {
    try {
      if (editingDrug) {
        const res = await drugApi.update(editingDrug.id, values);
        if (res.code === 200) {
          message.success('更新成功');
          setModalVisible(false);
          fetchDrugs();
        }
      } else {
        const res = await drugApi.create(values);
        if (res.code === 200) {
          message.success('创建成功');
          setModalVisible(false);
          fetchDrugs();
        }
      }
    } catch (error) {
      message.error(error.message || '操作失败');
    }
  };

  const handleDelete = async (id) => {
    try {
      const res = await drugApi.delete(id);
      if (res.code === 200) {
        message.success('删除成功');
        fetchDrugs();
      }
    } catch (error) {
      message.error(error.message || '删除失败');
    }
  };

  const handleSearch = () => {
    fetchDrugs(1, pagination.pageSize);
  };

  const handleTableChange = (page) => {
    fetchDrugs(page.current, page.pageSize);
  };

  return (
    <div>
      <h2 style={{ marginBottom: 24 }}>药品管理</h2>
      
      <Card style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
            <Search
              placeholder="搜索药品名称/编码"
              allowClear
              enterButton={<SearchOutlined />}
              style={{ width: 250 }}
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onSearch={handleSearch}
            />
            <Select
              style={{ width: 150 }}
              placeholder="选择分类"
              allowClear
              value={categoryId || undefined}
              onChange={(value) => {
                setCategoryId(value);
                setTimeout(() => handleSearch(), 100);
              }}
            >
              {categories.map(cat => (
                <Option key={cat.id} value={cat.id}>{cat.name}</Option>
              ))}
            </Select>
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
              <Option value={0}>停用</Option>
            </Select>
            <Button icon={<ReloadOutlined />} onClick={() => fetchDrugs()}>
              刷新
            </Button>
          </div>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            新增药品
          </Button>
        </div>
      </Card>

      <Card>
        <Table
          columns={columns}
          dataSource={drugs}
          rowKey="id"
          loading={loading}
          scroll={{ x: 1800 }}
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
        title={editingDrug ? '编辑药品' : '新增药品'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={700}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Form.Item
              name="code"
              label="药品编码"
              rules={[{ required: true, message: '请输入药品编码' }]}
            >
              <Input placeholder="请输入药品编码" disabled={!!editingDrug} />
            </Form.Item>

            <Form.Item
              name="name"
              label="药品名称"
              rules={[{ required: true, message: '请输入药品名称' }]}
            >
              <Input placeholder="请输入药品名称" />
            </Form.Item>

            <Form.Item
              name="category_id"
              label="药品分类"
              rules={[{ required: true, message: '请选择药品分类' }]}
            >
              <Select placeholder="请选择药品分类">
                {categories.map(cat => (
                  <Option key={cat.id} value={cat.id}>{cat.name}</Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              name="spec"
              label="规格"
            >
              <Input placeholder="请输入规格" />
            </Form.Item>

            <Form.Item
              name="unit"
              label="单位"
            >
              <Input placeholder="请输入单位，如：盒、瓶" />
            </Form.Item>

            <Form.Item
              name="stock"
              label="库存数量"
            >
              <InputNumber style={{ width: '100%' }} min={0} placeholder="请输入库存数量" />
            </Form.Item>

            <Form.Item
              name="cost_price"
              label="进价"
            >
              <InputNumber style={{ width: '100%' }} min={0} precision={2} placeholder="请输入进价" prefix="¥" />
            </Form.Item>

            <Form.Item
              name="sale_price"
              label="售价"
            >
              <InputNumber style={{ width: '100%' }} min={0} precision={2} placeholder="请输入售价" prefix="¥" />
            </Form.Item>

            <Form.Item
              name="manufacturer"
              label="生产厂家"
            >
              <Input placeholder="请输入生产厂家" />
            </Form.Item>

            <Form.Item
              name="status"
              label="状态"
            >
              <Select placeholder="请选择状态">
                <Option value={1}>正常</Option>
                <Option value={0}>停用</Option>
              </Select>
            </Form.Item>
          </div>

          <Form.Item
            name="description"
            label="药品描述"
          >
            <Input.TextArea rows={3} placeholder="请输入药品描述" />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Button style={{ marginRight: 8 }} onClick={() => setModalVisible(false)}>
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

export default DrugManagement;
