--Create tables first
CREATE TABLE employee_accounts (
    employeeID SERIAL PRIMARY KEY,
    employeeName VARCHAR(100),
    isManager BOOLEAN,
    hoursWorked INT,
    hourlyPay DECIMAL(10, 2)
);

CREATE TABLE menu (
    productID SERIAL PRIMARY KEY,
    productName VARCHAR(200),
    ingredients VARCHAR(100)[],
    price DECIMAL(10, 2),
    discount DECIMAL(10, 2)
);

CREATE TABLE customer_accounts (
    username VARCHAR(100),
    firstName VARCHAR(50),
    lastName VARCHAR(50),
    email VARCHAR(100),
    phoneNumber VARCHAR(20),
    PRIMARY KEY (username),
    rewardPoints INT,
    transactions INT
);

\copy employee_accounts from 'employee.csv' CSV HEADER;
\copy menu from 'menu.csv' CSV HEADER;
\copy customer_accounts from 'customer.csv' CSV HEADER;