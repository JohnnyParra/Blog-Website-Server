-- MySQL dump 10.13  Distrib 8.0.34, for Win64 (x86_64)
--
-- Host: localhost    Database: blog_database
-- ------------------------------------------------------
-- Server version	8.0.34

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
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(80) NOT NULL,
  `email` varchar(256) NOT NULL,
  `password` blob NOT NULL,
  `color` varchar(10) DEFAULT NULL,
  `avatar` varchar(255) DEFAULT NULL,
  `date_created` datetime DEFAULT NULL,
  `date_deleted` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `id_UNIQUE` (`id`),
  UNIQUE KEY `email_UNIQUE` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=28 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'Johnny','j@gmail.com',_binary '$2b$10$PCgFPFr0t/DKMOG/cjxOReO2//Wy1azQC2G1vwcSHrLE4VV7kEKxu',NULL,'http://localhost:3000/public/avatars/1672708421032-IMG_0491.jpg','2023-02-01 15:04:36',NULL),(2,'Matthew','m@gmail.com',_binary '$2b$10$NA7ahEjkpbFB8kX7mhoZK.2u0ud1trkkSEsLa8ij4DWPVQOlJpDMO',NULL,NULL,'2023-02-07 15:04:36',NULL),(3,'Geralt','geralt@gmail.com',_binary '$2b$10$vxwjF4XsPeMlqxZi4w64JOIaF09qAeMDyT58bWoAWf9bGvDs/UbCa',NULL,'http://localhost:3000/public/avatars/1712030658794-geralt.jpg','2023-02-22 07:40:41',NULL),(23,'test5','test5@gmail.com',_binary '$2b$10$zWq564CbVUP3kBZJcvRw9eUVTMF85Xma2dPaofqGEOLduF4MhdYB.',NULL,'http://localhost:3000/public/avatars/1711573803217-Witcher Medallion.png','2024-03-27 01:18:16',NULL),(24,'Mark','mark@gmail.com',_binary '$2b$10$.JXPy.OMdIqieU19V5KKpOI/SIzTCJvzJ8TR66nhWJyP68rHbOvVu',NULL,'http://localhost:3000/public/avatars/1712030784596-Invincible.jpg','2024-04-02 04:05:00',NULL),(25,'Dany','dany@gmail.com',_binary '$2b$10$kyUadE2CXV2T8wBd6UWf9uGGsmBPsOgkFh/QliLVPWmfRaR/K0xhS',NULL,'http://localhost:3000/public/avatars/1712030888977-Daenerys.Targaryen.jpg','2024-04-02 04:07:56',NULL),(26,'Lara','lara@gmail.com',_binary '$2b$10$.JHVRCLuILfbJlHCyYQ7F.yK6P3tWLymq3PtKevGAKXnq9mv2fvVm',NULL,'http://localhost:3000/public/avatars/1712031032373-laracroft.jpg','2024-04-02 04:10:16',NULL),(27,'Payne','payne@gmail.com',_binary '$2b$10$wZE2IyGKS.05i6Xiel7dIuIsQ1dksdiOzFWHTRS4fMx6C6T2rEos.',NULL,'http://localhost:3000/public/avatars/1712031109437-payne.jpg','2024-04-02 04:11:38',NULL);
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2024-04-01 22:09:36
