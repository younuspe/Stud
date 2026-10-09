!define SUPRU_APP_NAME "Supru AI"
!define SUPRU_PUBLISHER "Supru"
!define SUPRU_VERSION "0.1.0"
!define SUPRU_REG_KEY "Software\Microsoft\Windows\CurrentVersion\Uninstall\Supru AI"
!define SUPRU_INSTALL_REG_KEY "Software\Supru AI"
!define SUPRU_DEFAULT_INSTALL_DIR "$LOCALAPPDATA\Supru AI"

!include "MUI2.nsh"
!include "LogicLib.nsh"
!include "nsDialogs.nsh"
!include "FileFunc.nsh"
!include "WinCore.nsh"
!include "x64.nsh"

Var /GLOBAL InstallDir
Var /GLOBAL LaunchAfterInstall
Var /GLOBAL ComponentCore
Var /GLOBAL ComponentCLI
Var /GLOBAL ComponentDocs

!define MUI_ICON "${NSISDIR}\Contrib\Graphics\Icons\modern-install.ico"
!define MUI_UNICON "${NSISDIR}\Contrib\Graphics\Icons\modern-uninstall.ico"
!define MUI_WELCOMEFINISHPAGE_BITMAP "${NSISDIR}\Contrib\Graphics\Wizard\win.bmp"
!define MUI_WELCOMEPAGE_TITLE "Welcome to the ${SUPRU_APP_NAME} Setup Wizard"
!define MUI_WELCOMEPAGE_TEXT "This wizard will guide you through the installation of ${SUPRU_APP_NAME} ${SUPRU_VERSION}.\n\nClick Next to continue."
!define MUI_FINISHPAGE_TITLE "Completing the ${SUPRU_APP_NAME} Setup Wizard"
!define MUI_FINISHPAGE_TEXT "Setup has finished installing ${SUPRU_APP_NAME} on your computer.\n\nClick Finish to close this wizard."
!define MUI_FINISHPAGE_RUN "Launch ${SUPRU_APP_NAME}"
!define MUI_FINISHPAGE_RUN_NOTCHECKED
!define MUI_FINISHPAGE_SHOWREADME ""
!define MUI_UNWELCOMEPAGE_TITLE "Uninstall ${SUPRU_APP_NAME}"
!define MUI_UNWELCOMEPAGE_TEXT "This wizard will guide you through the uninstallation of ${SUPRU_APP_NAME}.\n\nClick Next to continue."
!define MUI_UNFINISHPAGE_TITLE "Uninstall Complete"
!define MUI_UNFINISHPAGE_TEXT "${SUPRU_APP_NAME} has been successfully removed from your computer.\n\nClick Finish to close this wizard."

!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_LICENSE "${NSISDIR}\Docs\license.txt"
!insertmacro MUI_PAGE_DIRECTORY
Page Custom ComponentPageCreate ComponentPageLeave
Page Custom FinishPageCreate FinishPageLeave
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH

!insertmacro MUI_UNPAGE_WELCOME
!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES
!insertmacro MUI_UNPAGE_FINISH

!define MUI_LANGUAGE "English"
!define MUI_LANGDLL_REGISTRY_ROOT "HKCU"
!define MUI_LANGDLL_REGISTRY_KEY "${SUPRU_INSTALL_REG_KEY}"
!define MUI_LANGDLL_REGISTRY_VALUENAME "Installer Language"

Function .onInit
    InitPluginsDir
    StrCpy $InstallDir "${SUPRU_DEFAULT_INSTALL_DIR}"
    StrCpy $LaunchAfterInstall 1
    StrCpy $ComponentCore 1
    StrCpy $ComponentCLI 1
    StrCpy $ComponentDocs 0
    
    System::Call 'kernel32::GetModuleHandle(i 0)i.r0'
    System::Call 'kernel32::GetModuleFileName(i r0, t .r1, i ${NSIS_MAX_STRLEN})i'
    StrCpy $EXEPATH $1
FunctionEnd

Function .onVerifyInstDir
    ${IfNot} ${FileExists} "$INSTDIR\supru.exe"
        MessageBox MB_OK|MB_ICONEXCLAMATION "The selected directory does not contain a valid ${SUPRU_APP_NAME} installation.$\nPlease select the correct installation directory."
        Abort
    ${EndIf}
FunctionEnd

Function ComponentPageCreate
    nsDialogs::Create 1018
    Pop $0

    ${NSD_CreateLabel} 0 0 100% 12u "Select components to install:"
    Pop $0

    ${NSD_CreateCheckbox} 15u 20u 100% 12u "Core Application (Required)"
    Pop $ComponentCore
    ${NSD_Check} $ComponentCore
    EnableWindow $ComponentCore 0

    ${NSD_CreateCheckbox} 15u 35u 100% 12u "Command Line Interface (CLI)"
    Pop $ComponentCLI
    ${NSD_Check} $ComponentCLI

    ${NSD_CreateCheckbox} 15u 50u 100% 12u "Documentation"
    Pop $ComponentDocs

    nsDialogs::Show
FunctionEnd

Function ComponentPageLeave
    ${NSD_GetState} $ComponentCore $ComponentCore
    ${NSD_GetState} $ComponentCLI $ComponentCLI
    ${NSD_GetState} $ComponentDocs $ComponentDocs
FunctionEnd

Function FinishPageCreate
    nsDialogs::Create 1018
    Pop $0

    ${NSD_CreateLabel} 0 0 100% 12u "Installation completed successfully!"
    Pop $0

    ${NSD_CreateCheckbox} 15u 20u 100% 12u "Launch ${SUPRU_APP_NAME} now"
    Pop $LaunchAfterInstall
    ${NSD_Check} $LaunchAfterInstall

    nsDialogs::Show
FunctionEnd

Function FinishPageLeave
    ${NSD_GetState} $LaunchAfterInstall $LaunchAfterInstall
FunctionEnd

Section "Core Application" SecCore
    SetOutPath "$INSTDIR"
    
    File /r "supru.exe"
    File /r "supru.pak"
    File /r "swiftshader\*"
    File /r "locales\*"
    File /r "resources\*"
    File /r "server.ts"
    
    ${If} $ComponentCLI == ${BST_CHECKED}
        File /r "supru-cli.exe"
    ${EndIf}
    
    ${If} $ComponentDocs == ${BST_CHECKED}
        File /r "docs\*"
    ${EndIf}
    
    WriteRegStr HKCU "${SUPRU_INSTALL_REG_KEY}" "InstallDir" "$INSTDIR"
    WriteRegStr HKCU "${SUPRU_INSTALL_REG_KEY}" "Version" "${SUPRU_VERSION}"
    WriteRegStr HKCU "${SUPRU_INSTALL_REG_KEY}" "Publisher" "${SUPRU_PUBLISHER}"
    
    WriteRegStr HKCU "${SUPRU_REG_KEY}" "DisplayName" "${SUPRU_APP_NAME}"
    WriteRegStr HKCU "${SUPRU_REG_KEY}" "DisplayVersion" "${SUPRU_VERSION}"
    WriteRegStr HKCU "${SUPRU_REG_KEY}" "Publisher" "${SUPRU_PUBLISHER}"
    WriteRegStr HKCU "${SUPRU_REG_KEY}" "InstallLocation" "$INSTDIR"
    WriteRegStr HKCU "${SUPRU_REG_KEY}" "UninstallString" '"$INSTDIR\uninstall.exe"'
    WriteRegStr HKCU "${SUPRU_REG_KEY}" "QuietUninstallString" '"$INSTDIR\uninstall.exe" /S'
    WriteRegStr HKCU "${SUPRU_REG_KEY}" "NoModify" "1"
    WriteRegStr HKCU "${SUPRU_REG_KEY}" "NoRepair" "1"
    
    WriteUninstaller "$INSTDIR\uninstall.exe"
    
    CreateDirectory "$SMPROGRAMS\${SUPRU_APP_NAME}"
    CreateShortcut "$SMPROGRAMS\${SUPRU_APP NAME}\${SUPRU_APP_NAME}.lnk" "$INSTDIR\supru.exe" "" "$INSTDIR\supru.exe" 0
    CreateShortcut "$SMPROGRAMS\${SUPRU_APP NAME}\Uninstall ${SUPRU_APP_NAME}.lnk" "$INSTDIR\uninstall.exe" "" "$INSTDIR\uninstall.exe" 0
    
    ${If} $ComponentCLI == ${BST_CHECKED}
        CreateShortcut "$SMPROGRAMS\${SUPRU_APP NAME}\${SUPRU_APP_NAME} CLI.lnk" "$INSTDIR\supru-cli.exe" "" "$INSTDIR\supru-cli.exe" 0
    ${EndIf}
SectionEnd

Section "Uninstall"
    Delete "$INSTDIR\uninstall.exe"
    
    Delete "$SMPROGRAMS\${SUPRU_APP NAME}\${SUPRU_APP_NAME}.lnk"
    Delete "$SMPROGRAMS\${SUPRU_APP NAME}\Uninstall ${SUPRU_APP_NAME}.lnk"
    Delete "$SMPROGRAMS\${SUPRU_APP NAME}\${SUPRU_APP_NAME} CLI.lnk"
    RMDir "$SMPROGRAMS\${SUPRU_APP NAME}"
    
    RMDir /r "$INSTDIR"
    
    DeleteRegKey HKCU "${SUPRU_INSTALL_REG_KEY}"
    DeleteRegKey HKCU "${SUPRU_REG_KEY}"
SectionEnd

Function un.onInit
    MessageBox MB_OKCANCEL|MB_ICONQUESTION|MB_DEFBUTTON2 "Are you sure you want to uninstall ${SUPRU_APP_NAME}?" IDOK +2
    Abort
FunctionEnd

Function un.onUninstSuccess
    HideWindow
    MessageBox MB_OK|MB_ICONINFORMATION "${SUPRU_APP_NAME} has been successfully uninstalled."
FunctionEnd

Function VerifySignature
    ${If} ${FileExists} "$EXEPATH"
        ClearErrors
        System::Call 'wintrust::WinVerifyTrust(i 0, i 0, i 0)i.r0'
        ${If} $0 != 0
            MessageBox MB_OK|MB_ICONWARNING "Digital signature verification failed.$\nThe installer may have been tampered with.$\n$\nDo you want to continue anyway?" IDOK +2
            Abort
        ${EndIf}
    ${EndIf}
FunctionEnd

Function .onInstSuccess
    ${If} $LaunchAfterInstall == ${BST_CHECKED}
        Exec '"$INSTDIR\supru.exe"'
    ${EndIf}
FunctionEnd
