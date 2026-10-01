import { test, expect } from '@playwright/test'

test('campaigns support filtering, details and keyboard navigation without horizontal overflow', async ({
  page,
}, testInfo) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto('/demo?view=agronomy')
  await page.getByRole('tab', { name: 'Campañas', exact: true }).click()
  await expect(page.getByRole('button', { name: /^Ver campaña / })).toHaveCount(5)
  const noOverflow = async () => {
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)
    ).toBe(true)
    expect(
      await page
        .locator('#ag-tabpanel')
        .evaluate((element) => element.scrollWidth <= element.clientWidth)
    ).toBe(true)
  }
  await noOverflow()
  await page.getByLabel('Buscar campaña', { exact: true }).fill('maiz')
  await expect(page.getByRole('button', { name: /^Ver campaña / })).toHaveCount(1)
  await page.getByRole('button', { name: 'Limpiar filtros' }).click()
  await page.getByLabel('Campaña / ciclo', { exact: true }).selectOption('2026/27')
  await page.getByLabel('Campo', { exact: true }).selectOption('esperanza')
  await page.getByLabel('Cultivo', { exact: true }).selectOption('Soja')
  await page.getByLabel('Estado', { exact: true }).selectOption('En curso')
  await expect(page.getByRole('button', { name: /^Ver campaña / })).toHaveCount(1)
  await page.getByRole('button', { name: 'Limpiar filtros' }).click()
  await page.getByRole('heading', { name: 'Campañas productivas' }).scrollIntoViewIfNeeded()
  await page.screenshot({ path: testInfo.outputPath('campaigns-list.png'), fullPage: true })
  await page.getByRole('button', { name: 'Ver campaña Soja 2026/27', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Soja 2026/27', exact: true })).toBeFocused()
  await expect(page.getByRole('heading', { name: 'Timeline productivo' })).toBeVisible()
  await expect(page.getByRole('progressbar', { name: 'Presupuesto utilizado' })).toHaveAttribute(
    'aria-valuenow',
    '38'
  )
  await noOverflow()
  await page.screenshot({ path: testInfo.outputPath('campaigns-detail.png'), fullPage: true })
  await page.getByRole('button', { name: 'Volver a campañas' }).click()
  await expect(
    page.getByRole('button', { name: 'Ver campaña Soja 2026/27', exact: true })
  ).toBeFocused()
  await page.getByLabel('Buscar campaña', { exact: true }).fill('no existe')
  await expect(page.getByRole('heading', { name: 'No hay campañas que coincidan' })).toBeVisible()
  await page.getByRole('button', { name: 'Mostrar todas las campañas' }).click()
  await page.getByRole('button', { name: 'Nueva campaña', exact: true }).click()
  await expect(page.getByRole('dialog', { name: 'Nueva campaña' })).toBeVisible()
  await noOverflow()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Nueva campaña', exact: true })).toBeFocused()
  await page.getByRole('tab', { name: 'Campañas', exact: true }).focus()
  await page.keyboard.press('ArrowRight')
  await expect(page.getByRole('tab', { name: 'Operaciones', exact: true })).toHaveAttribute(
    'aria-selected',
    'true'
  )
  expect(errors).toEqual([])
})
