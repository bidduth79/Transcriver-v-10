
<?php
include 'cors.php';
include 'db_connect.php';

header('Content-Type: application/json');

try {
    // Get the first active master key
    $stmt = $conn->prepare("SELECT key_value FROM system_master_keys WHERE status = 'active' LIMIT 1");
    $stmt->execute();
    $result = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($result) {
        echo json_encode(["key" => $result['key_value']]);
    } else {
        echo json_encode(["error" => "No active master key found"]);
    }
} catch (PDOException $e) {
    echo json_encode(["error" => $e->getMessage()]);
}
?>
