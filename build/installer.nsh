!macro customInstall
  SetShellVarContext all

  CreateDirectory "$APPDATA\Meeting Media Manager"

  ExecWait 'icacls "$APPDATA\Meeting Media Manager" /inheritance:e'
  ExecWait 'icacls "$APPDATA\Meeting Media Manager" /grant Users:(OI)(CI)M'
!macroend
