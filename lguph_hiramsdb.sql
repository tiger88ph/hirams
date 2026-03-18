-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Mar 18, 2026 at 06:52 AM
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
-- Database: `lguph_hiramsdb`
--

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
(1, 'default', '{\"uuid\":\"8f7f7dfa-298d-4d06-84f2-8aa87d9d3442\",\"displayName\":\"App\\\\Events\\\\TransactionUpdated\",\"job\":\"Illuminate\\\\Queue\\\\CallQueuedHandler@call\",\"maxTries\":null,\"maxExceptions\":null,\"failOnTimeout\":false,\"backoff\":null,\"timeout\":null,\"retryUntil\":null,\"data\":{\"commandName\":\"Illuminate\\\\Broadcasting\\\\BroadcastEvent\",\"command\":\"O:38:\\\"Illuminate\\\\Broadcasting\\\\BroadcastEvent\\\":17:{s:5:\\\"event\\\";O:29:\\\"App\\\\Events\\\\TransactionUpdated\\\":3:{s:6:\\\"action\\\";s:14:\\\"status_changed\\\";s:13:\\\"transactionId\\\";i:4;s:11:\\\"transaction\\\";a:1:{s:10:\\\"new_status\\\";s:3:\\\"200\\\";}}s:5:\\\"tries\\\";N;s:7:\\\"timeout\\\";N;s:7:\\\"backoff\\\";N;s:13:\\\"maxExceptions\\\";N;s:23:\\\"deleteWhenMissingModels\\\";b:1;s:10:\\\"connection\\\";N;s:5:\\\"queue\\\";N;s:12:\\\"messageGroup\\\";N;s:12:\\\"deduplicator\\\";N;s:5:\\\"delay\\\";N;s:11:\\\"afterCommit\\\";N;s:10:\\\"middleware\\\";a:0:{}s:7:\\\"chained\\\";a:0:{}s:15:\\\"chainConnection\\\";N;s:10:\\\"chainQueue\\\";N;s:19:\\\"chainCatchCallbacks\\\";N;}\"},\"createdAt\":1773193192,\"delay\":null}', 0, NULL, 1773193192, 1773193192),
(2, 'default', '{\"uuid\":\"3425a874-b175-4fe3-8edc-5cf2543050c1\",\"displayName\":\"App\\\\Events\\\\TransactionUpdated\",\"job\":\"Illuminate\\\\Queue\\\\CallQueuedHandler@call\",\"maxTries\":null,\"maxExceptions\":null,\"failOnTimeout\":false,\"backoff\":null,\"timeout\":null,\"retryUntil\":null,\"data\":{\"commandName\":\"Illuminate\\\\Broadcasting\\\\BroadcastEvent\",\"command\":\"O:38:\\\"Illuminate\\\\Broadcasting\\\\BroadcastEvent\\\":17:{s:5:\\\"event\\\";O:29:\\\"App\\\\Events\\\\TransactionUpdated\\\":3:{s:6:\\\"action\\\";s:14:\\\"status_changed\\\";s:13:\\\"transactionId\\\";i:4;s:11:\\\"transaction\\\";a:1:{s:10:\\\"new_status\\\";s:3:\\\"200\\\";}}s:5:\\\"tries\\\";N;s:7:\\\"timeout\\\";N;s:7:\\\"backoff\\\";N;s:13:\\\"maxExceptions\\\";N;s:23:\\\"deleteWhenMissingModels\\\";b:1;s:10:\\\"connection\\\";N;s:5:\\\"queue\\\";N;s:12:\\\"messageGroup\\\";N;s:12:\\\"deduplicator\\\";N;s:5:\\\"delay\\\";N;s:11:\\\"afterCommit\\\";N;s:10:\\\"middleware\\\";a:0:{}s:7:\\\"chained\\\";a:0:{}s:15:\\\"chainConnection\\\";N;s:10:\\\"chainQueue\\\";N;s:19:\\\"chainCatchCallbacks\\\";N;}\"},\"createdAt\":1773193518,\"delay\":null}', 0, NULL, 1773193518, 1773193518),
(3, 'default', '{\"uuid\":\"141407ae-54c0-4acf-aaea-3014a343103a\",\"displayName\":\"App\\\\Events\\\\TransactionUpdated\",\"job\":\"Illuminate\\\\Queue\\\\CallQueuedHandler@call\",\"maxTries\":null,\"maxExceptions\":null,\"failOnTimeout\":false,\"backoff\":null,\"timeout\":null,\"retryUntil\":null,\"data\":{\"commandName\":\"Illuminate\\\\Broadcasting\\\\BroadcastEvent\",\"command\":\"O:38:\\\"Illuminate\\\\Broadcasting\\\\BroadcastEvent\\\":17:{s:5:\\\"event\\\";O:29:\\\"App\\\\Events\\\\TransactionUpdated\\\":3:{s:6:\\\"action\\\";s:4:\\\"test\\\";s:13:\\\"transactionId\\\";i:1;s:11:\\\"transaction\\\";N;}s:5:\\\"tries\\\";N;s:7:\\\"timeout\\\";N;s:7:\\\"backoff\\\";N;s:13:\\\"maxExceptions\\\";N;s:23:\\\"deleteWhenMissingModels\\\";b:1;s:10:\\\"connection\\\";N;s:5:\\\"queue\\\";N;s:12:\\\"messageGroup\\\";N;s:12:\\\"deduplicator\\\";N;s:5:\\\"delay\\\";N;s:11:\\\"afterCommit\\\";N;s:10:\\\"middleware\\\";a:0:{}s:7:\\\"chained\\\";a:0:{}s:15:\\\"chainConnection\\\";N;s:10:\\\"chainQueue\\\";N;s:19:\\\"chainCatchCallbacks\\\";N;}\"},\"createdAt\":1773193986,\"delay\":null}', 0, NULL, 1773193986, 1773193986),
(4, 'default', '{\"uuid\":\"82bac710-059f-43b2-b398-026c31c9e258\",\"displayName\":\"App\\\\Events\\\\TransactionUpdated\",\"job\":\"Illuminate\\\\Queue\\\\CallQueuedHandler@call\",\"maxTries\":null,\"maxExceptions\":null,\"failOnTimeout\":false,\"backoff\":null,\"timeout\":null,\"retryUntil\":null,\"data\":{\"commandName\":\"Illuminate\\\\Broadcasting\\\\BroadcastEvent\",\"command\":\"O:38:\\\"Illuminate\\\\Broadcasting\\\\BroadcastEvent\\\":17:{s:5:\\\"event\\\";O:29:\\\"App\\\\Events\\\\TransactionUpdated\\\":3:{s:6:\\\"action\\\";s:4:\\\"test\\\";s:13:\\\"transactionId\\\";i:999;s:11:\\\"transaction\\\";N;}s:5:\\\"tries\\\";N;s:7:\\\"timeout\\\";N;s:7:\\\"backoff\\\";N;s:13:\\\"maxExceptions\\\";N;s:23:\\\"deleteWhenMissingModels\\\";b:1;s:10:\\\"connection\\\";N;s:5:\\\"queue\\\";N;s:12:\\\"messageGroup\\\";N;s:12:\\\"deduplicator\\\";N;s:5:\\\"delay\\\";N;s:11:\\\"afterCommit\\\";N;s:10:\\\"middleware\\\";a:0:{}s:7:\\\"chained\\\";a:0:{}s:15:\\\"chainConnection\\\";N;s:10:\\\"chainQueue\\\";N;s:19:\\\"chainCatchCallbacks\\\";N;}\"},\"createdAt\":1773193994,\"delay\":null}', 0, NULL, 1773193994, 1773193994);

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
(21, '2025_11_03_023122_create_tbltransactionhistories_table', 5),
(22, '2026_02_12_011046_create_tbldirectcostoptions_table', 6),
(23, '2026_02_12_011047_create_tbldirectcost_table', 6);

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

--
-- Dumping data for table `personal_access_tokens`
--

INSERT INTO `personal_access_tokens` (`id`, `tokenable_type`, `tokenable_id`, `name`, `token`, `abilities`, `last_used_at`, `expires_at`, `created_at`, `updated_at`) VALUES
(158, 'Resources\\SabpUser', 9999, 'auth_token', '83a70d7ee558171d98df05d1f06246eaae4c958220f2df2712135e80d3b39e42', '[\"*\"]', NULL, NULL, '2026-03-09 20:03:12', '2026-03-09 20:03:12'),
(304, 'App\\Models\\User', 30, 'auth_token', '64640e057a122bffaf3f151d66131cc88019b8a757fa996603d07805c489eda7', '[\"*\"]', '2026-03-17 21:51:47', NULL, '2026-03-17 20:27:45', '2026-03-17 21:51:47');

-- --------------------------------------------------------

--
-- Table structure for table `tblclients`
--

CREATE TABLE `tblclients` (
  `nClientId` bigint(20) UNSIGNED NOT NULL,
  `strClientName` varchar(100) NOT NULL,
  `strClientNickName` varchar(25) NOT NULL,
  `strTIN` varchar(17) DEFAULT NULL,
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
(23, 'Philippine Statistics Authority', 'PSA', '460-372-118-00028', 'Camilmil, Calapan City, Oriental Mindoro', 'Government', NULL, NULL, 'A'),
(24, 'DepEd - Division of Oriental Mindoro', 'DepEd - OrMin', '000-845-895-00470', 'Sta. Isabel, Calapan City, Oriental Mindoro', 'Government', NULL, NULL, 'A'),
(25, 'National Food Authority', 'NFA', '001-031-151-00062', 'Tawiran, Calapan City, Oriental Mindoro', 'Government', NULL, NULL, 'A'),
(26, 'Mindoro State University', 'MinSU', '004-178-211-00000', 'Alcate, Victoria, Oriental Mindoro', 'Government', NULL, NULL, 'A'),
(27, 'DENR - PENRO', 'PENRO', '000-535-643-00028', 'Suqui, Calapan City, Oriental Mindoro', 'Governments', NULL, NULL, 'A'),
(36, 'sd', 'sds', NULL, 'dsd', NULL, NULL, NULL, 'I'),
(37, 'er', 'er', NULL, 'er', 'er', NULL, NULL, 'I'),
(38, 'Maidlang Elementary School', 'Maidlang Elem.', NULL, NULL, NULL, NULL, NULL, 'A');

-- --------------------------------------------------------

--
-- Table structure for table `tblcompanies`
--

CREATE TABLE `tblcompanies` (
  `nCompanyId` bigint(20) UNSIGNED NOT NULL,
  `strCompanyName` varchar(50) NOT NULL,
  `strCompanyNickName` varchar(20) NOT NULL,
  `strTIN` varchar(17) DEFAULT NULL,
  `strAddress` varchar(200) DEFAULT NULL,
  `bVAT` tinyint(4) NOT NULL,
  `bEWT` tinyint(4) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `tblcompanies`
--

INSERT INTO `tblcompanies` (`nCompanyId`, `strCompanyName`, `strCompanyNickName`, `strTIN`, `strAddress`, `bVAT`, `bEWT`) VALUES
(1, 'HiRAMS\' Supply Wholesaling', 'HiRAMS', '408-194-796', 'Barcenaga, Naujan, Oriental Mindoro', 0, 1),
(2, 'Teknokrat Consulting', 'Tekno Consulting', '945-327-511-00000', 'Barcenaga, Naujan, Oriental Mindoro', 1, 1),
(3, 'Teknokrat Digital Solutions', 'Tekno Digital', '408-194-796-00001', 'Barcenaga, Naujan, Oriental Mindoro', 1, 1),
(4, 'Working Tools Development Corporation', 'Working Tools', '682-398-401-00000', 'Barcenaga, Naujan, Oriental Mindoro', 1, 1),
(5, 'On-The-Level Consumer Goods Trading', 'On-The-Level', '275-205-833-00000', 'Sto. Nino, Calapan City, Oriental Mindoro', 1, 1);

-- --------------------------------------------------------

--
-- Table structure for table `tbldirectcost`
--

CREATE TABLE `tbldirectcost` (
  `nDirectCostID` int(11) NOT NULL,
  `nTransactionID` int(11) NOT NULL,
  `nDirectCostOptionID` int(11) NOT NULL,
  `dAmount` double NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tbldirectcost`
--

INSERT INTO `tbldirectcost` (`nDirectCostID`, `nTransactionID`, `nDirectCostOptionID`, `dAmount`) VALUES
(1, 1, 4, 641.5),
(2, 1, 3, 500),
(3, 1, 10, 1),
(4, 1, 6, 11),
(5, 1, 7, 111),
(6, 1, 5, 1111),
(7, 1, 9, 11111),
(8, 1, 11, 10000),
(10, 2, 6, 1000),
(11, 4, 6, 5000),
(15, 4, 3, 700);

-- --------------------------------------------------------

--
-- Table structure for table `tbldirectcostoptions`
--

CREATE TABLE `tbldirectcostoptions` (
  `nDirectCostOptionID` int(11) NOT NULL,
  `strName` varchar(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tbldirectcostoptions`
--

INSERT INTO `tbldirectcostoptions` (`nDirectCostOptionID`, `strName`) VALUES
(3, 'Bidding Documents'),
(4, 'EWT'),
(5, 'Fees & Bonds'),
(6, 'Freight IN'),
(7, 'Delivery'),
(8, 'Warehouse'),
(9, 'Manpower'),
(10, 'Rebates');

-- --------------------------------------------------------

--
-- Table structure for table `tblitempricings`
--

CREATE TABLE `tblitempricings` (
  `nItemPriceId` bigint(20) UNSIGNED NOT NULL,
  `nPricingSetId` int(11) NOT NULL,
  `nTransactionItemId` int(11) NOT NULL,
  `dUnitSellingPrice` double NOT NULL,
  `bPricingLocked` tinyint(1) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `tblitempricings`
--

INSERT INTO `tblitempricings` (`nItemPriceId`, `nPricingSetId`, `nTransactionItemId`, `dUnitSellingPrice`, `bPricingLocked`) VALUES
(1, 1, 1, 24029, 0),
(2, 1, 2, 34799, 1),
(4, 1, 3, 7975, 1),
(15, 4, 4, 149, 0),
(16, 4, 5, 34, 0),
(17, 4, 6, 291, 0),
(18, 2, 1, 0, 0),
(19, 2, 2, 0, 0),
(20, 2, 3, 0, 0),
(21, 3, 4, 150, 0),
(22, 6, 52, 1957, 1),
(23, 6, 56, 997, 1),
(24, 6, 57, 1961, 0);

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

--
-- Dumping data for table `tblpricingsets`
--

INSERT INTO `tblpricingsets` (`nPricingSetId`, `nTransactionId`, `strName`, `bChosen`) VALUES
(1, 1, 'Dive', 1),
(2, 1, 'Float', 0),
(3, 2, 'Float', 0),
(4, 2, 'Dive', 1),
(5, 7, 'Float', 0),
(6, 7, 'Dive', 1);

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
  `bAddOn` tinyint(1) NOT NULL DEFAULT 0,
  `bIncluded` tinyint(1) NOT NULL,
  `dtCanvass` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `tblpurchaseoptions`
--

INSERT INTO `tblpurchaseoptions` (`nPurchaseOptionId`, `nTransactionItemId`, `nSupplierId`, `nQuantity`, `strUOM`, `strBrand`, `strModel`, `strSpecs`, `dUnitPrice`, `dEWT`, `strProductCode`, `bAddOn`, `bIncluded`, `dtCanvass`) VALUES
(1, 1, 1, 2, 'pcs', 'Vivan VPS', 'P300 Power Station', '<p>Capacity 96,000mAh (or 300Wh) AC Output 230V 50Hz230 cap V tilde 50 cap Hz 230 50, 300W (Max) Type-C Output 5V-3A,9V-3A, 12V-3A,15V-3A,20V-5A5 20 cap V equal 5 cap A 5V-3, 9V-3A, 12V-3A, DC Output 10-14.2V10 minus 14.2 cap V 10-14.2,120W (Max) Car Charge Output 10-14.2V10 minus 14.2 cap V 10-14.2. 120(W) Type-C+USB A1+A2 Combined Output 6A6 cap A 6A DC Input 11V-24V-5A11 cap V minus 24 cap V equals 5 cap A 11-24-5, 100w (max) (Solar/Adapter) VVA Charging Temperature 0°C-45°C</p>', 16572, 295.93, NULL, 0, 1, '2026-02-25 14:47:46'),
(2, 2, 2, 2, 'pcs', 'Samsung Galaxy', 'A56', '<p>Display: 6.7\" inch FHD+Super AMOLED Display (1080x2340 Pixels, 385ppi)   Protection: Corning Gorilla Glass Victus+,&nbsp;19.5:9 ratio   120Hz, HDR10+, 1200 nits (HBM), 1900 nits (peak)   OS: Android 15, up to 6 major Android upgrades, One UI 7   RAM: Options for 8GB or 12GB.   Storage: Options for 128GB or 256GB (Note: the A56 does not support microSD expansion)   Main Camera: Triple 50 MP, f/1.8, (wide) 12 MP, f/2.2, 123˚ (ultrawide), 5 MP (macro) Selfie camera: 12 MP, f/2.2, (wide)   Battery: Type 5000 mAh </p>', 23999, 0, NULL, 0, 1, '2026-02-25 14:49:24'),
(3, 3, 1, 1, 'pcs', 'ASUS TUF Gaming', 'F17 FX707ZR', '<p> 17.3-inch, Full HD (1920x1080) IPS /IPS-level display., 144Hz</p>', 5500, 0, NULL, 0, 1, '2026-02-25 14:52:19'),
(4, 1, 2, 2, 'pcs', 'Vivan VPS', 'P300 Power Station', '<p>Capacity 96,000mAh (or 300Wh) AC Output 230V 50Hz230 cap V tilde 50 cap Hz 230 50, 300W (Max) Type-C Output 5V-3A,9V-3A, 12V-3A,15V-3A,20V-5A5 20 cap V equal 5 cap A 5V-3, 9V-3A, 12V-3A, DC Output 10-14.2V10 minus 14.2 cap V 10-14.2,120W (Max) Car Charge Output 10-14.2V10 minus 14.2 cap V 10-14.2. 120(W) Type-C+USB A1+A2 Combined Output 6A6 cap A 6A DC Input 11V-24V-5A11 cap V minus 24 cap V equals 5 cap A 11-24-5, 100w (max) (Solar/Adapter) VVA Charging Temperature 0°C-45°C</p>', 16572, 295.57, NULL, 0, 1, '2026-02-25 15:56:14'),
(6, 4, 1, 30, 'pcs', 'Matrix', 'Notebook 2', '<p>100 pages, A4 size, lined paper, hardcover</p>', 120, 32.14, NULL, 0, 1, '2026-02-25 16:27:13'),
(7, 5, 1, 100, 'pcs', 'Ballpen', 'HBW', '<p>Blue ink, 0.7mm tip, plastic barrel, smooth writing</p>', 25, 22.32, NULL, 0, 1, '2026-02-25 16:30:44'),
(8, 6, 2, 20, 'pcs', 'Sketch Pad', 'Thinker', '<p>A4 size, 50 sheets, acid-free paper, spiral bound</p>', 250, 44.64, NULL, 0, 1, '2026-02-25 16:31:23'),
(16, 11, 15, 90, 'reams', 'Lazer Itd', 'A4', '<p>70gsm</p>', 140, 0, NULL, 0, 1, '2026-03-06 10:34:07'),
(17, 16, 15, 40, 'reams', 'Lazer It', 'Long', '<p>70gsm 500\'s</p>', 160, 0, NULL, 0, 1, '2026-03-06 10:54:44'),
(18, 17, 18, 2, 'reams', 'Worx', 'a4', '<p><span style=\"background-color: rgba(173, 216, 230, 0.353); color: rgba(0, 0, 0, 0.6);\">white A4 200gsm 100\'s</span></p><p><br></p><p><br></p>', 295, 5.27, NULL, 0, 1, '2026-03-06 11:39:51'),
(19, 39, 16, 67, 'pcs', 'er', 'er', '<p>none</p>', 100, 59.82, NULL, 0, 1, '2026-03-06 13:24:52'),
(20, 18, 18, 2, 'ream', 'Worx', 'Long', '<p>white 8.5x13 200gsm 100\'s</p>', 320, 5.71, NULL, 0, 1, '2026-03-06 13:47:30'),
(21, 19, 18, 8, 'pack', 'Generic', 'A4', '<p>A4 high glossy 180gsm 20\'s</p>', 58, 4.14, NULL, 0, 1, '2026-03-06 14:13:32'),
(22, 20, 18, 10, 'pack', 'generic', 'a4', '<p>A4 Glossy</p>', 40, 3.57, NULL, 0, 1, '2026-03-06 14:23:45'),
(23, 42, 17, 3, 'pcs', 'we', 'we', '<p>er</p>', 56, 1.5, NULL, 0, 1, '2026-03-09 16:26:09'),
(24, 21, 18, 10, 'pack', 'generic', 'a4', '<p>sticker A4 20s</p>', 300, 26.79, NULL, 0, 1, '2026-03-10 11:16:00'),
(25, 22, 18, 2, 'reams', 'generic', 'short', '<p>8.5x11 250\'s</p>', 230, 4.11, NULL, 0, 1, '2026-03-10 11:17:10'),
(26, 23, 18, 3, 'reams', 'Worx', 'short', '<p>white 8.5x11 200gsm 100\'s</p>', 275, 7.37, NULL, 0, 1, '2026-03-10 11:22:30'),
(27, 24, 18, 200, 'pcs', 'generic', 'Long', '<p>Long Glossy Blue</p>', 14.5, 25.89, NULL, 0, 1, '2026-03-10 11:23:41'),
(28, 25, 17, 1, 'reams', 'System', 'Long', '<p>Long ordinary 16pts 100s</p>', 520, 0, NULL, 0, 1, '2026-03-10 11:29:29'),
(29, 26, 17, 1, 'reams', 'system', 'long', '<p>A4 ordinary 16pts 100s</p>', 510, 0, NULL, 0, 1, '2026-03-10 11:30:15'),
(30, 27, 18, 4, 'reams', 'Tm', 'long', '<p>125 micron Long 100\'s</p>', 600, 21.43, NULL, 0, 1, '2026-03-10 11:36:01'),
(31, 28, 18, 4, 'reams', 'TM', 'a4', '<p>125 micron A4 100\'s</p>', 520, 18.57, NULL, 0, 1, '2026-03-10 11:37:06'),
(32, 29, 17, 20, 'pcs', 'Tm', 'a4', '<p>A4</p>', 36, 0, NULL, 0, 1, '2026-03-10 11:39:46'),
(33, 30, 17, 1, 'ream', 'Generic', 'Long', '<p>14pts Long size Red 100\'s</p>', 600, 0, NULL, 0, 1, '2026-03-10 11:42:07'),
(34, 31, 18, 200, 'pcs', 'Clear', 'A4', '<p>Clear Plastic in front, A4, Blue</p>', 27, 48.21, NULL, 0, 1, '2026-03-10 11:44:57'),
(35, 32, 17, 20, 'bottles', 'Elmers', 'bottle', '<p>130g</p>', 50, 0, NULL, 0, 1, '2026-03-10 11:49:29'),
(37, 38, 18, 1, 'box', 'JOy', 'Small', '<p>small</p>', 15, 0.13, NULL, 0, 1, '2026-03-10 12:03:26'),
(38, 37, 21, 4, 'bottles', 'Epson', '664', '<p>664 Black, 70ml</p>', 305, 0, NULL, 0, 1, '2026-03-10 12:22:45'),
(42, 33, 20, 30, 'pcs', 'Double Sided Tape', 'Matrix', '<p>50M tape, 30mm</p>', 650, 0, NULL, 0, 1, '2026-03-12 13:18:55'),
(43, 34, 20, 100, 'pcs', 'Masking Tape', 'MAtrix', '<p>1\"</p>', 35, 0, NULL, 0, 1, '2026-03-12 13:19:42'),
(44, 35, 20, 24, 'pcs', 'Scotch Tape', 'Melvix', '<p>1\"</p>', 32, 0, NULL, 0, 1, '2026-03-12 13:22:25'),
(45, 36, 20, 24, 'pcs', 'Permanent Marker', 'Matrix', '<p>refillable</p>', 45, 0, NULL, 0, 1, '2026-03-12 13:23:02'),
(46, 57, 16, 10, 'pcs', 'brand x', 'model x', '<p><span style=\"background-color: rgb(255, 255, 0);\">.6 mm</span></p>', 1299, 0, NULL, 0, 1, '2026-03-13 09:01:06'),
(47, 52, 2, 10, 'pcs', 'Plasters nA23', 'nA23', '<p>se</p>', 990, 88.39, NULL, 0, 1, '2026-03-13 14:48:55'),
(48, 56, 1, 10, 'pcs', 'Iodine betadine', 'Medicare', '<p>fg</p>', 660, 58.93, NULL, 0, 1, '2026-03-13 14:49:35'),
(49, 58, 20, 34, 'pcs', 'we', 'we', '<p>2323232</p>', 45, 0, NULL, 0, 1, '2026-03-16 10:40:15'),
(50, 39, 15, 40, 'reams', 'Lazer It', 'Long', '<p>70gsm 500\'s</p>', 160, 0, NULL, 0, 0, '2026-03-18 10:21:23');

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
(1, '2026-01-23 07:41:08', 'Error fetching transaction items: SQLSTATE[42S02]: Base table or view not found: 1146 Table \'lguph_hiramsDB.tblItemPricings\' doesn\'t exist (Connection: mysql, SQL: select * from `tblItemPricings` where `tblItemPricings`.`nTransactionItemId` in (1))'),
(2, '2026-01-23 07:41:21', 'Error fetching transaction items: SQLSTATE[42S02]: Base table or view not found: 1146 Table \'lguph_hiramsDB.tblItemPricings\' doesn\'t exist (Connection: mysql, SQL: select * from `tblItemPricings` where `tblItemPricings`.`nTransactionItemId` in (1))'),
(3, '2026-01-23 07:42:12', 'Error fetching transaction items: SQLSTATE[42S02]: Base table or view not found: 1146 Table \'lguph_hiramsDB.tblItemPricings\' doesn\'t exist (Connection: mysql, SQL: select * from `tblItemPricings` where `tblItemPricings`.`nTransactionItemId` in (1, 2))'),
(4, '2026-01-23 07:45:35', 'Error fetching transaction items: SQLSTATE[42S02]: Base table or view not found: 1146 Table \'lguph_hiramsDB.tblItemPricings\' doesn\'t exist (Connection: mysql, SQL: select * from `tblItemPricings` where `tblItemPricings`.`nTransactionItemId` in (1, 2))'),
(5, '2026-01-23 07:45:52', 'Error fetching transaction items: SQLSTATE[42S02]: Base table or view not found: 1146 Table \'lguph_hiramsDB.tblItemPricings\' doesn\'t exist (Connection: mysql, SQL: select * from `tblItemPricings` where `tblItemPricings`.`nTransactionItemId` in (1, 2))'),
(6, '2026-01-23 07:46:33', 'Error fetching transaction items: SQLSTATE[42S02]: Base table or view not found: 1146 Table \'lguph_hiramsDB.tblItemPricings\' doesn\'t exist (Connection: mysql, SQL: select * from `tblItemPricings` where `tblItemPricings`.`nTransactionItemId` in (1, 2))'),
(7, '2026-01-23 07:46:52', 'Error fetching transaction items: SQLSTATE[42S02]: Base table or view not found: 1146 Table \'lguph_hiramsDB.tblItemPricings\' doesn\'t exist (Connection: mysql, SQL: select * from `tblItemPricings` where `tblItemPricings`.`nTransactionItemId` in (1, 2))'),
(8, '2026-01-30 07:46:48', 'Error creating user: The c user type field is required.'),
(9, '2026-01-30 14:53:09', 'Error creating user: SQLSTATE[42S22]: Column not found: 1054 Unknown column \'strEmail\' in \'where clause\' (Connection: mysql, Host: 127.0.0.1, Port: 3306, Database: hirams_backend, SQL: select count(*) as aggregate from `users` where `strEmail` = sfdvhv@gmail.com)'),
(10, '2026-01-30 14:54:26', 'Error creating user: SQLSTATE[42S22]: Column not found: 1054 Unknown column \'strEmail\' in \'where clause\' (Connection: mysql, Host: 127.0.0.1, Port: 3306, Database: hirams_backend, SQL: select count(*) as aggregate from `users` where `strEmail` = sfdvhv@gmail.com)'),
(11, '2026-01-30 14:54:51', 'Error creating user: SQLSTATE[42S22]: Column not found: 1054 Unknown column \'strEmail\' in \'where clause\' (Connection: mysql, Host: 127.0.0.1, Port: 3306, Database: hirams_backend, SQL: select count(*) as aggregate from `users` where `strEmail` = johnrusselldln@gmail.com)'),
(12, '2026-01-30 14:55:00', 'Error creating user: SQLSTATE[42S22]: Column not found: 1054 Unknown column \'strEmail\' in \'where clause\' (Connection: mysql, Host: 127.0.0.1, Port: 3306, Database: hirams_backend, SQL: select count(*) as aggregate from `users` where `strEmail` = johnrusselldln@gmail.com)'),
(13, '2026-01-30 14:57:42', 'Error creating user: The str email has already been taken. (and 1 more error)'),
(14, '2026-01-30 14:58:02', 'Error creating user: The str email has already been taken. (and 1 more error)'),
(15, '2026-01-30 15:03:08', 'Error creating user: The str user name has already been taken.'),
(16, '2026-01-30 15:03:29', 'Error creating user: The str email has already been taken. (and 1 more error)'),
(17, '2026-01-30 15:54:28', 'Error creating user: SQLSTATE[23000]: Integrity constraint violation: 1062 Duplicate entry \'johnrusselldln@gmail.com-@Jayfer06\' for key \'strEmail\' (Connection: mysql, Host: 127.0.0.1, Port: 3306, Database: hirams_backend, SQL: insert into `tblusers` (`strFName`, `strMName`, `strLName`, `strNickName`, `cUserType`, `cSex`, `strEmail`, `strUserName`, `strPassword`, `cStatus`) values (as, ?, as, as, V, M, johnrusselldln@gmail.com, @Jayfer06, $2y$12$gaamzFYBabOkXRGVITmbk.1gL6rF8VUrGobYUwdhBVFsMPtrAPice, A))'),
(18, '2026-01-30 15:54:47', 'Error creating user: SQLSTATE[23000]: Integrity constraint violation: 1062 Duplicate entry \'johnrusselldln@gmail.com-@Jayfer06\' for key \'strEmail\' (Connection: mysql, Host: 127.0.0.1, Port: 3306, Database: hirams_backend, SQL: insert into `tblusers` (`strFName`, `strMName`, `strLName`, `strNickName`, `cUserType`, `cSex`, `strEmail`, `strUserName`, `strPassword`, `cStatus`) values (as, ?, as, as, V, M, johnrusselldln@gmail.com, @Jayfer06, $2y$12$riRRtil9P5sTNJh1qv92G.aR4uvLuZ1mKT980acFilHwpBpt/KtZa, A))'),
(19, '2026-01-30 15:55:32', 'Error creating user: SQLSTATE[23000]: Integrity constraint violation: 1062 Duplicate entry \'johnrusselldln@gmail.com-@Jayfer06\' for key \'strEmail\' (Connection: mysql, Host: 127.0.0.1, Port: 3306, Database: hirams_backend, SQL: insert into `tblusers` (`strFName`, `strMName`, `strLName`, `strNickName`, `cUserType`, `cSex`, `strEmail`, `strUserName`, `strPassword`, `cStatus`) values (as, ?, as, as, V, M, johnrusselldln@gmail.com, @Jayfer06, $2y$12$3K8ZQQcWBL1snlc6jt26H.s4820BylNqG0y6HU44D0EmYVEt1Sm/q, A))'),
(20, '2026-01-30 15:57:38', 'Error creating user: SQLSTATE[23000]: Integrity constraint violation: 1062 Duplicate entry \'@Jayfer06\' for key \'strUserName\' (Connection: mysql, Host: 127.0.0.1, Port: 3306, Database: hirams_backend, SQL: insert into `tblusers` (`strFName`, `strMName`, `strLName`, `strNickName`, `cUserType`, `cSex`, `strEmail`, `strUserName`, `strPassword`, `cStatus`) values (as, ?, as, as, V, M, johnrussdln@gmail.com, @Jayfer06, $2y$12$1C531YYdk8mjgH/Z7gYOfOtZLqoklOE2Ry2OaEihJcD8kTLdYvQi2, A))'),
(21, '2026-02-02 00:29:26', 'Error creating user: SQLSTATE[23000]: Integrity constraint violation: 1062 Duplicate entry \'@Jayfer06\' for key \'strUserName\' (Connection: mysql, Host: 127.0.0.1, Port: 3306, Database: hirams_backend, SQL: insert into `tblusers` (`strFName`, `strMName`, `strLName`, `strNickName`, `cUserType`, `cSex`, `strEmail`, `strUserName`, `strPassword`, `cStatus`) values (sd, ?, sd, sd, V, M, johnrusselldln@gmail.com, @Jayfer06, $2y$12$AhubqUvPVEI1HJx9sZ1zTe196ORPlMP6HipUXZ8YrsQIp8bOhjpSu, A))'),
(22, '2026-02-02 00:30:04', 'Error creating user: SQLSTATE[23000]: Integrity constraint violation: 1062 Duplicate entry \'@Jayfer06\' for key \'strUserName\' (Connection: mysql, Host: 127.0.0.1, Port: 3306, Database: hirams_backend, SQL: insert into `tblusers` (`strFName`, `strMName`, `strLName`, `strNickName`, `cUserType`, `cSex`, `strEmail`, `strUserName`, `strPassword`, `cStatus`) values (sd, ?, sd, sd, V, M, johnrusselldln@gmail.com, @Jayfer06, $2y$12$gL1Zw68l5DFHZeuNtlNJ0.4M0UC4V9uQ7ncwjWH15aJryi1iTxkem, A))'),
(23, '2026-02-02 02:29:18', 'Error updating User ID 90: SQLSTATE[23000]: Integrity constraint violation: 1062 Duplicate entry \'@Jayfer06\' for key \'strUserName\' (Connection: mysql, Host: 127.0.0.1, Port: 3306, Database: hirams_backend, SQL: update `tblusers` set `strUserName` = @Jayfer06 where `nUserId` = 90)'),
(24, '2026-02-02 02:29:24', 'Error updating User ID 90: SQLSTATE[23000]: Integrity constraint violation: 1062 Duplicate entry \'@Jayfer06\' for key \'strUserName\' (Connection: mysql, Host: 127.0.0.1, Port: 3306, Database: hirams_backend, SQL: update `tblusers` set `strUserName` = @Jayfer06 where `nUserId` = 90)'),
(25, '2026-02-02 02:37:44', 'Error updating User ID 30: SQLSTATE[42S22]: Column not found: 1054 Unknown column \'id\' in \'where clause\' (Connection: mysql, Host: 127.0.0.1, Port: 3306, Database: hirams_backend, SQL: select exists(select * from `tblusers` where BINARY strUserName = Hilda and `id` is not null) as `exists`)'),
(26, '2026-02-02 02:39:21', 'Error updating User ID 30: SQLSTATE[42S22]: Column not found: 1054 Unknown column \'id\' in \'where clause\' (Connection: mysql, Host: 127.0.0.1, Port: 3306, Database: hirams_backend, SQL: select exists(select * from `tblusers` where BINARY strUserName = Hilda and `id` is not null) as `exists`)'),
(27, '2026-02-02 02:40:14', 'Error updating User ID 30: SQLSTATE[42S22]: Column not found: 1054 Unknown column \'id\' in \'where clause\' (Connection: mysql, Host: 127.0.0.1, Port: 3306, Database: hirams_backend, SQL: select exists(select * from `tblusers` where BINARY strUserName = Hilda and `id` is not null) as `exists`)'),
(28, '2026-02-02 02:40:56', 'Error updating User ID 30: SQLSTATE[42S22]: Column not found: 1054 Unknown column \'id\' in \'where clause\' (Connection: mysql, Host: 127.0.0.1, Port: 3306, Database: hirams_backend, SQL: select exists(select * from `tblusers` where BINARY strUserName = Hilda and `id` is not null) as `exists`)'),
(29, '2026-02-02 06:54:31', 'Supplier ID [object Object] not found: No query results for model [App\\Models\\Supplier] [object Object]'),
(30, '2026-02-12 02:27:43', 'Attempt to read property \"nTransactionId\" on array'),
(31, '2026-02-12 06:13:56', 'Method App\\Http\\Requests\\PurchaseOption\\UpdatePurchaseOptionRequest::validateds does not exist.'),
(32, '2026-02-19 01:32:43', 'SQLSTATE[22001]: String data, right truncated: 1406 Data too long for column \'strBrand\' at row 1 (Connection: mysql, Host: 127.0.0.1, Port: 3306, Database: lguph_hiramsDB, SQL: update `tblPurchaseOptions` set `nSupplierId` = 11, `nQuantity` = 1, `strBrand` = Asus TUF Gaming LCD Laptop Screen, `strModel` = B173HAN04.9, `strSpecs` = <p> 17.3 Inch 144Hz Laptop LCD Screen B173HAN04.9 B173HAN04.5 for ASUS TUF FA706 FA707 FX705 FX706 FX707 Display Panel Replacement </p>, `dUnitPrice` = 5500, `dEWT` = 0 where `nPurchaseOptionId` = 3)'),
(33, '2026-02-19 07:49:45', 'Call to undefined relationship [item_pricings] on model [App\\Models\\PricingSet].'),
(34, '2026-02-20 05:49:20', 'Undefined array key \"data\"'),
(35, '2026-02-20 06:12:26', 'Undefined variable $str'),
(36, '2026-02-24 02:51:07', 'SQLSTATE[42S22]: Column not found: 1054 Unknown column \'nQuantity\' in \'field list\' (Connection: mysql, Host: 127.0.0.1, Port: 3306, Database: lguph_hiramsDB, SQL: select SUM(dUnitSellingPrice * nQuantity) as total from `tblitemPricings` where `nPricingSetId` = 1 limit 1)'),
(37, '2026-02-24 02:51:08', 'SQLSTATE[42S22]: Column not found: 1054 Unknown column \'nQuantity\' in \'field list\' (Connection: mysql, Host: 127.0.0.1, Port: 3306, Database: lguph_hiramsDB, SQL: select SUM(dUnitSellingPrice * nQuantity) as total from `tblitemPricings` where `nPricingSetId` = 1 limit 1)'),
(38, '2026-02-24 08:53:36', 'Undefined array key 7'),
(39, '2026-02-25 14:50:45', 'SQLSTATE[22001]: String data, right truncated: 1406 Data too long for column \'strModel\' at row 1 (Connection: mysql, Host: 127.0.0.1, Port: 3306, Database: lguph_hiramsDB, SQL: insert into `tblPurchaseOptions` (`nTransactionItemId`, `nSupplierId`, `nQuantity`, `strUOM`, `strBrand`, `strModel`, `strSpecs`, `dUnitPrice`, `dEWT`, `bIncluded`, `bAddOn`, `dtCanvass`) values (3, 2, 1, pcs, ASUS TUF, FA706 FA707 FX705 FX706 FX707 Display Panel Replacement, <p> 17.3-inch, Full HD (1920x1080) IPS /IPS-level display., 144Hz</p>, 5500, 0, 0, 0, 2026-02-25 14:50:45))'),
(40, '2026-02-27 15:13:49', 'The str code field must not be greater than 30 characters.'),
(41, '2026-03-06 09:28:24', 'The d unit a b c field is required.'),
(42, '2026-03-11 11:18:15', 'Pusher error: cURL error 6: Could not resolve host: api-ap1.pusher.com (see https://curl.haxx.se/libcurl/c/libcurl-errors.html) for https://api-ap1.pusher.com/apps/2126207/events?auth_key=2c1f03f730367f672067&auth_timestamp=1773199095&auth_version=1.0&body_md5=38aec9dc87b21d0fe035ac51011df542&auth_signature=0ee9a12b229eb8f7110206cb9c4a92b5d988c2ffb2ba80084183dea492383e44.'),
(43, '2026-03-13 08:49:11', 'SQLSTATE[23000]: Integrity constraint violation: 1048 Column \'dUnitSellingPrice\' cannot be null (Connection: mysql, Host: 127.0.0.1, Port: 3306, Database: lguph_hiramsDB, SQL: update `tblitemPricings` set `dUnitSellingPrice` = ? where `nItemPriceId` = 1)'),
(44, '2026-03-13 08:49:18', 'SQLSTATE[23000]: Integrity constraint violation: 1048 Column \'dUnitSellingPrice\' cannot be null (Connection: mysql, Host: 127.0.0.1, Port: 3306, Database: lguph_hiramsDB, SQL: update `tblitemPricings` set `dUnitSellingPrice` = ? where `nItemPriceId` = 1)'),
(45, '2026-03-13 09:04:19', 'SQLSTATE[23000]: Integrity constraint violation: 1048 Column \'dUnitSellingPrice\' cannot be null (Connection: mysql, Host: 127.0.0.1, Port: 3306, Database: lguph_hiramsDB, SQL: update `tblitemPricings` set `dUnitSellingPrice` = ? where `nItemPriceId` = 1)'),
(46, '2026-03-13 09:05:40', 'SQLSTATE[23000]: Integrity constraint violation: 1048 Column \'dUnitSellingPrice\' cannot be null (Connection: mysql, Host: 127.0.0.1, Port: 3306, Database: lguph_hiramsDB, SQL: update `tblitemPricings` set `dUnitSellingPrice` = ? where `nItemPriceId` = 1)'),
(47, '2026-03-13 09:33:45', 'Method Illuminate\\Database\\Eloquent\\Collection::sortByAsc does not exist.'),
(48, '2026-03-17 09:46:03', 'The client id field is required.'),
(49, '2026-03-17 09:46:44', 'The client id field is required.'),
(50, '2026-03-17 09:47:14', 'The client id field is required.'),
(51, '2026-03-17 09:47:15', 'The client id field is required.');

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
(1, 1, 'Landbank', 'sd', '090909090909'),
(2, 1, 'sd', 'sd', '00000000000'),
(6, 13, 'sd', '454', '454545454545'),
(7, 13, 'we', 'we', '3434343434'),
(8, 13, 'erer', 'er', '090909090909090'),
(9, 2, 'a', 'as', '090978675658999');

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
(1, 1, 'Joanne Gagarin', '09277640694', NULL, NULL),
(2, 2, 'Princess Ruiz', '09277640694', NULL, NULL),
(7, 13, 'sd', '09090909090', NULL, NULL),
(8, 13, 'asd', '09090909090', NULL, NULL),
(9, 13, 'aas', '09090909090', NULL, NULL),
(10, 20, 'sd', '09212121212', NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `tblsuppliers`
--

CREATE TABLE `tblsuppliers` (
  `nSupplierId` bigint(20) UNSIGNED NOT NULL,
  `strSupplierName` varchar(100) NOT NULL,
  `strSupplierNickName` varchar(25) NOT NULL,
  `strAddress` varchar(200) DEFAULT NULL,
  `strTIN` varchar(17) DEFAULT NULL,
  `bVAT` tinyint(4) NOT NULL DEFAULT 0,
  `bEWT` tinyint(4) NOT NULL DEFAULT 0,
  `cStatus` char(1) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `tblsuppliers`
--

INSERT INTO `tblsuppliers` (`nSupplierId`, `strSupplierName`, `strSupplierNickName`, `strAddress`, `strTIN`, `bVAT`, `bEWT`, `cStatus`) VALUES
(1, 'Star Europhil Holdings Corporation', 'Europhil', 'Lumangbayan, Calapan City, Oriental Mindoroo', '008-422-425-00000', 1, 1, 'A'),
(2, 'VSTECS Phils. Inc.', 'VST', 'MSI-ECS Complex, M. Eusebio Ave., San Miguel NCR, Second District, Pasig City', '200-833-967-000', 1, 1, 'A'),
(13, 'sd', 'sd', NULL, NULL, 0, 1, 'I'),
(14, 'sd', 'sd', NULL, NULL, 0, 0, 'I'),
(15, 'Primeline', 'Primeline', NULL, NULL, 1, 0, 'A'),
(16, 'Huasan Trading', 'Huasan', NULL, NULL, 1, 0, 'A'),
(17, 'Learning tools Enterprises', 'LTE', 'San Vicente East, Calapan City', NULL, 1, 0, 'A'),
(18, 'King Zebra General Merchandise', 'KZ', 'San Vicente North, Calapan City', NULL, 1, 1, 'A'),
(19, 'Pandayan Bookshop', 'Pandayan', 'San Vicente East, Calapan City', NULL, 1, 1, 'A'),
(20, 'Handyman', 'HM', 'Lumangbayan, Calapan City', NULL, 0, 0, 'A'),
(21, 'Octagon', 'Octa', 'Camilmil, Calapan City', NULL, 0, 0, 'A');

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
(1, 1, '2026-02-25 14:15:13', 100, 45, NULL),
(2, 1, '2026-02-25 14:20:34', 110, 45, NULL),
(16, 1, '2026-02-25 14:35:13', 200, 30, NULL),
(17, 1, '2026-02-25 14:36:25', 210, 30, 'Assigned Transaction to Rei John Maulion'),
(18, 1, '2026-02-25 14:43:14', 220, 44, 'hey'),
(19, 1, '2026-02-25 14:45:14', 230, 30, NULL),
(20, 1, '2026-02-25 14:53:20', 240, 44, NULL),
(21, 1, '2026-02-25 14:56:20', 300, 30, NULL),
(22, 1, '2026-02-25 15:54:23', 240, 44, NULL),
(23, 1, '2026-02-25 15:54:42', 230, 30, NULL),
(24, 1, '2026-02-25 15:57:06', 240, 44, NULL),
(25, 1, '2026-02-25 15:57:29', 230, 30, NULL),
(26, 1, '2026-02-25 15:59:32', 240, 44, NULL),
(27, 1, '2026-02-25 15:59:55', 300, 30, NULL),
(28, 2, '2026-02-25 16:11:32', 100, 43, NULL),
(29, 2, '2026-02-25 16:12:17', 110, 43, NULL),
(30, 2, '2026-02-25 16:13:33', 200, 45, NULL),
(31, 2, '2026-02-25 16:14:20', 210, 44, 'Assigned Transaction to Rei John Maulion'),
(32, 2, '2026-02-25 16:21:49', 220, 44, NULL),
(33, 2, '2026-02-25 16:25:37', 230, 30, NULL),
(34, 2, '2026-02-25 16:31:37', 240, 44, NULL),
(35, 2, '2026-02-25 16:32:11', 300, 30, NULL),
(36, 3, '2026-02-26 14:19:08', 100, 45, NULL),
(37, 1, '2026-02-27 08:47:13', 310, 45, NULL),
(38, 1, '2026-02-27 08:54:45', 320, 30, NULL),
(39, 1, '2026-02-27 08:54:55', 310, 45, NULL),
(40, 1, '2026-02-27 08:57:00', 300, 30, NULL),
(41, 1, '2026-02-27 08:59:53', 310, 45, NULL),
(42, 1, '2026-02-27 09:00:33', 320, 30, NULL),
(43, 1, '2026-02-27 09:02:46', 310, 45, NULL),
(44, 1, '2026-02-27 09:07:54', 320, 30, NULL),
(45, 1, '2026-02-27 09:41:49', 310, 45, NULL),
(46, 1, '2026-02-27 09:46:14', 320, 30, NULL),
(47, 1, '2026-02-27 09:46:34', 310, 45, NULL),
(48, 2, '2026-02-27 09:51:18', 310, 43, NULL),
(49, 2, '2026-02-27 10:02:39', 300, 30, NULL),
(50, 2, '2026-02-27 10:02:49', 310, 43, NULL),
(51, 1, '2026-02-27 10:02:59', 320, 43, NULL),
(52, 4, '2026-02-27 10:03:57', 100, 43, NULL),
(53, 4, '2026-02-27 10:04:05', 110, 43, NULL),
(54, 4, '2026-02-27 10:04:15', 100, 43, NULL),
(55, 4, '2026-02-27 10:04:25', 110, 43, NULL),
(56, 4, '2026-02-27 10:05:02', 200, 45, NULL),
(57, 4, '2026-02-27 10:06:38', 110, 43, NULL),
(58, 4, '2026-02-27 10:06:46', 200, 30, NULL),
(59, 4, '2026-02-27 10:06:59', 210, 30, 'Assigned Transaction to Rei John Maulion'),
(60, 4, '2026-02-27 10:07:45', 220, 44, NULL),
(61, 4, '2026-02-27 10:07:55', 210, 30, NULL),
(62, 4, '2026-02-27 10:08:05', 220, 44, NULL),
(63, 4, '2026-02-27 10:08:15', 210, 30, NULL),
(64, 4, '2026-02-27 10:08:26', 220, 44, NULL),
(65, 4, '2026-02-27 10:08:54', 230, 46, NULL),
(66, 4, '2026-02-27 10:09:23', 220, 44, NULL),
(67, 4, '2026-02-27 10:09:32', 230, 30, NULL),
(68, 4, '2026-02-27 10:11:11', 240, 44, NULL),
(69, 4, '2026-02-27 10:11:49', 300, 46, NULL),
(70, 4, '2026-02-27 10:12:18', 240, 44, NULL),
(71, 4, '2026-02-27 10:12:46', 230, 30, NULL),
(72, 4, '2026-02-27 10:12:58', 220, 44, NULL),
(73, 4, '2026-02-27 10:13:15', 210, 30, NULL),
(74, 4, '2026-02-27 10:20:30', 220, 44, NULL),
(75, 4, '2026-02-27 10:23:53', 230, 46, NULL),
(76, 4, '2026-02-27 10:28:22', 220, 44, NULL),
(77, 4, '2026-02-27 10:28:59', 210, 30, NULL),
(78, 4, '2026-02-27 10:29:51', 220, 44, NULL),
(79, 4, '2026-02-27 10:30:30', 230, 46, NULL),
(80, 4, '2026-02-27 10:34:12', 240, 44, NULL),
(81, 4, '2026-02-27 10:35:03', 300, 30, NULL),
(82, 4, '2026-02-27 10:35:20', 240, 44, NULL),
(83, 4, '2026-02-27 10:38:09', 300, 46, NULL),
(84, 4, '2026-02-27 10:51:03', 240, 44, NULL),
(85, 4, '2026-02-27 10:51:09', 230, 46, NULL),
(86, 4, '2026-02-27 11:07:36', 220, 44, NULL),
(87, 2, '2026-02-27 12:56:09', 300, 30, NULL),
(88, 2, '2026-02-27 12:58:28', 310, 43, NULL),
(89, 2, '2026-02-27 13:04:35', 300, 30, NULL),
(90, 2, '2026-02-27 13:05:20', 310, 43, NULL),
(91, 4, '2026-02-27 13:16:12', 230, 46, NULL),
(92, 5, '2026-02-27 15:03:35', 100, 45, NULL),
(93, 6, '2026-02-27 15:14:16', 100, 45, NULL),
(94, 6, '2026-02-27 15:16:27', 110, 45, 'ppp'),
(95, 4, '2026-02-27 15:26:43', 240, 44, NULL),
(96, 4, '2026-02-27 15:28:17', 230, 46, NULL),
(97, 6, '2026-02-27 15:29:02', 200, 43, NULL),
(98, 4, '2026-02-27 15:41:38', 240, 44, NULL),
(99, 4, '2026-02-27 15:51:12', 230, 46, NULL),
(100, 2, '2026-02-27 16:10:34', 300, 30, NULL),
(101, 4, '2026-02-27 20:56:15', 220, 44, NULL),
(102, 4, '2026-02-27 21:04:38', 230, 46, NULL),
(103, 4, '2026-02-27 21:05:12', 240, 44, NULL),
(104, 4, '2026-02-27 21:05:18', 230, 46, NULL),
(105, 4, '2026-02-27 21:20:00', 240, 44, NULL),
(106, 4, '2026-02-27 21:20:15', 230, 46, NULL),
(107, 4, '2026-02-27 21:20:28', 220, 44, NULL),
(108, 4, '2026-02-27 21:27:16', 230, 30, NULL),
(109, 4, '2026-02-27 21:27:43', 220, 44, NULL),
(110, 4, '2026-02-27 21:29:49', 230, 30, NULL),
(111, 4, '2026-02-27 21:37:15', 220, 44, NULL),
(112, 4, '2026-02-27 21:37:36', 230, 30, NULL),
(113, 4, '2026-02-27 21:40:34', 220, 44, NULL),
(114, 4, '2026-02-27 21:41:22', 210, 30, NULL),
(115, 4, '2026-02-27 21:44:06', 220, 44, NULL),
(116, 4, '2026-02-27 21:45:52', 210, 30, NULL),
(117, 4, '2026-02-27 21:54:49', 220, 44, NULL),
(118, 4, '2026-02-27 21:58:53', 230, 30, NULL),
(119, 4, '2026-02-27 21:59:51', 220, 44, NULL),
(120, 4, '2026-02-27 22:06:07', 230, 30, NULL),
(121, 4, '2026-02-27 22:06:26', 220, 44, NULL),
(122, 4, '2026-02-27 22:06:45', 230, 30, NULL),
(123, 4, '2026-02-27 22:10:53', 220, 44, NULL),
(124, 4, '2026-02-27 22:11:22', 230, 30, NULL),
(125, 4, '2026-02-27 22:15:12', 220, 44, NULL),
(126, 4, '2026-02-27 22:16:05', 210, 30, NULL),
(127, 4, '2026-02-27 22:16:27', 220, 44, NULL),
(128, 4, '2026-02-27 22:16:41', 230, 46, NULL),
(129, 4, '2026-02-27 22:17:13', 210, 44, 'Reassigned Transaction to Jayfer Mendoza'),
(130, 4, '2026-02-27 22:17:29', 220, 46, NULL),
(131, 4, '2026-02-27 22:17:59', 230, 44, NULL),
(132, 4, '2026-02-27 22:20:01', 220, 46, NULL),
(133, 4, '2026-02-27 22:20:21', 230, 30, NULL),
(134, 4, '2026-02-27 22:20:40', 220, 46, NULL),
(135, 4, '2026-02-27 22:21:27', 230, 30, NULL),
(136, 4, '2026-02-27 22:24:42', 220, 46, NULL),
(137, 4, '2026-02-27 22:24:57', 230, 30, NULL),
(138, 4, '2026-02-27 22:29:23', 220, 46, NULL),
(139, 4, '2026-02-27 22:30:02', 230, 30, NULL),
(140, 4, '2026-02-27 22:30:43', 210, 44, 'Reassigned Transaction to Rei John Maulion'),
(141, 4, '2026-02-27 22:30:59', 220, 44, NULL),
(142, 4, '2026-02-27 22:31:15', 230, 30, NULL),
(143, 4, '2026-02-27 22:31:45', 240, 44, NULL),
(144, 4, '2026-02-27 22:32:10', 300, 30, NULL),
(145, 2, '2026-02-27 22:41:59', 310, 43, NULL),
(146, 4, '2026-02-27 22:43:07', 240, 44, NULL),
(147, 4, '2026-02-27 22:43:21', 300, 30, NULL),
(148, 2, '2026-02-28 14:53:33', 320, 45, NULL),
(149, 1, '2026-02-28 15:02:00', 310, 45, NULL),
(150, 1, '2026-02-28 15:02:08', 320, 30, NULL),
(151, 1, '2026-02-28 15:02:15', 310, 45, NULL),
(152, 1, '2026-02-28 15:02:20', 300, 30, NULL),
(153, 1, '2026-02-28 15:09:07', 310, 45, NULL),
(154, 1, '2026-02-28 15:10:02', 320, 30, NULL),
(155, 1, '2026-02-28 15:14:24', 310, 45, NULL),
(156, 1, '2026-02-28 15:32:56', 300, 30, NULL),
(157, 2, '2026-02-28 15:33:24', 310, 43, NULL),
(158, 2, '2026-02-28 15:33:32', 300, 30, NULL),
(159, 4, '2026-03-02 12:54:33', 240, 44, NULL),
(160, 4, '2026-03-02 12:54:39', 230, 30, NULL),
(161, 4, '2026-03-02 13:09:57', 220, 44, NULL),
(162, 4, '2026-03-02 13:10:03', 210, 44, NULL),
(163, 4, '2026-03-02 13:37:44', 220, 44, NULL),
(164, 4, '2026-03-02 15:22:06', 210, 44, NULL),
(165, 4, '2026-03-02 15:42:33', 220, 44, NULL),
(166, 4, '2026-03-02 16:01:44', 230, 30, NULL),
(167, 1, '2026-03-05 09:58:28', 240, 44, NULL),
(168, 7, '2026-03-05 12:33:47', 100, 45, NULL),
(169, 7, '2026-03-05 12:34:39', 110, 45, NULL),
(170, 7, '2026-03-05 13:22:54', 200, 30, NULL),
(171, 7, '2026-03-05 13:46:33', 210, 44, 'Assigned Transaction to Rei John Maulion'),
(172, 7, '2026-03-05 13:48:22', 220, 44, 'Hmp'),
(173, 7, '2026-03-05 13:50:11', 230, 30, NULL),
(174, 7, '2026-03-05 13:58:41', 240, 44, NULL),
(175, 7, '2026-03-05 14:01:42', 300, 30, NULL),
(176, 8, '2026-03-05 14:26:32', 100, 45, NULL),
(177, 8, '2026-03-05 14:27:03', 110, 45, NULL),
(178, 8, '2026-03-05 14:27:36', 200, 30, NULL),
(179, 8, '2026-03-05 14:28:15', 210, 44, 'Assigned Transaction to Rei John Maulion'),
(180, 8, '2026-03-05 14:29:28', 200, 30, NULL),
(181, 8, '2026-03-05 14:30:46', 110, 45, NULL),
(182, 8, '2026-03-05 14:30:58', 100, 45, NULL),
(183, 8, '2026-03-05 14:32:02', 110, 45, NULL),
(184, 8, '2026-03-05 14:32:46', 200, 30, NULL),
(185, 8, '2026-03-05 14:33:37', 110, 45, NULL),
(186, 8, '2026-03-05 14:33:45', 100, 45, NULL),
(187, 8, '2026-03-05 14:35:12', 110, 45, NULL),
(188, 8, '2026-03-05 14:35:46', 200, 30, NULL),
(189, 8, '2026-03-05 14:36:45', 210, 44, 'Assigned Transaction to Rei John Maulion'),
(190, 8, '2026-03-05 14:41:01', 220, 44, 'For Finalize'),
(191, 8, '2026-03-05 14:41:38', 230, 30, NULL),
(192, 8, '2026-03-05 14:50:53', 220, 44, NULL),
(193, 8, '2026-03-05 14:51:13', 210, 44, NULL),
(194, 8, '2026-03-05 15:08:13', 220, 44, NULL),
(195, 1, '2026-03-05 15:24:08', 300, 46, NULL),
(196, 8, '2026-03-05 15:33:33', 230, 46, NULL),
(197, 4, '2026-03-05 15:35:28', 220, 44, NULL),
(198, 4, '2026-03-05 15:35:36', 210, 44, NULL),
(199, 4, '2026-03-05 15:36:16', 220, 44, NULL),
(200, 4, '2026-03-05 15:59:51', 210, 44, NULL),
(201, 8, '2026-03-06 09:23:09', 220, 44, NULL),
(202, 8, '2026-03-06 09:23:18', 210, 44, NULL),
(203, 8, '2026-03-06 10:29:39', 220, 44, 'pa verify po'),
(204, 8, '2026-03-06 10:30:05', 230, 30, 'Oki po'),
(205, 4, '2026-03-06 13:15:37', 220, 44, NULL),
(206, 4, '2026-03-06 13:16:23', 230, 30, NULL),
(207, 6, '2026-03-06 14:56:57', 110, 45, NULL),
(208, 4, '2026-03-06 16:14:00', 220, 44, NULL),
(209, 4, '2026-03-06 16:14:05', 210, 44, NULL),
(210, 6, '2026-03-09 10:08:33', 100, 45, NULL),
(211, 7, '2026-03-09 10:13:55', 240, 44, NULL),
(212, 7, '2026-03-09 10:14:01', 230, 30, NULL),
(213, 7, '2026-03-09 10:14:08', 220, 44, NULL),
(214, 7, '2026-03-09 10:14:14', 210, 44, NULL),
(215, 6, '2026-03-09 10:17:32', 110, 45, NULL),
(216, 6, '2026-03-09 10:18:21', 200, 43, NULL),
(217, 6, '2026-03-09 10:22:39', 210, 44, 'Assigned Transaction to Rei John Maulion'),
(218, 7, '2026-03-09 10:22:59', 220, 44, NULL),
(219, 4, '2026-03-09 10:24:09', 210, 44, 'Reassigned Transaction to Jayfer Mendoza'),
(220, 4, '2026-03-09 10:24:58', 220, 46, NULL),
(221, 6, '2026-03-09 10:48:15', 220, 44, NULL),
(222, 6, '2026-03-09 10:48:35', 210, 44, NULL),
(223, 6, '2026-03-09 10:49:18', 220, 44, NULL),
(224, 6, '2026-03-09 11:17:45', 210, 44, NULL),
(225, 6, '2026-03-09 16:24:49', 220, 44, NULL),
(226, 6, '2026-03-09 16:25:38', 230, 30, NULL),
(227, 4, '2026-03-09 16:40:48', 210, 44, NULL),
(228, 4, '2026-03-10 08:54:41', 220, 46, NULL),
(229, 4, '2026-03-10 08:55:02', 210, 44, NULL),
(230, 7, '2026-03-10 09:12:25', 210, 44, NULL),
(231, 8, '2026-03-10 10:48:38', 220, 44, NULL),
(232, 8, '2026-03-10 10:49:03', 210, 44, NULL),
(233, 8, '2026-03-10 10:51:02', 220, 44, NULL),
(234, 8, '2026-03-10 10:51:15', 230, 30, NULL),
(235, 9, '2026-03-10 14:52:30', 100, 42, NULL),
(236, 10, '2026-03-10 14:53:35', 100, 42, NULL),
(237, 4, '2026-03-11 09:27:00', 210, 42, 'Reassigned Transaction to Rei John Maulion'),
(238, 4, '2026-03-11 09:27:54', 200, 30, NULL),
(239, 4, '2026-03-11 09:28:25', 110, 43, NULL),
(240, 4, '2026-03-11 09:39:52', 200, 30, NULL),
(241, 4, '2026-03-11 09:45:04', 110, 43, NULL),
(242, 4, '2026-03-11 09:45:18', 200, 30, NULL),
(243, 4, '2026-03-11 09:46:53', 110, 43, NULL),
(244, 4, '2026-03-11 09:56:58', 200, 30, NULL),
(245, 4, '2026-03-11 09:57:18', 110, 43, NULL),
(246, 4, '2026-03-11 09:57:46', 200, 30, NULL),
(247, 4, '2026-03-11 09:59:44', 210, 42, 'Assigned Transaction to Jayfer Mendoza'),
(248, 4, '2026-03-11 10:01:21', 210, 42, 'Reassigned Transaction to Rei John Maulion'),
(249, 4, '2026-03-11 10:02:12', 200, 30, NULL),
(250, 4, '2026-03-11 10:02:39', 110, 43, NULL),
(251, 4, '2026-03-11 10:03:22', 200, 42, NULL),
(252, 4, '2026-03-11 10:03:30', 110, 43, NULL),
(253, 4, '2026-03-11 10:03:47', 200, 42, NULL),
(254, 4, '2026-03-11 11:38:21', 110, 43, NULL),
(255, 4, '2026-03-11 11:39:34', 100, 43, NULL),
(256, 4, '2026-03-11 11:43:43', 110, 43, NULL),
(257, 6, '2026-03-11 11:45:10', 210, 30, 'Reassigned Transaction to Rei John Maulion'),
(258, 4, '2026-03-11 12:14:53', 100, 43, NULL),
(259, 4, '2026-03-11 13:41:19', 110, 43, NULL),
(260, 4, '2026-03-11 13:50:33', 200, 43, NULL),
(261, 4, '2026-03-11 13:57:10', 200, 43, NULL),
(262, 4, '2026-03-11 13:58:35', 110, 43, NULL),
(263, 4, '2026-03-11 14:00:30', 100, 43, NULL),
(264, 4, '2026-03-11 14:00:38', 110, 43, NULL),
(265, 4, '2026-03-11 14:00:59', 100, 43, NULL),
(266, 4, '2026-03-11 14:02:57', 110, 43, NULL),
(267, 4, '2026-03-11 14:03:11', 100, 43, NULL),
(268, 4, '2026-03-11 14:07:34', 110, 43, NULL),
(269, 4, '2026-03-11 14:07:58', 100, 43, NULL),
(270, 4, '2026-03-11 14:12:06', 110, 43, NULL),
(271, 4, '2026-03-11 14:12:38', 200, 30, NULL),
(272, 4, '2026-03-11 14:14:27', 110, 43, NULL),
(273, 4, '2026-03-11 14:15:55', 200, 30, NULL),
(274, 4, '2026-03-11 14:19:45', 110, 43, NULL),
(275, 6, '2026-03-12 09:21:49', 220, 44, NULL),
(276, 6, '2026-03-12 09:22:07', 210, 30, NULL),
(277, 6, '2026-03-12 09:44:54', 220, 44, NULL),
(278, 6, '2026-03-12 09:46:04', 210, 30, NULL),
(279, 4, '2026-03-12 10:08:38', 100, 43, NULL),
(280, 4, '2026-03-12 10:23:05', 110, 43, 'Oi'),
(281, 4, '2026-03-12 10:23:56', 100, 43, NULL),
(282, 4, '2026-03-12 10:24:11', 110, 43, 'Hh'),
(283, 4, '2026-03-12 10:24:31', 200, 30, NULL),
(284, 6, '2026-03-12 10:25:05', 200, 43, NULL),
(285, 7, '2026-03-12 10:40:02', 220, 44, NULL),
(286, 7, '2026-03-12 10:41:17', 210, 44, NULL),
(287, 7, '2026-03-12 10:48:18', 220, 44, NULL),
(288, 7, '2026-03-12 10:49:05', 230, 30, NULL),
(289, 7, '2026-03-13 08:40:44', 210, 44, 'Reassigned Transaction to Jayfer Mendoza'),
(290, 11, '2026-03-13 08:47:47', 100, 45, NULL),
(291, 11, '2026-03-13 08:48:13', 110, 45, NULL),
(292, 7, '2026-03-13 08:58:40', 220, 46, NULL),
(293, 7, '2026-03-13 08:59:11', 230, 44, NULL),
(294, 11, '2026-03-13 09:28:43', 200, 30, NULL),
(295, 7, '2026-03-13 13:58:43', 220, 46, NULL),
(296, 7, '2026-03-13 13:58:49', 210, 44, NULL),
(297, 7, '2026-03-13 14:02:42', 210, 30, 'Reassigned Transaction to Jayfer Mendoza'),
(298, 7, '2026-03-13 14:02:51', 210, 30, 'Reassigned Transaction to Rei John Maulion'),
(299, 7, '2026-03-13 14:03:20', 220, 44, 'O'),
(300, 7, '2026-03-13 14:03:29', 230, 30, NULL),
(301, 7, '2026-03-13 14:50:09', 240, 44, NULL),
(302, 7, '2026-03-13 14:50:38', 300, 30, NULL),
(303, 4, '2026-03-13 16:03:06', 110, 43, NULL),
(304, 6, '2026-03-13 16:10:49', 210, 30, 'Assigned Transaction to Jayfer Mendoza'),
(305, 6, '2026-03-13 16:15:14', 200, 43, NULL),
(306, 4, '2026-03-16 08:49:30', 100, 43, NULL),
(307, 4, '2026-03-16 09:00:14', 110, 43, NULL),
(308, 11, '2026-03-16 09:06:42', 210, 30, 'Assigned Transaction to Rei John Maulion'),
(309, 6, '2026-03-16 09:25:24', 110, 45, NULL),
(310, 6, '2026-03-16 09:25:33', 100, 45, NULL),
(311, 8, '2026-03-16 09:29:00', 220, 44, NULL),
(312, 8, '2026-03-16 09:37:30', 230, 30, NULL),
(313, 7, '2026-03-16 09:45:23', 310, 45, NULL),
(314, 7, '2026-03-16 09:45:34', 310, 45, NULL),
(315, 7, '2026-03-16 09:46:46', 320, 30, NULL),
(316, 2, '2026-03-16 09:55:01', 310, 43, NULL),
(317, 2, '2026-03-16 09:57:10', 310, 43, NULL),
(318, 2, '2026-03-16 10:00:19', 310, 43, NULL),
(319, 2, '2026-03-16 10:01:01', 310, 43, NULL),
(320, 2, '2026-03-16 10:01:14', 300, 30, NULL),
(321, 4, '2026-03-16 10:01:44', 100, 43, NULL),
(322, 4, '2026-03-16 10:01:54', 110, 43, NULL),
(323, 4, '2026-03-16 10:06:13', 200, 45, NULL),
(324, 7, '2026-03-16 10:06:52', 310, 45, NULL),
(325, 6, '2026-03-16 10:19:25', 110, 45, NULL),
(326, 6, '2026-03-16 10:20:16', 200, 43, NULL),
(327, 11, '2026-03-16 10:34:45', 210, 44, 'Reassigned Transaction to Jayfer Mendoza'),
(328, 11, '2026-03-16 10:35:48', 220, 46, NULL),
(329, 11, '2026-03-16 10:36:20', 230, 44, NULL),
(330, 11, '2026-03-16 15:50:06', 220, 46, NULL),
(331, 11, '2026-03-16 15:50:22', 210, 44, NULL),
(332, 11, '2026-03-16 15:50:31', 220, 46, NULL),
(333, 11, '2026-03-17 08:57:47', 210, 44, NULL),
(334, 4, '2026-03-17 09:22:22', 210, 30, 'Assigned Transaction to Rei John Maulion'),
(335, 4, '2026-03-17 13:06:10', 220, 44, NULL),
(336, 4, '2026-03-17 13:06:45', 210, 30, NULL),
(337, 4, '2026-03-17 13:09:04', 220, 44, NULL),
(338, 4, '2026-03-17 13:09:32', 210, 30, 'O'),
(339, 4, '2026-03-17 13:13:24', 220, 44, NULL),
(340, 4, '2026-03-17 13:16:03', 210, 30, NULL),
(341, 4, '2026-03-17 13:16:17', 220, 44, NULL),
(342, 4, '2026-03-17 13:17:12', 210, 30, NULL),
(343, 4, '2026-03-17 13:19:37', 220, 44, NULL),
(344, 4, '2026-03-17 13:22:33', 210, 30, NULL),
(345, 4, '2026-03-17 13:23:08', 220, 44, NULL),
(346, 4, '2026-03-17 13:24:24', 210, 30, NULL),
(347, 8, '2026-03-17 13:25:44', 220, 44, NULL),
(348, 8, '2026-03-17 13:26:08', 230, 30, NULL),
(349, 8, '2026-03-17 13:27:06', 210, 44, 'Reassigned Transaction to Jayfer Mendoza'),
(350, 8, '2026-03-17 13:34:35', 210, 44, 'Reassigned Transaction to Rei John Maulion'),
(351, 6, '2026-03-17 13:36:13', 110, 45, NULL),
(352, 6, '2026-03-17 13:40:51', 200, 30, NULL),
(353, 11, '2026-03-17 13:42:08', 210, 30, 'Reassigned Transaction to Rei John Maulion'),
(354, 11, '2026-03-17 13:56:50', 220, 44, NULL),
(355, 11, '2026-03-17 13:58:30', 230, 30, NULL),
(356, 8, '2026-03-17 14:06:39', 220, 44, NULL),
(357, 8, '2026-03-17 14:18:28', 210, 44, NULL),
(358, 4, '2026-03-17 14:20:59', 200, 45, NULL),
(359, 4, '2026-03-17 14:22:02', 110, 43, NULL),
(360, 4, '2026-03-17 14:28:19', 100, 43, NULL),
(361, 4, '2026-03-17 14:30:11', 110, 43, NULL),
(362, 4, '2026-03-17 14:31:02', 200, 30, NULL),
(363, 4, '2026-03-17 14:33:49', 110, 43, NULL),
(364, 4, '2026-03-17 14:34:08', 100, 43, NULL),
(365, 4, '2026-03-17 14:34:54', 110, 43, NULL),
(366, 4, '2026-03-17 14:36:12', 100, 43, NULL),
(367, 4, '2026-03-17 14:40:23', 110, 43, NULL),
(368, 4, '2026-03-17 14:40:41', 100, 43, NULL),
(369, 4, '2026-03-17 14:46:16', 110, 43, NULL),
(370, 4, '2026-03-17 14:49:41', 200, 30, 'O'),
(371, 4, '2026-03-17 14:52:55', 210, 30, 'Assigned Transaction to Rei John Maulion'),
(372, 4, '2026-03-17 14:53:31', 220, 44, NULL),
(373, 4, '2026-03-17 14:57:35', 230, 30, NULL),
(374, 11, '2026-03-17 14:59:47', 240, 44, NULL),
(375, 11, '2026-03-17 15:03:45', 230, 30, NULL),
(376, 11, '2026-03-17 15:12:01', 240, 44, NULL),
(377, 11, '2026-03-17 15:19:13', 300, 30, NULL),
(378, 11, '2026-03-17 15:26:51', 240, 44, NULL),
(379, 11, '2026-03-17 15:27:09', 300, 30, NULL),
(380, 11, '2026-03-17 15:29:28', 240, 44, NULL),
(381, 11, '2026-03-17 15:29:36', 230, 30, NULL),
(382, 11, '2026-03-17 15:29:49', 240, 44, NULL),
(383, 11, '2026-03-17 15:30:24', 300, 30, NULL),
(384, 1, '2026-03-17 15:39:28', 310, 45, NULL),
(385, 1, '2026-03-17 15:40:12', 300, 46, NULL),
(386, 1, '2026-03-17 15:41:33', 310, 45, NULL),
(387, 1, '2026-03-17 15:58:26', 300, 46, NULL),
(388, 1, '2026-03-17 15:59:07', 310, 45, NULL),
(389, 7, '2026-03-17 16:36:54', 300, 30, NULL),
(390, 1, '2026-03-17 17:03:19', 300, 46, NULL),
(391, 1, '2026-03-17 17:12:53', 240, 44, NULL);

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
(1, 1, 1, 4, 'pcs', 'Power Station', '<p>Capacity 96,000mAh (or 300Wh) AC Output 230V 50Hz230 cap V tilde 50 cap Hz 230 50, 300W (Max) Type-C Output 5V-3A,9V-3A, 12V-3A,15V-3A,20V-5A5 cap V equals 3 cap A comma 9 cap V equal 3 cap A comma 12 cap V equal 3 cap A comma 15 cap V equal 3 cap A comma&nbsp;20 cap V equal 5 cap A 5V-3, 9V-3A, 12V-3A, 15V=3A,20V=5A USB A1/A2 Output 4.5V-5A, 5V 4.5A,5V-3A,9V-2A4.5 cap V equal 5 cap A comma 5 cap V equal 4.5 cap A comma 5 cap V equal 3 cap A comma 9 cap V equal 2 cap A , 4.5-5A,5V-4.5A,5V+3A,9V-2A DC Output 10-14.2V10 minus 14.2 cap V 10-14.2,120W (Max) Car Charge Output 10-14.2V10 minus 14.2 cap V 10-14.2. 120(W) Type-C+USB A1+A2 Combined Output 6A6 cap A 6A DC Input 11V-24V-5A11 cap V minus 24 cap V equals 5 cap A 11-24-5, 100w (max) (Solar/Adapter) VVA Charging Temperature 0°C-45°C</p>', NULL),
(2, 1, 2, 2, 'pcs', 'Geo-tagging Equipment', '<p>Display: 6.7 inch FHD+Super AMOLED Display (1080x2340 Pixels, 385ppi)   with Corning Gorilla Glass Victus+, 19.54:9 Aspect Ration,   120Hz Refresh Rate, 1900nits, peak brightmess, and punch-hole   OS Android 15 with One UI 7   RAM: Option of 8GB or 12GB   Storage: Options of 128GB or 256GB, expanded via microSD   Camera: Triple rear near camera (50MP main, 12MP iltra- wide, 5MP macro) and 32MP front camera   Battery: 5000mAh with fast charging support </p>', NULL),
(3, 1, 3, 1, 'pcs', 'Model Laptop: ASUS TUF Gaming F17 FX707ZR (LCD REPLACEMENT),', '<p> 17.3-inch, Full HD (1920x1080) IPS /IPS-level display., 144Hz</p>', NULL),
(4, 2, 1, 30, 'pcs', 'Notebook, 100 pages', '<p>100 pages, A4 size, lined paper, hardcover</p>', 4600),
(5, 2, 2, 100, 'pcs', 'Ballpoint Pen', '<p>Blue ink, 0.7mm tip, plastic barrel, smooth writing</p>', 3500),
(6, 2, 3, 20, 'pcs', 'Art Sketch Pad', '<p>A4 size, 50 sheets, acid-free paper, spiral bound</p>', 6000),
(11, 8, 1, 90, 'reams', 'A4 Bond Paper', '<p>70gsm 500\'s</p>', NULL),
(16, 8, 2, 40, 'reams', 'Long Bond Paper', '<p>70 gsm 500\'s</p>', 0),
(17, 8, 3, 2, 'reams', 'Specialty Paper', '<p>white A4 200gsm 100\'s</p>', 0),
(18, 8, 4, 2, 'reams', 'Specialty Paper', '<p>white 8.5x13 200gsm 100\'s</p>', 0),
(19, 8, 5, 8, 'pack', 'Photo Paper', '<p> A4 high glossy 180gsm 20\'s</p>', 0),
(20, 8, 6, 10, 'pack', 'Sticker Paper', '<p> A4 Glossy</p>', 0),
(21, 8, 7, 10, 'pack', 'Waterproof clear vinyl', '<p>sticker A4 20s</p>', 0),
(22, 8, 8, 2, 'reams', 'Multi colored paper', '<p>8.5x11 250\'s</p>', 0),
(23, 8, 9, 3, 'reams', 'Specialty Paper', '<p> white 8.5x11 200gsm 100\'s</p>', 0),
(24, 8, 10, 200, 'pcs', 'Expanded Envelope', '<p> Long Glossy Blue</p>', 0),
(25, 8, 11, 1, 'reams', 'White Folder', '<p> Long ordinary 16pts 100s</p>', 0),
(26, 8, 12, 1, 'reams', 'White Folder', '<p>A4 ordinary 16pts 100s</p>', 0),
(27, 8, 13, 4, 'reams', 'Laminating Film', '<p> 125 micron Long 100\'s</p>', 0),
(28, 8, 14, 4, 'reams', 'Laminating Film', '<p>125 micron A4 100\'s</p>', 0),
(29, 8, 15, 20, 'pcs', 'Certificate Holder', '<p>A4</p>', 0),
(30, 8, 16, 1, 'ream', 'File Folder', '<p> 14pts Long size Red 100\'s</p>', 0),
(31, 8, 17, 200, 'pcs', 'Clear Folder', '<p>Clear Plastic in front, A4, Blue</p>', 0),
(32, 8, 18, 20, 'bottles', 'Multi-purpose Glue', '<p> 130g</p>', 0),
(33, 8, 19, 30, 'pcs', 'double sided', '<p> 50M  tape, 30mm</p>', 0),
(34, 8, 20, 100, 'pcs', 'Masking Tape', '<p>1\"</p>', 0),
(35, 8, 21, 24, 'pcs', 'Scotch Tape', '<p> 1\"</p>', 0),
(36, 8, 22, 24, 'pcs', 'Permanent marker', '<p> refillable</p>', 0),
(37, 8, 23, 4, 'bottles', 'Ink Refill', '<p>664 Black, 70ml</p>', 0),
(38, 8, 24, 1, 'box', 'Paper Clip', '<p> small</p>', 0),
(39, 4, 3, 67, 'pcs', 'rt', '<p>hey</p>', 0),
(40, 4, 4, 4, 'pcs', 'Sample', '<p>specs</p>', 0),
(42, 6, 1, 3, 'pcs', 'as', '<p>er</p>', 56),
(43, 6, 4, 45, 'pcs', 'sd', '<p>erre</p>', 0),
(44, 6, 2, 67, 'pcs', 'we', '<p>rtrtrt</p>', 0),
(45, 6, 3, 45, 'sd', 'sd', 'er', 0),
(46, 6, 5, 45, 'er', 'er', 'edf45', 0),
(47, 6, 6, 3, '34', '34', '34', 0),
(48, 6, 7, 34, '34', '34', '34', 0),
(49, 6, 8, 67, 'pcs', '45', '<p>trrtrtrt</p>', 0),
(51, 4, 5, 45, 'pcs', 'gh', '<p>fghj</p>', 0),
(52, 7, 2, 10, 'pcs', 'Plasters', '<p>se</p>', 20000),
(53, 4, 1, 45, 'pcs', 'rter', '<p>rt</p>', 0),
(54, 4, 2, 45, 'pcs', 'rt', 'errrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrr tythnjtuuuuuuuuuuuuuuuuuuuuuuuuhtuuj  ujjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjj', 0),
(56, 7, 3, 10, 'pcs', 'Betadine', '<p>fg</p>', 10000),
(57, 7, 1, 10, 'pcs', 'Syringe', '<p><span style=\"background-color: rgb(255, 255, 0);\">makapal</span></p>', 20000),
(58, 11, 1, 34, 'pcs', 'we', '<p>2323232</p>', 45555);

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
(1, 3, 27, 44, '2026-02-25 14:36:00', 'Procurement for Power Supply and Electronics Equipment', 'RFNO-0001', 176000, 'R', 'G', 'TRCD-0001', 'P', '2026-02-25 12:00:00', 'Head Office, Brgy. Camilmil, Calapan City', '2026-02-28 12:00:00', 'Head Office, Brgy. Camilmil, Calapan City', '2026-03-05 12:00:00', 'Head Office, Brgy. Camilmil, Calapan City', '2026-03-10 12:00:00', 'Head Office, Brgy. Camilmil, Calapan City', 454, 'wertyr'),
(2, 1, 25, 44, '2026-02-25 16:14:00', 'Procurement of School Supplies – Notebooks, Pens, and Art Materials', 'RFNO-0002', NULL, 'R', 'G', 'TRCD-0002', 'W', NULL, NULL, NULL, NULL, '2026-03-15 12:00:00', 'Star Europhil, Calapan, Oriental Mindoro', NULL, NULL, NULL, NULL),
(4, 1, 38, 44, '2026-03-17 14:52:00', 'Procurement of IT Equipment and Computer Peripherals', 'RFNO-0003', 56000, 'R', 'G', 'TRCD-0003', 'W', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(6, 5, 27, NULL, NULL, 'Procurement of Office Supplies and Administrative Materials', 'RFNO-0004', 45000, 'R', 'G', 'TRCD-0004', 'W', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(7, 1, 27, 44, '2026-03-13 14:02:00', 'Procurement of Medical Supplies and First Aid Materials', 'RFNO-0005', 50000, 'R', 'G', 'TRCD-0005', 'P', NULL, NULL, NULL, NULL, '2026-03-20 12:00:00', NULL, NULL, NULL, NULL, NULL),
(8, 1, 38, 44, '2026-03-12 13:00:00', 'Purechase of School and Office Supplies', '26-541-03-002', 56490, 'R', 'G', '5881H', 'P', NULL, NULL, NULL, NULL, '2026-03-12 13:00:00', 'Maidlang II, Calapan City', NULL, NULL, NULL, NULL),
(11, 1, 26, 44, '2026-03-17 13:42:00', '\"SUPPLY AND DELIVERY OF ICT EQUIPMENT FOR THE PROJECT GENESIS OF MINSU\"', NULL, 290000, 'R', 'G', '5887D', 'O', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

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
  `bIsActive` tinyint(1) NOT NULL DEFAULT 1,
  `cStatus` char(1) NOT NULL,
  `dtLoggedIn` timestamp NULL DEFAULT NULL,
  `dtCreatedAt` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `tblusers`
--

INSERT INTO `tblusers` (`nUserId`, `strFName`, `strMName`, `strLName`, `strNickName`, `cUserType`, `strProfileImage`, `cSex`, `strEmail`, `strUserName`, `strPassword`, `remember_token`, `bIsActive`, `cStatus`, `dtLoggedIn`, `dtCreatedAt`) VALUES
(30, 'Hilda', 'Medina', 'Arago', 'Hildz', 'G', '30_1773799646.jpg', 'F', 'hilda@gmail.com', 'hilda', '$2y$12$UM2mBKdpWU4eTJA9b6zGSeOC61mviZRbngNilnqKjQPZckfecXFu2', '', 0, 'A', '2026-03-18 04:27:45', '2026-01-06 01:52:04'),
(42, 'Ryan', NULL, 'Arago', 'Ry', 'M', '42_1773195342.jpg', 'M', 'ryan.arago@yahoo.com', 'tiger88', '$2y$12$nadD6z67NF1DwPE20uABO.TCcjR/dTWK96HzsemnqStA1k44X.Bnu', NULL, 1, 'A', '2026-03-18 04:27:41', '2026-01-06 01:52:04'),
(43, 'Jo-Anne', 'Motol', 'Luistro', 'Jo', 'Y', '43_1772609336.jpg', 'F', 'joanneluistro@gmail.com', 'joluistro', '$2y$12$5hPW7H2sPAL8l7xA3A2EZOGwIzRA.jhYzb7YXhkpDeBKNNc3fCBk6', NULL, 1, 'A', '2026-03-18 03:17:26', '2026-01-06 01:52:04'),
(44, 'Rei John', 'Martinez', 'Maulion', 'RJ', 'X', '44_1772691082.jpg', 'M', 'reijohn21@gmail.com', 'rj', '$2y$12$sP8YtrsDaRGzT3tl3E.X0.9dXWyK5XuaFM0VIMTcNOGGMadxXbkw6', NULL, 1, 'A', '2026-03-18 04:26:41', '2026-02-06 01:52:04'),
(45, 'Jonathan', 'Cadabuna', 'Pacaonces', 'Nathan', 'P', '45_1772594087.jpg', 'M', 'hiramsjonathan@gmail.com', 'Jonathan', '$2y$12$Jl87QJWKvrsC34O5EP65fe2lfPfhT2D3wOw.ijXaryPTNZuWcSLeK', NULL, 1, 'A', '2026-03-18 04:24:42', '2026-01-06 01:52:04'),
(46, 'Jayfer', 'Manalo', 'Mendoza', 'Jay', 'A', '46_1773647341.jpeg', 'M', 'johnrussdln@gmail.com', '@Jayfer06', '$2y$12$wKiGMoZeZWBCcbTpqjkX2e028.lwx0b4rca9JbGAvy4WNJqyM.vDy', NULL, 1, 'A', '2026-03-18 04:25:30', '2026-02-06 01:52:04');

--
-- Indexes for dumped tables
--

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
-- Indexes for table `personal_access_tokens`
--
ALTER TABLE `personal_access_tokens`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `personal_access_tokens_token_unique` (`token`),
  ADD KEY `personal_access_tokens_tokenable_type_tokenable_id_index` (`tokenable_type`,`tokenable_id`),
  ADD KEY `personal_access_tokens_expires_at_index` (`expires_at`);

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
-- Indexes for table `tbldirectcost`
--
ALTER TABLE `tbldirectcost`
  ADD PRIMARY KEY (`nDirectCostID`);

--
-- Indexes for table `tbldirectcostoptions`
--
ALTER TABLE `tbldirectcostoptions`
  ADD PRIMARY KEY (`nDirectCostOptionID`);

--
-- Indexes for table `tblitempricings`
--
ALTER TABLE `tblitempricings`
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
  ADD PRIMARY KEY (`nUserId`),
  ADD UNIQUE KEY `strUserName` (`strUserName`),
  ADD UNIQUE KEY `strEmail` (`strEmail`);

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
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `migrations`
--
ALTER TABLE `migrations`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=24;

--
-- AUTO_INCREMENT for table `personal_access_tokens`
--
ALTER TABLE `personal_access_tokens`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=305;

--
-- AUTO_INCREMENT for table `tblclients`
--
ALTER TABLE `tblclients`
  MODIFY `nClientId` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=39;

--
-- AUTO_INCREMENT for table `tblcompanies`
--
ALTER TABLE `tblcompanies`
  MODIFY `nCompanyId` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `tbldirectcost`
--
ALTER TABLE `tbldirectcost`
  MODIFY `nDirectCostID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- AUTO_INCREMENT for table `tbldirectcostoptions`
--
ALTER TABLE `tbldirectcostoptions`
  MODIFY `nDirectCostOptionID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT for table `tblitempricings`
--
ALTER TABLE `tblitempricings`
  MODIFY `nItemPriceId` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=25;

--
-- AUTO_INCREMENT for table `tblpricingsets`
--
ALTER TABLE `tblpricingsets`
  MODIFY `nPricingSetId` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `tblpurchaseoptions`
--
ALTER TABLE `tblpurchaseoptions`
  MODIFY `nPurchaseOptionId` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=51;

--
-- AUTO_INCREMENT for table `tblsqlerrors`
--
ALTER TABLE `tblsqlerrors`
  MODIFY `nErrorId` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=52;

--
-- AUTO_INCREMENT for table `tblsupplierbanks`
--
ALTER TABLE `tblsupplierbanks`
  MODIFY `nSupplierBankId` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `tblsuppliercontacts`
--
ALTER TABLE `tblsuppliercontacts`
  MODIFY `nSupplierContactId` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `tblsuppliers`
--
ALTER TABLE `tblsuppliers`
  MODIFY `nSupplierId` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=22;

--
-- AUTO_INCREMENT for table `tbltransactionhistories`
--
ALTER TABLE `tbltransactionhistories`
  MODIFY `nTransactionHistoryId` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=392;

--
-- AUTO_INCREMENT for table `tbltransactionitems`
--
ALTER TABLE `tbltransactionitems`
  MODIFY `nTransactionItemId` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=59;

--
-- AUTO_INCREMENT for table `tbltransactions`
--
ALTER TABLE `tbltransactions`
  MODIFY `nTransactionId` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT for table `tblusers`
--
ALTER TABLE `tblusers`
  MODIFY `nUserId` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=103;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
