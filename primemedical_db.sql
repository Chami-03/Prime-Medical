-- MySQL dump 10.13  Distrib 8.0.45, for Win64 (x86_64)
--
-- Host: localhost    Database: primemedical_db
-- ------------------------------------------------------
-- Server version	8.0.45

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `app_roles`
--

DROP TABLE IF EXISTS `app_roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `app_roles` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `name` enum('DOCTOR','NURSE','RECEPTIONIST','PHARMACIST','PATIENT','ADMIN') NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UK_fvrw9klein793jl7h2qug4a5t` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `app_roles`
--

LOCK TABLES `app_roles` WRITE;
/*!40000 ALTER TABLE `app_roles` DISABLE KEYS */;
INSERT INTO `app_roles` VALUES (1,'DOCTOR'),(2,'NURSE'),(3,'RECEPTIONIST'),(4,'PHARMACIST'),(5,'PATIENT'),(6,'ADMIN');
/*!40000 ALTER TABLE `app_roles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `app_users`
--

DROP TABLE IF EXISTS `app_users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `app_users` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) DEFAULT NULL,
  `email` varchar(150) NOT NULL,
  `first_name` varchar(100) NOT NULL,
  `is_active` bit(1) DEFAULT NULL,
  `last_name` varchar(100) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `profile_photo_url` varchar(500) DEFAULT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UK_4vj92ux8a2eehds1mdvmks473` (`email`),
  KEY `idx_users_email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=22 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `app_users`
--

LOCK TABLES `app_users` WRITE;
/*!40000 ALTER TABLE `app_users` DISABLE KEYS */;
INSERT INTO `app_users` VALUES (1,'2026-03-02 16:36:29.914240','doctor@primemedical.lk','Dr.Pulasthi',_binary '','Senevirathne','$2a$10$IRey8Y7xNza4lytNtgPnM.seSvwRdlB94uipxvwcLGSalCvTt.yDi','0771234567',NULL,'2026-03-05 12:37:57.255546'),(2,'2026-03-02 16:36:29.927040','nurse@primemedical.lk','Nimali',_binary '','Silva','$2a$10$IRey8Y7xNza4lytNtgPnM.seSvwRdlB94uipxvwcLGSalCvTt.yDi','0772345678',NULL,'2026-03-05 12:37:57.311460'),(3,'2026-03-02 16:36:29.932831','reception@primemedical.lk','Kasun',_binary '','Fernando','$2a$10$IRey8Y7xNza4lytNtgPnM.seSvwRdlB94uipxvwcLGSalCvTt.yDi','0773456789',NULL,'2026-03-05 12:37:57.326300'),(4,'2026-03-02 16:36:29.938431','pharmacist@primemedical.lk','Ruwan',_binary '','Jayasinghe','$2a$10$IRey8Y7xNza4lytNtgPnM.seSvwRdlB94uipxvwcLGSalCvTt.yDi','0774567890',NULL,'2026-03-05 12:37:57.345635'),(5,'2026-03-02 16:36:29.944483','patient@primemedical.lk','Amara',_binary '','Wickrama','$2a$10$IRey8Y7xNza4lytNtgPnM.seSvwRdlB94uipxvwcLGSalCvTt.yDi','0775678901',NULL,'2026-03-05 12:37:57.360035'),(6,'2026-03-02 16:36:29.949235','admin@primemedical.lk','Admin',_binary '','User','$2a$10$IRey8Y7xNza4lytNtgPnM.seSvwRdlB94uipxvwcLGSalCvTt.yDi','0770000000',NULL,'2026-03-05 12:37:57.375350'),(15,'2026-03-04 07:44:34.580012','doctor@medcenter.lk','Dr.Pulasthi',_binary '','Senevirathne','$2a$10$bntHZEkCpU/9JF4H4MVQg.8s4VNeXS6w5HfKE/p9YkT2G0cbUe.pG','0771234567',NULL,'2026-03-09 04:47:44.257214'),(16,'2026-03-04 07:44:34.644927','nurse@medcenter.lk','Nimali',_binary '','Silva','$2a$10$bntHZEkCpU/9JF4H4MVQg.8s4VNeXS6w5HfKE/p9YkT2G0cbUe.pG','0772345678',NULL,'2026-03-09 04:47:44.303124'),(17,'2026-03-04 07:44:34.651310','reception@medcenter.lk','Kasun',_binary '','Fernando','$2a$10$bntHZEkCpU/9JF4H4MVQg.8s4VNeXS6w5HfKE/p9YkT2G0cbUe.pG','0773456789',NULL,'2026-03-09 04:47:44.317125'),(18,'2026-03-04 07:44:34.656195','pharmacist@medcenter.lk','Ruwan',_binary '','Jayasinghe','$2a$10$bntHZEkCpU/9JF4H4MVQg.8s4VNeXS6w5HfKE/p9YkT2G0cbUe.pG','0774567890',NULL,'2026-03-09 04:47:44.331125'),(19,'2026-03-04 07:44:34.664034','patient@medcenter.lk','Amara',_binary '','Wickrama','$2a$10$bntHZEkCpU/9JF4H4MVQg.8s4VNeXS6w5HfKE/p9YkT2G0cbUe.pG','0775678901',NULL,'2026-03-09 04:47:44.343124'),(20,'2026-03-04 07:44:34.670364','admin@medcenter.lk','Admin',_binary '','User','$2a$10$bntHZEkCpU/9JF4H4MVQg.8s4VNeXS6w5HfKE/p9YkT2G0cbUe.pG','0770000000',NULL,'2026-03-09 04:47:44.356213'),(21,'2026-03-04 16:50:43.347879','chami@gmail.com','Chamikara',_binary '','Wijerathne','$2a$10$V3guiPxS9gMKjEMiDU1BjOpsg7KLvVF36mWfsNBzuoZ/sDaGxEao.','0775244111',NULL,'2026-03-04 16:50:43.348888');
/*!40000 ALTER TABLE `app_users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `appointments`
--

DROP TABLE IF EXISTS `appointments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `appointments` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `appointment_time` datetime(6) NOT NULL,
  `cancellation_reason` text,
  `confirmation_code` varchar(20) NOT NULL,
  `created_at` datetime(6) DEFAULT NULL,
  `reason` varchar(500) DEFAULT NULL,
  `status` enum('PENDING','CONFIRMED','CHECKED_IN','IN_CONSULTATION','COMPLETED','CANCELLED','NO_SHOW') DEFAULT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  `visit_type` enum('CONSULTATION','FOLLOW_UP','REFILL','WALK_IN') DEFAULT NULL,
  `created_by` bigint DEFAULT NULL,
  `doctor_id` bigint NOT NULL,
  `patient_id` bigint NOT NULL,
  `rescheduled_from` bigint DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UK_2tqwtuqr5ni1c7y2fgga1qns2` (`confirmation_code`),
  KEY `idx_appt_patient` (`patient_id`),
  KEY `idx_appt_doctor_time` (`doctor_id`,`appointment_time`),
  KEY `idx_appt_status` (`status`),
  KEY `FKsoj6f9k8jtsm84ahjw8g41r2w` (`created_by`),
  KEY `FKo27gqxtrk2m5uvkcoivojvujg` (`rescheduled_from`),
  CONSTRAINT `FK2g3ebnw3y7cnb79tq7tkxhte` FOREIGN KEY (`doctor_id`) REFERENCES `app_users` (`id`),
  CONSTRAINT `FK8exap5wmg8kmb1g1rx3by21yt` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`id`),
  CONSTRAINT `FKo27gqxtrk2m5uvkcoivojvujg` FOREIGN KEY (`rescheduled_from`) REFERENCES `appointments` (`id`),
  CONSTRAINT `FKsoj6f9k8jtsm84ahjw8g41r2w` FOREIGN KEY (`created_by`) REFERENCES `app_users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `appointments`
--

LOCK TABLES `appointments` WRITE;
/*!40000 ALTER TABLE `appointments` DISABLE KEYS */;
INSERT INTO `appointments` VALUES (1,'2026-03-11 03:30:00.000000','cancel hide verify','APT-2026-00026','2026-03-03 04:06:26.083519','cancel hide verify','CANCELLED','2026-03-03 04:06:26.201034','CONSULTATION',3,1,1,NULL),(2,'2026-03-12 10:30:00.000000',NULL,'APT-2026-00028','2026-03-03 04:12:58.154420','manual datetime reschedule verify','CONFIRMED','2026-03-03 04:12:58.245881','CONSULTATION',3,1,1,NULL),(3,'2026-03-14 10:00:00.000000',NULL,'APT-2026-00030','2026-03-03 04:17:42.157143','manual-ui verify','CONFIRMED','2026-03-03 04:17:42.294182','CONSULTATION',3,1,1,NULL),(4,'2026-03-15 08:15:00.000000',NULL,'APT-2026-00033','2026-03-03 04:26:56.985471','instant ui verify','CONFIRMED','2026-03-03 04:26:57.347855','CONSULTATION',3,1,1,NULL),(5,'2026-03-16 03:30:00.000000','Cancelled by receptionist','APT-2026-00035','2026-03-03 04:34:20.473401','cancel verify','CANCELLED','2026-03-03 04:34:20.843433','CONSULTATION',3,1,1,NULL);
/*!40000 ALTER TABLE `appointments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `audit_logs`
--

DROP TABLE IF EXISTS `audit_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `audit_logs` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `action` varchar(100) NOT NULL,
  `created_at` datetime(6) DEFAULT NULL,
  `details` text,
  `entity_id` bigint DEFAULT NULL,
  `entity_type` varchar(100) DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `success` bit(1) DEFAULT NULL,
  `user_id` bigint DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_audit_user` (`user_id`),
  KEY `idx_audit_action` (`action`),
  KEY `idx_audit_time` (`created_at`),
  CONSTRAINT `FKqtxpcyjfyvcehqtn8n73di8du` FOREIGN KEY (`user_id`) REFERENCES `app_users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `audit_logs`
--

LOCK TABLES `audit_logs` WRITE;
/*!40000 ALTER TABLE `audit_logs` DISABLE KEYS */;
/*!40000 ALTER TABLE `audit_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `bill_line_items`
--

DROP TABLE IF EXISTS `bill_line_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `bill_line_items` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `description` varchar(255) NOT NULL,
  `item_type` enum('CONSULTATION','MEDICINE','PROCEDURE','OTHER') NOT NULL,
  `quantity` int DEFAULT NULL,
  `total_price` decimal(10,2) NOT NULL,
  `unit_price` decimal(10,2) NOT NULL,
  `bill_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  KEY `FKdnv2leisij501wi37e1fmftri` (`bill_id`),
  CONSTRAINT `FKdnv2leisij501wi37e1fmftri` FOREIGN KEY (`bill_id`) REFERENCES `bills` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `bill_line_items`
--

LOCK TABLES `bill_line_items` WRITE;
/*!40000 ALTER TABLE `bill_line_items` DISABLE KEYS */;
/*!40000 ALTER TABLE `bill_line_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `bills`
--

DROP TABLE IF EXISTS `bills`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `bills` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) DEFAULT NULL,
  `discount` decimal(10,2) DEFAULT NULL,
  `invoice_number` varchar(30) NOT NULL,
  `net_amount` decimal(10,2) NOT NULL,
  `status` enum('DRAFT','ISSUED','PARTIAL','PAID','REFUNDED') DEFAULT NULL,
  `subtotal` decimal(10,2) NOT NULL,
  `tax_amount` decimal(10,2) DEFAULT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  `consultation_id` bigint DEFAULT NULL,
  `created_by` bigint DEFAULT NULL,
  `patient_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UK_4mdsyydqgu4g7noveldgdahsy` (`invoice_number`),
  KEY `idx_bill_patient` (`patient_id`),
  KEY `idx_bill_status` (`status`),
  KEY `FKr4voqq2da4p464fpb99hqmcvg` (`consultation_id`),
  KEY `FKt6ncdqsrqr5mdxbnv4xsekens` (`created_by`),
  CONSTRAINT `FKiklkhnj1odoll0m9otela7gb9` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`id`),
  CONSTRAINT `FKr4voqq2da4p464fpb99hqmcvg` FOREIGN KEY (`consultation_id`) REFERENCES `consultations` (`id`),
  CONSTRAINT `FKt6ncdqsrqr5mdxbnv4xsekens` FOREIGN KEY (`created_by`) REFERENCES `app_users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `bills`
--

LOCK TABLES `bills` WRITE;
/*!40000 ALTER TABLE `bills` DISABLE KEYS */;
INSERT INTO `bills` VALUES (1,'2026-03-03 06:38:02.893058',0.00,'INV-2026-00009',0.00,'PAID',0.00,0.00,'2026-03-03 06:38:24.126231',NULL,3,1),(2,'2026-03-03 07:41:34.451654',0.00,'INV-2026-00010',0.00,'PAID',0.00,0.00,'2026-03-03 07:41:51.574727',NULL,3,1),(3,'2026-03-03 07:42:50.946507',0.00,'INV-2026-00011',0.00,'ISSUED',0.00,0.00,'2026-03-03 07:42:50.946507',NULL,3,1),(4,'2026-03-03 07:43:33.461611',0.00,'INV-2026-00012',0.00,'ISSUED',0.00,0.00,'2026-03-03 07:43:33.461611',NULL,3,1),(5,'2026-03-03 07:44:27.158579',0.00,'INV-2026-00013',0.00,'ISSUED',0.00,0.00,'2026-03-03 07:44:27.158579',NULL,3,1);
/*!40000 ALTER TABLE `bills` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `consultations`
--

DROP TABLE IF EXISTS `consultations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `consultations` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) DEFAULT NULL,
  `diagnosis` text,
  `duration_minutes` int DEFAULT NULL,
  `ended_at` datetime(6) DEFAULT NULL,
  `examination` text,
  `is_confidential` bit(1) DEFAULT NULL,
  `notes` text,
  `started_at` datetime(6) DEFAULT NULL,
  `status` enum('PENDING','IN_PROGRESS','ON_HOLD','COMPLETED') DEFAULT NULL,
  `symptoms` text,
  `treatment` text,
  `updated_at` datetime(6) DEFAULT NULL,
  `appointment_id` bigint DEFAULT NULL,
  `doctor_id` bigint NOT NULL,
  `patient_id` bigint NOT NULL,
  `queue_entry_id` bigint DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UK_p0pg0r434dp34iesx6lj69b8m` (`appointment_id`),
  KEY `idx_consult_patient` (`patient_id`),
  KEY `idx_consult_doctor` (`doctor_id`),
  KEY `FKk40pn5rc1njote7w5t0b4gui0` (`queue_entry_id`),
  CONSTRAINT `FKdqyibd6w1h5h66xn9aqx7fwv5` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`id`),
  CONSTRAINT `FKjg7cxa6qfxmawqdf3rvjrue3b` FOREIGN KEY (`doctor_id`) REFERENCES `app_users` (`id`),
  CONSTRAINT `FKk40pn5rc1njote7w5t0b4gui0` FOREIGN KEY (`queue_entry_id`) REFERENCES `queue_entries` (`id`),
  CONSTRAINT `FKp77tpwkqp4e3fxdi9d7eo44cx` FOREIGN KEY (`appointment_id`) REFERENCES `appointments` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `consultations`
--

LOCK TABLES `consultations` WRITE;
/*!40000 ALTER TABLE `consultations` DISABLE KEYS */;
/*!40000 ALTER TABLE `consultations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `doctor_schedules`
--

DROP TABLE IF EXISTS `doctor_schedules`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `doctor_schedules` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `block_reason` varchar(255) DEFAULT NULL,
  `created_at` datetime(6) DEFAULT NULL,
  `is_blocked` bit(1) DEFAULT NULL,
  `max_patients` int DEFAULT NULL,
  `schedule_date` date NOT NULL,
  `slot_time` time(6) NOT NULL,
  `doctor_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_doctor_slot` (`doctor_id`,`schedule_date`,`slot_time`),
  KEY `idx_schedule_date` (`doctor_id`,`schedule_date`),
  CONSTRAINT `FK3tx0tnp39r8sr77ch77ddxbr7` FOREIGN KEY (`doctor_id`) REFERENCES `app_users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `doctor_schedules`
--

LOCK TABLES `doctor_schedules` WRITE;
/*!40000 ALTER TABLE `doctor_schedules` DISABLE KEYS */;
INSERT INTO `doctor_schedules` VALUES (1,NULL,'2026-03-09 04:47:44.930396',_binary '\0',1,'2026-03-22','11:00:00.000000',15),(2,NULL,'2026-03-09 04:47:44.937396',_binary '\0',1,'2026-03-22','12:00:00.000000',15),(3,NULL,'2026-03-09 04:47:44.942398',_binary '\0',1,'2026-03-22','14:00:00.000000',15),(4,NULL,'2026-03-09 04:47:44.947396',_binary '\0',1,'2026-03-22','15:00:00.000000',15),(5,NULL,'2026-03-09 04:47:44.952397',_binary '\0',1,'2026-03-22','16:00:00.000000',15);
/*!40000 ALTER TABLE `doctor_schedules` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `inventory_items`
--

DROP TABLE IF EXISTS `inventory_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `inventory_items` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `archived_at` datetime(6) DEFAULT NULL,
  `archived_reason` varchar(200) DEFAULT NULL,
  `batch_number` varchar(100) DEFAULT NULL,
  `category` varchar(100) DEFAULT NULL,
  `created_at` datetime(6) DEFAULT NULL,
  `description` text,
  `drug_name` varchar(200) NOT NULL,
  `expiry_date` date NOT NULL,
  `generic_name` varchar(200) DEFAULT NULL,
  `is_archived` bit(1) DEFAULT NULL,
  `low_stock_threshold` int DEFAULT NULL,
  `purchase_price` decimal(12,2) DEFAULT NULL,
  `quantity` int NOT NULL,
  `selling_price` decimal(10,2) DEFAULT NULL,
  `storage_location` varchar(100) DEFAULT NULL,
  `supplier` varchar(200) DEFAULT NULL,
  `unit` varchar(50) DEFAULT NULL,
  `unit_cost` decimal(10,2) DEFAULT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  `supplier_id` bigint DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_inv_drug` (`drug_name`),
  KEY `idx_inv_expiry` (`expiry_date`),
  KEY `FKhc7q0chmfralakw27k36ds0c1` (`supplier_id`),
  CONSTRAINT `FKhc7q0chmfralakw27k36ds0c1` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `inventory_items`
--

LOCK TABLES `inventory_items` WRITE;
/*!40000 ALTER TABLE `inventory_items` DISABLE KEYS */;
INSERT INTO `inventory_items` VALUES (1,'2026-03-02 18:22:54.377726','E2E archive','E2EB1772475773','OTHER','2026-03-02 18:22:53.585740','e2e item','E2E Drug 1772475773','2026-06-30','E2EGEN',_binary '',1,NULL,0,12.50,NULL,'E2E Supplier','tablets',10.00,'2026-03-02 18:22:54.377725',NULL),(2,'2026-03-02 18:26:03.543732','E2E archive','E2EB1772475963','OTHER','2026-03-02 18:26:03.435384','e2e item','E2E Drug 1772475963','2026-06-30','E2EGEN',_binary '',1,NULL,0,12.50,NULL,'E2E Supplier','tablets',10.00,'2026-03-02 18:26:03.544755',NULL),(3,'2026-03-02 18:39:02.715470','E2E archive','E2EB1772476742','OTHER','2026-03-02 18:39:02.106008','e2e item','E2E Drug 1772476742','2026-07-01','E2EGEN',_binary '',1,NULL,0,12.50,NULL,'E2E Supplier','tablets',10.00,'2026-03-02 18:39:02.726844',NULL),(4,'2026-03-02 18:43:42.318891','E2E archive','E2EB1772477022','OTHER','2026-03-02 18:43:42.214920','e2e item','E2E Drug 1772477022','2026-07-01','E2EGEN',_binary '',1,NULL,0,12.50,NULL,'E2E Supplier','tablets',10.00,'2026-03-02 18:43:42.318890',NULL),(5,'2026-03-03 02:12:48.579240','E2E archive','E2EB1772503968','OTHER','2026-03-03 02:12:48.472240','e2e item','E2E Drug 1772503968','2026-07-01','E2EGEN',_binary '',1,NULL,0,12.50,NULL,'E2E Supplier','tablets',10.00,'2026-03-03 02:12:48.580240',NULL);
/*!40000 ALTER TABLE `inventory_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `inventory_settings`
--

DROP TABLE IF EXISTS `inventory_settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `inventory_settings` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `setting_key` varchar(100) NOT NULL,
  `setting_value` varchar(200) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UK_ep2aby9dwhl5ytu2qjiaa996b` (`setting_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `inventory_settings`
--

LOCK TABLES `inventory_settings` WRITE;
/*!40000 ALTER TABLE `inventory_settings` DISABLE KEYS */;
/*!40000 ALTER TABLE `inventory_settings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `inventory_stock_history`
--

DROP TABLE IF EXISTS `inventory_stock_history`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `inventory_stock_history` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) DEFAULT NULL,
  `note` text,
  `prescription_id` bigint DEFAULT NULL,
  `quantity_after` int NOT NULL,
  `quantity_change` int NOT NULL,
  `reason` varchar(50) DEFAULT NULL,
  `inventory_item_id` bigint NOT NULL,
  `user_id` bigint DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_stock_history_item` (`inventory_item_id`),
  KEY `idx_stock_history_date` (`created_at`),
  KEY `FK69t9764l3grf3k5e66ryd9uw` (`user_id`),
  CONSTRAINT `FK69t9764l3grf3k5e66ryd9uw` FOREIGN KEY (`user_id`) REFERENCES `app_users` (`id`),
  CONSTRAINT `FKmoxq2g3t66jmsqrwt1pmx4dds` FOREIGN KEY (`inventory_item_id`) REFERENCES `inventory_items` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `inventory_stock_history`
--

LOCK TABLES `inventory_stock_history` WRITE;
/*!40000 ALTER TABLE `inventory_stock_history` DISABLE KEYS */;
INSERT INTO `inventory_stock_history` VALUES (1,'2026-03-02 18:39:02.394341','zero',NULL,0,-2,'Adjustment',3,6),(2,'2026-03-02 18:43:42.216947','Item added',NULL,2,2,'New Purchase',4,6),(3,'2026-03-02 18:43:42.255640','zero',NULL,0,-2,'Adjustment',4,6),(4,'2026-03-03 02:12:48.474239','Item added',NULL,2,2,'New Purchase',5,6),(5,'2026-03-03 02:12:48.527239','zero',NULL,0,-2,'Adjustment',5,6);
/*!40000 ALTER TABLE `inventory_stock_history` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `patient_allergies`
--

DROP TABLE IF EXISTS `patient_allergies`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `patient_allergies` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `allergen` varchar(200) NOT NULL,
  `noted_at` datetime(6) DEFAULT NULL,
  `reaction` varchar(200) DEFAULT NULL,
  `severity` enum('MILD','MODERATE','SEVERE') DEFAULT NULL,
  `noted_by` bigint DEFAULT NULL,
  `patient_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_allergies_patient` (`patient_id`),
  KEY `FKibr75usnrsinuiil388u9xs3h` (`noted_by`),
  CONSTRAINT `FKibr75usnrsinuiil388u9xs3h` FOREIGN KEY (`noted_by`) REFERENCES `app_users` (`id`),
  CONSTRAINT `FKklnsfdi730wjhwd6g2uynyg32` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `patient_allergies`
--

LOCK TABLES `patient_allergies` WRITE;
/*!40000 ALTER TABLE `patient_allergies` DISABLE KEYS */;
INSERT INTO `patient_allergies` VALUES (5,'RuntimeSmokeAllergen','2026-03-04 18:06:09.450900','mild rash','MILD',2,1),(6,'Peanuts','2026-03-04 18:08:14.297586','Visit Doctor','MILD',2,1);
/*!40000 ALTER TABLE `patient_allergies` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `patients`
--

DROP TABLE IF EXISTS `patients`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `patients` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `address` text,
  `created_at` datetime(6) DEFAULT NULL,
  `date_of_birth` date NOT NULL,
  `email_notifications` bit(1) DEFAULT NULL,
  `emergency_contact_name` varchar(100) DEFAULT NULL,
  `emergency_contact_phone` varchar(20) DEFAULT NULL,
  `gender` enum('MALE','FEMALE','OTHER') NOT NULL,
  `medical_notes` text,
  `nic_number` varchar(20) DEFAULT NULL,
  `patient_number` varchar(20) NOT NULL,
  `sms_notifications` bit(1) DEFAULT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  `user_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UK_8u6p47bdb5ku435q2d64yav3b` (`patient_number`),
  UNIQUE KEY `UK_9tbsl3fmey0eofbm2xj69v4qs` (`user_id`),
  KEY `idx_patients_number` (`patient_number`),
  KEY `idx_patients_nic` (`nic_number`),
  CONSTRAINT `FKr0jfspw7crx3rvp4g08q673ib` FOREIGN KEY (`user_id`) REFERENCES `app_users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `patients`
--

LOCK TABLES `patients` WRITE;
/*!40000 ALTER TABLE `patients` DISABLE KEYS */;
INSERT INTO `patients` VALUES (1,'Colombo','2026-03-02 16:36:29.978508','1990-05-15',_binary '','Ruwan Wickrama','0779876543','FEMALE',NULL,'900456789V','PAT-2026-00001',_binary '\0','2026-03-02 16:36:29.978508',5),(8,'Kurunegala','2026-03-04 16:50:43.788531','2003-04-30',_binary '','Yukthi','0718907841','MALE',NULL,'200311188654','PAT-2026-00008',_binary '','2026-03-04 16:50:43.788531',21);
/*!40000 ALTER TABLE `patients` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `payments`
--

DROP TABLE IF EXISTS `payments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `payments` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `amount` decimal(10,2) NOT NULL,
  `notes` text,
  `paid_at` datetime(6) DEFAULT NULL,
  `payment_method` enum('CASH','CARD','BANK_TRANSFER') NOT NULL,
  `payment_reference` varchar(100) DEFAULT NULL,
  `bill_id` bigint NOT NULL,
  `processed_by` bigint DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `FK9565r6579khpdjxnyla0l2ycd` (`bill_id`),
  KEY `FKbhfr0y0me5tpx5kwx7ee19j5b` (`processed_by`),
  CONSTRAINT `FK9565r6579khpdjxnyla0l2ycd` FOREIGN KEY (`bill_id`) REFERENCES `bills` (`id`),
  CONSTRAINT `FKbhfr0y0me5tpx5kwx7ee19j5b` FOREIGN KEY (`processed_by`) REFERENCES `app_users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `payments`
--

LOCK TABLES `payments` WRITE;
/*!40000 ALTER TABLE `payments` DISABLE KEYS */;
/*!40000 ALTER TABLE `payments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `prescription_items`
--

DROP TABLE IF EXISTS `prescription_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `prescription_items` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `dosage` varchar(100) NOT NULL,
  `drug_name` varchar(200) NOT NULL,
  `duration_days` int NOT NULL,
  `frequency` varchar(100) NOT NULL,
  `instructions` text,
  `quantity` int NOT NULL,
  `inventory_item_id` bigint DEFAULT NULL,
  `prescription_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  KEY `FK6ddshetrkvij7tvq0hb3u00wu` (`inventory_item_id`),
  KEY `FK6uh7tdy2lv6sx34u1365acqsf` (`prescription_id`),
  CONSTRAINT `FK6ddshetrkvij7tvq0hb3u00wu` FOREIGN KEY (`inventory_item_id`) REFERENCES `inventory_items` (`id`),
  CONSTRAINT `FK6uh7tdy2lv6sx34u1365acqsf` FOREIGN KEY (`prescription_id`) REFERENCES `prescriptions` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `prescription_items`
--

LOCK TABLES `prescription_items` WRITE;
/*!40000 ALTER TABLE `prescription_items` DISABLE KEYS */;
/*!40000 ALTER TABLE `prescription_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `prescriptions`
--

DROP TABLE IF EXISTS `prescriptions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `prescriptions` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `dispensed_at` datetime(6) DEFAULT NULL,
  `notes` text,
  `prescribed_at` datetime(6) DEFAULT NULL,
  `status` enum('PENDING','DISPENSED','CANCELLED') DEFAULT NULL,
  `consultation_id` bigint NOT NULL,
  `dispensed_by` bigint DEFAULT NULL,
  `doctor_id` bigint NOT NULL,
  `patient_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  KEY `FKj6varr98psv2onkoxks6jin14` (`consultation_id`),
  KEY `FK5bmpaktqcmd6xlg419b4vl7gd` (`dispensed_by`),
  KEY `FKtmk3w9j0b8yys0emwm7fk2g16` (`doctor_id`),
  KEY `FKqydyol76jn1o37k1bdbkjgq74` (`patient_id`),
  CONSTRAINT `FK5bmpaktqcmd6xlg419b4vl7gd` FOREIGN KEY (`dispensed_by`) REFERENCES `app_users` (`id`),
  CONSTRAINT `FKj6varr98psv2onkoxks6jin14` FOREIGN KEY (`consultation_id`) REFERENCES `consultations` (`id`),
  CONSTRAINT `FKqydyol76jn1o37k1bdbkjgq74` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`id`),
  CONSTRAINT `FKtmk3w9j0b8yys0emwm7fk2g16` FOREIGN KEY (`doctor_id`) REFERENCES `app_users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `prescriptions`
--

LOCK TABLES `prescriptions` WRITE;
/*!40000 ALTER TABLE `prescriptions` DISABLE KEYS */;
/*!40000 ALTER TABLE `prescriptions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `queue_entries`
--

DROP TABLE IF EXISTS `queue_entries`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `queue_entries` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `called_at` datetime(6) DEFAULT NULL,
  `checked_in_at` datetime(6) DEFAULT NULL,
  `completed_at` datetime(6) DEFAULT NULL,
  `priority` enum('NORMAL','EMERGENCY') DEFAULT NULL,
  `queue_date` date NOT NULL,
  `queue_number` int NOT NULL,
  `status` enum('WAITING','VITALS_PENDING','READY','IN_CONSULTATION','COMPLETED','NO_SHOW') DEFAULT NULL,
  `appointment_id` bigint DEFAULT NULL,
  `patient_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_queue_date_status` (`queue_date`,`status`),
  KEY `FKl2eyxplm08m14ixe8hrlas6f7` (`appointment_id`),
  KEY `FK4ynfpv3463n4yc3uv0039ljr3` (`patient_id`),
  CONSTRAINT `FK4ynfpv3463n4yc3uv0039ljr3` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`id`),
  CONSTRAINT `FKl2eyxplm08m14ixe8hrlas6f7` FOREIGN KEY (`appointment_id`) REFERENCES `appointments` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `queue_entries`
--

LOCK TABLES `queue_entries` WRITE;
/*!40000 ALTER TABLE `queue_entries` DISABLE KEYS */;
INSERT INTO `queue_entries` VALUES (9,'2026-03-04 18:07:23.746683','2026-03-04 18:06:09.179838',NULL,'NORMAL','2026-03-04',1,'IN_CONSULTATION',NULL,1);
/*!40000 ALTER TABLE `queue_entries` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `staff_permissions`
--

DROP TABLE IF EXISTS `staff_permissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `staff_permissions` (
  `staff_profile_id` bigint NOT NULL,
  `permission` varchar(255) DEFAULT NULL,
  KEY `FKnf9hll8j3o9ohglpuppj6tdu9` (`staff_profile_id`),
  CONSTRAINT `FKnf9hll8j3o9ohglpuppj6tdu9` FOREIGN KEY (`staff_profile_id`) REFERENCES `staff_profiles` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `staff_permissions`
--

LOCK TABLES `staff_permissions` WRITE;
/*!40000 ALTER TABLE `staff_permissions` DISABLE KEYS */;
/*!40000 ALTER TABLE `staff_permissions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `staff_profiles`
--

DROP TABLE IF EXISTS `staff_profiles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `staff_profiles` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `bio` text,
  `created_at` datetime(6) DEFAULT NULL,
  `license_number` varchar(100) DEFAULT NULL,
  `qualifications` text,
  `shift_end` time(6) DEFAULT NULL,
  `shift_start` time(6) DEFAULT NULL,
  `specialization` varchar(200) DEFAULT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  `user_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UK_iqbe2ysx5v1al3px8acr6l03a` (`user_id`),
  CONSTRAINT `FKgggh5yb7npiyuqwkrrs9pjnfa` FOREIGN KEY (`user_id`) REFERENCES `app_users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `staff_profiles`
--

LOCK TABLES `staff_profiles` WRITE;
/*!40000 ALTER TABLE `staff_profiles` DISABLE KEYS */;
INSERT INTO `staff_profiles` VALUES (1,'Experienced General Physician with over 10 years of practice.','2026-03-02 16:36:29.962034','SLMC-2026-001','MBBS, MD (General Medicine)','17:00:00.000000','09:00:00.000000','General Medicine','2026-03-02 16:36:29.962034',1),(4,'Experienced General Physician with over 10 years of practice.','2026-03-04 07:44:34.683384','SLMC-2026-001','MBBS, MD (General Medicine)','17:00:00.000000','09:00:00.000000','General Medicine','2026-03-04 07:44:34.683384',15);
/*!40000 ALTER TABLE `staff_profiles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `suppliers`
--

DROP TABLE IF EXISTS `suppliers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `suppliers` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `address` text,
  `contact_person` varchar(150) DEFAULT NULL,
  `created_at` datetime(6) DEFAULT NULL,
  `email` varchar(150) DEFAULT NULL,
  `name` varchar(200) NOT NULL,
  `phone` varchar(30) DEFAULT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_supplier_name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `suppliers`
--

LOCK TABLES `suppliers` WRITE;
/*!40000 ALTER TABLE `suppliers` DISABLE KEYS */;
INSERT INTO `suppliers` VALUES (1,'Mount Lavinia','Lahiru Hemantha','2026-03-04 17:46:41.620909','getmed@gmail.com','GetMed','0112789584','2026-03-04 17:46:41.620909');
/*!40000 ALTER TABLE `suppliers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_roles`
--

DROP TABLE IF EXISTS `user_roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_roles` (
  `user_id` bigint NOT NULL,
  `role_id` bigint NOT NULL,
  PRIMARY KEY (`user_id`,`role_id`),
  KEY `FKihg20vygk8qb8lw0s573lqsmq` (`role_id`),
  CONSTRAINT `FKaf154i5th4vvgbahf8b8pa688` FOREIGN KEY (`user_id`) REFERENCES `app_users` (`id`),
  CONSTRAINT `FKihg20vygk8qb8lw0s573lqsmq` FOREIGN KEY (`role_id`) REFERENCES `app_roles` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_roles`
--

LOCK TABLES `user_roles` WRITE;
/*!40000 ALTER TABLE `user_roles` DISABLE KEYS */;
INSERT INTO `user_roles` VALUES (1,1),(15,1),(2,2),(16,2),(3,3),(17,3),(4,4),(18,4),(5,5),(19,5),(21,5),(6,6),(20,6);
/*!40000 ALTER TABLE `user_roles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `vital_signs`
--

DROP TABLE IF EXISTS `vital_signs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `vital_signs` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `blood_pressure_diastolic` int DEFAULT NULL,
  `blood_pressure_systolic` int DEFAULT NULL,
  `heart_rate` int DEFAULT NULL,
  `height` decimal(5,1) DEFAULT NULL,
  `notes` text,
  `oxygen_saturation` int DEFAULT NULL,
  `pain_scale` int DEFAULT NULL,
  `recorded_at` datetime(6) DEFAULT NULL,
  `respiratory_rate` int DEFAULT NULL,
  `symptoms` text,
  `temperature` decimal(4,1) DEFAULT NULL,
  `weight` decimal(5,1) DEFAULT NULL,
  `consultation_id` bigint DEFAULT NULL,
  `patient_id` bigint NOT NULL,
  `queue_entry_id` bigint DEFAULT NULL,
  `recorded_by` bigint NOT NULL,
  PRIMARY KEY (`id`),
  KEY `FKmw4whkgw9o2pdufiusm9150c9` (`consultation_id`),
  KEY `FK3ifxnn3rjq0qnpbhmdy2c03gi` (`patient_id`),
  KEY `FKa97nfi82huufhi33028h4dxal` (`queue_entry_id`),
  KEY `FK4pwahvkbo9shpbjx8qfh6bu0s` (`recorded_by`),
  CONSTRAINT `FK3ifxnn3rjq0qnpbhmdy2c03gi` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`id`),
  CONSTRAINT `FK4pwahvkbo9shpbjx8qfh6bu0s` FOREIGN KEY (`recorded_by`) REFERENCES `app_users` (`id`),
  CONSTRAINT `FKa97nfi82huufhi33028h4dxal` FOREIGN KEY (`queue_entry_id`) REFERENCES `queue_entries` (`id`),
  CONSTRAINT `FKmw4whkgw9o2pdufiusm9150c9` FOREIGN KEY (`consultation_id`) REFERENCES `consultations` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `vital_signs`
--

LOCK TABLES `vital_signs` WRITE;
/*!40000 ALTER TABLE `vital_signs` DISABLE KEYS */;
INSERT INTO `vital_signs` VALUES (5,79,121,73,171.2,NULL,98,2,'2026-03-04 18:06:09.401215',16,'Nurse runtime test',36.8,68.5,NULL,1,9,2);
/*!40000 ALTER TABLE `vital_signs` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-03-09 10:57:22
