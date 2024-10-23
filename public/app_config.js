module.exports = {
    csvExportFileName: "DAW Projects Dashboard.csv",
    csvExportFields: ["projectName", "tempo", "date", "path"],
    maxFileSize: 100 * 1024 * 1024, // 100MB
    supportedFileExtensions: ['.als', '.bwproject', '.song', '.cpr'],
    apiBaseUrl: process.env.API_BASE_URL || 'http://localhost:3000',
    appName: 'DAW Projects Dashboard',
    version: '1.0.0',
    defaultLanguage: 'de',
    directoriesToExclude: [
      "Backup",
      "Samples",
      "auto-backups",
    ],
    winDirectoriesToExclude: [
        "Windows", 
        "Program Files", 
        "Program Files (x86)", 
        "ProgramData", 
        "Users\\All Users", 
        "Users\\Default", 
        "Users\\Public", 
        "Users\\DefaultAppPool", 
        "Users\\<Username>\\AppData", 
        "$Recycle.Bin",
        "\$RECYCLE.BIN",
        "Users\\<Username>\\AppData\\Local\\Temp", 
        "Windows\\Temp", 
        "Windows\\Prefetch", 
        "Windows\\SoftwareDistribution", 
        "System Volume Information", 
        "MSOCache", 
        "Recovery", 
        "$WINDOWS.~BT", 
        "$SysReset", 
        "Users\\<Username>\\AppData\\Local\\VirtualStore", 
        "pagefile.sys", 
        "hiberfil.sys", 
        "Windows\\Installer", 
        "Windows\\WinSxS", 
        "Windows\\Logs"
      ],
  };
  