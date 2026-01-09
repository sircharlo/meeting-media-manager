!macro customInstall
  !define COMMONAPPDATA "$PROGRAMDATA"
  CreateDirectory "$APPDATA\Meeting Media Manager"
  StrCmp "$APPDATA" "$COMMONAPPDATA" 0 done
    nsExec::ExecToLog 'cmd /C icacls "$APPDATA\Meeting Media Manager" /grant *S-1-5-32-545:(OI)(CI)M /T'
    Pop $0
    ${If} $0 != 0
      DetailPrint "Warning: Could not set permissions (error code: $0)"
    ${EndIf}
  done:
!macroend
