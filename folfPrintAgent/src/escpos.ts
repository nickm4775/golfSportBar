/**
 * ESC/POS ticket renderer for the desktop print agent.
 *
 * The payload shape MUST match what folf-back stores in `print_jobs.payload`
 * (see folf-back/src/modules/print/infrastructure/escpos.ts). Every field is
 * treated as optional at render time so a partial payload still prints something
 * usable instead of throwing.
 */
export type TicketLine = {
  quantity?: number;
  name?: string;
  notes?: string | null;
};

export type TicketPayload = {
  businessName?: string;
  stationLabel?: string;
  tableLabel?: string | null;
  notes?: string | null;
  createdAtLabel?: string;
  lines?: TicketLine[];
  isTest?: boolean;
};

function encodeText(text: string): Buffer {
  return Buffer.from(
    text
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .replace(/[^\x20-\x7E\n]/g, '?'),
    'ascii',
  );
}

export function renderEscPosTicket(payload: TicketPayload, paperWidth = 80): Buffer {
  const cols = (paperWidth ?? 80) <= 58 ? 32 : 48;
  const chunks: Buffer[] = [];
  const push = (buf: Buffer | string) => {
    chunks.push(typeof buf === 'string' ? encodeText(buf) : buf);
  };
  const line = (char = '-') => `${char.repeat(cols)}\n`;
  const center = (text: string) => {
    const t = text.slice(0, cols);
    const pad = Math.max(0, Math.floor((cols - t.length) / 2));
    return `${' '.repeat(pad)}${t}\n`;
  };

  push(Buffer.from([0x1b, 0x40])); // ESC @ — init
  push(Buffer.from([0x1b, 0x61, 0x01])); // ESC a 1 — center
  push(Buffer.from([0x1b, 0x45, 0x01])); // ESC E 1 — bold on
  if (payload.businessName) push(center(payload.businessName));
  if (payload.stationLabel) push(center(payload.stationLabel));
  if (payload.isTest) push(center('TEST PRINT'));
  push(Buffer.from([0x1b, 0x45, 0x00])); // ESC E 0 — bold off
  push(Buffer.from([0x1b, 0x61, 0x00])); // ESC a 0 — left

  push(line());
  push(`Mesa: ${payload.tableLabel?.trim() || '-'}\n`);
  if (payload.createdAtLabel) push(`${payload.createdAtLabel}\n`);
  push(line());

  for (const item of payload.lines ?? []) {
    push(`${item.quantity ?? 1}x ${item.name ?? 'Item'}\n`);
    if (item.notes?.trim()) push(`  * ${item.notes.trim()}\n`);
  }

  if (payload.notes?.trim()) {
    push(line());
    push(`Notas: ${payload.notes.trim()}\n`);
  }

  push(line());
  // Feed enough paper so the last printed lines clear the cutter blade before cutting.
  // ESC d 5 -> feed 5 lines; GS V 66 0 -> feed to cutting position + partial cut
  // (function B: the printer adds the head-to-cutter distance itself).
  // Fallback for mechs without function B: ESC d 6 then GS V 1 (0x1d 0x56 0x01).
  push(Buffer.from([0x1b, 0x64, 0x05]));
  push(Buffer.from([0x1d, 0x56, 0x42, 0x00]));

  return Buffer.concat(chunks);
}

export type ReceiptLine = {
  quantity?: number;
  name?: string;
  unitPriceLabel?: string;
  lineTotalLabel?: string;
};

export type ReceiptPayload = {
  businessName?: string;
  tableLabel?: string | null;
  customerName?: string | null;
  createdAtLabel?: string;
  lines?: ReceiptLine[];
  subtotalLabel?: string;
  serviceChargeLabel?: string | null;
  totalLabel?: string;
  paymentMethodLabel?: string | null;
  paymentStatusLabel?: string | null;
  isTest?: boolean;
};

function twoColumns(left: string, right: string, width: number): string {
  const rightText = right.slice(0, width);
  const leftText = left.slice(0, Math.max(0, width - rightText.length - 1));
  const gap = Math.max(1, width - leftText.length - rightText.length);
  return `${leftText}${' '.repeat(gap)}${rightText}\n`;
}

export function renderEscPosReceipt(
  payload: ReceiptPayload,
  paperWidth = 80,
): Buffer {
  const cols = (paperWidth ?? 80) <= 58 ? 32 : 48;
  const chunks: Buffer[] = [];
  const push = (buf: Buffer | string) => {
    chunks.push(typeof buf === 'string' ? encodeText(buf) : buf);
  };
  const line = (char = '-') => `${char.repeat(cols)}\n`;
  const center = (text: string) => {
    const t = text.slice(0, cols);
    const pad = Math.max(0, Math.floor((cols - t.length) / 2));
    return `${' '.repeat(pad)}${t}\n`;
  };

  push(Buffer.from([0x1b, 0x40]));
  push(Buffer.from([0x1b, 0x61, 0x01]));
  push(Buffer.from([0x1b, 0x45, 0x01]));
  if (payload.businessName) push(center(payload.businessName));
  push(center('COMPROVANTE'));
  if (payload.isTest) push(center('TEST PRINT'));
  push(Buffer.from([0x1b, 0x45, 0x00]));
  push(Buffer.from([0x1b, 0x61, 0x00]));
  push(line());
  if (payload.tableLabel?.trim()) push(`Mesa: ${payload.tableLabel.trim()}\n`);
  if (payload.customerName?.trim())
    push(`Cliente: ${payload.customerName.trim()}\n`);
  if (payload.createdAtLabel) push(`${payload.createdAtLabel}\n`);
  push(line());
  for (const item of payload.lines ?? []) {
    push(
      twoColumns(
        `${item.quantity ?? 1}x ${item.name ?? 'Item'}`,
        item.lineTotalLabel ?? '',
        cols,
      ),
    );
    if ((item.quantity ?? 1) > 1)
      push(`  ${item.quantity} x ${item.unitPriceLabel ?? ''}\n`);
  }
  push(line());
  push(twoColumns('Subtotal', payload.subtotalLabel ?? '', cols));
  if (payload.serviceChargeLabel)
    push(twoColumns('Servico', payload.serviceChargeLabel, cols));
  push(Buffer.from([0x1b, 0x45, 0x01]));
  push(twoColumns('Total', payload.totalLabel ?? '', cols));
  push(Buffer.from([0x1b, 0x45, 0x00]));
  if (payload.paymentMethodLabel)
    push(`Pagamento: ${payload.paymentMethodLabel}\n`);
  if (payload.paymentStatusLabel)
    push(`Status: ${payload.paymentStatusLabel}\n`);
  push(line());
  push(Buffer.from([0x1b, 0x64, 0x05]));
  push(Buffer.from([0x1d, 0x56, 0x42, 0x00]));

  return Buffer.concat(chunks);
}
