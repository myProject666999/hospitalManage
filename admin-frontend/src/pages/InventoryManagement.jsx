import React, { useState, useEffect } from 'react';
import { Table, Card, Button, Input, Select, DatePicker, Modal, Form, message, Tag, Popconfirm, Space } from 'antd';
import { SearchOutlined, ReloadOutlined, EyeOutlined, DeleteOutlined, ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';
import { inventoryApi, drugApi, userApi } from '../utils/api';
import dayjs from 'dayjs';

const { Option } = Select;
const { Search } = Input;

function InventoryManagement() {
  const [records, setRecords] = useState([]);
  const [drugs, setDrugs] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [type, setType] = useState(null);
  const [drugId, setDrugId] = useState(null);
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

  const fetchRecords = async (page = 1, pageSize = 10) => {
    setLoading(true);
    try {
      const params = { page, page_size: pageSize };
      if (keyword) params.keyword = keyword;
      if (type) params.type = type;
      if (drugId) params.drug_id = drugId;
      if (startDate) params.start_date = startDate.format('YYYY-MM-DD');
      if (endDate) params.end_date = endDate.format('YYYY-MM-DD');
      
      const res = await inventoryApi.getList(params);
      if (res.code === 200) {
        setRecords(res.data.list);
        setPagination({
          current: res.data.page,
          pageSize: res.data.pageSize,
          total: res.data.total,
        });
      }
    } catch (error) {
      message.error('获取出入库记录失败');
    } finally {
      setLoading(false);
    }
  };

  const getDrugName = (id) => {
    const drug = drugs.find(d => d.id === id);
    return drug ? drug.name : '-';
  };

  const getUserName = (id) => {
    const user = users.find(u => u.id === id);
    return user ? (user.real_name || user.username) : '-';
  };

  const getTypeTag = (type) => {
    if (type === 'in') {
      return <Tag color="blue"><ArrowDownOutlined /> 入库</Tag>;
    } else if (type === 'out') {
      return <Tag color="orange"><ArrowUpOutlined /> 出库</Tag>;
    }
    return <Tag>未知</Tag>;
  };

  const columns = [
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: (type) => getTypeTag(type),
    },
    {
      title: '药品名称',
      dataIndex: 'drug_id',
      key: 'drug_id',
      width: 150,
      render: (id) => getDrugName(id),
    },
    {
      title: '数量',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 100,
    },
    {
      title: '单价',
      dataIndex: 'unit_price',
      key: 'unit_price',
      width: 100,
      render: (text) => text ? `¥${text.toFixed(2)}` : '-',
    },
    {
      title: '总金额',
      dataIndex: 'total_amount',
      key: 'total_amount',
      width: 100,
      render: (text) => text ? `¥${text.toFixed(2)}` : '-',
    },
    {
      title: '操作人',
      dataIndex: 'user_id',
      key: 'user_id',
      width: 100,
      render: (id) => getUserName(id),
    },
    {
      title: '供应商/客户',
      dataIndex: 'supplier_customer',
      key: 'supplier_customer',
      width: 120,
      render: (text) => text || '-',
    },
    {
      title: '批次号',
      dataIndex: 'batch_number',
      key: 'batch_number',
      width: 120,
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
      const res = await inventoryApi.getById(record.id);
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
      const res = await inventoryApi.delete(id);
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
      <h2 style={{ marginBottom: 24 }}>药品出入库管理</h2>
      
      <Card style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
          <Search
            placeholder="搜索备注/批次号"
            allowClear
            enterButton={<SearchOutlined />}
            style={{ width: 200 }}
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
            <Option value="in">入库</Option>
            <Option value="out">出库</Option>
          </Select>
          <Select
            style={{ width: 150 }}
            placeholder="选择药品"
            allowClear
            value={drugId || undefined}
            onChange={(value) => {
              setDrugId(value);
              setTimeout(() => handleSearch(), 100);
            }}
            showSearch
            optionFilterProp="children"
          >
            {drugs.map(d => (
              <Option key={d.id} value={d.id}>
                {d.name}
              </Option>
            ))}
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
        title="出入库详情"
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
          <div>
            <Table
              dataSource={[selectedRecord]}
              rowKey="id"
              pagination={false}
              columns={[
                { title: '类型', dataIndex: 'type', render: (type) => getTypeTag(type) },
                { title: '药品名称', dataIndex: 'drug_id', render: (id) => getDrugName(id) },
                { title: '数量', dataIndex: 'quantity' },
                { title: '单价', dataIndex: 'unit_price', render: (text) => text ? `¥${text.toFixed(2)}` : '-' },
                { title: '总金额', dataIndex: 'total_amount', render: (text) => text ? `¥${text.toFixed(2)}` : '-' },
              ]}
            />
            <Table
              dataSource={[selectedRecord]}
              rowKey="id"
              pagination={false}
              columns={[
                { title: '操作人', dataIndex: 'user_id', render: (id) => getUserName(id) },
                { title: '供应商/客户', dataIndex: 'supplier_customer', render: (text) => text || '-' },
                { title: '批次号', dataIndex: 'batch_number', render: (text) => text || '-' },
              ]}
            />
            <Table
              dataSource={[selectedRecord]}
              rowKey="id"
              pagination={false}
              columns={[
                { title: '备注', dataIndex: 'remark', render: (text) => text || '-' },
                { title: '操作时间', dataIndex: 'created_at', render: (text) => dayjs(text).format('YYYY-MM-DD HH:mm:ss') },
              ]}
            />
          </div>
        )}
      </Modal>
    </div>
  );
}

export default InventoryManagement;
