package controllers

import (
	"errors"
	"hospitalManage/config"
	"hospitalManage/models"
	"hospitalManage/utils"
	"net/http"

	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

func Register(c *gin.Context) {
	var input struct {
		Username string `json:"username" binding:"required"`
		Password string `json:"password" binding:"required"`
		RealName string `json:"real_name"`
		Gender   string `json:"gender"`
		Phone    string `json:"phone"`
		Email    string `json:"email"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"code": 400, "message": "参数错误"})
		return
	}

	var existingUser models.User
	if err := config.DB.Where("username = ?", input.Username).First(&existingUser).Error; !errors.Is(err, gorm.ErrRecordNotFound) {
		c.JSON(http.StatusBadRequest, gin.H{"code": 400, "message": "用户名已存在"})
		return
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(input.Password), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"code": 500, "message": "密码加密失败"})
		return
	}

	user := models.User{
		Username: input.Username,
		Password: string(hashedPassword),
		RealName: input.RealName,
		Gender:   input.Gender,
		Phone:    input.Phone,
		Email:    input.Email,
		Role:     "employee",
		Status:   1,
	}

	if err := config.DB.Create(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"code": 500, "message": "注册失败"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code":    200,
		"message": "注册成功",
	})
}

func Login(c *gin.Context) {
	var input struct {
		Username  string `json:"username" binding:"required"`
		Password  string `json:"password" binding:"required"`
		LoginType string `json:"login_type" binding:"required"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"code": 400, "message": "参数错误"})
		return
	}

	if input.LoginType == "admin" {
		var admin models.Admin
		if err := config.DB.Where("username = ?", input.Username).First(&admin).Error; err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"code": 401, "message": "用户名或密码错误"})
			return
		}

		if err := bcrypt.CompareHashAndPassword([]byte(admin.Password), []byte(input.Password)); err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"code": 401, "message": "用户名或密码错误"})
			return
		}

		if admin.Status != 1 {
			c.JSON(http.StatusForbidden, gin.H{"code": 403, "message": "账号已被禁用"})
			return
		}

		token, err := utils.GenerateToken(admin.ID, admin.Username, "admin")
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"code": 500, "message": "生成token失败"})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"code": 200,
			"data": gin.H{
				"token": token,
				"user": gin.H{
					"id":        admin.ID,
					"username":  admin.Username,
					"real_name": admin.RealName,
					"role":      admin.Role,
				},
			},
		})
	} else {
		var user models.User
		if err := config.DB.Where("username = ?", input.Username).First(&user).Error; err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"code": 401, "message": "用户名或密码错误"})
			return
		}

		if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(input.Password)); err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"code": 401, "message": "用户名或密码错误"})
			return
		}

		if user.Status != 1 {
			c.JSON(http.StatusForbidden, gin.H{"code": 403, "message": "账号已被禁用"})
			return
		}

		token, err := utils.GenerateToken(user.ID, user.Username, "employee")
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"code": 500, "message": "生成token失败"})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"code": 200,
			"data": gin.H{
				"token": token,
				"user": gin.H{
					"id":         user.ID,
					"username":   user.Username,
					"real_name":  user.RealName,
					"gender":     user.Gender,
					"phone":      user.Phone,
					"email":      user.Email,
					"department": user.Department,
					"position":   user.Position,
					"role":       user.Role,
					"avatar":     user.Avatar,
				},
			},
		})
	}
}

func GetUserInfo(c *gin.Context) {
	userID := c.GetUint("user_id")
	role := c.GetString("role")

	if role == "admin" {
		var admin models.Admin
		if err := config.DB.First(&admin, userID).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"code": 404, "message": "用户不存在"})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"code": 200,
			"data": gin.H{
				"id":        admin.ID,
				"username":  admin.Username,
				"real_name": admin.RealName,
				"phone":     admin.Phone,
				"email":     admin.Email,
				"role":      admin.Role,
			},
		})
	} else {
		var user models.User
		if err := config.DB.First(&user, userID).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"code": 404, "message": "用户不存在"})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"code": 200,
			"data": gin.H{
				"id":         user.ID,
				"username":   user.Username,
				"real_name":  user.RealName,
				"gender":     user.Gender,
				"phone":      user.Phone,
				"email":      user.Email,
				"department": user.Department,
				"position":   user.Position,
				"role":       user.Role,
				"avatar":     user.Avatar,
			},
		})
	}
}

func UpdateUserInfo(c *gin.Context) {
	userID := c.GetUint("user_id")
	role := c.GetString("role")

	if role == "employee" {
		var user models.User
		if err := config.DB.First(&user, userID).Error; err != nil {
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
			Avatar     string `json:"avatar"`
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
		if input.Avatar != "" {
			user.Avatar = input.Avatar
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
}

func ChangePassword(c *gin.Context) {
	userID := c.GetUint("user_id")
	role := c.GetString("role")

	var input struct {
		OldPassword string `json:"old_password" binding:"required"`
		NewPassword string `json:"new_password" binding:"required"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"code": 400, "message": "参数错误"})
		return
	}

	if role == "admin" {
		var admin models.Admin
		if err := config.DB.First(&admin, userID).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"code": 404, "message": "用户不存在"})
			return
		}

		if err := bcrypt.CompareHashAndPassword([]byte(admin.Password), []byte(input.OldPassword)); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"code": 400, "message": "原密码错误"})
			return
		}

		hashedPassword, err := bcrypt.GenerateFromPassword([]byte(input.NewPassword), bcrypt.DefaultCost)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"code": 500, "message": "密码加密失败"})
			return
		}

		admin.Password = string(hashedPassword)
		if err := config.DB.Save(&admin).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"code": 500, "message": "更新失败"})
			return
		}
	} else {
		var user models.User
		if err := config.DB.First(&user, userID).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"code": 404, "message": "用户不存在"})
			return
		}

		if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(input.OldPassword)); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"code": 400, "message": "原密码错误"})
			return
		}

		hashedPassword, err := bcrypt.GenerateFromPassword([]byte(input.NewPassword), bcrypt.DefaultCost)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"code": 500, "message": "密码加密失败"})
			return
		}

		user.Password = string(hashedPassword)
		if err := config.DB.Save(&user).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"code": 500, "message": "更新失败"})
			return
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"code":    200,
		"message": "密码修改成功",
	})
}
