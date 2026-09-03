import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:intl/intl.dart' as intl;

import 'app_localizations_en.dart';
import 'app_localizations_es.dart';
import 'app_localizations_it.dart';
import 'app_localizations_pt.dart';
import 'app_localizations_zh.dart';

// ignore_for_file: type=lint

/// Callers can lookup localized strings with an instance of AppLocalizations
/// returned by `AppLocalizations.of(context)`.
///
/// Applications need to include `AppLocalizations.delegate()` in their app's
/// `localizationDelegates` list, and the locales they support in the app's
/// `supportedLocales` list. For example:
///
/// ```dart
/// import 'l10n/app_localizations.dart';
///
/// return MaterialApp(
///   localizationsDelegates: AppLocalizations.localizationsDelegates,
///   supportedLocales: AppLocalizations.supportedLocales,
///   home: MyApplicationHome(),
/// );
/// ```
///
/// ## Update pubspec.yaml
///
/// Please make sure to update your pubspec.yaml to include the following
/// packages:
///
/// ```yaml
/// dependencies:
///   # Internationalization support.
///   flutter_localizations:
///     sdk: flutter
///   intl: any # Use the pinned version from flutter_localizations
///
///   # Rest of dependencies
/// ```
///
/// ## iOS Applications
///
/// iOS applications define key application metadata, including supported
/// locales, in an Info.plist file that is built into the application bundle.
/// To configure the locales supported by your app, you’ll need to edit this
/// file.
///
/// First, open your project’s ios/Runner.xcworkspace Xcode workspace file.
/// Then, in the Project Navigator, open the Info.plist file under the Runner
/// project’s Runner folder.
///
/// Next, select the Information Property List item, select Add Item from the
/// Editor menu, then select Localizations from the pop-up menu.
///
/// Select and expand the newly-created Localizations item then, for each
/// locale your application supports, add a new item and select the locale
/// you wish to add from the pop-up menu in the Value field. This list should
/// be consistent with the languages listed in the AppLocalizations.supportedLocales
/// property.
abstract class AppLocalizations {
  AppLocalizations(String locale)
    : localeName = intl.Intl.canonicalizedLocale(locale.toString());

  final String localeName;

  static AppLocalizations of(BuildContext context) {
    return Localizations.of<AppLocalizations>(context, AppLocalizations)!;
  }

  static const LocalizationsDelegate<AppLocalizations> delegate =
      _AppLocalizationsDelegate();

  /// A list of this localizations delegate along with the default localizations
  /// delegates.
  ///
  /// Returns a list of localizations delegates containing this delegate along with
  /// GlobalMaterialLocalizations.delegate, GlobalCupertinoLocalizations.delegate,
  /// and GlobalWidgetsLocalizations.delegate.
  ///
  /// Additional delegates can be added by appending to this list in
  /// MaterialApp. This list does not have to be used at all if a custom list
  /// of delegates is preferred or required.
  static const List<LocalizationsDelegate<dynamic>> localizationsDelegates =
      <LocalizationsDelegate<dynamic>>[
        delegate,
        GlobalMaterialLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
      ];

  /// A list of this localizations delegate's supported locales.
  static const List<Locale> supportedLocales = <Locale>[
    Locale('en'),
    Locale('es'),
    Locale('it'),
    Locale('pt'),
    Locale('zh'),
  ];

  /// No description provided for @appName.
  ///
  /// In pt, this message translates to:
  /// **'Golf Sport Bar'**
  String get appName;

  /// No description provided for @tagline.
  ///
  /// In pt, this message translates to:
  /// **'Golf indoor · Gastronomia · Drinks'**
  String get tagline;

  /// No description provided for @tabHome.
  ///
  /// In pt, this message translates to:
  /// **'Início'**
  String get tabHome;

  /// No description provided for @tabMap.
  ///
  /// In pt, this message translates to:
  /// **'Mapa'**
  String get tabMap;

  /// No description provided for @tabQr.
  ///
  /// In pt, this message translates to:
  /// **'QR'**
  String get tabQr;

  /// No description provided for @tabReserve.
  ///
  /// In pt, this message translates to:
  /// **'Reserva'**
  String get tabReserve;

  /// No description provided for @tabOrder.
  ///
  /// In pt, this message translates to:
  /// **'Pedido'**
  String get tabOrder;

  /// No description provided for @language.
  ///
  /// In pt, this message translates to:
  /// **'Idioma'**
  String get language;

  /// No description provided for @themeLight.
  ///
  /// In pt, this message translates to:
  /// **'Claro'**
  String get themeLight;

  /// No description provided for @themeDark.
  ///
  /// In pt, this message translates to:
  /// **'Escuro'**
  String get themeDark;

  /// No description provided for @themeToggle.
  ///
  /// In pt, this message translates to:
  /// **'Alternar tema'**
  String get themeToggle;

  /// No description provided for @retry.
  ///
  /// In pt, this message translates to:
  /// **'Tentar de novo'**
  String get retry;

  /// No description provided for @cancel.
  ///
  /// In pt, this message translates to:
  /// **'Cancelar'**
  String get cancel;

  /// No description provided for @confirm.
  ///
  /// In pt, this message translates to:
  /// **'Confirmar'**
  String get confirm;

  /// No description provided for @save.
  ///
  /// In pt, this message translates to:
  /// **'Salvar'**
  String get save;

  /// No description provided for @next.
  ///
  /// In pt, this message translates to:
  /// **'Continuar'**
  String get next;

  /// No description provided for @back.
  ///
  /// In pt, this message translates to:
  /// **'Voltar'**
  String get back;

  /// No description provided for @close.
  ///
  /// In pt, this message translates to:
  /// **'Fechar'**
  String get close;

  /// No description provided for @loading.
  ///
  /// In pt, this message translates to:
  /// **'Carregando…'**
  String get loading;

  /// No description provided for @errorGeneric.
  ///
  /// In pt, this message translates to:
  /// **'Algo deu errado. Tente novamente.'**
  String get errorGeneric;

  /// No description provided for @howToGetThere.
  ///
  /// In pt, this message translates to:
  /// **'Como chegar'**
  String get howToGetThere;

  /// No description provided for @logout.
  ///
  /// In pt, this message translates to:
  /// **'Sair'**
  String get logout;

  /// No description provided for @loginTitle.
  ///
  /// In pt, this message translates to:
  /// **'Bem-vindo de volta'**
  String get loginTitle;

  /// No description provided for @loginSubtitle.
  ///
  /// In pt, this message translates to:
  /// **'Entre com e-mail ou CPF para jogar, reservar e pedir à mesa.'**
  String get loginSubtitle;

  /// No description provided for @identifier.
  ///
  /// In pt, this message translates to:
  /// **'E-mail ou CPF'**
  String get identifier;

  /// No description provided for @password.
  ///
  /// In pt, this message translates to:
  /// **'Senha'**
  String get password;

  /// No description provided for @loginCta.
  ///
  /// In pt, this message translates to:
  /// **'Entrar'**
  String get loginCta;

  /// No description provided for @noAccount.
  ///
  /// In pt, this message translates to:
  /// **'Ainda não tem conta?'**
  String get noAccount;

  /// No description provided for @registerCta.
  ///
  /// In pt, this message translates to:
  /// **'Criar conta'**
  String get registerCta;

  /// No description provided for @registerTitle.
  ///
  /// In pt, this message translates to:
  /// **'Criar conta'**
  String get registerTitle;

  /// No description provided for @stepIdentity.
  ///
  /// In pt, this message translates to:
  /// **'Você'**
  String get stepIdentity;

  /// No description provided for @stepContact.
  ///
  /// In pt, this message translates to:
  /// **'Contato'**
  String get stepContact;

  /// No description provided for @stepAddress.
  ///
  /// In pt, this message translates to:
  /// **'Endereço'**
  String get stepAddress;

  /// No description provided for @fullName.
  ///
  /// In pt, this message translates to:
  /// **'Nome completo'**
  String get fullName;

  /// No description provided for @cpf.
  ///
  /// In pt, this message translates to:
  /// **'CPF'**
  String get cpf;

  /// No description provided for @email.
  ///
  /// In pt, this message translates to:
  /// **'E-mail'**
  String get email;

  /// No description provided for @phone.
  ///
  /// In pt, this message translates to:
  /// **'Celular'**
  String get phone;

  /// No description provided for @birthDate.
  ///
  /// In pt, this message translates to:
  /// **'Data de nascimento'**
  String get birthDate;

  /// No description provided for @postalCode.
  ///
  /// In pt, this message translates to:
  /// **'CEP'**
  String get postalCode;

  /// No description provided for @street.
  ///
  /// In pt, this message translates to:
  /// **'Rua'**
  String get street;

  /// No description provided for @streetNumber.
  ///
  /// In pt, this message translates to:
  /// **'Número'**
  String get streetNumber;

  /// No description provided for @complement.
  ///
  /// In pt, this message translates to:
  /// **'Complemento'**
  String get complement;

  /// No description provided for @district.
  ///
  /// In pt, this message translates to:
  /// **'Bairro'**
  String get district;

  /// No description provided for @city.
  ///
  /// In pt, this message translates to:
  /// **'Cidade'**
  String get city;

  /// No description provided for @state.
  ///
  /// In pt, this message translates to:
  /// **'UF'**
  String get state;

  /// No description provided for @addressOptional.
  ///
  /// In pt, this message translates to:
  /// **'Endereço (opcional)'**
  String get addressOptional;

  /// No description provided for @lgpdLabel.
  ///
  /// In pt, this message translates to:
  /// **'Li e aceito o tratamento dos meus dados (LGPD).'**
  String get lgpdLabel;

  /// No description provided for @fieldRequired.
  ///
  /// In pt, this message translates to:
  /// **'Este campo é obrigatório.'**
  String get fieldRequired;

  /// No description provided for @invalidEmail.
  ///
  /// In pt, this message translates to:
  /// **'Informe um e-mail válido.'**
  String get invalidEmail;

  /// No description provided for @invalidCpf.
  ///
  /// In pt, this message translates to:
  /// **'Informe um CPF válido.'**
  String get invalidCpf;

  /// No description provided for @invalidPhone.
  ///
  /// In pt, this message translates to:
  /// **'Informe um celular brasileiro válido.'**
  String get invalidPhone;

  /// No description provided for @invalidBirthDate.
  ///
  /// In pt, this message translates to:
  /// **'Use o formato AAAA-MM-DD.'**
  String get invalidBirthDate;

  /// No description provided for @underage.
  ///
  /// In pt, this message translates to:
  /// **'É necessário ter pelo menos 18 anos.'**
  String get underage;

  /// No description provided for @passwordMinLength.
  ///
  /// In pt, this message translates to:
  /// **'A senha deve ter pelo menos 6 caracteres.'**
  String get passwordMinLength;

  /// No description provided for @fullNameMinLength.
  ///
  /// In pt, this message translates to:
  /// **'Informe seu nome completo.'**
  String get fullNameMinLength;

  /// No description provided for @lgpdRequired.
  ///
  /// In pt, this message translates to:
  /// **'Aceite o tratamento de dados para continuar.'**
  String get lgpdRequired;

  /// No description provided for @invalidState.
  ///
  /// In pt, this message translates to:
  /// **'Use no máximo 2 letras (UF).'**
  String get invalidState;

  /// No description provided for @haveAccount.
  ///
  /// In pt, this message translates to:
  /// **'Já tem conta? Entrar'**
  String get haveAccount;

  /// No description provided for @greeting.
  ///
  /// In pt, this message translates to:
  /// **'Olá, {name}'**
  String greeting(String name);

  /// No description provided for @greetingGuest.
  ///
  /// In pt, this message translates to:
  /// **'Olá'**
  String get greetingGuest;

  /// No description provided for @headline.
  ///
  /// In pt, this message translates to:
  /// **'Golf indoor, mesa e carta no mesmo lugar.'**
  String get headline;

  /// No description provided for @subhead.
  ///
  /// In pt, this message translates to:
  /// **'Reserve sua bay, peça à mesa e acompanhe tudo em tempo real.'**
  String get subhead;

  /// No description provided for @featuredVenue.
  ///
  /// In pt, this message translates to:
  /// **'Onde você está'**
  String get featuredVenue;

  /// No description provided for @simulator.
  ///
  /// In pt, this message translates to:
  /// **'Simulador'**
  String get simulator;

  /// No description provided for @menuFeatured.
  ///
  /// In pt, this message translates to:
  /// **'Destaques da carta'**
  String get menuFeatured;

  /// No description provided for @seeFullMenu.
  ///
  /// In pt, this message translates to:
  /// **'Ver carta completa'**
  String get seeFullMenu;

  /// No description provided for @experienceTitle.
  ///
  /// In pt, this message translates to:
  /// **'A experiência'**
  String get experienceTitle;

  /// No description provided for @upcomingReservation.
  ///
  /// In pt, this message translates to:
  /// **'Próxima reserva'**
  String get upcomingReservation;

  /// No description provided for @activeOrder.
  ///
  /// In pt, this message translates to:
  /// **'Pedido em andamento'**
  String get activeOrder;

  /// No description provided for @ctaReserve.
  ///
  /// In pt, this message translates to:
  /// **'Reservar horário'**
  String get ctaReserve;

  /// No description provided for @ctaOrder.
  ///
  /// In pt, this message translates to:
  /// **'Pedir à mesa'**
  String get ctaOrder;

  /// No description provided for @instagram.
  ///
  /// In pt, this message translates to:
  /// **'Instagram'**
  String get instagram;

  /// No description provided for @followInstagram.
  ///
  /// In pt, this message translates to:
  /// **'Seguir no Instagram'**
  String get followInstagram;

  /// No description provided for @slideBayTitle.
  ///
  /// In pt, this message translates to:
  /// **'Bays privativas'**
  String get slideBayTitle;

  /// No description provided for @slideBayCopy.
  ///
  /// In pt, this message translates to:
  /// **'Treino ou partida, para você, amigos ou grupos — o ano inteiro.'**
  String get slideBayCopy;

  /// No description provided for @slideTechTitle.
  ///
  /// In pt, this message translates to:
  /// **'Simulador de precisão'**
  String get slideTechTitle;

  /// No description provided for @slideTechCopy.
  ///
  /// In pt, this message translates to:
  /// **'Física realista e dados em tempo real, com milhares de campos.'**
  String get slideTechCopy;

  /// No description provided for @slideNightTitle.
  ///
  /// In pt, this message translates to:
  /// **'Gastronomia e drinks'**
  String get slideNightTitle;

  /// No description provided for @slideNightCopy.
  ///
  /// In pt, this message translates to:
  /// **'A carta e o bar acompanham o jogo — da partida ao after.'**
  String get slideNightCopy;

  /// No description provided for @mapTitle.
  ///
  /// In pt, this message translates to:
  /// **'Onde estamos'**
  String get mapTitle;

  /// No description provided for @selectVenue.
  ///
  /// In pt, this message translates to:
  /// **'Escolher esta casa'**
  String get selectVenue;

  /// No description provided for @reserveHere.
  ///
  /// In pt, this message translates to:
  /// **'Reservar aqui'**
  String get reserveHere;

  /// No description provided for @orderHere.
  ///
  /// In pt, this message translates to:
  /// **'Pedir aqui'**
  String get orderHere;

  /// No description provided for @noVenues.
  ///
  /// In pt, this message translates to:
  /// **'Nenhum local no mapa ainda.'**
  String get noVenues;

  /// No description provided for @qrInstruction.
  ///
  /// In pt, this message translates to:
  /// **'Aponte para o QR da mesa, da reserva ou de um link.'**
  String get qrInstruction;

  /// No description provided for @qrTorch.
  ///
  /// In pt, this message translates to:
  /// **'Lanterna'**
  String get qrTorch;

  /// No description provided for @qrScanned.
  ///
  /// In pt, this message translates to:
  /// **'QR lido'**
  String get qrScanned;

  /// No description provided for @qrOpenUrl.
  ///
  /// In pt, this message translates to:
  /// **'Abrir link'**
  String get qrOpenUrl;

  /// No description provided for @qrGoTable.
  ///
  /// In pt, this message translates to:
  /// **'Pedir nesta mesa'**
  String get qrGoTable;

  /// No description provided for @qrGoReservation.
  ///
  /// In pt, this message translates to:
  /// **'Ver reserva'**
  String get qrGoReservation;

  /// No description provided for @qrUnknown.
  ///
  /// In pt, this message translates to:
  /// **'Não reconhecemos este código.'**
  String get qrUnknown;

  /// No description provided for @reservationTitle.
  ///
  /// In pt, this message translates to:
  /// **'Reservas'**
  String get reservationTitle;

  /// No description provided for @bayAvailabilityTitle.
  ///
  /// In pt, this message translates to:
  /// **'Disponibilidade das bays'**
  String get bayAvailabilityTitle;

  /// No description provided for @viewAllBays.
  ///
  /// In pt, this message translates to:
  /// **'Escolha uma bay para reservar'**
  String get viewAllBays;

  /// No description provided for @bayAvailableNow.
  ///
  /// In pt, this message translates to:
  /// **'Disponível agora'**
  String get bayAvailableNow;

  /// No description provided for @bayBusyNow.
  ///
  /// In pt, this message translates to:
  /// **'Ocupada'**
  String get bayBusyNow;

  /// No description provided for @bayNoSlotsToday.
  ///
  /// In pt, this message translates to:
  /// **'Sem horários hoje'**
  String get bayNoSlotsToday;

  /// No description provided for @bayAvailable.
  ///
  /// In pt, this message translates to:
  /// **'Disponível'**
  String get bayAvailable;

  /// No description provided for @bayOccupied.
  ///
  /// In pt, this message translates to:
  /// **'Ocupado'**
  String get bayOccupied;

  /// No description provided for @bayNextSlot.
  ///
  /// In pt, this message translates to:
  /// **'Próximo horário: {time}'**
  String bayNextSlot(String time);

  /// No description provided for @reserveThisBay.
  ///
  /// In pt, this message translates to:
  /// **'Reservar esta bay'**
  String get reserveThisBay;

  /// No description provided for @newReservation.
  ///
  /// In pt, this message translates to:
  /// **'Nova'**
  String get newReservation;

  /// No description provided for @myReservations.
  ///
  /// In pt, this message translates to:
  /// **'Minhas'**
  String get myReservations;

  /// No description provided for @pickDay.
  ///
  /// In pt, this message translates to:
  /// **'Dia'**
  String get pickDay;

  /// No description provided for @pickBay.
  ///
  /// In pt, this message translates to:
  /// **'Bay'**
  String get pickBay;

  /// No description provided for @duration.
  ///
  /// In pt, this message translates to:
  /// **'Duração'**
  String get duration;

  /// No description provided for @minutes.
  ///
  /// In pt, this message translates to:
  /// **'{count} min'**
  String minutes(int count);

  /// No description provided for @hours.
  ///
  /// In pt, this message translates to:
  /// **'{count, plural, =1{1 hora}other{{count} horas}}'**
  String hours(int count);

  /// No description provided for @durationHoursHint.
  ///
  /// In pt, this message translates to:
  /// **'Até {max} horas'**
  String durationHoursHint(int max);

  /// No description provided for @estimatedTotal.
  ///
  /// In pt, this message translates to:
  /// **'Total estimado'**
  String get estimatedTotal;

  /// No description provided for @reservationSummary.
  ///
  /// In pt, this message translates to:
  /// **'{party} jogadores · {duration}'**
  String reservationSummary(int party, String duration);

  /// No description provided for @pickStartTime.
  ///
  /// In pt, this message translates to:
  /// **'Horário de início'**
  String get pickStartTime;

  /// No description provided for @timePeriodMorning.
  ///
  /// In pt, this message translates to:
  /// **'Manhã'**
  String get timePeriodMorning;

  /// No description provided for @timePeriodAfternoon.
  ///
  /// In pt, this message translates to:
  /// **'Tarde'**
  String get timePeriodAfternoon;

  /// No description provided for @timePeriodEvening.
  ///
  /// In pt, this message translates to:
  /// **'Noite'**
  String get timePeriodEvening;

  /// No description provided for @selectedTimeSlotLabel.
  ///
  /// In pt, this message translates to:
  /// **'Horário selecionado'**
  String get selectedTimeSlotLabel;

  /// No description provided for @timeSlotRange.
  ///
  /// In pt, this message translates to:
  /// **'{start} – {end}'**
  String timeSlotRange(String start, String end);

  /// No description provided for @noSlotsInPeriod.
  ///
  /// In pt, this message translates to:
  /// **'Sem horários neste período.'**
  String get noSlotsInPeriod;

  /// No description provided for @notes.
  ///
  /// In pt, this message translates to:
  /// **'Observações'**
  String get notes;

  /// No description provided for @confirmBooking.
  ///
  /// In pt, this message translates to:
  /// **'Confirmar reserva'**
  String get confirmBooking;

  /// No description provided for @companions.
  ///
  /// In pt, this message translates to:
  /// **'Acompanhantes'**
  String get companions;

  /// No description provided for @companionsCount.
  ///
  /// In pt, this message translates to:
  /// **'{count} acompanhantes'**
  String companionsCount(int count);

  /// No description provided for @pricingPreview.
  ///
  /// In pt, this message translates to:
  /// **'{party} × {unit}/h × {hours} h = {total}'**
  String pricingPreview(int party, String unit, String hours, String total);

  /// No description provided for @totalCostLabel.
  ///
  /// In pt, this message translates to:
  /// **'Total: {value}'**
  String totalCostLabel(String value);

  /// No description provided for @noSlots.
  ///
  /// In pt, this message translates to:
  /// **'Sem horários livres neste dia.'**
  String get noSlots;

  /// No description provided for @emptyReservations.
  ///
  /// In pt, this message translates to:
  /// **'Você ainda não tem reservas.'**
  String get emptyReservations;

  /// No description provided for @cancelReservation.
  ///
  /// In pt, this message translates to:
  /// **'Cancelar reserva'**
  String get cancelReservation;

  /// No description provided for @statusPending.
  ///
  /// In pt, this message translates to:
  /// **'Pendente'**
  String get statusPending;

  /// No description provided for @statusConfirmed.
  ///
  /// In pt, this message translates to:
  /// **'Confirmada'**
  String get statusConfirmed;

  /// No description provided for @statusCheckedIn.
  ///
  /// In pt, this message translates to:
  /// **'Check-in'**
  String get statusCheckedIn;

  /// No description provided for @statusCompleted.
  ///
  /// In pt, this message translates to:
  /// **'Concluída'**
  String get statusCompleted;

  /// No description provided for @statusCancelled.
  ///
  /// In pt, this message translates to:
  /// **'Cancelada'**
  String get statusCancelled;

  /// No description provided for @statusNoShow.
  ///
  /// In pt, this message translates to:
  /// **'Não compareceu'**
  String get statusNoShow;

  /// No description provided for @orderTitle.
  ///
  /// In pt, this message translates to:
  /// **'Pedir à mesa'**
  String get orderTitle;

  /// No description provided for @needTable.
  ///
  /// In pt, this message translates to:
  /// **'Escaneie o QR da mesa para começar.'**
  String get needTable;

  /// No description provided for @scanTable.
  ///
  /// In pt, this message translates to:
  /// **'Escanear mesa'**
  String get scanTable;

  /// No description provided for @typeTable.
  ///
  /// In pt, this message translates to:
  /// **'Informar mesa'**
  String get typeTable;

  /// No description provided for @tableHint.
  ///
  /// In pt, this message translates to:
  /// **'Ex.: Mesa 4'**
  String get tableHint;

  /// No description provided for @tableActive.
  ///
  /// In pt, this message translates to:
  /// **'Mesa {label}'**
  String tableActive(String label);

  /// No description provided for @cart.
  ///
  /// In pt, this message translates to:
  /// **'Carrinho'**
  String get cart;

  /// No description provided for @add.
  ///
  /// In pt, this message translates to:
  /// **'Adicionar'**
  String get add;

  /// No description provided for @placeOrder.
  ///
  /// In pt, this message translates to:
  /// **'Enviar pedido'**
  String get placeOrder;

  /// No description provided for @myOrders.
  ///
  /// In pt, this message translates to:
  /// **'Meus pedidos'**
  String get myOrders;

  /// No description provided for @emptyCart.
  ///
  /// In pt, this message translates to:
  /// **'Seu carrinho está vazio.'**
  String get emptyCart;

  /// No description provided for @serviceCharge10.
  ///
  /// In pt, this message translates to:
  /// **'Incluir taxa de serviço 10% (garçom)'**
  String get serviceCharge10;

  /// No description provided for @serviceChargeLabel.
  ///
  /// In pt, this message translates to:
  /// **'Taxa de serviço 10%'**
  String get serviceChargeLabel;

  /// No description provided for @orderSubtotal.
  ///
  /// In pt, this message translates to:
  /// **'Subtotal'**
  String get orderSubtotal;

  /// No description provided for @emptyOrders.
  ///
  /// In pt, this message translates to:
  /// **'Nenhum pedido ainda.'**
  String get emptyOrders;

  /// No description provided for @emptyMenu.
  ///
  /// In pt, this message translates to:
  /// **'Carta indisponível.'**
  String get emptyMenu;

  /// No description provided for @itemNotes.
  ///
  /// In pt, this message translates to:
  /// **'Notas do item'**
  String get itemNotes;

  /// No description provided for @orderOpen.
  ///
  /// In pt, this message translates to:
  /// **'Aberto'**
  String get orderOpen;

  /// No description provided for @orderInProgress.
  ///
  /// In pt, this message translates to:
  /// **'Em preparo'**
  String get orderInProgress;

  /// No description provided for @orderCompleted.
  ///
  /// In pt, this message translates to:
  /// **'Entregue'**
  String get orderCompleted;

  /// No description provided for @orderCancelled.
  ///
  /// In pt, this message translates to:
  /// **'Cancelado'**
  String get orderCancelled;

  /// No description provided for @itemPending.
  ///
  /// In pt, this message translates to:
  /// **'Na fila'**
  String get itemPending;

  /// No description provided for @itemPreparing.
  ///
  /// In pt, this message translates to:
  /// **'Preparando'**
  String get itemPreparing;

  /// No description provided for @itemServed.
  ///
  /// In pt, this message translates to:
  /// **'Servido'**
  String get itemServed;

  /// No description provided for @changeTable.
  ///
  /// In pt, this message translates to:
  /// **'Trocar mesa'**
  String get changeTable;

  /// No description provided for @seeAllOrders.
  ///
  /// In pt, this message translates to:
  /// **'Ver todos'**
  String get seeAllOrders;

  /// No description provided for @orderHistoryTitle.
  ///
  /// In pt, this message translates to:
  /// **'Meus pedidos'**
  String get orderHistoryTitle;

  /// No description provided for @orderDraft.
  ///
  /// In pt, this message translates to:
  /// **'Rascunho'**
  String get orderDraft;

  /// No description provided for @orderReady.
  ///
  /// In pt, this message translates to:
  /// **'Seu pedido está pronto'**
  String get orderReady;

  /// No description provided for @notifications.
  ///
  /// In pt, this message translates to:
  /// **'Notificações'**
  String get notifications;

  /// No description provided for @noNotifications.
  ///
  /// In pt, this message translates to:
  /// **'Nenhuma notificação ainda.'**
  String get noNotifications;

  /// No description provided for @accountMenu.
  ///
  /// In pt, this message translates to:
  /// **'Conta'**
  String get accountMenu;

  /// No description provided for @orderAtTable.
  ///
  /// In pt, this message translates to:
  /// **'Mesa {label}'**
  String orderAtTable(String label);
}

class _AppLocalizationsDelegate
    extends LocalizationsDelegate<AppLocalizations> {
  const _AppLocalizationsDelegate();

  @override
  Future<AppLocalizations> load(Locale locale) {
    return SynchronousFuture<AppLocalizations>(lookupAppLocalizations(locale));
  }

  @override
  bool isSupported(Locale locale) =>
      <String>['en', 'es', 'it', 'pt', 'zh'].contains(locale.languageCode);

  @override
  bool shouldReload(_AppLocalizationsDelegate old) => false;
}

AppLocalizations lookupAppLocalizations(Locale locale) {
  // Lookup logic when only language code is specified.
  switch (locale.languageCode) {
    case 'en':
      return AppLocalizationsEn();
    case 'es':
      return AppLocalizationsEs();
    case 'it':
      return AppLocalizationsIt();
    case 'pt':
      return AppLocalizationsPt();
    case 'zh':
      return AppLocalizationsZh();
  }

  throw FlutterError(
    'AppLocalizations.delegate failed to load unsupported locale "$locale". This is likely '
    'an issue with the localizations generation tool. Please file an issue '
    'on GitHub with a reproducible sample app and the gen-l10n configuration '
    'that was used.',
  );
}
