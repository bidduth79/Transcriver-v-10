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
    if (!isset($_FILES['file'])) {
        throw new Exception("No file uploaded");
    }
    
    if ($_FILES['file']['error'] !== UPLOAD_ERR_OK) {
        $msg = "Upload error: " . $_FILES['file']['error'];
        if ($_FILES['file']['error'] === UPLOAD_ERR_INI_SIZE || $_FILES['file']['error'] === UPLOAD_ERR_FORM_SIZE) {
            $msg = "File too large (Max: " . ini_get('upload_max_filesize') . "). Check php.ini.";
        }
        throw new Exception($msg);
    }

    $targetFormat = isset($_POST['format']) ? strtolower(trim($_POST['format'])) : 'mp3';
    $audioBitrate = isset($_POST['bitrate']) ? trim($_POST['bitrate']) : '128k';
    $audioChannels = isset($_POST['channels']) ? intval($_POST['channels']) : 2;

    $allowedFormats = ['mp3', 'wav', 'ogg', 'm4a', 'opus', 'mp4', 'mkv', 'avi', 'webm'];
    if (!in_array($targetFormat, $allowedFormats)) {
        throw new Exception("Format not supported");
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
    $originalName = $_FILES['file']['name'];
    $sourceExt = pathinfo($originalName, PATHINFO_EXTENSION);
    $inputFile = $tempDir . DIRECTORY_SEPARATOR . 'conv_in_' . uniqid() . '.' . $sourceExt;
    $outputFile = $tempDir . DIRECTORY_SEPARATOR . 'conv_out_' . uniqid() . '.' . $targetFormat;

    if (!move_uploaded_file($_FILES['file']['tmp_name'], $inputFile)) {
        throw new Exception("Failed to move uploaded file");
    }

    $codecArgs = "";
    $sampleRateArg = "";
    $bitrateVal = intval($audioBitrate);

    if ($bitrateVal <= 24) {
        $sampleRateArg = "-ar 16000";
    } elseif ($bitrateVal <= 64) {
        $sampleRateArg = "-ar 22050";
    } else {
        $sampleRateArg = "-ar 44100";
    }

    switch ($targetFormat) {
        case 'mp3': $codecArgs = "-c:a libmp3lame"; break;
        case 'opus': $codecArgs = "-c:a libopus -vbr on -compression_level 0"; break; 
        case 'ogg': $codecArgs = "-c:a libvorbis"; break;
        case 'm4a':
        case 'aac': $codecArgs = "-c:a aac"; break;
        case 'wav': $codecArgs = "-c:a pcm_s16le"; $audioBitrate = null; break;
        default: $codecArgs = "-c:v copy"; break; 
    }

    $cmd = "";
    $commonArgs = sprintf("-ac %d %s %s", $audioChannels, $sampleRateArg, $codecArgs);
    
    if ($audioBitrate && $targetFormat !== 'wav') {
        $commonArgs .= sprintf(" -b:a %s", escapeshellarg($audioBitrate));
    }

    if (in_array($targetFormat, ['mp3', 'wav', 'ogg', 'm4a', 'opus', 'aac'])) {
        // Audio output
        $cmd = sprintf('%s -y -i "%s" -vn %s "%s" 2>&1', $ffmpeg_exe, $inputFile, $commonArgs, $outputFile);
    } else {
        // Video conversion
        $cmd = sprintf('%s -y -i "%s" -c:v libx264 -preset ultrafast %s "%s" 2>&1', $ffmpeg_exe, $inputFile, $commonArgs, $outputFile);
    }

    $output = [];
    $return_var = 0;
    exec($cmd, $output, $return_var);

    if ($return_var !== 0 || !file_exists($outputFile) || filesize($outputFile) == 0) {
         throw new Exception("Conversion Error: " . implode("\n", array_slice($output, -5)));
    }

    // --- SAVE TO D:\audio (Server Side) ---
    $serverSavedPath = "";
    $destinationDir = "D:\\audio";
    
    if (file_exists($destinationDir) && is_dir($destinationDir)) {
        $finalFileName = date('Y-m-d_H-i-s') . "_Converted_" . pathinfo($originalName, PATHINFO_FILENAME) . "." . $targetFormat;
        $destinationPath = $destinationDir . DIRECTORY_SEPARATOR . $finalFileName;
        
        if (copy($outputFile, $destinationPath)) {
            $serverSavedPath = $destinationPath;
        }
    }
    // --------------------------------------

    $fileContent = file_get_contents($outputFile);
    $base64 = base64_encode($fileContent);
    $fileSize = filesize($outputFile);

    @unlink($inputFile);
    @unlink($outputFile);

    $response = [
        "success" => true,
        "filename" => pathinfo($originalName, PATHINFO_FILENAME) . "." . $targetFormat,
        "size" => $fileSize,
        "base64" => $base64,
        "format" => $targetFormat,
        "serverPath" => $serverSavedPath
    ];

} catch (Exception $e) {
    $response = ["error" => $e->getMessage()];
}

ob_end_clean();
echo json_encode($response);
?>