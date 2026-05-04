package router

import (
	"hospitalManage/controllers"
	"hospitalManage/middleware"

	"github.com/gin-gonic/gin"
)

func SetupRoutes(r *gin.Engine) {
	r.Use(func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT, DELETE")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	})

	api := r.Group("/api")
	{
		api.POST("/register", controllers.Register)
		api.POST("/login", controllers.Login)

		api.GET("/banners", controllers.GetBanners)
		api.GET("/news", controllers.GetNewsList)
		api.GET("/news/:id", controllers.GetNewsByID)
		api.GET("/drugs", controllers.GetDrugs)
		api.GET("/drugs/:id", controllers.GetDrugByID)
		api.GET("/drug-categories", controllers.GetDrugCategories)
	}

	employee := api.Group("/employee")
	employee.Use(middleware.AuthMiddleware(), middleware.EmployeeMiddleware())
	{
		employee.GET("/user/info", controllers.GetUserInfo)
		employee.PUT("/user/info", controllers.UpdateUserInfo)
		employee.POST("/user/change-password", controllers.ChangePassword)

		employee.POST("/attendance/clock-in", controllers.ClockIn)
		employee.POST("/attendance/clock-out", controllers.ClockOut)
		employee.GET("/attendance/today", controllers.GetTodayAttendance)
		employee.GET("/attendance/my", controllers.GetMyAttendanceList)

		employee.GET("/drugs", controllers.GetDrugs)
		employee.GET("/drugs/:id", controllers.GetDrugByID)
		employee.GET("/drug-categories", controllers.GetDrugCategories)

		employee.GET("/inventory/my", controllers.GetMyInventoryRecords)
		employee.POST("/inventory", controllers.CreateInventoryRecord)

		employee.GET("/orders/my", controllers.GetMyOrders)
		employee.GET("/orders/:id", controllers.GetOrderByID)
		employee.POST("/orders", controllers.CreateOrder)

		employee.GET("/income-expense/my", controllers.GetMyIncomeExpenseList)
		employee.POST("/income-expense", controllers.CreateIncomeExpense)

		employee.GET("/news", controllers.GetNewsList)
		employee.GET("/news/:id", controllers.GetNewsByID)
	}

	admin := api.Group("/admin")
	admin.Use(middleware.AuthMiddleware(), middleware.AdminMiddleware())
	{
		admin.GET("/dashboard", controllers.GetDashboardStats)
		admin.GET("/stats/gender", controllers.GetGenderStats)
		admin.GET("/stats/drug-category", controllers.GetDrugCategoryStats)
		admin.GET("/stats/drug-stock", controllers.GetDrugStockStats)
		admin.GET("/stats/sales", controllers.GetSalesStats)
		admin.GET("/stats/monthly-sales", controllers.GetMonthlySalesStats)
		admin.GET("/stats/income-expense", controllers.GetIncomeExpenseStats)

		admin.GET("/user/info", controllers.GetUserInfo)
		admin.POST("/user/change-password", controllers.ChangePassword)

		admin.GET("/admins", controllers.GetAdmins)
		admin.GET("/admins/:id", controllers.GetAdminByID)
		admin.POST("/admins", controllers.CreateAdmin)
		admin.PUT("/admins/:id", controllers.UpdateAdmin)
		admin.DELETE("/admins/:id", controllers.DeleteAdmin)

		admin.GET("/users", controllers.GetUsers)
		admin.GET("/users/:id", controllers.GetUserByID)
		admin.PUT("/users/:id", controllers.UpdateUser)
		admin.DELETE("/users/:id", controllers.DeleteUser)

		admin.GET("/attendance", controllers.GetAllAttendanceList)
		admin.PUT("/attendance/:id", controllers.UpdateAttendance)

		admin.GET("/drugs", controllers.GetDrugs)
		admin.GET("/drugs/:id", controllers.GetDrugByID)
		admin.POST("/drugs", controllers.CreateDrug)
		admin.PUT("/drugs/:id", controllers.UpdateDrug)
		admin.DELETE("/drugs/:id", controllers.DeleteDrug)

		admin.GET("/drug-categories", controllers.GetDrugCategories)
		admin.POST("/drug-categories", controllers.CreateDrugCategory)
		admin.PUT("/drug-categories/:id", controllers.UpdateDrugCategory)
		admin.DELETE("/drug-categories/:id", controllers.DeleteDrugCategory)

		admin.GET("/inventory", controllers.GetInventoryRecords)
		admin.POST("/inventory", controllers.CreateInventoryRecord)

		admin.GET("/orders", controllers.GetOrders)
		admin.GET("/orders/:id", controllers.GetOrderByID)
		admin.PUT("/orders/:id/status", controllers.UpdateOrderStatus)

		admin.GET("/income-expense", controllers.GetIncomeExpenseList)
		admin.POST("/income-expense", controllers.CreateIncomeExpense)
		admin.GET("/income-expense/stats", controllers.GetIncomeExpenseSummary)
		admin.DELETE("/income-expense/:id", controllers.DeleteIncomeExpense)

		admin.GET("/banners", controllers.GetAllBanners)
		admin.POST("/banners", controllers.CreateBanner)
		admin.PUT("/banners/:id", controllers.UpdateBanner)
		admin.DELETE("/banners/:id", controllers.DeleteBanner)

		admin.GET("/news", controllers.GetAllNews)
		admin.GET("/news/:id", controllers.GetNewsByID)
		admin.POST("/news", controllers.CreateNews)
		admin.PUT("/news/:id", controllers.UpdateNews)
		admin.DELETE("/news/:id", controllers.DeleteNews)

		admin.GET("/logs", controllers.GetLogs)
		admin.GET("/logs/:id", controllers.GetLogByID)
		admin.DELETE("/logs/:id", controllers.DeleteLog)
		admin.POST("/logs/clear", controllers.ClearLogs)
	}
}
