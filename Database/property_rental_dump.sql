/*M!999999\- enable the sandbox mode */ 
-- MariaDB dump 10.19-12.0.2-MariaDB, for Win64 (AMD64)
--
-- Host: localhost    Database: property_rental
-- ------------------------------------------------------
-- Server version	12.0.2-MariaDB

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*M!100616 SET @OLD_NOTE_VERBOSITY=@@NOTE_VERBOSITY, NOTE_VERBOSITY=0 */;

--
-- Table structure for table `admins`
--

DROP TABLE IF EXISTS `admins`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `admins` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('ADMIN','SUPER_ADMIN') NOT NULL DEFAULT 'ADMIN',
  `status` enum('ACTIVE','INACTIVE') NOT NULL DEFAULT 'ACTIVE',
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  UNIQUE KEY `email_2` (`email`),
  UNIQUE KEY `email_3` (`email`),
  UNIQUE KEY `email_4` (`email`),
  UNIQUE KEY `email_5` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `admins`
--

LOCK TABLES `admins` WRITE;
/*!40000 ALTER TABLE `admins` DISABLE KEYS */;
set autocommit=0;
INSERT INTO `admins` VALUES
(1,'Default Admin','admin@example.com','$2a$12$RnKH/X7KT3WKDn7xc5G.xeDx5K9898ZE7O8zEmmMwilmJZSrINWIG','SUPER_ADMIN','ACTIVE','2025-10-07 12:32:06','2025-10-07 12:32:06'),
(3,'Mohamed Faisal','faisal@property.com','$2a$12$G5EpAoQd7MF3cwiiNmGZtu234NARgIvD8MhWv4N0aPs9xSc1L5OUW','ADMIN','ACTIVE','2025-10-10 05:31:43','2025-10-10 05:31:43'),
(4,'Mohamed Rahim','rahim@property.com','$2a$12$Pfv1KuJb0icBX9bT4U024.LshuCn3ug9llAHTj/CymkCH.sGMuCG6','SUPER_ADMIN','ACTIVE','2025-10-10 05:46:02','2025-10-18 10:06:08');
/*!40000 ALTER TABLE `admins` ENABLE KEYS */;
UNLOCK TABLES;
commit;

--
-- Table structure for table `bills`
--

DROP TABLE IF EXISTS `bills`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `bills` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tenant_id` int(11) NOT NULL,
  `property_id` int(11) NOT NULL,
  `admin_id` int(11) NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `rent_amount` decimal(10,2) DEFAULT NULL,
  `charges` decimal(10,2) DEFAULT 0.00,
  `total_amount` decimal(10,2) DEFAULT NULL,
  `month` varchar(7) NOT NULL,
  `due_date` date NOT NULL,
  `status` enum('PENDING','PAID','OVERDUE','RECEIPT_SENT') NOT NULL DEFAULT 'PENDING',
  `payment_date` date DEFAULT NULL,
  `description` text DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `bill_date` date NOT NULL,
  `language` enum('en','fr') NOT NULL DEFAULT 'fr',
  `pdf_path` varchar(500) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `bills_tenant_id_month` (`tenant_id`,`month`),
  KEY `bills_tenant_id` (`tenant_id`),
  KEY `bills_property_id` (`property_id`),
  KEY `bills_admin_id` (`admin_id`),
  KEY `bills_status` (`status`),
  KEY `bills_due_date` (`due_date`),
  KEY `bills_month` (`month`),
  CONSTRAINT `bills_ibfk_13` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `bills_ibfk_14` FOREIGN KEY (`property_id`) REFERENCES `properties` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `bills_ibfk_15` FOREIGN KEY (`admin_id`) REFERENCES `admins` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `bills`
--

LOCK TABLES `bills` WRITE;
/*!40000 ALTER TABLE `bills` DISABLE KEYS */;
set autocommit=0;
INSERT INTO `bills` VALUES
(1,6,6,3,499.99,499.99,0.00,499.99,'2025-10','2025-10-14','OVERDUE',NULL,'Facture mensuelle de loyer pour Mohamed FaisalPortfolio Faisal\nPropriété: faisal\nLoyer mensuel: €499.99\nTotal: €499.99','2025-10-10 06:26:28','2025-10-19 10:00:00','2025-10-01','fr',NULL),
(2,6,6,3,499.99,499.99,0.00,499.99,'2025-11','2025-11-14','PENDING',NULL,'Facture mensuelle de loyer pour Mohamed FaisalPortfolio Faisal\nPropriété: faisal\nLoyer mensuel: €499.99\nTotal: €499.99','2025-10-10 06:26:39','2025-10-10 06:26:39','2025-11-01','fr',NULL),
(3,6,6,3,499.99,499.99,0.00,499.99,'2025-12','2025-12-14','PENDING',NULL,'Facture mensuelle de loyer pour Mohamed FaisalPortfolio Faisal\nPropriété: faisal\nLoyer mensuel: €499.99\nTotal: €499.99','2025-10-10 06:29:43','2025-10-10 06:29:43','2025-12-01','fr',NULL),
(4,7,7,4,499.99,499.99,0.00,499.99,'2025-10','2025-10-14','OVERDUE',NULL,'Facture mensuelle de loyer pour Mohamed Faisal\nPropriété: Rahim\nLoyer mensuel: €499.99\nTotal: €499.99','2025-10-19 09:42:27','2025-10-21 10:00:00','2025-10-01','fr','C:\\Users\\faisa\\Downloads\\Rahim Anna France Project Home Sharing\\project\\backend\\uploads\\bills\\bill_4_2025-10_1760870592399.pdf'),
(5,7,7,4,499.99,499.99,0.00,499.99,'2025-11','2025-11-14','PENDING',NULL,'Facture mensuelle de loyer pour Mohamed Faisal\nPropriété: Rahim\nLoyer mensuel: €499.99\nTotal: €499.99','2025-10-19 09:43:13','2025-10-24 21:46:20','2025-11-01','fr','C:\\Users\\faisa\\Downloads\\Rahim Anna France Project Home Sharing\\project\\backend\\uploads\\bills\\bill_5_2025-11_1761342380079.pdf'),
(6,9,12,1,750.00,750.00,0.00,750.00,'2025-10','2025-10-19','OVERDUE',NULL,'Facture de test pour admin 1','2025-10-19 10:13:08','2025-10-21 10:00:00','2025-10-19','fr','C:\\Users\\faisa\\Downloads\\Rahim Anna France Project Home Sharing\\project\\backend\\uploads\\bills\\bill_6_2025-10_1760869673378.pdf'),
(7,9,12,1,1200.00,1000.00,200.00,1200.00,'2024-10','2024-10-31','OVERDUE',NULL,'Test bill creation','2025-10-19 13:14:33','2025-10-21 10:00:00','2025-10-19','fr',NULL);
/*!40000 ALTER TABLE `bills` ENABLE KEYS */;
UNLOCK TABLES;
commit;

--
-- Table structure for table `budgets`
--

DROP TABLE IF EXISTS `budgets`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `budgets` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `property_id` int(11) NOT NULL,
  `month` varchar(7) NOT NULL,
  `budgeted_income` decimal(12,2) NOT NULL DEFAULT 0.00,
  `budgeted_expenses` decimal(12,2) NOT NULL DEFAULT 0.00,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `budgets_property_id_month` (`property_id`,`month`),
  UNIQUE KEY `uniq_budgets_property_month` (`property_id`,`month`),
  KEY `budgets_property_id` (`property_id`),
  KEY `budgets_month` (`month`),
  CONSTRAINT `budgets_ibfk_1` FOREIGN KEY (`property_id`) REFERENCES `properties` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `budgets`
--

LOCK TABLES `budgets` WRITE;
/*!40000 ALTER TABLE `budgets` DISABLE KEYS */;
set autocommit=0;
/*!40000 ALTER TABLE `budgets` ENABLE KEYS */;
UNLOCK TABLES;
commit;

--
-- Table structure for table `expenses`
--

DROP TABLE IF EXISTS `expenses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `expenses` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `property_id` int(11) DEFAULT NULL,
  `admin_id` int(11) NOT NULL,
  `month` varchar(7) NOT NULL,
  `category` varchar(100) NOT NULL,
  `amount` decimal(12,2) NOT NULL DEFAULT 0.00,
  `notes` text DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `expenses_property_id` (`property_id`),
  KEY `expenses_admin_id` (`admin_id`),
  KEY `expenses_month` (`month`),
  KEY `expenses_category` (`category`),
  CONSTRAINT `expenses_ibfk_10` FOREIGN KEY (`admin_id`) REFERENCES `admins` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `expenses_ibfk_9` FOREIGN KEY (`property_id`) REFERENCES `properties` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=20 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `expenses`
--

LOCK TABLES `expenses` WRITE;
/*!40000 ALTER TABLE `expenses` DISABLE KEYS */;
set autocommit=0;
INSERT INTO `expenses` VALUES
(1,NULL,1,'2025-10','Electricity Bill',150.50,NULL,'2025-10-15 00:00:00','2025-10-15 09:14:09'),
(2,NULL,1,'2025-10','Electricity Bill',250.00,NULL,'2025-10-15 00:00:00','2025-10-15 09:16:42'),
(3,NULL,1,'2025-10','Water Bill',80.00,NULL,'2025-10-15 00:00:00','2025-10-15 09:16:42'),
(4,NULL,1,'2025-10','Maintenance',500.00,NULL,'2025-10-15 00:00:00','2025-10-15 09:16:42'),
(5,NULL,1,'2025-10','Internet / Wi-Fi',60.00,NULL,'2025-10-15 00:00:00','2025-10-15 09:16:42'),
(6,NULL,1,'2025-10','Property Tax',1200.00,NULL,'2025-10-15 00:00:00','2025-10-15 09:16:42'),
(7,NULL,3,'2025-10','Electricity Bill',500.00,NULL,'2025-10-15 00:00:00','2025-10-15 09:36:06'),
(8,NULL,3,'2025-10','Repairs & Renovations',100.00,NULL,'2025-10-15 00:00:00','2025-10-15 09:36:17'),
(9,NULL,3,'2025-10','Insurance',500.00,NULL,'2025-10-15 00:00:00','2025-10-15 09:36:26'),
(10,NULL,3,'2025-10','Property Tax',123.00,NULL,'2025-10-15 00:00:00','2025-10-15 09:36:33'),
(11,NULL,3,'2025-10','Water Bill',123.00,NULL,'2025-10-15 00:00:00','2025-10-15 09:38:31'),
(12,NULL,3,'2025-10','Internet / Wi-Fi',100.00,NULL,'2025-10-15 00:00:00','2025-10-15 09:41:44'),
(13,NULL,3,'2025-10','Property Tax',22.00,NULL,'2025-10-15 00:00:00','2025-10-15 10:56:05'),
(17,NULL,4,'2025-10','Gardening / Landscaping',50.00,NULL,'2025-10-18 00:00:00','2025-10-18 10:04:29'),
(18,NULL,4,'2025-10','Repairs & Renovations',54.00,NULL,'2025-10-18 00:00:00','2025-10-18 12:31:03'),
(19,NULL,4,'2025-10','Water Bill',10.00,NULL,'2025-10-18 00:00:00','2025-10-18 13:11:01');
/*!40000 ALTER TABLE `expenses` ENABLE KEYS */;
UNLOCK TABLES;
commit;

--
-- Table structure for table `profits`
--

DROP TABLE IF EXISTS `profits`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `profits` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `admin_id` int(11) NOT NULL,
  `total_profit` decimal(10,2) NOT NULL DEFAULT 0.00,
  `last_updated` datetime NOT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `profits_admin_id` (`admin_id`),
  CONSTRAINT `profits_ibfk_1` FOREIGN KEY (`admin_id`) REFERENCES `admins` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `profits`
--

LOCK TABLES `profits` WRITE;
/*!40000 ALTER TABLE `profits` DISABLE KEYS */;
set autocommit=0;
INSERT INTO `profits` VALUES
(1,4,0.00,'2025-10-19 12:21:24','2025-10-19 09:54:26','2025-10-19 12:21:24');
/*!40000 ALTER TABLE `profits` ENABLE KEYS */;
UNLOCK TABLES;
commit;

--
-- Table structure for table `properties`
--

DROP TABLE IF EXISTS `properties`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `properties` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `admin_id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `address` varchar(500) NOT NULL,
  `city` varchar(100) NOT NULL,
  `state` varchar(100) DEFAULT NULL,
  `postal_code` varchar(20) DEFAULT NULL,
  `country` varchar(100) NOT NULL,
  `property_type` enum('APARTMENT','HOUSE','CONDO','STUDIO','OTHER') NOT NULL DEFAULT 'APARTMENT',
  `monthly_rent` decimal(10,2) DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `photo` varchar(500) DEFAULT NULL,
  `number_of_halls` int(11) DEFAULT NULL,
  `number_of_kitchens` int(11) DEFAULT NULL,
  `number_of_bathrooms` int(11) DEFAULT NULL,
  `number_of_parking_spaces` int(11) DEFAULT NULL,
  `number_of_rooms` int(11) DEFAULT NULL,
  `number_of_gardens` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `properties_admin_id` (`admin_id`),
  KEY `properties_property_type` (`property_type`),
  KEY `properties_city_country` (`city`,`country`),
  CONSTRAINT `properties_ibfk_1` FOREIGN KEY (`admin_id`) REFERENCES `admins` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `properties`
--

LOCK TABLES `properties` WRITE;
/*!40000 ALTER TABLE `properties` DISABLE KEYS */;
set autocommit=0;
INSERT INTO `properties` VALUES
(6,3,'faisal',NULL,'167,Main Road','Karaikal',NULL,NULL,'India','HOUSE',499.99,'2025-10-10 06:11:06','2025-10-15 08:41:29',NULL,0,0,0,0,0,0),
(7,4,'Rahim',NULL,'167,Main Road','Karaikal',NULL,NULL,'India','APARTMENT',499.99,'2025-10-15 12:11:08','2025-10-18 10:17:48',NULL,1,2,3,5,1,2),
(8,4,'mohamed rahim',NULL,'167,Main Road','Karaikal',NULL,NULL,'India','APARTMENT',499.99,'2025-10-18 12:04:21','2025-10-18 12:04:21',NULL,1,2,3,5,1,2),
(9,4,'rahim',NULL,'167,Main Road','Karaikal',NULL,NULL,'India','APARTMENT',499.99,'2025-10-18 12:05:56','2025-10-24 21:42:46',NULL,1,3,3,5,1,2),
(11,1,'Appartement Admin 1','Appartement pour admin 1','456 Rue Admin 1','Paris',NULL,NULL,'France','APARTMENT',750.00,'2025-10-19 10:12:50','2025-10-19 10:12:50',NULL,0,0,0,0,0,0),
(12,1,'Appartement Admin 1','Appartement pour admin 1','456 Rue Admin 1','Paris',NULL,NULL,'France','APARTMENT',750.00,'2025-10-19 10:13:08','2025-10-19 10:13:08',NULL,0,0,0,0,0,0);
/*!40000 ALTER TABLE `properties` ENABLE KEYS */;
UNLOCK TABLES;
commit;

--
-- Table structure for table `property_photos`
--

DROP TABLE IF EXISTS `property_photos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `property_photos` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `admin_id` int(11) NOT NULL,
  `property_id` int(11) NOT NULL,
  `file_path` varchar(500) NOT NULL COMMENT 'Relative path from uploads root, e.g., /1/properties/5/photo.jpg',
  `file_url` varchar(1000) NOT NULL COMMENT 'Full URL to access the photo',
  `original_filename` varchar(255) DEFAULT NULL COMMENT 'Original filename from upload',
  `file_size` int(11) DEFAULT NULL COMMENT 'File size in bytes',
  `mime_type` varchar(100) DEFAULT NULL COMMENT 'MIME type of the file',
  `is_primary` tinyint(1) NOT NULL DEFAULT 0 COMMENT 'Whether this is the primary photo for the property',
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `property_photos_admin_id` (`admin_id`),
  KEY `property_photos_property_id` (`property_id`),
  KEY `property_photos_is_primary` (`is_primary`),
  CONSTRAINT `property_photos_ibfk_10` FOREIGN KEY (`property_id`) REFERENCES `properties` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `property_photos_ibfk_9` FOREIGN KEY (`admin_id`) REFERENCES `admins` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `property_photos`
--

LOCK TABLES `property_photos` WRITE;
/*!40000 ALTER TABLE `property_photos` DISABLE KEYS */;
set autocommit=0;
INSERT INTO `property_photos` VALUES
(1,4,9,'public\\uploads\\4\\properties\\9\\quittance_loyer-1760980686470-220311319.png','http://localhost:4002/uploads/4/properties/9/quittance_loyer-1760980686470-220311319.png','quittance_loyer.png',48633,'image/png',1,'2025-10-20 17:18:06','2025-10-20 17:18:06');
/*!40000 ALTER TABLE `property_photos` ENABLE KEYS */;
UNLOCK TABLES;
commit;

--
-- Table structure for table `receipts`
--

DROP TABLE IF EXISTS `receipts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `receipts` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `bill_id` int(11) NOT NULL,
  `tenant_id` int(11) NOT NULL,
  `admin_id` int(11) NOT NULL,
  `sent_date` datetime NOT NULL,
  `sent_to_tenant` tinyint(1) NOT NULL DEFAULT 1,
  `sent_to_admin` tinyint(1) NOT NULL DEFAULT 1,
  `sent_to_owner` tinyint(1) NOT NULL DEFAULT 0,
  `tenant_email` varchar(255) DEFAULT NULL,
  `admin_email` varchar(255) DEFAULT NULL,
  `owner_email` varchar(255) DEFAULT NULL,
  `pdf_path` varchar(500) DEFAULT NULL,
  `status` enum('SENT','FAILED','PENDING') NOT NULL DEFAULT 'PENDING',
  `error_message` text DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `receipts_bill_id` (`bill_id`),
  KEY `receipts_tenant_id` (`tenant_id`),
  KEY `receipts_admin_id` (`admin_id`),
  KEY `receipts_sent_date` (`sent_date`),
  KEY `receipts_status` (`status`),
  CONSTRAINT `receipts_ibfk_13` FOREIGN KEY (`bill_id`) REFERENCES `bills` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `receipts_ibfk_14` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `receipts_ibfk_15` FOREIGN KEY (`admin_id`) REFERENCES `admins` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `receipts`
--

LOCK TABLES `receipts` WRITE;
/*!40000 ALTER TABLE `receipts` DISABLE KEYS */;
set autocommit=0;
/*!40000 ALTER TABLE `receipts` ENABLE KEYS */;
UNLOCK TABLES;
commit;

--
-- Table structure for table `tenant_documents`
--

DROP TABLE IF EXISTS `tenant_documents`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `tenant_documents` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `admin_id` int(11) NOT NULL,
  `tenant_id` int(11) NOT NULL,
  `file_path` varchar(500) NOT NULL COMMENT 'Relative path from uploads root, e.g., /1/tenants/3/document.pdf',
  `file_url` varchar(1000) NOT NULL COMMENT 'Full URL to access the document',
  `original_filename` varchar(255) DEFAULT NULL COMMENT 'Original filename from upload',
  `file_size` int(11) DEFAULT NULL COMMENT 'File size in bytes',
  `mime_type` varchar(100) DEFAULT NULL COMMENT 'MIME type of the file',
  `document_type` varchar(100) DEFAULT NULL COMMENT 'Type of document (e.g., ID, Lease, Contract)',
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `tenant_documents_admin_id` (`admin_id`),
  KEY `tenant_documents_tenant_id` (`tenant_id`),
  KEY `tenant_documents_document_type` (`document_type`),
  CONSTRAINT `tenant_documents_ibfk_10` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `tenant_documents_ibfk_9` FOREIGN KEY (`admin_id`) REFERENCES `admins` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tenant_documents`
--

LOCK TABLES `tenant_documents` WRITE;
/*!40000 ALTER TABLE `tenant_documents` DISABLE KEYS */;
set autocommit=0;
/*!40000 ALTER TABLE `tenant_documents` ENABLE KEYS */;
UNLOCK TABLES;
commit;

--
-- Table structure for table `tenants`
--

DROP TABLE IF EXISTS `tenants`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `tenants` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `admin_id` int(11) NOT NULL,
  `property_id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) DEFAULT NULL,
  `phone` varchar(50) DEFAULT NULL,
  `lease_start` date DEFAULT NULL,
  `lease_end` date DEFAULT NULL,
  `rent_amount` decimal(10,2) DEFAULT NULL,
  `join_date` date NOT NULL,
  `status` enum('ACTIVE','INACTIVE','EXPIRED') NOT NULL DEFAULT 'ACTIVE',
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `tenants_admin_id` (`admin_id`),
  KEY `tenants_property_id` (`property_id`),
  KEY `tenants_status` (`status`),
  KEY `tenants_lease_start_lease_end` (`lease_start`,`lease_end`),
  CONSTRAINT `tenants_ibfk_10` FOREIGN KEY (`property_id`) REFERENCES `properties` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `tenants_ibfk_9` FOREIGN KEY (`admin_id`) REFERENCES `admins` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tenants`
--

LOCK TABLES `tenants` WRITE;
/*!40000 ALTER TABLE `tenants` DISABLE KEYS */;
set autocommit=0;
INSERT INTO `tenants` VALUES
(6,3,6,'Mohamed FaisalPortfolio Faisal','faisal786mf7@gmail.com','07358874293',NULL,NULL,1234.00,'2025-10-10','ACTIVE','2025-10-10 06:11:19','2025-10-19 10:40:51'),
(7,4,7,'Mohamed Faisal','faisal786mf7@gmail.com','07358874293',NULL,NULL,1234.00,'2025-10-18','ACTIVE','2025-10-18 10:04:55','2025-10-19 10:40:51'),
(8,1,11,'Locataire Admin 1','locataire.admin1@test.com','0987654321',NULL,NULL,NULL,'2025-10-19','ACTIVE','2025-10-19 10:12:50','2025-10-19 10:40:51'),
(9,1,12,'Locataire Admin 1','locataire.admin1@test.com','0987654321',NULL,NULL,NULL,'2025-10-19','ACTIVE','2025-10-19 10:13:08','2025-10-19 10:13:08'),
(10,4,8,'Mohamed Faisaleyy','faisal786mf7@gmail.com','7358874293',NULL,NULL,500.00,'2025-10-25','ACTIVE','2025-10-24 22:23:34','2025-10-24 22:23:34');
/*!40000 ALTER TABLE `tenants` ENABLE KEYS */;
UNLOCK TABLES;
commit;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*M!100616 SET NOTE_VERBOSITY=@OLD_NOTE_VERBOSITY */;

-- Dump completed on 2025-10-25  4:31:38
