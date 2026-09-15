<?php
include 'cors.php';
header('Content-Type: application/json');

$data = json_decode(file_get_contents('php://input'), true);
$folder = isset($data['folder']) ? $data['folder'] : 'downloads';

if (strtoupper(substr(PHP_OS, 0, 3)) === 'WIN') {
    // Validate or create path
    $path = realpath($folder);
    if (!$path) {
        $base = realpath(__DIR__ . '/../../');
        $path = realpath($base . '/' . $folder);
        if (!$path) {
            @mkdir($base . '/' . $folder, 0777, true);
            $path = realpath($base . '/' . $folder);
        }
    }
    
    if ($path && is_dir($path)) {
        $cmd = 'explorer "' . str_replace('/', '\\', $path) . '"';
        pclose(popen('start /B ' . $cmd, 'r'));
        echo json_encode(['success' => true, 'path' => $path]);
    } else {
        echo json_encode(['success' => false, 'error' => 'Could not determine or create folder path']);
    }
} else {
    echo json_encode(['success' => false, 'error' => 'Only supported on Windows']);
}
