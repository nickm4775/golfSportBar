// ignore: unused_import
import 'package:intl/intl.dart' as intl;
import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for Portuguese (`pt`).
class AppLocalizationsPt extends AppLocalizations {
  AppLocalizationsPt([String locale = 'pt']) : super(locale);

  @override
  String get appName => 'Golf Sport Bar';

  @override
  String get tagline => 'Golf indoor · Gastronomia · Drinks';

  @override
  String get tabHome => 'Início';

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
  String get themeDark => 'Escuro';

  @override
  String get themeToggle => 'Alternar tema';

  @override
  String get retry => 'Tentar de novo';

  @override
  String get cancel => 'Cancelar';

  @override
  String get confirm => 'Confirmar';

  @override
  String get save => 'Salvar';

  @override
  String get next => 'Continuar';

  @override
  String get back => 'Voltar';

  @override
  String get close => 'Fechar';

  @override
  String get loading => 'Carregando…';

  @override
  String get errorGeneric => 'Algo deu errado. Tente novamente.';

  @override
  String get howToGetThere => 'Como chegar';

  @override
  String get logout => 'Sair';

  @override
  String get loginTitle => 'Bem-vindo de volta';

  @override
  String get loginSubtitle =>
      'Entre com e-mail ou CPF para jogar, reservar e pedir à mesa.';

  @override
  String get identifier => 'E-mail ou CPF';

  @override
  String get password => 'Senha';

  @override
  String get loginCta => 'Entrar';

  @override
  String get noAccount => 'Ainda não tem conta?';

  @override
  String get registerCta => 'Criar conta';

  @override
  String get registerTitle => 'Criar conta';

  @override
  String get stepIdentity => 'Você';

  @override
  String get stepContact => 'Contato';

  @override
  String get stepAddress => 'Endereço';

  @override
  String get fullName => 'Nome completo';

  @override
  String get cpf => 'CPF';

  @override
  String get email => 'E-mail';

  @override
  String get phone => 'Celular';

  @override
  String get birthDate => 'Data de nascimento';

  @override
  String get postalCode => 'CEP';

  @override
  String get street => 'Rua';

  @override
  String get streetNumber => 'Número';

  @override
  String get complement => 'Complemento';

  @override
  String get district => 'Bairro';

  @override
  String get city => 'Cidade';

  @override
  String get state => 'UF';

  @override
  String get addressOptional => 'Endereço (opcional)';

  @override
  String get lgpdLabel => 'Li e aceito o tratamento dos meus dados (LGPD).';

  @override
  String get fieldRequired => 'Este campo é obrigatório.';

  @override
  String get invalidEmail => 'Informe um e-mail válido.';

  @override
  String get invalidCpf => 'Informe um CPF válido.';

  @override
  String get invalidPhone => 'Informe um celular brasileiro válido.';

  @override
  String get invalidBirthDate => 'Use o formato AAAA-MM-DD.';

  @override
  String get underage => 'É necessário ter pelo menos 18 anos.';

  @override
  String get passwordMinLength => 'A senha deve ter pelo menos 6 caracteres.';

  @override
  String get fullNameMinLength => 'Informe seu nome completo.';

  @override
  String get lgpdRequired => 'Aceite o tratamento de dados para continuar.';

  @override
  String get invalidState => 'Use no máximo 2 letras (UF).';

  @override
  String get haveAccount => 'Já tem conta? Entrar';

  @override
  String greeting(String name) {
    return 'Olá, $name';
  }

  @override
  String get greetingGuest => 'Olá';

  @override
  String get headline => 'Golf indoor, mesa e carta no mesmo lugar.';

  @override
  String get subhead =>
      'Reserve sua bay, peça à mesa e acompanhe tudo em tempo real.';

  @override
  String get featuredVenue => 'Onde você está';

  @override
  String get simulator => 'Simulador';

  @override
  String get menuFeatured => 'Destaques da carta';

  @override
  String get seeFullMenu => 'Ver carta completa';

  @override
  String get experienceTitle => 'A experiência';

  @override
  String get upcomingReservation => 'Próxima reserva';

  @override
  String get activeOrder => 'Pedido em andamento';

  @override
  String get ctaReserve => 'Reservar horário';

  @override
  String get ctaOrder => 'Pedir à mesa';

  @override
  String get instagram => 'Instagram';

  @override
  String get followInstagram => 'Seguir no Instagram';

  @override
  String get slideBayTitle => 'Bays privativas';

  @override
  String get slideBayCopy =>
      'Treino ou partida, para você, amigos ou grupos — o ano inteiro.';

  @override
  String get slideTechTitle => 'Simulador de precisão';

  @override
  String get slideTechCopy =>
      'Física realista e dados em tempo real, com milhares de campos.';

  @override
  String get slideNightTitle => 'Gastronomia e drinks';

  @override
  String get slideNightCopy =>
      'A carta e o bar acompanham o jogo — da partida ao after.';

  @override
  String get mapTitle => 'Onde estamos';

  @override
  String get selectVenue => 'Escolher esta casa';

  @override
  String get reserveHere => 'Reservar aqui';

  @override
  String get orderHere => 'Pedir aqui';

  @override
  String get noVenues => 'Nenhum local no mapa ainda.';

  @override
  String get qrInstruction =>
      'Aponte para o QR da mesa, da reserva ou de um link.';

  @override
  String get qrTorch => 'Lanterna';

  @override
  String get qrScanned => 'QR lido';

  @override
  String get qrOpenUrl => 'Abrir link';

  @override
  String get qrGoTable => 'Pedir nesta mesa';

  @override
  String get qrGoReservation => 'Ver reserva';

  @override
  String get qrUnknown => 'Não reconhecemos este código.';

  @override
  String get reservationTitle => 'Reservas';

  @override
  String get bayAvailabilityTitle => 'Disponibilidade das bays';

  @override
  String get viewAllBays => 'Escolha uma bay para reservar';

  @override
  String get bayAvailableNow => 'Disponível agora';

  @override
  String get bayBusyNow => 'Ocupada';

  @override
  String get bayNoSlotsToday => 'Sem horários hoje';

  @override
  String get bayAvailable => 'Disponível';

  @override
  String get bayOccupied => 'Ocupado';

  @override
  String bayNextSlot(String time) {
    return 'Próximo horário: $time';
  }

  @override
  String get reserveThisBay => 'Reservar esta bay';

  @override
  String get newReservation => 'Nova';

  @override
  String get myReservations => 'Minhas';

  @override
  String get pickDay => 'Dia';

  @override
  String get pickBay => 'Bay';

  @override
  String get duration => 'Duração';

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
    return 'Até $max horas';
  }

  @override
  String get estimatedTotal => 'Total estimado';

  @override
  String reservationSummary(int party, String duration) {
    return '$party jogadores · $duration';
  }

  @override
  String get pickStartTime => 'Horário de início';

  @override
  String get timePeriodMorning => 'Manhã';

  @override
  String get timePeriodAfternoon => 'Tarde';

  @override
  String get timePeriodEvening => 'Noite';

  @override
  String get selectedTimeSlotLabel => 'Horário selecionado';

  @override
  String timeSlotRange(String start, String end) {
    return '$start – $end';
  }

  @override
  String get noSlotsInPeriod => 'Sem horários neste período.';

  @override
  String get notes => 'Observações';

  @override
  String get confirmBooking => 'Confirmar reserva';

  @override
  String get companions => 'Acompanhantes';

  @override
  String companionsCount(int count) {
    return '$count acompanhantes';
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
  String get noSlots => 'Sem horários livres neste dia.';

  @override
  String get emptyReservations => 'Você ainda não tem reservas.';

  @override
  String get cancelReservation => 'Cancelar reserva';

  @override
  String get statusPending => 'Pendente';

  @override
  String get statusConfirmed => 'Confirmada';

  @override
  String get statusCheckedIn => 'Check-in';

  @override
  String get statusCompleted => 'Concluída';

  @override
  String get statusCancelled => 'Cancelada';

  @override
  String get statusNoShow => 'Não compareceu';

  @override
  String get orderTitle => 'Pedir à mesa';

  @override
  String get needTable => 'Escaneie o QR da mesa para começar.';

  @override
  String get scanTable => 'Escanear mesa';

  @override
  String get typeTable => 'Informar mesa';

  @override
  String get tableHint => 'Ex.: Mesa 4';

  @override
  String tableActive(String label) {
    return 'Mesa $label';
  }

  @override
  String get cart => 'Carrinho';

  @override
  String get add => 'Adicionar';

  @override
  String get placeOrder => 'Enviar pedido';

  @override
  String get myOrders => 'Meus pedidos';

  @override
  String get emptyCart => 'Seu carrinho está vazio.';

  @override
  String get emptyOrders => 'Nenhum pedido ainda.';

  @override
  String get emptyMenu => 'Carta indisponível.';

  @override
  String get itemNotes => 'Notas do item';

  @override
  String get orderOpen => 'Aberto';

  @override
  String get orderInProgress => 'Em preparo';

  @override
  String get orderCompleted => 'Entregue';

  @override
  String get orderCancelled => 'Cancelado';

  @override
  String get itemPending => 'Na fila';

  @override
  String get itemPreparing => 'Preparando';

  @override
  String get itemServed => 'Servido';

  @override
  String get changeTable => 'Trocar mesa';

  @override
  String get seeAllOrders => 'Ver todos';

  @override
  String get orderHistoryTitle => 'Meus pedidos';

  @override
  String get orderDraft => 'Rascunho';

  @override
  String get orderReady => 'Seu pedido está pronto';

  @override
  String get notifications => 'Notificações';

  @override
  String get noNotifications => 'Nenhuma notificação ainda.';

  @override
  String get accountMenu => 'Conta';

  @override
  String orderAtTable(String label) {
    return 'Mesa $label';
  }
}
