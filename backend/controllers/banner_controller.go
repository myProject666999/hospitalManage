package controllers

import (
	"hospitalManage/config"
	"hospitalManage/models"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

func GetBanners(c *gin.Context) {
	var banners []models.Banner
	config.DB.Where("status = ?", 1).Order("sort ASC, created_at DESC").Find(&banners)

	c.JSON(http.StatusOK, gin.H{
		"code": 200,
		"data": banners,
	})
}

func GetAllBanners(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "10"))

	var banners []models.Banner
	var total int64

	config.DB.Model(&models.Banner{}).Count(&total)

	offset := (page - 1) * pageSize
	config.DB.Order("sort ASC, created_at DESC").Offset(offset).Limit(pageSize).Find(&banners)

	c.JSON(http.StatusOK, gin.H{
		"code": 200,
		"data": gin.H{
			"list":     banners,
			"total":    total,
			"page":     page,
			"pageSize": pageSize,
		},
	})
}

func CreateBanner(c *gin.Context) {
	var input struct {
		Title       string `json:"title"`
		Image       string `json:"image" binding:"required"`
		Link        string `json:"link"`
		Sort        int    `json:"sort"`
		Status      int    `json:"status"`
		Description string `json:"description"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"code": 400, "message": "参数错误"})
		return
	}

	banner := models.Banner{
		Title:       input.Title,
		Image:       input.Image,
		Link:        input.Link,
		Sort:        input.Sort,
		Status:      1,
		Description: input.Description,
	}

	if input.Status != 0 {
		banner.Status = input.Status
	}

	if err := config.DB.Create(&banner).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"code": 500, "message": "创建失败"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code":    200,
		"message": "创建成功",
		"data":    banner,
	})
}

func UpdateBanner(c *gin.Context) {
	id := c.Param("id")

	var banner models.Banner
	if err := config.DB.First(&banner, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"code": 404, "message": "轮播图不存在"})
		return
	}

	var input struct {
		Title       string `json:"title"`
		Image       string `json:"image"`
		Link        string `json:"link"`
		Sort        int    `json:"sort"`
		Status      int    `json:"status"`
		Description string `json:"description"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"code": 400, "message": "参数错误"})
		return
	}

	if input.Title != "" {
		banner.Title = input.Title
	}
	if input.Image != "" {
		banner.Image = input.Image
	}
	if input.Link != "" {
		banner.Link = input.Link
	}
	if input.Sort != 0 {
		banner.Sort = input.Sort
	}
	if input.Status != 0 {
		banner.Status = input.Status
	}
	if input.Description != "" {
		banner.Description = input.Description
	}

	if err := config.DB.Save(&banner).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"code": 500, "message": "更新失败"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code":    200,
		"message": "更新成功",
	})
}

func DeleteBanner(c *gin.Context) {
	id := c.Param("id")

	if err := config.DB.Delete(&models.Banner{}, id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"code": 500, "message": "删除失败"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code":    200,
		"message": "删除成功",
	})
}
