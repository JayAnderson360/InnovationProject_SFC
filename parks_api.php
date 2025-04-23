<?php
header('Content-Type: application/json');

// --- Database Configuration ---
$servername = "127.0.0.1";
$username = "root";
$password = "";
$dbname = "innovation_project";
$backupDir = "backup";

// --- Helper Function: Auto-Export Parks Data ---
function exportParksData($conn, $backupDir) {
    $query = "SELECT * FROM parks ORDER BY park_id";
    $result = $conn->query($query);

    if (!$result) {
        // Log error but don't necessarily stop the primary operation
        error_log("Error fetching data from Parks table for export: " . $conn->error);
        return false; // Indicate export failure
    }

    $parksData = [];
    while ($row = $result->fetch_assoc()) {
        $parksData[] = $row;
    }

    // Ensure backup directory exists
    if (!file_exists($backupDir)) {
        if (!mkdir($backupDir, 0777, true)) {
            error_log("Failed to create backup directory: $backupDir");
            return false; // Indicate export failure
        }
    }

    // Export to JSON file (Consistent filename)
    $filename = "$backupDir/data_Parks.json";
    if (file_put_contents($filename, json_encode($parksData, JSON_PRETTY_PRINT))) {
        return true; // Indicate export success
    } else {
        error_log("Failed to write parks data to file: $filename");
        return false; // Indicate export failure
    }
}

// --- Main API Logic ---
$conn = null; // Initialize connection variable
try {
    // Create connection
    $conn = new mysqli($servername, $username, $password, $dbname);
    if ($conn->connect_error) {
        throw new Exception("Connection failed: " . $conn->connect_error);
    }

    $method = $_SERVER['REQUEST_METHOD'];
    $inputData = json_decode(file_get_contents('php://input'), true);

    // --- Handle GET Requests (Read) ---
    if ($method === 'GET') {
        $park_id = isset($_GET['park_id']) ? (int)$_GET['park_id'] : null;

        if ($park_id) {
            // Get Single Park (from get_park.php logic)
            $stmt = $conn->prepare("SELECT * FROM parks WHERE park_id = ?");
            $stmt->bind_param("i", $park_id);
            $stmt->execute();
            $result = $stmt->get_result();

            if ($result->num_rows === 0) {
                 http_response_code(404); // Not Found
                 throw new Exception("Park not found");
            }
            $park = $result->fetch_assoc();
            echo json_encode(['status' => 'success', 'data' => $park]);
            $stmt->close();
        } else {
            // Get All Parks (from get_parks.php logic)
             $query = "SELECT park_id, name, location, type, date_of_gazettement, land_area, marine_area FROM Parks ORDER BY park_id";
             $result = $conn->query($query);
             if (!$result) {
                 throw new Exception("Error fetching parks: " . $conn->error);
             }
             $parks = [];
             while ($row = $result->fetch_assoc()) {
                 $parks[] = $row;
             }
             echo json_encode(['status' => 'success', 'data' => $parks]);
        }
    }
    // --- Handle POST Requests (Create, Update, Delete) ---
    elseif ($method === 'POST') {
        if (!$inputData) {
             http_response_code(400); // Bad Request
            throw new Exception("Invalid JSON input.");
        }

        // Determine action based on input data
        $is_delete = isset($inputData['park_id']) && count($inputData) === 1;
        $is_update = isset($inputData['park_id']) && count($inputData) > 1;
        $is_create = !isset($inputData['park_id']);

        if ($is_create) {
            // --- Create Park (from add_park.php logic) ---
            $requiredFields = ['name', 'location', 'type', 'date_of_gazettement'];
            foreach ($requiredFields as $field) {
                if (empty($inputData[$field])) throw new Exception("Missing required field: $field");
            }
            if (!isset($inputData['land_area']) || !is_numeric($inputData['land_area']) || $inputData['land_area'] < 0) throw new Exception("Land area must be a non-negative number");
            if (!isset($inputData['marine_area']) || !is_numeric($inputData['marine_area']) || $inputData['marine_area'] < 0) throw new Exception("Marine area must be a non-negative number");

            $stmt = $conn->prepare("INSERT INTO parks (name, location, type, land_area, marine_area, date_of_gazettement) VALUES (?, ?, ?, ?, ?, ?)");
            $stmt->bind_param("sssdds",
                $inputData['name'], $inputData['location'], $inputData['type'],
                $inputData['land_area'], $inputData['marine_area'], $inputData['date_of_gazettement']
            );

            if ($stmt->execute()) {
                $exportSuccess = exportParksData($conn, $backupDir);
                echo json_encode([
                    'status' => 'success',
                    'message' => 'Park added successfully' . ($exportSuccess ? ' and data exported.' : '. Export failed.')
                ]);
            } else {
                 http_response_code(500);
                throw new Exception("Error adding park: " . $stmt->error);
            }
            $stmt->close();

        } elseif ($is_update) {
            // --- Update Park (from update_park.php logic) ---
             $requiredFields = ['park_id', 'name', 'location', 'type', 'date_of_gazettement'];
             foreach ($requiredFields as $field) {
                 if (!isset($inputData[$field]) || ($field !== 'land_area' && $field !== 'marine_area' && empty($inputData[$field]))) throw new Exception("Missing required field: $field");
             }
             if (!isset($inputData['land_area']) || !is_numeric($inputData['land_area']) || $inputData['land_area'] < 0) throw new Exception("Land area must be a non-negative number");
             if (!isset($inputData['marine_area']) || !is_numeric($inputData['marine_area']) || $inputData['marine_area'] < 0) throw new Exception("Marine area must be a non-negative number");

            $stmt = $conn->prepare("UPDATE parks SET name = ?, location = ?, type = ?, land_area = ?, marine_area = ?, date_of_gazettement = ? WHERE park_id = ?");
            $stmt->bind_param("sssddsi",
                $inputData['name'], $inputData['location'], $inputData['type'],
                $inputData['land_area'], $inputData['marine_area'], $inputData['date_of_gazettement'], $inputData['park_id']
            );

            if ($stmt->execute()) {
                $exportSuccess = exportParksData($conn, $backupDir);
                 echo json_encode([
                    'status' => 'success',
                    'message' => 'Park updated successfully' . ($exportSuccess ? ' and data exported.' : '. Export failed.')
                 ]);
            } else {
                 http_response_code(500);
                throw new Exception("Error updating park: " . $stmt->error);
            }
            $stmt->close();

        } elseif ($is_delete) {
            // --- Delete Park (from delete_park.php logic) ---
            $park_id = (int)$inputData['park_id'];
            $stmt = $conn->prepare("DELETE FROM parks WHERE park_id = ?");
            $stmt->bind_param("i", $park_id);

            if ($stmt->execute()) {
                if ($stmt->affected_rows > 0) {
                    $exportSuccess = exportParksData($conn, $backupDir);
                    echo json_encode([
                       'status' => 'success',
                       'message' => 'Park deleted successfully' . ($exportSuccess ? ' and data exported.' : '. Export failed.')
                    ]);
                } else {
                     http_response_code(404); // Not Found
                     echo json_encode(['status' => 'error', 'message' => 'Park not found or already deleted.']);
                }
            } else {
                 http_response_code(500);
                throw new Exception("Error deleting park: " . $stmt->error);
            }
             $stmt->close();
        } else {
            // Should not happen with the logic above, but as a fallback
             http_response_code(400); // Bad Request
            throw new Exception("Invalid request structure for POST.");
        }

    } else {
         http_response_code(405); // Method Not Allowed
        throw new Exception("Invalid request method: $method");
    }

} catch (Exception $e) {
    // Set appropriate HTTP status code if not already set
    if (http_response_code() === 200) { // Default is 200, change if error
        http_response_code(500); // Internal Server Error as default for exceptions
    }
    echo json_encode([
        'status' => 'error',
        'message' => $e->getMessage()
    ]);
} finally {
    // Ensure the connection is always closed
    if ($conn) {
        $conn->close();
    }
}
?> 