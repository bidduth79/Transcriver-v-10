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
    if (!isset($_FILES['files']) || !is_array($_FILES['files']['name']) || count($_FILES['files']['name']) < 2) {
        throw new Exception("At least two files are required to join.");
    }

    // --- FFMPEG CONFIG ---
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

    // Test FFmpeg
    exec("$ffmpeg_exe -version", $test_out, $test_ret);
    if ($test_ret !== 0) throw new Exception("FFmpeg not found. Please install at C:\\ffmpeg\\bin\\ffmpeg.exe");

    $tempDir = sys_get_temp_dir();
    $uniqueId = uniqid('join_');
    $fileListPath = $tempDir . DIRECTORY_SEPARATOR . $uniqueId . '_list.txt';
    $outputFile = "";
    $inputFiles = [];
    $targetExt = "mp4"; // Default

    $fileListContent = "";

    $count = count($_FILES['files']['name']);
    for ($i = 0; $i < $count; $i++) {
        if ($_FILES['files']['error'][$i] !== UPLOAD_ERR_OK) {
            continue;
        }

        $originalName = $_FILES['files']['name'][$i];
        $ext = strtolower(pathinfo($originalName, PATHINFO_EXTENSION));
        if ($i === 0 && $ext) $targetExt = $ext;

        $tempFilePath = $tempDir . DIRECTORY_SEPARATOR . $uniqueId . '_' . $i . '.' . $ext;
        
        if (move_uploaded_file($_FILES['files']['tmp_name'][$i], $tempFilePath)) {
            $inputFiles[] = $tempFilePath;
            // Use forward slashes for FFmpeg list
            $safePath = str_replace('\\', '/', $tempFilePath);
            $fileListContent .= "file '$safePath'\n";
        }
    }

    if (count($inputFiles) < 2) {
        throw new Exception("Failed to upload enough valid files.");
    }

    file_put_contents($fileListPath, $fileListContent);

    $outputFile = $tempDir . DIRECTORY_SEPARATOR . $uniqueId . '_out.' . $targetExt;

    // FFmpeg Concat Demuxer
    $cmd = sprintf(
        '%s -f concat -safe 0 -i "%s" -c copy -y "%s" 2>&1',
        $ffmpeg_exe,
        $fileListPath,
        $outputFile
    );

    $output = [];
    $return_var = 0;
    exec($cmd, $output, $return_var);

    if ($return_var !== 0 || !file_exists($outputFile) || filesize($outputFile) == 0) {
         // Fallback: Re-encode
         $cmdFallback = sprintf(
            '%s -f concat -safe 0 -i "%s" -c:v libx264 -c:a aac -preset ultrafast -y "%s" 2>&1',
            $ffmpeg_exe,
            $fileListPath,
            $outputFile
        );
        exec($cmdFallback, $output, $return_var);

        if ($return_var !== 0 || !file_exists($outputFile) || filesize($outputFile) == 0) {
             @unlink($fileListPath);
             foreach($inputFiles as $f) @unlink($f);
             throw new Exception("Join Error: " . implode("\n", array_slice($output, -5)));
        }
    }

    $fileContent = file_get_contents($outputFile);
    $base64 = base64_encode($fileContent);
    $fileSize = filesize($outputFile);

    // Cleanup
    @unlink($fileListPath);
    @unlink($outputFile);
    foreach($inputFiles as $f) @unlink($f);

    $response = [
        "success" => true,
        "filename" => "Joined_" . date('H-i-s') . "." . $targetExt,
        "size" => $fileSize,
        "base64" => $base64,
        "format" => $targetExt
    ];

} catch (Exception $e) {
    $response = ["error" => $e->getMessage()];
}

ob_end_clean();
echo json_encode($response);
?>