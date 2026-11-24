// The Microsoft Store build's startup task helper: turns M³'s startup task
// (TaskId "M3Startup" in build/appxmanifest.xml), its "Start at login", on or
// off, and prints the task's state.
//
// The StartupTask API needs M³'s package identity. A child process keeps it
// only when its executable is inside the package: Windows PowerShell, in
// System32, loses it, and the API then answers "Element not found". So this
// is compiled into the MSIX (scripts/build-startup-task-helper.mjs), and
// src-electron/main/msix.ts runs it from there.
//
//   StartupTaskHelper.exe enable|disable|state
//
// Prints Enabled, Disabled, DisabledByUser (turned off in Windows' settings,
// which only the user can undo there) or DisabledByPolicy; on failure, exits
// with 1 and writes the error to stderr.
using System;
using Windows.ApplicationModel;

internal static class Program
{
    private const string TaskId = "M3Startup";

    private static int Main(string[] args)
    {
        try
        {
            var action = args.Length > 0 ? args[0] : "state";
            var task = StartupTask.GetAsync(TaskId).AsTask().GetAwaiter().GetResult();
            StartupTaskState state;
            switch (action)
            {
                case "enable":
                    state = task.RequestEnableAsync().AsTask().GetAwaiter().GetResult();
                    break;
                case "disable":
                    task.Disable();
                    state = task.State;
                    break;
                case "state":
                    state = task.State;
                    break;
                default:
                    Console.Error.WriteLine("Unknown action: {0}", action);
                    return 1;
            }
            Console.WriteLine(state);
            return 0;
        }
        catch (Exception error)
        {
            Console.Error.WriteLine("{0} (0x{1:X8})", error.Message, error.HResult);
            return 1;
        }
    }
}
