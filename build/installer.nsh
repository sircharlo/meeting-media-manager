!macro customInstall
  ReadEnvStr $0 "PROGRAMDATA"
  CreateDirectory "$0\Meeting Media Manager"
  DetailPrint "Current PROGRAMDATA: $0"
  DetailPrint "APPDATA variable: $APPDATA"
  StrCmp "$APPDATA" "$0" 0 done
    DetailPrint "PROGRAMDATA and APPDATA differ; setting correct permissions for all users..."
    nsExec::ExecToLog 'cmd /C icacls "$APPDATA\Meeting Media Manager" /grant *S-1-5-32-545:(OI)(CI)M /T'
    Pop $0
    ${If} $0 != 0
      DetailPrint "Warning: Could not set permissions (error code: $0)"
    ${EndIf}
  done:
  DetailPrint "Complete."
!macroend
