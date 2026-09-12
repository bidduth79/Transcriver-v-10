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
    // 1. Check Upload Limits
    if (empty($_FILES) && empty($_POST) && isset($_SERVER['CONTENT_LENGTH']) && $_SERVER['CONTENT_LENGTH'] > 0) {
        throw new Exception("File too large! Check upload_max_filesize in php.ini");
    }

    if (!isset($_FILES['file'])) {
        throw new Exception("No file uploaded");
    }
    
    if ($_FILES['file']['error'] !== UPLOAD_ERR_OK) {
        $msg = "Upload error code: " . $_FILES['file']['error'];
        if ($_FILES['file']['error'] === UPLOAD_ERR_INI_SIZE || $_FILES['file']['error'] === UPLOAD_ERR_FORM_SIZE) {
            $msg = "File too large (Max: " . ini_get('upload_max_filesize') . "). Check php.ini settings.";
        }
        throw new Exception($msg);
    }

    $startTime = isset($_POST['start']) ? $_POST['start'] : '00:00:00';
    $endTime = isset($_POST['end']) ? $_POST['end'] : '00:00:10';
    
    // --- FFMPEG CONFIGURATION ---
    $ffmpeg_exe = 'ffmpeg'; 
    
    $possible_paths = [
        'C:\ffmpeg\bin\ffmpeg.exe',           
        'C:\ffmpeg\ffmpeg.exe',
        'C:\xampp\ffmpeg\bin\ffmpeg.exe',
        __DIR__ . '\ffmpeg.exe',
        __DIR__ . '\bin\ffmpeg.exe'
    ];

    foreach ($possible_paths as $path) {
        if (file_exists($path)) {
            $ffmpeg_exe = '"' . $path . '"';
            break;
        }
    }

    // Diagnostic check
    $test_cmd = "$ffmpeg_exe -version 2>&1";
    exec($test_cmd, $test_output, $test_return);
    if ($test_return !== 0) {
        throw new Exception("FFmpeg not working. Please install FFmpeg at C:\\ffmpeg\\bin\\ffmpeg.exe");
    }

    $tempDir = sys_get_temp_dir();
    $originalName = $_FILES['file']['name'];
    $ext = strtolower(pathinfo($originalName, PATHINFO_EXTENSION));
    // Fallback extension if missing
    if (!$ext) $ext = "mp4";

    $inputFile = $tempDir . DIRECTORY_SEPARATOR . 'cut_in_' . uniqid() . '.' . $ext;
    $outputFile = $tempDir . DIRECTORY_SEPARATOR . 'cut_out_' . uniqid() . '.' . $ext;

    if (!move_uploaded_file($_FILES['file']['tmp_name'], $inputFile)) {
        throw new Exception("Failed to move uploaded file to temp dir");
    }

    // COMMAND: Re-encode is safer for accurate cutting
    $videoCodec = 'libx264';
    $audioCodec = 'aac';
    
    if (in_array($ext, ['mp3', 'wav', 'ogg', 'm4a', 'opus', 'aac', 'flac'])) {
        // Audio only
        $cmd = sprintf(
            '%s -y -i "%s" -ss %s -to %s -c:a copy "%s" 2>&1',
            $ffmpeg_exe, $inputFile, $startTime, $endTime, $outputFile
        );
    } else {
        // Video - Fast Preset
        $cmd = sprintf(
            '%s -y -ss %s -to %s -i "%s" -c:v %s -preset ultrafast -c:a %s -strict experimental "%s" 2>&1',
            $ffmpeg_exe, $startTime, $endTime, $inputFile, $videoCodec, $audioCodec, $outputFile
        );
    }

    $output = [];
    $return_var = 0;
    exec($cmd, $output, $return_var);

    if ($return_var !== 0 || !file_exists($outputFile) || filesize($outputFile) == 0) {
         // Fallback: Try stream copy
         $cmd_fallback = sprintf(
            '%s -y -i "%s" -ss %s -to %s -c copy "%s" 2>&1',
            $ffmpeg_exe, $inputFile, $startTime, $endTime, $outputFile
        );
        exec($cmd_fallback, $output, $return_var);
        
        if ($return_var !== 0 || !file_exists($outputFile) || filesize($outputFile) == 0) {
             throw new Exception("FFmpeg Error: " . implode("\n", array_slice($output, -5)));
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
        "filename" => "Cut_" . $originalName,
        "size" => $fileSize,
        "base64" => $base64,
        "format" => $ext
    ];

} catch (Exception $e) {
    $response = ["error" => $e->getMessage()];
}

ob_end_clean();
echo json_encode($response);
?>