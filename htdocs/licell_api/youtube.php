<?php
// Disable error reporting to screen
error_reporting(0);
ini_set('display_errors', 0);

// Set unlimited execution time and high memory limit
set_time_limit(0);
ini_set('max_execution_time', 0);
ini_set('memory_limit', '2048M');

// CORS Headers
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header('Content-Type: application/json');

// Handle Preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$response = [];

try {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        throw new Exception("Only POST method allowed");
    }

    $input = file_get_contents('php://input');
    $data = json_decode($input, true);
    $url = isset($data['url']) ? trim($data['url']) : '';
    $title = isset($data['title']) ? trim($data['title']) : '';
    
    if (!empty($title)) {
        $title = html_entity_decode($title, ENT_QUOTES | ENT_HTML5, 'UTF-8');
    }
    
    // Format handled via 'quality' param
    $quality = isset($data['quality']) ? trim($data['quality']) : 'audio'; 
    $bitrate = isset($data['bitrate']) ? trim($data['bitrate']) : '16';
    $channels = isset($data['channels']) ? trim($data['channels']) : '1';
    $samplerate = isset($data['samplerate']) ? trim($data['samplerate']) : '16000';
    $customDownloadPath = isset($data['customDownloadPath']) ? trim($data['customDownloadPath']) : '';
    $startTime = isset($data['startTime']) ? trim($data['startTime']) : '';
    $endTime = isset($data['endTime']) ? trim($data['endTime']) : '';

    if (empty($url)) {
        throw new Exception("URL is missing");
    }

    // --- PATH CONFIGURATION ---
    
    // 1. YT-DLP Path
    $yt_paths = [
        'C:\\yt-dlp\\yt-dlp.exe',
        'C:\\yt-dlp.exe',
        'yt-dlp' // System PATH
    ];
    
    $yt_dlp_exe = 'yt-dlp';
    foreach($yt_paths as $path) {
        if (file_exists($path)) {
            $yt_dlp_exe = '"' . $path . '"';
            break;
        }
    }

    // 2. FFMPEG Path (for yt-dlp post-processing)
    $ffmpeg_arg = "";
    $ffmpeg_dirs = [
        'C:\\ffmpeg\\bin',
        'C:\\ffmpeg\\ffmpeg-2026-01-12-git-21a3e44fbe-essentials_build\\bin'
    ];

    foreach ($ffmpeg_dirs as $dir) {
        if (is_dir($dir) && file_exists($dir . '\\ffmpeg.exe')) {
            $ffmpeg_arg = " --ffmpeg-location \"$dir\"";
            break;
        }
    }

    $temp_dir = sys_get_temp_dir();
    $fileId = uniqid('yt_');
    
    // Use provided title if available, otherwise fallback to yt-dlp's title
    if (!empty($title)) {
        // Sanitize title to be safe for Windows filenames (only the absolute minimum)
        // We keep spaces and other characters that are allowed.
        $safeTitle = preg_replace('/[\\\\\\/:*?"<>|]/', '_', $title);
        $safeTitle = trim($safeTitle);
        if (empty($safeTitle)) {
            $safeTitle = 'video';
        }
        // Use a simpler template to avoid yt-dlp adding extra info
        $outputTemplate = $temp_dir . DIRECTORY_SEPARATOR . $fileId . "_" . $safeTitle . ".%(ext)s";
    } else {
        $outputTemplate = $temp_dir . DIRECTORY_SEPARATOR . $fileId . "_%(title)s.%(ext)s";
    }

    // Build Command based on quality
    $formatArgs = "";
    $targetExt = "";
    
    // Forced compression settings from user reference
    $audioPP = "ffmpeg:-vn -ac $channels -ar $samplerate -b:a {$bitrate}k";

    switch ($quality) {
        case 'best':
            // Best Video available (MP4 preferred)
            $formatArgs = '-f "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best"';
            $targetExt = "mp4";
            break;
        case '1080':
        case '1080p':
            // 1080p Video
            $formatArgs = '-f "bestvideo[height<=1080][ext=mp4]+bestaudio[ext=m4a]/best[height<=1080][ext=mp4]/best"';
            $targetExt = "mp4";
            break;
        case '720':
        case '720p':
            // 720p Video
            $formatArgs = '-f "bestvideo[height<=720][ext=mp4]+bestaudio[ext=m4a]/best[height<=720][ext=mp4]/best"';
            $targetExt = "mp4";
            break;
        case '480':
        case '480p':
            // 480p Video
            $formatArgs = '-f "bestvideo[height<=480][ext=mp4]+bestaudio[ext=m4a]/best[height<=480][ext=mp4]/best"';
            $targetExt = "mp4";
            break;
        case '360':
        case '360p':
            // 360p Video
            $formatArgs = '-f "bestvideo[height<=360][ext=mp4]+bestaudio[ext=m4a]/best[height<=360][ext=mp4]/best"';
            $targetExt = "mp4";
            break;
        case '240':
        case '240p':
            // 240p Video
            $formatArgs = '-f "bestvideo[height<=240][ext=mp4]+bestaudio[ext=m4a]/best[height<=240][ext=mp4]/best"';
            $targetExt = "mp4";
            break;
        case '144p':
            // 144p Video
            $formatArgs = '-f "bestvideo[height<=144][ext=mp4]+bestaudio[ext=m4a]/best[height<=144][ext=mp4]/best"';
            $targetExt = "mp4";
            break;
        case 'audio_best':
            // High Quality Audio (MP3 320k or best available converted)
            $formatArgs = '-f "bestaudio/best" --extract-audio --audio-format mp3 --audio-quality 0 --postprocessor-args "' . $audioPP . '"';
            $targetExt = "mp3";
            break;
        case 'mp3':
            $formatArgs = '-f "bestaudio/best" --extract-audio --audio-format mp3 --postprocessor-args "' . $audioPP . '"';
            $targetExt = "mp3";
            break;
        case '64k':
            $formatArgs = '-f "bestaudio/best" --extract-audio --audio-format mp3 --postprocessor-args "ffmpeg:-vn -ac ' . $channels . ' -ar ' . $samplerate . ' -b:a 64k"';
            $targetExt = "mp3";
            break;
        case '32k':
            $formatArgs = '-f "bestaudio/best" --extract-audio --audio-format mp3 --postprocessor-args "ffmpeg:-vn -ac ' . $channels . ' -ar ' . $samplerate . ' -b:a 32k"';
            $targetExt = "mp3";
            break;
        case '16k':
            $formatArgs = '-f "bestaudio/best" --extract-audio --audio-format mp3 --postprocessor-args "ffmpeg:-vn -ac ' . $channels . ' -ar ' . $samplerate . ' -b:a 16k"';
            $targetExt = "mp3";
            break;
        case 'm4a':
            $formatArgs = '-f "bestaudio[ext=m4a]/bestaudio" --extract-audio --audio-format m4a --postprocessor-args "' . $audioPP . '"';
            $targetExt = "m4a";
            break;
        case 'wav':
            // WAV doesn't use bitrate, but we apply channels and samplerate
            $formatArgs = '-f "bestaudio/best" --extract-audio --audio-format wav --postprocessor-args "ffmpeg:-vn -ac ' . $channels . ' -ar ' . $samplerate . '"';
            $targetExt = "wav";
            break;
        case 'opus':
            $formatArgs = '-f "140/bestaudio[ext=m4a]/bestaudio" --extract-audio --audio-format opus --audio-quality 16K --postprocessor-args "' . $audioPP . '"';
            $targetExt = "opus";
            break;
        case 'best':
            $formatArgs = '-f "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best"';
            $targetExt = "mp4";
            break;
        case '1080':
            $formatArgs = '-f "bestvideo[height<=1080][ext=mp4]+bestaudio[ext=m4a]/best[height<=1080][ext=mp4]/best"';
            $targetExt = "mp4";
            break;
        case '720':
            $formatArgs = '-f "bestvideo[height<=720][ext=mp4]+bestaudio[ext=m4a]/best[height<=720][ext=mp4]/best"';
            $targetExt = "mp4";
            break;
        case '480':
            $formatArgs = '-f "bestvideo[height<=480][ext=mp4]+bestaudio[ext=m4a]/best[height<=480][ext=mp4]/best"';
            $targetExt = "mp4";
            break;
        case '360':
            $formatArgs = '-f "bestvideo[height<=360][ext=mp4]+bestaudio[ext=m4a]/best[height<=360][ext=mp4]/best"';
            $targetExt = "mp4";
            break;
        case '240':
            $formatArgs = '-f "bestvideo[height<=240][ext=mp4]+bestaudio[ext=m4a]/best[height<=240][ext=mp4]/best"';
            $targetExt = "mp4";
            break;
        case 'audio':
        default:
            // Force download of m4a (itag 140) to ensure FFmpeg re-encodes it to opus with our bitrate settings
            $formatArgs = '-f "140/bestaudio[ext=m4a]/bestaudio" -x --audio-format opus --audio-quality 16K --postprocessor-args "' . $audioPP . '"';
            $targetExt = "opus"; 
            break;
    }

    $sectionArgs = "";
    if (!empty($startTime) || !empty($endTime)) {
        $s = !empty($startTime) ? $startTime : '0';
        $e = !empty($endTime) ? $endTime : 'inf';
        $sectionArgs = "--download-sections \"*{$s}-{$e}\"";
    }

    // Performance Flags matched with Node.js script
    $cmd = sprintf(
        '%s %s %s --no-playlist --no-check-certificate --no-update --no-progress --force-ipv4 --force-overwrite --no-continue %s -o "%s" "%s" 2>&1',
        $yt_dlp_exe,
        $ffmpeg_arg,
        $sectionArgs,
        $formatArgs,
        $outputTemplate,
        $url
    );

    // Execute
    $output = [];
    $return_var = 0;
    exec($cmd, $output, $return_var);

    $log_string = implode("\n", $output);
    
    // Check for specific yt-dlp errors to provide better feedback
    if (stripos($log_string, 'Sign in to confirm you’re not a bot') !== false || stripos($log_string, 'HTTP Error 429') !== false) {
        http_response_code(429);
        throw new Exception("RATE_LIMIT: YouTube blocked the request (Bot detection/IP ban). Please try again later or use cookies.");
    }
    
    // Check for success
    $searchPattern = $temp_dir . DIRECTORY_SEPARATOR . $fileId . "_*.*";
    $files = glob($searchPattern);
    
    // Filter out .part files
    $files = array_filter($files, function($f) {
        return substr($f, -5) !== '.part';
    });
    $files = array_values($files);

    if (empty($files)) {
        throw new Exception("Download failed. Log: " . substr($log_string, -500));
    }

    $expectedFile = $files[0];
    $ext = pathinfo($expectedFile, PATHINFO_EXTENSION);
    
    $basename = basename($expectedFile);
    $titlePart = substr($basename, strlen($fileId) + 1);
    if (empty($titlePart) || $titlePart === "." . $ext) {
        $titlePart = date('Y-m-d_H-i-s') . "." . $ext;
    }
    
    // If we have a safe title from the input, use it directly for the final filename
    // to ensure it matches exactly what was requested.
    if (!empty($title) && !empty($safeTitle)) {
        $finalFileName = $safeTitle . "." . $ext;
    } else {
        $finalFileName = $titlePart;
    }

    // --- SAVE TO LOCAL FOLDER (Modern Approach) ---
    // Instead of hardcoding D:\audio, we save it inside a 'downloads' folder in the project directory,
    // unless the user provided a custom path.
    $serverSavedPath = "";
    $destinationDir = 'C:\\Transcriver-v-10\\htdocs\\licell_api\\downloads';
    
    if (!empty($customDownloadPath)) {
        $destinationDir = rtrim($customDownloadPath, '\\/');
    }
    
    // Create the downloads directory if it doesn't exist
    if (!file_exists($destinationDir)) {
        mkdir($destinationDir, 0777, true);
    }
    
    $copyError = null;
    if (file_exists($destinationDir) && is_dir($destinationDir)) {
        $destinationPath = $destinationDir . DIRECTORY_SEPARATOR . $finalFileName;
        
        if (copy($expectedFile, $destinationPath)) {
            $serverSavedPath = $destinationPath;
        } else {
            $copyError = "Copy failed from $expectedFile to $destinationPath";
        }
    } else {
        $copyError = "Destination dir does not exist: $destinationDir";
    }
    // --------------------------------------

    // Read file for Frontend (Base64)
    $fileContent = file_get_contents($expectedFile);
    if ($fileContent === false) {
        throw new Exception("Failed to read output file.");
    }

    $base64 = base64_encode($fileContent);
    $fileSize = filesize($expectedFile);
    $ext = pathinfo($expectedFile, PATHINFO_EXTENSION);
    
    // Cleanup Temp File
    @unlink($expectedFile);

    $response = [
        "success" => true,
        "filename" => $finalFileName,
        "size" => $fileSize,
        "base64" => $base64,
        "format" => $ext,
        "server_path" => $serverSavedPath,
        "debug_destinationDir" => $destinationDir,
        "debug_copyError" => $copyError,
        "debug_customDownloadPath" => $customDownloadPath
    ];

} catch (Exception $e) {
    $response = [
        "error" => $e->getMessage()
    ];
}

// Return JSON
echo json_encode($response);
?>