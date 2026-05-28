/**
 * QA visual browser — panel Admin Fase 1
 * Ejecutar desde Producto-Frontend:
 *   npx playwright install chromium
 *   node scripts/qa-admin-visual-browser.mjs
 */
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, '..', 'qa-screenshots-admin');
const BASE = process.env.APP_BASE ?? 'http://localhost:5173';
const API = process.env.API_BASE ?? 'http://localhost:3000';

async function apiLogin(email, password) {
  const res = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`Login ${email} failed`);
  return data;
}

async function injectAuth(page, email, password) {
  const { accessToken, user } = await apiLogin(email, password);
  await page.goto(`${BASE}/login`);
  await page.evaluate(
    ({ accessToken, user }) => {
      localStorage.setItem('producto_access_token', accessToken);
      localStorage.setItem('producto_auth_user', JSON.stringify(user));
      localStorage.removeItem('producto_entry_redirect_done');
    },
    { accessToken, user },
  );
}

async function capture(page, name, width) {
  await page.setViewportSize({ width, height: width < 500 ? 900 : 1000 });
  await page.goto(`${BASE}/product/dashboard`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  const file = path.join(OUT, `${name}-${width}px.png`);
  await page.screenshot({ path: file, fullPage: true });
  return file;
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const issues = [];
  const consoleErrors = [];

  // --- ADMIN ---
  const adminCtx = await browser.newContext();
  const adminPage = await adminCtx.newPage();
  adminPage.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(`[ADMIN] ${msg.text()}`);
  });
  adminPage.on('pageerror', (err) => consoleErrors.push(`[ADMIN PAGE] ${err.message}`));

  await injectAuth(adminPage, 'admin@local', 'Admin123!');
  await adminPage.goto(`${BASE}/product/dashboard`, { waitUntil: 'networkidle' });
  await adminPage.waitForTimeout(2000);

  const adminTitle = await adminPage.locator('h1').first().textContent();
  if (!adminTitle?.includes('Vista global')) {
    issues.push(`Admin: título esperado "Vista global", got "${adminTitle}"`);
  }
  if (await adminPage.getByText('Crear solicitud').count()) {
    issues.push('Admin: aparece "Crear solicitud" (contaminación Product)');
  }
  if (await adminPage.getByText('Dashboard Product').count()) {
    issues.push('Admin: aparece "Dashboard Product"');
  }

  const kpiLabels = ['Activos', 'Vencidos', 'Devolución', 'Finalizados'];
  for (const label of kpiLabels) {
    if ((await adminPage.getByText(label, { exact: false }).count()) === 0) {
      issues.push(`Admin KPI faltante: ${label}`);
    }
  }

  if ((await adminPage.getByRole('columnheader', { name: 'Pipeline' }).count()) === 0) {
    issues.push('Admin: falta columna Pipeline en la tabla');
  }

  const detailLinks = await adminPage.getByRole('link', { name: 'Ver detalle' }).count();
  if (detailLinks === 0) {
    issues.push('Admin: no hay enlaces "Ver detalle" en la tabla');
  } else {
    console.log(`✓ ${detailLinks} enlace(s) Ver detalle en tabla`);
  }

  const programNames = await adminPage.locator('tbody tr td p.font-bold').allTextContents();
  console.log('\nProgramas en tabla (orden):');
  programNames.forEach((t, i) => console.log(`  ${i + 1}. ${t.trim()}`));

  for (const needle of ['VENCIDO', 'DEVOLUCION', 'AT RISK', 'EN CURSO', 'BOTTLENECK', 'LEGACY', 'FINALIZADO']) {
    if (!programNames.some((t) => t.toUpperCase().includes(needle))) {
      issues.push(`Fila QA no visible en tabla: ${needle}`);
    }
  }

  const vencidoIdx = programNames.findIndex((t) => t.includes('VENCIDO'));
  const devIdx = programNames.findIndex((t) => t.includes('DEVOLUCION'));
  const riskIdx = programNames.findIndex((t) => t.includes('AT RISK'));
  const finalIdx = programNames.findIndex((t) => t.includes('FINALIZADO'));
  if (vencidoIdx >= 0 && devIdx >= 0 && vencidoIdx > devIdx) {
    issues.push(`Orden: VENCIDO (${vencidoIdx + 1}) debería ir antes que DEVOLUCION (${devIdx + 1})`);
  }
  if (devIdx >= 0 && riskIdx >= 0 && devIdx > riskIdx) {
    issues.push('Orden: DEVOLUCION debería ir antes que AT RISK');
  }
  if (finalIdx >= 0 && vencidoIdx >= 0 && finalIdx < vencidoIdx) {
    issues.push('Orden: FINALIZADO debería ir al final del listado');
  }

  const bottleneckRow = adminPage.locator('tr', { hasText: 'BOTTLENECK' }).first();
  if (await bottleneckRow.count()) {
    const rowText = await bottleneckRow.textContent();
    if (rowText && !rowText.includes('Sem.') && !rowText.includes('1')) {
      issues.push('BOTTLENECK: fila sin semestres visibles');
    }
  }

  if (await adminPage.getByText('Pre-institutional').count()) {
    console.log('✓ Badge Pre-institutional visible (LEGACY)');
  } else {
    issues.push('LEGACY: no se ve badge Pre-institutional');
  }

  const pipelineNodes = await adminPage.locator('.rounded-full.border-2').count();
  if (pipelineNodes < 4) {
    issues.push(`Admin: pipeline con pocos nodos visibles (${pipelineNodes})`);
  } else {
    console.log(`✓ Pipeline institucional visible (${pipelineNodes} nodos)`);
  }

  const adminShots = [];
  for (const w of [375, 768, 1280]) {
    adminShots.push(await capture(adminPage, 'admin-dashboard', w));
  }

  // Pipeline scroll mobile
  await adminPage.setViewportSize({ width: 375, height: 800 });
  await adminPage.goto(`${BASE}/product/dashboard`, { waitUntil: 'networkidle' });
  const pipeline = adminPage.locator('section').filter({ has: adminPage.locator('.rounded-full.border-2') }).first();
  if (await pipeline.count()) {
    const box = await pipeline.boundingBox();
    if (box && box.width > 375) {
      console.log('✓ Pipeline wider than viewport — scroll horizontal esperado');
    }
  }

  // --- PRODUCT ---
  const productCtx = await browser.newContext();
  const productPage = await productCtx.newPage();
  productPage.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(`[PRODUCT] ${msg.text()}`);
  });
  await injectAuth(productPage, 'product@local', 'Product123!');
  await productPage.goto(`${BASE}/product/dashboard`, { waitUntil: 'networkidle' });
  await productPage.waitForTimeout(1500);

  const productTitle = await productPage.locator('h1').first().textContent();
  if (!productTitle?.includes('Dashboard Product')) {
    issues.push(`Product: título esperado Dashboard Product, got "${productTitle}"`);
  }
  if (!(await productPage.getByText('Crear solicitud').count())) {
    issues.push('Product: falta botón Crear solicitud');
  }
  if (await productPage.getByText('Vista global de programas').count()) {
    issues.push('Product: contaminación panel Admin');
  }

  const productShot = await capture(productPage, 'product-dashboard', 1280);

  await browser.close();

  console.log('\n==> Capturas guardadas en:', OUT);
  adminShots.forEach((s) => console.log(' ', path.basename(s)));
  console.log(' ', path.basename(productShot));

  if (consoleErrors.length) {
    console.log('\nErrores consola:');
    consoleErrors.forEach((e) => console.log(' ', e));
  } else {
    console.log('\n✓ Sin errores de consola capturados');
  }

  if (issues.length) {
    console.log('\n==> PROBLEMAS ENCONTRADOS:');
    issues.forEach((i) => console.log(' ✗', i));
    process.exitCode = 1;
  } else {
    console.log('\n==> QA visual browser: OK');
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
