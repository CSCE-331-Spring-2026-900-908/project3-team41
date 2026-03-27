DROP TABLE IF EXISTS order_history;
DROP TABLE IF EXISTS menu;
DROP TABLE IF EXISTS inventory;
DROP TABLE IF EXISTS employee;
DROP TABLE IF EXISTS customer;

CREATE TABLE customer (
    username VARCHAR(100),
    firstName VARCHAR(100),
    lastName VARCHAR(100),
    email VARCHAR(200),
    phoneNumber VARCHAR(50),
    rewardPoints INT,
    transactions INT
);

CREATE TABLE employee (
    employeeID INT,
    employeeName VARCHAR(200),
    isManager BOOLEAN,
    hoursWorked INT,
    hourlyPay NUMERIC(10,2)
);

CREATE TABLE inventory (
    inventoryID INT,
    ingredientName VARCHAR(200),
    quantity NUMERIC(12,2),
    price NUMERIC(12,2)
);

CREATE TABLE menu (
    productID INT,
    category TEXT,
    itemName VARCHAR(200),
    ingredients TEXT,
    price NUMERIC(10,2),
    discount NUMERIC(10,2)
);

CREATE TABLE order_history (
    transactionID INT,
    time TIME,
    date DATE,
    price NUMERIC(10,2),
    numItems INT,
    employeeID INT,
    customerID INT,
    productIDs integer[],
    payment_type VARCHAR(200)
);

\copy customer(username, firstName, lastName, email, phoneNumber, rewardPoints, transactions) FROM 'customer.csv' WITH (FORMAT csv, HEADER true);

\copy employee(employeeID, employeeName, isManager, hoursWorked, hourlyPay) FROM 'employee.csv' WITH (FORMAT csv, HEADER true);

\copy inventory(inventoryID, ingredientName, quantity, price) FROM 'inventory.csv' WITH (FORMAT csv, HEADER true);

\copy menu(productID, category, itemName, ingredients, price, discount) FROM 'menu.csv' WITH (FORMAT csv, HEADER true);

\copy order_history(transactionID, time, date, price, numItems, employeeID, customerID, productIDs, payment_type) FROM 'order_history.csv' WITH (FORMAT csv, HEADER true);