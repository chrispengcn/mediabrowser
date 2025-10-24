// 全局变量
let fileData = null;
let history = [];
let historyIndex = -1;
let currentFile = null;
let audioPlayer = null;
let videoPlayer = null;
let lyricsData = []; // 存储解析后的歌词数据
let currentLyricIndex = -1; // 当前播放的歌词索引
let lyricsScrollContainer = null; // 歌词滚动容器
let currentLyricPath = ""; // 当前歌词文件路径
let sidebarVisible = true; // 侧边栏可见状态
let autoplayAttempted = false; // 标记是否尝试过自动播放

// DOM元素
const treeContainer = document.getElementById('tree-container');
const loadingIndicator = document.getElementById('loading-indicator');
const previewContent = document.getElementById('preview-content');
const previewPlaceholder = document.querySelector('.preview-placeholder');
const backBtn = document.getElementById('back-btn');
const forwardBtn = document.getElementById('forward-btn');
const refreshBtn = document.getElementById('refresh-btn');
const menuToggle = document.getElementById('menu-toggle');
const documentTree = document.getElementById('document-tree');
const sidebarOverlay = document.getElementById('sidebar-overlay');

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    // 初始化侧边栏状态（移动端默认隐藏）
    initSidebarState();
    
    // 加载文件数据
    loadFileData();
    
    // 事件监听
    backBtn.addEventListener('click', goBack);
    forwardBtn.addEventListener('click', goForward);
    refreshBtn.addEventListener('click', reloadFileData);
    menuToggle.addEventListener('click', toggleSidebar);
    sidebarOverlay.addEventListener('click', toggleSidebar);
    
    // 监听窗口大小变化，调整侧边栏状态
    window.addEventListener('resize', initSidebarState);
    
    // 添加页面交互事件监听器，用于处理浏览器自动播放限制
    document.addEventListener('click', handlePageInteraction);
    document.addEventListener('keydown', handlePageInteraction);
});

// 处理页面交互，用于触发自动播放
function handlePageInteraction() {
    if (!autoplayAttempted && audioPlayer) {
        tryPlayAudio();
        autoplayAttempted = true;
    }
}

// 初始化侧边栏状态
function initSidebarState() {
    if (window.innerWidth < 768) { // 移动端
        sidebarVisible = false;
        documentTree.classList.add('sidebar-hidden');
        documentTree.classList.remove('sidebar-visible');
        sidebarOverlay.classList.add('hidden');
    } else { // 桌面端
        sidebarVisible = true;
        documentTree.classList.add('sidebar-visible');
        documentTree.classList.remove('sidebar-hidden');
        sidebarOverlay.classList.add('hidden');
    }
}

// 切换侧边栏显示/隐藏
function toggleSidebar() {
    sidebarVisible = !sidebarVisible;
    
    if (sidebarVisible) {
        documentTree.classList.remove('sidebar-hidden');
        documentTree.classList.add('sidebar-visible');
        sidebarOverlay.classList.remove('hidden');
    } else {
        documentTree.classList.remove('sidebar-visible');
        documentTree.classList.add('sidebar-hidden');
        sidebarOverlay.classList.add('hidden');
    }
}

// 加载文件数据
async function loadFileData() {
    try {
        const response = await fetch('files.json');
        if (!response.ok) throw new Error('加载文件数据失败');
        
        fileData = await response.json();
        // 隐藏加载指示器
        if (loadingIndicator) {
            loadingIndicator.style.display = 'none';
        }
        renderTree(fileData, treeContainer);
        updateHistoryButtons();
    } catch (error) {
        treeContainer.innerHTML = `
            <div class="text-center text-red-500 py-8">
                <i class="fa fa-exclamation-circle mr-2"></i>加载失败: ${error.message}
            </div>
        `;
        console.error('Error loading file data:', error);
    }
}

// 重新加载文件数据
function reloadFileData() {
    // 显示加载指示器
    if (loadingIndicator) {
        loadingIndicator.style.display = 'block';
    }
    treeContainer.innerHTML = `
        <div id="loading-indicator" class="text-center text-gray-500 py-8">
            <i class="fa fa-spinner fa-spin mr-2"></i>重新加载中...
        </div>
    `;
    loadFileData();
}

// 渲染文档树
function renderTree(node, parentElement, level = 0) {
    const isRoot = level === 0;
    const nodeElement = document.createElement('div');
    nodeElement.className = isRoot ? '' : 'mb-1';
    
    // 创建节点标题
    const nodeTitle = document.createElement('div');
    nodeTitle.className = 'flex items-center py-1 px-2 rounded hover:bg-gray-100 cursor-pointer';
    
    if (node.type === 'directory') {
        // 目录节点
        const icon = document.createElement('i');
        icon.className = 'fa fa-folder text-yellow-500 mr-2';
        icon.dataset.type = 'directory';
        
        const name = document.createElement('span');
        name.textContent = node.name;
        name.className = 'text-gray-800';
        
        const toggleBtn = document.createElement('button');
        toggleBtn.className = 'ml-auto text-gray-400 hover:text-gray-600';
        toggleBtn.innerHTML = '<i class="fa fa-chevron-down text-xs"></i>';
        toggleBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleDirectory(nodeElement, toggleBtn);
        });
        
        nodeTitle.appendChild(icon);
        nodeTitle.appendChild(name);
        nodeTitle.appendChild(toggleBtn);
        
        // 点击目录标题也可以展开/折叠
        nodeTitle.addEventListener('click', () => {
            toggleDirectory(nodeElement, toggleBtn);
        });
        
        // 创建子节点容器
        const childrenContainer = document.createElement('div');
        childrenContainer.className = 'tree-line hidden';
        
        // 递归渲染子节点
        if (node.children && node.children.length > 0) {
            node.children.forEach(child => {
                renderTree(child, childrenContainer, level + 1);
            });
        } else {
            const emptyMsg = document.createElement('div');
            emptyMsg.className = 'text-gray-400 text-sm italic py-1';
            emptyMsg.textContent = '空目录';
            childrenContainer.appendChild(emptyMsg);
        }
        
        nodeElement.appendChild(nodeTitle);
        nodeElement.appendChild(childrenContainer);
    } else {
        // 文件节点
        const icon = document.createElement('i');
        const fileExt = node.format.toLowerCase();
        
        // 根据文件类型设置不同图标，移除wma支持
        if (['mp3', 'wav', 'ogg'].includes(fileExt)) {
            icon.className = 'fa fa-music text-purple-500 mr-2';
        } else if (['mp4', 'wmv', 'mov', 'avi'].includes(fileExt)) {
            icon.className = 'fa fa-film text-green-500 mr-2';
        } else if (['pdf'].includes(fileExt)) {
            icon.className = 'fa fa-file-pdf-o text-red-500 mr-2';
        } else if (['txt'].includes(fileExt)) {
            icon.className = 'fa fa-file-text-o text-gray-600 mr-2';
        } else if (['html', 'htm'].includes(fileExt)) {
            icon.className = 'fa fa-html5 text-orange-500 mr-2';
        } else if (['zip', 'rar'].includes(fileExt)) {
            icon.className = 'fa fa-file-archive-o text-blue-500 mr-2';
        } else if (['lrc'].includes(fileExt)) {
            icon.className = 'fa fa-file-text-o text-green-500 mr-2';
        } else if (['jpg', 'jpeg', 'png', 'webp'].includes(fileExt)) {
            icon.className = 'fa fa-file-image-o text-pink-500 mr-2';
        } else {
            icon.className = 'fa fa-file-o text-gray-500 mr-2';
        }
        
        icon.dataset.type = 'file';
        icon.dataset.format = fileExt;
        
        const name = document.createElement('span');
        name.textContent = node.name;
        name.className = 'text-gray-700';
        
        nodeTitle.appendChild(icon);
        nodeTitle.appendChild(name);
        
        // 点击文件节点预览文件，移动端点击后自动隐藏侧边栏
        nodeTitle.addEventListener('click', () => {
            previewFile(node);
            addToHistory(node);
            
            // 移动端自动隐藏侧边栏
            if (window.innerWidth < 768) {
                toggleSidebar();
            }
            
            // 触发自动播放
            autoplayAttempted = false;
            handlePageInteraction();
        });
        
        nodeElement.appendChild(nodeTitle);
    }
    
    parentElement.appendChild(nodeElement);
    
    // 根目录默认展开
    if (isRoot && node.type === 'directory') {
        const toggleBtn = nodeTitle.querySelector('button');
        toggleDirectory(nodeElement, toggleBtn);
    }
}

// 切换目录展开/折叠状态
function toggleDirectory(nodeElement, toggleBtn) {
    const childrenContainer = nodeElement.querySelector('.tree-line');
    const icon = toggleBtn.querySelector('i');
    
    if (childrenContainer.classList.contains('hidden')) {
        childrenContainer.classList.remove('hidden');
        icon.className = 'fa fa-chevron-up text-xs';
    } else {
        childrenContainer.classList.add('hidden');
        icon.className = 'fa fa-chevron-down text-xs';
    }
}

// 尝试播放音频，处理浏览器自动播放限制
function tryPlayAudio() {
    if (audioPlayer && audioPlayer.paused) {
        audioPlayer.play()
            .then(() => {
                console.log('音频自动播放成功');
                // 更新播放按钮状态
                const playPauseBtn = document.querySelector('.lyrics-container + button, audio + button');
                if (playPauseBtn) {
                    playPauseBtn.innerHTML = '<i class="fa fa-pause mr-1"></i> Pause';
                }
            })
            .catch(error => {
                console.log('音频自动播放失败，需要用户交互:', error);
                // 显示提示，引导用户手动播放
                if (lyricsScrollContainer) {
                    const playHint = document.createElement('div');
                    playHint.className = 'absolute top-4 right-4 bg-amber-500 text-white text-sm px-3 py-1 rounded-full shadow';
                    playHint.innerHTML = '<i class="fa fa-info-circle mr-1"></i> 请点击播放按钮开始播放';
                    lyricsScrollContainer.parentElement.appendChild(playHint);
                    
                    // 3秒后自动隐藏提示
                    setTimeout(() => {
                        playHint.style.opacity = '0';
                        playHint.style.transition = 'opacity 0.5s';
                        setTimeout(() => playHint.remove(), 500);
                    }, 3000);
                }
            });
    }
}

// 预览文件
function previewFile(file) {
    // 重置歌词状态
    resetLyrics();
    
    currentFile = file;
    previewPlaceholder.classList.add('hidden');
    previewContent.classList.remove('hidden');
    previewContent.innerHTML = '';
    
    // 根据文件类型显示不同的预览内容
    const fileExt = file.format.toLowerCase();
    
    // 添加文件信息标题和下载按钮
    const fileInfo = document.createElement('div');
    fileInfo.className = 'mb-3 pb-3 border-b border-gray-200 flex flex-wrap justify-between items-center';
    
    // 文件名和路径部分
    const fileDetails = document.createElement('div');
    fileDetails.innerHTML = `
        <h3 class="text-xl font-semibold text-gray-800">${file.name}</h3>
        <p class="text-gray-500 text-sm" id="text-file-path">路径: ${file.path} | 类型: .${fileExt}</p>
    `;
    
    // 下载按钮
    const downloadBtn = document.createElement('button');
    downloadBtn.className = 'px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 mt-2 sm:mt-0';
    downloadBtn.innerHTML = '<i class="fa fa-download mr-1"></i> 下载文件';
    downloadBtn.addEventListener('click', () => {
        window.open(file.path, '_blank');
    });
    
    fileInfo.appendChild(fileDetails);
    fileInfo.appendChild(downloadBtn);
    previewContent.appendChild(fileInfo);
    
    // 创建控制栏
    const controls = document.createElement('div');
    controls.className = 'flex items-center space-x-3 mb-3 flex-wrap';
    
    // 根据文件类型创建不同的播放器/预览器，移除wma支持
    if (['mp3', 'wav', 'ogg'].includes(fileExt)) {
        // 音频文件 - 带歌词功能
        if (videoPlayer) {
            videoPlayer.pause();
            videoPlayer = null;
        }
        
        // 创建音频播放器
        audioPlayer = document.createElement('audio');
        audioPlayer.src = file.path;
        audioPlayer.controls = true;
        audioPlayer.className = 'w-full';
        audioPlayer.preload = 'auto'; // 预加载更多内容，减少播放中断
        
        // 添加自定义控制按钮
        const playPauseBtn = document.createElement('button');
        playPauseBtn.className = 'p-2 bg-primary text-white rounded hover:bg-primary/90';
        playPauseBtn.innerHTML = '<i class="fa fa-play mr-1"></i> Play';
        
        playPauseBtn.addEventListener('click', () => {
            if (audioPlayer.paused) {
                audioPlayer.play();
                playPauseBtn.innerHTML = '<i class="fa fa-pause mr-1"></i> Pause';
            } else {
                audioPlayer.pause();
                playPauseBtn.innerHTML = '<i class="fa fa-play mr-1"></i> Play';
            }
        });
        
        audioPlayer.addEventListener('play', () => {
            playPauseBtn.innerHTML = '<i class="fa fa-pause mr-1"></i> Pause';
        });
        
        audioPlayer.addEventListener('pause', () => {
            playPauseBtn.innerHTML = '<i class="fa fa-play mr-1"></i> Play';
        });
        
        // 监听音频时间更新，同步歌词
        audioPlayer.addEventListener('timeupdate', syncLyrics);
        
        // 添加播放结束事件监听，用于自动播放下一曲
        audioPlayer.addEventListener('ended', handleAudioEnded);
        
        controls.appendChild(playPauseBtn);
        previewContent.appendChild(controls);
        previewContent.appendChild(audioPlayer);
        
        // 创建歌词显示区域
        createLyricsContainer();
        
        // 尝试加载对应的歌词文件
        currentLyricPath = getLyricFilePath(file.path, fileExt);
        loadLyrics(currentLyricPath);
        
        // 尝试自动播放
        tryPlayAudio();
        
    } else if (['mp4', 'wmv', 'mov', 'avi'].includes(fileExt)) {
        // 视频文件
        stopAllMedia();
        
        videoPlayer = document.createElement('video');
        videoPlayer.src = file.path;
        videoPlayer.controls = true;
        videoPlayer.className = 'w-full rounded-lg shadow';
        videoPlayer.preload = 'metadata';
        videoPlayer.style.maxHeight = '70vh';
        
        // 添加自定义控制按钮
        const playPauseBtn = document.createElement('button');
        playPauseBtn.className = 'p-2 bg-primary text-white rounded hover:bg-primary/90';
        playPauseBtn.innerHTML = '<i class="fa fa-play mr-1"></i> Play';
        
        playPauseBtn.addEventListener('click', () => {
            if (videoPlayer.paused) {
                videoPlayer.play();
                playPauseBtn.innerHTML = '<i class="fa fa-pause mr-1"></i> Pause';
            } else {
                videoPlayer.pause();
                playPauseBtn.innerHTML = '<i class="fa fa-play mr-1"></i> Play';
            }
        });
        
        videoPlayer.addEventListener('play', () => {
            playPauseBtn.innerHTML = '<i class="fa fa-pause mr-1"></i> Pause';
        });
        
        videoPlayer.addEventListener('pause', () => {
            playPauseBtn.innerHTML = '<i class="fa fa-play mr-1"></i> Play';
        });
        
        controls.appendChild(playPauseBtn);
        previewContent.appendChild(controls);
        previewContent.appendChild(videoPlayer);
        
    } else if (['jpg', 'jpeg', 'png', 'webp'].includes(fileExt)) {
        // 图像文件
        stopAllMedia();
        
        const imageContainer = document.createElement('div');
        imageContainer.className = 'w-full flex justify-center items-center bg-white rounded-lg shadow-sm p-4';
        
        // 创建图像预览
        const imageViewer = document.createElement('img');
        imageViewer.src = file.path;
        imageViewer.className = 'max-w-full max-h-[70vh] rounded shadow';
        imageViewer.alt = `预览 ${file.name}`;
        imageViewer.loading = 'lazy';
        
        // 添加加载失败处理
        imageViewer.addEventListener('error', () => {
            imageContainer.innerHTML = `
                <div class="text-center py-8">
                    <i class="fa fa-exclamation-circle text-6xl mb-4 text-red-500"></i>
                    <h3 class="text-xl mb-2">无法加载图像</h3>
                    <p class="text-gray-600">可能是文件路径错误或图像已损坏</p>
                </div>
            `;
        });
        
        imageContainer.appendChild(imageViewer);
        previewContent.appendChild(imageContainer);
        
    } else if (['pdf'].includes(fileExt)) {
        // PDF文件
        stopAllMedia();
        
        // 创建PDF预览区域
        const pdfContainer = document.createElement('div');
        pdfContainer.className = 'w-full bg-white rounded-lg shadow-sm p-3';
        
        // 使用iframe预览PDF
        const pdfViewer = document.createElement('iframe');
        pdfViewer.src = file.path;
        pdfViewer.className = 'w-full';
        pdfViewer.style.height = '70vh';
        pdfViewer.title = `预览 ${file.name}`;
        
        pdfContainer.appendChild(pdfViewer);
        previewContent.appendChild(pdfContainer);
        
    } else if (['txt', 'lrc'].includes(fileExt)) {
        // 文本文件和歌词文件
        stopAllMedia();
        
        const txtContainer = document.createElement('div');
        txtContainer.className = 'w-full';
        
        // 添加编码选择下拉框（针对文本文件）
        const encodingControls = document.createElement('div');
        encodingControls.className = 'flex items-center space-x-3 mb-3 flex-wrap';
        
        const encodingLabel = document.createElement('span');
        encodingLabel.className = 'text-gray-600';
        encodingLabel.textContent = '编码:';
        
        const encodingSelect = document.createElement('select');
        encodingSelect.className = 'border rounded px-2 py-1';
        encodingSelect.innerHTML = `
            <option value="utf-8">UTF-8</option>
            <option value="gbk">GBK</option>
            <option value="gb2312">GB2312</option>
            <option value="iso-8859-1">ISO-8859-1</option>
        `;
        
        // 添加刷新按钮
        const refreshTxtBtn = document.createElement('button');
        refreshTxtBtn.className = 'p-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300';
        refreshTxtBtn.innerHTML = '<i class="fa fa-refresh mr-1"></i> 刷新内容';
        
        // 文本内容区域
        const contentArea = document.createElement('pre');
        contentArea.className = 'text-preview';
        contentArea.textContent = '加载文本内容中...';
        
        // 加载文本内容
        function loadTxtContent(encoding = 'utf-8') {
            fetch(file.path)
                .then(response => {
                    if (!response.ok) throw new Error('加载失败');
                    return response.arrayBuffer();
                })
                .then(buffer => {
                    decodeAndDisplayText(buffer, encoding, contentArea);
                })
                .catch(error => {
                    contentArea.innerHTML = `<span class="text-red-500">无法加载内容: ${error.message}</span>`;
                });
        }
        
        refreshTxtBtn.addEventListener('click', () => {
            loadTxtContent(encodingSelect.value);
        });
        
        encodingSelect.addEventListener('change', () => {
            loadTxtContent(encodingSelect.value);
        });
        
        encodingControls.appendChild(encodingLabel);
        encodingControls.appendChild(encodingSelect);
        encodingControls.appendChild(refreshTxtBtn);
        
        txtContainer.appendChild(encodingControls);
        txtContainer.appendChild(contentArea);
        previewContent.appendChild(txtContainer);
        
        // 初始加载
        loadTxtContent();
        
    } else if (['html', 'htm'].includes(fileExt)) {
        // HTML文件
        stopAllMedia();
        
        const htmlContainer = document.createElement('div');
        htmlContainer.className = 'w-full bg-white rounded-lg shadow-sm overflow-hidden';
        
        // 控制按钮
        const htmlControls = document.createElement('div');
        htmlControls.className = 'p-2 border-b flex space-x-2';
        
        const refreshHtmlBtn = document.createElement('button');
        refreshHtmlBtn.className = 'p-1.5 bg-gray-100 text-gray-700 rounded hover:bg-gray-200';
        refreshHtmlBtn.innerHTML = '<i class="fa fa-refresh"></i>';
        refreshHtmlBtn.title = '刷新';
        
        // 使用iframe预览HTML
        const htmlViewer = document.createElement('iframe');
        htmlViewer.src = file.path;
        htmlViewer.className = 'w-full border-0';
        htmlViewer.style.height = '70vh';
        htmlViewer.title = `预览 ${file.name}`;
        
        refreshHtmlBtn.addEventListener('click', () => {
            htmlViewer.src = file.path;
        });
        
        htmlControls.appendChild(refreshHtmlBtn);
        htmlContainer.appendChild(htmlControls);
        htmlContainer.appendChild(htmlViewer);
        previewContent.appendChild(htmlContainer);
        
    } else if (['zip', 'rar'].includes(fileExt)) {
        // 压缩文件
        stopAllMedia();
        
        const archiveContainer = document.createElement('div');
        archiveContainer.className = 'text-center py-8 bg-white rounded-lg shadow-sm w-full';
        
        archiveContainer.innerHTML = `
            <i class="fa fa-file-archive-o text-6xl mb-4 text-blue-500"></i>
            <h3 class="text-xl mb-2">压缩文件</h3>
            <p class="text-gray-600 mb-6">文件名: ${file.name}</p>
            <div class="flex justify-center space-x-3 flex-wrap">
                <button class="px-4 py-2 bg-primary text-white rounded hover:bg-primary/90" onclick="window.open('${file.path}', '_blank')">
                    <i class="fa fa-download mr-1"></i> 下载文件
                </button>
                <button class="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300" onclick="showArchiveInfo('${file.name}', '${file.path}')">
                    <i class="fa fa-info-circle mr-1"></i> 文件信息
                </button>
            </div>
        `;
        
        previewContent.appendChild(archiveContainer);
        
    } else {
        // 不支持的文件类型
        stopAllMedia();
        
        const unsupported = document.createElement('div');
        unsupported.className = 'text-center py-8 text-gray-500 bg-white rounded-lg shadow-sm w-full';
        unsupported.innerHTML = `
            <i class="fa fa-file-o text-6xl mb-4 text-gray-300"></i>
            <h3 class="text-xl mb-2">不支持的文件类型</h3>
            <p>无法预览 ${file.format} 类型的文件</p>
            <button class="mt-4 px-4 py-2 bg-primary text-white rounded hover:bg-primary/90" onclick="window.open('${file.path}', '_blank')">
                <i class="fa fa-download mr-1"></i> 下载文件
            </button>
        `;
        previewContent.appendChild(unsupported);
    }
}

// 获取歌词文件路径
function getLyricFilePath(audioPath, audioExt) {
    // 尝试多种歌词文件命名格式
    const basePath = audioPath.replace(`.${audioExt}`, '');
    const possiblePaths = [
        `${basePath}.lrc`,          // 同名lrc文件
        `${basePath}.LRC`,          // 大写扩展名
        `${basePath}_lyrics.lrc`,   // 带lyrics后缀
        `${basePath}-歌词.lrc`      // 带中文歌词后缀
    ];
    
    // 检查是否有可用的歌词文件
    return possiblePaths[0]; // 返回第一个可能的路径，实际会在加载时检查是否存在
}

// 解码并显示文本内容（通用函数）
function decodeAndDisplayText(buffer, encoding, displayElement) {
    // 使用宽松模式解码，允许错误
    const decoder = new TextDecoder(encoding, { fatal: false, ignoreBOM: false });
    try {
        const text = decoder.decode(buffer);
        // 检查是否有解码错误
        if (decoder.decode(buffer).includes('\ufffd')) { // \ufffd是解码错误的替换字符
            displayElement.innerHTML = `
                <span class="text-amber-500">使用${encoding}编码解码时发现部分无法识别的字符</span>
                <br><br>
                ${text}
            `;
        } else {
            displayElement.textContent = text;
        }
    } catch (e) {
        displayElement.innerHTML = `<span class="text-red-500">使用${encoding}编码解码失败: ${e.message}</span>`;
        console.error(`解码失败: ${e}`);
    }
}

// 处理音频播放结束事件
function handleAudioEnded() {
    // 查找下一首歌曲
    const nextFile = findNextAudioFile(currentFile);
    if (nextFile) {
        // 直接预览并自动播放下一首，不设置延迟
        previewFile(nextFile);
        addToHistory(nextFile);
        
        // 移动端自动隐藏侧边栏
        if (window.innerWidth < 768) {
            toggleSidebar();
        }
    }
}

// 查找下一个音频文件，移除wma支持
function findNextAudioFile(currentFile) {
    if (!fileData || !currentFile) return null;
    
    // 递归查找当前文件所在的目录和位置
    function searchFile(node, targetPath) {
        if (node.type === 'directory') {
            // 检查当前目录的子文件
            for (let i = 0; i < node.children.length; i++) {
                const child = node.children[i];
                if (child.type === 'file' && child.path === targetPath) {
                    // 找到当前文件，从下一个位置开始查找音频文件
                    for (let j = i + 1; j < node.children.length; j++) {
                        const nextChild = node.children[j];
                        if (nextChild.type === 'file' && 
                            ['mp3', 'wav', 'ogg'].includes(nextChild.format.toLowerCase())) {
                            return nextChild;
                        }
                    }
                    return null; // 当前目录中没有下一个音频文件
                } else if (child.type === 'directory') {
                    // 递归搜索子目录
                    const result = searchFile(child, targetPath);
                    if (result) return result;
                }
            }
        }
        return null;
    }
    
    return searchFile(fileData, currentFile.path);
}

// 创建歌词显示容器
function createLyricsContainer() {
    // 创建歌词容器
    const lyricsContainer = document.createElement('div');
    lyricsContainer.className = 'lyrics-container mt-4';
    lyricsContainer.innerHTML = `
        <div class="flex justify-between items-center mb-3 pb-2 border-b flex-wrap">
            <h4 class="font-medium">歌词</h4>
            <div class="flex items-center space-x-2">
                <span class="text-sm text-gray-600">编码:</span>
                <select id="lyric-encoding" class="text-sm border rounded px-2 py-1">
                    <option value="utf-8">UTF-8</option>
                    <option value="gbk">GBK</option>
                    <option value="gb2312">GB2312</option>
                    <option value="iso-8859-1">ISO-8859-1</option>
                </select>
            </div>
        </div>
        <div class="relative h-64 overflow-hidden bg-white rounded-lg shadow-sm">
            <div id="lyrics-scroll" class="lyrics-scroll absolute w-full left-0 top-0 px-4">
                <div class="text-center text-gray-400 py-8">
                    加载歌词中...
                </div>
            </div>
        </div>
    `;
    
    previewContent.appendChild(lyricsContainer);
    lyricsScrollContainer = document.getElementById('lyrics-scroll');
    
    // 添加编码切换事件
    const encodingSelect = document.getElementById('lyric-encoding');
    if (encodingSelect) {
        encodingSelect.addEventListener('change', () => {
            if (currentLyricPath) {
                loadLyrics(currentLyricPath, encodingSelect.value);
            }
        });
    }
}

// 加载并解析歌词文件
function loadLyrics(lyricPath, encoding = 'utf-8') {
    // 显示加载状态
    if (lyricsScrollContainer) {
        lyricsScrollContainer.innerHTML = `
            <div class="text-center text-gray-400 py-8">
                <i class="fa fa-spinner fa-spin mr-2"></i>加载歌词中...
            </div>
        `;
    }
    
    fetch(lyricPath)
        .then(response => {
            if (!response.ok) {
                // 歌词文件不存在，显示提示
                if (lyricsScrollContainer) {
                    lyricsScrollContainer.innerHTML = `
                        <div class="text-center text-gray-400 py-8">
                            <i class="fa fa-info-circle mr-2"></i>未找到歌词文件
                            <div class="mt-2 text-sm">尝试手动选择同名字幕文件</div>
                        </div>
                    `;
                }
                throw new Error('歌词文件不存在');
            }
            return response.arrayBuffer();
        })
        .then(buffer => {
            try {
                // 先尝试指定编码解码
                const decoder = new TextDecoder(encoding, { fatal: false });
                let lyricText = decoder.decode(buffer);
                
                // 检查是否有解码错误，如果有则尝试其他编码
                if (lyricText.includes('\ufffd')) { // \ufffd是解码错误的替换字符
                    const encodingsToTry = ['utf-8', 'gbk', 'gb2312', 'iso-8859-1'];
                    const currentIndex = encodingsToTry.indexOf(encoding);
                    
                    // 尝试其他编码
                    for (let i = 0; i < encodingsToTry.length; i++) {
                        if (i !== currentIndex) {
                            try {
                                const altDecoder = new TextDecoder(encodingsToTry[i], { fatal: false });
                                const altText = altDecoder.decode(buffer);
                                if (!altText.includes('\ufffd')) {
                                    lyricText = altText;
                                    // 更新下拉框显示当前使用的编码
                                    const encodingSelect = document.getElementById('lyric-encoding');
                                    if (encodingSelect) {
                                        encodingSelect.value = encodingsToTry[i];
                                    }
                                    break;
                                }
                            } catch (e) {
                                console.log(`尝试编码 ${encodingsToTry[i]} 失败:`, e);
                            }
                        }
                    }
                }
                
                // 解析歌词
                lyricsData = parseLyrics(lyricText);
                
                // 显示歌词
                if (lyricsData.length > 0) {
                    displayLyrics();
                } else {
                    if (lyricsScrollContainer) {
                        lyricsScrollContainer.innerHTML = `
                            <div class="text-center text-gray-400 py-8">
                                <i class="fa fa-info-circle mr-2"></i>歌词文件格式不正确
                            </div>
                        `;
                    }
                }
            } catch (e) {
                if (lyricsScrollContainer) {
                    lyricsScrollContainer.innerHTML = `
                        <div class="text-center text-red-500 py-8">
                            <i class="fa fa-exclamation-circle mr-2"></i>歌词解码失败
                            <div class="mt-2 text-sm">请尝试其他编码格式</div>
                        </div>
                    `;
                }
                console.error('歌词解码错误:', e);
            }
        })
        .catch(error => {
            console.log('加载歌词失败:', error);
        });
}

// 解析LRC歌词格式
function parseLyrics(lrcText) {
    const lyrics = [];
    // 匹配歌词行的正则表达式 [mm:ss.ms]歌词 或 [mm:ss]歌词
    const lineRegex = /\[(\d+):(\d+(\.\d+)?)\](.*)/g;
    let match;
    
    // 清理歌词文本中的特殊字符
    const cleanedText = lrcText.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    
    while ((match = lineRegex.exec(cleanedText)) !== null) {
        const minutes = parseInt(match[1], 10);
        const seconds = parseFloat(match[2]);
        const time = minutes * 60 + seconds;
        const text = match[4].trim() || ' '; // 处理空歌词
        
        lyrics.push({ time, text });
    }
    
    // 按时间排序
    return lyrics.sort((a, b) => a.time - b.time);
}

// 显示歌词
function displayLyrics() {
    if (!lyricsScrollContainer || !lyricsData.length) return;
    
    // 清空现有内容
    lyricsScrollContainer.innerHTML = '';
    
    // 创建歌词行元素
    lyricsData.forEach((lyric, index) => {
        const line = document.createElement('div');
        line.className = 'lyric-line';
        line.textContent = lyric.text;
        line.dataset.index = index;
        line.dataset.time = lyric.time;
        lyricsScrollContainer.appendChild(line);
    });
}

// 同步歌词与音频播放
function syncLyrics() {
    if (!audioPlayer || !lyricsData.length || !lyricsScrollContainer) return;
    
    const currentTime = audioPlayer.currentTime;
    let newIndex = -1;
    
    // 找到当前应该显示的歌词索引
    for (let i = 0; i < lyricsData.length; i++) {
        if (lyricsData[i].time <= currentTime) {
            newIndex = i;
        } else {
            break;
        }
    }
    
    // 如果歌词索引有变化，更新显示
    if (newIndex !== currentLyricIndex && newIndex !== -1) {
        currentLyricIndex = newIndex;
        
        // 移除之前的激活状态
        const prevActive = lyricsScrollContainer.querySelector('.lyric-line.active');
        if (prevActive) {
            prevActive.classList.remove('active');
        }
        
        // 添加新的激活状态
        const lines = lyricsScrollContainer.querySelectorAll('.lyric-line');
        if (lines[currentLyricIndex]) {
            lines[currentLyricIndex].classList.add('active');
            
            // 计算滚动位置，使当前歌词居中
            const lineHeight = lines[currentLyricIndex].offsetHeight;
            const containerHeight = lyricsScrollContainer.parentElement.offsetHeight;
            const scrollTop = currentLyricIndex * lineHeight - (containerHeight / 2 - lineHeight / 2);
            
            // 应用滚动
            lyricsScrollContainer.style.transform = `translateY(-${scrollTop}px)`;
        }
    }
}

// 重置歌词状态
function resetLyrics() {
    lyricsData = [];
    currentLyricIndex = -1;
    lyricsScrollContainer = null;
    currentLyricPath = "";
    
    if (audioPlayer) {
        audioPlayer.removeEventListener('timeupdate', syncLyrics);
        audioPlayer.removeEventListener('ended', handleAudioEnded); // 移除事件监听
        audioPlayer = null;
    }
}

// 停止所有媒体播放
function stopAllMedia() {
    resetLyrics();
    
    if (videoPlayer) {
        videoPlayer.pause();
        videoPlayer = null;
    }
}

// 显示压缩文件信息
function showArchiveInfo(filename, path) {
    alert(`文件信息:\n名称: ${filename}\n路径: ${path}\n类型: 压缩文件\n\n提示: 请下载后解压查看内容`);
}

// 添加到历史记录
function addToHistory(file) {
    // 如果不是第一次浏览，且当前文件与历史记录最后一个相同，则不添加
    if (history.length > 0 && history[historyIndex].id === file.id) {
        return;
    }
    
    // 如果当前不在历史记录末尾，清除后面的记录
    if (historyIndex < history.length - 1) {
        history = history.slice(0, historyIndex + 1);
    }
    
    // 添加新记录
    history.push({...file, id: Date.now()}); // 添加唯一ID用于比较
    historyIndex = history.length - 1;
    updateHistoryButtons();
}

// 后退
function goBack() {
    if (historyIndex > 0) {
        historyIndex--;
        previewFile(history[historyIndex]);
        updateHistoryButtons();
    }
}

// 前进
function goForward() {
    if (historyIndex < history.length - 1) {
        historyIndex++;
        previewFile(history[historyIndex]);
        updateHistoryButtons();
    }
}

// 更新历史按钮状态
function updateHistoryButtons() {
    backBtn.disabled = historyIndex <= 0 || history.length === 0;
    forwardBtn.disabled = historyIndex >= history.length - 1 || history.length === 0;
}