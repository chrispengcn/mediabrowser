# Static Media Site Generator

A lightweight, Python/PHP-powered static site generator focused on **organizing and serving media files** (e.g., images, documents, videos) with an intuitive web interface. This project combines Python for local file structure generation and PHP for web-based management, making it easy to deploy on any PHP-enabled server.

## Project Overview

This tool solves the problem of managing unstructured media files by creating a **searchable, browsable static index** of your media library. It works in two key ways:



1. **Python Script**: Generates a compressed JSON file (`files.json`) that maps your local `media/` directory structure (recursively scans folders and files).

2. **PHP Web Interface**: Provides a browser-based tool (`edit.php`) to re-generate the JSON index (no local Python required on the server) and serve the media files via a static web interface.

All generated content is static—no databases, no dynamic server-side processing (beyond JSON generation)—making it fast, secure, and easy to host.

## Key Features



| Feature                      | Description                                                                                                                                     |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| **Dual Environment Support** | Use Python for local development (generate JSON offline) or PHP for server-side updates (no Python needed on hosting).                          |
| **Automated File Indexing**  | Recursively scans the `media/` directory to create a structured JSON index (includes file names, types, formats, and encoded paths).            |
| **User-Friendly Web Tool**   | `edit.php` provides a simple interface to:  - Trigger JSON index generation  - View success/error feedback  - Check root directory/output path. |
| **Consistent Sorting**       | Directories sorted alphabetically (case-insensitive); files sorted by format first, then name (ensures predictable browsing).                   |
| **Static & Secure**          | No databases or server-side state—all content is served as static files, reducing attack surface and hosting requirements.                      |
| **Responsive Design**        | Uses Tailwind CSS and Font Awesome to ensure the web interface works on desktops, tablets, and mobile devices.                                  |

## Project Structure



```
your-project/

├── media/               # 📂 Your media files go here (create subfolders as needed)

│   ├── Photos/

│   ├── Documents/

│   └── Videos/

├── files.json           # 📄 Auto-generated JSON index (created by Python/PHP)

├── index.html           # 🌐 Main static web interface (browses media via files.json)

├── edit.php             # 🔧 PHP tool to re-generate files.json (web-based)

├── generate\_index.py    # 🐍 Python script to generate files.json (local use)

└── README.md            # 📖 Project documentation (you’re reading this!)
```

## Prerequisites

Before using the project, ensure you have the following:

### For Local Development (Python)



* Python 3.6+ (to run `generate_index.py` locally)

* A local `media/` directory with your files (create this manually)

### For Server Deployment (PHP)



* A PHP-enabled web server (e.g., Apache, Nginx with PHP-FPM)

* PHP 7.4+ (for `edit.php` to function)

* Write permissions for the project root (so `edit.php` can save `files.json`)

## Getting Started

Follow these steps to set up and use the project.

### 1. Clone/Download the Project

First, get the project files onto your local machine or server:



```
\# Clone (if using Git)

git clone https://github.com/your-username/your-repo-name.git

\# Or download the ZIP file and extract it
```

### 2. Add Your Media Files

Create a `media/` directory in the project root (if it doesn’t exist) and add your media files/folders:



```
media/

├── 2024-Vacation/       # Example subfolder

│   ├── beach.jpg

│   └── hotel.pdf

├── Resume.pdf           # Example root-level file

└── Family-Videos/

&#x20;   └── birthday.mp4
```

### 3. Generate the Initial File Index

Choose one of two methods to create the `files.json` index:

#### Method A: Use Python (Local Development)

Run the Python script to generate the JSON file offline:



```
\# Navigate to the project root

cd your-project/

\# Run the Python script

python generate\_index.py
```



* The script will scan `./media/` and create `files.json` (compressed, no indentation).

* If `files.json` already exists, it will be overwritten.

#### Method B: Use PHP (Server-Side)

If you’re on a server without Python, use the web-based `edit.php`:



1. Upload the project to your PHP-enabled server (e.g., via FTP, cPanel).

2. Open a browser and navigate to `https://your-domain.com/your-project/edit.php`.

3. Click the **"Generate File List"** button.

4. Confirm the prompt (`Are you sure you want to generate the file list?`).

5. You’ll see a success message if `files.json` is created/updated.

### 4. Browse Your Media

Once `files.json` exists, open `index.html` (locally or via your server) to:



* Browse the `media/` directory structure (folders expand/collapse).

* Click files to open/download them (paths are URL-encoded for compatibility).

* Search for files by name or format (if the static interface includes search functionality).

## Usage Tips

### Updating the File Index

When you add/remove/edit files in `media/`, re-generate `files.json` to reflect changes:



* **Local**: Re-run `python ``generate_index.py`.

* **Server**: Visit `edit.php` and click "Generate File List" again.

### Securing Your Media (Optional)

To restrict access to sensitive files:



1. Add an `.htaccess` file to the `media/` directory (for Apache servers) to block direct access:



```
\# media/.htaccess

Order Allow,Deny

Deny from all
```



1. Ensure your static web interface (`index.html`) uses the encoded paths from `files.json` to serve files securely.

### Customizing the Web Interface



* **Styling**: Modify `index.html` or `edit.php` to update colors/fonts (uses Tailwind CSS—edit classes like `bg-gray-50` or `text-primary`).

* **Features**: Add search, filtering, or file previews to `index.html` by extending the JavaScript that parses `files.json`.

## Troubleshooting



| Issue                                               | Solution                                                                                                         |
| --------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `edit.php` shows "Directory ./media does not exist" | Create a `media/` folder in the project root and add files to it.                                                |
| "Permission denied" when saving `files.json`        | Ensure the project root directory has **write permissions** (e.g., `chmod 755` for the folder on Linux servers). |
| Python script fails to run                          | Verify Python 3.6+ is installed (`python --version` or `python3 --version`).                                     |
| Files not appearing in `index.html`                 | Re-generate `files.json` to include new files, and clear your browser cache.                                     |

## Maintenance



* **Backup&#x20;**`files.json`: If you modify the `media/` directory frequently, back up `files.json` to avoid re-scanning large libraries.

* **Update Dependencies**: Periodically update Tailwind CSS (via CDN in `edit.php`/`index.html`) or Font Awesome to get security fixes and new icons.

* **Clean Up Old Files**: Delete unused files from `media/` and re-generate `files.json` to keep the index lean.

## License

This project is licensed under the **MIT License**—see the [LICENSE](LICENSE) file for details (add a `LICENSE` file to your repo if using this).

## Contributing

If you’d like to improve the project:



1. Fork the repository.

2. Create a feature branch (`git checkout -b feature/your-feature`).

3. Commit your changes (`git commit -m "Add search functionality"`).

4. Push to the branch (`git push origin feature/your-feature`).

5. Open a Pull Request.

> （注：文档部分内容可能由 AI 生成）
