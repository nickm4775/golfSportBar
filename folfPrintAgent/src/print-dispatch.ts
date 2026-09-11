import type { LocalPrinter } from './store';
import { printRawTcp } from './network-print';
import { printUsb } from './usb-print';
import { printBluetooth } from './bluetooth-print';

export async function printEscPos(printer: LocalPrinter, data: Buffer): Promise<void> {
  switch (printer.connectionType) {
    case 'network':
      await printRawTcp(printer.address, data);
      return;
    case 'usb':
      await printUsb(printer.address, data);
      return;
    case 'bluetooth':
      await printBluetooth(printer.address, data);
      return;
    default:
      throw new Error(`Tipo de conexión no soportado: ${String(printer.connectionType)}`);
  }
}
