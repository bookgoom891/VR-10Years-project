Set shell = CreateObject("WScript.Shell")
Set files = CreateObject("Scripting.FileSystemObject")
nodePath = shell.ExpandEnvironmentStrings("%USERPROFILE%") & "\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"
scriptPath = files.BuildPath(files.GetParentFolderName(WScript.ScriptFullName), "start-vr-auto.mjs")
shell.Run Chr(34) & nodePath & Chr(34) & " " & Chr(34) & scriptPath & Chr(34), 0, False
