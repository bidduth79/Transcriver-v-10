<?php
$conn = new PDO('mysql:host=127.0.0.1;dbname=licell_studio;charset=utf8mb4', 'root', '');
$stmt = $conn->query('SHOW COLUMNS FROM `studio_history`');
print_r($stmt->fetchAll(PDO::FETCH_COLUMN));
?>
