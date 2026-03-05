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
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `app_users`
--

LOCK TABLES `app_users` WRITE;
/*!40000 ALTER TABLE `app_users` DISABLE KEYS */;
INSERT INTO `app_users` VALUES (1,'2026-03-02 16:36:29.914240','doctor@medcenter.lk','Dr. Samantha',_binary '','Perera','$2a$10$tS9N6hSDtERQYFQU5iMKyObbJO1eonUUdy0zDSWPlQV1SYYR0fnM6','0771234567',NULL,'2026-03-03 06:13:48.461267'),(2,'2026-03-02 16:36:29.927040','nurse@medcenter.lk','Nimali',_binary '','Silva','$2a$10$tS9N6hSDtERQYFQU5iMKyObbJO1eonUUdy0zDSWPlQV1SYYR0fnM6','0772345678',NULL,'2026-03-03 06:13:48.517734'),(3,'2026-03-02 16:36:29.932831','reception@medcenter.lk','Kasun',_binary '','Fernando','$2a$10$tS9N6hSDtERQYFQU5iMKyObbJO1eonUUdy0zDSWPlQV1SYYR0fnM6','0773456789',NULL,'2026-03-03 06:13:48.530966'),(4,'2026-03-02 16:36:29.938431','pharmacist@medcenter.lk','Ruwan',_binary '','Jayasinghe','$2a$10$tS9N6hSDtERQYFQU5iMKyObbJO1eonUUdy0zDSWPlQV1SYYR0fnM6','0774567890',NULL,'2026-03-03 06:13:48.543186'),(5,'2026-03-02 16:36:29.944483','patient@medcenter.lk','Amara',_binary '','Wickrama','$2a$10$tS9N6hSDtERQYFQU5iMKyObbJO1eonUUdy0zDSWPlQV1SYYR0fnM6','0775678901',NULL,'2026-03-03 06:13:48.555456'),(6,'2026-03-02 16:36:29.949235','admin@medcenter.lk','Admin',_binary '','User','$2a$10$tS9N6hSDtERQYFQU5iMKyObbJO1eonUUdy0zDSWPlQV1SYYR0fnM6','0770000000',NULL,'2026-03-03 06:13:48.570175'),(7,'2026-03-02 18:03:21.960766','test1772474600@medcenter.lk','Test',_binary '','User','$2a$10$f9Qx8oweMcVKwVwdCvqZ/.qSXna9dROch/YNmenHonXNvZBOjecJ.','0779991111',NULL,'2026-03-02 18:03:21.960766'),(8,'2026-03-02 18:03:30.044107','test1772474609@medcenter.lk','Test',_binary '','User','$2a$10$3orvW2So5vPKxAeyTX2Cruf4ufQYt0xgk.Vu/1g9purRwueHs6Jr6','0779991111',NULL,'2026-03-02 18:03:30.044107'),(9,'2026-03-02 18:14:35.171634','staff1772475275@medcenter.lk','Staff',_binary '','New','$2a$10$/v09vmXgJ8PEvoPPI/CLoOmKR6bI/ykFp26DzaONyborC/la5smBy','0771230000',NULL,'2026-03-02 18:14:35.171634'),(10,'2026-03-02 18:15:12.870963','staff1772475312@medcenter.lk','Staff',_binary '','New','$2a$10$rosHnjk0ewJqcDeb3WJ0eOxIezxzuBjVyghBzRPMDqGBxNljKjpKS','0771230000',NULL,'2026-03-02 18:15:12.870963'),(11,'2026-03-02 18:19:28.158073','e2e.patient.1772475567@medcenter.lk','E2E',_binary '\0','PatientUpdated','$2a$10$ysIdm0Gr1F8ipNgyAhPlouDot2cmYxePN3136JJW02M9tKdY.kkvq','0777000099',NULL,'2026-03-02 18:19:28.991907'),(12,'2026-03-02 18:20:35.730615','e2e.patient.1772475635@medcenter.lk','E2E',_binary '\0','PatientUpdated','$2a$10$sfnevMgpEJ95B3SgYDqUTuWXZqUJeRQbN/9VAj/Ks2JGCSiNeU9W.','0777000099',NULL,'2026-03-02 18:20:35.935139'),(13,'2026-03-02 18:21:37.228951','e2e.patient.1772475697@medcenter.lk','E2E',_binary '\0','PatientUpdated','$2a$10$jV0E3QXUaCcJCpO9C1RG6uqBqQumRyZmDA6p/b80tdCRYhH57tuBO','0777000099',NULL,'2026-03-02 18:21:37.398657'),(14,'2026-03-02 18:21:39.848342','e2e.patient.1772475699@medcenter.lk','E2E',_binary '\0','PatientUpdated','$2a$10$Nzt1CdJo8AtVf5OI0bKNk.W/7jeOzv0xPdHwXPnU7smhad5hHLIXe','0777000099',NULL,'2026-03-02 18:21:40.026639');
UPDATE `app_users`
SET `email` = REPLACE(`email`, '@medcenter.lk', '@primemedical.lk');
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
) ENGINE=InnoDB AUTO_INCREMENT=77 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `appointments`
--

LOCK TABLES `appointments` WRITE;
/*!40000 ALTER TABLE `appointments` DISABLE KEYS */;
INSERT INTO `appointments` VALUES (1,'2026-03-03 04:30:00.000000',NULL,'APT-2026-00001','2026-03-02 18:22:48.565349','E2E','COMPLETED','2026-03-02 18:22:55.132042','CONSULTATION',6,1,1,NULL),(4,'2026-03-03 07:30:00.000000',NULL,'APT-2026-00004','2026-03-02 18:26:02.515271','E2E','COMPLETED','2026-03-02 18:26:03.616654','CONSULTATION',6,1,1,NULL),(5,'2026-03-04 04:30:00.000000',NULL,'APT-2026-00005','2026-03-02 18:39:01.069821','E2E','COMPLETED','2026-03-02 18:39:02.954025','CONSULTATION',6,1,1,NULL),(6,'2026-03-05 03:30:00.000000',NULL,'APT-2026-00006','2026-03-02 18:41:36.394677','CRUD verify','CHECKED_IN','2026-03-02 18:41:36.745554','CONSULTATION',6,1,1,NULL),(7,'2026-03-06 03:30:00.000000',NULL,'APT-2026-00007','2026-03-02 18:41:48.847730','Delete debug','CONFIRMED','2026-03-02 18:41:48.847730','CONSULTATION',6,1,1,NULL),(9,'2026-03-04 05:30:00.000000',NULL,'APT-2026-00008','2026-03-02 18:43:41.428589','E2E','COMPLETED','2026-03-02 18:43:42.389532','CONSULTATION',6,1,1,NULL),(10,'2026-03-04 03:30:00.000000',NULL,'APT-2026-00009','2026-03-02 18:57:45.008860','patient self booking','CONFIRMED','2026-03-02 18:57:45.008860','CONSULTATION',5,1,1,NULL),(14,'2026-03-04 07:30:00.000000',NULL,'APT-2026-00011','2026-03-03 02:12:46.030135','E2E','COMPLETED','2026-03-03 02:12:48.638052','CONSULTATION',6,1,1,NULL),(16,'2026-03-03 09:30:00.000000',NULL,'APT-2026-00012','2026-03-03 02:18:10.974662','Virus','CONFIRMED','2026-03-03 02:18:10.974662','CONSULTATION',5,1,1,NULL),(17,'2026-03-06 05:30:00.000000','Receptionist cancelled','APT-2026-00013','2026-03-03 02:26:22.257039','Receptionist booking','CANCELLED','2026-03-03 02:26:23.846445','CONSULTATION',3,1,1,NULL),(18,'2026-03-07 04:30:00.000000','Reception flow cancel','APT-2026-00014','2026-03-03 02:34:44.368322','Reception flow verify','CANCELLED','2026-03-03 02:34:44.746529','CONSULTATION',3,1,1,NULL),(19,'2026-03-03 05:30:00.000000',NULL,'APT-2026-00015','2026-03-03 02:39:56.928870','Virus','CONFIRMED','2026-03-03 02:39:56.928870','FOLLOW_UP',3,1,1,NULL),(20,'2026-03-08 03:30:00.000000',NULL,'APT-2026-00016','2026-03-03 02:46:44.818838','Virus','CONFIRMED','2026-03-03 02:46:44.818838','FOLLOW_UP',3,1,1,NULL),(21,'2026-03-04 06:30:00.000000',NULL,'APT-2026-00017','2026-03-03 02:50:42.516350','delete-check','IN_CONSULTATION','2026-03-03 04:50:34.400355','CONSULTATION',3,1,1,NULL),(23,'2026-03-03 08:30:00.000000',NULL,'APT-2026-00018','2026-03-03 03:37:11.163446','','CONFIRMED','2026-03-03 03:37:11.166630','CONSULTATION',3,1,1,NULL),(25,'2026-03-08 04:30:00.000000',NULL,'APT-2026-00019','2026-03-03 03:40:54.690348','Virus','CONFIRMED','2026-03-03 03:40:54.692154','FOLLOW_UP',3,1,2,NULL),(42,'2026-03-05 05:30:00.000000','smoke cancel','APT-2026-00020','2026-03-03 03:53:50.585276','receptionist retry smoke','CANCELLED','2026-03-03 03:53:51.116980','CONSULTATION',3,1,1,NULL),(43,'2026-03-29 03:30:00.000000',NULL,'APT-2026-00021','2026-03-03 03:55:34.117533','Virus','CONFIRMED','2026-03-03 03:55:34.117533','WALK_IN',3,1,4,NULL),(44,'2026-03-07 03:30:00.000000',NULL,'APT-2026-00022','2026-03-03 03:58:37.233375','reschedule ui verify','CONFIRMED','2026-03-03 03:58:37.534394','CONSULTATION',3,1,1,NULL),(45,'2026-03-21 03:30:00.000000',NULL,'APT-2026-00023','2026-03-03 03:59:46.713264','Virus','CONFIRMED','2026-03-03 03:59:46.713264','CONSULTATION',3,1,2,NULL),(46,'2026-03-09 03:30:00.000000',NULL,'APT-2026-00024','2026-03-03 04:03:21.407398','reschedule confirm','CONFIRMED','2026-03-03 04:03:21.520537','CONSULTATION',3,1,1,NULL),(47,'2026-03-10 03:30:00.000000','cancel verify','APT-2026-00025','2026-03-03 04:04:50.127090','cancel ui verify','CANCELLED','2026-03-03 04:04:50.919216','CONSULTATION',3,1,1,NULL),(48,'2026-03-11 03:30:00.000000','cancel hide verify','APT-2026-00026','2026-03-03 04:06:26.083519','cancel hide verify','CANCELLED','2026-03-03 04:06:26.201034','CONSULTATION',3,1,1,NULL),(49,'2026-03-30 03:30:00.000000',NULL,'APT-2026-00027','2026-03-03 04:09:01.561808','Test 1','CONFIRMED','2026-03-03 04:09:01.561808','FOLLOW_UP',3,1,7,NULL),(50,'2026-03-12 10:30:00.000000',NULL,'APT-2026-00028','2026-03-03 04:12:58.154420','manual datetime reschedule verify','CONFIRMED','2026-03-03 04:12:58.245881','CONSULTATION',3,1,1,NULL),(51,'2026-03-31 03:30:00.000000',NULL,'APT-2026-00029','2026-03-03 04:15:04.051079','Test 123','CONFIRMED','2026-03-03 04:15:04.051079','WALK_IN',3,1,7,NULL),(52,'2026-03-14 10:00:00.000000',NULL,'APT-2026-00030','2026-03-03 04:17:42.157143','manual-ui verify','CONFIRMED','2026-03-03 04:17:42.294182','CONSULTATION',3,1,1,NULL),(53,'2026-03-30 04:30:00.000000',NULL,'APT-2026-00031','2026-03-03 04:19:27.565718','Test 123','CONFIRMED','2026-03-03 04:19:27.565718','FOLLOW_UP',3,1,2,NULL),(54,'2026-03-29 04:30:00.000000',NULL,'APT-2026-00032','2026-03-03 04:24:32.703645','Test 321','CONFIRMED','2026-03-03 04:24:32.703645','FOLLOW_UP',3,1,3,NULL),(55,'2026-03-15 08:15:00.000000',NULL,'APT-2026-00033','2026-03-03 04:26:56.985471','instant ui verify','CONFIRMED','2026-03-03 04:26:57.347855','CONSULTATION',3,1,1,NULL),(56,'2026-03-31 04:30:00.000000',NULL,'APT-2026-00034','2026-03-03 04:29:11.482593','Test','CONFIRMED','2026-03-03 04:29:11.483677','FOLLOW_UP',3,1,3,NULL),(57,'2026-03-16 03:30:00.000000','Cancelled by receptionist','APT-2026-00035','2026-03-03 04:34:20.473401','cancel verify','CANCELLED','2026-03-03 04:34:20.843433','CONSULTATION',3,1,1,NULL),(58,'2026-03-25 03:30:00.000000',NULL,'APT-2026-00036','2026-03-03 04:37:12.817762','Test@123','CONFIRMED','2026-03-03 04:37:12.819383','CONSULTATION',3,1,7,NULL),(59,'2026-03-24 03:30:00.000000',NULL,'APT-2026-00037','2026-03-03 05:06:40.131026','Last Test','CONFIRMED','2026-03-03 05:06:40.132124','CONSULTATION',3,1,2,NULL),(60,'2026-03-24 04:30:00.000000',NULL,'APT-2026-00038','2026-03-03 05:47:40.700796','','CONFIRMED','2026-03-03 05:47:40.700796','FOLLOW_UP',3,1,1,NULL),(61,'2026-03-27 03:30:00.000000',NULL,'APT-2026-00039','2026-03-03 05:48:53.520020','Last test 2','CONFIRMED','2026-03-03 05:48:53.520020','CONSULTATION',3,1,3,NULL),(63,'2026-03-26 03:30:00.000000',NULL,'APT-2026-00040','2026-03-03 05:57:39.053153','Final test','CONFIRMED','2026-03-03 05:57:39.053153','CONSULTATION',3,1,2,NULL),(65,'2026-03-17 03:30:00.000000',NULL,'APT-2026-00041','2026-03-03 06:04:13.634357','1234','CONFIRMED','2026-03-03 06:04:13.635357','CONSULTATION',3,1,7,NULL),(66,'2026-03-05 04:30:00.000000',NULL,'APT-2026-00042','2026-03-03 06:11:55.766161','force delete chain','IN_CONSULTATION','2026-03-03 06:11:58.392672','CONSULTATION',3,1,1,NULL),(67,'2026-03-05 06:30:00.000000',NULL,'APT-2026-00043','2026-03-03 06:12:11.950446','force delete chain','IN_CONSULTATION','2026-03-03 06:12:12.138098','CONSULTATION',3,1,1,NULL),(68,'2026-03-08 05:30:00.000000',NULL,'APT-2026-00044','2026-03-03 06:12:37.158846','delete-debug','IN_CONSULTATION','2026-03-03 06:12:39.790210','CONSULTATION',3,1,1,NULL),(71,'2026-03-25 10:30:00.000000',NULL,'APT-2026-00045','2026-03-03 06:18:28.962796','','CONFIRMED','2026-03-03 06:18:28.962796','CONSULTATION',3,1,2,NULL),(74,'2026-03-20 03:30:00.000000',NULL,'APT-2026-00046','2026-03-03 06:27:07.655000','','CONFIRMED','2026-03-03 06:27:07.655000','CONSULTATION',3,1,2,NULL),(75,'2026-03-06 04:30:00.000000',NULL,'APT-2026-00047','2026-03-03 07:10:43.663703','Test 1','CONFIRMED','2026-03-03 07:10:43.663703','WALK_IN',3,1,1,NULL),(76,'2026-03-06 06:30:00.000000',NULL,'APT-2026-00048','2026-03-03 07:13:21.592000','','CONFIRMED','2026-03-03 07:13:21.592000','CONSULTATION',3,1,1,NULL);
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
INSERT INTO `bill_line_items` VALUES (1,'Consultation Fee — Dr. Dr. Samantha Perera','CONSULTATION',1,1500.00,1500.00,1),(2,'Paracetamol 500mg — 500mg x 1','MEDICINE',1,5.00,5.00,1),(3,'Consultation Fee — Dr. Dr. Samantha Perera','CONSULTATION',1,1500.00,1500.00,2),(4,'Paracetamol 500mg — 500mg x 1','MEDICINE',1,5.00,5.00,2),(5,'Consultation Fee — Dr. Dr. Samantha Perera','CONSULTATION',1,1500.00,1500.00,3),(6,'Paracetamol 500mg — 500mg x 1','MEDICINE',1,5.00,5.00,3),(7,'Consultation Fee — Dr. Dr. Samantha Perera','CONSULTATION',1,1500.00,1500.00,4),(8,'Paracetamol 500mg — 500mg x 1','MEDICINE',1,5.00,5.00,4),(9,'Consultation Fee — Dr. Dr. Samantha Perera','CONSULTATION',1,1500.00,1500.00,5),(10,'Paracetamol 500mg — 500mg x 1','MEDICINE',1,5.00,5.00,5);
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
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `bills`
--

LOCK TABLES `bills` WRITE;
/*!40000 ALTER TABLE `bills` DISABLE KEYS */;
INSERT INTO `bills` VALUES (1,'2026-03-02 18:22:52.487817',0.00,'INV-2026-00001',1505.00,'PAID',1505.00,0.00,'2026-03-02 18:22:52.899541',1,6,1),(2,'2026-03-02 18:26:03.287828',0.00,'INV-2026-00002',1505.00,'PAID',1505.00,0.00,'2026-03-02 18:26:03.376857',2,6,1),(3,'2026-03-02 18:39:01.885221',0.00,'INV-2026-00003',1505.00,'PAID',1505.00,0.00,'2026-03-02 18:39:02.024512',3,6,1),(4,'2026-03-02 18:43:42.046208',0.00,'INV-2026-00004',1505.00,'PAID',1505.00,0.00,'2026-03-02 18:43:42.166120',4,6,1),(5,'2026-03-03 02:12:48.322240',0.00,'INV-2026-00005',1505.00,'PAID',1505.00,0.00,'2026-03-03 02:12:48.418240',5,6,1),(6,'2026-03-03 05:42:49.391156',0.00,'INV-2026-00006',0.00,'PAID',0.00,0.00,'2026-03-03 05:43:02.377800',NULL,3,2),(7,'2026-03-03 05:44:28.131192',0.00,'INV-2026-00007',0.00,'PAID',0.00,0.00,'2026-03-03 05:44:56.026301',NULL,3,1),(8,'2026-03-03 05:45:18.005246',0.00,'INV-2026-00008',0.00,'ISSUED',0.00,0.00,'2026-03-03 05:45:18.005246',NULL,3,1),(9,'2026-03-03 06:38:02.893058',0.00,'INV-2026-00009',0.00,'PAID',0.00,0.00,'2026-03-03 06:38:24.126231',NULL,3,1),(10,'2026-03-03 07:41:34.451654',0.00,'INV-2026-00010',0.00,'PAID',0.00,0.00,'2026-03-03 07:41:51.574727',NULL,3,1),(11,'2026-03-03 07:42:50.946507',0.00,'INV-2026-00011',0.00,'ISSUED',0.00,0.00,'2026-03-03 07:42:50.946507',NULL,3,1),(12,'2026-03-03 07:43:33.461611',0.00,'INV-2026-00012',0.00,'ISSUED',0.00,0.00,'2026-03-03 07:43:33.461611',NULL,3,1),(13,'2026-03-03 07:44:27.158579',0.00,'INV-2026-00013',0.00,'ISSUED',0.00,0.00,'2026-03-03 07:44:27.158579',NULL,3,1);
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
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `consultations`
--

LOCK TABLES `consultations` WRITE;
/*!40000 ALTER TABLE `consultations` DISABLE KEYS */;
INSERT INTO `consultations` VALUES (1,'2026-03-02 18:22:50.487336','viral',0,'2026-03-02 18:22:55.127043','stable',_binary '\0','e2e','2026-03-02 18:22:50.485336','COMPLETED','fever','rest','2026-03-02 18:22:55.130042',1,1,1,NULL),(2,'2026-03-02 18:26:02.844508','viral',0,'2026-03-02 18:26:03.611512','stable',_binary '\0','e2e','2026-03-02 18:26:02.843464','COMPLETED','fever','rest','2026-03-02 18:26:03.614565',4,1,1,NULL),(3,'2026-03-02 18:39:01.511193','viral',0,'2026-03-02 18:39:02.938488','stable',_binary '\0','e2e','2026-03-02 18:39:01.511194','COMPLETED','fever','rest','2026-03-02 18:39:02.952001',5,1,1,NULL),(4,'2026-03-02 18:43:41.720238','viral',0,'2026-03-02 18:43:42.384499','stable',_binary '\0','e2e','2026-03-02 18:43:41.719220','COMPLETED','fever','rest','2026-03-02 18:43:42.387522',9,1,1,NULL),(5,'2026-03-03 02:12:47.167441','viral',0,'2026-03-03 02:12:48.630407','stable',_binary '\0','e2e','2026-03-03 02:12:47.099612','COMPLETED','fever','rest','2026-03-03 02:12:48.634744',14,1,1,NULL),(6,'2026-03-03 04:50:34.267472',NULL,NULL,NULL,NULL,_binary '\0',NULL,'2026-03-03 04:50:34.192368','IN_PROGRESS',NULL,NULL,'2026-03-03 04:50:34.267472',21,1,1,NULL),(9,'2026-03-03 05:31:17.351393','test',NULL,NULL,'test',_binary '\0','','2026-03-03 05:31:17.318737','IN_PROGRESS','test','','2026-03-03 06:28:59.101366',NULL,1,1,7),(10,'2026-03-03 06:11:58.225994',NULL,NULL,NULL,NULL,_binary '\0',NULL,'2026-03-03 06:11:58.022492','IN_PROGRESS',NULL,NULL,'2026-03-03 06:11:58.226558',66,1,1,NULL),(11,'2026-03-03 06:12:12.119023',NULL,NULL,NULL,NULL,_binary '\0',NULL,'2026-03-03 06:12:12.119023','IN_PROGRESS',NULL,NULL,'2026-03-03 06:12:12.119023',67,1,1,NULL),(12,'2026-03-03 06:12:39.682692',NULL,NULL,NULL,NULL,_binary '\0',NULL,'2026-03-03 06:12:39.679432','IN_PROGRESS',NULL,NULL,'2026-03-03 06:12:39.682692',68,1,1,NULL);
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
) ENGINE=InnoDB AUTO_INCREMENT=106 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `doctor_schedules`
--

LOCK TABLES `doctor_schedules` WRITE;
/*!40000 ALTER TABLE `doctor_schedules` DISABLE KEYS */;
INSERT INTO `doctor_schedules` VALUES (1,NULL,'2026-03-02 16:36:29.994488',_binary '\0',1,'2026-03-02','09:00:00.000000',1),(2,NULL,'2026-03-02 16:36:30.000658',_binary '\0',1,'2026-03-02','10:00:00.000000',1),(3,NULL,'2026-03-02 16:36:30.006731',_binary '\0',1,'2026-03-02','11:00:00.000000',1),(4,NULL,'2026-03-02 16:36:30.012252',_binary '\0',1,'2026-03-02','12:00:00.000000',1),(5,NULL,'2026-03-02 16:36:30.018046',_binary '\0',1,'2026-03-02','14:00:00.000000',1),(6,NULL,'2026-03-02 16:36:30.023362',_binary '\0',1,'2026-03-02','15:00:00.000000',1),(7,NULL,'2026-03-02 16:36:30.029858',_binary '\0',1,'2026-03-02','16:00:00.000000',1),(8,NULL,'2026-03-02 16:36:30.035203',_binary '\0',1,'2026-03-03','09:00:00.000000',1),(9,NULL,'2026-03-02 16:36:30.041377',_binary '\0',1,'2026-03-03','10:00:00.000000',1),(10,NULL,'2026-03-02 16:36:30.046846',_binary '\0',1,'2026-03-03','11:00:00.000000',1),(11,NULL,'2026-03-02 16:36:30.051220',_binary '\0',1,'2026-03-03','12:00:00.000000',1),(12,NULL,'2026-03-02 16:36:30.056036',_binary '\0',1,'2026-03-03','14:00:00.000000',1),(13,NULL,'2026-03-02 16:36:30.061225',_binary '\0',1,'2026-03-03','15:00:00.000000',1),(14,NULL,'2026-03-02 16:36:30.067414',_binary '\0',1,'2026-03-03','16:00:00.000000',1),(15,NULL,'2026-03-02 16:36:30.072760',_binary '\0',1,'2026-03-04','09:00:00.000000',1),(16,NULL,'2026-03-02 16:36:30.078568',_binary '\0',1,'2026-03-04','10:00:00.000000',1),(17,NULL,'2026-03-02 16:36:30.083686',_binary '\0',1,'2026-03-04','11:00:00.000000',1),(18,NULL,'2026-03-02 16:36:30.088786',_binary '\0',1,'2026-03-04','12:00:00.000000',1),(19,NULL,'2026-03-02 16:36:30.092883',_binary '\0',1,'2026-03-04','14:00:00.000000',1),(20,NULL,'2026-03-02 16:36:30.097951',_binary '\0',1,'2026-03-04','15:00:00.000000',1),(21,NULL,'2026-03-02 16:36:30.102235',_binary '\0',1,'2026-03-04','16:00:00.000000',1),(22,NULL,'2026-03-02 16:36:30.106628',_binary '\0',1,'2026-03-05','09:00:00.000000',1),(23,NULL,'2026-03-02 16:36:30.111381',_binary '\0',1,'2026-03-05','10:00:00.000000',1),(24,NULL,'2026-03-02 16:36:30.116732',_binary '\0',1,'2026-03-05','11:00:00.000000',1),(25,NULL,'2026-03-02 16:36:30.121861',_binary '\0',1,'2026-03-05','12:00:00.000000',1),(26,NULL,'2026-03-02 16:36:30.127330',_binary '\0',1,'2026-03-05','14:00:00.000000',1),(27,NULL,'2026-03-02 16:36:30.131699',_binary '\0',1,'2026-03-05','15:00:00.000000',1),(28,NULL,'2026-03-02 16:36:30.136418',_binary '\0',1,'2026-03-05','16:00:00.000000',1),(29,NULL,'2026-03-02 16:36:30.142165',_binary '\0',1,'2026-03-06','09:00:00.000000',1),(30,NULL,'2026-03-02 16:36:30.147554',_binary '\0',1,'2026-03-06','10:00:00.000000',1),(31,NULL,'2026-03-02 16:36:30.151791',_binary '\0',1,'2026-03-06','11:00:00.000000',1),(32,NULL,'2026-03-02 16:36:30.157230',_binary '\0',1,'2026-03-06','12:00:00.000000',1),(33,NULL,'2026-03-02 16:36:30.161921',_binary '\0',1,'2026-03-06','14:00:00.000000',1),(34,NULL,'2026-03-02 16:36:30.166228',_binary '\0',1,'2026-03-06','15:00:00.000000',1),(35,NULL,'2026-03-02 16:36:30.171944',_binary '\0',1,'2026-03-06','16:00:00.000000',1),(36,NULL,'2026-03-02 16:36:30.176151',_binary '\0',1,'2026-03-07','09:00:00.000000',1),(37,NULL,'2026-03-02 16:36:30.182701',_binary '\0',1,'2026-03-07','10:00:00.000000',1),(38,NULL,'2026-03-02 16:36:30.188817',_binary '\0',1,'2026-03-07','11:00:00.000000',1),(39,NULL,'2026-03-02 16:36:30.194072',_binary '\0',1,'2026-03-07','12:00:00.000000',1),(40,NULL,'2026-03-02 16:36:30.198071',_binary '\0',1,'2026-03-07','14:00:00.000000',1),(41,NULL,'2026-03-02 16:36:30.203561',_binary '\0',1,'2026-03-07','15:00:00.000000',1),(42,NULL,'2026-03-02 16:36:30.208437',_binary '\0',1,'2026-03-07','16:00:00.000000',1),(43,NULL,'2026-03-02 16:36:30.214187',_binary '\0',1,'2026-03-08','09:00:00.000000',1),(44,NULL,'2026-03-02 16:36:30.219976',_binary '\0',1,'2026-03-08','10:00:00.000000',1),(45,NULL,'2026-03-02 16:36:30.224332',_binary '\0',1,'2026-03-08','11:00:00.000000',1),(46,NULL,'2026-03-02 16:36:30.229785',_binary '\0',1,'2026-03-08','12:00:00.000000',1),(47,NULL,'2026-03-02 16:36:30.235822',_binary '\0',1,'2026-03-08','14:00:00.000000',1),(48,NULL,'2026-03-02 16:36:30.240932',_binary '\0',1,'2026-03-08','15:00:00.000000',1),(49,NULL,'2026-03-02 16:36:30.246293',_binary '\0',1,'2026-03-08','16:00:00.000000',1),(50,NULL,'2026-03-02 16:36:30.250622',_binary '\0',1,'2026-03-09','09:00:00.000000',1),(51,NULL,'2026-03-02 16:36:30.255701',_binary '\0',1,'2026-03-09','10:00:00.000000',1),(52,NULL,'2026-03-02 16:36:30.259896',_binary '\0',1,'2026-03-09','11:00:00.000000',1),(53,NULL,'2026-03-02 16:36:30.264013',_binary '\0',1,'2026-03-09','12:00:00.000000',1),(54,NULL,'2026-03-02 16:36:30.268696',_binary '\0',1,'2026-03-09','14:00:00.000000',1),(55,NULL,'2026-03-02 16:36:30.272174',_binary '\0',1,'2026-03-09','15:00:00.000000',1),(56,NULL,'2026-03-02 16:36:30.276214',_binary '\0',1,'2026-03-09','16:00:00.000000',1),(57,NULL,'2026-03-02 16:36:30.281062',_binary '\0',1,'2026-03-10','09:00:00.000000',1),(58,NULL,'2026-03-02 16:36:30.284472',_binary '\0',1,'2026-03-10','10:00:00.000000',1),(59,NULL,'2026-03-02 16:36:30.289928',_binary '\0',1,'2026-03-10','11:00:00.000000',1),(60,NULL,'2026-03-02 16:36:30.294364',_binary '\0',1,'2026-03-10','12:00:00.000000',1),(61,NULL,'2026-03-02 16:36:30.299166',_binary '\0',1,'2026-03-10','14:00:00.000000',1),(62,NULL,'2026-03-02 16:36:30.303524',_binary '\0',1,'2026-03-10','15:00:00.000000',1),(63,NULL,'2026-03-02 16:36:30.307618',_binary '\0',1,'2026-03-10','16:00:00.000000',1),(64,NULL,'2026-03-02 16:36:30.312045',_binary '\0',1,'2026-03-11','09:00:00.000000',1),(65,NULL,'2026-03-02 16:36:30.316820',_binary '\0',1,'2026-03-11','10:00:00.000000',1),(66,NULL,'2026-03-02 16:36:30.320064',_binary '\0',1,'2026-03-11','11:00:00.000000',1),(67,NULL,'2026-03-02 16:36:30.324276',_binary '\0',1,'2026-03-11','12:00:00.000000',1),(68,NULL,'2026-03-02 16:36:30.328516',_binary '\0',1,'2026-03-11','14:00:00.000000',1),(69,NULL,'2026-03-02 16:36:30.331853',_binary '\0',1,'2026-03-11','15:00:00.000000',1),(70,NULL,'2026-03-02 16:36:30.336197',_binary '\0',1,'2026-03-11','16:00:00.000000',1),(71,NULL,'2026-03-02 16:36:30.340890',_binary '\0',1,'2026-03-12','09:00:00.000000',1),(72,NULL,'2026-03-02 16:36:30.345016',_binary '\0',1,'2026-03-12','10:00:00.000000',1),(73,NULL,'2026-03-02 16:36:30.350747',_binary '\0',1,'2026-03-12','11:00:00.000000',1),(74,NULL,'2026-03-02 16:36:30.353950',_binary '\0',1,'2026-03-12','12:00:00.000000',1),(75,NULL,'2026-03-02 16:36:30.359150',_binary '\0',1,'2026-03-12','14:00:00.000000',1),(76,NULL,'2026-03-02 16:36:30.362441',_binary '\0',1,'2026-03-12','15:00:00.000000',1),(77,NULL,'2026-03-02 16:36:30.366881',_binary '\0',1,'2026-03-12','16:00:00.000000',1),(78,NULL,'2026-03-02 16:36:30.371258',_binary '\0',1,'2026-03-13','09:00:00.000000',1),(79,NULL,'2026-03-02 16:36:30.376120',_binary '\0',1,'2026-03-13','10:00:00.000000',1),(80,NULL,'2026-03-02 16:36:30.380555',_binary '\0',1,'2026-03-13','11:00:00.000000',1),(81,NULL,'2026-03-02 16:36:30.384711',_binary '\0',1,'2026-03-13','12:00:00.000000',1),(82,NULL,'2026-03-02 16:36:30.389127',_binary '\0',1,'2026-03-13','14:00:00.000000',1),(83,NULL,'2026-03-02 16:36:30.392227',_binary '\0',1,'2026-03-13','15:00:00.000000',1),(84,NULL,'2026-03-02 16:36:30.396226',_binary '\0',1,'2026-03-13','16:00:00.000000',1),(85,NULL,'2026-03-02 16:36:30.400839',_binary '\0',1,'2026-03-14','09:00:00.000000',1),(86,NULL,'2026-03-02 16:36:30.404040',_binary '\0',1,'2026-03-14','10:00:00.000000',1),(87,NULL,'2026-03-02 16:36:30.408686',_binary '\0',1,'2026-03-14','11:00:00.000000',1),(88,NULL,'2026-03-02 16:36:30.412960',_binary '\0',1,'2026-03-14','12:00:00.000000',1),(89,NULL,'2026-03-02 16:36:30.416202',_binary '\0',1,'2026-03-14','14:00:00.000000',1),(90,NULL,'2026-03-02 16:36:30.419632',_binary '\0',1,'2026-03-14','15:00:00.000000',1),(91,NULL,'2026-03-02 16:36:30.423905',_binary '\0',1,'2026-03-14','16:00:00.000000',1),(92,NULL,'2026-03-02 16:36:30.428427',_binary '\0',1,'2026-03-15','09:00:00.000000',1),(93,NULL,'2026-03-02 16:36:30.432951',_binary '\0',1,'2026-03-15','10:00:00.000000',1),(94,NULL,'2026-03-02 16:36:30.436348',_binary '\0',1,'2026-03-15','11:00:00.000000',1),(95,NULL,'2026-03-02 16:36:30.440390',_binary '\0',1,'2026-03-15','12:00:00.000000',1),(96,NULL,'2026-03-02 16:36:30.444530',_binary '\0',1,'2026-03-15','14:00:00.000000',1),(97,NULL,'2026-03-02 16:36:30.448998',_binary '\0',1,'2026-03-15','15:00:00.000000',1),(98,NULL,'2026-03-02 16:36:30.453164',_binary '\0',1,'2026-03-15','16:00:00.000000',1),(99,NULL,'2026-03-02 18:42:28.283919',_binary '\0',1,'2026-03-16','09:00:00.000000',1),(100,NULL,'2026-03-02 18:42:28.302143',_binary '\0',1,'2026-03-16','10:00:00.000000',1),(101,NULL,'2026-03-02 18:42:28.307375',_binary '\0',1,'2026-03-16','11:00:00.000000',1),(102,NULL,'2026-03-02 18:42:28.312709',_binary '\0',1,'2026-03-16','12:00:00.000000',1),(103,NULL,'2026-03-02 18:42:28.316759',_binary '\0',1,'2026-03-16','14:00:00.000000',1),(104,NULL,'2026-03-02 18:42:28.320779',_binary '\0',1,'2026-03-16','15:00:00.000000',1),(105,NULL,'2026-03-02 18:42:28.324877',_binary '\0',1,'2026-03-16','16:00:00.000000',1);
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
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `inventory_items`
--

LOCK TABLES `inventory_items` WRITE;
/*!40000 ALTER TABLE `inventory_items` DISABLE KEYS */;
INSERT INTO `inventory_items` VALUES (1,NULL,NULL,NULL,'Analgesic','2026-03-02 16:36:30.486437',NULL,'Paracetamol 500mg','2027-12-31','Acetaminophen',_binary '\0',20,NULL,95,5.00,NULL,'Astron Pharma','tablets',3.00,'2026-03-03 02:12:48.253240',NULL),(2,NULL,NULL,NULL,'Antibiotic','2026-03-02 16:36:30.490828',NULL,'Amoxicillin 250mg','2027-06-30','Amoxicillin',_binary '\0',10,NULL,50,25.00,NULL,'Hemas Pharmaceuticals','capsules',18.00,'2026-03-02 16:36:30.490828',NULL),(3,NULL,NULL,NULL,'Antihistamine','2026-03-02 16:36:30.493979',NULL,'Cetirizine 10mg','2027-09-30','Cetirizine Hydrochloride',_binary '\0',15,NULL,75,8.00,NULL,'CIC Pharmaceuticals','tablets',5.00,'2026-03-02 16:36:30.493979',NULL),(4,NULL,NULL,'E2EB1772475636','OTHER','2026-03-02 18:20:36.798413','updated','E2E Drug 1772475636','2026-07-10','E2EGENU',_binary '\0',2,NULL,0,14.00,NULL,'E2E Supplier','tablets',11.00,'2026-03-02 18:20:36.935652',NULL),(5,NULL,NULL,'E2EB1772475697','OTHER','2026-03-02 18:21:37.765988','updated','E2E Drug 1772475697','2026-07-10','E2EGENU',_binary '\0',2,NULL,0,14.00,NULL,'E2E Supplier','tablets',11.00,'2026-03-02 18:21:37.852634',NULL),(6,NULL,NULL,'E2EB1772475700','OTHER','2026-03-02 18:21:40.697761','updated','E2E Drug 1772475700','2026-07-10','E2EGENU',_binary '\0',2,NULL,0,14.00,NULL,'E2E Supplier','tablets',11.00,'2026-03-02 18:21:40.776938',NULL),(7,'2026-03-02 18:22:54.377726','E2E archive','E2EB1772475773','OTHER','2026-03-02 18:22:53.585740','e2e item','E2E Drug 1772475773','2026-06-30','E2EGEN',_binary '',1,NULL,0,12.50,NULL,'E2E Supplier','tablets',10.00,'2026-03-02 18:22:54.377725',NULL),(8,'2026-03-02 18:26:03.543732','E2E archive','E2EB1772475963','OTHER','2026-03-02 18:26:03.435384','e2e item','E2E Drug 1772475963','2026-06-30','E2EGEN',_binary '',1,NULL,0,12.50,NULL,'E2E Supplier','tablets',10.00,'2026-03-02 18:26:03.544755',NULL),(9,'2026-03-02 18:39:02.715470','E2E archive','E2EB1772476742','OTHER','2026-03-02 18:39:02.106008','e2e item','E2E Drug 1772476742','2026-07-01','E2EGEN',_binary '',1,NULL,0,12.50,NULL,'E2E Supplier','tablets',10.00,'2026-03-02 18:39:02.726844',NULL),(10,'2026-03-02 18:43:42.318891','E2E archive','E2EB1772477022','OTHER','2026-03-02 18:43:42.214920','e2e item','E2E Drug 1772477022','2026-07-01','E2EGEN',_binary '',1,NULL,0,12.50,NULL,'E2E Supplier','tablets',10.00,'2026-03-02 18:43:42.318890',NULL),(11,'2026-03-03 02:12:48.579240','E2E archive','E2EB1772503968','OTHER','2026-03-03 02:12:48.472240','e2e item','E2E Drug 1772503968','2026-07-01','E2EGEN',_binary '',1,NULL,0,12.50,NULL,'E2E Supplier','tablets',10.00,'2026-03-03 02:12:48.580240',NULL);
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
) ENGINE=InnoDB AUTO_INCREMENT=22 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `inventory_stock_history`
--

LOCK TABLES `inventory_stock_history` WRITE;
/*!40000 ALTER TABLE `inventory_stock_history` DISABLE KEYS */;
INSERT INTO `inventory_stock_history` VALUES (1,'2026-03-02 18:20:36.810436','Item added',NULL,5,5,'New Purchase',4,6),(2,'2026-03-02 18:20:36.931471','set zero for archive',NULL,0,-5,'Adjustment',4,6),(3,'2026-03-02 18:21:37.768339','Item added',NULL,5,5,'New Purchase',5,6),(4,'2026-03-02 18:21:37.850345','set zero for archive',NULL,0,-5,'Adjustment',5,6),(5,'2026-03-02 18:21:40.700865','Item added',NULL,5,5,'New Purchase',6,6),(6,'2026-03-02 18:21:40.774938','set zero for archive',NULL,0,-5,'Adjustment',6,6),(7,'2026-03-02 18:22:52.109632','Dispensed for prescription #1',1,99,-1,'Dispensed',1,4),(8,'2026-03-02 18:22:53.587740','Item added',NULL,2,2,'New Purchase',7,6),(9,'2026-03-02 18:22:54.000330','zero',NULL,0,-2,'Adjustment',7,6),(10,'2026-03-02 18:26:03.111374','Dispensed for prescription #2',2,98,-1,'Dispensed',1,4),(11,'2026-03-02 18:26:03.437518','Item added',NULL,2,2,'New Purchase',8,6),(12,'2026-03-02 18:26:03.480464','zero',NULL,0,-2,'Adjustment',8,6),(13,'2026-03-02 18:39:01.749018','Dispensed for prescription #3',3,97,-1,'Dispensed',1,4),(14,'2026-03-02 18:39:02.186109','Item added',NULL,2,2,'New Purchase',9,6),(15,'2026-03-02 18:39:02.394341','zero',NULL,0,-2,'Adjustment',9,6),(16,'2026-03-02 18:43:41.966366','Dispensed for prescription #4',4,96,-1,'Dispensed',1,4),(17,'2026-03-02 18:43:42.216947','Item added',NULL,2,2,'New Purchase',10,6),(18,'2026-03-02 18:43:42.255640','zero',NULL,0,-2,'Adjustment',10,6),(19,'2026-03-03 02:12:48.231045','Dispensed for prescription #5',5,95,-1,'Dispensed',1,4),(20,'2026-03-03 02:12:48.474239','Item added',NULL,2,2,'New Purchase',11,6),(21,'2026-03-03 02:12:48.527239','zero',NULL,0,-2,'Adjustment',11,6);
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
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `patient_allergies`
--

LOCK TABLES `patient_allergies` WRITE;
/*!40000 ALTER TABLE `patient_allergies` DISABLE KEYS */;
INSERT INTO `patient_allergies` VALUES (1,'Penicillin','2026-03-02 18:19:28.893348','Rash','MODERATE',6,4),(2,'Penicillin','2026-03-02 18:20:35.881577','Rash','MODERATE',6,5),(3,'Penicillin','2026-03-02 18:21:37.358020','Rash','MODERATE',6,6),(4,'Penicillin','2026-03-02 18:21:39.982244','Rash','MODERATE',6,7);
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
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `patients`
--

LOCK TABLES `patients` WRITE;
/*!40000 ALTER TABLE `patients` DISABLE KEYS */;
INSERT INTO `patients` VALUES (1,'123 Galle Road, Colombo 03','2026-03-02 16:36:29.978508','1990-05-15',_binary '','Ruwan Wickrama','0779876543','FEMALE',NULL,'900456789V','PAT-2026-00001',_binary '\0','2026-03-02 16:36:29.978508',5),(2,'Colombo','2026-03-02 18:03:22.387746','1995-01-15',_binary '','Emergency Contact','0779992222','MALE',NULL,'951234560V','PAT-2026-00002',_binary '\0','2026-03-02 18:03:22.387746',7),(3,'Colombo','2026-03-02 18:03:30.063362','1995-01-15',_binary '','Emergency Contact','0779992222','MALE',NULL,'951234569V','PAT-2026-00003',_binary '\0','2026-03-02 18:03:30.063362',8),(4,'Kandy','2026-03-02 18:19:28.492219','1992-04-12',_binary '','EC2','0777000003','MALE',NULL,'920075567V','PAT-2026-00004',_binary '\0','2026-03-02 18:19:28.812333',11),(5,'Kandy','2026-03-02 18:20:35.747226','1992-04-12',_binary '','EC2','0777000003','MALE',NULL,'920075635V','PAT-2026-00005',_binary '\0','2026-03-02 18:20:35.821075',12),(6,'Kandy','2026-03-02 18:21:37.238965','1992-04-12',_binary '','EC2','0777000003','MALE',NULL,'920075697V','PAT-2026-00006',_binary '\0','2026-03-02 18:21:37.314057',13),(7,'Kandy','2026-03-02 18:21:39.856339','1992-04-12',_binary '','EC2','0777000003','MALE',NULL,'920075699V','PAT-2026-00007',_binary '\0','2026-03-02 18:21:39.935680',14);
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
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `payments`
--

LOCK TABLES `payments` WRITE;
/*!40000 ALTER TABLE `payments` DISABLE KEYS */;
INSERT INTO `payments` VALUES (1,1505.00,'full','2026-03-02 18:22:52.876766','CASH','E2E',1,6),(2,1505.00,'full','2026-03-02 18:26:03.351311','CASH','E2E',2,6),(3,1505.00,'full','2026-03-02 18:39:01.974573','CASH','E2E',3,6),(4,1505.00,'full','2026-03-02 18:43:42.142209','CASH','E2E',4,6),(5,1505.00,'full','2026-03-03 02:12:48.391240','CASH','E2E',5,6),(6,2500.00,'Bill','2026-03-03 05:43:02.347631','CASH','',6,3),(7,1800.00,'Test','2026-03-03 05:44:56.005962','CARD','Medical',7,3),(8,4500.00,'','2026-03-03 06:38:24.029568','CASH','',9,3),(9,7500.00,'test','2026-03-03 07:41:51.465078','CASH','',10,3);
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
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `prescription_items`
--

LOCK TABLES `prescription_items` WRITE;
/*!40000 ALTER TABLE `prescription_items` DISABLE KEYS */;
INSERT INTO `prescription_items` VALUES (1,'500mg','Paracetamol 500mg',3,'1-0-1','after food',1,1,1),(2,'500mg','Paracetamol 500mg',3,'1-0-1','after food',1,1,2),(3,'500mg','Paracetamol 500mg',3,'1-0-1','after food',1,1,3),(4,'500mg','Paracetamol 500mg',3,'1-0-1','after food',1,1,4),(5,'500mg','Paracetamol 500mg',3,'1-0-1','after food',1,1,5),(6,'500mg','Paracetamol',3,'1-0-1','After meals',6,NULL,6),(8,'500mg','Paracetamol',3,'1-0-1','After meals',6,NULL,7),(12,'500mg','Paracetamol',3,'BD','After meal',6,NULL,9),(13,'500mg','Paracetamol',3,'BD','After meal',6,NULL,10),(18,'500','Paracetamol 500mg',5,'1-0-1','test',10,1,13);
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
INSERT INTO `prescriptions` VALUES (1,'2026-03-02 18:22:52.110663','e2e rx','2026-03-02 18:22:51.709110','DISPENSED',1,4,1,1),(2,'2026-03-02 18:26:03.141379','e2e rx','2026-03-02 18:26:03.029839','DISPENSED',2,4,1,1),(3,'2026-03-02 18:39:01.755019','e2e rx','2026-03-02 18:39:01.670543','DISPENSED',3,4,1,1),(4,'2026-03-02 18:43:41.971505','e2e rx','2026-03-02 18:43:41.889754','DISPENSED',4,4,1,1),(5,'2026-03-03 02:12:48.238242','e2e rx','2026-03-03 02:12:48.092268','DISPENSED',5,4,1,1),(6,NULL,'Doctor added via E2E','2026-03-03 04:44:59.514080','PENDING',5,NULL,1,1),(7,NULL,'Doctor E2E update 20260303102459','2026-03-03 04:54:30.207370','PENDING',6,NULL,1,1),(9,NULL,'delete-chain','2026-03-03 06:11:59.003887','PENDING',10,NULL,1,1),(10,NULL,'delete-chain','2026-03-03 06:12:12.189438','PENDING',11,NULL,1,1),(13,NULL,'test','2026-03-03 07:17:11.325329','PENDING',9,NULL,1,1);
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
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `queue_entries`
--

LOCK TABLES `queue_entries` WRITE;
/*!40000 ALTER TABLE `queue_entries` DISABLE KEYS */;
INSERT INTO `queue_entries` VALUES (1,NULL,'2026-03-02 18:22:49.699545',NULL,'NORMAL','2026-03-02',1,'WAITING',1,1),(3,NULL,'2026-03-02 18:26:02.709756',NULL,'NORMAL','2026-03-02',3,'READY',4,1),(4,NULL,'2026-03-02 18:39:01.384556',NULL,'NORMAL','2026-03-03',1,'READY',5,1),(5,NULL,'2026-03-02 18:43:41.605839',NULL,'NORMAL','2026-03-03',2,'READY',9,1),(6,NULL,'2026-03-03 02:12:46.577193',NULL,'NORMAL','2026-03-03',3,'READY',14,1),(7,'2026-03-03 04:50:33.906951','2026-03-03 02:50:42.804542',NULL,'NORMAL','2026-03-03',4,'IN_CONSULTATION',21,1);
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
INSERT INTO `staff_permissions` VALUES (2,'VIEW_REPORTS'),(3,'VIEW_REPORTS');
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
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `staff_profiles`
--

LOCK TABLES `staff_profiles` WRITE;
/*!40000 ALTER TABLE `staff_profiles` DISABLE KEYS */;
INSERT INTO `staff_profiles` VALUES (1,'Experienced General Physician with over 10 years of practice.','2026-03-02 16:36:29.962034','SLMC-2026-001','MBBS, MD (General Medicine)','17:00:00.000000','09:00:00.000000','General Medicine','2026-03-02 16:36:29.962034',1),(2,NULL,'2026-03-02 18:14:35.191204',NULL,NULL,NULL,NULL,NULL,'2026-03-02 18:14:35.191204',9),(3,NULL,'2026-03-02 18:15:12.874152',NULL,NULL,NULL,NULL,NULL,'2026-03-02 18:15:12.874152',10);
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `suppliers`
--

LOCK TABLES `suppliers` WRITE;
/*!40000 ALTER TABLE `suppliers` DISABLE KEYS */;
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
INSERT INTO `user_roles` VALUES (1,1),(2,2),(9,2),(10,2),(3,3),(4,4),(5,5),(7,5),(8,5),(11,5),(12,5),(13,5),(14,5),(6,6);
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
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `vital_signs`
--

LOCK TABLES `vital_signs` WRITE;
/*!40000 ALTER TABLE `vital_signs` DISABLE KEYS */;
INSERT INTO `vital_signs` VALUES (1,80,120,74,172.0,NULL,98,2,'2026-03-02 18:26:02.781769',16,'mild fever',36.8,70.1,NULL,1,3,6),(2,80,120,74,172.0,NULL,98,2,'2026-03-02 18:39:01.444989',16,'mild fever',36.8,70.1,NULL,1,4,6),(3,80,120,74,172.0,NULL,98,2,'2026-03-02 18:43:41.668905',16,'mild fever',36.8,70.1,NULL,1,5,6),(4,80,120,74,172.0,NULL,98,2,'2026-03-03 02:12:46.924326',16,'mild fever',36.8,70.1,NULL,1,6,6);
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

-- Dump completed on 2026-03-04 12:56:33
