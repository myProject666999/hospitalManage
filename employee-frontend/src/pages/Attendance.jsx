import React, { useState, useEffect } from 'react';
import { Card, Table, Button, message, Tag, DatePicker, Row, Col } from 'antd';
import { LoginOutlined, LogoutOutlined, ReloadOutlined } from '@ant-design/icons';
import { attendanceApi } from '../utils/api';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;

function Attendance() {
  const [todayAttendance, setTodayAttendance] = useState(null);
  const [attendanceList, setAttendanceList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [clockInLoading, setClockInLoading] = useState(false);
  const [clockOutLoading, setClockOutLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  useEffect(() => {
    fetchTodayAttendance();
    fetchAttendanceList();
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

  const fetchAttendanceList = async (page = 1, pageSize = 10) => {
    setLoading(true);
    try {
      const res = await attendanceApi.getMyList({ page, page_size: pageSize });
      if (res.code === 200) {
        setAttendanceList(res.data.list);
        setPagination({
          current: res.data.page,
          pageSize: res.data.pageSize,
          total: res.data.total,
        });
      }
    } catch (error) {
      message.error('获取考勤列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleClockIn = async () => {
    setClockInLoading(true);
    try {
      const res = await attendanceApi.clockIn();
      if (res.code === 200) {
        message.success('打卡成功');
        fetchTodayAttendance();
        fetchAttendanceList();
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
        fetchAttendanceList();
      } else {
        message.error(res.message || '签退失败');
      }
    } catch (error) {
      message.error(error.message || '签退失败');
    } finally {
      setClockOutLoading(false);
    }
  };

  const getStatusTag = (status) => {
    const colorMap = {
      '正常': 'green',
      '迟到': 'orange',
      '早退': 'red',
      '未打卡': 'default',
    };
    return <Tag color={colorMap[status] || 'default'}>{status}</Tag>;
  };

  const columns = [
    {
      title: '日期',
      dataIndex: 'date',
      key: 'date',
      width: 120,
    },
    {
      title: '上班打卡',
      dataIndex: 'clock_in',
      key: 'clock_in',
      width: 150,
      render: (text) => text ? dayjs(text).format('HH:mm:ss') : '--:--:--',
    },
    {
      title: '下班签退',
      dataIndex: 'clock_out',
      key: 'clock_out',
      width: 150,
      render: (text) => text ? dayjs(text).format('HH:mm:ss') : '--:--:--',
    },
    {
      title: '工作时长',
      dataIndex: 'work_hours',
      key: 'work_hours',
      width: 100,
      render: (text) => text ? `${text.toFixed(2)} 小时` : '-',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (text) => getStatusTag(text),
    },
  ];

  const canClockIn = !todayAttendance || !todayAttendance.clock_in;
  const canClockOut = todayAttendance && todayAttendance.clock_in && !todayAttendance.clock_out;

  const handleTableChange = (pagination) => {
    fetchAttendanceList(pagination.current, pagination.pageSize);
  };

  return (
    <div>
      <h2 style={{ marginBottom: 24 }}>考勤打卡</h2>
      
      <Card title="今日打卡" style={{ marginBottom: 24 }}>
        <Row gutter={16}>
          <Col xs={24} sm={12}>
            <div style={{ textAlign: 'center', padding: 24 }}>
              <h3 style={{ marginBottom: 16 }}>上班打卡</h3>
              <p style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 16 }}>
                {todayAttendance?.clock_in ? dayjs(todayAttendance.clock_in).format('HH:mm:ss') : '--:--:--'}
              </p>
              <Button
                type="primary"
                size="large"
                onClick={handleClockIn}
                loading={clockInLoading}
                disabled={!canClockIn}
              >
                <LoginOutlined /> {todayAttendance?.clock_in ? '已打卡' : '上班打卡'}
              </Button>
            </div>
          </Col>
          <Col xs={24} sm={12}>
            <div style={{ textAlign: 'center', padding: 24 }}>
              <h3 style={{ marginBottom: 16 }}>下班签退</h3>
              <p style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 16 }}>
                {todayAttendance?.clock_out ? dayjs(todayAttendance.clock_out).format('HH:mm:ss') : '--:--:--'}
              </p>
              <Button
                size="large"
                onClick={handleClockOut}
                loading={clockOutLoading}
                disabled={!canClockOut}
              >
                <LogoutOutlined /> {todayAttendance?.clock_out ? '已签退' : '下班签退'}
              </Button>
            </div>
          </Col>
        </Row>
        {todayAttendance?.status && (
          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <span>当前状态：</span>
            {getStatusTag(todayAttendance.status)}
            {todayAttendance.work_hours > 0 && (
              <span style={{ marginLeft: 16 }}>
                工作时长：{todayAttendance.work_hours.toFixed(2)} 小时
              </span>
            )}
          </div>
        )}
      </Card>

      <Card title="考勤记录" extra={
        <Button icon={<ReloadOutlined />} onClick={() => fetchAttendanceList()}>
          刷新
        </Button>
      }>
        <Table
          columns={columns}
          dataSource={attendanceList}
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
    </div>
  );
}

export default Attendance;
