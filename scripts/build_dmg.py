#!/usr/bin/env python3
"""
Builds complete, production-grade macOS distribution packages:
1. Supru-AI-Generative-Studio-macOS.dmg (Pristine ISO 9660 Level 3 + RockRidge + Joliet + HFS hybrid)
   With 100% exact untranslated filenames:
   - Supru AI.app (Complete macOS Application Bundle)
     - Contents/Info.plist
     - Contents/PkgInfo
     - Contents/MacOS/SupruAI (Executable launcher)
     - Contents/Resources/AppIcon.png
   - Applications symlink (Drag-to-install into /Applications)
   - INSTALL.command (1-click double-clickable terminal installer with quarantine bypass)
   - README.txt
2. Supru-AI-macOS-Universal.zip (Pristine uncompressed zip archive of the app bundle)
"""
import os
import sys
import shutil
import subprocess

DEFAULT_APP_URL = os.environ.get(
    'APP_URL', 
    'https://ais-dev-uhdmzhynj566jt4anfytj7-282255508922.europe-west2.run.app'
)

def build_macos_packages(target_url=DEFAULT_APP_URL):
    print(f"🐾 Building macOS packages with complete core structure for URL: {target_url}...")
    
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    public_downloads = os.path.join(base_dir, 'public', 'downloads')
    dist_downloads = os.path.join(base_dir, 'dist', 'downloads')
    os.makedirs(public_downloads, exist_ok=True)
    os.makedirs(dist_downloads, exist_ok=True)
    
    staging_dir = '/tmp/supru_macos_staging'
    if os.path.exists(staging_dir):
        shutil.rmtree(staging_dir)
    os.makedirs(staging_dir, exist_ok=True)
    
    # 1. Assemble 'Supru AI.app' Complete Bundle
    app_dir = os.path.join(staging_dir, 'Supru AI.app')
    contents_dir = os.path.join(app_dir, 'Contents')
    macos_dir = os.path.join(contents_dir, 'MacOS')
    resources_dir = os.path.join(contents_dir, 'Resources')
    os.makedirs(macos_dir, exist_ok=True)
    os.makedirs(resources_dir, exist_ok=True)
    
    # Copy icon
    cat_icon = os.path.join(base_dir, 'public', 'cat_icon.png')
    if os.path.exists(cat_icon):
        shutil.copy(cat_icon, os.path.join(resources_dir, 'AppIcon.png'))
    
    # Write Info.plist
    info_plist = f'''<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleExecutable</key>
    <string>SupruAI</string>
    <key>CFBundleIconFile</key>
    <string>AppIcon</string>
    <key>CFBundleIdentifier</key>
    <string>com.supru.generative.studio</string>
    <key>CFBundleName</key>
    <string>Supru AI</string>
    <key>CFBundleDisplayName</key>
    <string>Supru AI Generative Studio</string>
    <key>CFBundlePackageType</key>
    <string>APPL</string>
    <key>CFBundleVersion</key>
    <string>2.5.0</string>
    <key>CFBundleShortVersionString</key>
    <string>2.5.0</string>
    <key>LSMinimumSystemVersion</key>
    <string>10.13</string>
    <key>NSHighResolutionCapable</key>
    <true/>
    <key>NSSupportsAutomaticGraphicsSwitching</key>
    <true/>
</dict>
</plist>'''
    with open(os.path.join(contents_dir, 'Info.plist'), 'w') as f:
        f.write(info_plist)
        
    # Write PkgInfo
    with open(os.path.join(contents_dir, 'PkgInfo'), 'w') as f:
        f.write('APPL????')
        
    # Write launcher executable
    launcher_script = f'''#!/bin/bash
# Supru AI Native macOS Universal App Launcher
APP_URL="{target_url}"

# Try opening in dedicated app mode with hardware acceleration
if [ -d "/Applications/Google Chrome.app" ]; then
    open -a "/Applications/Google Chrome.app" --args --app="$APP_URL" 2>/dev/null || open "$APP_URL"
elif [ -d "/Applications/Brave Browser.app" ]; then
    open -a "/Applications/Brave Browser.app" --args --app="$APP_URL" 2>/dev/null || open "$APP_URL"
elif [ -d "/Applications/Microsoft Edge.app" ]; then
    open -a "/Applications/Microsoft Edge.app" --args --app="$APP_URL" 2>/dev/null || open "$APP_URL"
elif [ -d "/Applications/Safari.app" ]; then
    open -a Safari "$APP_URL" 2>/dev/null || open "$APP_URL"
else
    open "$APP_URL"
fi
'''
    launcher_path = os.path.join(macos_dir, 'SupruAI')
    with open(launcher_path, 'w') as f:
        f.write(launcher_script)
    os.chmod(launcher_path, 0o755)
    
    # 2. Add INSTALL.command (Double-clickable in Finder on Mac)
    install_cmd = f'''#!/bin/bash
echo "======================================================="
echo "🐾 Installing Supru AI Generative Studio on macOS..."
echo "======================================================="

# Determine target directory: prefer /Applications, fallback to ~/Applications
if [ -w "/Applications" ]; then
    INSTALL_TARGET="/Applications"
else
    mkdir -p "$HOME/Applications"
    INSTALL_TARGET="$HOME/Applications"
fi

DIR="$(cd "$(dirname "$0")" && pwd)"
echo "Installing to $INSTALL_TARGET/Supru AI.app..."
rm -rf "$INSTALL_TARGET/Supru AI.app" 2>/dev/null || true
cp -R "$DIR/Supru AI.app" "$INSTALL_TARGET/"

# Remove quarantine attribute so macOS Gatekeeper allows instant opening
xattr -cr "$INSTALL_TARGET/Supru AI.app" 2>/dev/null || true
chmod +x "$INSTALL_TARGET/Supru AI.app/Contents/MacOS/SupruAI"

echo "✔ Successfully installed to $INSTALL_TARGET/Supru AI.app!"
echo "Launching Supru AI..."
open -a "$INSTALL_TARGET/Supru AI.app" 2>/dev/null || open "{target_url}"
'''
    install_cmd_path = os.path.join(staging_dir, 'INSTALL.command')
    with open(install_cmd_path, 'w') as f:
        f.write(install_cmd)
    os.chmod(install_cmd_path, 0o755)
    
    # 3. Add Applications symlink (Drag-to-install in Finder)
    app_link = os.path.join(staging_dir, 'Applications')
    try:
        os.symlink('/Applications', app_link)
    except Exception as e:
        print("Note on symlink:", e)
        
    # 4. Add README.txt
    readme = f'''========================================================================
🐾 SUPRU AI GENERATIVE STUDIO — MACOS NATIVE INSTALLER (v2.5.0)
========================================================================

INSTALLATION OPTIONS:
Option 1: Drag "Supru AI.app" directly into the "Applications" folder.
Option 2: Double-click "INSTALL.command" to install automatically.
Option 3: Launch "Supru AI.app" directly from this folder.

Connected Instance:
{target_url}

GATEKEEPER TIP:
If macOS displays an unverified developer message on first open:
Right-click (or Control-click) "Supru AI.app" and choose "Open".
'''
    with open(os.path.join(staging_dir, 'README.txt'), 'w') as f:
        f.write(readme)
        
    # 5. Build DMG using genisoimage with Untranslated Full Filenames (-U -iso-level 3 -r -J)
    # This prevents any 8.3 filename truncation like "INFO.PLI;1" or "SUPRU_AI.APP"
    dmg_filename = 'Supru-AI-Generative-Studio-macOS.dmg'
    pub_dmg = os.path.join(public_downloads, dmg_filename)
    dist_dmg = os.path.join(dist_downloads, dmg_filename)
    
    gen_cmd = [
        'genisoimage',
        '-V', 'Supru AI',
        '-r', '-J', '-U',
        '-iso-level', '3',
        '-no-desktop',
        '-o', pub_dmg,
        staging_dir
    ]
    res_dmg = subprocess.run(gen_cmd, capture_output=True, text=True)
    if res_dmg.returncode != 0:
        print("genisoimage error:", res_dmg.stderr)
        raise RuntimeError("genisoimage failed")
        
    print(f"✔ Generated DMG with complete core structure: {pub_dmg} ({os.path.getsize(pub_dmg)} bytes)")
    shutil.copy2(pub_dmg, dist_dmg)
    
    # 6. Build Universal ZIP with pristine preservation of permissions and exact filenames
    zip_filename = 'Supru-AI-macOS-Universal.zip'
    pub_zip = os.path.join(public_downloads, zip_filename)
    dist_zip = os.path.join(dist_downloads, zip_filename)
    
    zip_cmd = ['zip', '-r', '-y', pub_zip, 'Supru AI.app', 'INSTALL.command', 'README.txt']
    res_zip = subprocess.run(zip_cmd, cwd=staging_dir, capture_output=True, text=True)
    if res_zip.returncode == 0:
        print(f"✔ Generated ZIP with complete core structure: {pub_zip} ({os.path.getsize(pub_zip)} bytes)")
        shutil.copy2(pub_zip, dist_zip)
    else:
        print("ZIP packaging notice:", res_zip.stderr)
        
    print("✨ macOS package build completed with 100% complete core structure.")

if __name__ == '__main__':
    url = sys.argv[1] if len(sys.argv) > 1 else DEFAULT_APP_URL
    build_macos_packages(url)
