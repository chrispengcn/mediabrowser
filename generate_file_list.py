import os
import json
import argparse
from urllib.parse import quote

def generate_file_structure(root_dir, parent_path=""):
    """
    递归生成文件目录结构，通过parent_path参数追踪完整路径
    root_dir: 当前处理的目录
    parent_path: 从根目录到当前目录的路径
    """
    # 获取当前目录名称
    current_dir_name = os.path.basename(root_dir)
    
    # 构建当前目录的完整路径
    if parent_path:
        current_full_path = f"{parent_path}/{current_dir_name}"
    else:
        current_full_path = current_dir_name  # 根目录的情况
    
    structure = {
        "name": current_dir_name,
        "type": "directory",
        "children": []
    }
    
    try:
        directories = []
        files = []
        
        for entry in os.scandir(root_dir):
            if entry.is_dir(follow_symlinks=False):
                # 递归处理子目录，传递当前完整路径作为父路径
                sub_dir = generate_file_structure(entry.path, current_full_path)
                directories.append(sub_dir)
            elif entry.is_file():
                file_name = entry.name
                _, file_ext = os.path.splitext(file_name)
                file_ext = file_ext[1:].lower() if file_ext else ""
                
                # 构建文件的完整原始路径（包含所有目录层级）
                full_original_path = f"{current_full_path}/{file_name}"
                
                # 确保路径以media/开头
                if not full_original_path.startswith("media/"):
                    full_original_path = f"media/{full_original_path}"
                
                # 编码完整路径
                encoded_path = quote(full_original_path)
                
                file_info = {
                    "name": file_name,
                    "type": "file",
                    "format": file_ext if file_ext else "unknown",
                    "original_path": full_original_path,
                    "path": encoded_path
                }
                files.append(file_info)
        
        directories.sort(key=lambda x: x["name"].lower())
        files.sort(key=lambda x: (x["format"].lower(), x["name"].lower()))
        structure["children"] = directories + files
        
    except PermissionError:
        print(f"警告: 没有访问 {root_dir} 的权限，已跳过")
    except Exception as e:
        print(f"处理 {root_dir} 时出错: {str(e)}")
    
    return structure

def main():
    parser = argparse.ArgumentParser(description='生成包含完整目录层级的媒体文件结构JSON')
    parser.add_argument('--root', default='./media', help='媒体文件根目录，默认为 ./media')
    parser.add_argument('--output', default='files.json', help='输出的JSON文件名，默认为 files.json')
    
    args = parser.parse_args()
    
    # 转换为绝对路径
    root_abs = os.path.abspath(args.root)
    if not os.path.isdir(root_abs):
        print(f"错误: 目录 {root_abs} 不存在")
        return
    
    print(f"正在扫描目录: {root_abs}")
    # 获取根目录名称，用于初始化路径
    root_name = os.path.basename(root_abs)
    file_structure = generate_file_structure(root_abs, parent_path="")
    
    try:
        with open(args.output, 'w', encoding='utf-8') as f:
            json.dump(file_structure, f, ensure_ascii=False, indent=4)
        print(f"文件结构已成功保存到 {args.output}")
    except Exception as e:
        print(f"保存JSON文件时出错: {str(e)}")

if __name__ == "__main__":
    main()
    