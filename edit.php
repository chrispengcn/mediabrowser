<?php
// Handle file list generation request
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['generate'])) {
    $rootDir = './media'; // Media files root directory, consistent with Python script
    $outputFile = 'files.json'; // Output JSON file name
    
    // Recursively generate file structure
    function generateFileStructure($dir, $parentPath = '') {
        $currentDirName = basename($dir);
        
        // Build full path for current directory
        if ($parentPath) {
            $currentFullPath = $parentPath . '/' . $currentDirName;
        } else {
            $currentFullPath = $currentDirName;
        }
        
        $structure = [
            'name' => $currentDirName,
            'type' => 'directory',
            'children' => []
        ];
        
        $directories = [];
        $files = [];
        
        // Scan directory
        if ($handle = opendir($dir)) {
            while (false !== ($entry = readdir($handle))) {
                if ($entry != "." && $entry != "..") {
                    $path = $dir . '/' . $entry;
                    
                    if (is_dir($path) && !is_link($path)) {
                        // Recursively process subdirectories
                        $subDir = generateFileStructure($path, $currentFullPath);
                        $directories[] = $subDir;
                    } elseif (is_file($path)) {
                        // Process files
                        $fileInfo = pathinfo($entry);
                        $fileExt = isset($fileInfo['extension']) ? strtolower($fileInfo['extension']) : '';
                        
                        // Build full original path
                        $fullOriginalPath = $currentFullPath . '/' . $entry;
                        
                        // Ensure path starts with media/
                        if (strpos($fullOriginalPath, 'media/') !== 0) {
                            $fullOriginalPath = 'media/' . $fullOriginalPath;
                        }
                        
                        // Encode path
                        $encodedPath = rawurlencode($fullOriginalPath);
                        
                        $files[] = [
                            'name' => $entry,
                            'type' => 'file',
                            'format' => $fileExt ?: 'unknown',
                            'path' => $encodedPath
                        ];
                    }
                }
            }
            closedir($handle);
        }
        
        // Sort directories and files (consistent with Python script sorting rules)
        usort($directories, function($a, $b) {
            return strcasecmp($a['name'], $b['name']);
        });
        
        usort($files, function($a, $b) {
            $extCompare = strcasecmp($a['format'], $b['format']);
            return $extCompare !== 0 ? $extCompare : strcasecmp($a['name'], $b['name']);
        });
        
        $structure['children'] = array_merge($directories, $files);
        return $structure;
    }
    
    // Check if root directory exists
    if (!is_dir($rootDir)) {
        $error = "Error: Directory $rootDir does not exist";
    } else {
        try {
            // Generate file structure
            $fileStructure = generateFileStructure($rootDir);
            
            // Save as compact JSON (no indentation)
            $jsonContent = json_encode($fileStructure, JSON_UNESCAPED_UNICODE);
            
            if (file_put_contents($outputFile, $jsonContent) !== false) {
                $success = "File structure successfully saved to $outputFile";
            } else {
                $error = "Error saving JSON file";
            }
        } catch (Exception $e) {
            $error = "Error processing directory: " . $e->getMessage();
        }
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Generate File List</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdn.jsdelivr.net/npm/font-awesome@4.7.0/css/font-awesome.min.css" rel="stylesheet">
</head>
<body class="bg-gray-50 min-h-screen">
    <div class="container mx-auto px-4 py-8 max-w-2xl">
        <header class="mb-8">
            <h1 class="text-2xl font-bold text-gray-800 flex items-center">
                <i class="fa fa-refresh text-primary mr-2"></i>
                Generate File List
            </h1>
            <p class="text-gray-600 mt-2">Generate JSON index file for media files directory structure</p>
        </header>
        
        <main class="bg-white rounded-lg shadow-md p-6">
            <?php if (isset($success)): ?>
                <div class="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4 flex items-center">
                    <i class="fa fa-check-circle mr-2"></i>
                    <span><?php echo $success; ?></span>
                </div>
            <?php endif; ?>
            
            <?php if (isset($error)): ?>
                <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 flex items-center">
                    <i class="fa fa-exclamation-circle mr-2"></i>
                    <span><?php echo $error; ?></span>
                </div>
            <?php endif; ?>
            
            <p class="text-gray-700 mb-4">Click the button below to generate the file list index. This will create/update the files.json file containing the directory structure of all media files.</p>
            
            <form method="post" onsubmit="return confirm('Are you sure you want to generate the file list? This will overwrite the existing files.json file.');">
                <button type="submit" name="generate" class="bg-primary hover:bg-primary/90 text-white font-medium py-2 px-6 rounded-md transition-colors duration-300 flex items-center">
                    <i class="fa fa-file-code-o mr-2"></i>
                    Generate File List
                </button>
            </form>
            
            <div class="mt-6 text-sm text-gray-500">
                <p><i class="fa fa-info-circle mr-1"></i> Root Directory: <code>./media</code></p>
                <p><i class="fa fa-info-circle mr-1"></i> Output File: <code>files.json</code></p>
            </div>
        </main>
        
        <footer class="mt-8 text-center text-gray-500 text-sm">
            <p>Media Browser Management Tool</p>
        </footer>
    </div>
</body>
</html>