# 🌊 SonicFlow - Music & Video Downloader

SonicFlow es una aplicación web moderna y potente para buscar y descargar música o videos de YouTube y Spotify con una experiencia de usuario premium y fluida.

![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)

## ✨ Características Principales

- **🔍 Búsqueda Inteligente Unificada**: Detecta automáticamente si has ingresado un link de YouTube, un playlist de Spotify o simplemente el nombre de un artista.
- **🎧 Audio Preview Mejorado**: Reproduce solo el audio con un visualizador moderno, ocultando el video para una experiencia más musical.
- **🎨 Diseño Premium**: Interfaz renovada con efectos Glassmorphism, paleta de colores moderna y animaciones fluidas.
- **🎤 Integración Spotify**: Utiliza metadatos de Spotify para encontrar listas de éxitos oficiales de cualquier artista y buscar la mejor calidad de audio en YouTube de forma automática.
- **📥 Cola de Descargas en Segundo Plano**: Añade múltiples canciones o playlists completas y deja que SonicFlow trabaje por ti. Puedes seguir buscando mientras se descarga.
- **⚡ Multihilo (Concurrencia)**: Descarga hasta 2 archivos simultáneamente para ahorrar tiempo sin saturar tu conexión.
- **📁 Gestión de Carpetas Personalizada**: Elige exactamente dónde se guarda cada descarga. La aplicación recuerda la carpeta asignada a cada ítem de la cola incluso si la cambias después.
- **📱 Responsividad Total**: Diseño optimizado para trabajar perfectamente tanto en computadoras como en teléfonos móviles.

## 🚀 Instalación y Uso

### Requisitos Previos

- [Node.js](https://nodejs.org/) (Versión 18 o superior)
- [yt-dlp](https://github.com/yt-dlp/yt-dlp) (El servidor utiliza `youtube-dl-exec` que gestiona esto internamente)

### Pasos para Ejecutar

1. **Clonar el repositorio**:
   ```bash
   git clone https://github.com/Maickel69/SonicFlow.git
   cd SonicFlow
   ```

2. **Instalar dependencias**:
   ```bash
   npm install
   ```

3. **Ejecutar en modo desarrollo**:
   ```bash
   npm run dev
   ```
   *Esto lanzará simultáneamente el servidor backend (puerto 3000) y el cliente frontend (puerto 5173).*

4. **Abrir en el navegador**:
   - Ve a: `http://localhost:5173`
   - ¡Disfruta de SonicFlow! 🎵

### 📚 Guías para Usuarios Sin Experiencia

Si eres nuevo en línea de comandos, consulta estas guías:

- **[📘 GUIA_COMANDOS.md](GUIA_COMANDOS.md)** - Guía completa paso a paso
- **[🎯 COMANDOS_RAPIDOS.txt](COMANDOS_RAPIDOS.txt)** - Tarjeta de referencia rápida

### 🔧 Arreglos Recientes

- **[✅ ARREGLO_COMPLETADO.md](ARREGLO_COMPLETADO.md)** - Arreglo del selector de carpetas
- **[🔍 FOLDER_SELECTOR_FIX.md](FOLDER_SELECTOR_FIX.md)** - Análisis técnico del fix

## 🛠️ Estructura del Proyecto

```text
SonicFlow/
├── server/             # Backend (Node.js + Express)
│   ├── index.js        # Servidor principal y APIs
│   ├── configManager.js # Gestión de configuración de usuario
│   └── utils.js        # Utilidades de limpieza y sanitización
├── src/                # Frontend (React + Vite)
│   ├── App.jsx         # Lógica central y UI
│   ├── components/     # Componentes modulares (SettingsBar, etc.)
│   └── App.css         # Estilos y diseño responsivo
└── public/             # Activos estáticos
```

## 🧑‍💻 Guía para Desarrolladores (Partner)

Si vas a colaborar en este proyecto, ten en cuenta lo siguiente:

### Flujo de Descarga
El backend utiliza un sistema de dos pasos:
1. **Fetch Info**: Obtiene metadatos y duraciones sin descargar el archivo.
2. **Download**: Descarga el archivo a una carpeta temporal, lo procesa según el formato (MP3/MP4) y lo mueve a la ubicación final elegida por el usuario.

### Cola de Descargas
El frontend gestiona la cola mediante un `useEffect` que monitorea el estado de los ítems. Cada ítem tiene una propiedad `targetPath` capturada en el momento de la adición para garantizar que el archivo vaya al lugar correcto.

---

Desarrollado con ❤️ para la mejor experiencia musical. 🎵
