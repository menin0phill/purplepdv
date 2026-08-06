const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');
const isDev = process.argv.includes('--dev');

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    icon: path.join(__dirname, 'public', 'logo-purple.jpg'),
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  // Remove o menu superior nativo do Windows (File, Edit, etc) para ficar com cara de app
  Menu.setApplicationMenu(null);

  if (isDev) {
    // No modo dev, usamos o servidor Vite
    win.loadURL('http://localhost:5173/pdv.html');
    win.webContents.openDevTools();
  } else {
    // Em producA Ao, carregamos o arquivo estAtico gerado pelo Vite
    win.loadFile(path.join(__dirname, 'dist', 'pdv.html'));
  }
}

// Desativa aceleração de GPU para rodar liso em Core 2 Duo e GPUs integradas antigas
app.disableHardwareAcceleration();
app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
