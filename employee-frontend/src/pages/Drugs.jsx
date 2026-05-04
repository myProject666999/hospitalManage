import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Input, Select, message, Tag, Modal } from 'antd';
import { SearchOutlined, ReloadOutlined, EyeOutlined } from '@ant-design/icons';
import { drugApi } from '../utils/api';

const { Search } = Input;
const { Option } = Select;

function Drugs() {
  const [drugs, setDrugs] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [keyword, setKeyword] = useState('');
  const [detailVisible, setDetailVisible] = useState(false);
  const [selectedDrug, setSelectedDrug] = useState(null);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  useEffect(() => {
    fetchCategories();
    fetchDrugs();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await drugApi.getCategories();
      if (res.code === 200) {
        setCategories(res.data);
      }
    } catch (error) {
      console.error('获取分类失败:', error);
    }
  };

  const fetchDrugs = async (page = 1, pageSize = 10) => {
    setLoading(true);
    try {
      const params = { page, page_size: pageSize };
      if (selectedCategory) {
        params.category_id = selectedCategory;
      }
      if (keyword) {
        params.keyword = keyword;
      }
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

  const getStockTag = (stock, minStock) => {
    if (stock <= 0) {
      return <Tag color="red">缺货</Tag>;
    } else if (stock < minStock) {
      return <Tag color="orange">库存低</Tag>;
    } else {
      return <Tag color="green">正常</Tag>;
    }
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
      dataIndex: ['category', 'name'],
      key: 'category',
      width: 100,
    },
    {
      title: '规格',
      dataIndex: 'specification',
      key: 'specification',
      width: 100,
    },
    {
      title: '单位',
      dataIndex: 'unit',
      key: 'unit',
      width: 80,
    },
    {
      title: '单价',
      dataIndex: 'price',
      key: 'price',
      width: 100,
      render: (text) => `¥${text?.toFixed(2) || 0}`,
    },
    {
      title: '库存',
      dataIndex: 'stock',
      key: 'stock',
      width: 120,
      render: (stock, record) => (
        <span>
          {stock} {record.unit}
          {getStockTag(stock, record.minStock)}
        </span>
      ),
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

  const showDetail = (drug) => {
    setSelectedDrug(drug);
    setDetailVisible(true);
  };

  const handleSearch = () => {
    fetchDrugs(1, pagination.pageSize);
  };

  const handleTableChange = (page) => {
    fetchDrugs(page.current, page.pageSize);
  };

  const handleCategoryChange = (value) => {
    setSelectedCategory(value);
  };

  return (
    <div>
      <h2 style={{ marginBottom: 24 }}>药品查询</h2>
      
      <Card style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
          <Select
            style={{ width: 200 }}
            placeholder="选择分类"
            allowClear
            value={selectedCategory || undefined}
            onChange={handleCategoryChange}
          >
            {categories.map((cat) => (
              <Option key={cat.id} value={cat.id}>
                {cat.name}
              </Option>
            ))}
          </Select>
          <Search
            placeholder="搜索药品名称/编码"
            allowClear
            enterButton={<SearchOutlined />}
            style={{ width: 300 }}
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onSearch={handleSearch}
          />
          <Button icon={<ReloadOutlined />} onClick={() => fetchDrugs()}>
            刷新
          </Button>
        </div>
      </Card>

      <Card>
        <Table
          columns={columns}
          dataSource={drugs}
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
        title="药品详情"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailVisible(false)}>
            关闭
          </Button>,
        ]}
      >
        {selectedDrug && (
          <div>
            <p><strong>药品编码：</strong>{selectedDrug.code}</p>
            <p><strong>药品名称：</strong>{selectedDrug.name}</p>
            <p><strong>分类：</strong>{selectedDrug.category?.name}</p>
            <p><strong>规格：</strong>{selectedDrug.specification}</p>
            <p><strong>单位：</strong>{selectedDrug.unit}</p>
            <p><strong>单价：</strong>¥{selectedDrug.price?.toFixed(2) || 0}</p>
            <p><strong>库存：</strong>{selectedDrug.stock} {selectedDrug.unit}</p>
            <p><strong>最低库存：</strong>{selectedDrug.minStock} {selectedDrug.unit}</p>
            <p><strong>状态：</strong>{selectedDrug.status === 1 ? '正常' : '停用'}</p>
            <p><strong>描述：</strong>{selectedDrug.description || '无'}</p>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default Drugs;
