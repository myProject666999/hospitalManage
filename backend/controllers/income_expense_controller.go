package controllers

import (
	"hospitalManage/config"
	"hospitalManage/models"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

func GetIncomeExpenseList(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "10"))
	_type := c.Query("type")
	category := c.Query("category")
	startDate := c.Query("start_date")
	endDate := c.Query("end_date")

	var records []models.IncomeExpense
	var total int64

	query := config.DB.Model(&models.IncomeExpense{}).Preload("Operator")

	if _type != "" {
		query = query.Where("type = ?", _type)
	}

	if category != "" {
		query = query.Where("category = ?", category)
	}

	if startDate != "" {
		query = query.Where("date(created_at) >= ?", startDate)
	}

	if endDate != "" {
		query = query.Where("date(created_at) <= ?", endDate)
	}

	query.Count(&total)

	offset := (page - 1) * pageSize
	query.Order("created_at DESC").Offset(offset).Limit(pageSize).Find(&records)

	var totalIncome, totalExpense float64
	config.DB.Model(&models.IncomeExpense{}).Where("type = ?", "income").Select("COALESCE(SUM(amount), 0)").Scan(&totalIncome)
	config.DB.Model(&models.IncomeExpense{}).Where("type = ?", "expense").Select("COALESCE(SUM(amount), 0)").Scan(&totalExpense)

	c.JSON(http.StatusOK, gin.H{
		"code": 200,
		"data": gin.H{
			"list":          records,
			"total":         total,
			"page":          page,
			"pageSize":      pageSize,
			"total_income":  totalIncome,
			"total_expense": totalExpense,
			"balance":       totalIncome - totalExpense,
		},
	})
}

func CreateIncomeExpense(c *gin.Context) {
	userID := c.GetUint("user_id")

	var input struct {
		Type        string  `json:"type" binding:"required"`
		Amount      float64 `json:"amount" binding:"required"`
		Category    string  `json:"category" binding:"required"`
		Description string  `json:"description"`
		Remark      string  `json:"remark"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"code": 400, "message": "参数错误"})
		return
	}

	if input.Type != "income" && input.Type != "expense" {
		c.JSON(http.StatusBadRequest, gin.H{"code": 400, "message": "类型错误，只能是income或expense"})
		return
	}

	if input.Amount <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{"code": 400, "message": "金额必须大于0"})
		return
	}

	record := models.IncomeExpense{
		Type:        input.Type,
		Amount:      input.Amount,
		Category:    input.Category,
		Description: input.Description,
		OperatorID:  userID,
		Remark:      input.Remark,
	}

	if err := config.DB.Create(&record).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"code": 500, "message": "创建失败"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code":    200,
		"message": "创建成功",
		"data":    record,
	})
}

func DeleteIncomeExpense(c *gin.Context) {
	id := c.Param("id")

	if err := config.DB.Delete(&models.IncomeExpense{}, id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"code": 500, "message": "删除失败"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code":    200,
		"message": "删除成功",
	})
}

func GetIncomeExpenseSummary(c *gin.Context) {
	startDate := c.Query("start_date")
	endDate := c.Query("end_date")

	var totalIncome, totalExpense float64

	incomeQuery := config.DB.Model(&models.IncomeExpense{}).Where("type = ?", "income")
	expenseQuery := config.DB.Model(&models.IncomeExpense{}).Where("type = ?", "expense")

	if startDate != "" {
		incomeQuery = incomeQuery.Where("date(created_at) >= ?", startDate)
		expenseQuery = expenseQuery.Where("date(created_at) >= ?", startDate)
	}

	if endDate != "" {
		incomeQuery = incomeQuery.Where("date(created_at) <= ?", endDate)
		expenseQuery = expenseQuery.Where("date(created_at) <= ?", endDate)
	}

	incomeQuery.Select("COALESCE(SUM(amount), 0)").Scan(&totalIncome)
	expenseQuery.Select("COALESCE(SUM(amount), 0)").Scan(&totalExpense)

	c.JSON(http.StatusOK, gin.H{
		"code": 200,
		"data": gin.H{
			"total_income":  totalIncome,
			"total_expense": totalExpense,
			"balance":       totalIncome - totalExpense,
		},
	})
}

func GetMyIncomeExpenseList(c *gin.Context) {
	userID := c.GetUint("user_id")
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "10"))
	_type := c.Query("type")

	var records []models.IncomeExpense
	var total int64

	query := config.DB.Model(&models.IncomeExpense{}).Where("operator_id = ?", userID).Preload("Operator")

	if _type != "" {
		query = query.Where("type = ?", _type)
	}

	query.Count(&total)

	offset := (page - 1) * pageSize
	query.Order("created_at DESC").Offset(offset).Limit(pageSize).Find(&records)

	c.JSON(http.StatusOK, gin.H{
		"code": 200,
		"data": gin.H{
			"list":     records,
			"total":    total,
			"page":     page,
			"pageSize": pageSize,
		},
	})
}
