// ignore: unused_import
import 'package:intl/intl.dart' as intl;
import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for Chinese (`zh`).
class AppLocalizationsZh extends AppLocalizations {
  AppLocalizationsZh([String locale = 'zh']) : super(locale);

  @override
  String get appName => 'Golf Sport Bar';

  @override
  String get tagline => '室内高尔夫 · 美食 · 调酒';

  @override
  String get tabHome => '首页';

  @override
  String get tabMap => '地图';

  @override
  String get tabQr => '扫码';

  @override
  String get tabReserve => '预订';

  @override
  String get tabOrder => '点单';

  @override
  String get language => '语言';

  @override
  String get themeLight => '浅色';

  @override
  String get themeDark => '深色';

  @override
  String get themeToggle => '切换主题';

  @override
  String get retry => '重试';

  @override
  String get cancel => '取消';

  @override
  String get confirm => '确认';

  @override
  String get save => '保存';

  @override
  String get next => '继续';

  @override
  String get back => '返回';

  @override
  String get close => '关闭';

  @override
  String get loading => '加载中…';

  @override
  String get errorGeneric => '出了点问题，请再试一次。';

  @override
  String get howToGetThere => '如何前往';

  @override
  String get logout => '退出';

  @override
  String get loginTitle => '欢迎回来';

  @override
  String get loginSubtitle => '使用邮箱或 CPF 登录，即可开打、预订击球位并送餐到桌。';

  @override
  String get identifier => '邮箱或 CPF';

  @override
  String get password => '密码';

  @override
  String get loginCta => '登录';

  @override
  String get noAccount => '还没有账号？';

  @override
  String get registerCta => '创建账号';

  @override
  String get registerTitle => '创建账号';

  @override
  String get stepIdentity => '身份';

  @override
  String get stepContact => '联系方式';

  @override
  String get stepAddress => '地址';

  @override
  String get fullName => '全名';

  @override
  String get cpf => 'CPF';

  @override
  String get email => '邮箱';

  @override
  String get phone => '手机';

  @override
  String get birthDate => '出生日期';

  @override
  String get postalCode => '邮编';

  @override
  String get street => '街道';

  @override
  String get streetNumber => '门牌';

  @override
  String get complement => '补充';

  @override
  String get district => '街区';

  @override
  String get city => '城市';

  @override
  String get state => '州';

  @override
  String get addressOptional => '地址（可选）';

  @override
  String get lgpdLabel => '我已阅读并同意处理我的个人数据（LGPD）。';

  @override
  String get haveAccount => '已有账号？去登录';

  @override
  String greeting(String name) {
    return '你好，$name';
  }

  @override
  String get greetingGuest => '你好';

  @override
  String get headline => '室内高尔夫、餐桌与菜单，都在这里。';

  @override
  String get subhead => '预订击球位、点餐到桌，并实时跟进进度。';

  @override
  String get featuredVenue => '你所在的门店';

  @override
  String get simulator => '模拟器';

  @override
  String get menuFeatured => '菜单精选';

  @override
  String get seeFullMenu => '查看完整菜单';

  @override
  String get experienceTitle => '体验';

  @override
  String get upcomingReservation => '即将到来的预订';

  @override
  String get activeOrder => '进行中的订单';

  @override
  String get ctaReserve => '预订时段';

  @override
  String get ctaOrder => '点餐到桌';

  @override
  String get instagram => 'Instagram';

  @override
  String get followInstagram => '关注 Instagram';

  @override
  String get slideBayTitle => '私人击球位';

  @override
  String get slideBayCopy => '练习或整场，适合你、好友或团体——全年开放。';

  @override
  String get slideTechTitle => '精准模拟器';

  @override
  String get slideTechCopy => '真实物理与实时数据，上千球场可选。';

  @override
  String get slideNightTitle => '美食与调酒';

  @override
  String get slideNightCopy => '厨房与酒吧陪伴整场——从开打到收工。';

  @override
  String get mapTitle => '我们在哪';

  @override
  String get selectVenue => '选择这家店';

  @override
  String get reserveHere => '在此预订';

  @override
  String get orderHere => '在此点单';

  @override
  String get noVenues => '地图上还没有门店。';

  @override
  String get qrInstruction => '对准桌号、预订或链接二维码。';

  @override
  String get qrTorch => '手电筒';

  @override
  String get qrScanned => '已识别二维码';

  @override
  String get qrOpenUrl => '打开链接';

  @override
  String get qrGoTable => '向此桌点单';

  @override
  String get qrGoReservation => '查看预订';

  @override
  String get qrUnknown => '无法识别此二维码。';

  @override
  String get reservationTitle => '预订';

  @override
  String get bayAvailabilityTitle => '击球位可用情况';

  @override
  String bayCount(int count) {
    return '$count 个击球位';
  }

  @override
  String baysAvailableNowSummary(int available, int total) {
    return '当前 $available/$total 可用';
  }

  @override
  String get viewAllBays => '选择要预订的击球位';

  @override
  String get bayAvailableNow => '现在可用';

  @override
  String get bayBusyNow => '使用中';

  @override
  String get bayNoSlotsToday => '今天无空档';

  @override
  String bayNextSlot(String time) {
    return '下一空档：$time';
  }

  @override
  String get reserveThisBay => '预订此击球位';

  @override
  String get newReservation => '新建';

  @override
  String get myReservations => '我的';

  @override
  String get pickDay => '日期';

  @override
  String get pickBay => '击球位';

  @override
  String get duration => '时长';

  @override
  String minutes(int count) {
    return '$count 分钟';
  }

  @override
  String get notes => '备注';

  @override
  String get confirmBooking => '确认预订';

  @override
  String get noSlots => '当天没有空档。';

  @override
  String get emptyReservations => '你还没有任何预订。';

  @override
  String get cancelReservation => '取消预订';

  @override
  String get statusPending => '待确认';

  @override
  String get statusConfirmed => '已确认';

  @override
  String get statusCheckedIn => '已签到';

  @override
  String get statusCompleted => '已完成';

  @override
  String get statusCancelled => '已取消';

  @override
  String get statusNoShow => '未到场';

  @override
  String get orderTitle => '送餐到桌';

  @override
  String get needTable => '请先扫描桌号二维码。';

  @override
  String get scanTable => '扫描桌号';

  @override
  String get typeTable => '输入桌号';

  @override
  String get tableHint => '例如：4号桌';

  @override
  String tableActive(String label) {
    return '桌位 $label';
  }

  @override
  String get cart => '购物车';

  @override
  String get add => '加入';

  @override
  String get placeOrder => '提交订单';

  @override
  String get myOrders => '我的订单';

  @override
  String get emptyCart => '购物车是空的。';

  @override
  String get emptyOrders => '还没有订单。';

  @override
  String get emptyMenu => '菜单暂不可用。';

  @override
  String get itemNotes => '菜品备注';

  @override
  String get orderOpen => '已开单';

  @override
  String get orderInProgress => '制作中';

  @override
  String get orderCompleted => '已上菜';

  @override
  String get orderCancelled => '已取消';

  @override
  String get itemPending => '排队中';

  @override
  String get itemPreparing => '制作中';

  @override
  String get itemServed => '已上菜';

  @override
  String get changeTable => '更换桌号';

  @override
  String get seeAllOrders => '查看全部';

  @override
  String get orderHistoryTitle => '我的订单';

  @override
  String get orderDraft => '草稿';

  @override
  String get orderReady => '您的订单已完成';

  @override
  String get notifications => '通知';

  @override
  String get noNotifications => '暂无通知。';

  @override
  String get accountMenu => '账户';

  @override
  String orderAtTable(String label) {
    return '桌号 $label';
  }
}
