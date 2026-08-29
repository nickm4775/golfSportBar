// ignore: unused_import
import 'package:intl/intl.dart' as intl;
import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for English (`en`).
class AppLocalizationsEn extends AppLocalizations {
  AppLocalizationsEn([String locale = 'en']) : super(locale);

  @override
  String get appName => 'Golf Sport Bar';

  @override
  String get tagline => 'Indoor golf · Food · Drinks';

  @override
  String get tabHome => 'Home';

  @override
  String get tabMap => 'Map';

  @override
  String get tabQr => 'QR';

  @override
  String get tabReserve => 'Booking';

  @override
  String get tabOrder => 'Order';

  @override
  String get language => 'Language';

  @override
  String get themeLight => 'Light';

  @override
  String get themeDark => 'Dark';

  @override
  String get themeToggle => 'Toggle theme';

  @override
  String get retry => 'Try again';

  @override
  String get cancel => 'Cancel';

  @override
  String get confirm => 'Confirm';

  @override
  String get save => 'Save';

  @override
  String get next => 'Continue';

  @override
  String get back => 'Back';

  @override
  String get close => 'Close';

  @override
  String get loading => 'Loading…';

  @override
  String get errorGeneric => 'Something went wrong. Please try again.';

  @override
  String get howToGetThere => 'Get directions';

  @override
  String get logout => 'Log out';

  @override
  String get loginTitle => 'Welcome back';

  @override
  String get loginSubtitle =>
      'Sign in with email or CPF to play, book a bay, and order to your table.';

  @override
  String get identifier => 'Email or CPF';

  @override
  String get password => 'Password';

  @override
  String get loginCta => 'Sign in';

  @override
  String get noAccount => 'Don\'t have an account yet?';

  @override
  String get registerCta => 'Create account';

  @override
  String get registerTitle => 'Create account';

  @override
  String get stepIdentity => 'You';

  @override
  String get stepContact => 'Contact';

  @override
  String get stepAddress => 'Address';

  @override
  String get fullName => 'Full name';

  @override
  String get cpf => 'CPF';

  @override
  String get email => 'Email';

  @override
  String get phone => 'Mobile';

  @override
  String get birthDate => 'Date of birth';

  @override
  String get postalCode => 'Postal code';

  @override
  String get street => 'Street';

  @override
  String get streetNumber => 'Number';

  @override
  String get complement => 'Complement';

  @override
  String get district => 'District';

  @override
  String get city => 'City';

  @override
  String get state => 'State';

  @override
  String get addressOptional => 'Address (optional)';

  @override
  String get lgpdLabel =>
      'I have read and accept the processing of my data (LGPD).';

  @override
  String get haveAccount => 'Already have an account? Sign in';

  @override
  String greeting(String name) {
    return 'Hi, $name';
  }

  @override
  String get greetingGuest => 'Hello';

  @override
  String get headline =>
      'Indoor golf, your table, and the menu — in one place.';

  @override
  String get subhead =>
      'Book a bay, order to the table, and follow everything in real time.';

  @override
  String get featuredVenue => 'You\'re here';

  @override
  String get simulator => 'Simulator';

  @override
  String get menuFeatured => 'Menu highlights';

  @override
  String get seeFullMenu => 'See full menu';

  @override
  String get experienceTitle => 'The experience';

  @override
  String get upcomingReservation => 'Upcoming booking';

  @override
  String get activeOrder => 'Order in progress';

  @override
  String get ctaReserve => 'Book a time';

  @override
  String get ctaOrder => 'Order to table';

  @override
  String get instagram => 'Instagram';

  @override
  String get followInstagram => 'Follow on Instagram';

  @override
  String get slideBayTitle => 'Private bays';

  @override
  String get slideBayCopy =>
      'Practice or a full round — for you, friends, or groups, year-round.';

  @override
  String get slideTechTitle => 'Precision simulator';

  @override
  String get slideTechCopy =>
      'Realistic physics and live data, with thousands of courses.';

  @override
  String get slideNightTitle => 'Food and drinks';

  @override
  String get slideNightCopy =>
      'The kitchen and bar stay with the game — from the round to after.';

  @override
  String get mapTitle => 'Find us';

  @override
  String get selectVenue => 'Choose this venue';

  @override
  String get reserveHere => 'Book here';

  @override
  String get orderHere => 'Order here';

  @override
  String get noVenues => 'No venues on the map yet.';

  @override
  String get qrInstruction => 'Point at a table QR, a booking QR, or a link.';

  @override
  String get qrTorch => 'Torch';

  @override
  String get qrScanned => 'QR scanned';

  @override
  String get qrOpenUrl => 'Open link';

  @override
  String get qrGoTable => 'Order to this table';

  @override
  String get qrGoReservation => 'View booking';

  @override
  String get qrUnknown => 'We don\'t recognize this code.';

  @override
  String get reservationTitle => 'Bookings';

  @override
  String get bayAvailabilityTitle => 'Bay availability';

  @override
  String bayCount(int count) {
    return '$count bays';
  }

  @override
  String baysAvailableNowSummary(int available, int total) {
    return '$available of $total available now';
  }

  @override
  String get viewAllBays => 'Pick a bay to book';

  @override
  String get bayAvailableNow => 'Available now';

  @override
  String get bayBusyNow => 'Busy';

  @override
  String get bayNoSlotsToday => 'No slots today';

  @override
  String bayNextSlot(String time) {
    return 'Next slot: $time';
  }

  @override
  String get reserveThisBay => 'Book this bay';

  @override
  String get newReservation => 'New';

  @override
  String get myReservations => 'Mine';

  @override
  String get pickDay => 'Day';

  @override
  String get pickBay => 'Bay';

  @override
  String get duration => 'Duration';

  @override
  String minutes(int count) {
    return '$count min';
  }

  @override
  String get notes => 'Notes';

  @override
  String get confirmBooking => 'Confirm booking';

  @override
  String get noSlots => 'No free slots on this day.';

  @override
  String get emptyReservations => 'You don\'t have any bookings yet.';

  @override
  String get cancelReservation => 'Cancel booking';

  @override
  String get statusPending => 'Pending';

  @override
  String get statusConfirmed => 'Confirmed';

  @override
  String get statusCheckedIn => 'Checked in';

  @override
  String get statusCompleted => 'Completed';

  @override
  String get statusCancelled => 'Cancelled';

  @override
  String get statusNoShow => 'No-show';

  @override
  String get orderTitle => 'Order to table';

  @override
  String get needTable => 'Scan the table QR to get started.';

  @override
  String get scanTable => 'Scan table';

  @override
  String get typeTable => 'Enter table';

  @override
  String get tableHint => 'e.g. Table 4';

  @override
  String tableActive(String label) {
    return 'Table $label';
  }

  @override
  String get cart => 'Cart';

  @override
  String get add => 'Add';

  @override
  String get placeOrder => 'Place order';

  @override
  String get myOrders => 'My orders';

  @override
  String get emptyCart => 'Your cart is empty.';

  @override
  String get emptyOrders => 'No orders yet.';

  @override
  String get emptyMenu => 'Menu unavailable.';

  @override
  String get itemNotes => 'Item notes';

  @override
  String get orderOpen => 'Open';

  @override
  String get orderInProgress => 'In the kitchen';

  @override
  String get orderCompleted => 'Served';

  @override
  String get orderCancelled => 'Cancelled';

  @override
  String get itemPending => 'Queued';

  @override
  String get itemPreparing => 'Preparing';

  @override
  String get itemServed => 'Served';

  @override
  String get changeTable => 'Change table';

  @override
  String get seeAllOrders => 'See all';

  @override
  String get orderHistoryTitle => 'My orders';

  @override
  String get orderDraft => 'Draft';

  @override
  String get orderReady => 'Your order is ready';

  @override
  String get notifications => 'Notifications';

  @override
  String get noNotifications => 'No notifications yet.';

  @override
  String get accountMenu => 'Account';

  @override
  String orderAtTable(String label) {
    return 'Table $label';
  }
}
