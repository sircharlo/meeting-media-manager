!macro customInstall
  SetShellVarContext all

  CreateDirectory "$PROGRAMDATA\Meeting Media Manager"

  ExecWait 'icacls "$PROGRAMDATA\Meeting Media Manager" /inheritance:e'
  ExecWait 'icacls "$PROGRAMDATA\Meeting Media Manager" /grant Users:(OI)(CI)M'
!macroend
