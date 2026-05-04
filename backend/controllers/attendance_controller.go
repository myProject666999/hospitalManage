package controllers

import (
	"hospitalManage/config"
	"hospitalManage/models"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
)

func ClockIn(c *gin.Context) {
	userID := c.GetUint("user_id")
	today := time.Now().Format("2006-01-02")

	var existingAttendance models.Attendance
	if err := config.DB.Where("user_id = ? AND date = ?", userID, today).First(&existingAttendance).Error; err == nil {
		if !existingAttendance.ClockIn.IsZero() {
			c.JSON(http.StatusBadRequest, gin.H{"code": 400, "message": "今日已打卡"})
			return
		}
	}

	now := time.Now()
	attendance := models.Attendance{
		UserID:    userID,
		ClockIn:   now,
		Date:      today,
		Status:    "正常",
		WorkHours: 0,
	}

	if now.Hour() > 9 {
		attendance.Status = "迟到"
	}

	if err := config.DB.Create(&attendance).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"code": 500, "message": "打卡失败"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code":    200,
		"message": "打卡成功",
		"data": gin.H{
			"clock_in": attendance.ClockIn,
			"status":   attendance.Status,
		},
	})
}

func ClockOut(c *gin.Context) {
	userID := c.GetUint("user_id")
	today := time.Now().Format("2006-01-02")

	var attendance models.Attendance
	if err := config.DB.Where("user_id = ? AND date = ?", userID, today).First(&attendance).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"code": 400, "message": "今日未打卡"})
		return
	}

	if !attendance.ClockOut.IsZero() {
		c.JSON(http.StatusBadRequest, gin.H{"code": 400, "message": "今日已签退"})
		return
	}

	now := time.Now()
	attendance.ClockOut = now

	duration := now.Sub(attendance.ClockIn)
	attendance.WorkHours = float64(duration.Hours())

	if now.Hour() < 18 {
		attendance.Status = "早退"
	} else if attendance.Status == "正常" && now.Hour() >= 18 {
		attendance.Status = "正常"
	}

	if err := config.DB.Save(&attendance).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"code": 500, "message": "签退失败"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code":    200,
		"message": "签退成功",
		"data": gin.H{
			"clock_out":  attendance.ClockOut,
			"work_hours": attendance.WorkHours,
			"status":     attendance.Status,
		},
	})
}

func GetTodayAttendance(c *gin.Context) {
	userID := c.GetUint("user_id")
	today := time.Now().Format("2006-01-02")

	var attendance models.Attendance
	result := config.DB.Where("user_id = ? AND date = ?", userID, today).First(&attendance)

	if result.Error != nil {
		c.JSON(http.StatusOK, gin.H{
			"code": 200,
			"data": gin.H{
				"clock_in":  nil,
				"clock_out": nil,
				"status":    "未打卡",
			},
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code": 200,
		"data": gin.H{
			"clock_in":   attendance.ClockIn,
			"clock_out":  attendance.ClockOut,
			"work_hours": attendance.WorkHours,
			"status":     attendance.Status,
		},
	})
}

func GetMyAttendanceList(c *gin.Context) {
	userID := c.GetUint("user_id")
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "10"))
	month := c.Query("month")

	var attendances []models.Attendance
	var total int64

	query := config.DB.Model(&models.Attendance{}).Where("user_id = ?", userID)

	if month != "" {
		query = query.Where("date LIKE ?", month+"%")
	}

	query.Count(&total)

	offset := (page - 1) * pageSize
	query.Order("date DESC").Offset(offset).Limit(pageSize).Preload("User").Find(&attendances)

	c.JSON(http.StatusOK, gin.H{
		"code": 200,
		"data": gin.H{
			"list":     attendances,
			"total":    total,
			"page":     page,
			"pageSize": pageSize,
		},
	})
}

func GetAllAttendanceList(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "10"))
	month := c.Query("month")
	userID := c.Query("user_id")

	var attendances []models.Attendance
	var total int64

	query := config.DB.Model(&models.Attendance{})

	if month != "" {
		query = query.Where("date LIKE ?", month+"%")
	}

	if userID != "" {
		query = query.Where("user_id = ?", userID)
	}

	query.Count(&total)

	offset := (page - 1) * pageSize
	query.Order("date DESC").Offset(offset).Limit(pageSize).Preload("User").Find(&attendances)

	c.JSON(http.StatusOK, gin.H{
		"code": 200,
		"data": gin.H{
			"list":     attendances,
			"total":    total,
			"page":     page,
			"pageSize": pageSize,
		},
	})
}

func UpdateAttendance(c *gin.Context) {
	id := c.Param("id")

	var attendance models.Attendance
	if err := config.DB.First(&attendance, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"code": 404, "message": "考勤记录不存在"})
		return
	}

	var input struct {
		Status string `json:"status"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"code": 400, "message": "参数错误"})
		return
	}

	if input.Status != "" {
		attendance.Status = input.Status
	}

	if err := config.DB.Save(&attendance).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"code": 500, "message": "更新失败"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code":    200,
		"message": "更新成功",
	})
}
