<?php
// Compress Audio Endpoint
// Optimizes uploaded files to Opus 16k mono for fast transcription

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

    // --- FFMPEG CONFIG ---
    $ffmpeg_exe = 'ffmpeg'; // Default system path
    
    // User Provided Path High Priority
    $possible_paths = [
        'C:\ffmpeg\bin\ffmpeg.exe',
        'C:\ffmpeg\ffmpeg.exe'
    ];
    
    foreach ($possible_paths as $path) {
        if (file_exists($path)) {
            $ffmpeg_exe = '"' . $path . '"';
            break;
        }
    }

    $tempDir = sys_get_temp_dir();
    $originalName = $_FILES['file']['name'];
    $ext = pathinfo($originalName, PATHINFO_EXTENSION);
    $inputFile = $tempDir . DIRECTORY_SEPARATOR . 'raw_' . uniqid() . '.' . $ext;
    $outputFile = $tempDir . DIRECTORY_SEPARATOR . 'compressed_' . uniqid() . '.opus';

    // Move uploaded file
    if (!move_uploaded_file($_FILES['file']['tmp_name'], $inputFile)) {
        throw new Exception("Failed to move uploaded file");
    }

    // FFmpeg Command Optimized for SPEED:
    $cmd = sprintf(
        '%s -y -i "%s" -vn -ac 1 -ar 16000 -c:a libopus -b:a 16k -vbr on -compression_level 0 -application voip -map_metadata -1 "%s" 2>&1',
        $ffmpeg_exe,
        $inputFile,
        $outputFile
    );

    $output = [];
    $return_var = 0;
    exec($cmd, $output, $return_var);

    if ($return_var !== 0 || !file_exists($outputFile)) {
         // Fallback if libopus is missing
         $cmdFallback = sprintf(
            '%s -y -i "%s" -vn -ac 1 -ar 16000 -b:a 16k -f opus -map_metadata -1 "%s" 2>&1',
            $ffmpeg_exe,
            $inputFile,
            $outputFile
        );
        exec($cmdFallback, $output, $return_var);
        
        if ($return_var !== 0 || !file_exists($outputFile)) {
             throw new Exception("FFmpeg Compression Failed: " . implode("\n", array_slice($output, -10)));
        }
    }

    // Read Result
    $fileContent = file_get_contents($outputFile);
    $base64 = base64_encode($fileContent);
    $fileSize = filesize($outputFile);

    // Cleanup
    @unlink($inputFile);
    @unlink($outputFile);

    $response = [
        "success" => true,
        "filename" => pathinfo($originalName, PATHINFO_FILENAME) . ".opus",
        "size" => $fileSize,
        "base64" => $base64,
        "mimeType" => "audio/ogg" // Opus usually wrapped in OGG container
    ];

} catch (Exception $e) {
    $response = ["error" => $e->getMessage()];
}

ob_end_clean();
echo json_encode($response);
?>