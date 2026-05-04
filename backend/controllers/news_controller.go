package controllers

import (
	"hospitalManage/config"
	"hospitalManage/models"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

func GetNewsList(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "10"))
	keyword := c.Query("keyword")

	var newsList []models.News
	var total int64

	query := config.DB.Model(&models.News{})

	if keyword != "" {
		query = query.Where("title LIKE ?", "%"+keyword+"%")
	}

	query.Where("status = ?", 1).Count(&total)

	offset := (page - 1) * pageSize
	query.Order("created_at DESC").Offset(offset).Limit(pageSize).Find(&newsList)

	c.JSON(http.StatusOK, gin.H{
		"code": 200,
		"data": gin.H{
			"list":     newsList,
			"total":    total,
			"page":     page,
			"pageSize": pageSize,
		},
	})
}

func GetNewsByID(c *gin.Context) {
	id := c.Param("id")

	var news models.News
	if err := config.DB.First(&news, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"code": 404, "message": "新闻不存在"})
		return
	}

	news.Views++
	config.DB.Save(&news)

	c.JSON(http.StatusOK, gin.H{
		"code": 200,
		"data": news,
	})
}

func CreateNews(c *gin.Context) {
	var input struct {
		Title   string `json:"title" binding:"required"`
		Content string `json:"content" binding:"required"`
		Author  string `json:"author"`
		Status  int    `json:"status"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"code": 400, "message": "参数错误"})
		return
	}

	news := models.News{
		Title:   input.Title,
		Content: input.Content,
		Author:  input.Author,
		Status:  1,
		Views:   0,
	}

	if input.Status != 0 {
		news.Status = input.Status
	}

	if err := config.DB.Create(&news).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"code": 500, "message": "创建失败"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code":    200,
		"message": "创建成功",
		"data":    news,
	})
}

func UpdateNews(c *gin.Context) {
	id := c.Param("id")

	var news models.News
	if err := config.DB.First(&news, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"code": 404, "message": "新闻不存在"})
		return
	}

	var input struct {
		Title   string `json:"title"`
		Content string `json:"content"`
		Author  string `json:"author"`
		Status  int    `json:"status"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"code": 400, "message": "参数错误"})
		return
	}

	if input.Title != "" {
		news.Title = input.Title
	}
	if input.Content != "" {
		news.Content = input.Content
	}
	if input.Author != "" {
		news.Author = input.Author
	}
	if input.Status != 0 {
		news.Status = input.Status
	}

	if err := config.DB.Save(&news).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"code": 500, "message": "更新失败"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code":    200,
		"message": "更新成功",
	})
}

func DeleteNews(c *gin.Context) {
	id := c.Param("id")

	if err := config.DB.Delete(&models.News{}, id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"code": 500, "message": "删除失败"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code":    200,
		"message": "删除成功",
	})
}

func GetAllNews(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "10"))
	keyword := c.Query("keyword")
	status := c.Query("status")

	var newsList []models.News
	var total int64

	query := config.DB.Model(&models.News{})

	if keyword != "" {
		query = query.Where("title LIKE ?", "%"+keyword+"%")
	}

	if status != "" {
		query = query.Where("status = ?", status)
	}

	query.Count(&total)

	offset := (page - 1) * pageSize
	query.Order("created_at DESC").Offset(offset).Limit(pageSize).Find(&newsList)

	c.JSON(http.StatusOK, gin.H{
		"code": 200,
		"data": gin.H{
			"list":     newsList,
			"total":    total,
			"page":     page,
			"pageSize": pageSize,
		},
	})
}
