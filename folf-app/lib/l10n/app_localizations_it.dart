// ignore: unused_import
import 'package:intl/intl.dart' as intl;
import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for Italian (`it`).
class AppLocalizationsIt extends AppLocalizations {
  AppLocalizationsIt([String locale = 'it']) : super(locale);

  @override
  String get appName => 'Golf Sport Bar';

  @override
  String get tagline => 'Golf indoor · Gastronomia · Drink';

  @override
  String get tabHome => 'Inizio';

  @override
  String get tabMap => 'Mappa';

  @override
  String get tabQr => 'QR';

  @override
  String get tabReserve => 'Prenota';

  @override
  String get tabOrder => 'Ordine';

  @override
  String get language => 'Lingua';

  @override
  String get themeLight => 'Chiaro';

  @override
  String get themeDark => 'Scuro';

  @override
  String get themeToggle => 'Cambia tema';

  @override
  String get retry => 'Riprova';

  @override
  String get cancel => 'Annulla';

  @override
  String get confirm => 'Conferma';

  @override
  String get save => 'Salva';

  @override
  String get next => 'Continua';

  @override
  String get back => 'Indietro';

  @override
  String get close => 'Chiudi';

  @override
  String get loading => 'Caricamento…';

  @override
  String get errorGeneric => 'Qualcosa è andato storto. Riprova.';

  @override
  String get howToGetThere => 'Come arrivare';

  @override
  String get logout => 'Esci';

  @override
  String get loginTitle => 'Bentornato';

  @override
  String get loginSubtitle =>
      'Accedi con e-mail o CPF per giocare, prenotare e ordinare al tavolo.';

  @override
  String get identifier => 'E-mail o CPF';

  @override
  String get password => 'Password';

  @override
  String get loginCta => 'Accedi';

  @override
  String get noAccount => 'Non hai ancora un account?';

  @override
  String get registerCta => 'Crea account';

  @override
  String get registerTitle => 'Crea account';

  @override
  String get stepIdentity => 'Tu';

  @override
  String get stepContact => 'Contatto';

  @override
  String get stepAddress => 'Indirizzo';

  @override
  String get fullName => 'Nome completo';

  @override
  String get cpf => 'CPF';

  @override
  String get email => 'E-mail';

  @override
  String get phone => 'Cellulare';

  @override
  String get birthDate => 'Data di nascita';

  @override
  String get postalCode => 'CAP';

  @override
  String get street => 'Via';

  @override
  String get streetNumber => 'Numero';

  @override
  String get complement => 'Interno';

  @override
  String get district => 'Quartiere';

  @override
  String get city => 'Città';

  @override
  String get state => 'Stato';

  @override
  String get addressOptional => 'Indirizzo (opzionale)';

  @override
  String get lgpdLabel =>
      'Ho letto e accetto il trattamento dei miei dati (LGPD).';

  @override
  String get haveAccount => 'Hai già un account? Accedi';

  @override
  String greeting(String name) {
    return 'Ciao, $name';
  }

  @override
  String get greetingGuest => 'Ciao';

  @override
  String get headline => 'Golf indoor, tavolo e menu in un unico posto.';

  @override
  String get subhead =>
      'Prenota la bay, ordina al tavolo e segui tutto in tempo reale.';

  @override
  String get featuredVenue => 'Dove sei';

  @override
  String get simulator => 'Simulatore';

  @override
  String get menuFeatured => 'In evidenza';

  @override
  String get seeFullMenu => 'Vedi il menu completo';

  @override
  String get experienceTitle => 'L\'esperienza';

  @override
  String get upcomingReservation => 'Prossima prenotazione';

  @override
  String get activeOrder => 'Ordine in corso';

  @override
  String get ctaReserve => 'Prenota orario';

  @override
  String get ctaOrder => 'Ordina al tavolo';

  @override
  String get instagram => 'Instagram';

  @override
  String get followInstagram => 'Segui su Instagram';

  @override
  String get slideBayTitle => 'Bay private';

  @override
  String get slideBayCopy =>
      'Allenamento o partita, per te, amici o gruppi — tutto l\'anno.';

  @override
  String get slideTechTitle => 'Simulatore di precisione';

  @override
  String get slideTechCopy =>
      'Fisica realistica e dati in tempo reale, con migliaia di campi.';

  @override
  String get slideNightTitle => 'Gastronomia e drink';

  @override
  String get slideNightCopy =>
      'Il menu e il bar accompagnano il gioco — dalla partita all\'after.';

  @override
  String get mapTitle => 'Dove siamo';

  @override
  String get selectVenue => 'Scegli questa sede';

  @override
  String get reserveHere => 'Prenota qui';

  @override
  String get orderHere => 'Ordina qui';

  @override
  String get noVenues => 'Nessuna sede sulla mappa.';

  @override
  String get qrInstruction =>
      'Inquadra il QR del tavolo, della prenotazione o di un link.';

  @override
  String get qrTorch => 'Torcia';

  @override
  String get qrScanned => 'QR letto';

  @override
  String get qrOpenUrl => 'Apri link';

  @override
  String get qrGoTable => 'Ordina a questo tavolo';

  @override
  String get qrGoReservation => 'Vedi prenotazione';

  @override
  String get qrUnknown => 'Non riconosciamo questo codice.';

  @override
  String get reservationTitle => 'Prenotazioni';

  @override
  String get bayAvailabilityTitle => 'Disponibilità bay';

  @override
  String get viewAllBays => 'Scegli una bay da prenotare';

  @override
  String get bayAvailableNow => 'Disponibile ora';

  @override
  String get bayBusyNow => 'Occupata';

  @override
  String get bayNoSlotsToday => 'Nessun orario oggi';

  @override
  String bayNextSlot(String time) {
    return 'Prossimo orario: $time';
  }

  @override
  String get reserveThisBay => 'Prenota questa bay';

  @override
  String get newReservation => 'Nuova';

  @override
  String get myReservations => 'Mie';

  @override
  String get pickDay => 'Giorno';

  @override
  String get pickBay => 'Bay';

  @override
  String get duration => 'Durata';

  @override
  String minutes(int count) {
    return '$count min';
  }

  @override
  String get notes => 'Note';

  @override
  String get confirmBooking => 'Conferma prenotazione';

  @override
  String get companions => 'Accompagnatori';

  @override
  String companionsCount(int count) {
    return '$count accompagnatori';
  }

  @override
  String pricingPreview(int party, String unit, String hours, String total) {
    return '$party × $unit/h × $hours h = $total';
  }

  @override
  String totalCostLabel(String value) {
    return 'Totale: $value';
  }

  @override
  String get noSlots => 'Nessun orario libero in questo giorno.';

  @override
  String get emptyReservations => 'Non hai ancora prenotazioni.';

  @override
  String get cancelReservation => 'Annulla prenotazione';

  @override
  String get statusPending => 'In attesa';

  @override
  String get statusConfirmed => 'Confermata';

  @override
  String get statusCheckedIn => 'Check-in';

  @override
  String get statusCompleted => 'Completata';

  @override
  String get statusCancelled => 'Annullata';

  @override
  String get statusNoShow => 'Assente';

  @override
  String get orderTitle => 'Ordina al tavolo';

  @override
  String get needTable => 'Inquadra il QR del tavolo per iniziare.';

  @override
  String get scanTable => 'Scansiona tavolo';

  @override
  String get typeTable => 'Inserisci tavolo';

  @override
  String get tableHint => 'Es.: Tavolo 4';

  @override
  String tableActive(String label) {
    return 'Tavolo $label';
  }

  @override
  String get cart => 'Carrello';

  @override
  String get add => 'Aggiungi';

  @override
  String get placeOrder => 'Invia ordine';

  @override
  String get myOrders => 'I miei ordini';

  @override
  String get emptyCart => 'Il carrello è vuoto.';

  @override
  String get emptyOrders => 'Nessun ordine ancora.';

  @override
  String get emptyMenu => 'Menu non disponibile.';

  @override
  String get itemNotes => 'Note dell\'articolo';

  @override
  String get orderOpen => 'Aperto';

  @override
  String get orderInProgress => 'In cucina';

  @override
  String get orderCompleted => 'Servito';

  @override
  String get orderCancelled => 'Annullato';

  @override
  String get itemPending => 'In coda';

  @override
  String get itemPreparing => 'In preparazione';

  @override
  String get itemServed => 'Servito';

  @override
  String get changeTable => 'Cambia tavolo';

  @override
  String get seeAllOrders => 'Vedi tutti';

  @override
  String get orderHistoryTitle => 'I miei ordini';

  @override
  String get orderDraft => 'Bozza';

  @override
  String get orderReady => 'Il tuo ordine è pronto';

  @override
  String get notifications => 'Notifiche';

  @override
  String get noNotifications => 'Nessuna notifica per ora.';

  @override
  String get accountMenu => 'Account';

  @override
  String orderAtTable(String label) {
    return 'Tavolo $label';
  }
}
