<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/a37b9c18-9f63-4512-9977-372135d94b76

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Modo Local Producto

- Backend local: `http://localhost:3000`.
- Frontend local: `http://localhost:5173`.
- Variables recomendadas: `VITE_API_URL=http://localhost:3000` y `VITE_USE_MOCKS=false`.
- Mantener `VITE_USE_MOCKS=true` solo para demos con datos mock.

### Flujo Manual Base

1. Login como `PRODUCT` con usuario seed.
2. Crear un proyecto con semestre, asignatura y temas.
3. Login como `FABRICA`, completar checklist y entregar asignatura a revisión.
4. Login como `PRODUCT`, crear observación, validar corrección, aprobar checklist y aprobar asignatura.
5. Revisar notificaciones reales y refrescar navegador para confirmar persistencia.

## Documentación del flujo de usuario

Documentación en la carpeta [`docs/`](../docs/) del repositorio:

| Documento | Audiencia | Descripción |
|-----------|-----------|-------------|
| [FLUJO-USUARIO.md](../docs/FLUJO-USUARIO.md) | Desarrolladores, QA | Rutas, componentes, APIs, guardas y estado |
| [GUIA-TUTORIAL-FLUJO.md](../docs/GUIA-TUTORIAL-FLUJO.md) | Capacitadores, videos | Mismo flujo en lenguaje humano, con guion y FAQ |
| [RESUMEN-FLUJO-USUARIO.md](../docs/RESUMEN-FLUJO-USUARIO.md) | Referencia rápida | Una página: tablas, guion de 3 min, casos típicos |
