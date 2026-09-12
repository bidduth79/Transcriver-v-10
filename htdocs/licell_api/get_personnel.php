
<?php
include 'cors.php';
header('Content-Type: application/json');
echo json_encode(["status" => "online", "message" => "Server is reachable"]);
?>
