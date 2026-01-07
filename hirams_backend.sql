-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Dec 26, 2025 at 01:28 PM
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
('G2KIB0JJNXozngzErPY6xcGl7ffsEmXDGyZIuIQs', NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:144.0) Gecko/20100101 Firefox/144.0', 'YTozOntzOjY6Il90b2tlbiI7czo0MDoiMUx4NHhuczJXVG16ZkpwVlVpcWVISDVWbTM1VEViRVBCOFI1SjlqViI7czo5OiJfcHJldmlvdXMiO2E6MTp7czozOiJ1cmwiO3M6MjE6Imh0dHA6Ly9sb2NhbGhvc3Q6ODAwMCI7fXM6NjoiX2ZsYXNoIjthOjI6e3M6Mzoib2xkIjthOjA6e31zOjM6Im5ldyI7YTowOnt9fX0=', 1762792332),
('MG5wOzIE0ALAZoS5nJxtheFvNvg05h1TigA7NXzW', NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:145.0) Gecko/20100101 Firefox/145.0', 'YTozOntzOjY6Il90b2tlbiI7czo0MDoiOFl5ZFBtZVFTajlvNllLNk1NbXQ2TUxLY0k0RlVFaVQxbVllVzZTQSI7czo5OiJfcHJldmlvdXMiO2E6MTp7czozOiJ1cmwiO3M6MjE6Imh0dHA6Ly9sb2NhbGhvc3Q6ODAwMCI7fXM6NjoiX2ZsYXNoIjthOjI6e3M6Mzoib2xkIjthOjA6e31zOjM6Im5ldyI7YTowOnt9fX0=', 1763943237);

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

--
-- Dumping data for table `tblpurchaseoptions`
--

INSERT INTO `tblpurchaseoptions` (`nPurchaseOptionId`, `nTransactionItemId`, `nSupplierId`, `nQuantity`, `strUOM`, `strBrand`, `strModel`, `strSpecs`, `dUnitPrice`, `dEWT`, `strProductCode`, `bIncluded`, `dtCanvass`) VALUES
(2, 1, 3, 10, 'pcs', 'HP', 'EliteDesk 800', '<ol><li>Intel i7</li><li>16GB RAM</li><li>512GB SSD</li></ol>', 75500, 6741.07, NULL, 0, '2025-12-05 04:57:24'),
(3, 2, 2, 10, 'pcs', 'Logitech', 'MK120', '<p>Mechanical keyboard, wired optical mouses</p>', 1480, 132.14, NULL, 0, '2025-12-05 04:58:59'),
(4, 2, 3, 5, 'pcs', 'Microsoft', 'Wired Keyboard', '<ol><li>Mechanical keyboard</li><li>wired optical mouse</li></ol>', 50, 4.46, NULL, 1, '2025-12-05 05:02:05'),
(5, 3, 6, 5, 'pcs', 'APC', 'BX1000', '<ol><li>1000VA</li><li>230V</li><li>with surge protection</li></ol>', 150, 6.7, NULL, 1, '2025-12-05 05:05:07'),
(6, 3, 3, 3, 'pcs', 'CyberPower', 'CP1000', '<ol><li>1000VA</li><li>230V</li><li>with surge protection</li></ol>', 50, 1.34, NULL, 1, '2025-12-05 05:06:00'),
(7, 4, 2, 10, 'pcs', 'Seagate', 'Expansion 2TB', '<ol><li>Portable</li><li>USB 3.0</li></ol>', 150, 13.39, NULL, 0, '2025-12-05 05:07:05'),
(10, 1, 3, 23, '3', '23', '23', '<p>23</p>', 23, 4.72, NULL, 0, '2025-12-16 04:27:35'),
(11, 8, 2, 50, 'pcs', 'Pilot', 'G2', '<ol><li>Blue ink</li><li>0.5mm</li></ol>', 3, 1.34, NULL, 1, '2025-12-17 03:24:34'),
(12, 8, 3, 50, 'pcs', 'Faber', 'Castell', '<ol><li>Blue ink</li><li>0.5mm</li></ol>', 6, 2.68, NULL, 1, '2025-12-17 03:26:12'),
(13, 9, 4, 20, 'pcs', 'Moleskine', 'Classic', '<ol><li>200 pages</li><li>A4</li><li>hardcover</li></ol>', 5, 0, NULL, 1, '2025-12-17 03:29:24'),
(14, 9, 6, 50, 'pcs', 'Leuchtturm', '1971', '<ol><li>200 pages</li><li>A4</li><li>dotted</li></ol>', 6, 2.68, NULL, 0, '2025-12-17 03:30:21'),
(15, 10, 2, 40, 'pcs', 'Swingline', 'HeavyDuty', '<ol><li>Metal body</li><li>20-sheet capacity</li></ol>', 103, 36.79, NULL, 1, '2025-12-17 03:31:25'),
(16, 10, 3, 10, 'pcs', 'Bostitch', 'B8', '<ol><li>Metal body</li><li>25-sheet capacity</li></ol>', 89, 7.95, NULL, 1, '2025-12-17 03:32:24'),
(17, 8, 3, 100, 'pcs', 'HBW', 'B4', '<ol><li>Blue ink</li><li>0.5mm</li></ol>', 10, 8.93, NULL, 0, '2025-12-18 02:17:28');

-- --------------------------------------------------------

--
-- Table structure for table `tblsqlerrors`
--

CREATE TABLE `tblsqlerrors` (
  `nErrorId` bigint(20) UNSIGNED NOT NULL,
  `dtDate` datetime NOT NULL DEFAULT current_timestamp(),
  `strError` varchar(1000) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `tblsqlerrors`
--

INSERT INTO `tblsqlerrors` (`nErrorId`, `dtDate`, `strError`) VALUES
(34, '2025-11-11 08:52:00', 'Error fetching suppliers: SQLSTATE[42S22]: Column not found: 1054 Unknown column \'id\' in \'field list\' (Connection: mysql, SQL: select `id`, `strSupplierName` from `tblsuppliers`)'),
(35, '2025-11-11 08:52:25', 'Error fetching suppliers: SQLSTATE[42S22]: Column not found: 1054 Unknown column \'id\' in \'field list\' (Connection: mysql, SQL: select `id`, `strSupplierName` from `tblsuppliers`)'),
(36, '2025-11-12 01:54:43', 'Error creating purchase option: The supplier name field must be a string.'),
(37, '2025-11-12 01:54:51', 'Error creating purchase option: The supplier name field must be a string.'),
(38, '2025-11-12 01:57:16', 'Error creating purchase option: SQLSTATE[23000]: Integrity constraint violation: 1048 Column \'nSupplierId\' cannot be null (Connection: mysql, SQL: insert into `tblPurchaseOptions` (`nTransactionItemId`, `nSupplierId`, `nQuantity`, `strUOM`, `strBrand`, `strModel`, `strSpecs`, `dUnitPrice`, `dEWT`, `bIncluded`, `dtCanvass`) values (1, ?, 45, 45, 45, 45, 45, 45, 45, 1, 2025-11-12 01:57:16))'),
(39, '2025-11-12 01:58:47', 'Error creating purchase option: SQLSTATE[23000]: Integrity constraint violation: 1048 Column \'nSupplierId\' cannot be null (Connection: mysql, SQL: insert into `tblPurchaseOptions` (`nTransactionItemId`, `nSupplierId`, `nQuantity`, `strUOM`, `strBrand`, `strModel`, `strSpecs`, `dUnitPrice`, `dEWT`, `bIncluded`, `dtCanvass`) values (1, ?, 45, 45, 45, 45, 45, 45, 45, 1, 2025-11-12 01:58:47))'),
(40, '2025-11-12 02:23:23', 'Error creating purchase option: SQLSTATE[23000]: Integrity constraint violation: 1048 Column \'nSupplierId\' cannot be null (Connection: mysql, SQL: insert into `tblPurchaseOptions` (`nTransactionItemId`, `nSupplierId`, `nQuantity`, `strUOM`, `strBrand`, `strModel`, `strSpecs`, `dUnitPrice`, `dEWT`, `bIncluded`, `dtCanvass`) values (1, ?, 12, 121, 21, 21, 12, 12, 12, 1, 2025-11-12 02:23:23))'),
(41, '2025-11-12 02:23:58', 'Error creating purchase option: SQLSTATE[23000]: Integrity constraint violation: 1048 Column \'nSupplierId\' cannot be null (Connection: mysql, SQL: insert into `tblPurchaseOptions` (`nTransactionItemId`, `nSupplierId`, `nQuantity`, `strUOM`, `strBrand`, `strModel`, `strSpecs`, `dUnitPrice`, `dEWT`, `bIncluded`, `dtCanvass`) values (1, ?, 12, 121, 21, 21, 12, 12, 12, 1, 2025-11-12 02:23:58))'),
(42, '2025-11-12 02:24:13', 'Error creating purchase option: SQLSTATE[23000]: Integrity constraint violation: 1048 Column \'nSupplierId\' cannot be null (Connection: mysql, SQL: insert into `tblPurchaseOptions` (`nTransactionItemId`, `nSupplierId`, `nQuantity`, `strUOM`, `strBrand`, `strModel`, `strSpecs`, `dUnitPrice`, `dEWT`, `bIncluded`, `dtCanvass`) values (1, ?, 12, 121, 21, 21, 12, 12, 12, 1, 2025-11-12 02:24:13))'),
(43, '2025-11-12 02:24:46', 'Error creating purchase option: SQLSTATE[23000]: Integrity constraint violation: 1048 Column \'nSupplierId\' cannot be null (Connection: mysql, SQL: insert into `tblPurchaseOptions` (`nTransactionItemId`, `nSupplierId`, `nQuantity`, `strUOM`, `strBrand`, `strModel`, `strSpecs`, `dUnitPrice`, `dEWT`, `bIncluded`, `dtCanvass`) values (1, ?, 12, 121, 21, 21, 12, 12, 12, 1, 2025-11-12 02:24:46))'),
(44, '2025-11-12 02:25:58', 'Error creating purchase option: SQLSTATE[23000]: Integrity constraint violation: 1048 Column \'nSupplierId\' cannot be null (Connection: mysql, SQL: insert into `tblPurchaseOptions` (`nTransactionItemId`, `nSupplierId`, `nQuantity`, `strUOM`, `strBrand`, `strModel`, `strSpecs`, `dUnitPrice`, `dEWT`, `bIncluded`, `dtCanvass`) values (1, ?, 12, 121, 21, 21, 12, 12, 12, 1, 2025-11-12 02:25:58))'),
(45, '2025-11-12 02:26:07', 'Error creating purchase option: SQLSTATE[23000]: Integrity constraint violation: 1048 Column \'nSupplierId\' cannot be null (Connection: mysql, SQL: insert into `tblPurchaseOptions` (`nTransactionItemId`, `nSupplierId`, `nQuantity`, `strUOM`, `strBrand`, `strModel`, `strSpecs`, `dUnitPrice`, `dEWT`, `bIncluded`, `dtCanvass`) values (1, ?, 12, 121, 21, 21, 12, 12, 12, 1, 2025-11-12 02:26:07))'),
(46, '2025-11-12 02:28:29', 'Error creating purchase option: Undefined array key \"nSupplierId\"'),
(47, '2025-11-12 02:28:50', 'Error creating purchase option: SQLSTATE[23000]: Integrity constraint violation: 1048 Column \'nSupplierId\' cannot be null (Connection: mysql, SQL: insert into `tblPurchaseOptions` (`nTransactionItemId`, `nSupplierId`, `nQuantity`, `strUOM`, `strBrand`, `strModel`, `strSpecs`, `dUnitPrice`, `dEWT`, `bIncluded`, `dtCanvass`) values (1, ?, 12, 121, 21, 21, 12, 12, 12, 1, 2025-11-12 02:28:50))'),
(48, '2025-11-12 05:26:54', 'Error creating transaction item: SQLSTATE[HY000]: General error: 1364 Field \'nItemNumber\' doesn\'t have a default value (Connection: mysql, SQL: insert into `tbltransactionitems` (`nTransactionId`, `strName`, `strSpecs`, `nQuantity`, `strUOM`, `dUnitABC`) values (1, fdfggfdsfgfd, fdfdfd, 34, df, 34))'),
(49, '2025-11-20 08:00:00', 'Error updating User ID 28: The c sex field is required.'),
(50, '2025-11-20 11:09:13', 'Error updating User ID 28: The c sex field is required.'),
(51, '2025-11-20 11:09:34', 'Error updating User ID 28: The c sex field is required.'),
(52, '2025-11-20 11:12:57', 'Error updating User ID 28: The c sex field is required. (and 1 more error)'),
(53, '2025-11-20 11:14:01', 'Error updating User ID 28: The c sex field is required.'),
(54, '2025-11-24 01:49:47', 'Error creating supplier: Attempt to read property \"cUserType\" on null'),
(55, '2025-11-24 01:49:57', 'Error creating supplier: Attempt to read property \"cUserType\" on null'),
(56, '2025-11-24 01:54:23', 'Error creating supplier: The user type field is required.'),
(57, '2025-11-24 02:00:46', 'Error creating supplier: Attempt to read property \"type\" on null'),
(58, '2025-11-24 02:01:02', 'Error creating supplier: Attempt to read property \"type\" on null'),
(59, '2025-11-24 02:03:10', 'Error creating supplier: Attempt to read property \"cUserType\" on null'),
(60, '2025-11-24 03:00:19', 'Error creating purchase option: SQLSTATE[23000]: Integrity constraint violation: 1048 Column \'nSupplierId\' cannot be null (Connection: mysql, SQL: insert into `tblPurchaseOptions` (`nTransactionItemId`, `nSupplierId`, `nQuantity`, `strUOM`, `strBrand`, `strModel`, `strSpecs`, `dUnitPrice`, `dEWT`, `bIncluded`, `dtCanvass`) values (1, ?, 45, pcs, w, w, w, 10, 0, 0, 2025-11-24 03:00:18))'),
(61, '2025-11-24 03:00:23', 'Error creating purchase option: SQLSTATE[23000]: Integrity constraint violation: 1048 Column \'nSupplierId\' cannot be null (Connection: mysql, SQL: insert into `tblPurchaseOptions` (`nTransactionItemId`, `nSupplierId`, `nQuantity`, `strUOM`, `strBrand`, `strModel`, `strSpecs`, `dUnitPrice`, `dEWT`, `bIncluded`, `dtCanvass`) values (1, ?, 45, pcs, w, w, w, 10, 0, 0, 2025-11-24 03:00:23))'),
(62, '2025-11-24 03:00:24', 'Error creating purchase option: SQLSTATE[23000]: Integrity constraint violation: 1048 Column \'nSupplierId\' cannot be null (Connection: mysql, SQL: insert into `tblPurchaseOptions` (`nTransactionItemId`, `nSupplierId`, `nQuantity`, `strUOM`, `strBrand`, `strModel`, `strSpecs`, `dUnitPrice`, `dEWT`, `bIncluded`, `dtCanvass`) values (1, ?, 45, pcs, w, w, w, 10, 0, 0, 2025-11-24 03:00:24))'),
(63, '2025-11-24 12:20:36', 'Error creating purchase option: The uom field is required.'),
(64, '2025-11-24 12:27:48', 'Error updating purchase option: SQLSTATE[22001]: String data, right truncated: 1406 Data too long for column \'strSpecs\' at row 1 (Connection: mysql, SQL: update `tblPurchaseOptions` set `strSpecs` = Procurement of High-Performance Workstations, Networking Equipment, and Software Licenses for the City Health Department’s Digital Transformation and Remote PatientProcurement of High-Performance Workstations, Networking Equipment, and Software Licenses for the City Health Department’s Digital Transformation and Remote Patient Monitoring Program FY 2025-2026Procurement of High-Performance Workstations, Networking Equipment, and Software Licenses for the City Health Department’s Digital Transformation and Remote Patient Monitoring Program FY 2025-2026 Monitoring Program FY 2025-2026 where `nPurchaseOptionId` = 5)'),
(65, '2025-11-24 12:27:56', 'Error updating purchase option: SQLSTATE[22001]: String data, right truncated: 1406 Data too long for column \'strSpecs\' at row 1 (Connection: mysql, SQL: update `tblPurchaseOptions` set `strSpecs` = Procurement of High-Performance Workstations, Networking Equipment, and Software Licenses for the City Health Department’s Digital Transformation and Remote PatientProcurement of High-Performance Workstations, Networking Equipment, and Software Licenses for the City Health Department’s Digital Transformation and Remote Patient Monitoring Program FY 2025-2026Procurement of High-Performance Workstations, Networking Equipment, and Software Licenses for the City Health Department’s Digital Transformation and Remote Patient Monitoring Program FY 2025-2026 Monitoring Program FY 2025-2026 where `nPurchaseOptionId` = 5)'),
(66, '2025-11-24 12:29:05', 'Error updating purchase option: SQLSTATE[22001]: String data, right truncated: 1406 Data too long for column \'strSpecs\' at row 1 (Connection: mysql, SQL: update `tblPurchaseOptions` set `strSpecs` = Procurement of High-Performance Workstations, Networking Equipment, and Software Licenses for the City Health Department’s Digital Transformation and Remote PatientProcurement of High-Performance Workstations, Networking Equipment, and Software Licenses for the City Health Department’s Digital Transformation and Remote Patient Monitoring Program FY 2025-2026Procurement of High-Performance Workstations, Networking Equipment, and Software Licenses for the City Health Department’s Digital Transformation and Remote Patient Monitoring Program FY 2025-2026 Monitoring Program FY 2025-2026 where `nPurchaseOptionId` = 5)'),
(67, '2025-11-24 12:29:10', 'Error updating purchase option: SQLSTATE[22001]: String data, right truncated: 1406 Data too long for column \'strSpecs\' at row 1 (Connection: mysql, SQL: update `tblPurchaseOptions` set `strSpecs` = Procurement of High-Performance Workstations, Networking Equipment, and Software Licenses for the City Health Department’s Digital Transformation and Remote PatientProcurement of High-Performance Workstations, Networking Equipment, and Software where `nPurchaseOptionId` = 5)'),
(68, '2025-11-24 12:29:29', 'Error updating purchase option: SQLSTATE[22001]: String data, right truncated: 1406 Data too long for column \'strSpecs\' at row 1 (Connection: mysql, SQL: update `tblPurchaseOptions` set `strSpecs` = Procurement of High-Performance Workstations, Networking Equipment, and Software Licenses for the City Health Department’s Digital Transformation and Remote PatientProcurement of High-Performance Workstations, Networking Equipment, and Software where `nPurchaseOptionId` = 5)'),
(69, '2025-11-24 12:30:47', 'Error updating purchase option: SQLSTATE[22001]: String data, right truncated: 1406 Data too long for column \'strSpecs\' at row 1 (Connection: mysql, SQL: update `tblPurchaseOptions` set `strSpecs` = Procurement of High-Performance Workstations, Networking Equipment, and Software Licenses for the City Health Department’s Digital Transformation and Remote PatientProcurement of High-Performance Workstations, Networking Equipment, and Software where `nPurchaseOptionId` = 5)'),
(70, '2025-11-24 12:31:24', 'Error updating purchase option: SQLSTATE[22001]: String data, right truncated: 1406 Data too long for column \'strSpecs\' at row 1 (Connection: mysql, SQL: update `tblPurchaseOptions` set `strSpecs` = Procurement of High-Performance Workstations, Networking Equipment, and Software Licenses for the City Health Department’s Digital Transformation and Remote PatientProcurement of High-Performance Workstations, Networking Equipment, and Software where `nPurchaseOptionId` = 5)'),
(71, '2025-11-26 07:09:24', 'Error creating purchase option: The uom field is required.'),
(72, '2025-11-26 07:09:36', 'Error creating purchase option: The uom field is required.'),
(73, '2025-11-26 07:09:46', 'Error creating purchase option: The uom field is required.'),
(74, '2025-11-26 07:10:10', 'Error creating purchase option: The uom field is required.'),
(75, '2025-11-26 07:10:15', 'Error creating purchase option: The uom field is required.'),
(76, '2025-11-28 02:44:13', 'Error updating status for Client ID 11: The c status field is required.'),
(77, '2025-11-28 02:44:37', 'Error updating status for Client ID 1: The c status field is required.'),
(78, '2025-11-28 04:30:20', 'Error creating client: The c status field is required.'),
(79, '2025-11-28 04:43:25', 'Error creating client: The c status field is required.'),
(80, '2025-11-28 04:43:41', 'Error creating client: The c status field is required.'),
(81, '2025-11-28 15:40:10', 'Error creating user: SQLSTATE[HY000]: General error: 1364 Field \'cStatus\' doesn\'t have a default value (Connection: mysql, SQL: insert into `tblusers` (`strFName`, `strMName`, `strLName`, `strNickName`, `cUserType`, `cSex`) values (ee, ?, e, ee, A, M))'),
(82, '2025-11-28 16:09:39', 'Error updating status for Supplier ID 2: The status code field is required.'),
(83, '2025-11-28 16:09:54', 'Error updating status for Supplier ID 1: The status code field is required.'),
(84, '2025-12-02 08:44:11', 'Error deleting purchase option: No query results for model [App\\Models\\PurchaseOptions] 1'),
(85, '2025-12-02 08:44:18', 'Error deleting purchase option: No query results for model [App\\Models\\PurchaseOptions] 1'),
(86, '2025-12-02 08:44:44', 'Error deleting purchase option: No query results for model [App\\Models\\PurchaseOptions] 1'),
(87, '2025-12-03 01:25:40', 'Error updating purchase option: The quantity field must be at least 1.'),
(88, '2025-12-04 03:20:31', 'Error updating purchase option: No query results for model [App\\Models\\PurchaseOptions] undefined'),
(89, '2025-12-04 03:20:38', 'Error updating purchase option: No query results for model [App\\Models\\PurchaseOptions] undefined'),
(90, '2025-12-04 03:20:59', 'Error updating purchase option: No query results for model [App\\Models\\PurchaseOptions] undefined'),
(91, '2025-12-04 03:22:10', 'Error updating purchase option: No query results for model [App\\Models\\PurchaseOptions] undefined'),
(92, '2025-12-04 03:22:21', 'Error updating purchase option: No query results for model [App\\Models\\PurchaseOptions] undefined'),
(93, '2025-12-04 03:23:10', 'Error updating purchase option: No query results for model [App\\Models\\PurchaseOptions] undefined'),
(94, '2025-12-04 03:25:16', 'Error updating purchase option: No query results for model [App\\Models\\PurchaseOptions] undefined'),
(95, '2025-12-04 14:52:15', 'Error creating client: The c status field is required.'),
(96, '2025-12-04 14:52:32', 'Error creating client: The c status field is required.'),
(97, '2025-12-05 05:58:34', 'Error updating purchase option: No query results for model [App\\Models\\PurchaseOptions] undefined'),
(98, '2025-12-08 02:35:38', 'Error updating transaction (ID: 3): Pusher error: auth_key should be a valid app key\n.'),
(99, '2025-12-08 02:36:14', 'Error updating transaction (ID: 3): Pusher error: auth_key should be a valid app key\n.'),
(100, '2025-12-08 02:37:10', 'Error updating transaction (ID: 3): Pusher error: auth_key should be a valid app key\n.'),
(101, '2025-12-08 02:41:16', 'Error updating transaction (ID: 3): Pusher error: auth_key should be a valid app key\n.'),
(102, '2025-12-08 02:43:20', 'Error updating transaction (ID: 3): Pusher error: auth_key should be a valid app key\n.'),
(103, '2025-12-08 02:48:27', 'Error updating transaction (ID: 3): Pusher error: auth_key should be a valid app key\n.'),
(104, '2025-12-08 02:49:28', 'Error updating transaction (ID: 3): Pusher error: auth_key should be a valid app key\n.'),
(105, '2025-12-08 02:51:57', 'Error updating transaction (ID: 3): Pusher error: auth_key should be a valid app key\n.'),
(106, '2025-12-17 07:03:20', 'Error updating purchase option specs: No query results for model [App\\Models\\PurchaseOptions] undefined'),
(107, '2025-12-17 07:03:48', 'Error updating purchase option specs: No query results for model [App\\Models\\PurchaseOptions] undefined'),
(108, '2025-12-17 07:05:24', 'Error updating purchase option specs: No query results for model [App\\Models\\PurchaseOptions] undefined'),
(109, '2025-12-17 07:07:08', 'Error updating purchase option specs: No query results for model [App\\Models\\PurchaseOptions] undefined'),
(110, '2025-12-17 07:12:38', 'Error updating purchase option specs: No query results for model [App\\Models\\PurchaseOptions] undefined'),
(111, '2025-12-17 07:13:19', 'Error updating purchase option specs: No query results for model [App\\Models\\PurchaseOptions] undefined'),
(112, '2025-12-17 07:20:38', 'Error updating purchase option specs: No query results for model [App\\Models\\PurchaseOptions] undefined'),
(113, '2025-12-17 07:21:21', 'Error updating purchase option specs: No query results for model [App\\Models\\PurchaseOptions] undefined'),
(114, '2025-12-17 07:21:22', 'Error updating purchase option specs: No query results for model [App\\Models\\PurchaseOptions] undefined'),
(115, '2025-12-17 07:21:22', 'Error updating purchase option specs: No query results for model [App\\Models\\PurchaseOptions] undefined'),
(116, '2025-12-17 07:21:32', 'Error updating purchase option specs: No query results for model [App\\Models\\PurchaseOptions] undefined'),
(117, '2025-12-17 07:27:48', 'Error updating purchase option specs: No query results for model [App\\Models\\PurchaseOptions] undefined'),
(118, '2025-12-17 07:29:38', 'Error updating purchase option specs: No query results for model [App\\Models\\PurchaseOptions] undefined'),
(119, '2025-12-17 07:33:54', 'Error updating purchase option specs: No query results for model [App\\Models\\PurchaseOptions] undefined');

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

--
-- Dumping data for table `tblsupplierbanks`
--

INSERT INTO `tblsupplierbanks` (`nSupplierBankId`, `nSupplierId`, `strBankName`, `strAccountName`, `strAccountNumber`) VALUES
(3, 1, 'sdfg', 'sd', '090909090909'),
(5, 3, 'er', 'er', '090909090909');

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

--
-- Dumping data for table `tblsuppliercontacts`
--

INSERT INTO `tblsuppliercontacts` (`nSupplierContactId`, `nSupplierId`, `strName`, `strNumber`, `strPosition`, `strDepartment`) VALUES
(5, 1, 'aasas', '09090909090', 'uu', 'as');

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

--
-- Dumping data for table `tblsuppliers`
--

INSERT INTO `tblsuppliers` (`nSupplierId`, `strSupplierName`, `strSupplierNickName`, `strAddress`, `strTIN`, `bVAT`, `bEWT`, `cStatus`) VALUES
(1, 'Alpha Trading Corpr', 'Alphaj', 'Quezon City', '123 456 789 000', 1, 0, 'A'),
(2, 'Beta Supplies Inc.', 'Beta', 'Makati City', '234-567-890-111', 1, 1, 'A'),
(3, 'Gamma Industrial Co.', 'Gamma', 'Pasig City', '345-678-901-222', 1, 1, 'A'),
(4, 'Delta Merchants', 'Delta', 'Caloocan City', '456-789-012-333', 0, 0, 'A'),
(5, 'Epsilon Logistics', 'Epsilon', 'Taguig City', '567-890-123-444', 1, 0, 'A'),
(6, 'Zeta Packaging Solutions', 'Zeta', 'Mandaluyong City', '678-901-234-555', 1, 1, 'A'),
(26, 'sd', 'sd', NULL, NULL, 0, 0, 'A');

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

--
-- Dumping data for table `tbltransactionhistories`
--

INSERT INTO `tbltransactionhistories` (`nTransactionHistoryId`, `nTransactionId`, `dtOccur`, `nStatus`, `nUserId`, `strRemarks`) VALUES
(1, 1, '2025-12-05 02:02:03', 100, 29, NULL),
(2, 1, '2025-12-05 02:36:19', 110, 29, 'sample'),
(3, 1, '2025-12-05 02:37:05', 200, 30, 'sample1'),
(4, 1, '2025-12-05 03:01:06', 110, 29, NULL),
(5, 1, '2025-12-05 03:01:45', 200, 30, NULL),
(6, 1, '2025-12-05 03:02:06', 110, 29, NULL),
(7, 1, '2025-12-05 03:02:21', 200, 30, NULL),
(8, 1, '2025-12-05 03:02:51', 110, 29, NULL),
(9, 1, '2025-12-05 03:04:48', 100, 29, NULL),
(10, 1, '2025-12-05 03:04:56', 110, 29, NULL),
(11, 1, '2025-12-05 03:05:16', 200, 30, NULL),
(12, 1, '2025-12-05 03:52:48', 210, 30, 'Assigned Account Officer'),
(13, 1, '2025-12-05 04:41:53', 220, 33, NULL),
(14, 1, '2025-12-05 04:43:34', 230, 32, NULL),
(15, 1, '2025-12-05 14:16:36', 240, 33, NULL),
(16, 1, '2025-12-05 14:31:09', 230, 32, NULL),
(17, 1, '2025-12-05 14:42:31', 240, 33, NULL),
(18, 1, '2025-12-05 15:44:20', 230, 32, NULL),
(19, 1, '2025-12-06 02:50:16', 240, 33, NULL),
(20, 1, '2025-12-06 03:05:24', 230, 32, NULL),
(21, 1, '2025-12-06 03:09:59', 240, 33, NULL),
(22, 1, '2025-12-06 06:20:42', 230, 32, NULL),
(23, 1, '2025-12-06 06:21:10', 220, 33, NULL),
(24, 1, '2025-12-06 06:21:18', 210, 30, NULL),
(25, 1, '2025-12-06 06:31:57', 220, 33, NULL),
(26, 1, '2025-12-06 06:33:00', 230, 32, NULL),
(27, 2, '2025-12-06 06:45:52', 100, 29, NULL),
(28, 2, '2025-12-06 06:47:21', 110, 29, NULL),
(29, 2, '2025-12-06 06:47:36', 200, 30, NULL),
(30, 1, '2025-12-06 06:52:43', 240, 33, NULL),
(31, 1, '2025-12-06 06:58:47', 230, 32, 'may ausin lang po ako'),
(32, 1, '2025-12-06 07:06:59', 240, 33, NULL),
(33, 1, '2025-12-07 10:54:20', 230, 32, NULL),
(34, 1, '2025-12-07 14:56:06', 240, 33, NULL),
(35, 3, '2025-12-08 01:07:35', 100, 29, NULL),
(36, 1, '2025-12-08 03:16:47', 230, 32, NULL),
(37, 1, '2025-12-09 11:08:24', 220, 33, NULL),
(38, 1, '2025-12-09 11:08:32', 210, 30, NULL),
(39, 2, '2025-12-10 05:20:55', 210, 30, 'Assigned Account Officer'),
(40, 1, '2025-12-11 07:14:21', 220, 33, NULL),
(41, 1, '2025-12-11 08:03:03', 210, 30, NULL),
(42, 1, '2025-12-11 08:16:36', 220, 33, NULL),
(43, 1, '2025-12-11 08:20:13', 210, 30, NULL),
(44, 1, '2025-12-11 08:27:54', 220, 33, NULL),
(45, 1, '2025-12-11 08:29:25', 230, 32, NULL),
(46, 1, '2025-12-12 00:32:04', 220, 33, NULL),
(47, 1, '2025-12-12 00:33:00', 210, 30, NULL),
(48, 1, '2025-12-12 00:58:47', 220, 33, NULL),
(49, 1, '2025-12-12 01:23:40', 230, 30, NULL),
(50, 2, '2025-12-12 01:39:44', 220, 33, NULL),
(51, 2, '2025-12-12 01:55:26', 210, 30, NULL),
(52, 1, '2025-12-12 02:10:20', 220, 33, NULL),
(53, 1, '2025-12-12 02:10:37', 210, 30, NULL),
(54, 1, '2025-12-12 02:16:11', 220, 33, NULL),
(55, 1, '2025-12-12 02:26:29', 230, 30, NULL),
(56, 1, '2025-12-14 02:27:53', 240, 33, NULL),
(57, 1, '2025-12-14 02:37:39', 230, 30, NULL),
(58, 1, '2025-12-14 03:33:09', 240, 33, NULL),
(59, 1, '2025-12-14 03:33:53', 230, 30, NULL),
(60, 1, '2025-12-14 06:00:48', 240, 33, NULL),
(61, 1, '2025-12-14 06:06:28', 230, 32, NULL),
(62, 1, '2025-12-14 06:08:26', 240, 33, NULL),
(63, 1, '2025-12-14 06:08:54', 300, 30, NULL),
(64, 1, '2025-12-14 06:16:43', 240, 33, NULL),
(65, 1, '2025-12-14 06:17:24', 230, 32, NULL),
(66, 1, '2025-12-14 06:20:36', 240, 33, NULL),
(67, 1, '2025-12-14 06:20:56', 230, 32, NULL),
(68, 2, '2025-12-14 06:26:53', 220, 33, NULL),
(69, 2, '2025-12-14 06:27:25', 230, 32, NULL),
(70, 2, '2025-12-14 06:27:55', 240, 33, NULL),
(71, 2, '2025-12-14 06:29:07', 230, 32, NULL),
(72, 1, '2025-12-14 06:36:18', 240, 33, NULL),
(73, 1, '2025-12-14 06:36:38', 300, 32, NULL),
(74, 1, '2025-12-14 06:42:54', 240, 33, NULL),
(75, 2, '2025-12-14 06:43:06', 220, 33, NULL),
(76, 1, '2025-12-14 06:43:28', 230, 32, NULL),
(77, 2, '2025-12-16 02:33:34', 210, 30, NULL),
(78, 2, '2025-12-16 02:36:42', 220, 33, NULL),
(79, 2, '2025-12-16 02:37:17', 210, 30, NULL),
(80, 1, '2025-12-16 02:47:33', 240, 33, NULL),
(81, 1, '2025-12-16 02:50:37', 230, 32, NULL),
(82, 1, '2025-12-16 03:27:29', 220, 33, NULL),
(83, 1, '2025-12-16 03:27:38', 210, 30, NULL),
(84, 1, '2025-12-16 03:38:51', 220, 33, NULL),
(85, 1, '2025-12-16 03:39:31', 300, 32, NULL),
(86, 1, '2025-12-16 03:43:34', 240, 33, NULL),
(87, 1, '2025-12-16 03:43:54', 230, 32, NULL),
(88, 1, '2025-12-16 03:45:00', 220, 33, NULL),
(89, 1, '2025-12-16 03:45:07', 210, 30, NULL),
(90, 1, '2025-12-16 03:45:44', 220, 33, NULL),
(91, 1, '2025-12-16 03:46:58', 300, 32, NULL),
(92, 1, '2025-12-16 03:50:33', 240, 33, NULL),
(93, 1, '2025-12-16 03:50:42', 230, 32, NULL),
(94, 1, '2025-12-16 03:50:49', 220, 33, NULL),
(95, 1, '2025-12-16 03:51:17', 230, 32, NULL),
(96, 1, '2025-12-16 03:51:34', 240, 33, NULL),
(97, 1, '2025-12-16 03:51:50', 230, 32, NULL),
(98, 1, '2025-12-16 03:54:51', 220, 33, NULL),
(99, 1, '2025-12-16 03:56:13', 300, 32, NULL),
(100, 1, '2025-12-16 03:57:39', 240, 33, NULL),
(101, 1, '2025-12-16 03:57:46', 230, 32, NULL),
(102, 1, '2025-12-16 03:57:53', 220, 33, NULL),
(103, 1, '2025-12-16 03:57:59', 210, 30, NULL),
(104, 1, '2025-12-16 03:58:19', 220, 33, NULL),
(105, 1, '2025-12-16 03:58:47', 230, 32, NULL),
(106, 1, '2025-12-16 03:58:59', 240, 33, NULL),
(107, 1, '2025-12-16 03:59:15', 230, 32, NULL),
(108, 1, '2025-12-16 04:01:00', 240, 33, NULL),
(109, 1, '2025-12-16 04:01:33', 230, 32, NULL),
(110, 1, '2025-12-16 04:01:42', 220, 33, NULL),
(111, 1, '2025-12-16 04:01:51', 210, 30, NULL),
(112, 1, '2025-12-16 04:02:04', 220, 33, NULL),
(113, 1, '2025-12-16 04:02:17', 300, 32, NULL),
(114, 1, '2025-12-16 04:07:43', 240, 33, NULL),
(115, 1, '2025-12-16 04:08:19', 230, 32, NULL),
(116, 1, '2025-12-16 04:08:40', 220, 33, NULL),
(117, 1, '2025-12-16 04:10:16', 230, 32, NULL),
(118, 1, '2025-12-16 04:10:50', 240, 33, NULL),
(119, 1, '2025-12-16 04:11:13', 230, 32, NULL),
(120, 1, '2025-12-16 04:14:20', 240, 33, NULL),
(121, 1, '2025-12-16 04:14:38', 300, 32, NULL),
(122, 2, '2025-12-16 04:15:05', 220, 33, NULL),
(123, 2, '2025-12-16 04:15:28', 230, 32, NULL),
(124, 2, '2025-12-16 04:16:01', 240, 33, NULL),
(125, 2, '2025-12-16 04:16:23', 300, 32, NULL),
(126, 1, '2025-12-16 04:22:38', 240, 33, NULL),
(127, 2, '2025-12-16 04:22:46', 240, 33, NULL),
(128, 1, '2025-12-16 04:22:53', 230, 32, NULL),
(129, 2, '2025-12-16 04:23:09', 230, 32, NULL),
(130, 1, '2025-12-16 06:55:50', 220, 33, NULL),
(131, 1, '2025-12-16 06:56:02', 210, 30, NULL),
(132, 1, '2025-12-16 06:56:28', 220, 33, NULL),
(133, 1, '2025-12-16 06:58:35', 230, 30, NULL),
(134, 1, '2025-12-16 07:07:16', 220, 33, NULL),
(135, 1, '2025-12-16 07:07:29', 210, 30, NULL),
(136, 2, '2025-12-16 07:08:22', 220, 33, NULL),
(137, 2, '2025-12-16 07:08:29', 210, 30, NULL),
(138, 1, '2025-12-16 07:39:13', 220, 33, NULL),
(139, 1, '2025-12-17 00:21:33', 210, 30, NULL),
(140, 1, '2025-12-17 00:26:39', 220, 33, NULL),
(141, 1, '2025-12-17 00:29:16', 230, 32, NULL),
(142, 4, '2025-12-17 02:55:03', 100, 29, NULL),
(143, 4, '2025-12-17 02:55:18', 110, 29, NULL),
(144, 4, '2025-12-17 02:56:07', 200, 30, NULL),
(145, 4, '2025-12-17 02:57:00', 210, 30, 'Assigned Account Officer'),
(146, 4, '2025-12-17 03:20:24', 220, 32, NULL),
(147, 4, '2025-12-17 03:21:01', 230, 33, NULL),
(148, 1, '2025-12-17 04:04:43', 220, 33, NULL),
(149, 1, '2025-12-17 04:04:54', 210, 30, NULL),
(150, 1, '2025-12-18 00:35:59', 220, 33, NULL),
(151, 1, '2025-12-18 00:36:22', 230, 32, NULL),
(152, 4, '2025-12-18 02:09:08', 220, 32, NULL),
(153, 4, '2025-12-18 02:09:25', 210, 30, NULL),
(154, 4, '2025-12-18 02:16:20', 220, 32, NULL),
(155, 4, '2025-12-18 02:16:46', 230, 33, NULL);

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

--
-- Dumping data for table `tbltransactionitems`
--

INSERT INTO `tbltransactionitems` (`nTransactionItemId`, `nTransactionId`, `nItemNumber`, `nQuantity`, `strUOM`, `strName`, `strSpecs`, `dUnitABC`) VALUES
(1, 1, 1, 10, 'pcs', 'Desktop Computer', '<ol><li><strong>Intel i7</strong></li><li><strong>16GB RAM</strong></li><li><strong>512GB SSD</strong></li><li><strong>24\" Monitor</strong></li></ol>', 75000),
(2, 1, 4, 10, 'pcs', 'Keyboard & Mouse Set', '<ol><li><span style=\"background-color: rgb(153, 51, 255);\">M</span><span style=\"background-color: rgb(255, 255, 0);\">echanical keyboard,</span></li><li><span style=\"background-color: rgb(255, 255, 0);\">wired optical mouse</span></li><li><span style=\"background-color: rgb(255, 255, 0);\">USB connectivity</span></li></ol>', 1500),
(3, 1, 3, 10, 'pcs', 'UPS (Uninterruptible Power Supply)', '<ol><li>1000VA</li><li>230V</li><li>with surge protection</li></ol>', 4500),
(4, 1, 2, 10, 'pcs', 'External Hard Drive', '<ol><li>2TB</li><li><span style=\"background-color: rgb(255, 255, 0);\">USB 3.0</span></li><li><span style=\"background-color: rgb(255, 255, 0);\">Portable</span></li></ol>', 3200),
(5, 1, 5, 10, 'pcs', 'Monitor Stand', '<ol><li><strong>Adjustable height</strong></li><li><strong>tilt and swivel</strong></li><li><strong>24-27 inches</strong></li></ol>', 1800),
(8, 4, 1, 100, 'pcs', 'Ballpoint Pens', '<ol><li>Blue inkk</li><li>0.5mm</li><li>pack of 10</li></ol>', 5000),
(9, 4, 2, 50, 'pcs', 'Notebooks', '<ol><li>200 pages</li><li>A4 size</li></ol>', 5000),
(10, 4, 3, 50, 'pcs', 'Staplers', '<ol><li>Heavy dut</li><li>Metal body</li></ol>', 5000);

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

--
-- Dumping data for table `tbltransactions`
--

INSERT INTO `tbltransactions` (`nTransactionId`, `nCompanyId`, `nClientId`, `nAssignedAO`, `dtAODueDate`, `strTitle`, `strRefNumber`, `dTotalABC`, `cProcMode`, `cItemType`, `strCode`, `cProcSource`, `dtPreBid`, `strPreBid_Venue`, `dtDocIssuance`, `strDocIssuance_Venue`, `dtDocSubmission`, `strDocSubmission_Venue`, `dtDocOpening`, `strDocOpening_Venue`, `nDeliveryDays`, `strDeliveryPlace`) VALUES
(1, 2, 2, 33, '2025-12-12 11:52:00', 'Procurement of Desktop Computers for ICT Enhancement Program', 'REFNO-25-0001', 1850000, 'B', 'G', 'TRANSAC-25-00001', 'P', '2025-12-10 10:00:00', 'PGOM', '2025-12-12 10:01:00', 'PGOM', '2025-12-14 10:01:00', 'PGOM', '2025-12-16 10:01:00', 'PGOM', NULL, NULL),
(4, 1, 1, 32, '2025-12-20 10:54:00', 'Office Stationery Purchase', 'REF-20260101', 15000, 'R', 'G', 'ST2025-001', 'O', '2025-12-17 10:54:00', 'Main Hall', '2025-12-18 10:54:00', 'Office Lobby', '2025-12-20 10:54:00', 'Warehouse 1', '2025-12-30 10:54:00', 'Main Hall', NULL, NULL);

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
  `cStatus` char(1) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `tblusers`
--

INSERT INTO `tblusers` (`nUserId`, `strFName`, `strMName`, `strLName`, `strNickName`, `cUserType`, `strProfileImage`, `cSex`, `cStatus`) VALUES
(28, 'Mariel Juneese', NULL, 'Matibag', 'Mariel', 'P', NULL, 'F', 'A'),
(29, 'Caren', NULL, 'See', 'Caren', 'P', NULL, 'F', 'A'),
(30, 'Hilda', 'Medina', 'Arago', 'Hildz', 'G', NULL, 'F', 'A'),
(31, 'AccountOfficer1', NULL, '1', 'AO1', 'A', NULL, 'M', 'I'),
(32, 'Jo', NULL, 'Luistro', 'Jo', 'A', NULL, 'F', 'A'),
(33, 'RJ', 'Martinez', 'Maullion', 'RJ', 'A', NULL, 'M', 'A'),
(38, 'sd', 'dd', 'd', 'd', 'A', NULL, 'M', 'I'),
(39, 'a', 'a', 'a', 'a', 'A', NULL, 'M', 'I');

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
  MODIFY `nPurchaseOptionId` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=18;

--
-- AUTO_INCREMENT for table `tblsqlerrors`
--
ALTER TABLE `tblsqlerrors`
  MODIFY `nErrorId` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=120;

--
-- AUTO_INCREMENT for table `tblsupplierbanks`
--
ALTER TABLE `tblsupplierbanks`
  MODIFY `nSupplierBankId` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `tblsuppliercontacts`
--
ALTER TABLE `tblsuppliercontacts`
  MODIFY `nSupplierContactId` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `tblsuppliers`
--
ALTER TABLE `tblsuppliers`
  MODIFY `nSupplierId` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=27;

--
-- AUTO_INCREMENT for table `tbltransactionhistories`
--
ALTER TABLE `tbltransactionhistories`
  MODIFY `nTransactionHistoryId` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=156;

--
-- AUTO_INCREMENT for table `tbltransactionitems`
--
ALTER TABLE `tbltransactionitems`
  MODIFY `nTransactionItemId` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT for table `tbltransactions`
--
ALTER TABLE `tbltransactions`
  MODIFY `nTransactionId` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `tblusers`
--
ALTER TABLE `tblusers`
  MODIFY `nUserId` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=40;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
