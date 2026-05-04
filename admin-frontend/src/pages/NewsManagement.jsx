import React, { useState, useEffect } from 'react';
import { Table, Card, Button, Input, Select, Modal, Form, message, Tag, Popconfirm, Space, Switch, Descriptions, Divider } from 'antd';
import { PlusOutlined, SearchOutlined, ReloadOutlined, EditOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons';
import { newsApi } from '../utils/api';
import dayjs from 'dayjs';

const { Option } = Select;
const { Search } = Input;
const { TextArea } = Input;

function NewsManagement() {
  const [newsList, setNewsList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [detailVisible, setDetailVisible] = useState(false);
  const [selectedNews, setSelectedNews] = useState(null);
  const [editingNews, setEditingNews] = useState(null);
  const [form] = Form.useForm();
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  useEffect(() => {
    fetchNews();
  }, []);

  const fetchNews = async (page = 1, pageSize = 10) => {
    setLoading(true);
    try {
      const params = { page, page_size: pageSize };
      if (keyword) params.keyword = keyword;
      if (status !== null) params.status = status;
      
      const res = await newsApi.getList(params);
      if (res.code === 200) {
        setNewsList(res.data.list);
        setPagination({
          current: res.data.page,
          pageSize: res.data.pageSize,
          total: res.data.total,
        });
      }
    } catch (error) {
      message.error('获取新闻列表失败');
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      width: 200,
    },
    {
      title: '作者',
      dataIndex: 'author',
      key: 'author',
      width: 120,
      render: (text) => text || '-',
    },
    {
      title: '阅读量',
      dataIndex: 'views',
      key: 'views',
      width: 100,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status, record) => (
        <Switch
          checked={status === 1}
          checkedChildren="正常"
          unCheckedChildren="禁用"
          onChange={(checked) => handleStatusChange(record.id, checked ? 1 : 0)}
        />
      ),
    },
    {
      title: '发布时间',
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
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除该新闻吗？"
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
    setEditingNews(null);
    form.resetFields();
    form.setFieldsValue({ status: 1, views: 0 });
    setModalVisible(true);
  };

  const handleEdit = (record) => {
    setEditingNews(record);
    form.setFieldsValue(record);
    setModalVisible(true);
  };

  const showDetail = async (news) => {
    try {
      const res = await newsApi.getById(news.id);
      if (res.code === 200) {
        setSelectedNews(res.data);
        setDetailVisible(true);
      }
    } catch (error) {
      message.error('获取新闻详情失败');
    }
  };

  const handleStatusChange = async (id, status) => {
    try {
      const res = await newsApi.updateStatus(id, { status });
      if (res.code === 200) {
        message.success('状态更新成功');
        fetchNews();
      }
    } catch (error) {
      message.error(error.message || '更新失败');
    }
  };

  const handleSubmit = async (values) => {
    try {
      if (editingNews) {
        const res = await newsApi.update(editingNews.id, values);
        if (res.code === 200) {
          message.success('更新成功');
          setModalVisible(false);
          fetchNews();
        }
      } else {
        const res = await newsApi.create(values);
        if (res.code === 200) {
          message.success('创建成功');
          setModalVisible(false);
          fetchNews();
        }
      }
    } catch (error) {
      message.error(error.message || '操作失败');
    }
  };

  const handleDelete = async (id) => {
    try {
      const res = await newsApi.delete(id);
      if (res.code === 200) {
        message.success('删除成功');
        fetchNews();
      }
    } catch (error) {
      message.error(error.message || '删除失败');
    }
  };

  const handleSearch = () => {
    fetchNews(1, pagination.pageSize);
  };

  const handleTableChange = (page) => {
    fetchNews(page.current, page.pageSize);
  };

  return (
    <div>
      <h2 style={{ marginBottom: 24 }}>新闻公告管理</h2>
      
      <Card style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
            <Search
              placeholder="搜索标题/作者"
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
            <Button icon={<ReloadOutlined />} onClick={() => fetchNews()}>
              刷新
            </Button>
          </div>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            新增新闻
          </Button>
        </div>
      </Card>

      <Card>
        <Table
          columns={columns}
          dataSource={newsList}
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
        title="新闻详情"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailVisible(false)}>
            关闭
          </Button>,
        ]}
        width={700}
      >
        {selectedNews && (
          <div>
            <Descriptions bordered column={2}>
              <Descriptions.Item label="标题">{selectedNews.title}</Descriptions.Item>
              <Descriptions.Item label="作者">{selectedNews.author || '-'}</Descriptions.Item>
              <Descriptions.Item label="阅读量">{selectedNews.views || 0}</Descriptions.Item>
              <Descriptions.Item label="状态">
                {selectedNews.status === 1 ? <Tag color="green">正常</Tag> : <Tag color="red">禁用</Tag>}
              </Descriptions.Item>
              <Descriptions.Item label="发布时间">{dayjs(selectedNews.created_at).format('YYYY-MM-DD HH:mm:ss')}</Descriptions.Item>
              <Descriptions.Item label="更新时间">{dayjs(selectedNews.updated_at).format('YYYY-MM-DD HH:mm:ss')}</Descriptions.Item>
            </Descriptions>

            <Divider orientation="left">内容</Divider>
            <div style={{ lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>
              {selectedNews.content || '暂无内容'}
            </div>
          </div>
        )}
      </Modal>

      <Modal
        title={editingNews ? '编辑新闻' : '新增新闻'}
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
            <Input placeholder="请输入新闻标题" />
          </Form.Item>

          <Form.Item
            name="author"
            label="作者"
          >
            <Input placeholder="请输入作者（可选）" />
          </Form.Item>

          <Form.Item
            name="content"
            label="内容"
            rules={[{ required: true, message: '请输入内容' }]}
          >
            <TextArea rows={8} placeholder="请输入新闻内容" />
          </Form.Item>

          <Form.Item
            name="status"
            label="状态"
            valuePropName="checked"
          >
            <Switch checkedChildren="正常" unCheckedChildren="禁用" />
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

export default NewsManagement;
