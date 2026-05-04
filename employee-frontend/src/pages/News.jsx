import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Input, message, Modal, Tag, Descriptions, Divider } from 'antd';
import { SearchOutlined, ReloadOutlined, EyeOutlined } from '@ant-design/icons';
import { newsApi } from '../utils/api';
import dayjs from 'dayjs';

const { Search } = Input;

function News() {
  const [newsList, setNewsList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [detailVisible, setDetailVisible] = useState(false);
  const [selectedNews, setSelectedNews] = useState(null);
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
      if (keyword) {
        params.keyword = keyword;
      }
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
      render: (status) => (
        <Tag color={status === 1 ? 'green' : 'red'}>
          {status === 1 ? '正常' : '停用'}
        </Tag>
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
      width: 100,
      render: (_, record) => (
        <Button
          type="link"
          icon={<EyeOutlined />}
          onClick={() => showDetail(record)}
        >
          查看
        </Button>
      ),
    },
  ];

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

  const handleSearch = () => {
    fetchNews(1, pagination.pageSize);
  };

  const handleTableChange = (page) => {
    fetchNews(page.current, page.pageSize);
  };

  return (
    <div>
      <h2 style={{ marginBottom: 24 }}>新闻公告</h2>
      
      <Card style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
          <Search
            placeholder="搜索新闻标题"
            allowClear
            enterButton={<SearchOutlined />}
            style={{ width: 300 }}
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onSearch={handleSearch}
          />
          <Button icon={<ReloadOutlined />} onClick={() => fetchNews()}>
            刷新
          </Button>
        </div>
      </Card>

      <Card>
        <Table
          columns={columns}
          dataSource={newsList}
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
            <Descriptions bordered column={1}>
              <Descriptions.Item label="标题">{selectedNews.title}</Descriptions.Item>
              <Descriptions.Item label="作者">{selectedNews.author || '-'}</Descriptions.Item>
              <Descriptions.Item label="阅读量">{selectedNews.views || 0}</Descriptions.Item>
              <Descriptions.Item label="发布时间">{dayjs(selectedNews.created_at).format('YYYY-MM-DD HH:mm:ss')}</Descriptions.Item>
            </Descriptions>
            <Divider orientation="left">内容</Divider>
            <div style={{ lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>
              {selectedNews.content || '暂无内容'}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default News;
