import type { StoreLocation } from '@/domain/store/StoreLocation'

export const storeCatalog: readonly StoreLocation[] = [
  {
    id: 'bc-centro',
    nameKey: 'locations.bcCentro.name',
    address: 'R. 3600, N205',
    district: 'Centro',
    postalCode: '88330-248',
    city: 'Balneário Camboriú',
    state: 'SC',
    country: 'Brasil',
    // Coordenadas exactas proporcionadas para R. 3600, N205
    lat: -27.001654891900937,
    lng: -48.622958970800916,
  },
] as const
