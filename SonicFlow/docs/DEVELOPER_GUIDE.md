# 🧑‍💻 Guía de Desarrollo - SonicFlow

Esta guía está diseñada para que el equipo de desarrollo (Maickel y compañero) entienda los detalles técnicos críticos del proyecto.

## 📡 Arquitectura de Comunicaciones

La aplicación utiliza un proxy en Vite para comunicarse con el backend. Cualquier petición a `/api/*` se redirige a `http://localhost:5000`.

## 🎵 Sistema de Búsqueda (Estrategia Spotify-First)

Para evitar resultados duplicados y de mala calidad de YouTube, el flujo de búsqueda de artistas es:
1. `GET /api/artist-hits?artist=NOMBRE`
2. El servidor busca en Spotify el perfil del artista.
3. Extrae los 'Top Tracks'.
4. Crea objetos de búsqueda con el formato: `ytsearch1:Artista - Canción official audio`.
5. Esto garantiza que `yt-dlp` descargue la versión más limpia posible.

## 📥 Gestión de la Cola de Descargas

La cola funciona en `App.jsx` mediante el estado `queue`.
- **Concurrencia**: Controlada por `CONCURRENCY_LIMIT`. Actualmente permite 2 descargas simultáneas.
- **Captura de Ruta**: Es vital que el `targetPath` se asigne al momento de llamar a `addToQueue`. Esto permite que si el usuario cambia la carpeta global mientras una descarga está en cola, la descarga anterior respete su carpeta original.

## 🔧 Dependencias Clave

- `youtube-dl-exec`: Wrapper de Node para `yt-dlp`. Es el motor de descarga.
- `spotify-url-info`: Utilizado para scrapear metadatos de Spotify sin necesidad de API Keys oficiales.
- `framer-motion`: Utilizado para la drawer de descargas y animaciones de la interfaz.

## 📂 Archivos de Configuración

- `server/config.json`: Almacena la última ruta de descarga elegida por el usuario. No debe subirse al repositorio Git si contiene rutas personales (está en `.gitignore`).

---

¡A seguir fluyendo! 🚀
