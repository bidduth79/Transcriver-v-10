<?php
ob_start();
error_reporting(0);
ini_set('display_errors', 0);
set_time_limit(0);
ini_set('memory_limit', '2048M');

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    ob_end_clean();
    http_response_code(200);
    exit();
}

$response = [];

try {
    if (!isset($_FILES['file']) || $_FILES['file']['error'] !== UPLOAD_ERR_OK) {
        throw new Exception("No file uploaded or upload error");
    }

    // Default 900s (15 min) if not provided, allowing caller to control size
    $segmentTime = isset($_POST['segment_time']) ? intval($_POST['segment_time']) : 900;
    
    // Safety check: Don't allow > 2400s (40 mins) to prevent output cutoff
    if ($segmentTime > 2400) $segmentTime = 2400;
    if ($segmentTime < 60) $segmentTime = 60;

    // --- FFMPEG CONFIG ---
    $ffmpeg_exe = 'ffmpeg'; // Default system path
    
    // User path priority
    $possible_paths = [
        'C:\ffmpeg\bin\ffmpeg.exe',
        'C:\ffmpeg\ffmpeg.exe',
        __DIR__ . '\ffmpeg.exe',
        __DIR__ . '\bin\ffmpeg.exe'
    ];

    foreach ($possible_paths as $path) {
        if (file_exists($path)) {
            $ffmpeg_exe = '"' . $path . '"';
            break;
        }
    }

    $tempDir = sys_get_temp_dir();
    $uniqueId = uniqid('seg_');
    $originalName = $_FILES['file']['name'];
    $ext = pathinfo($originalName, PATHINFO_EXTENSION);
    $inputFile = $tempDir . DIRECTORY_SEPARATOR . $uniqueId . '_input.' . $ext;
    
    // Move uploaded file
    if (!move_uploaded_file($_FILES['file']['tmp_name'], $inputFile)) {
        throw new Exception("Failed to move uploaded file");
    }

    // Output pattern for chunks
    $outputPattern = $tempDir . DIRECTORY_SEPARATOR . $uniqueId . '_%03d.opus';

    // FFmpeg Command to Split
    // -f segment: Enable segmentation
    // -segment_time: Duration of each segment
    // -c:a libopus: Convert to Opus for efficiency
    // -b:a 16k: Low bitrate for speech to text optimization
    // -vn: No video
    $cmd = sprintf(
        '%s -i "%s" -f segment -segment_time %d -c:a libopus -b:a 16k -vn -y "%s" 2>&1',
        $ffmpeg_exe,
        $inputFile,
        $segmentTime,
        $outputPattern
    );

    $output = [];
    $return_var = 0;
    exec($cmd, $output, $return_var);

    if ($return_var !== 0) {
         // Try fallback without libopus if not available
         $cmdFallback = sprintf(
            '%s -i "%s" -f segment -segment_time %d -b:a 16k -vn -y "%s" 2>&1',
            $ffmpeg_exe,
            $inputFile,
            $segmentTime,
            $outputPattern
        );
        exec($cmdFallback, $output, $return_var);
        
        if ($return_var !== 0) {
             throw new Exception("FFmpeg Segmentation Error: " . implode("\n", array_slice($output, -10)));
        }
    }

    // Find generated chunks
    $chunkFiles = glob($tempDir . DIRECTORY_SEPARATOR . $uniqueId . '_*.opus');
    sort($chunkFiles);

    $chunks = [];
    foreach ($chunkFiles as $index => $path) {
        $chunks[] = [
            "index" => $index,
            "path" => $path
        ];
    }

    // Cleanup input file (keep chunks for subsequent requests)
    @unlink($inputFile);

    $response = [
        "success" => true,
        "totalChunks" => count($chunks),
        "chunks" => $chunks
    ];

} catch (Exception $e) {
    $response = ["error" => $e->getMessage()];
}

ob_end_clean();
echo json_encode($response);
?>