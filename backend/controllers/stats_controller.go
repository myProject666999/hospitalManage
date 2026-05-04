package controllers

import (
	"hospitalManage/config"
	"hospitalManage/models"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
)

func GetDashboardStats(c *gin.Context) {
	var totalUsers int64
	var totalDrugs int64
	var totalOrders int64
	var todayOrders int64

	config.DB.Model(&models.User{}).Count(&totalUsers)
	config.DB.Model(&models.Drug{}).Where("status = ?", 1).Count(&totalDrugs)
	config.DB.Model(&models.Order{}).Count(&totalOrders)

	today := time.Now().Format("2006-01-02")
	config.DB.Model(&models.Order{}).Where("date(created_at) = ?", today).Count(&todayOrders)

	var totalIncome, totalExpense float64
	config.DB.Model(&models.IncomeExpense{}).Where("type = ?", "income").Select("COALESCE(SUM(amount), 0)").Scan(&totalIncome)
	config.DB.Model(&models.IncomeExpense{}).Where("type = ?", "expense").Select("COALESCE(SUM(amount), 0)").Scan(&totalExpense)

	var lowStockDrugs []models.Drug
	config.DB.Model(&models.Drug{}).Where("stock < min_stock AND status = ?", 1).Find(&lowStockDrugs)

	c.JSON(http.StatusOK, gin.H{
		"code": 200,
		"data": gin.H{
			"total_users":      totalUsers,
			"total_drugs":      totalDrugs,
			"total_orders":     totalOrders,
			"today_orders":     todayOrders,
			"total_income":     totalIncome,
			"total_expense":    totalExpense,
			"balance":          totalIncome - totalExpense,
			"low_stock_drugs":  lowStockDrugs,
			"low_stock_count":  len(lowStockDrugs),
		},
	})
}

func GetGenderStats(c *gin.Context) {
	type GenderCount struct {
		Gender string `json:"gender"`
		Count  int64  `json:"count"`
	}

	var results []GenderCount
	config.DB.Model(&models.User{}).Select("gender, COUNT(*) as count").Group("gender").Scan(&results)

	var maleCount, femaleCount, otherCount int64
	for _, r := range results {
		switch r.Gender {
		case "男":
			maleCount = r.Count
		case "女":
			femaleCount = r.Count
		default:
			otherCount += r.Count
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"code": 200,
		"data": []gin.H{
			{"name": "男", "value": maleCount},
			{"name": "女", "value": femaleCount},
			{"name": "其他", "value": otherCount},
		},
	})
}

func GetDrugCategoryStats(c *gin.Context) {
	type CategoryStats struct {
		Name  string `json:"name"`
		Count int64  `json:"count"`
	}

	var results []CategoryStats
	config.DB.Raw(`
		SELECT dc.name, COUNT(d.id) as count 
		FROM drug_categories dc 
		LEFT JOIN drugs d ON dc.id = d.category_id AND d.status = 1 
		GROUP BY dc.id, dc.name
	`).Scan(&results)

	c.JSON(http.StatusOK, gin.H{
		"code": 200,
		"data": results,
	})
}

func GetDrugStockStats(c *gin.Context) {
	type DrugStock struct {
		Name  string `json:"name"`
		Stock int    `json:"stock"`
	}

	var results []DrugStock
	config.DB.Model(&models.Drug{}).Select("name, stock").Where("status = ?", 1).Order("stock DESC").Limit(10).Scan(&results)

	c.JSON(http.StatusOK, gin.H{
		"code": 200,
		"data": results,
	})
}

func GetSalesStats(c *gin.Context) {
	startDate := c.Query("start_date")
	endDate := c.Query("end_date")

	if startDate == "" {
		startDate = time.Now().AddDate(0, -6, 0).Format("2006-01-02")
	}
	if endDate == "" {
		endDate = time.Now().Format("2006-01-02")
	}

	type DailySales struct {
		Date   string  `json:"date"`
		Amount float64 `json:"amount"`
	}

	var results []DailySales
	config.DB.Raw(`
		SELECT 
			strftime('%Y-%m-%d', created_at) as date,
			COALESCE(SUM(total_amount), 0) as amount
		FROM orders 
		WHERE date(created_at) >= ? AND date(created_at) <= ?
		GROUP BY strftime('%Y-%m-%d', created_at)
		ORDER BY date
	`, startDate, endDate).Scan(&results)

	c.JSON(http.StatusOK, gin.H{
		"code": 200,
		"data": results,
	})
}

func GetMonthlySalesStats(c *gin.Context) {
	type MonthlySales struct {
		Month  string  `json:"month"`
		Amount float64 `json:"amount"`
	}

	var results []MonthlySales
	config.DB.Raw(`
		SELECT 
			strftime('%Y-%m', created_at) as month,
			COALESCE(SUM(total_amount), 0) as amount
		FROM orders 
		WHERE created_at >= date('now', '-12 months')
		GROUP BY strftime('%Y-%m', created_at)
		ORDER BY month
	`).Scan(&results)

	c.JSON(http.StatusOK, gin.H{
		"code": 200,
		"data": results,
	})
}

func GetIncomeExpenseStats(c *gin.Context) {
	type CategoryStats struct {
		Category string  `json:"category"`
		Amount   float64 `json:"amount"`
	}

	var incomeStats []CategoryStats
	config.DB.Model(&models.IncomeExpense{}).
		Where("type = ?", "income").
		Select("category, COALESCE(SUM(amount), 0) as amount").
		Group("category").
		Scan(&incomeStats)

	var expenseStats []CategoryStats
	config.DB.Model(&models.IncomeExpense{}).
		Where("type = ?", "expense").
		Select("category, COALESCE(SUM(amount), 0) as amount").
		Group("category").
		Scan(&expenseStats)

	c.JSON(http.StatusOK, gin.H{
		"code": 200,
		"data": gin.H{
			"income":  incomeStats,
			"expense": expenseStats,
		},
	})
}
