# Calixo PWA - Sistema de Retos (Fase 4)

## 🎯 Resumen

El sistema de retos de Calixo permite a los usuarios desconectarse del mundo digital mediante tres tipos de desafíos:

1. **Retos Diarios** - Desafíos cortos y específicos (ej: 30 min de lectura)
2. **Modo Enfoque** - Sesiones de concentración personalizables (hasta 23 horas)
3. **Retos Sociales** - Desconexión en grupo con amigos y familia

## 🚀 Inicio Rápido

### Requisitos Previos

1. Node.js 20+ instalado
2. Base de datos configurada (ver `SETUP_SUMMARY.md`)
3. Supabase Storage configurado para imágenes

### Configurar Supabase Storage

```bash
# 1. Ir a Supabase Dashboard
# 2. Navegar a Storage
# 3. Crear bucket: challenge-images
# 4. Configurar como público
# 5. Aplicar políticas de acceso
```

### Iniciar la Aplicación

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev

# Abrir en el navegador
# http://localhost:3000
```

## 📱 Uso del Sistema

### Retos Diarios

1. Desde el dashboard, click en **"Retos Diarios"**
2. Verás una lista de retos disponibles
3. Selecciona un reto que te interese
4. Click en **"Iniciar Reto"**
5. El timer comenzará automáticamente
6. **No minimices la ventana** durante el reto
7. Al completar, puedes subir una foto y nota
8. Recibirás monedas como recompensa

#### Límites

- **Usuarios gratuitos:** 1 reto diario
- **Usuarios premium:** 3 retos diarios
- Los límites se resetean a las 5 AM

### Modo Enfoque

1. Desde el dashboard, click en **"Modo Enfoque"**
2. Selecciona un tipo de sesión de enfoque
3. Ajusta la duración con el slider (1 min - 23 horas)
4. O elige una opción rápida: 25, 60, 90, 120, 180, 240 min
5. Click en **"Comenzar"**
6. Mantén la pestaña visible durante toda la sesión
7. Completa y comparte tu logro

#### Características

- Timer visual con barra de progreso
- Contador de interrupciones
- Pausado automático si cambias de pestaña
- Fallo automático tras múltiples interrupciones

### Retos Sociales

1. Desde el dashboard, click en **"Retos Sociales"**
2. Click en **"Crear Nuevo Reto Social"**
3. Selecciona un reto del catálogo
4. Ingresa el email de tu amigo
5. Click en **"Enviar Invitación"**
6. Tu amigo recibirá una notificación
7. Cuando acepte, ambos podrán comenzar
8. Cada uno tiene su propio timer individual
9. Al completar, los logros se comparten en el feed del grupo

## 🎮 Sistema de Recompensas

### Monedas

- Cada reto otorga monedas al completarse
- Las monedas se suman automáticamente a tu perfil
- Puedes usarlas en la tienda (Fase 6) para comprar items

### Racha (Streak)

- Cada reto completado incrementa tu racha
- Las rachas motivan la consistencia
- Se muestran en tu perfil público

### Transacciones

Todas las monedas ganadas se registran en tu historial:
- Fecha y hora
- Reto completado
- Cantidad de monedas

## ⚠️ Sistema de Honor

Calixo usa un **sistema de honor** basado en confianza:

### ¿Cómo Funciona?

1. El usuario inicia un reto
2. Se activa el tracking de visibilidad de la pestaña
3. Si el usuario cambia de pestaña, se cuenta como interrupción
4. Múltiples interrupciones causan el fallo del reto
5. No hay validación técnica real de "desconexión"

### Tracking de Visibilidad

El sistema usa la API `visibilitychange` del navegador:

```javascript
// Detecta cuando el tab está oculto
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    // Usuario cambió de pestaña o minimizó la ventana
    // Se pausa el timer y se cuenta una interrupción
  }
});
```

### Limitaciones

- **Split Screen:** No detecta si el usuario tiene otras apps visibles
- **Múltiples Pantallas:** No detecta si hay otras ventanas en otra pantalla
- **Segundo Plano:** En móvil, si cierras la app, el timer se detiene

### Recomendaciones

Para una mejor experiencia:
- Cierra otras apps y notificaciones
- Pon el teléfono en modo No Molestar
- Informa a otros que estarás desconectado
- Mantén la ventana de Calixo visible

## 🖼️ Subida de Imágenes

Al completar un reto, puedes compartir una foto de tu logro.

### Requisitos

- **Formato:** JPG, PNG o WEBP
- **Tamaño máximo:** 5 MB
- **Proporción:** Preferiblemente cuadrada (1:1)

### Proceso

1. Click en el área de carga de imagen
2. Selecciona una foto de tu dispositivo
3. Verás un preview antes de subir
4. Escribe una nota sobre tu experiencia (max 500 caracteres)
5. Click en **"Compartir en el Feed"**

### Almacenamiento

- Las imágenes se guardan en Supabase Storage
- Cada imagen tiene una URL pública única
- Las imágenes se optimizan automáticamente

## 🔒 Seguridad y Privacidad

### Autenticación

- Todos los endpoints requieren autenticación
- Las sesiones se validan con JWT de Supabase
- No se puede iniciar retos en nombre de otros usuarios

### Validaciones

#### Del Servidor
- Límites diarios verificados en cada solicitud
- Solo puedes completar tus propios retos
- Las duraciones están limitadas a 23 horas
- Los tipos de archivo y tamaños son validados

#### Del Cliente
- Formularios con validación en tiempo real
- Prevención de múltiples retos simultáneos
- Confirmación antes de cancelar
- Límites de caracteres en notas

## 🐛 Solución de Problemas

### "Ya tienes un reto en progreso"

**Problema:** Tienes un reto sin completar.

**Solución:**
1. Ve al dashboard y busca la sección "Retos en Progreso"
2. Cancela el reto activo
3. O complétalo antes de iniciar uno nuevo

### "Has alcanzado el límite de retos diarios"

**Problema:** Has completado tus retos disponibles hoy.

**Solución:**
- Espera hasta las 5 AM para el reset
- O actualiza a Premium para 3 retos diarios

### El timer no funciona correctamente

**Problema:** El timer se detiene o no actualiza.

**Solución:**
1. Refresca la página
2. Verifica que JavaScript esté habilitado
3. En iOS Safari, mantén la app en primer plano
4. Evita poner el dispositivo en modo sleep

### Error al subir imagen

**Problema:** No se puede subir la imagen.

**Soluciones:**
- Verifica que el archivo sea menor a 5 MB
- Usa formato JPG, PNG o WEBP
- Comprime la imagen si es muy grande
- Verifica tu conexión a internet

### Reto falló inesperadamente

**Problema:** El reto se marcó como fallido sin razón aparente.

**Causa:** El tab estuvo oculto por demasiado tiempo.

**Prevención:**
- Mantén la pestaña de Calixo siempre visible
- No minimices la ventana
- No uses split screen con otras apps
- Desactiva las notificaciones que puedan aparecer

## 📊 Estadísticas

En el dashboard puedes ver:

- **Retos Completados:** Total de retos finalizados
- **Monedas Ganadas:** Balance actual de monedas
- **Días de Racha:** Días consecutivos con retos completados
- **Energía CALI:** Nivel de energía del avatar (Alta/Media/Baja)

## 🎨 Personalización

### Duración de Enfoque

En el modo enfoque, puedes personalizar la duración:

- Usa el slider para ajustar minuto a minuto
- O selecciona opciones rápidas predefinidas
- Máximo: 23 horas
- Mínimo: 1 minuto

### Notas Personales

Al completar un reto:

- Escribe cómo te sentiste
- Comparte qué aprendiste
- Motiva a otros con tu experiencia
- Máximo 500 caracteres

## 📱 Próximas Funcionalidades

### Fase 5: Avatar CALI
- Editor de avatar personalizable
- Niveles de energía visuales
- Accesorios desbloqueables

### Fase 6: Tienda
- Compra items con tus monedas
- Items premium exclusivos
- Desbloqueo progresivo

### Fase 7: Feed Social
- Visualiza logros de amigos
- Sistema de likes y comentarios
- Perfiles públicos/privados

## 🤝 Contribuir

Si encuentras un bug o tienes una sugerencia:

1. Documenta el problema con capturas de pantalla
2. Incluye pasos para reproducir
3. Indica tu navegador y sistema operativo
4. Comparte en los issues del proyecto

## 📚 Recursos Adicionales

- [Documentación completa](./docs/)
- [Resumen de Fase 4](./PHASE_4_SUMMARY.md)
- [Estado del proyecto](./PROJECT_STATUS.md)
- [Guía de configuración](./SETUP_SUMMARY.md)

## 🎉 ¡Disfruta tu viaje de desconexión digital!

Recuerda: el objetivo de Calixo es ayudarte a reconectar con lo que realmente importa.
Cada reto completado es un paso hacia un balance más saludable con la tecnología.

**¡Buena suerte! 🚀**


