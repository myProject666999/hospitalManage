import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Select, message, Spin, DatePicker } from 'antd';
import { 
  UserOutlined, 
  MedicineBoxOutlined, 
  ShopOutlined, 
  MoneyCollectOutlined,
  CalendarOutlined 
} from '@ant-design/icons';
import { 
  PieChart, 
  Pie, 
  Cell, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { statsApi } from '../utils/api';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

function Dashboard() {
  const [loading, setLoading] = useState(false);
  const [genderData, setGenderData] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [inventoryData, setInventoryData] = useState([]);
  const [salesData, setSalesData] = useState([]);
  const [dateRange, setDateRange] = useState([dayjs().subtract(6, 'days'), dayjs()]);

  useEffect(() => {
    fetchStats();
  }, [dateRange]);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const [genderRes, categoryRes, inventoryRes, salesRes] = await Promise.all([
        statsApi.getGenderStats(),
        statsApi.getDrugCategoryStats(),
        statsApi.getDrugStockStats(),
        statsApi.getSalesStats(),
      ]);

      if (genderRes.code === 200) {
        setGenderData(genderRes.data.map(item => ({
          name: item.name || '未知',
          value: item.value || 0,
        })));
      }

      if (categoryRes.code === 200) {
        setCategoryData(categoryRes.data.map(item => ({
          name: item.name,
          count: item.count || 0,
        })));
      }

      if (inventoryRes.code === 200) {
        setInventoryData(inventoryRes.data.map(item => ({
          name: item.name,
          stock: item.stock || 0,
        })));
      }

      if (salesRes.code === 200) {
        setSalesData(salesRes.data.map(item => ({
          date: item.date,
          amount: item.amount || 0,
        })));
      }
    } catch (error) {
      message.error('获取统计数据失败');
    } finally {
      setLoading(false);
    }
  };

  const CustomPieLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central">
        {`${name}: ${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 style={{ margin: 0 }}>数据统计</h2>
        <RangePicker
          value={dateRange}
          onChange={(dates) => setDateRange(dates)}
          style={{ width: 280 }}
        />
      </div>

      <Spin spinning={loading}>
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="员工总数"
                value={genderData.reduce((sum, item) => sum + item.value, 0)}
                prefix={<UserOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="药品分类数"
                value={categoryData.length}
                prefix={<MedicineBoxOutlined />}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="库存总量"
                value={inventoryData.reduce((sum, item) => sum + item.stock, 0)}
                prefix={<ShopOutlined />}
                valueStyle={{ color: '#faad14' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="销售总额"
                value={salesData.reduce((sum, item) => sum + item.amount, 0)}
                precision={2}
                prefix={<MoneyCollectOutlined />}
                valueStyle={{ color: '#722ed1' }}
              />
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]}>
          <Col xs={24} lg={12}>
            <Card title="员工性别统计" extra={<CalendarOutlined />}>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={genderData.length > 0 ? genderData : [{ name: '暂无数据', value: 1 }]}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={CustomPieLabel}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {genderData.length > 0 
                      ? genderData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))
                      : <Cell fill="#ddd" />
                    }
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </Card>
          </Col>

          <Col xs={24} lg={12}>
            <Card title="药品分类统计" extra={<MedicineBoxOutlined />}>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={categoryData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="count" name="药品数量" fill="#1890ff" />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </Col>

          <Col xs={24} lg={12}>
            <Card title="药品库存统计" extra={<ShopOutlined />}>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={inventoryData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="stock" name="库存数量" fill="#52c41a" />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </Col>

          <Col xs={24} lg={12}>
            <Card title="销售额统计" extra={<MoneyCollectOutlined />}>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={salesData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip formatter={(value) => `¥${value}`} />
                  <Legend />
                  <Bar dataKey="amount" name="销售额" fill="#722ed1" />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </Col>
        </Row>
      </Spin>
    </div>
  );
}

export default Dashboard;
