<?php
header('Content-Type: application/json');

// --- Database Configuration ---
$servername = "127.0.0.1";
$username = "root";
$password = "";
$dbname = "innovation_project";
$backupDir = "backup";

// --- Helper Function: Auto-Export Park Guides Data ---
function exportParkGuidesData($conn, $backupDir) {
    $query = "SELECT pg.*, u.email 
              FROM ParkGuides pg 
              JOIN Users u ON pg.user_id = u.user_id 
              ORDER BY pg.guide_id"; 
    $result = $conn->query($query);

    if (!$result) {
        error_log("Error fetching data from ParkGuides table for export: " . $conn->error);
        return false;
    }

    $guidesData = [];
    while ($row = $result->fetch_assoc()) {
        $guidesData[] = $row;
    }

    if (!file_exists($backupDir)) {
        if (!mkdir($backupDir, 0777, true)) {
            error_log("Failed to create backup directory: $backupDir");
            return false;
        }
    }

    $filename = "$backupDir/data_ParkGuides.json"; 
    if (file_put_contents($filename, json_encode($guidesData, JSON_PRETTY_PRINT))) {
        return true;
    } else {
        error_log("Failed to write park guides data to file: $filename");
        return false;
    }
}

// --- Main API Logic ---
$conn = null;
try {
    $conn = new mysqli($servername, $username, $password, $dbname);
    if ($conn->connect_error) {
        throw new Exception("Connection failed: " . $conn->connect_error);
    }

    $method = $_SERVER['REQUEST_METHOD'];
    $inputData = json_decode(file_get_contents('php://input'), true);

    // --- Handle GET Requests (Read) ---
    if ($method === 'GET') {
        $guide_id = isset($_GET['guide_id']) ? (int)$_GET['guide_id'] : null;

        // Base columns to select from ParkGuides and Users
        $baseColumns = "pg.guide_id, pg.user_id, pg.full_name, pg.ic_passport_number, pg.gender, pg.mobile_number, pg.license_status, u.email, pg.sfc_license_number, pg.license_issue_date, pg.license_expiry_date, pg.date_registered";

        // Subquery or JOIN for assigned parks
        $assignedParksQuery = "(SELECT GROUP_CONCAT(p.name SEPARATOR ', ') 
                               FROM GuideParkAssignments gpa 
                               JOIN Parks p ON gpa.park_id = p.park_id 
                               WHERE gpa.guide_id = pg.guide_id) AS assigned_parks";

        if ($guide_id) {
            // Get Single Park Guide with Assigned Parks
            $query = "SELECT $baseColumns, $assignedParksQuery, pg.date_registered, pg.sfc_license_number, pg.license_issue_date, pg.license_expiry_date
                      FROM ParkGuides pg 
                      JOIN Users u ON pg.user_id = u.user_id 
                      WHERE pg.guide_id = ?";
            $stmt = $conn->prepare($query);
            $stmt->bind_param("i", $guide_id);
            $stmt->execute();
            $result = $stmt->get_result();

            if ($result->num_rows === 0) {
                 http_response_code(404); 
                 throw new Exception("Park Guide not found");
            }
            $guide = $result->fetch_assoc();
            // Ensure assigned_parks is treated consistently (null if no parks)
            $guide['assigned_parks'] = $guide['assigned_parks'] ?? null; 
            echo json_encode(['status' => 'success', 'data' => $guide]);
            $stmt->close();
        } else {
            // Get All Park Guides with Assigned Parks
             $query = "SELECT $baseColumns, $assignedParksQuery
                       FROM ParkGuides pg 
                       JOIN Users u ON pg.user_id = u.user_id 
                       ORDER BY pg.guide_id"; // Order by guide_id included in baseColumns
             $result = $conn->query($query);
             if (!$result) {
                 throw new Exception("Error fetching park guides: " . $conn->error);
             }
             $guides = [];
             while ($row = $result->fetch_assoc()) {
                 // Ensure assigned_parks is treated consistently (null if no parks)
                 $row['assigned_parks'] = $row['assigned_parks'] ?? null;
                 $guides[] = $row;
             }
             echo json_encode(['status' => 'success', 'data' => $guides]);
        }
    }
    // --- Handle POST Requests (Create, Update, Delete) ---
    elseif ($method === 'POST') {
        if (!$inputData) {
             http_response_code(400);
            throw new Exception("Invalid JSON input.");
        }

        // Determine action
        $is_delete = isset($inputData['guide_id']) && isset($inputData['action']) && $inputData['action'] === 'delete';
        $is_update = isset($inputData['guide_id']) && !$is_delete;
        $is_create = !isset($inputData['guide_id']);

        if ($is_create) {
            // --- Create Park Guide ---
            // Adjusted required fields based on schema and user request
            $requiredFields = ['user_id', 'full_name', 'ic_passport_number', 'gender', 'date_registered', 'license_status']; // mobile_number, license details are optional
            foreach ($requiredFields as $field) {
                 // Use isset for required fields check
                if (!isset($inputData[$field])) throw new Exception("Missing required field for creation: $field");
                 // Additionally check for empty specifically for required fields that shouldn't be empty strings
                 if ($inputData[$field] === '') throw new Exception("Required field '$field' cannot be empty.");
            }
            $user_id = (int)$inputData['user_id'];

            // --- Validation ---
            // 1. Check if user exists and is a ParkGuide
            $stmtUserCheck = $conn->prepare("SELECT role FROM Users WHERE user_id = ?");
            $stmtUserCheck->bind_param("i", $user_id);
            $stmtUserCheck->execute();
            $resultUserCheck = $stmtUserCheck->get_result();
            if ($resultUserCheck->num_rows === 0) {
                http_response_code(400);
                throw new Exception("User with ID $user_id not found.");
            }
            $user = $resultUserCheck->fetch_assoc();
            if ($user['role'] !== 'ParkGuide') {
                 http_response_code(400);
                 throw new Exception("User with ID $user_id is not a ParkGuide.");
            }
            $stmtUserCheck->close();

            // 2. Check if user_id is already linked in ParkGuides (Unique constraint handles this, but explicit check is better UX)
            $stmtLinkCheck = $conn->prepare("SELECT guide_id FROM ParkGuides WHERE user_id = ?");
            $stmtLinkCheck->bind_param("i", $user_id);
            $stmtLinkCheck->execute();
            if ($stmtLinkCheck->get_result()->num_rows > 0) {
                 http_response_code(409); // Conflict
                 throw new Exception("User with ID $user_id is already linked to a Park Guide record.");
            }
            $stmtLinkCheck->close();
            // --- End Validation ---

            // Handle optional fields: set to null if empty
            $mobile_number = !empty($inputData['mobile_number']) ? $inputData['mobile_number'] : null;
            $sfc_license_number = !empty($inputData['sfc_license_number']) ? $inputData['sfc_license_number'] : null;
            $license_issue_date = !empty($inputData['license_issue_date']) ? $inputData['license_issue_date'] : null;
            $license_expiry_date = !empty($inputData['license_expiry_date']) ? $inputData['license_expiry_date'] : null;

            // Prepare INSERT based on actual schema
             // Corrected parameter types (s for strings/dates, i for integers)
            $stmt = $conn->prepare("INSERT INTO ParkGuides (user_id, full_name, ic_passport_number, gender, mobile_number, sfc_license_number, license_issue_date, license_expiry_date, license_status, date_registered) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
            $stmt->bind_param("issssssssss",
                $user_id,
                $inputData['full_name'], 
                $inputData['ic_passport_number'], 
                $inputData['gender'],
                $mobile_number, // Use variable that might be null
                $sfc_license_number, // Use variable that might be null
                $license_issue_date, // Use variable that might be null
                $license_expiry_date, // Use variable that might be null
                $inputData['license_status'], // Required
                $inputData['date_registered'] // Required
            );

            if ($stmt->execute()) {
                $exportSuccess = exportParkGuidesData($conn, $backupDir);
                echo json_encode([
                    'status' => 'success',
                    'message' => 'Park Guide added successfully' . ($exportSuccess ? ' and data exported.' : '. Export failed.')
                ]);
            } else {
                 http_response_code(500);
                 if ($conn->errno == 1062) { 
                     throw new Exception("Error adding park guide: Duplicate entry detected (e.g., User ID, IC/Passport or SFC License Number)." . $stmt->error);
                 } else {
                    throw new Exception("Error adding park guide: " . $stmt->error);
                 }
            }
            $stmt->close();

        } elseif ($is_update) {
            // --- Update Park Guide ---
            // Required input: guide_id and fields allowed to update
             $requiredFields = ['guide_id', 'full_name', 'ic_passport_number', 'gender', 'date_registered', 'license_status']; // Check only essential fields must be present
             foreach ($requiredFields as $field) {
                 // Check if the essential fields are set in the input data
                 if (!isset($inputData[$field])) throw new Exception("Missing essential field for update: $field");
                  // Check if essential fields that cannot be empty string are empty
                  if ($inputData[$field] === '') throw new Exception("Required field '$field' cannot be empty string for update.");

             }
             $guide_id = (int)$inputData['guide_id'];

            // Handle optional fields: set to null if empty
            $mobile_number = !empty($inputData['mobile_number']) ? $inputData['mobile_number'] : null;
            $sfc_license_number = !empty($inputData['sfc_license_number']) ? $inputData['sfc_license_number'] : null;
            $license_issue_date = !empty($inputData['license_issue_date']) ? $inputData['license_issue_date'] : null;
            $license_expiry_date = !empty($inputData['license_expiry_date']) ? $inputData['license_expiry_date'] : null;

            // Prepare UPDATE statement based on schema (excluding user_id)
            // Corrected parameter types
            $stmt = $conn->prepare("UPDATE ParkGuides SET full_name = ?, ic_passport_number = ?, gender = ?, mobile_number = ?, sfc_license_number = ?, license_issue_date = ?, license_expiry_date = ?, license_status = ?, date_registered = ? WHERE guide_id = ?");
            $stmt->bind_param("sssssssssi",
                $inputData['full_name'], 
                $inputData['ic_passport_number'], 
                $inputData['gender'],
                $mobile_number, // Use variable
                $sfc_license_number, // Use variable
                $license_issue_date, // Use variable
                $license_expiry_date, // Use variable
                $inputData['license_status'], // Required
                $inputData['date_registered'], // Required
                $guide_id
            );

            if ($stmt->execute()) {
                 $exportSuccess = exportParkGuidesData($conn, $backupDir);
                 echo json_encode([
                    'status' => 'success',
                    'message' => 'Park Guide updated successfully' . ($exportSuccess ? ' and data exported.' : '. Export failed.')
                 ]);
            } else {
                 http_response_code(500);
                 if ($conn->errno == 1062) { 
                     throw new Exception("Error updating park guide: Duplicate entry detected (e.g., IC/Passport or SFC License Number)." . $stmt->error);
                 } else {
                    throw new Exception("Error updating park guide: " . $stmt->error);
                 }
            }
            $stmt->close();

        } elseif ($is_delete) {
            // --- Delete Park Guide ---
            $guide_id = (int)$inputData['guide_id'];
            $stmt = $conn->prepare("DELETE FROM ParkGuides WHERE guide_id = ?");
            $stmt->bind_param("i", $guide_id);

            if ($stmt->execute()) {
                if ($stmt->affected_rows > 0) {
                    $exportSuccess = exportParkGuidesData($conn, $backupDir);
                    echo json_encode([
                       'status' => 'success',
                       'message' => 'Park Guide deleted successfully' . ($exportSuccess ? ' and data exported.' : '. Export failed.')
                    ]);
                } else {
                     http_response_code(404);
                     echo json_encode(['status' => 'error', 'message' => 'Park Guide not found or already deleted.']);
                }
            } else {
                 http_response_code(500);
                throw new Exception("Error deleting park guide: " . $stmt->error);
            }
             $stmt->close();
        } else {
            http_response_code(400);
            throw new Exception("Invalid request structure for POST.");
        }

    } else {
         http_response_code(405);
        throw new Exception("Invalid request method: $method");
    }

} catch (Exception $e) {
    if (http_response_code() === 200) {
        http_response_code(500);
    }
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
} finally {
    if ($conn) {
        $conn->close();
    }
}
?> 