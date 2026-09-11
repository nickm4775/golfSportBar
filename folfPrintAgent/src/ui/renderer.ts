type ConnectionType = 'network' | 'usb' | 'bluetooth';

type LocalPrinter = {
  id?: string;
  name: string;
  connectionType: ConnectionType;
  address: string;
  paperWidth: number;
  isOnline: boolean;
};

type DiscoveredPrinter = {
  connectionType: ConnectionType;
  address: string;
  name: string;
  isReachable: boolean;
  printCapable?: 'unknown' | 'likely';
  note?: string;
};

type AgentBridge = {
  getState: () => Promise<{
    apiBaseUrl: string;
    status: { running: boolean; paired: boolean; message: string };
    printers: LocalPrinter[];
    logs: string[];
    businessId: string | null;
    agentId: string | null;
  }>;
  setApiBaseUrl: (url: string) => Promise<string>;
  pair: (code: string, apiBaseUrl?: string) => Promise<unknown>;
  start: () => Promise<unknown>;
  stop: () => Promise<unknown>;
  unpair: () => Promise<unknown>;
  savePrinter: (
    printer: LocalPrinter,
  ) => Promise<{ printers: LocalPrinter[]; updatedExisting: boolean }>;
  updatePrinter: (address: string, patch: Partial<LocalPrinter>) => Promise<LocalPrinter[]>;
  removePrinter: (address: string) => Promise<LocalPrinter[]>;
  testPrint: (address: string) => Promise<unknown>;
  discoverPrinters: (opts?: {
    network?: boolean;
    usb?: boolean;
    bluetooth?: boolean;
  }) => Promise<DiscoveredPrinter[]>;
  cancelDiscover: () => Promise<unknown>;
  onLog: (cb: (line: string) => void) => () => void;
  onStatus: (cb: (status: { message: string; running: boolean; paired: boolean }) => void) => () => void;
  onDiscoverProgress: (cb: (message: string) => void) => () => void;
};

const agent = (window as unknown as { printAgent: AgentBridge }).printAgent;

const apiBaseUrl = document.getElementById('apiBaseUrl') as HTMLInputElement;
const pairCode = document.getElementById('pairCode') as HTMLInputElement;
const statusText = document.getElementById('statusText') as HTMLElement;
const statusBadge = document.getElementById('statusBadge') as HTMLElement;
const meta = document.getElementById('meta') as HTMLElement;
const logBox = document.getElementById('logBox') as HTMLElement;
const printerList = document.getElementById('printerList') as HTMLElement;
const printerEmpty = document.getElementById('printerEmpty') as HTMLElement;
const printerName = document.getElementById('printerName') as HTMLInputElement;
const printerAddress = document.getElementById('printerAddress') as HTMLInputElement;
const printerType = document.getElementById('printerType') as HTMLSelectElement;
const printerPaperWidth = document.getElementById('printerPaperWidth') as HTMLSelectElement;
const addressLabel = document.getElementById('addressLabel') as HTMLElement;
const discoverPanel = document.getElementById('discoverPanel') as HTMLElement;
const manualPanel = document.getElementById('manualPanel') as HTMLElement;
const discoverResults = document.getElementById('discoverResults') as HTMLElement;
const discoverProgress = document.getElementById('discoverProgress') as HTMLElement;
const discoverPaperWidth = document.getElementById('discoverPaperWidth') as HTMLSelectElement;
const discoverName = document.getElementById('discoverName') as HTMLInputElement;
const btnAddSelected = document.getElementById('btnAddSelected') as HTMLButtonElement;
const btnCancelDiscover = document.getElementById('btnCancelDiscover') as HTMLButtonElement;
const connectionBody = document.getElementById('connectionBody') as HTMLElement;
const btnToggleConnection = document.getElementById('btnToggleConnection') as HTMLButtonElement;

let discovered: DiscoveredPrinter[] = [];
let selectedAddresses = new Set<string>();
let discovering = false;
/** Address currently shown in inline edit form (Electron has no window.prompt). */
let editingAddress: string | null = null;

function typeLabel(type: ConnectionType) {
  if (type === 'network') return 'RED';
  if (type === 'usb') return 'USB';
  return 'BT';
}

function addressPlaceholder(type: ConnectionType) {
  if (type === 'network') return '192.168.1.50:9100';
  if (type === 'usb') return 'usb:04b8:0e15 o usb:04b8:0e15:SERIAL';
  return 'bt:AA:BB:CC:DD:EE:FF';
}

function addressHint(type: ConnectionType) {
  if (type === 'network') return 'IP:puerto';
  if (type === 'usb') return 'usb:VID:PID[:SERIAL]#bus.dev';
  return 'bt:MAC';
}

function setStatusUI(status: { message: string; running: boolean; paired: boolean }) {
  statusText.textContent = status.message;
  statusBadge.className = 'badge';
  if (status.running) {
    statusBadge.classList.add('badge-online');
    statusBadge.textContent = 'En línea';
  } else if (status.paired) {
    statusBadge.classList.add('badge-paired');
    statusBadge.textContent = 'Emparejado';
  } else {
    statusBadge.classList.add('badge-idle');
    statusBadge.textContent = 'Sin emparejar';
  }

  const expanded = !status.paired;
  btnToggleConnection.setAttribute('aria-expanded', String(expanded));
  connectionBody.classList.toggle('collapsed', !expanded);
}

function renderPrinters(printers: LocalPrinter[]) {
  printerList.innerHTML = '';
  printerEmpty.classList.toggle('hidden', printers.length > 0);

  for (const p of printers) {
    const card = document.createElement('article');
    card.className = 'printer-card';
    if (editingAddress === p.address) card.classList.add('editing');

    card.innerHTML = `
      <div class="printer-icon ${p.connectionType}">${typeLabel(p.connectionType)}</div>
      <div>
        <h3>${escapeHtml(p.name)}</h3>
        <div class="addr">${escapeHtml(p.address)}</div>
        <div>
          <span class="chip ${p.isOnline ? 'online' : ''}">${p.isOnline ? 'Online' : 'Offline'}</span>
          <span class="chip">${p.paperWidth || 58} mm</span>
          <span class="chip">${typeLabel(p.connectionType)}</span>
        </div>
      </div>
    `;

    const actions = document.createElement('div');
    actions.className = 'printer-actions';

    const btnTest = document.createElement('button');
    btnTest.type = 'button';
    btnTest.className = 'secondary';
    btnTest.textContent = 'Probar';
    btnTest.onclick = async () => {
      try {
        btnTest.disabled = true;
        await agent.testPrint(p.address);
        appendLog(`Prueba enviada a ${p.name}`);
      } catch (error) {
        appendLog(`Error prueba: ${(error as Error).message}`);
      } finally {
        btnTest.disabled = false;
      }
    };

    const btnEdit = document.createElement('button');
    btnEdit.type = 'button';
    btnEdit.className = 'ghost';
    btnEdit.textContent = editingAddress === p.address ? 'Cerrar' : 'Editar';
    btnEdit.onclick = () => {
      editingAddress = editingAddress === p.address ? null : p.address;
      renderPrinters(printers);
    };

    const btnRemove = document.createElement('button');
    btnRemove.type = 'button';
    btnRemove.className = 'danger ghost';
    btnRemove.textContent = 'Quitar';
    btnRemove.onclick = async () => {
      if (editingAddress === p.address) editingAddress = null;
      const next = await agent.removePrinter(p.address);
      renderPrinters(next);
    };

    actions.append(btnTest, btnEdit, btnRemove);
    card.appendChild(actions);

    if (editingAddress === p.address) {
      const edit = document.createElement('div');
      edit.className = 'printer-edit';
      edit.innerHTML = `
        <label>
          Nombre
          <input type="text" class="edit-name" value="${escapeHtml(p.name)}" autocomplete="off" />
        </label>
        <label>
          Ancho de papel
          <select class="edit-width">
            <option value="58" ${p.paperWidth < 80 ? 'selected' : ''}>58 mm</option>
            <option value="80" ${p.paperWidth >= 80 ? 'selected' : ''}>80 mm</option>
          </select>
        </label>
        <div class="row">
          <button type="button" class="secondary edit-cancel">Cancelar</button>
          <button type="button" class="edit-save">Guardar</button>
        </div>
      `;
      const nameInput = edit.querySelector('.edit-name') as HTMLInputElement;
      const widthSelect = edit.querySelector('.edit-width') as HTMLSelectElement;
      edit.querySelector('.edit-cancel')!.addEventListener('click', () => {
        editingAddress = null;
        renderPrinters(printers);
      });
      edit.querySelector('.edit-save')!.addEventListener('click', async () => {
        const name = nameInput.value.trim() || p.name;
        const paperWidth = Number(widthSelect.value) >= 80 ? 80 : 58;
        const next = await agent.updatePrinter(p.address, { name, paperWidth });
        editingAddress = null;
        renderPrinters(next);
        appendLog(`Impresora actualizada: ${name}`);
      });
      card.appendChild(edit);
      queueMicrotask(() => nameInput.focus());
    }

    printerList.appendChild(card);
  }
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function appendLog(line: string) {
  logBox.textContent = `${line}\n${logBox.textContent ?? ''}`.trim();
}

function renderDiscoverResults() {
  discoverResults.innerHTML = '';
  for (const item of discovered) {
    const row = document.createElement('label');
    row.className = 'discover-item';
    const checked = selectedAddresses.has(item.address);
    row.innerHTML = `
      <input type="checkbox" ${checked ? 'checked' : ''} data-address="${escapeHtml(item.address)}" />
      <div>
        <strong>${escapeHtml(item.name)}</strong>
        <div class="meta">${typeLabel(item.connectionType)} · ${escapeHtml(item.address)}${
          item.note ? ` · ${escapeHtml(item.note)}` : ''
        }${item.printCapable === 'likely' ? ' · probablemente impresora' : ''}</div>
      </div>
      <span class="chip ${item.isReachable ? 'online' : ''}">${item.isReachable ? 'OK' : 'Aviso'}</span>
    `;
    const checkbox = row.querySelector('input') as HTMLInputElement;
    checkbox.onchange = () => {
      if (checkbox.checked) selectedAddresses.add(item.address);
      else selectedAddresses.delete(item.address);
      btnAddSelected.disabled = selectedAddresses.size === 0;
    };
    discoverResults.appendChild(row);
  }
  btnAddSelected.disabled = selectedAddresses.size === 0;
}

async function refresh() {
  const state = await agent.getState();
  apiBaseUrl.value = state.apiBaseUrl;
  setStatusUI(state.status);
  meta.textContent = [
    state.agentId ? `Agente ${state.agentId.slice(0, 8)}…` : null,
    state.businessId ? `Negocio ${state.businessId.slice(0, 8)}…` : null,
  ]
    .filter(Boolean)
    .join(' · ') || 'Sin emparejar';
  renderPrinters(state.printers);
  logBox.textContent = state.logs.join('\n');
}

printerType.addEventListener('change', () => {
  const type = printerType.value as ConnectionType;
  addressLabel.textContent = addressHint(type);
  printerAddress.placeholder = addressPlaceholder(type);
});

btnToggleConnection.addEventListener('click', () => {
  const expanded = btnToggleConnection.getAttribute('aria-expanded') !== 'true';
  btnToggleConnection.setAttribute('aria-expanded', String(expanded));
  connectionBody.classList.toggle('collapsed', !expanded);
});

document.getElementById('btnToggleManual')!.addEventListener('click', () => {
  manualPanel.classList.toggle('hidden');
  if (!manualPanel.classList.contains('hidden')) {
    discoverPanel.classList.add('hidden');
  }
});

document.getElementById('btnDiscover')!.addEventListener('click', async () => {
  discoverPanel.classList.remove('hidden');
  manualPanel.classList.add('hidden');
  if (discovering) return;

  discovering = true;
  selectedAddresses = new Set();
  discovered = [];
  renderDiscoverResults();
  btnCancelDiscover.classList.remove('hidden');
  discoverProgress.textContent = 'Escaneando…';

  try {
    discovered = await agent.discoverPrinters({
      network: (document.getElementById('discNetwork') as HTMLInputElement).checked,
      usb: (document.getElementById('discUsb') as HTMLInputElement).checked,
      bluetooth: (document.getElementById('discBluetooth') as HTMLInputElement).checked,
    });
    renderDiscoverResults();
    discoverProgress.textContent =
      discovered.length > 0
        ? `${discovered.length} dispositivo(s) encontrado(s). Selecciona y agrega.`
        : 'No se encontraron dispositivos. Prueba alta manual o revisa la red/USB/BT.';
  } catch (error) {
    discoverProgress.textContent = `Error: ${(error as Error).message}`;
    appendLog(`Discovery error: ${(error as Error).message}`);
  } finally {
    discovering = false;
    btnCancelDiscover.classList.add('hidden');
  }
});

btnCancelDiscover.addEventListener('click', async () => {
  await agent.cancelDiscover();
  discoverProgress.textContent = 'Cancelando escaneo…';
});

btnAddSelected.addEventListener('click', async () => {
  const paperWidth = Number(discoverPaperWidth.value) >= 80 ? 80 : 58;
  const customName = discoverName.value.trim();
  const selected = discovered.filter((item) => selectedAddresses.has(item.address));
  if (!selected.length) return;

  let printers: LocalPrinter[] = [];
  let added = 0;
  let updated = 0;
  let index = 0;
  try {
    for (const item of selected) {
      index += 1;
      let name = item.name;
      if (customName) {
        name = selected.length === 1 ? customName : `${customName} ${index}`;
      }
      const result = await agent.savePrinter({
        name,
        connectionType: item.connectionType,
        address: item.address,
        paperWidth,
        isOnline: item.isReachable,
      });
      printers = result.printers;
      if (result.updatedExisting) updated += 1;
      else added += 1;
    }
    renderPrinters(printers);
    selectedAddresses = new Set();
    discoverName.value = '';
    renderDiscoverResults();
    appendLog(
      `Discovery: ${added} nueva(s), ${updated} actualizada(s) (${paperWidth} mm). Total: ${printers.length}`,
    );
  } catch (error) {
    if (printers.length) renderPrinters(printers);
    appendLog(`Error al agregar: ${(error as Error).message}`);
  }
});

document.getElementById('btnPair')!.addEventListener('click', async () => {
  try {
    await agent.setApiBaseUrl(apiBaseUrl.value.trim());
    await agent.pair(pairCode.value.trim(), apiBaseUrl.value.trim());
    await refresh();
  } catch (error) {
    appendLog(`Error emparejar: ${(error as Error).message}`);
  }
});

document.getElementById('btnStart')!.addEventListener('click', async () => {
  try {
    await agent.start();
    await refresh();
  } catch (error) {
    appendLog(`Error iniciar: ${(error as Error).message}`);
  }
});

document.getElementById('btnStop')!.addEventListener('click', async () => {
  await agent.stop();
  await refresh();
});

document.getElementById('btnUnpair')!.addEventListener('click', async () => {
  await agent.unpair();
  await refresh();
});

document.getElementById('btnSavePrinter')!.addEventListener('click', async () => {
  let address = printerAddress.value.trim();
  if (!address) {
    appendLog('Escribe la dirección de la impresora (IP:puerto, usb:VID:PID o bt:MAC)');
    return;
  }
  const connectionType = printerType.value as ConnectionType;
  if (connectionType === 'network' && !address.includes(':')) {
    address = `${address}:9100`;
  }
  const name = printerName.value.trim() || 'Impresora';
  try {
    const result = await agent.savePrinter({
      name,
      connectionType,
      address,
      paperWidth: Number(printerPaperWidth.value) >= 80 ? 80 : 58,
      isOnline: true,
    });
    renderPrinters(result.printers);
    printerAddress.value = '';
    printerName.value = '';
    printerName.placeholder = 'Cocina, Barra…';
    if (result.updatedExisting) {
      appendLog(
        `Actualizada impresora existente (misma dirección): ${name}. Total: ${result.printers.length}`,
      );
    } else {
      appendLog(`Impresora guardada: ${name}. Total: ${result.printers.length}`);
    }
  } catch (error) {
    appendLog(`Error al guardar: ${(error as Error).message}`);
  }
});

agent.onLog(appendLog);
agent.onStatus(setStatusUI);
agent.onDiscoverProgress((message) => {
  discoverProgress.textContent = message;
});

void refresh();
