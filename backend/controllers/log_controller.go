package controllers

import (
	"hospitalManage/config"
	"hospitalManage/models"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

func GetLogs(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "10"))
	module := c.Query("module")
	action := c.Query("action")
	userID := c.Query("user_id")

	var logs []models.Log
	var total int64

	query := config.DB.Model(&models.Log{})

	if module != "" {
		query = query.Where("module = ?", module)
	}

	if action != "" {
		query = query.Where("action = ?", action)
	}

	if userID != "" {
		query = query.Where("user_id = ?", userID)
	}

	query.Count(&total)

	offset := (page - 1) * pageSize
	query.Order("created_at DESC").Offset(offset).Limit(pageSize).Find(&logs)

	c.JSON(http.StatusOK, gin.H{
		"code": 200,
		"data": gin.H{
			"list":     logs,
			"total":    total,
			"page":     page,
			"pageSize": pageSize,
		},
	})
}

func GetLogByID(c *gin.Context) {
	id := c.Param("id")

	var log models.Log
	if err := config.DB.First(&log, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"code": 404, "message": "日志不存在"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code": 200,
		"data": log,
	})
}

func DeleteLog(c *gin.Context) {
	id := c.Param("id")

	if err := config.DB.Delete(&models.Log{}, id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"code": 500, "message": "删除失败"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code":    200,
		"message": "删除成功",
	})
}

func ClearLogs(c *gin.Context) {
	var input struct {
		Days int `json:"days"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		input.Days = 30
	}

	if input.Days < 1 {
		input.Days = 30
	}

	if err := config.DB.Exec("DELETE FROM logs WHERE julianday('now') - julianday(created_at) > ?", input.Days).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"code": 500, "message": "清理失败"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code":    200,
		"message": "清理成功",
	})
}

func CreateLog(c *gin.Context) {
	userID := c.GetUint("user_id")
	username := c.GetString("username")

	var input struct {
		Module    string `json:"module"`
		Action    string `json:"action"`
		IP        string `json:"ip"`
		UserAgent string `json:"user_agent"`
		Params    string `json:"params"`
		Result    string `json:"result"`
		Status    int    `json:"status"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"code": 400, "message": "参数错误"})
		return
	}

	log := models.Log{
		UserID:    userID,
		Username:  username,
		Module:    input.Module,
		Action:    input.Action,
		IP:        input.IP,
		UserAgent: input.UserAgent,
		Params:    input.Params,
		Result:    input.Result,
		Status:    input.Status,
	}

	if err := config.DB.Create(&log).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"code": 500, "message": "创建失败"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code":    200,
		"message": "创建成功",
	})
}
