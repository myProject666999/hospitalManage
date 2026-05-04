package database

import (
	"hospitalManage/config"
	"hospitalManage/models"
	"log"

	"golang.org/x/crypto/bcrypt"
)

func Migrate() {
	config.DB.AutoMigrate(
		&models.User{},
		&models.Admin{},
		&models.Attendance{},
		&models.DrugCategory{},
		&models.Drug{},
		&models.DrugInventory{},
		&models.Order{},
		&models.OrderItem{},
		&models.IncomeExpense{},
		&models.News{},
		&models.Banner{},
		&models.Log{},
	)

	log.Println("Database migration completed")

	initDefaultData()
}

func initDefaultData() {
	var adminCount int64
	config.DB.Model(&models.Admin{}).Count(&adminCount)

	if adminCount == 0 {
		hashedPassword, err := bcrypt.GenerateFromPassword([]byte("admin123"), bcrypt.DefaultCost)
		if err == nil {
			admin := models.Admin{
				Username: "admin",
				Password: string(hashedPassword),
				RealName: "系统管理员",
				Phone:    "13800138000",
				Email:    "admin@hospital.com",
				Role:     "admin",
				Status:   1,
			}
			config.DB.Create(&admin)
			log.Println("Default admin account created: admin / admin123")
		}
	}

	var categoryCount int64
	config.DB.Model(&models.DrugCategory{}).Count(&categoryCount)

	if categoryCount == 0 {
		categories := []models.DrugCategory{
			{Name: "感冒药", Description: "用于治疗感冒的药品"},
			{Name: "消炎药", Description: "用于治疗炎症的药品"},
			{Name: "止痛药", Description: "用于缓解疼痛的药品"},
			{Name: "肠胃药", Description: "用于治疗肠胃疾病的药品"},
			{Name: "维生素", Description: "补充维生素的药品"},
		}
		for _, c := range categories {
			config.DB.Create(&c)
		}
		log.Println("Default drug categories created")
	}
}
