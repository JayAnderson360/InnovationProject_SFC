<?php
header('Content-Type: application/json');

// Database connection parameters
$servername = "127.0.0.1";
$username = "root";  // Default Laragon MySQL username
$password = "";      // Default Laragon MySQL password
$dbname = "innovation_project";  // Your database name

try {
    // Create connection without selecting a database
    $conn = new mysqli($servername, $username, $password);
    
    // Check connection
    if ($conn->connect_error) {
        throw new Exception("Connection failed: " . $conn->connect_error);
    }
    
    // Check if database exists
    $result = $conn->query("SHOW DATABASES LIKE '$dbname'");
    
    if ($result->num_rows == 0) {
        // Database doesn't exist, create it
        if ($conn->query("CREATE DATABASE $dbname") === TRUE) {
            echo json_encode([
                'status' => 'success',
                'message' => "Database created successfully"
            ]);

        // Select the database
        $conn->select_db($dbname);
        
        // Create tables if they don't exist
        $tables = [
            "CREATE TABLE IF NOT EXISTS `Users` (
                `user_id` INT AUTO_INCREMENT PRIMARY KEY,
                `email` VARCHAR(255) NOT NULL UNIQUE,
                `password_hash` VARCHAR(255) NOT NULL,
                `role` ENUM('Admin', 'ParkGuide', 'InstructorParkGuide') NOT NULL,
                `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                `last_login_at` TIMESTAMP NULL DEFAULT NULL
            ) ENGINE=InnoDB CHARACTER SET=utf8mb4 COLLATE=utf8mb4_unicode_ci",
            
            "CREATE TABLE IF NOT EXISTS `Parks` (
                `park_id` INT AUTO_INCREMENT PRIMARY KEY,
                `name` VARCHAR(255) NOT NULL UNIQUE,
                `location` VARCHAR(255) NULL,
                `type` ENUM('National Park', 'Nature Reserve', 'Wildlife Sanctuary') NOT NULL,
                `date_of_gazettement` DATE NULL,
                `land_area` DECIMAL(10,2) NULL COMMENT 'Area in hectares',
                `marine_area` DECIMAL(10,2) NULL COMMENT 'Area in hectares'
            ) ENGINE=InnoDB CHARACTER SET=utf8mb4 COLLATE=utf8mb4_unicode_ci",
            
            "CREATE TABLE IF NOT EXISTS `ParkGuides` (
                `guide_id` INT AUTO_INCREMENT PRIMARY KEY,
                `user_id` INT NOT NULL UNIQUE,
                `full_name` VARCHAR(255) NOT NULL,
                `ic_passport_number` VARCHAR(50) NOT NULL UNIQUE,
                `gender` ENUM('Male', 'Female', 'Other', 'PreferNotToSay') NULL,
                `mobile_number` VARCHAR(30) NULL,
                `sfc_license_number` VARCHAR(100) NULL UNIQUE,
                `license_issue_date` DATE NULL,
                `license_expiry_date` DATE NULL,
                `license_status` ENUM('Active', 'Expired', 'Suspended', 'Pending Renewal', 'Not Licensed', 'Application Pending') NOT NULL DEFAULT 'Not Licensed',
                `date_registered` DATE NOT NULL,
                `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (`user_id`) REFERENCES `Users`(`user_id`) ON DELETE CASCADE ON UPDATE CASCADE
            ) ENGINE=InnoDB CHARACTER SET=utf8mb4 COLLATE=utf8mb4_unicode_ci",
            
            "CREATE TABLE IF NOT EXISTS `GuideParkAssignments` (
                `assignment_id` INT AUTO_INCREMENT PRIMARY KEY,
                `guide_id` INT NOT NULL,
                `park_id` INT NOT NULL,
                `assigned_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (`guide_id`) REFERENCES `ParkGuides`(`guide_id`) ON DELETE CASCADE ON UPDATE CASCADE,
                FOREIGN KEY (`park_id`) REFERENCES `Parks`(`park_id`) ON DELETE CASCADE ON UPDATE CASCADE,
                UNIQUE (`guide_id`, `park_id`)
            ) ENGINE=InnoDB CHARACTER SET=utf8mb4 COLLATE=utf8mb4_unicode_ci",

            "CREATE TABLE `GuideCertifications` (
                `certification_id` INT AUTO_INCREMENT PRIMARY KEY,
                `guide_id` INT NOT NULL,
                `certification_name` VARCHAR(255) NOT NULL COMMENT 'e.g., First Aid Level 1, Swiftwater Rescue Tech',
                `issue_date` DATE NOT NULL,
                `expiry_date` DATE NULL, -- Some certs might not expire
                FOREIGN KEY (`guide_id`) REFERENCES `ParkGuides`(`guide_id`) ON DELETE CASCADE ON UPDATE CASCADE
            ) ENGINE=InnoDB CHARACTER SET=utf8mb4 COLLATE=utf8mb4_unicode_ci",
            
            "CREATE TABLE IF NOT EXISTS `TrainingCourses` (
                `course_id` INT AUTO_INCREMENT PRIMARY KEY,
                `title` VARCHAR(255) NOT NULL,
                `format` ENUM('Online', 'Physical', 'Hybrid') NOT NULL,
                `duration_hours` DECIMAL(5, 2) NULL,
                `is_active` ENUM('Y','N') NOT NULL DEFAULT 'Y',
                `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB CHARACTER SET=utf8mb4 COLLATE=utf8mb4_unicode_ci",
            
            "CREATE TABLE IF NOT EXISTS `TrainingModules` (
                `module_id` INT AUTO_INCREMENT PRIMARY KEY,
                `course_id` INT NOT NULL,
                `location_platform` VARCHAR(255) NOT NULL COMMENT 'Physical location or Online platform URL',
                `instructor_name` VARCHAR(255) NULL,
                `capacity` INT UNSIGNED NULL,
                `status` ENUM('Scheduled', 'Ongoing', 'Completed', 'Cancelled') NOT NULL DEFAULT 'Scheduled',
                `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (`course_id`) REFERENCES `TrainingCourses`(`course_id`) ON DELETE RESTRICT ON UPDATE CASCADE
            ) ENGINE=InnoDB CHARACTER SET=utf8mb4 COLLATE=utf8mb4_unicode_ci",
            
            "CREATE TABLE IF NOT EXISTS `TrainingTests` (
                `test_id` INT AUTO_INCREMENT PRIMARY KEY,
                `course_id` INT NOT NULL,
                `module_id` INT NULL,
                `test_title` VARCHAR(255) NOT NULL,
                `description` TEXT NULL,
                `passing_score` DECIMAL(5,2) NOT NULL,
                `total_marks` DECIMAL(5,2) NOT NULL
                FOREIGN KEY (`course_id`) REFERENCES `TrainingCourses`(`course_id`) ON DELETE CASCADE ON UPDATE CASCADE,
                FOREIGN KEY (`module_id`) REFERENCES `TrainingModules`(`module_id`) ON DELETE SET NULL ON UPDATE CASCADE
            ) ENGINE=InnoDB CHARACTER SET=utf8mb4 COLLATE=utf8mb4_unicode_ci",
            
            "CREATE TABLE IF NOT EXISTS `GuideTestScores` (
                `score_id` INT AUTO_INCREMENT PRIMARY KEY,
                `guide_id` INT NOT NULL,
                `test_id` INT NOT NULL,
                `score` DECIMAL(5,2) NOT NULL,
                `attempt_date` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                `status` ENUM('Pass', 'Fail', 'Pending') NOT NULL DEFAULT 'Pending',
                `remarks` TEXT NULL,
                FOREIGN KEY (`guide_id`) REFERENCES `ParkGuides`(`guide_id`) ON DELETE CASCADE ON UPDATE CASCADE,
                FOREIGN KEY (`test_id`) REFERENCES `TrainingTests`(`test_id`) ON DELETE CASCADE ON UPDATE CASCADE,
                UNIQUE (`guide_id`, `test_id`)
            ) ENGINE=InnoDB CHARACTER SET=utf8mb4 COLLATE=utf8mb4_unicode_ci",
            
            "CREATE TABLE IF NOT EXISTS `GuideTrainingEnrollments` (
                `enrollment_id` INT AUTO_INCREMENT PRIMARY KEY,
                `guide_id` INT NOT NULL,
                `course_id` INT NOT NULL,
                `enrollment_date` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                `status` ENUM('Registered', 'InProgress', 'Completed', 'Failed', 'Not Registered') NOT NULL DEFAULT 'Not Registered',
                `score_grade` VARCHAR(20) NULL,
                `completion_date` DATE NULL,
                FOREIGN KEY (`guide_id`) REFERENCES `ParkGuides`(`guide_id`) ON DELETE CASCADE ON UPDATE CASCADE,
                FOREIGN KEY (`course_id`) REFERENCES `TrainingCourses`(`course_id`) ON DELETE RESTRICT ON UPDATE CASCADE
            ) ENGINE=InnoDB CHARACTER SET=utf8mb4 COLLATE=utf8mb4_unicode_ci",
            
            "CREATE TABLE IF NOT EXISTS `VisitorFeedback` (
                `feedback_id` INT AUTO_INCREMENT PRIMARY KEY,
                `guide_id` INT NOT NULL,
                `park_id` INT NULL,
                `visitor_name` VARCHAR(255) NULL,
                `visitor_email` VARCHAR(255) NULL,
                `rating` TINYINT UNSIGNED NULL COMMENT 'e.g., 1 to 5',
                `comments` TEXT NULL,
                `feedback_date` DATE NOT NULL,
                `submitted_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (`guide_id`) REFERENCES `ParkGuides`(`guide_id`) ON DELETE CASCADE ON UPDATE CASCADE,
                FOREIGN KEY (`park_id`) REFERENCES `Parks`(`park_id`) ON DELETE SET NULL ON UPDATE CASCADE
            ) ENGINE=InnoDB CHARACTER SET=utf8mb4 COLLATE=utf8mb4_unicode_ci"
        ];
        
        // Execute each table creation query
        foreach ($tables as $query) {
            if (!$conn->query($query)) {
                throw new Exception("Error creating table: " . $conn->error);
            }
        }

        // Check if admin user exists
        $adminEmail = 'admin@gmail.com';
        $checkAdmin = $conn->prepare("SELECT user_id FROM Users WHERE email = ?");
        $checkAdmin->bind_param("s", $adminEmail);
        $checkAdmin->execute();
        $result = $checkAdmin->get_result();
        
        if ($result->num_rows == 0) {
            // Admin user doesn't exist, create it
            $adminPassword = 'admin';
            $hashedPassword = password_hash($adminPassword, PASSWORD_DEFAULT);
            $role = 'Admin';
            
            $insertAdmin = $conn->prepare("INSERT INTO Users (email, password_hash, role) VALUES (?, ?, ?)");
            $insertAdmin->bind_param("sss", $adminEmail, $hashedPassword, $role);
            
            if ($insertAdmin->execute()) {
                echo json_encode([
                    'status' => 'success',
                    'message' => "Database and tables created successfully. Admin user created.",
                    'import_results' => $importResults
                ]);
            } else {
                throw new Exception("Error creating admin user: " . $conn->error);
            }
            
            $insertAdmin->close();
        } else {
            echo json_encode([
                'status' => 'success',
                'message' => "Database and tables created successfully.",
                'import_results' => $importResults
            ]);
        }
        

        // Import data from JSON files if they exist
        $importResults = [];
        $tablesToImport = ['Users', 'Parks', 'ParkGuides', 'GuideParkAssignments', 
                        'TrainingCourses', 'TrainingModules', 'GuideTrainingEnrollments', 
                        'GuideCertifications', 'VisitorFeedback'];

        $backupDir = "backup";

        foreach ($tablesToImport as $table) {
            $filename = "$backupDir/data_{$table}.json";
            if (file_exists($filename)) {
                $jsonData = file_get_contents($filename);
                $data = json_decode($jsonData, true);
                
                if ($data && is_array($data)) {
                    foreach ($data as $row) {
                        // Prepare the INSERT query
                        $columns = implode(', ', array_keys($row));
                        $values = implode(', ', array_fill(0, count($row), '?'));
                        $types = str_repeat('s', count($row));
                        
                        $insertQuery = "INSERT INTO $table ($columns) VALUES ($values)";
                        $stmt = $conn->prepare($insertQuery);
                        
                        if ($stmt) {
                            // Bind parameters
                            $params = array_values($row);
                            $stmt->bind_param($types, ...$params);
                            
                            if ($stmt->execute()) {
                                $importResults[$table] = "Successfully imported data";
                            } else {
                                $importResults[$table] = "Error importing data: " . $stmt->error;
                            }
                            $stmt->close();
                        } else {
                            $importResults[$table] = "Error preparing statement: " . $conn->error;
                        }
                    }
                } else {
                    $importResults[$table] = "No valid data found in $filename";
                }
            } else {
                $importResults[$table] = "File $filename not found";
            }
        }
        
        $checkAdmin->close();
        $conn->close();

        } else {
            throw new Exception("Error creating database: " . $conn->error);
        }
    } else {
        echo json_encode([
            'status' => 'success',
            'message' => "Database already exists"
        ]);
    }
    
} catch (Exception $e) {
    echo json_encode([
        'status' => 'error',
        'message' => 'an error occured'
    ]);
}
?>


