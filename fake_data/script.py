import csv
import random
from faker import Faker
from datetime import date, datetime, timedelta, time as dtime
from decimal import Decimal

#edit
# weeks of sales history
alpha = 52

# millions of dollars in sales
beta = 1000000

# number of peak days
phi = 3

# how many menu items
delta = 20

# Number of required queries
epsilon = 15

# First nth special queries
theta = 4

# Number of employees
EMPLOYEE_COUNT = 10

NUM_CUSTOMERS = 1000

csv_menu = 'menu.csv'
csv_inventory = 'inventory.csv'
csv_customer = 'customer.csv'
csv_employee = 'employee.csv'
csv_order_history = 'order_history.csv'

# ------------ Menu ------------

# Changed the ingredients field from a string to a set to make it easier to parse in SQL (Alex)
boba_menu = [
    {"productID": 1, "category": "Classics", "productName": "Classic Milk Tea", "ingredients": "{black tea,milk,tapioca pearls,sugar}", "price": 5.25, "discount": 0.0},


    {"productID": 2, "category": "Classics", "productName": "Taro Milk Tea", "ingredients": "{taro powder,milk,tapioca pearls,sugar}", "price": 5.75, "discount": 0.1},


    {"productID": 3, "category": "Classics", "productName": "Matcha Milk Tea", "ingredients": "{matcha,milk,sugar,tapioca pearls}", "price": 6.00, "discount": 0.0},


    {"productID": 4, "category": "Classics", "productName": "Thai Milk Tea", "ingredients": "{thai tea,condensed milk,sugar,tapioca pearls}", "price": 5.95, "discount": 0.05},


    {"productID": 5, "category": "Creamy","productName": "Brown Sugar Boba", "ingredients": "{brown sugar syrup,milk,tapioca pearls}", "price": 6.50, "discount": 0.0},


    {"productID": 6, "category": "Creamy", "productName": "Honeydew Milk Tea", "ingredients": "{honeydew flavoring,milk,sugar,tapioca pearls}", "price": 5.75, "discount": 0.0},


    {"productID": 7, "category": "Creamy", "productName": "Strawberry Milk Tea", "ingredients": "{strawberry syrup,milk,sugar,tapioca pearls}", "price": 5.85, "discount": 0.15},


    {"productID": 8, "category": "Fruity", "productName": "Mango Green Tea", "ingredients": "{green tea,mango syrup,sugar,ice}", "price": 5.50, "discount": 0.1},


    {"productID": 9, "category": "Fruity", "productName": "Passion Fruit Tea", "ingredients": "{jasmine tea,passion fruit syrup,sugar}", "price": 5.25, "discount": 0.0},


    {"productID": 10, "category": "Fruity", "productName": "Lychee Black Tea", "ingredients": "{black tea,lychee syrup,sugar}", "price": 5.40, "discount": 0.0},


    {"productID": 11, "category": "Fruity", "productName": "Peach Oolong Tea", "ingredients": "{oolong tea,peach syrup,sugar}", "price": 5.45, "discount": 0.05},


    {"productID": 12, "category": "Fruity", "productName": "Wintermelon Tea", "ingredients": "{wintermelon syrup,black tea,sugar}", "price": 5.30, "discount": 0.0},


    {"productID": 13, "category": "Creamy", "productName": "Coffee Milk Tea", "ingredients": "{coffee,milk,sugar,tapioca pearls}", "price": 6.10, "discount": 0.0},


    {"productID": 14, "category": "Savory", "productName": "Almond Milk Tea", "ingredients": "{almond flavoring,milk,sugar,tapioca pearls}", "price": 5.90, "discount": 0.0},


    {"productID": 15, "category": "Savory", "productName": "Chocolate Milk Tea", "ingredients": "{chocolate syrup,milk,sugar,tapioca pearls}", "price": 5.80, "discount": 0.2},


    {"productID": 16, "category": "Savory", "productName": "Coconut Milk Tea", "ingredients": "{coconut milk,black tea,sugar,tapioca pearls}", "price": 5.95, "discount": 0.0},


    {"productID": 17, "category": "Savory", "productName": "Jasmine Green Milk Tea", "ingredients": "{jasmine green tea,milk,sugar,tapioca pearls}", "price": 5.60, "discount": 0.0},


    {"productID": 18, "category": "Fruity", "productName": "Pineapple Fruit Tea", "ingredients": "{green tea,pineapple syrup,sugar}", "price": 5.45, "discount": 0.1},


    {"productID": 19, "category": "Fruity", "productName": "Blueberry Fruit Tea", "ingredients": "{black tea,blueberry syrup,sugar}", "price": 5.55, "discount": 0.0},


    {"productID": 20, "category": "Specialties", "productName": "Matcha Red Bean Latte", "ingredients": "{matcha,red beans,milk,sugar}", "price": 6.50, "discount": 0.05},


    {"productID": 21, "category": "Specialties", "productName": "Hokkaido Milk Tea", "ingredients": "{black tea,caramel milk,sugar,tapioca pearls}", "price": 6.25, "discount": 0.0},


    {"productID": 22, "category": "Specialties", "productName": "Salted Cream Cheese Tea", "ingredients": "{green tea,cream cheese foam,sugar}", "price": 6.75, "discount": 0.1},


    {"productID": 23, "category": "Specialties", "productName": "Brown Sugar Matcha Latte", "ingredients": "{matcha,brown sugar,milk}", "price": 7.25, "discount": 0.0},


    {"productID": 24, "category": "Specialties", "productName": "Strawberry Matcha Fusion", "ingredients": "{matcha,strawberry puree,milk,sugar}", "price": 7.75, "discount": 0.05}
]

inventory = [

    # ---Tea Bases---
    {"inventoryID": 1, "ingredientName": "black tea", "quantity": 180, "price": 22.50},
    {"inventoryID": 2, "ingredientName": "green tea", "quantity": 160, "price": 21.00},
    {"inventoryID": 3, "ingredientName": "jasmine tea", "quantity": 120, "price": 23.00},
    {"inventoryID": 4, "ingredientName": "oolong tea", "quantity": 95, "price": 24.50},
    {"inventoryID": 5, "ingredientName": "thai tea", "quantity": 80, "price": 19.75},

    # ---Milk---
    {"inventoryID": 6, "ingredientName": "milk", "quantity": 140, "price": 3.20},
    {"inventoryID": 7, "ingredientName": "condensed milk", "quantity": 90, "price": 2.10},
    {"inventoryID": 8, "ingredientName": "coconut milk", "quantity": 70, "price": 2.85},
    {"inventoryID": 9, "ingredientName": "caramel milk", "quantity": 60, "price": 3.40},

    # ---Sweeteners---
    {"inventoryID": 10, "ingredientName": "sugar", "quantity": 220, "price": 1.40},
    {"inventoryID": 11, "ingredientName": "brown sugar syrup", "quantity": 95, "price": 4.20},
    {"inventoryID": 12, "ingredientName": "honey", "quantity": 45, "price": 5.80},

    # ---Toppings---
    {"inventoryID": 13, "ingredientName": "tapioca pearls", "quantity": 260, "price": 8.50},
    {"inventoryID": 14, "ingredientName": "red beans", "quantity": 60, "price": 6.10},
    {"inventoryID": 15, "ingredientName": "cream cheese foam", "quantity": 55, "price": 7.25},

    # ---Powders---
    {"inventoryID": 16, "ingredientName": "matcha", "quantity": 70, "price": 14.00},
    {"inventoryID": 17, "ingredientName": "taro powder", "quantity": 90, "price": 11.75},
    {"inventoryID": 18, "ingredientName": "coffee", "quantity": 65, "price": 9.60},
    {"inventoryID": 19, "ingredientName": "almond flavoring", "quantity": 50, "price": 6.00},

    # ---Fruit Syrups---
    {"inventoryID": 20, "ingredientName": "mango syrup", "quantity": 75, "price": 6.30},
    {"inventoryID": 21, "ingredientName": "strawberry syrup", "quantity": 85, "price": 6.10},
    {"inventoryID": 22, "ingredientName": "peach syrup", "quantity": 70, "price": 5.90},
    {"inventoryID": 23, "ingredientName": "lychee syrup", "quantity": 60, "price": 6.25},
    {"inventoryID": 24, "ingredientName": "passion fruit syrup", "quantity": 65, "price": 6.40},
    {"inventoryID": 25, "ingredientName": "pineapple syrup", "quantity": 55, "price": 5.80},
    {"inventoryID": 26, "ingredientName": "blueberry syrup", "quantity": 50, "price": 6.35},
    {"inventoryID": 27, "ingredientName": "wintermelon syrup", "quantity": 70, "price": 5.50},
    {"inventoryID": 28, "ingredientName": "honeydew flavoring", "quantity": 60, "price": 5.75},
    {"inventoryID": 29, "ingredientName": "chocolate syrup", "quantity": 65, "price": 6.20},

    # --- Packaging / Supplies ---
    {"inventoryID": 30, "ingredientName": "8oz plastic cups", "quantity": 1000, "price": 0.08},
    {"inventoryID": 31, "ingredientName": "16oz plastic cups", "quantity": 1200, "price": 0.10},
    {"inventoryID": 32, "ingredientName": "24oz plastic cups", "quantity": 1200, "price": 0.12},
    {"inventoryID": 33, "ingredientName": "32oz plastic cups", "quantity": 1000, "price": 0.14},
    {"inventoryID": 34, "ingredientName": "boba straws", "quantity": 2000, "price": 0.04},
    {"inventoryID": 35, "ingredientName": "napkins", "quantity": 3000, "price": 0.01},
    {"inventoryID": 36, "ingredientName": "togo containers", "quantity": 350, "price": 0.28},
    {"inventoryID": 37, "ingredientName": "plastic bags", "quantity": 600, "price": 0.15},
    {"inventoryID": 38, "ingredientName": "gloves (box)", "quantity": 40, "price": 4.50},
    {"inventoryID": 39, "ingredientName": "cleaning wipes", "quantity": 50, "price": 3.20},
    {"inventoryID": 40, "ingredientName": "stirrers", "quantity": 1500, "price": 0.02},
    {"inventoryID": 41, "ingredientName": "sealing film rolls", "quantity": 25, "price": 7.75}
]

with open(csv_menu, mode='w', newline='') as file:
    # Create a csv.writer object
    writer = csv.writer(file)


    # Header
    writer.writerow(["productID", "category", "productName", "ingredients", "price", "discount"])


    # Write data

    for i in range(len(boba_menu)):
        productID = boba_menu[i]["productID"]
        category = boba_menu[i]["category"]
        productName = boba_menu[i]["productName"]
        ingredients = boba_menu[i]["ingredients"]
        price = boba_menu[i]["price"]
        discount = boba_menu[i]["discount"]

        writer.writerow([productID, category, productName, ingredients, price, discount])

print("menu.csv created!")

# ------------ Employee Accounts ------------

fake = Faker()
fake.unique.clear()
with open(csv_employee, mode='w', newline='') as file:
    # Create a csv.writer object
    writer = csv.writer(file)


    # Header
    writer.writerow(["employeeID", "fullName", "isManager", "hoursWorked", "hourlyPay", "password"])

    # Write data
    for i in range (EMPLOYEE_COUNT):
        employeeID = i
        fullName = fake.name()
        isManager = i % 5 == 0 # every 5th employee is a manager
        hoursWorked = random.randint(10, 40) # random hours between 10 and 40
        hourlyPay = 25 if i % 5 == 0 else 15 # managers get $25/hr, others get $15/hr



        #Write all the data
        writer.writerow([employeeID, fullName, isManager, hoursWorked, hourlyPay])

print("employee.csv created!")

# ------------ Customer Accounts ------------

fake = Faker()
fake.unique.clear()
with open(csv_customer, mode='w', newline='') as file:
    # Create a csv.writer object
    writer = csv.writer(file)

    # Header
    writer.writerow(["username", "firstName", "lastName", "email", "phoneNumber", "rewardPoints", "transactions"])

    # Write data
    for i in range (NUM_CUSTOMERS):
        firstName = fake.first_name()
        lastName = fake.last_name()
        username = f"{firstName.lower()}.{lastName.lower()}"
        email = fake.email()
        phoneNumber =  fake.phone_number()
        transactions = random.randint(1, 25)
        rewardPoints = transactions * 50

        #Write all the data
        writer.writerow([username, firstName, lastName, email, phoneNumber, rewardPoints, transactions])
print("customer.csv created!")


# ------------ Order History ------------
OPEN = dtime(8, 0)
CLOSE = dtime(22, 0)

def next_timestamp_same_day(current_time, day_date, gap_divisor=1.0):
    """
    Move forward by a realistic transaction gap, but do NOT spill into the next day.
    If we would pass closing, clamp to closing time (caller can stop).

    gap_divisor > 1.0 makes orders closer together (peak days).
    """
    base_gap = random.randint(80, 320)
    gap_seconds = max(1, int(round(base_gap / gap_divisor)))

    new_time = current_time + timedelta(seconds=gap_seconds)

    close_dt = datetime.combine(day_date, CLOSE)
    if new_time > close_dt:
        return close_dt

    return new_time


# ------------ CONFIG ------------
YEAR = 2025
START = datetime(YEAR, 1, 1)
DAYS = 365

AVG_ORDERS_PER_DAY = 250
DAY_VARIANCE = 25
USE_PEAK_DAYS = True
phi = 3
PEAK_ORDER_MULT = 5  # peak days have 5x more orders AND 5x faster arrivals
sales = Decimal("0.00")
# -------------------------------

HARDCODED_PEAK_DATES = {
    date(2025, 9, 27),   # Auburn
    date(2025, 10, 11),    # Florida
    date(2025, 11, 15)   # South Carolina
}

peak_days = set()
if USE_PEAK_DAYS:
    for d in HARDCODED_PEAK_DATES:
        day_index = (d - START.date()).days
        if 0 <= day_index < DAYS:
            peak_days.add(day_index)
    print("Peak days:", sorted(HARDCODED_PEAK_DATES))


transaction_id = 0

with open(csv_order_history, mode="w", newline="") as file:
    writer = csv.writer(file)
    writer.writerow(["transactionID", "time", "date", "price", "numItems",
                 "employeeID", "customerID", "productIDs", "paymentType"])

    for day_index in range(DAYS):
        day_date = (START + timedelta(days=day_index)).date()

        base_orders = AVG_ORDERS_PER_DAY + random.randint(-DAY_VARIANCE, DAY_VARIANCE)
        base_orders = max(1, base_orders)

        is_peak = (day_index in peak_days)

        orders_today = int(round(base_orders * PEAK_ORDER_MULT)) if is_peak else base_orders
        gap_divisor = PEAK_ORDER_MULT if is_peak else 1.0 

        current_timestamp = datetime.combine(day_date, OPEN)
        close_dt = datetime.combine(day_date, CLOSE)

        for _ in range(orders_today):
            if current_timestamp >= close_dt:
                break

            timestamp = current_timestamp
            current_timestamp = next_timestamp_same_day(current_timestamp, day_date, gap_divisor=gap_divisor)

            numItems = random.choices(
                [1, 2, 3, 4, 5, 6],
                weights=[40, 25, 15, 10, 6, 4],
                k=1
            )[0]

            productIds = []
            price = Decimal("0.00")

            for __ in range(numItems):
                selected_item = random.choice(boba_menu)
                selected_price = Decimal(str(selected_item["price"]))
                price += selected_price
                productIds.append(selected_item["productID"])

            payment_type = random.choices(
                ["CASH", "CARD"],
                weights=[30, 70],
                k=1
            )[0]

            writer.writerow([
                transaction_id,
                timestamp.strftime("%H:%M:%S"),
                timestamp.strftime("%Y-%m-%d"),
                str(price),
                numItems,
                random.randint(1, EMPLOYEE_COUNT - 1),
                random.randint(1, NUM_CUSTOMERS),
                "{" + ",".join(str(pid) for pid in productIds) + "}",
                payment_type
            ])

            transaction_id += 1
            sales += price

print("order_history.csv created!")

# ------------ Inventory ------------
    
print(f"Total sales: ${sales}")

    
# ------------ Inventory ------------    

with open(csv_inventory, mode='w', newline='') as file: 
    # Create a csv.writer object
    writer = csv.writer(file)

    # Header
    writer.writerow(["inventoryID", "ingredientName", "quantity", "price"])

    # Write data
    for item in inventory:
        inventoryID = item["inventoryID"]
        ingredientName = item["ingredientName"]   # cannot have a column named "name" in SQL
        quantity = item["quantity"]
        price = item["price"]

        #Write all the data
        writer.writerow([inventoryID, ingredientName, quantity, price])

print("inventory.csv created!")
