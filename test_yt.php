<?php
$data = [
    "url" => "https://www.youtube.com/watch?v=jNQXAC9IVRw",
    "quality" => "audio",
    "customDownloadPath" => "C:\\video-to-audio with video\\video-to-audio with video\\audio"
];

$ch = curl_init('http://127.0.0.1/licell_api/youtube.php');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);

$response = curl_exec($ch);
curl_close($ch);

$decoded = json_decode($response, true);
// Strip base64 out of output so it doesn't flood the terminal
if (isset($decoded['base64'])) {
    $decoded['base64'] = 'BASE64_DATA_REMOVED';
}
print_r($decoded);
