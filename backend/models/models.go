package models

import (
	"time"

	"gorm.io/gorm"
)

type User struct {
	gorm.Model
	Username     string `gorm:"unique;not null" json:"username"`
	Password     string `gorm:"not null" json:"-"`
	RealName     string `json:"real_name"`
	Gender       string `json:"gender"`
	Phone        string `json:"phone"`
	Email        string `json:"email"`
	Department   string `json:"department"`
	Position     string `json:"position"`
	Role         string `gorm:"default:'employee'" json:"role"`
	Status       int    `gorm:"default:1" json:"status"`
	Avatar       string `json:"avatar"`
}

type Admin struct {
	gorm.Model
	Username string `gorm:"unique;not null" json:"username"`
	Password string `gorm:"not null" json:"-"`
	RealName string `json:"real_name"`
	Phone    string `json:"phone"`
	Email    string `json:"email"`
	Role     string `gorm:"default:'admin'" json:"role"`
	Status   int    `gorm:"default:1" json:"status"`
}

type Attendance struct {
	gorm.Model
	UserID    uint      `json:"user_id"`
	User      User      `gorm:"foreignKey:UserID" json:"user"`
	ClockIn   time.Time `json:"clock_in"`
	ClockOut  time.Time `json:"clock_out"`
	Date      string    `json:"date"`
	Status    string    `json:"status"`
	WorkHours float64   `json:"work_hours"`
}

type DrugCategory struct {
	gorm.Model
	Name        string `gorm:"unique;not null" json:"name"`
	Description string `json:"description"`
	Drugs       []Drug `gorm:"foreignKey:CategoryID" json:"-"`
}

type Drug struct {
	gorm.Model
	Name          string       `gorm:"not null" json:"name"`
	Code          string       `gorm:"unique;not null" json:"code"`
	CategoryID    uint         `json:"category_id"`
	Category      DrugCategory `gorm:"foreignKey:CategoryID" json:"category"`
	Specification string       `json:"specification"`
	Unit          string       `json:"unit"`
	Price         float64      `json:"price"`
	Stock         int          `json:"stock"`
	MinStock      int          `gorm:"default:10" json:"min_stock"`
	Description   string       `json:"description"`
	Status        int          `gorm:"default:1" json:"status"`
	Image         string       `json:"image"`
}

type DrugInventory struct {
	gorm.Model
	DrugID      uint `json:"drug_id"`
	Drug        Drug `gorm:"foreignKey:DrugID" json:"drug"`
	Type        string `json:"type"`
	Quantity    int    `json:"quantity"`
	BeforeStock int    `json:"before_stock"`
	AfterStock  int    `json:"after_stock"`
	OperatorID  uint   `json:"operator_id"`
	Operator    User   `gorm:"foreignKey:OperatorID" json:"operator"`
	Remark      string `json:"remark"`
	BatchNo     string `json:"batch_no"`
}

type Order struct {
	gorm.Model
	OrderNo     string      `gorm:"unique;not null" json:"order_no"`
	Customer    string      `json:"customer"`
	Phone       string      `json:"phone"`
	Address     string      `json:"address"`
	TotalAmount float64     `json:"total_amount"`
	Status      string      `gorm:"default:'pending'" json:"status"`
	OperatorID  uint        `json:"operator_id"`
	Operator    User        `gorm:"foreignKey:OperatorID" json:"operator"`
	Remark      string      `json:"remark"`
	OrderItems  []OrderItem `gorm:"foreignKey:OrderID" json:"order_items"`
}

type OrderItem struct {
	gorm.Model
	OrderID   uint    `json:"order_id"`
	DrugID    uint    `json:"drug_id"`
	Drug      Drug    `gorm:"foreignKey:DrugID" json:"drug"`
	Quantity  int     `json:"quantity"`
	UnitPrice float64 `json:"unit_price"`
	Amount    float64 `json:"amount"`
}

type IncomeExpense struct {
	gorm.Model
	Type        string  `json:"type"`
	Amount      float64 `json:"amount"`
	Category    string  `json:"category"`
	Description string  `json:"description"`
	OperatorID  uint    `json:"operator_id"`
	Operator    User    `gorm:"foreignKey:OperatorID" json:"operator"`
	Remark      string  `json:"remark"`
}

type News struct {
	gorm.Model
	Title   string `gorm:"not null" json:"title"`
	Content string `gorm:"type:text" json:"content"`
	Author  string `json:"author"`
	Status  int    `gorm:"default:1" json:"status"`
	Views   int    `gorm:"default:0" json:"views"`
}

type Banner struct {
	gorm.Model
	Title       string `json:"title"`
	Image       string `json:"image"`
	Link        string `json:"link"`
	Sort        int    `gorm:"default:0" json:"sort"`
	Status      int    `gorm:"default:1" json:"status"`
	Description string `json:"description"`
}

type Log struct {
	gorm.Model
	UserID     uint   `json:"user_id"`
	Username   string `json:"username"`
	Module     string `json:"module"`
	Action     string `json:"action"`
	IP         string `json:"ip"`
	UserAgent  string `json:"user_agent"`
	Params     string `json:"params"`
	Result     string `json:"result"`
	Status     int    `json:"status"`
}
