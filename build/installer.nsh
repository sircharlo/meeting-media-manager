!macro customInstall
  UserInfo::GetAccountType
  Pop $0
  ${If} $0 == "Admin"
    DetailPrint "Installer is running as Admin. Configuring shared permissions for all users..."
    
    # Use $1 to explicitly target C:\ProgramData
    ReadEnvStr $1 "PROGRAMDATA"
    CreateDirectory "$1\Meeting Media Manager"
    nsExec::ExecToLog 'cmd /C icacls "$1\Meeting Media Manager" /grant *S-1-5-32-545:(OI)(CI)M /T'
    
    Pop $0
    ${If} $0 != 0
      DetailPrint "Warning: Could not set permissions (error code: $0)"
    ${EndIf}
  ${EndIf}
  DetailPrint "Complete."
!macroend
