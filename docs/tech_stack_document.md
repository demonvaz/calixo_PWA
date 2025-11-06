# Tech Stack Document for Calixo PWA

Este documento explica de manera sencilla las tecnologías elegidas para Calixo, una PWA social de desconexión digital en español, y cómo cada una contribuye a la experiencia de usuario, la escalabilidad y la facilidad de mantenimiento.

## 1. Frontend Technologies

Para la parte que interactúa directamente con el usuario, hemos optado por:

*   **Next.js (React + SSR/SSG)**

    *   Ofrece renderizado en servidor (SSR) y generación de páginas estáticas (SSG) para un arranque rápido y buen posicionamiento (SEO).
    *   Facilita la configuración de rutas, API internas y despliegue como PWA.

*   **React**

    *   Librería de componentes para construir interfaces dinámicas y reactivas.

*   **TypeScript**

    *   Tipado estricto que ayuda a prevenir errores comunes y hace el código más mantenible.

*   **Tailwind CSS**

    *   Framework de utilidades para diseñar de forma rápida y consistente, con un enfoque mobile-first.

*   **shadcn/ui**

    *   Colección de componentes accesibles, listos para usar con Tailwind, que aceleran el desarrollo sin sacrificar estilos.

*   **Workbox**

    *   Biblioteca para generar el *service worker* que:

        *   Cachea la estructura (shell) de la app y activos estáticos.
        *   Aplica la estrategia *stale-while-revalidate* al feed de retos, mostrando contenido en offline.

*   **i18n (preparado para futuras traducciones)**

    *   Aunque hoy solo sea español, se usa una configuración de internacionalización (por ejemplo, `next-i18next`) para poder añadir idiomas sin reestructurar.

*   **Accesibilidad (WCAG 2.1 AA)**

    *   Uso de atributos ARIA, buen contraste, navegación por teclado y soporte de lectores de pantalla.

*   **Sonner (toasts y notificaciones in-app)**

    *   Para mostrar mensajes breves y amigables dentro de la app.

Cómo mejora la experiencia: este conjunto garantiza un arranque rápido, diseños responsivos, consistencia visual y una aplicación instalable con comportamiento offline.

## 2. Backend Technologies

La parte que gestiona datos, autenticación y lógica de negocio incluye:

*   **Supabase Auth**

    *   Login con correo/contraseña y OAuth (Google).
    *   Manejo de roles internos (`normal`, `premium`, `admin`) y tokens seguros.

*   **Supabase Database (PostgreSQL)**

    *   Almacenamiento de usuarios, retos, sesiones, configuraciones y transacciones.
    *   Row-level Security para controlar quién ve qué datos (perfiles públicos/privados).

*   **Supabase Storage**

    *   Guarda fotos de retos de forma privada, entregando URLs firmadas para acceso temporal.
    *   Redimensiona y comprime imágenes (máx. 1080 px, 5 MB, JPG/PNG/WEBP).

*   **Drizzle ORM**

    *   Mapas de tablas a TypeScript, facilitando consultas tipadas y migraciones SQL.

*   **API Routes de Next.js (Node.js)**

    *   Endpoints para:

        *   Enviar eventos (`session_start`, `session_event`, `session_end`).
        *   Registro de cosméticos, editor de CALI, administración y panel de moderación.
        *   Gestión de configuración en tiempo real (`/api/config`).

*   **Stripe**

    *   Procesa suscripciones mensuales y anuales.
    *   Administra cupones/descuentos desde el panel.
    *   Webhooks verificados para eventos (`invoice.paid`, `customer.subscription.deleted`, por ejemplo).

*   **OpenAI**

    *   Servicio opcional para moderación automática de texto (alerta temprana de contenido inapropiado).

Cómo funciona en conjunto: Supabase aporta un backend completo listo para usar (autenticación, base de datos y almacenamiento), Drizzle ORM garantiza seguridad y tipado en consultas, y Stripe maneja la facturación, todo orquestado vía las API internas de Next.js.

## 3. Infrastructure and Deployment

Para asegurar despliegues confiables y entornos reproducibles:

*   **Docker & Docker Compose**

    *   Contenerización de servicios (Next.js, base de datos local, etc.) para que el equipo y los servidores prod/dev usen la misma configuración.

*   **Git y GitHub**

    *   Control de versiones, ramas de características y revisiones de código (*pull requests*).

*   **GitHub Actions (CI/CD)**

    *   Automatiza pruebas de TypeScript, linting, generación de builds y despliegue.

*   **Vercel (hosting principal)**

    *   Despliegue de la app Next.js con actualizaciones automáticas desde la rama `main`.

*   **Gestión de entornos**

    *   Archivos `.env` para variables sensibles (claves de Supabase, Stripe, OpenAI), con ejemplos en `.env.example`.

Beneficios: despliegues rápidos, rollback sencillo, entornos idénticos y automatización de calidad de código.

## 4. Third-Party Integrations

*   **Stripe**

    *   Suscripciones sin periodo de prueba.
    *   Cupones y descuentos manejados desde el panel.
    *   Webhooks seguros para reflejar estado real de pago.

*   **Supabase**

    *   Auth, Database y Storage en un mismo lugar, con API en tiempo real si se desea.

*   **Workbox**

    *   Gestión de *service worker* para caching y comportamiento offline.

*   **OpenAI**

    *   (Opcional) Moderación de contenido de texto y sugerencias.

*   **next-i18next**

    *   Internacionalización preparada para futuros idiomas.

*   **Google OAuth**

    *   Login rápido usando cuentas existentes.

Cómo aportan valor: evitan construir servicios desde cero, reducen costos de mantenimiento y mejoran la confiabilidad.

## 5. Security and Performance Considerations

*   **Autenticación y permisos**

    *   Tokens JWT de Supabase Auth.
    *   Distinción clara de roles y uso de Row-Level Security en la base de datos.

*   **Protección de contenido**

    *   URLs firmadas para fotos.
    *   Filtrado en backend de palabras malsonantes y verificación de imágenes.

*   **Verificación de webhooks**

    *   Firma de Stripe comprobada antes de procesar cualquier evento.

*   **Caché inteligente**

    *   Estrategia *stale-while-revalidate* para feed y activos estáticos.
    *   Service worker para respuestas instantáneas y experiencia offline.

*   **Optimización de imágenes**

    *   Redimensión al cargar y uso de WebP cuando sea posible.

*   **Accesibilidad**

    *   Cumplimiento WCAG 2.1 AA: contrastes, tamaños de texto, preferencia de reducción de movimiento.

*   **Monitorización básica**

    *   Logs de errores (por ejemplo, Sentry) e inspección de métricas de uso en el panel de admin.

Resultado: la app es segura, rápida y mantiene la confidencialidad e integridad de los datos de los usuarios.

## 6. Conclusión y Resumen del Tech Stack

Hemos elegido un conjunto de tecnologías modernas y probadas que cubren:

*   **Frontend:** Next.js, React, TypeScript, Tailwind CSS, shadcn/ui, Workbox, i18n.
*   **Backend:** Supabase (Auth, Database, Storage), Drizzle ORM, API Routes de Next.js, Stripe, OpenAI.
*   **Infraestructura:** Docker, GitHub + Actions, Vercel.
*   **Integraciones:** Stripe, Supabase, Workbox, OpenAI, Google OAuth.
*   **Seguridad y rendimiento:** JWT, RLS, firmados, caching, accesibilidad.

Este stack permite desarrollar rápidamente, escalar sin fricciones y ofrecer una experiencia accesible, tanto en web como en móvil, además de preparar la PWA para funcionar offline y ser instalable como una app nativa. ¡Con estas piezas, Calixo está listo para desconectar digitalmente de forma social, segura y agradable!
