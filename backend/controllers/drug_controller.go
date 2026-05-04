package controllers

import (
	"errors"
	"hospitalManage/config"
	"hospitalManage/models"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

func GetDrugs(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "10"))
	keyword := c.Query("keyword")
	categoryID := c.Query("category_id")

	var drugs []models.Drug
	var total int64

	query := config.DB.Model(&models.Drug{}).Preload("Category")

	if keyword != "" {
		query = query.Where("name LIKE ? OR code LIKE ?", "%"+keyword+"%", "%"+keyword+"%")
	}

	if categoryID != "" {
		query = query.Where("category_id = ?", categoryID)
	}

	query.Count(&total)

	offset := (page - 1) * pageSize
	query.Order("created_at DESC").Offset(offset).Limit(pageSize).Find(&drugs)

	c.JSON(http.StatusOK, gin.H{
		"code": 200,
		"data": gin.H{
			"list":     drugs,
			"total":    total,
			"page":     page,
			"pageSize": pageSize,
		},
	})
}

func GetDrugByID(c *gin.Context) {
	id := c.Param("id")

	var drug models.Drug
	if err := config.DB.Preload("Category").First(&drug, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"code": 404, "message": "药品不存在"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code": 200,
		"data": drug,
	})
}

func CreateDrug(c *gin.Context) {
	var input struct {
		Name          string  `json:"name" binding:"required"`
		Code          string  `json:"code" binding:"required"`
		CategoryID    uint    `json:"category_id" binding:"required"`
		Specification string  `json:"specification"`
		Unit          string  `json:"unit"`
		Price         float64 `json:"price"`
		Stock         int     `json:"stock"`
		MinStock      int     `json:"min_stock"`
		Description   string  `json:"description"`
		Image         string  `json:"image"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"code": 400, "message": "参数错误"})
		return
	}

	var existingDrug models.Drug
	if err := config.DB.Where("code = ?", input.Code).First(&existingDrug).Error; !errors.Is(err, gorm.ErrRecordNotFound) {
		c.JSON(http.StatusBadRequest, gin.H{"code": 400, "message": "药品编码已存在"})
		return
	}

	drug := models.Drug{
		Name:          input.Name,
		Code:          input.Code,
		CategoryID:    input.CategoryID,
		Specification: input.Specification,
		Unit:          input.Unit,
		Price:         input.Price,
		Stock:         input.Stock,
		MinStock:      input.MinStock,
		Description:   input.Description,
		Status:        1,
		Image:         input.Image,
	}

	if err := config.DB.Create(&drug).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"code": 500, "message": "创建失败"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code":    200,
		"message": "创建成功",
		"data":    drug,
	})
}

func UpdateDrug(c *gin.Context) {
	id := c.Param("id")

	var drug models.Drug
	if err := config.DB.First(&drug, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"code": 404, "message": "药品不存在"})
		return
	}

	var input struct {
		Name          string  `json:"name"`
		CategoryID    uint    `json:"category_id"`
		Specification string  `json:"specification"`
		Unit          string  `json:"unit"`
		Price         float64 `json:"price"`
		Stock         int     `json:"stock"`
		MinStock      int     `json:"min_stock"`
		Description   string  `json:"description"`
		Status        int     `json:"status"`
		Image         string  `json:"image"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"code": 400, "message": "参数错误"})
		return
	}

	if input.Name != "" {
		drug.Name = input.Name
	}
	if input.CategoryID != 0 {
		drug.CategoryID = input.CategoryID
	}
	if input.Specification != "" {
		drug.Specification = input.Specification
	}
	if input.Unit != "" {
		drug.Unit = input.Unit
	}
	if input.Price != 0 {
		drug.Price = input.Price
	}
	if input.Stock != 0 {
		drug.Stock = input.Stock
	}
	if input.MinStock != 0 {
		drug.MinStock = input.MinStock
	}
	if input.Description != "" {
		drug.Description = input.Description
	}
	if input.Status != 0 {
		drug.Status = input.Status
	}
	if input.Image != "" {
		drug.Image = input.Image
	}

	if err := config.DB.Save(&drug).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"code": 500, "message": "更新失败"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code":    200,
		"message": "更新成功",
	})
}

func DeleteDrug(c *gin.Context) {
	id := c.Param("id")

	if err := config.DB.Delete(&models.Drug{}, id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"code": 500, "message": "删除失败"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code":    200,
		"message": "删除成功",
	})
}

func GetDrugCategories(c *gin.Context) {
	var categories []models.DrugCategory
	config.DB.Order("name ASC").Find(&categories)

	c.JSON(http.StatusOK, gin.H{
		"code": 200,
		"data": categories,
	})
}

func CreateDrugCategory(c *gin.Context) {
	var input struct {
		Name        string `json:"name" binding:"required"`
		Description string `json:"description"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"code": 400, "message": "参数错误"})
		return
	}

	var existing models.DrugCategory
	if err := config.DB.Where("name = ?", input.Name).First(&existing).Error; !errors.Is(err, gorm.ErrRecordNotFound) {
		c.JSON(http.StatusBadRequest, gin.H{"code": 400, "message": "分类名称已存在"})
		return
	}

	category := models.DrugCategory{
		Name:        input.Name,
		Description: input.Description,
	}

	if err := config.DB.Create(&category).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"code": 500, "message": "创建失败"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code":    200,
		"message": "创建成功",
		"data":    category,
	})
}

func UpdateDrugCategory(c *gin.Context) {
	id := c.Param("id")

	var category models.DrugCategory
	if err := config.DB.First(&category, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"code": 404, "message": "分类不存在"})
		return
	}

	var input struct {
		Name        string `json:"name"`
		Description string `json:"description"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"code": 400, "message": "参数错误"})
		return
	}

	if input.Name != "" {
		category.Name = input.Name
	}
	if input.Description != "" {
		category.Description = input.Description
	}

	if err := config.DB.Save(&category).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"code": 500, "message": "更新失败"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code":    200,
		"message": "更新成功",
	})
}

func DeleteDrugCategory(c *gin.Context) {
	id := c.Param("id")

	var count int64
	config.DB.Model(&models.Drug{}).Where("category_id = ?", id).Count(&count)
	if count > 0 {
		c.JSON(http.StatusBadRequest, gin.H{"code": 400, "message": "该分类下还有药品，无法删除"})
		return
	}

	if err := config.DB.Delete(&models.DrugCategory{}, id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"code": 500, "message": "删除失败"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code":    200,
		"message": "删除成功",
	})
}
