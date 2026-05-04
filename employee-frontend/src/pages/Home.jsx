import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Button, message, Tag } from 'antd';
import {
  ClockCircleOutlined,
  MedicineBoxOutlined,
  ShoppingCartOutlined,
  TransactionOutlined,
  LoginOutlined,
  LogoutOutlined,
} from '@ant-design/icons';
import { attendanceApi } from '../utils/api';
import dayjs from 'dayjs';

function Home() {
  const [todayAttendance, setTodayAttendance] = useState(null);
  const [loading, setLoading] = useState(false);
  const [clockInLoading, setClockInLoading] = useState(false);
  const [clockOutLoading, setClockOutLoading] = useState(false);

  useEffect(() => {
    fetchTodayAttendance();
  }, []);

  const fetchTodayAttendance = async () => {
    try {
      const res = await attendanceApi.getToday();
      if (res.code === 200) {
        setTodayAttendance(res.data);
      }
    } catch (error) {
      console.error('获取今日考勤失败:', error);
    }
  };

  const handleClockIn = async () => {
    setClockInLoading(true);
    try {
      const res = await attendanceApi.clockIn();
      if (res.code === 200) {
        message.success('打卡成功');
        fetchTodayAttendance();
      } else {
        message.error(res.message || '打卡失败');
      }
    } catch (error) {
      message.error(error.message || '打卡失败');
    } finally {
      setClockInLoading(false);
    }
  };

  const handleClockOut = async () => {
    setClockOutLoading(true);
    try {
      const res = await attendanceApi.clockOut();
      if (res.code === 200) {
        message.success('签退成功');
        fetchTodayAttendance();
      } else {
        message.error(res.message || '签退失败');
      }
    } catch (error) {
      message.error(error.message || '签退失败');
    } finally {
      setClockOutLoading(false);
    }
  };

  const canClockIn = !todayAttendance || !todayAttendance.clock_in;
  const canClockOut = todayAttendance && todayAttendance.clock_in && !todayAttendance.clock_out;

  return (
    <div>
      <h2 style={{ marginBottom: 24 }}>工作台</h2>
      
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={24}>
          <Card title="今日考勤" extra={dayjs().format('YYYY年MM月DD日')}>
            <Row gutter={16}>
              <Col span={8}>
                <Statistic 
                  title="上班打卡" 
                  value={todayAttendance?.clock_in ? dayjs(todayAttendance.clock_in).format('HH:mm:ss') : '--:--:--'}
                  prefix={<LoginOutlined />}
                  suffix={
                    todayAttendance?.status && (
                      <Tag color={todayAttendance.status === '正常' ? 'green' : todayAttendance.status === '迟到' ? 'orange' : 'blue'}>
                        {todayAttendance.status}
                      </Tag>
                    )
                  }
                />
              </Col>
              <Col span={8}>
                <Statistic 
                  title="下班签退" 
                  value={todayAttendance?.clock_out ? dayjs(todayAttendance.clock_out).format('HH:mm:ss') : '--:--:--'}
                  prefix={<LogoutOutlined />}
                />
              </Col>
              <Col span={8}>
                <Statistic 
                  title="工作时长" 
                  value={todayAttendance?.work_hours || 0}
                  suffix="小时"
                  precision={2}
                />
              </Col>
            </Row>
            <div style={{ marginTop: 24, display: 'flex', gap: 12 }}>
              <Button 
                type="primary" 
                size="large"
                onClick={handleClockIn}
                loading={clockInLoading}
                disabled={!canClockIn}
                style={{ minWidth: 120 }}
              >
                {todayAttendance?.clock_in ? '已打卡' : '上班打卡'}
              </Button>
              <Button 
                size="large"
                onClick={handleClockOut}
                loading={clockOutLoading}
                disabled={!canClockOut}
                style={{ minWidth: 120 }}
              >
                {todayAttendance?.clock_out ? '已签退' : '下班签退'}
              </Button>
            </div>
          </Card>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col xs={12} sm={12} md={6}>
          <Card hoverable>
            <Statistic
              title="考勤打卡"
              value="考勤"
              prefix={<ClockCircleOutlined style={{ color: '#1890ff', fontSize: 24 }} />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={12} md={6}>
          <Card hoverable>
            <Statistic
              title="药品查询"
              value="药品"
              prefix={<MedicineBoxOutlined style={{ color: '#52c41a', fontSize: 24 }} />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={12} md={6}>
          <Card hoverable>
            <Statistic
              title="订单管理"
              value="订单"
              prefix={<ShoppingCartOutlined style={{ color: '#fa8c16', fontSize: 24 }} />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={12} md={6}>
          <Card hoverable>
            <Statistic
              title="收支管理"
              value="收支"
              prefix={<TransactionOutlined style={{ color: '#722ed1', fontSize: 24 }} />}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}

export default Home;
