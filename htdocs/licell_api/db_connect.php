
<?php
$servername = "127.0.0.1";
$username = "root";
$password = ""; // Default XAMPP password is empty
$dbname = "licell_studio";

try {
    $conn = new PDO("mysql:host=$servername;dbname=$dbname;charset=utf8mb4", $username, $password);
    // Set the PDO error mode to exception
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch(PDOException $e) {
    // Return JSON error if connection fails
    header('Content-Type: application/json');
    echo json_encode(["error" => "Connection failed: " . $e->getMessage()]);
    exit();
}
?>
