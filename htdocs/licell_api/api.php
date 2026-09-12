
<?php
include 'cors.php';
include 'db_connect.php';

header('Content-Type: application/json');

// Disable error display to avoid breaking JSON response
error_reporting(0);
ini_set('display_errors', 0);

$action = isset($_GET['action']) ? $_GET['action'] : '';
$store = isset($_GET['store']) ? $_GET['store'] : '';

$tableMap = [
    'studio_history' => 'studio_history',
    'studio_reports' => 'studio_reports',
    'studio_analysis' => 'studio_analysis',
    'user_api_keys' => 'user_api_keys',
    'system_master_keys' => 'system_master_keys',
    'activity_logs' => 'activity_logs',
    'gemini_call_logs' => 'gemini_call_logs',
    'global_stats' => 'global_stats',
    'assistant_chat_history' => 'assistant_chat_history',
    'youtube_channels' => 'youtube_channels',
    'youtube_api_keys' => 'youtube_api_keys',
    'youtube_queue' => 'youtube_queue',
    'youtube_transcripts' => 'youtube_transcripts',
    'youtube_links' => 'youtube_links'
];

if (!array_key_exists($store, $tableMap) && $store !== '') {
    echo json_encode(["error" => "Invalid store name"]);
    exit();
}

$tableName = $tableMap[$store] ?? '';

try {
    // --- SAVE DATA (INSERT / UPDATE) ---
    if ($action === 'save' && $_SERVER['REQUEST_METHOD'] === 'POST') {
        $input = file_get_contents('php://input');
        $data = json_decode($input, true);

        if (!$data || !$tableName) {
            throw new Exception("Invalid data or store");
        }

        $columns = array_keys($data);
        $placeholders = array_map(function($key) { return ":$key"; }, $columns);
        $backticked_columns = array_map(function($key) { return "`$key`"; }, $columns);
        
        $updateString = "";
        foreach ($columns as $col) {
            if ($col !== 'id') {
                $updateString .= "`$col` = :update_$col, ";
                $data["update_$col"] = $data[$col];
            }
        }
        $updateString = rtrim($updateString, ", ");

        // Convert Arrays/Objects to JSON Strings for SQL Storage
        foreach ($data as $key => $value) {
            if (is_array($value) || is_object($value)) {
                $data[$key] = json_encode($value, JSON_UNESCAPED_UNICODE);
            } elseif (is_bool($value)) {
                $data[$key] = $value ? 1 : 0; // MySQL boolean compatibility
            }
        }

        $sql = "INSERT INTO `$tableName` (" . implode(", ", $backticked_columns) . ") 
                VALUES (" . implode(", ", $placeholders) . ") 
                ON DUPLICATE KEY UPDATE $updateString";

        $stmt = $conn->prepare($sql);
        $stmt->execute($data);
        echo json_encode(["success" => true, "id" => $data['id'] ?? null]);
    }

    // --- GET DATA ---
    else if ($action === 'get' && $_SERVER['REQUEST_METHOD'] === 'GET') {
        if (!$tableName) {
            echo json_encode([]);
            exit();
        }
        
        $stmt = $conn->prepare("SELECT * FROM $tableName");
        $stmt->execute();
        $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Auto-detect JSON strings and decode them back to arrays
        foreach ($results as &$row) {
            foreach ($row as $key => $value) {
                // Heuristic to check if string is JSON array or object
                if (is_string($value) && (str_starts_with($value, '[') || str_starts_with($value, '{'))) {
                    $decoded = json_decode($value, true);
                    if (json_last_error() === JSON_ERROR_NONE) {
                        $row[$key] = $decoded;
                    }
                }
            }
        }
        
        echo json_encode($results);
    }

    // --- DELETE DATA ---
    else if ($action === 'delete' && $_SERVER['REQUEST_METHOD'] === 'GET') {
        $id = isset($_GET['id']) ? $_GET['id'] : '';
        
        if (!$tableName || !$id) {
            throw new Exception("Missing ID or Store");
        }

        $stmt = $conn->prepare("DELETE FROM $tableName WHERE id = :id");
        $stmt->execute([':id' => $id]);
        echo json_encode(["success" => true]);
    }

    else {
        echo json_encode(["message" => "LiCell API Ready"]);
    }

} catch (Throwable $e) {
    http_response_code(500);
    $errorMsg = $e->getMessage();
    $json = json_encode(["error" => $errorMsg, "line" => $e->getLine(), "file" => $e->getFile()]);
    if ($json === false) {
        $json = json_encode(["error" => "An error occurred, but the message could not be JSON encoded: " . json_last_error_msg()]);
    }
    echo $json;
}
?>
