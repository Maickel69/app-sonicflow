# 📘 Guía de Comandos para SonicFlow
## Para personas sin experiencia técnica

Esta guía te enseñará cómo arrancar, parar y reiniciar el servidor de SonicFlow usando la **línea de comandos (CMD)**.

---

## 🚀 COMANDOS BÁSICOS

### 1️⃣ Abrir la línea de comandos (CMD)

**Opción A - Desde el Explorador de Windows:**
1. Abre el Explorador de Windows
2. Navega a la carpeta: `C:\Users\HP\Downloads\musicFree\SonicFlow`
3. Haz clic en la barra de dirección (donde dice la ruta)
4. Escribe `cmd` y presiona **Enter**
5. Se abrirá una ventana negra (el CMD) ya en la carpeta correcta ✅

**Opción B - Desde el menú de Windows:**
1. Presiona `Windows + R`
2. Escribe `cmd` y presiona **Enter**
3. En la ventana que se abre, escribe:
   ```cmd
   cd C:\Users\HP\Downloads\musicFree\SonicFlow
   ```
4. Presiona **Enter**

---

## ▶️ ARRANCAR EL SERVIDOR Y LA PÁGINA

### Comando principal:
```cmd
npm run dev
```

**¿Qué hace este comando?**
- Inicia el servidor backend (puerto 3000)
- Inicia la página web frontend (puerto 5173)
- Los mantiene corriendo juntos

**¿Qué verás?**
```
> sonic-flow@0.0.0 dev
> concurrently "npm run server" "npm run client"

[0] === SonicFlow Server Listening on Port 3000 ===
[1] VITE ready in 500 ms
[1] ➜  Local:   http://localhost:5173/
```

**Ahora puedes:**
1. Abrir tu navegador
2. Ir a: `http://localhost:5173`
3. ¡Usar la aplicación! 🎉

---

## ⏸️ DETENER EL SERVIDOR Y LA PÁGINA

### Método 1 - Detener normalmente (Recomendado):
```
Ctrl + C
```

**Pasos:**
1. Haz clic en la ventana del CMD donde está corriendo el servidor
2. Presiona las teclas `Ctrl` y `C` al mismo tiempo
3. Si te pregunta "¿Desea terminar el trabajo por lotes (S/N)?", escribe `S` y presiona **Enter**

**¿Qué verás?**
- El servidor se detiene
- La ventana del CMD vuelve a mostrar el prompt: `C:\Users\HP\Downloads\musicFree\SonicFlow>`

### Método 2 - Cerrar la ventana:
- Simplemente cierra la ventana del CMD con la **X** roja
- ⚠️ Esto funciona, pero es menos limpio

### Método 3 - Forzar detención (si está trabado):
```cmd
taskkill /F /IM node.exe
```
- ⚠️ Solo usa esto si los otros métodos no funcionan
- Esto cierra **todos** los procesos de Node.js en tu computadora

---

## 🔄 REINICIAR EL SERVIDOR

### Opción A - Reinicio manual completo:
```cmd
# Paso 1: Detener (Ctrl + C)
Ctrl + C

# Paso 2: Esperar que se detenga completamente

# Paso 3: Arrancar de nuevo
npm run dev
```

### Opción B - Todo en un comando (Reinicio rápido):
```cmd
taskkill /F /IM node.exe & npm run dev
```

**¿Qué hace este comando?**
1. Mata todos los procesos de Node.js
2. Arranca el servidor de nuevo inmediatamente

---

## 🛠️ COMANDOS ÚTILES ADICIONALES

### Ver si el servidor está corriendo:
```cmd
netstat -ano | findstr :3000
netstat -ano | findstr :5173
```

**Interpretación:**
- Si ves números → El servidor está corriendo en ese puerto
- Si no ves nada → El puerto está libre (servidor detenido)

### Ver procesos de Node.js activos:
```cmd
tasklist | findstr node.exe
```

### Limpiar la pantalla del CMD:
```cmd
cls
```

### Ver la versión de Node.js instalada:
```cmd
node --version
```

### Ver la versión de npm instalada:
```cmd
npm --version
```

---

## 📝 SECUENCIA COMPLETA PASO A PASO

### 🟢 Para ARRANCAR TODO desde cero:

1. **Abrir CMD en la carpeta del proyecto:**
   ```cmd
   cd C:\Users\HP\Downloads\musicFree\SonicFlow
   ```

2. **Arrancar el servidor:**
   ```cmd
   npm run dev
   ```

3. **Abrir el navegador:**
   - Ve a: `http://localhost:5173`

4. **¡Listo!** Ya puedes usar la aplicación ✅

---

### 🔴 Para DETENER TODO:

1. **En la ventana del CMD:**
   ```
   Ctrl + C
   ```

2. **Confirmar si pregunta:**
   ```
   S [Enter]
   ```

3. **Cerrar el navegador** (opcional)

---

### 🔄 Para REINICIAR (si cambiaste algo en el código):

1. **Detener:**
   ```
   Ctrl + C
   ```

2. **Arrancar de nuevo:**
   ```cmd
   npm run dev
   ```

3. **Recargar la página del navegador:**
   ```
   F5 o Ctrl + R
   ```

---

## ❌ SOLUCIÓN DE PROBLEMAS

### Problema: "npm no se reconoce como comando"
**Solución:**
- Node.js no está instalado o no está en el PATH
- Reinstala Node.js desde: https://nodejs.org/

### Problema: "Error: listen EADDRINUSE :::3000"
**Significado:** El puerto 3000 ya está en uso

**Solución:**
```cmd
# Matar el proceso que usa el puerto 3000
netstat -ano | findstr :3000
# Anota el número PID (último número)
taskkill /F /PID [número_que_anotaste]

# O simplemente:
taskkill /F /IM node.exe
npm run dev
```

### Problema: "Error: listen EADDRINUSE :::5173"
**Significado:** El puerto 5173 ya está en uso

**Solución:** Igual que arriba, pero con `:5173`

### Problema: La página no carga o muestra "Cannot GET /"
**Solución:**
1. Verifica que el servidor esté corriendo (deberías ver mensajes en el CMD)
2. Espera unos segundos más (a veces tarda en iniciar)
3. Recarga la página con `Ctrl + F5`
4. Verifica la URL: debe ser `http://localhost:5173` (sin olvidar los dos puntos)

### Problema: Los cambios en el código no se ven
**Solución:**
```cmd
# Detener
Ctrl + C

# Arrancar
npm run dev

# En el navegador
Ctrl + Shift + R (recarga forzada)
```

---

## 🎯 COMANDOS RÁPIDOS (CHEAT SHEET)

| Acción | Comando |
|--------|---------|
| **Ir a la carpeta** | `cd C:\Users\HP\Downloads\musicFree\SonicFlow` |
| **Arrancar todo** | `npm run dev` |
| **Detener** | `Ctrl + C` |
| **Reiniciar** | `Ctrl + C` → `npm run dev` |
| **Reinicio forzado** | `taskkill /F /IM node.exe & npm run dev` |
| **Ver si está corriendo** | `netstat -ano \| findstr :3000` |
| **Limpiar pantalla** | `cls` |
| **Solo servidor** | `npm run server` |
| **Solo cliente** | `npm run client` |

---

## 💡 CONSEJOS PARA PRINCIPIANTES

1. **Siempre mantén la ventana del CMD abierta** mientras usas la aplicación
2. **No cierres el CMD accidentalmente** o se detendrá todo
3. **Si algo falla**, intenta reiniciar con `Ctrl + C` → `npm run dev`
4. **Copia y pega los comandos** para evitar errores de escritura
5. **Lee los mensajes de error** - a menudo te dicen qué está mal
6. **No tengas miedo de experimentar** - siempre puedes reiniciar

---

## 📱 ABRIR LA APLICACIÓN EN TU TELÉFONO (MISMO WIFI)

Si quieres probar la aplicación desde tu celular:

1. **Averigua la IP de tu computadora:**
   ```cmd
   ipconfig
   ```
   Busca "Dirección IPv4" (ejemplo: 192.168.1.100)

2. **Arranca el servidor normalmente:**
   ```cmd
   npm run dev
   ```

3. **En tu teléfono:**
   - Conéctate al mismo WiFi
   - Abre el navegador
   - Ve a: `http://[tu_IP]:5173`
   - Ejemplo: `http://192.168.1.100:5173`

---

## 🆘 ¿NECESITAS AYUDA?

Si algo no funciona:
1. Lee el mensaje de error completo
2. Busca en esta guía si hay una solución
3. Intenta reiniciar todo
4. Verifica que Node.js esté instalado: `node --version`
5. Verifica que estés en la carpeta correcta: `cd`

---

**¡Eso es todo!** Con estos comandos puedes controlar completamente SonicFlow 🎵

_Última actualización: 2026-02-15_
