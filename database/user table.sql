create database dental;
show databases;
use dental;
create TABLE users (    id INT AUTO_INCREMENT PRIMARY KEY,    
name VARCHAR(255) NOT NULL,    email VARCHAR(255) UNIQUE NOT NULL,    
password VARCHAR(255) NOT NULL,    dob DATE NOT NULL,    
phone VARCHAR(20) NULL,    
gender ENUM('male', 'female', 'other') NULL,    
address TEXT NULL,    role ENUM('user', 'admin') NOT NULL DEFAULT 'user',    
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);
desc users
