
-- Database Name: licell_studio
CREATE DATABASE IF NOT EXISTS licell_studio CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE licell_studio;

-- 1. History Table
CREATE TABLE IF NOT EXISTS studio_history (
    id VARCHAR(50) PRIMARY KEY,
    fileName VARCHAR(255) NOT NULL,
    transcript LONGTEXT,
    date DATETIME,
    timeTaken VARCHAR(50),
    size VARCHAR(50),
    duration VARCHAR(50),
    extension VARCHAR(20)
);

-- 2. Reports Table
CREATE TABLE IF NOT EXISTS studio_reports (
    id VARCHAR(50) PRIMARY KEY,
    date DATETIME,
    searchTerm VARCHAR(255),
    fileName VARCHAR(255),
    content TEXT
);

-- 3. Search Analysis Table
CREATE TABLE IF NOT EXISTS studio_analysis (
    id VARCHAR(50) PRIMARY KEY,
    searchTerm VARCHAR(255),
    fileName VARCHAR(255),
    duration VARCHAR(50),
    speakerCount INT DEFAULT 0,
    matchCount INT DEFAULT 0,
    matchTimestamps JSON,
    matchSentences JSON,
    date DATETIME,
    sentiment VARCHAR(50),
    remarkExplanation TEXT
);

-- 4. User API Keys
CREATE TABLE IF NOT EXISTS user_api_keys (
    id VARCHAR(50) PRIMARY KEY,
    key_value VARCHAR(255) NOT NULL,
    label VARCHAR(100),
    status VARCHAR(50) DEFAULT 'active',
    addedAt DATETIME,
    type VARCHAR(50) DEFAULT 'user'
);

-- 5. Master Keys (System Fallback)
CREATE TABLE IF NOT EXISTS system_master_keys (
    id VARCHAR(50) PRIMARY KEY,
    key_value VARCHAR(255) NOT NULL,
    label VARCHAR(100),
    status VARCHAR(50) DEFAULT 'active',
    addedAt DATETIME,
    type VARCHAR(50) DEFAULT 'master'
);

-- 6. Activity Logs
CREATE TABLE IF NOT EXISTS activity_logs (
    id VARCHAR(50) PRIMARY KEY,
    timestamp DATETIME,
    category VARCHAR(50),
    status VARCHAR(50),
    message TEXT,
    details TEXT
);

-- 7. Gemini API Call Logs
CREATE TABLE IF NOT EXISTS gemini_call_logs (
    id VARCHAR(50) PRIMARY KEY,
    purpose VARCHAR(100),
    timestamp DATETIME,
    model VARCHAR(100),
    keyLabel VARCHAR(100)
);

-- 8. Global Stats
CREATE TABLE IF NOT EXISTS global_stats (
    id VARCHAR(50) PRIMARY KEY,
    total_api_calls INT DEFAULT 0
);

-- 9. Chatbot History
CREATE TABLE IF NOT EXISTS assistant_chat_history (
    id VARCHAR(50) PRIMARY KEY,
    text TEXT,
    sender VARCHAR(20),
    timestamp DATETIME
);

-- 10. YouTube Transcripts
CREATE TABLE IF NOT EXISTS youtube_transcripts (
    id VARCHAR(50) PRIMARY KEY,
    videoId VARCHAR(100),
    title VARCHAR(255),
    transcript LONGTEXT,
    date DATETIME
);

-- 11. YouTube Links
CREATE TABLE IF NOT EXISTS youtube_links (
    id VARCHAR(50) PRIMARY KEY,
    downloaded LONGTEXT,
    visited LONGTEXT,
    updatedAt DATETIME
);

-- SEED MASTER KEY (Change this value to your real key)
INSERT IGNORE INTO system_master_keys (id, key_value, label, status, addedAt, type) 
VALUES ('master_01', 'YOUR_REAL_GEMINI_API_KEY_HERE', 'System Master Key', 'active', NOW(), 'master');

INSERT IGNORE INTO global_stats (id, total_api_calls) VALUES ('global_stats_counter', 0);
