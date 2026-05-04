package controllers

import (
	"errors"
	"hospitalManage/config"
	"hospitalManage/models"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

func GetAdmins(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "10"))
	keyword := c.Query("keyword")

	var admins []models.Admin
	var total int64

	query := config.DB.Model(&models.Admin{})

	if keyword != "" {
		query = query.Where("username LIKE ? OR real_name LIKE ?", "%"+keyword+"%", "%"+keyword+"%")
	}

	query.Count(&total)

	offset := (page - 1) * pageSize
	query.Order("created_at DESC").Offset(offset).Limit(pageSize).Find(&admins)

	c.JSON(http.StatusOK, gin.H{
		"code": 200,
		"data": gin.H{
			"list":     admins,
			"total":    total,
			"page":     page,
			"pageSize": pageSize,
		},
	})
}

func GetAdminByID(c *gin.Context) {
	id := c.Param("id")

	var admin models.Admin
	if err := config.DB.First(&admin, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"code": 404, "message": "管理员不存在"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code": 200,
		"data": admin,
	})
}

func CreateAdmin(c *gin.Context) {
	var input struct {
		Username string `json:"username" binding:"required"`
		Password string `json:"password" binding:"required"`
		RealName string `json:"real_name"`
		Phone    string `json:"phone"`
		Email    string `json:"email"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"code": 400, "message": "参数错误"})
		return
	}

	var existingAdmin models.Admin
	if err := config.DB.Where("username = ?", input.Username).First(&existingAdmin).Error; !errors.Is(err, gorm.ErrRecordNotFound) {
		c.JSON(http.StatusBadRequest, gin.H{"code": 400, "message": "用户名已存在"})
		return
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(input.Password), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"code": 500, "message": "密码加密失败"})
		return
	}

	admin := models.Admin{
		Username: input.Username,
		Password: string(hashedPassword),
		RealName: input.RealName,
		Phone:    input.Phone,
		Email:    input.Email,
		Role:     "admin",
		Status:   1,
	}

	if err := config.DB.Create(&admin).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"code": 500, "message": "创建失败"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code":    200,
		"message": "创建成功",
		"data":    admin,
	})
}

func UpdateAdmin(c *gin.Context) {
	id := c.Param("id")

	var admin models.Admin
	if err := config.DB.First(&admin, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"code": 404, "message": "管理员不存在"})
		return
	}

	var input struct {
		RealName string `json:"real_name"`
		Phone    string `json:"phone"`
		Email    string `json:"email"`
		Status   int    `json:"status"`
		Password string `json:"password"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"code": 400, "message": "参数错误"})
		return
	}

	if input.RealName != "" {
		admin.RealName = input.RealName
	}
	if input.Phone != "" {
		admin.Phone = input.Phone
	}
	if input.Email != "" {
		admin.Email = input.Email
	}
	if input.Status != 0 {
		admin.Status = input.Status
	}
	if input.Password != "" {
		hashedPassword, err := bcrypt.GenerateFromPassword([]byte(input.Password), bcrypt.DefaultCost)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"code": 500, "message": "密码加密失败"})
			return
		}
		admin.Password = string(hashedPassword)
	}

	if err := config.DB.Save(&admin).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"code": 500, "message": "更新失败"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code":    200,
		"message": "更新成功",
	})
}

func DeleteAdmin(c *gin.Context) {
	id := c.Param("id")

	var count int64
	config.DB.Model(&models.Admin{}).Count(&count)
	if count <= 1 {
		c.JSON(http.StatusBadRequest, gin.H{"code": 400, "message": "至少需要保留一个管理员"})
		return
	}

	if err := config.DB.Delete(&models.Admin{}, id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"code": 500, "message": "删除失败"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code":    200,
		"message": "删除成功",
	})
}

func GetUsers(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "10"))
	keyword := c.Query("keyword")
	status := c.Query("status")
	department := c.Query("department")

	var users []models.User
	var total int64

	query := config.DB.Model(&models.User{})

	if keyword != "" {
		query = query.Where("username LIKE ? OR real_name LIKE ? OR phone LIKE ?", "%"+keyword+"%", "%"+keyword+"%", "%"+keyword+"%")
	}

	if status != "" {
		query = query.Where("status = ?", status)
	}

	if department != "" {
		query = query.Where("department = ?", department)
	}

	query.Count(&total)

	offset := (page - 1) * pageSize
	query.Order("created_at DESC").Offset(offset).Limit(pageSize).Find(&users)

	c.JSON(http.StatusOK, gin.H{
		"code": 200,
		"data": gin.H{
			"list":     users,
			"total":    total,
			"page":     page,
			"pageSize": pageSize,
		},
	})
}

func GetUserByID(c *gin.Context) {
	id := c.Param("id")

	var user models.User
	if err := config.DB.First(&user, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"code": 404, "message": "用户不存在"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code": 200,
		"data": user,
	})
}

func UpdateUser(c *gin.Context) {
	id := c.Param("id")

	var user models.User
	if err := config.DB.First(&user, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"code": 404, "message": "用户不存在"})
		return
	}

	var input struct {
		RealName   string `json:"real_name"`
		Gender     string `json:"gender"`
		Phone      string `json:"phone"`
		Email      string `json:"email"`
		Department string `json:"department"`
		Position   string `json:"position"`
		Status     int    `json:"status"`
		Password   string `json:"password"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"code": 400, "message": "参数错误"})
		return
	}

	if input.RealName != "" {
		user.RealName = input.RealName
	}
	if input.Gender != "" {
		user.Gender = input.Gender
	}
	if input.Phone != "" {
		user.Phone = input.Phone
	}
	if input.Email != "" {
		user.Email = input.Email
	}
	if input.Department != "" {
		user.Department = input.Department
	}
	if input.Position != "" {
		user.Position = input.Position
	}
	if input.Status != 0 {
		user.Status = input.Status
	}
	if input.Password != "" {
		hashedPassword, err := bcrypt.GenerateFromPassword([]byte(input.Password), bcrypt.DefaultCost)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"code": 500, "message": "密码加密失败"})
			return
		}
		user.Password = string(hashedPassword)
	}

	if err := config.DB.Save(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"code": 500, "message": "更新失败"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code":    200,
		"message": "更新成功",
	})
}

func DeleteUser(c *gin.Context) {
	id := c.Param("id")

	if err := config.DB.Delete(&models.User{}, id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"code": 500, "message": "删除失败"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code":    200,
		"message": "删除成功",
	})
}
