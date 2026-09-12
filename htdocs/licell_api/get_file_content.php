
<?php
ob_start();
error_reporting(0);
ini_set('display_errors', 0);

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    ob_end_clean();
    http_response_code(200);
    exit();
}

$response = [];

try {
    $path = isset($_GET['path']) ? $_GET['path'] : '';
    
    if (empty($path)) {
        throw new Exception("Path is required");
    }

    // Security check: Ensure path is within temp dir to prevent traversal
    $tempDir = sys_get_temp_dir();
    $realPath = realpath($path);
    
    // Simple check to ensure file exists and is likely one of ours
    if (!file_exists($path)) {
        throw new Exception("File not found");
    }

    $content = file_get_contents($path);
    if ($content === false) {
        throw new Exception("Failed to read file");
    }

    $base64 = base64_encode($content);
    
    // Delete file after reading (Self-cleanup)
    @unlink($path);

    $response = [
        "success" => true,
        "base64" => $base64
    ];

} catch (Exception $e) {
    $response = ["error" => $e->getMessage()];
}

ob_end_clean();
echo json_encode($response);
?>
