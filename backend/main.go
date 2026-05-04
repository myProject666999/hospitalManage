package main

import (
	"hospitalManage/config"
	"hospitalManage/database"
	"hospitalManage/router"
	"log"

	"github.com/gin-gonic/gin"
)

func main() {
	config.InitConfig()
	config.InitDB()
	database.Migrate()

	r := gin.Default()

	router.SetupRoutes(r)

	log.Println("Server starting on :8080")
	if err := r.Run(":8080"); err != nil {
		log.Fatal("Failed to start server:", err)
	}
}
