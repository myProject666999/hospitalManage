package controllers

import (
	"fmt"
	"hospitalManage/config"
	"hospitalManage/models"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
)

func GetOrders(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "10"))
	status := c.Query("status")
	keyword := c.Query("keyword")

	var orders []models.Order
	var total int64

	query := config.DB.Model(&models.Order{}).Preload("Operator").Preload("OrderItems.Drug")

	if status != "" {
		query = query.Where("status = ?", status)
	}

	if keyword != "" {
		query = query.Where("order_no LIKE ? OR customer LIKE ?", "%"+keyword+"%", "%"+keyword+"%")
	}

	query.Count(&total)

	offset := (page - 1) * pageSize
	query.Order("created_at DESC").Offset(offset).Limit(pageSize).Find(&orders)

	c.JSON(http.StatusOK, gin.H{
		"code": 200,
		"data": gin.H{
			"list":     orders,
			"total":    total,
			"page":     page,
			"pageSize": pageSize,
		},
	})
}

func GetOrderByID(c *gin.Context) {
	id := c.Param("id")

	var order models.Order
	if err := config.DB.Preload("Operator").Preload("OrderItems.Drug").First(&order, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"code": 404, "message": "订单不存在"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code": 200,
		"data": order,
	})
}

func CreateOrder(c *gin.Context) {
	userID := c.GetUint("user_id")

	var input struct {
		Customer   string `json:"customer"`
		Phone      string `json:"phone"`
		Address    string `json:"address"`
		Remark     string `json:"remark"`
		OrderItems []struct {
			DrugID   uint `json:"drug_id" binding:"required"`
			Quantity int  `json:"quantity" binding:"required"`
		} `json:"order_items" binding:"required"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"code": 400, "message": "参数错误"})
		return
	}

	if len(input.OrderItems) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"code": 400, "message": "订单商品不能为空"})
		return
	}

	orderNo := fmt.Sprintf("ORD%s%06d", time.Now().Format("20060102150405"), time.Now().Nanosecond()%1000000)

	order := models.Order{
		OrderNo:     orderNo,
		Customer:    input.Customer,
		Phone:       input.Phone,
		Address:     input.Address,
		Status:      "pending",
		OperatorID:  userID,
		Remark:      input.Remark,
		TotalAmount: 0,
	}

	var totalAmount float64
	var orderItems []models.OrderItem

	for _, item := range input.OrderItems {
		var drug models.Drug
		if err := config.DB.First(&drug, item.DrugID).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"code": 404, "message": "药品不存在"})
			return
		}

		if drug.Stock < item.Quantity {
			c.JSON(http.StatusBadRequest, gin.H{"code": 400, "message": fmt.Sprintf("药品%s库存不足", drug.Name)})
			return
		}

		amount := float64(item.Quantity) * drug.Price
		totalAmount += amount

		orderItems = append(orderItems, models.OrderItem{
			DrugID:    item.DrugID,
			Quantity:  item.Quantity,
			UnitPrice: drug.Price,
			Amount:    amount,
		})

		drug.Stock -= item.Quantity
		if err := config.DB.Save(&drug).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"code": 500, "message": "更新库存失败"})
			return
		}

		inventoryRecord := models.DrugInventory{
			DrugID:      item.DrugID,
			Type:        "out",
			Quantity:    item.Quantity,
			BeforeStock: drug.Stock + item.Quantity,
			AfterStock:  drug.Stock,
			OperatorID:  userID,
			Remark:      fmt.Sprintf("订单出库: %s", orderNo),
		}
		config.DB.Create(&inventoryRecord)
	}

	order.TotalAmount = totalAmount

	if err := config.DB.Create(&order).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"code": 500, "message": "创建订单失败"})
		return
	}

	for i := range orderItems {
		orderItems[i].OrderID = order.ID
	}

	if err := config.DB.Create(&orderItems).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"code": 500, "message": "创建订单项失败"})
		return
	}

	income := models.IncomeExpense{
		Type:        "income",
		Amount:      totalAmount,
		Category:    "药品销售",
		Description: fmt.Sprintf("订单%s销售金额", orderNo),
		OperatorID:  userID,
	}
	config.DB.Create(&income)

	c.JSON(http.StatusOK, gin.H{
		"code":    200,
		"message": "创建成功",
		"data": gin.H{
			"id":          order.ID,
			"order_no":    order.OrderNo,
			"total_amount": order.TotalAmount,
		},
	})
}

func UpdateOrderStatus(c *gin.Context) {
	id := c.Param("id")

	var order models.Order
	if err := config.DB.First(&order, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"code": 404, "message": "订单不存在"})
		return
	}

	var input struct {
		Status string `json:"status" binding:"required"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"code": 400, "message": "参数错误"})
		return
	}

	validStatuses := []string{"pending", "paid", "shipped", "completed", "cancelled"}
	valid := false
	for _, s := range validStatuses {
		if s == input.Status {
			valid = true
			break
		}
	}

	if !valid {
		c.JSON(http.StatusBadRequest, gin.H{"code": 400, "message": "状态值无效"})
		return
	}

	order.Status = input.Status
	if err := config.DB.Save(&order).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"code": 500, "message": "更新失败"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code":    200,
		"message": "更新成功",
	})
}

func GetMyOrders(c *gin.Context) {
	userID := c.GetUint("user_id")
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "10"))
	status := c.Query("status")

	var orders []models.Order
	var total int64

	query := config.DB.Model(&models.Order{}).Where("operator_id = ?", userID).Preload("Operator").Preload("OrderItems.Drug")

	if status != "" {
		query = query.Where("status = ?", status)
	}

	query.Count(&total)

	offset := (page - 1) * pageSize
	query.Order("created_at DESC").Offset(offset).Limit(pageSize).Find(&orders)

	c.JSON(http.StatusOK, gin.H{
		"code": 200,
		"data": gin.H{
			"list":     orders,
			"total":    total,
			"page":     page,
			"pageSize": pageSize,
		},
	})
}
