/**
 * QA visual — módulo Reportes (PRODUCT, FABRICA, ADMIN)
 * Ejecutar desde Producto-Frontend:
 *   npx playwright install chromium
 *   node scripts/qa-reports-visual-browser.mjs
 */
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, '..', 'qa-screenshots-reports');
const BASE = process.env.APP_BASE ?? 'http://localhost:5173';
const API = (process.env.API_BASE ?? 'http://localhost:3000').replace(/\/$/, '');

const USERS = {
  PRODUCT: process.env.QA_PRODUCT_EMAIL ?? 'angie_fontechapa@cun.edu.co',
  FABRICA: process.env.QA_FABRICA_EMAIL ?? 'zuany_acuna@cun.edu.co',
  ADMIN: process.env.QA_ADMIN_EMAIL ?? 'desarrollofabrica@cun.edu.co',
};

async function apiLogin(email, password) {
  let res = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    res = await fetch(`${API}/auth/dev/email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
  }
  const data = await res.json();
  if (!res.ok) throw new Error(`Login ${email} failed: ${JSON.stringify(data)}`);
  return data;
}

async function injectAuth(page, email, password) {
  const { accessToken, user } = await apiLogin(email, password ?? 'Product123!');
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

async function capture(page, subdir, name) {
  const dir = path.join(OUT, subdir);
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, `${name}.png`);
  await page.screenshot({ path: file, fullPage: true });
  return file;
}

async function assertReportsNav(page, roleKey) {
  const nav = page.getByRole('link', { name: 'Reportes' });
  if ((await nav.count()) === 0) throw new Error(`${roleKey}: falta enlace Reportes en nav`);
  await nav.first().click();
  await page.waitForURL('**/reports', { timeout: 15000 });
  await page.waitForTimeout(800);
}

async function testRole(browser, roleKey, email, password, expectations) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();
  const consoleErrors = [];

  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(`[${roleKey}] ${msg.text()}`);
  });
  page.on('pageerror', (err) => consoleErrors.push(`[${roleKey} PAGE] ${err.message}`));

  const issues = [];
  await injectAuth(page, email, password);
  await page.goto(`${BASE}/reports`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1200);

  await assertReportsNav(page, roleKey);
  await capture(page, roleKey, '01-catalog');

  const title = await page.locator('h1').first().textContent();
  if (!title?.includes('Reportes')) issues.push(`${roleKey}: h1 no es Reportes`);

  const cards = page.locator('a[href^="/reports/"]');
  const cardCount = await cards.count();
  if (cardCount !== expectations.catalogCount) {
    issues.push(`${roleKey}: esperaba ${expectations.catalogCount} cards, got ${cardCount}`);
  }

  for (const id of expectations.mustInclude) {
    if ((await page.locator(`a[href="/reports/${id}"]`).count()) === 0) {
      issues.push(`${roleKey}: falta card ${id}`);
    }
  }
  for (const id of expectations.mustExclude ?? []) {
    if ((await page.locator(`a[href="/reports/${id}"]`).count()) > 0) {
      issues.push(`${roleKey}: no debería ver ${id}`);
    }
  }

  if ((await page.getByText('disponibles').count()) === 0 && cardCount > 0) {
    issues.push(`${roleKey}: falta contador "disponibles"`);
  }

  const firstId = expectations.detailReportId ?? expectations.mustInclude[0];
  await page.goto(`${BASE}/reports/${firstId}`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  await capture(page, roleKey, `02-detail-${firstId}`);

  if ((await page.getByText('Exportación').count()) === 0) {
    issues.push(`${roleKey}: falta sección Exportación`);
  }
  if ((await page.getByText('Filtros del reporte').count()) === 0) {
    issues.push(`${roleKey}: falta panel Filtros`);
  }
  if ((await page.getByText('Vista previa').count()) === 0) {
    issues.push(`${roleKey}: falta etiqueta Vista previa`);
  }

  const hasTable = (await page.locator('table').count()) > 0;
  const hasEmpty = (await page.getByText('Sin resultados con estos filtros').count()) > 0;
  if (!hasTable && !hasEmpty) {
    issues.push(`${roleKey}: ni tabla ni empty state visible`);
  }

  await ctx.close();
  return { issues, consoleErrors, cardCount };
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const allIssues = [];
  const allConsole = [];

  const roles = [
    {
      key: 'PRODUCT',
      email: USERS.PRODUCT,
      password: process.env.SEED_PRODUCT_PASSWORD ?? 'Product123!',
      expectations: {
        catalogCount: 4,
        mustInclude: ['requests-general', 'sla-compliance'],
        mustExclude: ['factory-production', 'audit-trail'],
        detailReportId: 'requests-general',
      },
    },
    {
      key: 'FABRICA',
      email: USERS.FABRICA,
      password: process.env.SEED_FABRICA_PASSWORD ?? 'Fabrica123!',
      expectations: {
        catalogCount: 3,
        mustInclude: ['factory-production', 'sla-compliance'],
        mustExclude: ['requests-general', 'audit-trail'],
        detailReportId: 'factory-production',
      },
    },
    {
      key: 'ADMIN',
      email: USERS.ADMIN,
      password: process.env.SEED_ADMIN_PASSWORD ?? 'Admin123!',
      expectations: {
        catalogCount: 8,
        mustInclude: ['audit-trail', 'productivity-by-role'],
        mustExclude: [],
        detailReportId: 'sla-compliance',
      },
    },
  ];

  for (const r of roles) {
    console.log(`\n=== Visual ${r.key} (${r.email}) ===`);
    try {
      const { issues, consoleErrors, cardCount } = await testRole(
        browser,
        r.key,
        r.email,
        r.password,
        r.expectations,
      );
      console.log(`  Cards: ${cardCount}`);
      allIssues.push(...issues);
      allConsole.push(...consoleErrors);
      issues.forEach((i) => console.log(`  ✗ ${i}`));
      if (!issues.length) console.log('  ✓ OK');
    } catch (e) {
      allIssues.push(`${r.key}: ${e.message}`);
      console.log(`  ✗ ${e.message}`);
    }
  }

  await browser.close();

  console.log('\n==> Capturas:', OUT);
  if (allConsole.length) {
    console.log('\nErrores consola:');
    [...new Set(allConsole)].forEach((e) => console.log(' ', e));
  } else {
    console.log('\n✓ Sin errores de consola capturados');
  }

  if (allIssues.length) {
    console.log('\n==> PROBLEMAS:');
    allIssues.forEach((i) => console.log(' ✗', i));
    process.exitCode = 1;
  } else {
    console.log('\n==> QA visual reportes: OK');
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
