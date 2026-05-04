import React, { useState, useEffect } from 'react';
import { Table, Card, Button, Input, InputNumber, Select, Modal, Form, message, Tag, Popconfirm, Space, Switch, Image } from 'antd';
import { PlusOutlined, SearchOutlined, ReloadOutlined, EditOutlined, DeleteOutlined, UploadOutlined } from '@ant-design/icons';
import { bannerApi } from '../utils/api';
import dayjs from 'dayjs';

const { Option } = Select;
const { Search } = Input;

function BannerManagement() {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingBanner, setEditingBanner] = useState(null);
  const [form] = Form.useForm();
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async (page = 1, pageSize = 10) => {
    setLoading(true);
    try {
      const params = { page, page_size: pageSize };
      if (keyword) params.keyword = keyword;
      if (status !== null) params.status = status;
      
      const res = await bannerApi.getList(params);
      if (res.code === 200) {
        setBanners(res.data.list);
        setPagination({
          current: res.data.page,
          pageSize: res.data.pageSize,
          total: res.data.total,
        });
      }
    } catch (error) {
      message.error('获取轮播图列表失败');
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: '图片',
      dataIndex: 'image_url',
      key: 'image_url',
      width: 120,
      render: (url) => (
        url ? (
          <Image
            width={80}
            height={50}
            src={url}
            style={{ objectFit: 'cover' }}
          />
        ) : '-'
      ),
    },
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      width: 200,
    },
    {
      title: '链接',
      dataIndex: 'link_url',
      key: 'link_url',
      width: 200,
      render: (text) => text || '-',
    },
    {
      title: '排序',
      dataIndex: 'sort_order',
      key: 'sort_order',
      width: 80,
      render: (text) => text || 0,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status, record) => (
        <Switch
          checked={status === 1}
          checkedChildren="启用"
          unCheckedChildren="禁用"
          onChange={(checked) => handleStatusChange(record.id, checked ? 1 : 0)}
        />
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
            title="确定要删除该轮播图吗？"
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
    setEditingBanner(null);
    form.resetFields();
    form.setFieldsValue({ status: 1, sort_order: 0 });
    setModalVisible(true);
  };

  const handleEdit = (record) => {
    setEditingBanner(record);
    form.setFieldsValue(record);
    setModalVisible(true);
  };

  const handleStatusChange = async (id, status) => {
    try {
      const res = await bannerApi.updateStatus(id, { status });
      if (res.code === 200) {
        message.success('状态更新成功');
        fetchBanners();
      }
    } catch (error) {
      message.error(error.message || '更新失败');
    }
  };

  const handleSubmit = async (values) => {
    try {
      if (editingBanner) {
        const res = await bannerApi.update(editingBanner.id, values);
        if (res.code === 200) {
          message.success('更新成功');
          setModalVisible(false);
          fetchBanners();
        }
      } else {
        const res = await bannerApi.create(values);
        if (res.code === 200) {
          message.success('创建成功');
          setModalVisible(false);
          fetchBanners();
        }
      }
    } catch (error) {
      message.error(error.message || '操作失败');
    }
  };

  const handleDelete = async (id) => {
    try {
      const res = await bannerApi.delete(id);
      if (res.code === 200) {
        message.success('删除成功');
        fetchBanners();
      }
    } catch (error) {
      message.error(error.message || '删除失败');
    }
  };

  const handleSearch = () => {
    fetchBanners(1, pagination.pageSize);
  };

  const handleTableChange = (page) => {
    fetchBanners(page.current, page.pageSize);
  };

  return (
    <div>
      <h2 style={{ marginBottom: 24 }}>轮播图管理</h2>
      
      <Card style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
            <Search
              placeholder="搜索标题"
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
              <Option value={1}>启用</Option>
              <Option value={0}>禁用</Option>
            </Select>
            <Button icon={<ReloadOutlined />} onClick={() => fetchBanners()}>
              刷新
            </Button>
          </div>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            新增轮播图
          </Button>
        </div>
      </Card>

      <Card>
        <Table
          columns={columns}
          dataSource={banners}
          rowKey="id"
          loading={loading}
          scroll={{ x: 1200 }}
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
        title={editingBanner ? '编辑轮播图' : '新增轮播图'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            name="title"
            label="标题"
            rules={[{ required: true, message: '请输入标题' }]}
          >
            <Input placeholder="请输入轮播图标题" />
          </Form.Item>

          <Form.Item
            name="image_url"
            label="图片URL"
            rules={[{ required: true, message: '请输入图片URL' }]}
          >
            <Input placeholder="请输入图片URL" prefix={<UploadOutlined />} />
          </Form.Item>

          <Form.Item
            name="link_url"
            label="跳转链接"
          >
            <Input placeholder="请输入跳转链接（可选）" />
          </Form.Item>

          <Form.Item
            name="sort_order"
            label="排序"
          >
            <InputNumber style={{ width: '100%' }} min={0} placeholder="数字越小越靠前" />
          </Form.Item>

          <Form.Item
            name="status"
            label="状态"
            valuePropName="checked"
          >
            <Switch checkedChildren="启用" unCheckedChildren="禁用" />
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

export default BannerManagement;
