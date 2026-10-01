import test, { beforeEach, afterEach } from 'node:test'
import assert from 'node:assert/strict'
import React from 'react'
import { JSDOM } from 'jsdom'
import { cleanup, fireEvent, render, within } from '@testing-library/react/pure'
import { AgronomyPanel } from './agronomy-panel'
import { AgronautasWorkspace } from '../workspace'

beforeEach(() => {
  const dom = new JSDOM('<!doctype html><html><body></body></html>', {
    url: 'http://localhost/demo?view=agronomy',
  })
  globalThis.window = dom.window as unknown as Window & typeof globalThis
  globalThis.document = dom.window.document
  globalThis.HTMLElement = dom.window.HTMLElement
  globalThis.FormData = dom.window.FormData
  dom.window.HTMLDialogElement.prototype.showModal = function () {
    this.setAttribute('open', '')
  }
  dom.window.HTMLDialogElement.prototype.close = function () {
    this.removeAttribute('open')
  }
})
afterEach(cleanup)

test('agronomy is independent and retains the workspace navigation', () => {
  const props = {
    accessState: 'demo',
    runtimeMode: 'demo',
    workspaceView: 'agronomy',
    workspaceBasePath: '/demo',
    selectedFieldId: null,
  } as React.ComponentProps<typeof AgronautasWorkspace>
  const view = render(<AgronautasWorkspace {...props} />)
  assert.ok(view.getByRole('heading', { name: 'Gestión Agronómica', level: 1 }))
  assert.equal(view.getAllByRole('tab').length, 9)
  assert.equal(view.container.querySelector('#agronautas-management'), null)
  assert.equal(view.container.querySelector('#agronautas-intake'), null)
  assert.equal(
    within(view.getByRole('navigation', { name: 'Navegación de Agronautas' }))
      .getByRole('link', { name: 'Agronomía' })
      .getAttribute('aria-current'),
    'page'
  )
})

test('local edits, completion and deletion update the overview', () => {
  const view = render(<AgronomyPanel />)
  fireEvent.click(view.getByRole('tab', { name: 'Lotes' }))
  fireEvent.click(view.getAllByRole('button', { name: 'Editar' })[0]!)
  const dialog = within(view.getByRole('dialog'))
  fireEvent.change(dialog.getByLabelText(/Nombre del lote/), { target: { value: 'Lote Demo' } })
  fireEvent.click(dialog.getByRole('button', { name: 'Guardar registro' }))
  assert.ok(view.getByRole('cell', { name: 'Lote Demo' }))
  fireEvent.click(view.getByRole('tab', { name: 'Operaciones' }))
  fireEvent.click(view.getAllByRole('button', { name: 'Completar' })[0]!)
  assert.ok(view.getByText('Completada'))
  fireEvent.click(view.getAllByRole('button', { name: 'Eliminar' })[0]!)
  fireEvent.click(view.getByRole('button', { name: 'Confirmar eliminación' }))
  assert.equal(view.queryByRole('cell', { name: 'Fertilizar Lote Norte' }), null)
  fireEvent.click(view.getByRole('tab', { name: 'Resumen' }))
  assert.ok(view.getByText('Lote Demo'))
  assert.equal(view.queryByText('Fertilizar Lote Norte'), null)
})

test('stock movements validate available quantity and refresh critical stock', () => {
  const view = render(<AgronomyPanel />)
  fireEvent.click(view.getByRole('tab', { name: 'Insumos' }))
  fireEvent.click(view.getAllByRole('button', { name: 'Registrar salida' })[0]!)
  fireEvent.change(view.getByLabelText('Cantidad (kg)'), { target: { value: '500' } })
  fireEvent.submit(view.getByRole('button', { name: 'Guardar movimiento' }).closest('form')!)
  assert.ok(view.getByRole('alert'))
  fireEvent.click(view.getByRole('button', { name: 'Cancelar' }))
  fireEvent.click(view.getAllByRole('button', { name: 'Registrar entrada' })[0]!)
  fireEvent.change(view.getByLabelText('Cantidad (kg)'), { target: { value: '200' } })
  fireEvent.click(view.getByRole('button', { name: 'Guardar movimiento' }))
  assert.ok(view.getByRole('cell', { name: '650' }))
  fireEvent.click(view.getByRole('tab', { name: 'Resumen' }))
  assert.equal(view.queryByText('Stock bajo'), null)
})

test('campaign filters combine, clear and preserve their selection after viewing details', () => {
  const view = render(<AgronomyPanel />)
  fireEvent.click(view.getByRole('tab', { name: 'Campañas' }))
  fireEvent.change(view.getByLabelText('Cultivo'), { target: { value: 'Soja' } })
  fireEvent.change(view.getByLabelText('Estado'), { target: { value: 'En curso' } })
  assert.equal(view.getAllByRole('button', { name: /^Ver campaña / }).length, 1)
  fireEvent.click(view.getByRole('button', { name: 'Ver campaña Soja 2026/27' }))
  assert.ok(view.getByRole('heading', { name: 'Timeline productivo' }))
  assert.ok(view.getByRole('heading', { name: 'Próximas actividades' }))
  assert.equal(
    view.getByRole('progressbar', { name: 'Presupuesto utilizado' }).getAttribute('aria-valuenow'),
    '38'
  )
  assert.equal(
    view.container.querySelector('[aria-current="step"]')?.textContent,
    '4MonitoreoActual'
  )
  fireEvent.click(view.getByRole('button', { name: 'Volver a campañas' }))
  assert.equal((view.getByLabelText('Cultivo') as HTMLSelectElement).value, 'Soja')
  fireEvent.change(view.getByLabelText('Cultivo'), {
    target: { value: 'Trigo' },
  })
  assert.ok(view.getByRole('heading', { name: 'No hay campañas que coincidan' }))
  fireEvent.click(view.getByRole('button', { name: 'Mostrar todas las campañas' }))
  assert.equal(view.getAllByRole('button', { name: /^Ver campaña / }).length, 5)
})

test('new campaign explains demo scope and completed campaigns have no pending activities', () => {
  const view = render(<AgronomyPanel />)
  fireEvent.click(view.getByRole('tab', { name: 'Campañas' }))
  fireEvent.click(view.getByRole('button', { name: 'Nueva campaña' }))
  assert.ok(view.getByRole('dialog', { name: 'Nueva campaña' }))
  fireEvent.click(view.getByRole('button', { name: 'Volver al listado' }))
  fireEvent.click(view.getByRole('button', { name: 'Ver campaña Trigo 2025/26' }))
  assert.ok(view.getByText('Campaña finalizada. No hay actividades pendientes.'))
  assert.equal(view.container.querySelector('[aria-current="step"]'), null)
  fireEvent.click(view.getByRole('tab', { name: 'Costos' }))
  assert.ok(view.getByRole('heading', { name: 'Presupuesto de campaña' }))
  fireEvent.click(view.getByRole('tab', { name: 'Cosecha' }))
  assert.ok(view.getByRole('heading', { name: 'Plan de cosecha' }))
})
