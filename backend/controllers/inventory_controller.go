package controllers

import (
	"hospitalManage/config"
	"hospitalManage/models"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

func GetInventoryRecords(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "10"))
	_type := c.Query("type")
	drugID := c.Query("drug_id")
	startDate := c.Query("start_date")
	endDate := c.Query("end_date")

	var records []models.DrugInventory
	var total int64

	query := config.DB.Model(&models.DrugInventory{}).Preload("Drug").Preload("Operator")

	if _type != "" {
		query = query.Where("type = ?", _type)
	}

	if drugID != "" {
		query = query.Where("drug_id = ?", drugID)
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

func CreateInventoryRecord(c *gin.Context) {
	userID := c.GetUint("user_id")

	var input struct {
		DrugID   uint   `json:"drug_id" binding:"required"`
		Type     string `json:"type" binding:"required"`
		Quantity int    `json:"quantity" binding:"required"`
		Remark   string `json:"remark"`
		BatchNo  string `json:"batch_no"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"code": 400, "message": "参数错误"})
		return
	}

	if input.Type != "in" && input.Type != "out" {
		c.JSON(http.StatusBadRequest, gin.H{"code": 400, "message": "类型错误，只能是in或out"})
		return
	}

	if input.Quantity <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{"code": 400, "message": "数量必须大于0"})
		return
	}

	var drug models.Drug
	if err := config.DB.First(&drug, input.DrugID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"code": 404, "message": "药品不存在"})
		return
	}

	beforeStock := drug.Stock
	var afterStock int

	if input.Type == "in" {
		afterStock = beforeStock + input.Quantity
	} else {
		if beforeStock < input.Quantity {
			c.JSON(http.StatusBadRequest, gin.H{"code": 400, "message": "库存不足"})
			return
		}
		afterStock = beforeStock - input.Quantity
	}

	drug.Stock = afterStock
	if err := config.DB.Save(&drug).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"code": 500, "message": "更新库存失败"})
		return
	}

	record := models.DrugInventory{
		DrugID:      input.DrugID,
		Type:        input.Type,
		Quantity:    input.Quantity,
		BeforeStock: beforeStock,
		AfterStock:  afterStock,
		OperatorID:  userID,
		Remark:      input.Remark,
		BatchNo:     input.BatchNo,
	}

	if err := config.DB.Create(&record).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"code": 500, "message": "创建记录失败"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code":    200,
		"message": "操作成功",
		"data":    record,
	})
}

func GetMyInventoryRecords(c *gin.Context) {
	userID := c.GetUint("user_id")
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "10"))
	_type := c.Query("type")

	var records []models.DrugInventory
	var total int64

	query := config.DB.Model(&models.DrugInventory{}).Where("operator_id = ?", userID).Preload("Drug").Preload("Operator")

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
