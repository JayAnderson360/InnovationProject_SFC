<?php
header('Content-Type: application/json');

// --- Database Configuration ---
$servername = "127.0.0.1";
$username = "root";
$password = "";
$dbname = "innovation_project";

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
        $user_id = isset($_GET['user_id']) ? (int)$_GET['user_id'] : null;

        if ($user_id) {
            // Get Single User (excluding password)
            $stmt = $conn->prepare("SELECT user_id, email, role, created_at, last_login_at FROM Users WHERE user_id = ?");
            $stmt->bind_param("i", $user_id);
            $stmt->execute();
            $result = $stmt->get_result();

            if ($result->num_rows === 0) {
                 http_response_code(404); // Not Found
                 throw new Exception("User not found");
            }
            $user = $result->fetch_assoc();
            echo json_encode(['status' => 'success', 'data' => $user]);
            $stmt->close();
        } else {
            // Get All Users (excluding password)
             $query = "SELECT user_id, email, role, created_at, last_login_at FROM Users ORDER BY user_id";
             $result = $conn->query($query);
             if (!$result) {
                 throw new Exception("Error fetching users: " . $conn->error);
             }
             $users = [];
             while ($row = $result->fetch_assoc()) {
                 $users[] = $row;
             }
             echo json_encode(['status' => 'success', 'data' => $users]);
        }
    }
    // --- Handle POST Requests (Create, Update, Delete) ---
    elseif ($method === 'POST') {
        if (!$inputData) {
             http_response_code(400); // Bad Request
            throw new Exception("Invalid JSON input.");
        }

        // Determine action based on input data
        $is_delete = isset($inputData['user_id']) && isset($inputData['action']) && $inputData['action'] === 'delete'; // Explicit action for delete
        $is_update = isset($inputData['user_id']) && !$is_delete;
        $is_create = !isset($inputData['user_id']);

        if ($is_create) {
            // --- Create User ---
            $requiredFields = ['email', 'password', 'role'];
            foreach ($requiredFields as $field) {
                if (empty($inputData[$field])) throw new Exception("Missing required field: $field");
            }
             if (!filter_var($inputData['email'], FILTER_VALIDATE_EMAIL)) {
                 http_response_code(400);
                 throw new Exception("Invalid email format.");
             }
            // Check if email already exists
            $stmtCheck = $conn->prepare("SELECT user_id FROM Users WHERE email = ?");
            $stmtCheck->bind_param("s", $inputData['email']);
            $stmtCheck->execute();
            $resultCheck = $stmtCheck->get_result();
            if ($resultCheck->num_rows > 0) {
                http_response_code(409); // Conflict
                throw new Exception("Email already exists.");
            }
            $stmtCheck->close();

            // Hash the password
            $hashedPassword = password_hash($inputData['password'], PASSWORD_DEFAULT);
            if ($hashedPassword === false) {
                 http_response_code(500);
                 throw new Exception("Failed to hash password.");
            }

            $stmt = $conn->prepare("INSERT INTO Users (email, password_hash, role) VALUES (?, ?, ?)");
            $stmt->bind_param("sss", $inputData['email'], $hashedPassword, $inputData['role']);

            if ($stmt->execute()) {
                $new_user_id = $conn->insert_id; // Get the ID of the newly inserted user
                echo json_encode([
                    'status' => 'success',
                    'message' => 'User added successfully.',
                    'user_id' => $new_user_id // Return the new user ID
                ]);
            } else {
                 http_response_code(500);
                throw new Exception("Error adding user: " . $stmt->error);
            }
            $stmt->close();

        } elseif ($is_update) {
            // --- Update User ---
             $requiredFields = ['user_id', 'email', 'role']; // Password update is optional
             foreach ($requiredFields as $field) {
                 if (empty($inputData[$field])) throw new Exception("Missing required field: $field");
             }
             if (!filter_var($inputData['email'], FILTER_VALIDATE_EMAIL)) {
                 http_response_code(400);
                 throw new Exception("Invalid email format.");
             }
             // Check if email already exists for another user
            $stmtCheck = $conn->prepare("SELECT user_id FROM Users WHERE email = ? AND user_id != ?");
            $stmtCheck->bind_param("si", $inputData['email'], $inputData['user_id']);
            $stmtCheck->execute();
            $resultCheck = $stmtCheck->get_result();
            if ($resultCheck->num_rows > 0) {
                http_response_code(409); // Conflict
                throw new Exception("Email already exists for another user.");
            }
            $stmtCheck->close();

            // Prepare update statement (handle optional password update)
            if (!empty($inputData['password'])) {
                $hashedPassword = password_hash($inputData['password'], PASSWORD_DEFAULT);
                if ($hashedPassword === false) {
                     http_response_code(500);
                     throw new Exception("Failed to hash password.");
                 }
                $stmt = $conn->prepare("UPDATE Users SET email = ?, role = ?, password_hash = ? WHERE user_id = ?");
                $stmt->bind_param("sssi", $inputData['email'], $inputData['role'], $hashedPassword, $inputData['user_id']);
            } else {
                $stmt = $conn->prepare("UPDATE Users SET email = ?, role = ? WHERE user_id = ?");
                $stmt->bind_param("ssi", $inputData['email'], $inputData['role'], $inputData['user_id']);
            }

            if ($stmt->execute()) {
                 echo json_encode(['status' => 'success', 'message' => 'User updated successfully.']);
            } else {
                 http_response_code(500);
                throw new Exception("Error updating user: " . $stmt->error);
            }
            $stmt->close();

        } elseif ($is_delete) {
            // --- Delete User ---
            $user_id = (int)$inputData['user_id'];

            // Optional: Prevent deleting the main admin user (e.g., user_id 1)
            // if ($user_id === 1) {
            //     http_response_code(403); // Forbidden
            //     throw new Exception("Cannot delete the primary admin user.");
            // }

            $stmt = $conn->prepare("DELETE FROM Users WHERE user_id = ?");
            $stmt->bind_param("i", $user_id);

            if ($stmt->execute()) {
                if ($stmt->affected_rows > 0) {
                    echo json_encode(['status' => 'success', 'message' => 'User deleted successfully.']);
                } else {
                     http_response_code(404); // Not Found
                     echo json_encode(['status' => 'error', 'message' => 'User not found or already deleted.']);
                }
            } else {
                 http_response_code(500);
                throw new Exception("Error deleting user: " . $stmt->error);
            }
             $stmt->close();
        } else {
             http_response_code(400); // Bad Request
            throw new Exception("Invalid request structure for POST.");
        }

    } else {
         http_response_code(405); // Method Not Allowed
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