// ignore: unused_import
import 'package:intl/intl.dart' as intl;
import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for Spanish Castilian (`es`).
class AppLocalizationsEs extends AppLocalizations {
  AppLocalizationsEs([String locale = 'es']) : super(locale);

  @override
  String get appName => 'Golf Sport Bar';

  @override
  String get tagline => 'Golf indoor · Gastronomía · Drinks';

  @override
  String get tabHome => 'Inicio';

  @override
  String get tabMap => 'Mapa';

  @override
  String get tabQr => 'QR';

  @override
  String get tabReserve => 'Reserva';

  @override
  String get tabOrder => 'Pedido';

  @override
  String get language => 'Idioma';

  @override
  String get themeLight => 'Claro';

  @override
  String get themeDark => 'Oscuro';

  @override
  String get themeToggle => 'Cambiar tema';

  @override
  String get retry => 'Reintentar';

  @override
  String get cancel => 'Cancelar';

  @override
  String get confirm => 'Confirmar';

  @override
  String get save => 'Guardar';

  @override
  String get next => 'Continuar';

  @override
  String get back => 'Volver';

  @override
  String get close => 'Cerrar';

  @override
  String get loading => 'Cargando…';

  @override
  String get errorGeneric => 'Algo salió mal. Inténtalo de nuevo.';

  @override
  String get howToGetThere => 'Cómo llegar';

  @override
  String get logout => 'Salir';

  @override
  String get loginTitle => 'Bienvenido de nuevo';

  @override
  String get loginSubtitle =>
      'Entra con email o CPF para jugar, reservar y pedir a la mesa.';

  @override
  String get identifier => 'Email o CPF';

  @override
  String get password => 'Contraseña';

  @override
  String get loginCta => 'Entrar';

  @override
  String get noAccount => '¿Aún no tienes cuenta?';

  @override
  String get registerCta => 'Crear cuenta';

  @override
  String get registerTitle => 'Crear cuenta';

  @override
  String get stepIdentity => 'Tú';

  @override
  String get stepContact => 'Contacto';

  @override
  String get stepAddress => 'Dirección';

  @override
  String get fullName => 'Nombre completo';

  @override
  String get cpf => 'CPF';

  @override
  String get email => 'Email';

  @override
  String get phone => 'Celular';

  @override
  String get birthDate => 'Fecha de nacimiento';

  @override
  String get postalCode => 'CEP';

  @override
  String get street => 'Calle';

  @override
  String get streetNumber => 'Número';

  @override
  String get complement => 'Complemento';

  @override
  String get district => 'Barrio';

  @override
  String get city => 'Ciudad';

  @override
  String get state => 'UF';

  @override
  String get addressOptional => 'Dirección (opcional)';

  @override
  String get lgpdLabel =>
      'He leído y acepto el tratamiento de mis datos (LGPD).';

  @override
  String get haveAccount => '¿Ya tienes cuenta? Entrar';

  @override
  String greeting(String name) {
    return 'Hola, $name';
  }

  @override
  String get greetingGuest => 'Hola';

  @override
  String get headline => 'Golf indoor, mesa y carta en un solo lugar.';

  @override
  String get subhead =>
      'Reserva tu bay, pide a la mesa y sigue todo en tiempo real.';

  @override
  String get featuredVenue => 'Dónde estás';

  @override
  String get simulator => 'Simulador';

  @override
  String get menuFeatured => 'Destacados de la carta';

  @override
  String get seeFullMenu => 'Ver carta completa';

  @override
  String get experienceTitle => 'La experiencia';

  @override
  String get upcomingReservation => 'Próxima reserva';

  @override
  String get activeOrder => 'Pedido en curso';

  @override
  String get ctaReserve => 'Reservar horario';

  @override
  String get ctaOrder => 'Pedir a la mesa';

  @override
  String get instagram => 'Instagram';

  @override
  String get followInstagram => 'Seguir en Instagram';

  @override
  String get slideBayTitle => 'Bays privadas';

  @override
  String get slideBayCopy =>
      'Entrenamiento o partida, para ti, amigos o grupos — todo el año.';

  @override
  String get slideTechTitle => 'Simulador de precisión';

  @override
  String get slideTechCopy =>
      'Física realista y datos en tiempo real, con miles de campos.';

  @override
  String get slideNightTitle => 'Gastronomía y copas';

  @override
  String get slideNightCopy =>
      'La carta y el bar acompañan el juego — de la partida al after.';

  @override
  String get mapTitle => 'Dónde estamos';

  @override
  String get selectVenue => 'Elegir esta casa';

  @override
  String get reserveHere => 'Reservar aquí';

  @override
  String get orderHere => 'Pedir aquí';

  @override
  String get noVenues => 'Todavía no hay locales en el mapa.';

  @override
  String get qrInstruction =>
      'Apunta al QR de la mesa, de la reserva o de un enlace.';

  @override
  String get qrTorch => 'Linterna';

  @override
  String get qrScanned => 'QR leído';

  @override
  String get qrOpenUrl => 'Abrir enlace';

  @override
  String get qrGoTable => 'Pedir en esta mesa';

  @override
  String get qrGoReservation => 'Ver reserva';

  @override
  String get qrUnknown => 'No reconocemos este código.';

  @override
  String get reservationTitle => 'Reservas';

  @override
  String get bayAvailabilityTitle => 'Disponibilidad de bays';

  @override
  String get viewAllBays => 'Elige una bay para reservar';

  @override
  String get bayAvailableNow => 'Disponible ahora';

  @override
  String get bayBusyNow => 'Ocupada';

  @override
  String get bayNoSlotsToday => 'Sin huecos hoy';

  @override
  String get bayAvailable => 'Disponible';

  @override
  String get bayOccupied => 'Ocupado';

  @override
  String bayNextSlot(String time) {
    return 'Próximo hueco: $time';
  }

  @override
  String get reserveThisBay => 'Reservar esta bay';

  @override
  String get newReservation => 'Nueva';

  @override
  String get myReservations => 'Mías';

  @override
  String get pickDay => 'Día';

  @override
  String get pickBay => 'Bay';

  @override
  String get duration => 'Duración';

  @override
  String minutes(int count) {
    return '$count min';
  }

  @override
  String hours(int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: '$count horas',
      one: '1 hora',
    );
    return '$_temp0';
  }

  @override
  String durationHoursHint(int max) {
    return 'Máximo $max horas';
  }

  @override
  String get estimatedTotal => 'Total estimado';

  @override
  String reservationSummary(int party, String duration) {
    return '$party jugadores · $duration';
  }

  @override
  String get pickStartTime => 'Hora de inicio';

  @override
  String get timePeriodMorning => 'Mañana';

  @override
  String get timePeriodAfternoon => 'Tarde';

  @override
  String get timePeriodEvening => 'Noche';

  @override
  String get selectedTimeSlotLabel => 'Horario seleccionado';

  @override
  String timeSlotRange(String start, String end) {
    return '$start – $end';
  }

  @override
  String get noSlotsInPeriod => 'Sin horarios en esta franja.';

  @override
  String get notes => 'Notas';

  @override
  String get confirmBooking => 'Confirmar reserva';

  @override
  String get companions => 'Acompañantes';

  @override
  String companionsCount(int count) {
    return '$count acompañantes';
  }

  @override
  String pricingPreview(int party, String unit, String hours, String total) {
    return '$party × $unit/h × $hours h = $total';
  }

  @override
  String totalCostLabel(String value) {
    return 'Total: $value';
  }

  @override
  String get noSlots => 'No hay horarios libres este día.';

  @override
  String get emptyReservations => 'Aún no tienes reservas.';

  @override
  String get cancelReservation => 'Cancelar reserva';

  @override
  String get statusPending => 'Pendiente';

  @override
  String get statusConfirmed => 'Confirmada';

  @override
  String get statusCheckedIn => 'Check-in';

  @override
  String get statusCompleted => 'Completada';

  @override
  String get statusCancelled => 'Cancelada';

  @override
  String get statusNoShow => 'No se presentó';

  @override
  String get orderTitle => 'Pedir a la mesa';

  @override
  String get needTable => 'Escanea el QR de la mesa para empezar.';

  @override
  String get scanTable => 'Escanear mesa';

  @override
  String get typeTable => 'Indicar mesa';

  @override
  String get tableHint => 'Ej.: Mesa 4';

  @override
  String tableActive(String label) {
    return 'Mesa $label';
  }

  @override
  String get cart => 'Carrito';

  @override
  String get add => 'Añadir';

  @override
  String get placeOrder => 'Enviar pedido';

  @override
  String get myOrders => 'Mis pedidos';

  @override
  String get emptyCart => 'Tu carrito está vacío.';

  @override
  String get emptyOrders => 'Todavía no hay pedidos.';

  @override
  String get emptyMenu => 'Carta no disponible.';

  @override
  String get itemNotes => 'Notas del ítem';

  @override
  String get orderOpen => 'Abierto';

  @override
  String get orderInProgress => 'En preparación';

  @override
  String get orderCompleted => 'Entregado';

  @override
  String get orderCancelled => 'Cancelado';

  @override
  String get itemPending => 'En cola';

  @override
  String get itemPreparing => 'Preparando';

  @override
  String get itemServed => 'Servido';

  @override
  String get changeTable => 'Cambiar mesa';

  @override
  String get seeAllOrders => 'Ver todos';

  @override
  String get orderHistoryTitle => 'Mis pedidos';

  @override
  String get orderDraft => 'Borrador';

  @override
  String get orderReady => 'Tu pedido está listo';

  @override
  String get notifications => 'Notificaciones';

  @override
  String get noNotifications => 'Todavía no hay notificaciones.';

  @override
  String get accountMenu => 'Cuenta';

  @override
  String orderAtTable(String label) {
    return 'Mesa $label';
  }
}
