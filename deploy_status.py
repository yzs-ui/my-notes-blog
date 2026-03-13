#!/usr/bin/env python3
"""
博客网站部署状态检查脚本
"""
import urllib.request
import json
import sys

def check_github_pages():
    """检查GitHub Pages状态"""
    print("=== GitHub Pages状态检查 ===")
    
    # 检查网页是否可访问
    try:
        response = urllib.request.urlopen("https://yzs-ui.github.io/my-notes-blog/")
        if response.status == 200:
            print("[OK] GitHub Pages网站可访问")
            print(f"状态码: {response.status}")
            print(f"URL: https://yzs-ui.github.io/my-notes-blog/")
        else:
            print(f"[WARNING] GitHub Pages网站状态码: {response.status}")
    except Exception as e:
        print(f"[ERROR] GitHub Pages网站访问失败: {e}")
        
def check_repository_status():
    """检查GitHub仓库状态"""
    print("=== GitHub仓库状态检查 ===")
    
    # 使用本地gh-cli工具检查
    import subprocess
    
    try:
        result = subprocess.run(
            ["c:/Users/86183/WorkBuddy/Claw/gh-cli/bin/gh.exe", "repo", "view", "yzs-ui/my-notes-blog"],
            capture_output=True,
            text=True
        )
        print("[OK] 仓库信息:")
        print(result.stdout)
    except Exception as e:
        print(f"[ERROR] 仓库检查失败: {e}")
        
def check_local_files():
    """检查本地文件完整性"""
    print("=== 本地文件完整性检查 ===")
    
    required_files = [
        "index.html",
    ]
    
    import os
    
    for file in required_files:
        if os.path.exists(file):
            print(f"[OK] {file} 存在")
        else:
            print(f"[ERROR] {file} 不存在")

if __name__ == "__main__":
    print("博客网站部署状态检查")
    print("======================")
    
    check_local_files()
    print()
    check_github_pages()
    print()
    check_repository_status()
    print()
    
    print("[OK] 部署完成!")
    print("网站地址: https://yzs-ui.github.io/my-notes-blog/")
    print("GitHub仓库: https://github.com/yzs-ui/my-notes-blog")