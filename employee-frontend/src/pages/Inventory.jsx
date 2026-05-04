import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Select, Input, InputNumber, Form, message, Modal, Tag, Tabs } from 'antd';
import { PlusOutlined, ReloadOutlined, ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';
import { inventoryApi, drugApi } from '../utils/api';
import dayjs from 'dayjs';

const { Option } = Select;
const { TextArea } = Input;

function Inventory() {
  const [records, setRecords] = useState([]);
  const [drugs, setDrugs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [type, setType] = useState(null);
  const [addVisible, setAddVisible] = useState(false);
  const [form] = Form.useForm();
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  useEffect(() => {
    fetchDrugs();
    fetchRecords();
  }, []);

  const fetchDrugs = async () => {
    try {
      const res = await drugApi.getList({ page_size: 1000 });
      if (res.code === 200) {
        setDrugs(res.data.list);
      }
    } catch (error) {
      console.error('获取药品列表失败:', error);
    }
  };

  const fetchRecords = async (page = 1, pageSize = 10) => {
    setLoading(true);
    try {
      const params = { page, page_size: pageSize };
      if (type) {
        params.type = type;
      }
      const res = await inventoryApi.getMyList(params);
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

  const getTypeTag = (type) => {
    if (type === 'in') {
      return <Tag color="green"><ArrowDownOutlined /> 入库</Tag>;
    } else {
      return <Tag color="orange"><ArrowUpOutlined /> 出库</Tag>;
    }
  };

  const columns = [
    {
      title: '药品',
      dataIndex: ['drug', 'name'],
      key: 'drug',
      width: 150,
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: (text) => getTypeTag(text),
    },
    {
      title: '数量',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 100,
      render: (text, record) => (
        <span>{text} {record.drug?.unit}</span>
      ),
    },
    {
      title: '变动前库存',
      dataIndex: 'before_stock',
      key: 'before_stock',
      width: 100,
      render: (text, record) => (
        <span>{text} {record.drug?.unit}</span>
      ),
    },
    {
      title: '变动后库存',
      dataIndex: 'after_stock',
      key: 'after_stock',
      width: 100,
      render: (text, record) => (
        <span>{text} {record.drug?.unit}</span>
      ),
    },
    {
      title: '批号',
      dataIndex: 'batch_no',
      key: 'batch_no',
      width: 120,
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
      const res = await inventoryApi.create({
        drug_id: values.drug_id,
        type: values.type,
        quantity: values.quantity,
        batch_no: values.batch_no,
        remark: values.remark,
      });
      if (res.code === 200) {
        message.success('操作成功');
        setAddVisible(false);
        form.resetFields();
        fetchRecords();
        fetchDrugs();
      } else {
        message.error(res.message || '操作失败');
      }
    } catch (error) {
      message.error(error.message || '操作失败');
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
      <h2 style={{ marginBottom: 24 }}>药品出入库</h2>
      
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
              <Option value="in">入库</Option>
              <Option value="out">出库</Option>
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
        title="新增出入库记录"
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
            name="drug_id"
            label="药品"
            rules={[{ required: true, message: '请选择药品' }]}
          >
            <Select placeholder="请选择药品">
              {drugs.map((drug) => (
                <Option key={drug.id} value={drug.id}>
                  {drug.name}（库存：{drug.stock} {drug.unit}）
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="type"
            label="类型"
            rules={[{ required: true, message: '请选择类型' }]}
          >
            <Select placeholder="请选择类型">
              <Option value="in">入库</Option>
              <Option value="out">出库</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="quantity"
            label="数量"
            rules={[{ required: true, message: '请输入数量' }]}
          >
            <InputNumber min={1} style={{ width: '100%' }} placeholder="请输入数量" />
          </Form.Item>

          <Form.Item
            name="batch_no"
            label="批号"
          >
            <Input placeholder="请输入批号（可选）" />
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

export default Inventory;
