export type TicketLine = {
  quantity: number;
  name: string;
  notes?: string | null;
};

export type TicketPayload = {
  businessName: string;
  stationLabel: string;
  tableLabel?: string | null;
  notes?: string | null;
  createdAtLabel: string;
  lines: TicketLine[];
  isTest?: boolean;
};

function encodeText(text: string): Buffer {
  return Buffer.from(
    text.normalize('NFD').replace(/\p{Diacritic}/gu, '').replace(/[^\x20-\x7E\n]/g, '?'),
    'ascii',
  );
}

export function renderEscPosTicket(payload: TicketPayload, paperWidth = 80): Buffer {
  const cols = paperWidth <= 58 ? 32 : 48;
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
  push(center(payload.businessName));
  push(center(payload.stationLabel));
  if (payload.isTest) push(center('TEST PRINT'));
  push(Buffer.from([0x1b, 0x45, 0x00]));
  push(Buffer.from([0x1b, 0x61, 0x00]));
  push(line());
  push(`Mesa: ${payload.tableLabel?.trim() || '-'}\n`);
  push(`${payload.createdAtLabel}\n`);
  push(line());
  for (const item of payload.lines) {
    push(`${item.quantity}x ${item.name}\n`);
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
