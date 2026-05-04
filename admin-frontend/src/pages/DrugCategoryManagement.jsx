import React, { useState, useEffect } from 'react';
import { Table, Card, Button, Input, Modal, Form, message, Popconfirm, Space } from 'antd';
import { PlusOutlined, ReloadOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { drugApi } from '../utils/api';
import dayjs from 'dayjs';

function DrugCategoryManagement() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await drugApi.getAllCategories();
      if (res.code === 200) {
        setCategories(res.data);
      }
    } catch (error) {
      message.error('获取分类列表失败');
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: '分类名称',
      dataIndex: 'name',
      key: 'name',
      width: 200,
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      width: 300,
      render: (text) => text || '-',
    },
    {
      title: '排序',
      dataIndex: 'sort_order',
      key: 'sort_order',
      width: 100,
      render: (text) => text || 0,
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180,
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
            title="确定要删除该分类吗？"
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
    setEditingCategory(null);
    form.resetFields();
    form.setFieldsValue({ sort_order: 0 });
    setModalVisible(true);
  };

  const handleEdit = (record) => {
    setEditingCategory(record);
    form.setFieldsValue(record);
    setModalVisible(true);
  };

  const handleSubmit = async (values) => {
    try {
      if (editingCategory) {
        const res = await drugApi.updateCategory(editingCategory.id, values);
        if (res.code === 200) {
          message.success('更新成功');
          setModalVisible(false);
          fetchCategories();
        }
      } else {
        const res = await drugApi.createCategory(values);
        if (res.code === 200) {
          message.success('创建成功');
          setModalVisible(false);
          fetchCategories();
        }
      }
    } catch (error) {
      message.error(error.message || '操作失败');
    }
  };

  const handleDelete = async (id) => {
    try {
      const res = await drugApi.deleteCategory(id);
      if (res.code === 200) {
        message.success('删除成功');
        fetchCategories();
      }
    } catch (error) {
      message.error(error.message || '删除失败');
    }
  };

  return (
    <div>
      <h2 style={{ marginBottom: 24 }}>药品类型管理</h2>
      
      <Card style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Button icon={<ReloadOutlined />} onClick={() => fetchCategories()}>
            刷新
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            新增分类
          </Button>
        </div>
      </Card>

      <Card>
        <Table
          columns={columns}
          dataSource={categories}
          rowKey="id"
          loading={loading}
          pagination={{
            showQuickJumper: true,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条记录`,
          }}
        />
      </Card>

      <Modal
        title={editingCategory ? '编辑分类' : '新增分类'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={500}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            name="name"
            label="分类名称"
            rules={[{ required: true, message: '请输入分类名称' }]}
          >
            <Input placeholder="请输入分类名称" />
          </Form.Item>

          <Form.Item
            name="description"
            label="描述"
          >
            <Input.TextArea rows={3} placeholder="请输入描述（可选）" />
          </Form.Item>

          <Form.Item
            name="sort_order"
            label="排序"
          >
            <Input.Number style={{ width: '100%' }} min={0} placeholder="数字越小越靠前" />
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

export default DrugCategoryManagement;
