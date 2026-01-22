-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Jan 22, 2026 at 08:14 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `hirams_backend`
--

-- --------------------------------------------------------

--
-- Table structure for table `cache`
--

CREATE TABLE `cache` (
  `key` varchar(255) NOT NULL,
  `value` mediumtext NOT NULL,
  `expiration` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `cache_locks`
--

CREATE TABLE `cache_locks` (
  `key` varchar(255) NOT NULL,
  `owner` varchar(255) NOT NULL,
  `expiration` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `failed_jobs`
--

CREATE TABLE `failed_jobs` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `uuid` varchar(255) NOT NULL,
  `connection` text NOT NULL,
  `queue` text NOT NULL,
  `payload` longtext NOT NULL,
  `exception` longtext NOT NULL,
  `failed_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `jobs`
--

CREATE TABLE `jobs` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `queue` varchar(255) NOT NULL,
  `payload` longtext NOT NULL,
  `attempts` tinyint(3) UNSIGNED NOT NULL,
  `reserved_at` int(10) UNSIGNED DEFAULT NULL,
  `available_at` int(10) UNSIGNED NOT NULL,
  `created_at` int(10) UNSIGNED NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `jobs`
--

INSERT INTO `jobs` (`id`, `queue`, `payload`, `attempts`, `reserved_at`, `available_at`, `created_at`) VALUES
(1, 'default', '{\"uuid\":\"ba0af4bf-0fda-4153-ac02-2869a40cac57\",\"displayName\":\"App\\\\Events\\\\TransactionsUpdated\",\"job\":\"Illuminate\\\\Queue\\\\CallQueuedHandler@call\",\"maxTries\":null,\"maxExceptions\":null,\"failOnTimeout\":false,\"backoff\":null,\"timeout\":null,\"retryUntil\":null,\"data\":{\"commandName\":\"Illuminate\\\\Broadcasting\\\\BroadcastEvent\",\"command\":\"O:38:\\\"Illuminate\\\\Broadcasting\\\\BroadcastEvent\\\":16:{s:5:\\\"event\\\";O:30:\\\"App\\\\Events\\\\TransactionsUpdated\\\":1:{s:11:\\\"transaction\\\";O:45:\\\"Illuminate\\\\Contracts\\\\Database\\\\ModelIdentifier\\\":5:{s:5:\\\"class\\\";s:23:\\\"App\\\\Models\\\\Transactions\\\";s:2:\\\"id\\\";i:3;s:9:\\\"relations\\\";a:0:{}s:10:\\\"connection\\\";s:5:\\\"mysql\\\";s:15:\\\"collectionClass\\\";N;}}s:5:\\\"tries\\\";N;s:7:\\\"timeout\\\";N;s:7:\\\"backoff\\\";N;s:13:\\\"maxExceptions\\\";N;s:10:\\\"connection\\\";N;s:5:\\\"queue\\\";N;s:12:\\\"messageGroup\\\";N;s:12:\\\"deduplicator\\\";N;s:5:\\\"delay\\\";N;s:11:\\\"afterCommit\\\";N;s:10:\\\"middleware\\\";a:0:{}s:7:\\\"chained\\\";a:0:{}s:15:\\\"chainConnection\\\";N;s:10:\\\"chainQueue\\\";N;s:19:\\\"chainCatchCallbacks\\\";N;}\"},\"createdAt\":1765156057,\"delay\":null}', 0, NULL, 1765156058, 1765156058);

-- --------------------------------------------------------

--
-- Table structure for table `job_batches`
--

CREATE TABLE `job_batches` (
  `id` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `total_jobs` int(11) NOT NULL,
  `pending_jobs` int(11) NOT NULL,
  `failed_jobs` int(11) NOT NULL,
  `failed_job_ids` longtext NOT NULL,
  `options` mediumtext DEFAULT NULL,
  `cancelled_at` int(11) DEFAULT NULL,
  `created_at` int(11) NOT NULL,
  `finished_at` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `migrations`
--

CREATE TABLE `migrations` (
  `id` int(10) UNSIGNED NOT NULL,
  `migration` varchar(255) NOT NULL,
  `batch` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `migrations`
--

INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES
(1, '0001_01_01_000000_create_users_table', 1),
(2, '0001_01_01_000001_create_cache_table', 1),
(3, '0001_01_01_000002_create_jobs_table', 1),
(4, '2025_10_14_005248_create_roles_table', 1),
(5, '2025_10_14_011104_update_users_table', 1),
(6, '2025_10_14_021655_update_users_add_column_to_table', 1),
(7, '2025_10_14_032109_create_personal_access_tokens_table', 1),
(8, '2025_10_14_052027_create_tblcompanies_table', 1),
(9, '2025_10_15_003551_create_tblusers_table', 1),
(10, '2025_10_15_021025_create_tblclients_table', 1),
(11, '2025_10_16_023549_create_tblsuppliers_table', 1),
(12, '2025_10_16_025932_create_tblsupplierbanks_table', 1),
(13, '2025_10_17_031601_create_tblsuppliercontacts_table', 2),
(14, '2025_10_17_032739_create_tblsqlerrors_table', 2),
(15, '2025_10_23_082037_create_tbltransactions_table', 3),
(16, '2025_10_24_003918_create_tbltransactionitems_table', 3),
(17, '2025_10_24_005311_create_tblitempricings__table', 3),
(18, '2025_10_29_002451_create_tblpricingsets_table', 4),
(19, '2025_10_29_011955_create_tblitempricings_table', 4),
(20, '2025_10_29_080445_create_tblpurchaseoptions_table', 4),
(21, '2025_11_03_023122_create_tbltransactionhistories_table', 5);

-- --------------------------------------------------------

--
-- Table structure for table `password_reset_tokens`
--

CREATE TABLE `password_reset_tokens` (
  `email` varchar(255) NOT NULL,
  `token` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `personal_access_tokens`
--

CREATE TABLE `personal_access_tokens` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `tokenable_type` varchar(255) NOT NULL,
  `tokenable_id` bigint(20) UNSIGNED NOT NULL,
  `name` text NOT NULL,
  `token` varchar(64) NOT NULL,
  `abilities` text DEFAULT NULL,
  `last_used_at` timestamp NULL DEFAULT NULL,
  `expires_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `roles`
--

CREATE TABLE `roles` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `sessions`
--

CREATE TABLE `sessions` (
  `id` varchar(255) NOT NULL,
  `user_id` bigint(20) UNSIGNED DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `payload` longtext NOT NULL,
  `last_activity` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `sessions`
--

INSERT INTO `sessions` (`id`, `user_id`, `ip_address`, `user_agent`, `payload`, `last_activity`) VALUES
('CtYDUeyV35PpJShJb3aQ0B6O8elCwN8zOjKbboeo', NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0', 'YTozOntzOjY6Il90b2tlbiI7czo0MDoiVlh5WVlTRzN2N2VJUksyNXp3V2d3WUlhMDhiM1U1dURieU94V3JncSI7czo5OiJfcHJldmlvdXMiO2E6MTp7czozOiJ1cmwiO3M6MjE6Imh0dHA6Ly8xMjcuMC4wLjE6ODAwMCI7fXM6NjoiX2ZsYXNoIjthOjI6e3M6Mzoib2xkIjthOjA6e31zOjM6Im5ldyI7YTowOnt9fX0=', 1768965388),
('IXJhPLDXwKwdbKMR57erOBc2qAgQa4ewiD2STwTa', NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0', 'YTozOntzOjY6Il90b2tlbiI7czo0MDoiR2pWaWtsQ0pjeE1yM01PSE1IRmRSazczTXU4cHJYenRxbGJlQXBQOSI7czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6MjE6Imh0dHA6Ly8xMjcuMC4wLjE6ODAwMCI7czo1OiJyb3V0ZSI7Tjt9czo2OiJfZmxhc2giO2E6Mjp7czozOiJvbGQiO2E6MDp7fXM6MzoibmV3IjthOjA6e319fQ==', 1768898968),
('ymaPPvGZChI9VLKIyZuj8SR9ewCjhJR4CIriZwHB', NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0', 'YTozOntzOjY6Il90b2tlbiI7czo0MDoidjdqSkJiMlRVRzNEUDVjOUFhUUM2UUxSQTMxYVNsQkVrOVFsWjdycSI7czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6MjE6Imh0dHA6Ly8xMjcuMC4wLjE6ODAwMCI7czo1OiJyb3V0ZSI7Tjt9czo2OiJfZmxhc2giO2E6Mjp7czozOiJvbGQiO2E6MDp7fXM6MzoibmV3IjthOjA6e319fQ==', 1768964267);

-- --------------------------------------------------------

--
-- Table structure for table `tblclients`
--

CREATE TABLE `tblclients` (
  `nClientId` bigint(20) UNSIGNED NOT NULL,
  `strClientName` varchar(100) NOT NULL,
  `strClientNickName` varchar(25) NOT NULL,
  `strTIN` varchar(15) DEFAULT NULL,
  `strAddress` varchar(200) DEFAULT NULL,
  `strBusinessStyle` varchar(20) DEFAULT NULL,
  `strContactPerson` varchar(40) DEFAULT NULL,
  `strContactNumber` varchar(50) DEFAULT NULL,
  `cStatus` char(1) NOT NULL DEFAULT 'A'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `tblclients`
--

INSERT INTO `tblclients` (`nClientId`, `strClientName`, `strClientNickName`, `strTIN`, `strAddress`, `strBusinessStyle`, `strContactPerson`, `strContactNumber`, `cStatus`) VALUES
(1, 'Alpha Trading Corp', 'ALPHA', '090 909 090 90', 'Makati City, PH', 'Trading', 'John Cruz', '09171234567', 'A'),
(2, 'Blue Ocean Ventures', 'BOV', '987 654 321 00', 'Cebu City', 'Consulting', 'Maria Reyes', '09981234567', 'A'),
(3, 'Crescent Technologiesd', 'CRESCENT', '555 222 111 22', 'Quezon City, PH', 'IT Services', 'Carlos Santos', '09221234567', 'A'),
(4, 'Dyna Logistics', 'DYNA', '444-333-222', 'Manila, PH', 'Logistics', 'Anna Dela Cruz', '09331234567', 'A'),
(5, 'Evergreen Foods Inc.', 'EVGF', '222 111 000 00', 'Davao City, PH', 'Manufacturing', 'Jose Tan', '09451234567', 'A'),
(18, 'Alpha Trading Corpf', 'ALPHA', '090 909 090 90', NULL, 'Trading', 'John Cruz', '09171234567', 'P'),
(19, 'Pick-up Shop', 'Pick-up', '090 909 232 32', 'JP Rizal Street, Calapan City', 'Trading', 'Ricardo Dalisay', '09171234567', 'P'),
(20, 'fgfgfgfg345643454', 'erewew', NULL, 'wewwewe', NULL, NULL, NULL, 'P'),
(21, 'dfdfdf', 'df', NULL, NULL, NULL, NULL, NULL, 'A');

-- --------------------------------------------------------

--
-- Table structure for table `tblcompanies`
--

CREATE TABLE `tblcompanies` (
  `nCompanyId` bigint(20) UNSIGNED NOT NULL,
  `strCompanyName` varchar(50) NOT NULL,
  `strCompanyNickName` varchar(20) NOT NULL,
  `strTIN` varchar(15) DEFAULT NULL,
  `strAddress` varchar(200) DEFAULT NULL,
  `bVAT` tinyint(4) NOT NULL,
  `bEWT` tinyint(4) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `tblcompanies`
--

INSERT INTO `tblcompanies` (`nCompanyId`, `strCompanyName`, `strCompanyNickName`, `strTIN`, `strAddress`, `bVAT`, `bEWT`) VALUES
(1, 'Hirams Supply Wholesaling', 'Hirams', '000 000 000 000', 'Brgy. Nacoco, Calapan City, Oriental Mindoro', 1, 1),
(2, 'Teknokrat', 'Teknokrat', '000 011 100 011', 'Brgy. Nacoco, Calapan City, Oriental Mindoro', 1, 0);

-- --------------------------------------------------------

--
-- Table structure for table `tblitempricings`
--

CREATE TABLE `tblitempricings` (
  `nItemPriceId` bigint(20) UNSIGNED NOT NULL,
  `nPricingSetId` int(11) NOT NULL,
  `nTransactionItemId` int(11) NOT NULL,
  `dUnitSellingPrice` double NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `tblitempricings_`
--

CREATE TABLE `tblitempricings_` (
  `nItemPriceId` bigint(20) UNSIGNED NOT NULL,
  `nPricingSetId` int(11) NOT NULL,
  `nTransactionItemId` int(11) NOT NULL,
  `dUnitSellingPrice` double NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `tblpricingsets`
--

CREATE TABLE `tblpricingsets` (
  `nPricingSetId` bigint(20) UNSIGNED NOT NULL,
  `nTransactionId` bigint(20) UNSIGNED NOT NULL,
  `strName` varchar(20) NOT NULL,
  `bChosen` tinyint(4) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `tblpurchaseoptions`
--

CREATE TABLE `tblpurchaseoptions` (
  `nPurchaseOptionId` int(10) UNSIGNED NOT NULL,
  `nTransactionItemId` int(10) UNSIGNED NOT NULL,
  `nSupplierId` int(10) UNSIGNED NOT NULL,
  `nQuantity` int(11) NOT NULL,
  `strUOM` varchar(20) NOT NULL,
  `strBrand` varchar(30) DEFAULT NULL,
  `strModel` varchar(40) DEFAULT NULL,
  `strSpecs` mediumtext DEFAULT NULL,
  `dUnitPrice` double NOT NULL,
  `dEWT` double DEFAULT NULL,
  `strProductCode` varchar(30) DEFAULT NULL,
  `bIncluded` tinyint(1) NOT NULL,
  `dtCanvass` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `tblsqlerrors`
--

CREATE TABLE `tblsqlerrors` (
  `nErrorId` bigint(20) UNSIGNED NOT NULL,
  `dtDate` datetime NOT NULL DEFAULT current_timestamp(),
  `strError` varchar(1000) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `tblsupplierbanks`
--

CREATE TABLE `tblsupplierbanks` (
  `nSupplierBankId` bigint(20) UNSIGNED NOT NULL,
  `nSupplierId` int(11) NOT NULL,
  `strBankName` varchar(50) NOT NULL,
  `strAccountName` varchar(100) NOT NULL,
  `strAccountNumber` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `tblsuppliercontacts`
--

CREATE TABLE `tblsuppliercontacts` (
  `nSupplierContactId` bigint(20) UNSIGNED NOT NULL,
  `nSupplierId` int(11) NOT NULL,
  `strName` varchar(50) NOT NULL,
  `strNumber` varchar(50) NOT NULL,
  `strPosition` varchar(50) DEFAULT NULL,
  `strDepartment` varchar(50) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `tblsuppliers`
--

CREATE TABLE `tblsuppliers` (
  `nSupplierId` bigint(20) UNSIGNED NOT NULL,
  `strSupplierName` varchar(100) NOT NULL,
  `strSupplierNickName` varchar(25) NOT NULL,
  `strAddress` varchar(200) DEFAULT NULL,
  `strTIN` varchar(20) DEFAULT NULL,
  `bVAT` tinyint(4) NOT NULL DEFAULT 0,
  `bEWT` tinyint(4) NOT NULL DEFAULT 0,
  `cStatus` char(1) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `tbltransactionhistories`
--

CREATE TABLE `tbltransactionhistories` (
  `nTransactionHistoryId` bigint(20) UNSIGNED NOT NULL,
  `nTransactionId` int(11) NOT NULL,
  `dtOccur` datetime NOT NULL,
  `nStatus` int(11) NOT NULL,
  `nUserId` int(11) DEFAULT NULL,
  `strRemarks` varchar(200) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `tbltransactionitems`
--

CREATE TABLE `tbltransactionitems` (
  `nTransactionItemId` bigint(20) UNSIGNED NOT NULL,
  `nTransactionId` int(11) NOT NULL,
  `nItemNumber` int(11) NOT NULL,
  `nQuantity` int(11) NOT NULL,
  `strUOM` varchar(10) NOT NULL,
  `strName` varchar(200) NOT NULL,
  `strSpecs` mediumtext DEFAULT NULL,
  `dUnitABC` double DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `tbltransactions`
--

CREATE TABLE `tbltransactions` (
  `nTransactionId` bigint(20) UNSIGNED NOT NULL,
  `nCompanyId` int(11) DEFAULT NULL,
  `nClientId` int(11) NOT NULL,
  `nAssignedAO` int(11) DEFAULT NULL,
  `dtAODueDate` datetime DEFAULT NULL,
  `strTitle` varchar(500) NOT NULL,
  `strRefNumber` varchar(255) DEFAULT NULL,
  `dTotalABC` double DEFAULT NULL,
  `cProcMode` varchar(20) DEFAULT NULL,
  `cItemType` char(1) NOT NULL,
  `strCode` varchar(30) DEFAULT NULL,
  `cProcSource` char(1) DEFAULT NULL,
  `dtPreBid` datetime DEFAULT NULL,
  `strPreBid_Venue` varchar(70) DEFAULT NULL,
  `dtDocIssuance` datetime DEFAULT NULL,
  `strDocIssuance_Venue` varchar(70) DEFAULT NULL,
  `dtDocSubmission` datetime DEFAULT NULL,
  `strDocSubmission_Venue` varchar(70) DEFAULT NULL,
  `dtDocOpening` datetime DEFAULT NULL,
  `strDocOpening_Venue` varchar(70) DEFAULT NULL,
  `nDeliveryDays` int(11) DEFAULT NULL,
  `strDeliveryPlace` varchar(300) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `tblusers`
--

CREATE TABLE `tblusers` (
  `nUserId` bigint(20) UNSIGNED NOT NULL,
  `strFName` varchar(50) NOT NULL,
  `strMName` varchar(50) DEFAULT NULL,
  `strLName` varchar(50) NOT NULL,
  `strNickName` varchar(20) NOT NULL,
  `cUserType` char(1) NOT NULL,
  `strProfileImage` varchar(255) DEFAULT NULL,
  `cSex` char(1) DEFAULT NULL,
  `strEmail` varchar(50) NOT NULL,
  `strUserName` varchar(50) NOT NULL,
  `strPassword` varchar(100) NOT NULL,
  `remember_token` varchar(100) DEFAULT NULL,
  `cStatus` char(1) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `tblusers`
--

INSERT INTO `tblusers` (`nUserId`, `strFName`, `strMName`, `strLName`, `strNickName`, `cUserType`, `strProfileImage`, `cSex`, `strEmail`, `strUserName`, `strPassword`, `remember_token`, `cStatus`) VALUES
(30, 'Hilda', 'Medina', 'Arago', 'Hildz', 'G', NULL, 'F', 'johnrussdln@gmail.com', 'hilda', '$2y$12$BKnLtifQl5TgefIfLskLXOXoVDIhKELFk7GMBRwh79jTwaeNf15DW', '', 'A');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `first_name` varchar(255) NOT NULL,
  `middle_name` varchar(255) DEFAULT NULL,
  `last_name` varchar(255) NOT NULL,
  `username` varchar(255) NOT NULL,
  `status` enum('Inactive','Active') NOT NULL DEFAULT 'Active',
  `phone_number` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `email_verified_at` timestamp NULL DEFAULT NULL,
  `password` varchar(255) NOT NULL,
  `remember_token` varchar(100) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `cache`
--
ALTER TABLE `cache`
  ADD PRIMARY KEY (`key`);

--
-- Indexes for table `cache_locks`
--
ALTER TABLE `cache_locks`
  ADD PRIMARY KEY (`key`);

--
-- Indexes for table `failed_jobs`
--
ALTER TABLE `failed_jobs`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `failed_jobs_uuid_unique` (`uuid`);

--
-- Indexes for table `jobs`
--
ALTER TABLE `jobs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `jobs_queue_index` (`queue`);

--
-- Indexes for table `job_batches`
--
ALTER TABLE `job_batches`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `migrations`
--
ALTER TABLE `migrations`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `password_reset_tokens`
--
ALTER TABLE `password_reset_tokens`
  ADD PRIMARY KEY (`email`);

--
-- Indexes for table `personal_access_tokens`
--
ALTER TABLE `personal_access_tokens`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `personal_access_tokens_token_unique` (`token`),
  ADD KEY `personal_access_tokens_tokenable_type_tokenable_id_index` (`tokenable_type`,`tokenable_id`),
  ADD KEY `personal_access_tokens_expires_at_index` (`expires_at`);

--
-- Indexes for table `roles`
--
ALTER TABLE `roles`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `sessions`
--
ALTER TABLE `sessions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `sessions_user_id_index` (`user_id`),
  ADD KEY `sessions_last_activity_index` (`last_activity`);

--
-- Indexes for table `tblclients`
--
ALTER TABLE `tblclients`
  ADD PRIMARY KEY (`nClientId`);

--
-- Indexes for table `tblcompanies`
--
ALTER TABLE `tblcompanies`
  ADD PRIMARY KEY (`nCompanyId`);

--
-- Indexes for table `tblitempricings`
--
ALTER TABLE `tblitempricings`
  ADD PRIMARY KEY (`nItemPriceId`);

--
-- Indexes for table `tblitempricings_`
--
ALTER TABLE `tblitempricings_`
  ADD PRIMARY KEY (`nItemPriceId`);

--
-- Indexes for table `tblpricingsets`
--
ALTER TABLE `tblpricingsets`
  ADD PRIMARY KEY (`nPricingSetId`);

--
-- Indexes for table `tblpurchaseoptions`
--
ALTER TABLE `tblpurchaseoptions`
  ADD PRIMARY KEY (`nPurchaseOptionId`);

--
-- Indexes for table `tblsqlerrors`
--
ALTER TABLE `tblsqlerrors`
  ADD PRIMARY KEY (`nErrorId`);

--
-- Indexes for table `tblsupplierbanks`
--
ALTER TABLE `tblsupplierbanks`
  ADD PRIMARY KEY (`nSupplierBankId`);

--
-- Indexes for table `tblsuppliercontacts`
--
ALTER TABLE `tblsuppliercontacts`
  ADD PRIMARY KEY (`nSupplierContactId`);

--
-- Indexes for table `tblsuppliers`
--
ALTER TABLE `tblsuppliers`
  ADD PRIMARY KEY (`nSupplierId`);

--
-- Indexes for table `tbltransactionhistories`
--
ALTER TABLE `tbltransactionhistories`
  ADD PRIMARY KEY (`nTransactionHistoryId`);

--
-- Indexes for table `tbltransactionitems`
--
ALTER TABLE `tbltransactionitems`
  ADD PRIMARY KEY (`nTransactionItemId`);

--
-- Indexes for table `tbltransactions`
--
ALTER TABLE `tbltransactions`
  ADD PRIMARY KEY (`nTransactionId`);

--
-- Indexes for table `tblusers`
--
ALTER TABLE `tblusers`
  ADD PRIMARY KEY (`nUserId`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `users_email_unique` (`email`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `failed_jobs`
--
ALTER TABLE `failed_jobs`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `jobs`
--
ALTER TABLE `jobs`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `migrations`
--
ALTER TABLE `migrations`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=22;

--
-- AUTO_INCREMENT for table `personal_access_tokens`
--
ALTER TABLE `personal_access_tokens`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `roles`
--
ALTER TABLE `roles`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `tblclients`
--
ALTER TABLE `tblclients`
  MODIFY `nClientId` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=22;

--
-- AUTO_INCREMENT for table `tblcompanies`
--
ALTER TABLE `tblcompanies`
  MODIFY `nCompanyId` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `tblitempricings`
--
ALTER TABLE `tblitempricings`
  MODIFY `nItemPriceId` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `tblitempricings_`
--
ALTER TABLE `tblitempricings_`
  MODIFY `nItemPriceId` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `tblpricingsets`
--
ALTER TABLE `tblpricingsets`
  MODIFY `nPricingSetId` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `tblpurchaseoptions`
--
ALTER TABLE `tblpurchaseoptions`
  MODIFY `nPurchaseOptionId` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `tblsqlerrors`
--
ALTER TABLE `tblsqlerrors`
  MODIFY `nErrorId` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `tblsupplierbanks`
--
ALTER TABLE `tblsupplierbanks`
  MODIFY `nSupplierBankId` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `tblsuppliercontacts`
--
ALTER TABLE `tblsuppliercontacts`
  MODIFY `nSupplierContactId` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `tblsuppliers`
--
ALTER TABLE `tblsuppliers`
  MODIFY `nSupplierId` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `tbltransactionhistories`
--
ALTER TABLE `tbltransactionhistories`
  MODIFY `nTransactionHistoryId` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `tbltransactionitems`
--
ALTER TABLE `tbltransactionitems`
  MODIFY `nTransactionItemId` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `tbltransactions`
--
ALTER TABLE `tbltransactions`
  MODIFY `nTransactionId` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `tblusers`
--
ALTER TABLE `tblusers`
  MODIFY `nUserId` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=42;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
