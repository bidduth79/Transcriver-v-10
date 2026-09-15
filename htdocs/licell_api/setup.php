
<?php
// setup.php - Run this once to setup Database and Tables
include 'cors.php';
header('Content-Type: application/json');

// Disable error display to prevent HTML output breaking JSON
error_reporting(0);
ini_set('display_errors', 0);

$servername = "127.0.0.1";
$username = "root";
$password = ""; // Default XAMPP password

$response = [];

try {
    // 1. Connect to MySQL Server
    $conn = new PDO("mysql:host=$servername;charset=utf8mb4", $username, $password);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    $messages = [];

    // 2. Create Database
    $sqlDB = "CREATE DATABASE IF NOT EXISTS licell_studio CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci";
    $conn->exec($sqlDB);
    $messages[] = "Database 'licell_studio' ready.";

    // 3. Select Database
    $conn->exec("USE licell_studio");

    // 4. Create Tables SQL
    // NOTE: Using LONGTEXT for JSON fields to ensure compatibility with all XAMPP/MariaDB versions
    
    $tables = [
        "studio_history" => "CREATE TABLE IF NOT EXISTS studio_history (
            id VARCHAR(50) PRIMARY KEY,
            fileName VARCHAR(255) NOT NULL,
            transcript LONGTEXT,
            date DATETIME,
            timeTaken VARCHAR(50),
            size VARCHAR(50),
            duration VARCHAR(50),
            extension VARCHAR(20),
            publishedDate VARCHAR(100),
            channelName VARCHAR(255),
            isFavorite TINYINT(1) DEFAULT 0,
            bgbRemark LONGTEXT,
            summary LONGTEXT,
            title VARCHAR(255)
        )",
        
        "studio_reports" => "CREATE TABLE IF NOT EXISTS studio_reports (
            id VARCHAR(50) PRIMARY KEY,
            date DATETIME,
            searchTerm VARCHAR(255),
            fileName VARCHAR(255),
            content LONGTEXT
        )",
        
        "studio_analysis" => "CREATE TABLE IF NOT EXISTS studio_analysis (
            id VARCHAR(50) PRIMARY KEY,
            searchTerm VARCHAR(255),
            fileName VARCHAR(255),
            duration VARCHAR(50),
            speakerCount INT DEFAULT 0,
            matchCount INT DEFAULT 0,
            matchTimestamps LONGTEXT, 
            matchSentences LONGTEXT,
            date DATETIME,
            sentiment VARCHAR(50),
            remarkExplanation LONGTEXT
        )",
        
        "user_api_keys" => "CREATE TABLE IF NOT EXISTS user_api_keys (
            id VARCHAR(50) PRIMARY KEY,
            key_value VARCHAR(255) NOT NULL,
            label VARCHAR(100),
            status VARCHAR(50) DEFAULT 'active',
            addedAt DATETIME,
            type VARCHAR(50) DEFAULT 'user'
        )",
        
        "system_master_keys" => "CREATE TABLE IF NOT EXISTS system_master_keys (
            id VARCHAR(50) PRIMARY KEY,
            key_value VARCHAR(255) NOT NULL,
            label VARCHAR(100),
            status VARCHAR(50) DEFAULT 'active',
            addedAt DATETIME,
            type VARCHAR(50) DEFAULT 'master'
        )",
        
        "activity_logs" => "CREATE TABLE IF NOT EXISTS activity_logs (
            id VARCHAR(50) PRIMARY KEY,
            timestamp DATETIME,
            category VARCHAR(50),
            status VARCHAR(50),
            message LONGTEXT,
            details LONGTEXT
        )",
        
        "gemini_call_logs" => "CREATE TABLE IF NOT EXISTS gemini_call_logs (
            id VARCHAR(50) PRIMARY KEY,
            purpose VARCHAR(100),
            timestamp DATETIME,
            model VARCHAR(100),
            keyLabel VARCHAR(100)
        )",
        
        "global_stats" => "CREATE TABLE IF NOT EXISTS global_stats (
            id VARCHAR(50) PRIMARY KEY,
            total_api_calls INT DEFAULT 0
        )",
        
        "assistant_chat_history" => "CREATE TABLE IF NOT EXISTS assistant_chat_history (
            id VARCHAR(50) PRIMARY KEY,
            text LONGTEXT,
            sender VARCHAR(20),
            timestamp DATETIME
        )",
        
        "youtube_channels" => "CREATE TABLE IF NOT EXISTS youtube_channels (
            id VARCHAR(50) PRIMARY KEY,
            channelId VARCHAR(100) NOT NULL,
            title VARCHAR(255),
            thumbnailUrl VARCHAR(255),
            addedAt VARCHAR(50)
        )",
        
        "youtube_api_keys" => "CREATE TABLE IF NOT EXISTS youtube_api_keys (
            id VARCHAR(50) PRIMARY KEY,
            `key` VARCHAR(255) NOT NULL,
            label VARCHAR(100),
            isActive BOOLEAN DEFAULT 1,
            isExhausted BOOLEAN DEFAULT 0,
            exhaustedAt VARCHAR(50),
            isPrimary BOOLEAN DEFAULT 0,
            addedAt VARCHAR(50)
        )",
        
        "youtube_queue" => "CREATE TABLE IF NOT EXISTS youtube_queue (
            id VARCHAR(50) PRIMARY KEY,
            videoId VARCHAR(100) NOT NULL,
            channelId VARCHAR(100),
            channelTitle VARCHAR(255),
            title VARCHAR(255),
            description LONGTEXT,
            thumbnailUrl VARCHAR(255),
            publishedAt VARCHAR(100),
            duration VARCHAR(50),
            status VARCHAR(50) DEFAULT 'pending',
            progress INT DEFAULT 0,
            retryCount INT DEFAULT 0,
            error LONGTEXT,
            localPath VARCHAR(255),
            downloaded BOOLEAN DEFAULT 0,
            linkCopied BOOLEAN DEFAULT 0,
            isRead BOOLEAN DEFAULT 0,
            isLive BOOLEAN DEFAULT 0,
            isDeleted BOOLEAN DEFAULT 0,
            markedAt VARCHAR(50),
            format LONGTEXT
        )",
        
        "youtube_transcripts" => "CREATE TABLE IF NOT EXISTS youtube_transcripts (
            id VARCHAR(50) PRIMARY KEY,
            videoId VARCHAR(100),
            title VARCHAR(255),
            transcript LONGTEXT,
            date DATETIME
        )",
        
        "youtube_links" => "CREATE TABLE IF NOT EXISTS youtube_links (
            id VARCHAR(50) PRIMARY KEY,
            downloaded LONGTEXT,
            visited LONGTEXT,
            updatedAt DATETIME
        )"
    ];

    foreach ($tables as $name => $sql) {
        try {
            $conn->exec($sql);
            $messages[] = "Table '$name' checked/created.";
        } catch (PDOException $e) {
            $messages[] = "Error creating '$name': " . $e->getMessage();
        }
    }

    // Add missing columns to tables if they already existed
    try {
        $schemaUpdates = [
            'studio_history' => [
                'publishedDate' => 'VARCHAR(100)',
                'channelName' => 'VARCHAR(255)',
                'size' => 'VARCHAR(50)',
                'duration' => 'VARCHAR(50)',
                'extension' => 'VARCHAR(20)',
                'isFavorite' => 'TINYINT(1) DEFAULT 0',
                'bgbRemark' => 'LONGTEXT',
                'summary' => 'LONGTEXT',
                'title' => 'VARCHAR(255)'
            ],
            'youtube_api_keys' => [
                '`key`' => 'VARCHAR(255)',
                'exhaustedAt' => 'VARCHAR(50)',
                'isPrimary' => 'BOOLEAN DEFAULT 0',
                'addedAt' => 'VARCHAR(50)'
            ],
            'youtube_queue' => [
                'retryCount' => 'INT DEFAULT 0',
                'downloaded' => 'BOOLEAN DEFAULT 0',
                'linkCopied' => 'BOOLEAN DEFAULT 0',
                'isRead' => 'BOOLEAN DEFAULT 0',
                'isLive' => 'BOOLEAN DEFAULT 0',
                'isDeleted' => 'BOOLEAN DEFAULT 0',
                'markedAt' => 'VARCHAR(50)',
                'format' => 'LONGTEXT',
                'publishedAt' => 'VARCHAR(100)'
            ],
            'youtube_channels' => [
                'addedAt' => 'VARCHAR(50)'
            ]
        ];
        
        foreach ($schemaUpdates as $table => $columns) {
            foreach ($columns as $colName => $colType) {
                $cleanColName = str_replace('`', '', $colName);
                $result = $conn->query("SHOW COLUMNS FROM `$table` LIKE '$cleanColName'");
                if ($result->rowCount() == 0) {
                    $conn->exec("ALTER TABLE `$table` ADD COLUMN $colName $colType");
                    $messages[] = "Added column $cleanColName to $table.";
                }
            }
        }
    } catch (PDOException $e) {
        $messages[] = "Error altering tables: " . $e->getMessage();
    }

    // 5. Insert Default Data
    $conn->exec("INSERT IGNORE INTO global_stats (id, total_api_calls) VALUES ('global_stats_counter', 0)");
    
    // Optional: Seed Master Key if empty (Placeholder)
    // $conn->exec("INSERT IGNORE INTO system_master_keys (id, key_value, label, status, addedAt, type) VALUES ('master_01', 'AIzaSy_YOUR_KEY', 'Master Key', 'active', NOW(), 'master')");

    $response = [
        "status" => "success", 
        "messages" => $messages
    ];

} catch(PDOException $e) {
    $response = [
        "status" => "error", 
        "message" => "Connection failed: " . $e->getMessage()
    ];
}

echo json_encode($response);
?>
