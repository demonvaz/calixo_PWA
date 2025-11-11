# Guía de Configuración de Base de Datos - Calixo PWA

Esta guía te ayudará a configurar la base de datos PostgreSQL con Supabase para el proyecto Calixo PWA.

## 📋 Prerrequisitos

- Cuenta de Supabase (gratuita en [supabase.com](https://supabase.com))
- Node.js 20+ instalado
- Dependencias del proyecto instaladas (`npm install`)

---

## 🚀 Paso 1: Crear Proyecto en Supabase

1. **Acceder a Supabase**
   - Ve a [supabase.com](https://supabase.com)
   - Inicia sesión o crea una cuenta

2. **Crear Nuevo Proyecto**
   - Click en "New Project"
   - Nombre: `calixo-pwa` (o el que prefieras)
   - Database Password: **Guarda esta contraseña de forma segura**
   - Region: Elige la más cercana a ti
   - Plan: Free (suficiente para desarrollo)
   - Click en "Create new project"
   - Espera 2-3 minutos mientras se provisiona

---

## 🔑 Paso 2: Obtener Credenciales

1. **Project URL y Keys**
   - Ve a `Settings > API`
   - Copia:
     - **Project URL**: `https://xxx.supabase.co`
     - **anon/public key**: `eyJhbGc...`
     - **service_role key**: `eyJhbGc...` (mostrar y copiar)

2. **Database URL**
   - Ve a `Settings > Database`
   - Scroll hasta "Connection string"
   - Selecciona la pestaña "URI"
   - Copia la Connection string
   - **IMPORTANTE**: Reemplaza `[YOUR-PASSWORD]` con la contraseña que guardaste

---

## ⚙️ Paso 3: Configurar Variables de Entorno

1. **Verificar si existe `.env.local`**
   ```bash
   # Si no existe, créalo:
   touch .env.local
   ```

2. **Agregar las credenciales** (editar `.env.local`):

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Database Configuration
DATABASE_URL=postgresql://postgres:[TU-PASSWORD]@db.xxx.supabase.co:5432/postgres

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Otros (opcional por ahora)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
OPENAI_API_KEY=
NEXT_PUBLIC_VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
NODE_ENV=development
```

3. **Verificar** que las variables están bien configuradas:
   ```bash
   # Debería mostrar tu URL de Supabase
   node -e "console.log(process.env.NEXT_PUBLIC_SUPABASE_URL)"
   ```

---

## 🗄️ Paso 4: Aplicar Schema a la Base de Datos

Tienes dos opciones:

### Opción A: Push Directo (Recomendado para desarrollo)

```bash
npm run db:push
```

Este comando:
- Lee el schema de `db/schema.ts`
- Aplica los cambios directamente a Supabase
- No crea archivos de migración
- Ideal para desarrollo rápido

### Opción B: Usar Migraciones (Recomendado para producción)

```bash
# Las migraciones ya fueron generadas, solo aplicarlas:
npm run db:migrate
```

Este comando:
- Ejecuta las migraciones en `drizzle/` folder
- Mantiene historial de cambios
- Ideal para ambientes de producción

**Resultado esperado:**
```
✅ 17 tables created
✅ 7 enums created
✅ All foreign keys established
```

---

## 🔒 Paso 5: Aplicar Políticas de Seguridad (RLS)

1. **Abrir SQL Editor en Supabase**
   - Ve al dashboard de Supabase
   - Click en "SQL Editor" en el menú lateral
   - Click en "New query"

2. **Copiar y Ejecutar las Políticas**
   - Abre el archivo `db/rls-policies.sql`
   - Copia **TODO** el contenido
   - Pégalo en el SQL Editor de Supabase
   - Click en "Run" o presiona `Ctrl + Enter`

3. **Verificar que se aplicaron**
   ```sql
   -- Ejecutar esta query en el SQL Editor:
   SELECT schemaname, tablename, policyname
   FROM pg_policies
   WHERE schemaname = 'public'
   ORDER BY tablename;
   ```

   Deberías ver ~60 políticas listadas.

**¿Por qué RLS?**
- Protege los datos a nivel de base de datos
- Cada usuario solo ve/edita sus propios datos
- Los admins tienen permisos especiales
- Seguridad incluso si hay bugs en el código

---

## 🌱 Paso 6: Poblar con Datos Iniciales

```bash
npm run db:seed
```

Este comando inserta:
- ✅ 9 configuraciones globales
- ✅ 10 retos diarios
- ✅ 3 retos de enfoque
- ✅ 3 retos sociales
- ✅ 21 items de tienda (colores, camisetas, sombreros, gafas, fondos)
- ✅ 2 cupones de ejemplo

**Resultado esperado:**
```
🌱 Iniciando seeding de la base de datos...
✅ Configuración global insertada
✅ Retos diarios insertados
✅ Retos de enfoque insertados
✅ Retos sociales insertados
✅ Items de colores insertados
✅ Items de camisetas insertados
✅ Items de sombreros insertados
✅ Items de gafas insertados
✅ Items de fondos insertados
✅ Cupones insertados
🎉 ¡Seeding completado exitosamente!
```

---

## ✅ Paso 7: Verificar la Configuración

### 7.1 Verificar las Tablas

**Opción A: Drizzle Studio (Recomendado)**
```bash
npm run db:studio
```
- Se abrirá en `https://local.drizzle.studio`
- Navega por las tablas
- Verifica que tienen datos

**Opción B: Supabase Table Editor**
- En el dashboard de Supabase
- Click en "Table Editor"
- Verifica que existen las 17 tablas
- Click en cada tabla para ver los datos

### 7.2 Probar la Aplicación

1. **Iniciar servidor de desarrollo**
   ```bash
   npm run dev
   ```

2. **Crear una cuenta**
   - Ve a http://localhost:3000
   - Click en "Comenzar Ahora"
   - Completa el formulario de registro
   - **Verificar**: Se crea automáticamente un perfil

3. **Ver el Dashboard**
   - Después del registro, deberías ver el dashboard
   - Verifica que muestra:
     - Tu nombre de usuario
     - Monedas: 0
     - Racha: 0 días
     - Energía CALI: 100

4. **Editar tu Perfil**
   - Click en "Mi Perfil"
   - Cambia tu nombre
   - Activa/desactiva perfil privado
   - Click en "Guardar Cambios"
   - Verifica que los cambios se reflejan en el dashboard

---

## 🛠️ Comandos Útiles

```bash
# Ver la base de datos en GUI local
npm run db:studio

# Generar nuevas migraciones después de cambiar db/schema.ts
npm run db:generate

# Aplicar cambios directamente (desarrollo)
npm run db:push

# Ejecutar migraciones (producción)
npm run db:migrate

# Re-poblar la base de datos (cuidado: duplicará datos)
npm run db:seed

# Verificar tipos TypeScript
npm run type-check

# Iniciar desarrollo
npm run dev
```

---

## 🐛 Solución de Problemas Comunes

### Error: "DATABASE_URL is not set"

**Problema**: La variable de entorno no está configurada.

**Solución**:
1. Verifica que existe `.env.local`
2. Verifica que contiene `DATABASE_URL=postgresql://...`
3. Reinicia el servidor de desarrollo

### Error: "relation does not exist"

**Problema**: Las tablas no fueron creadas.

**Solución**:
```bash
npm run db:push
```

### Error: "permission denied for table"

**Problema**: Las políticas RLS están bloqueando el acceso.

**Solución**:
1. Verifica que ejecutaste `db/rls-policies.sql`
2. O temporalmente deshabilita RLS:
   ```sql
   ALTER TABLE nombre_tabla DISABLE ROW LEVEL SECURITY;
   ```

### Error al hacer seeding: "duplicate key value"

**Problema**: Ya existe un dato con ese ID/código.

**Solución**:
```bash
# Opción 1: Limpiar las tablas afectadas en Supabase
# Opción 2: El script tiene .onConflictDoNothing(), no debería fallar
# Opción 3: Borrar y recrear la base de datos
```

### Error: "Profile not found" después del registro

**Problema**: La creación del perfil falló.

**Solución**:
1. Verifica los logs de la consola del servidor
2. Verifica que la tabla `profiles` existe
3. Verifica que las políticas RLS permiten INSERT

### No puedo ver los datos en las tablas

**Problema**: Las políticas RLS están activas y bloquean la vista.

**Solución**:
- En Supabase Table Editor, hay un toggle "RLS disabled" en la parte superior
- O usa el Service Role Key (nunca en producción)

---

## 📊 Verificar que Todo Funciona

### Checklist Final

- [ ] Proyecto de Supabase creado
- [ ] Variables de entorno configuradas en `.env.local`
- [ ] Schema aplicado (`npm run db:push` exitoso)
- [ ] Políticas RLS ejecutadas (60+ políticas)
- [ ] Datos iniciales insertados (`npm run db:seed` exitoso)
- [ ] Drizzle Studio funciona (`npm run db:studio`)
- [ ] Servidor de desarrollo inicia sin errores
- [ ] Puedes crear una cuenta nueva
- [ ] El perfil se crea automáticamente
- [ ] El dashboard muestra datos reales
- [ ] Puedes editar tu perfil
- [ ] Los cambios se guardan correctamente

Si todos los items tienen ✓, ¡la base de datos está lista! 🎉

---

## 🔄 Reset de Base de Datos (Si algo sale mal)

Si necesitas empezar de cero:

1. **Eliminar todas las tablas** (SQL Editor en Supabase):
```sql
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;
```

2. **Re-aplicar todo**:
```bash
npm run db:push
# Ejecutar db/rls-policies.sql en Supabase
npm run db:seed
```

---

## 📚 Recursos Adicionales

- [Documentación de Drizzle ORM](https://orm.drizzle.team/)
- [Documentación de Supabase](https://supabase.com/docs)
- [Guía de RLS de Supabase](https://supabase.com/docs/guides/auth/row-level-security)
- [PHASE_3_SUMMARY.md](./PHASE_3_SUMMARY.md) - Resumen completo de la Fase 3

---

## 💡 Próximos Pasos

Una vez que la base de datos esté configurada:

1. ✅ Crear y probar cuentas de usuario
2. ✅ Explorar el dashboard y perfil
3. 🔜 Implementar sistema de retos (Fase 4)
4. 🔜 Construir el avatar CALI (Fase 5)
5. 🔜 Desarrollar la tienda (Fase 6)

---

¿Necesitas ayuda? Revisa el archivo `PHASE_3_SUMMARY.md` para más detalles técnicos.

**¡Feliz desarrollo! 🚀**

