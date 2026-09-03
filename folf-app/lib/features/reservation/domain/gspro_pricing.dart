/// Tarifas GSPro por persona/hora (BRL). partySize = 1 + companionCount.
const Map<int, double> kGsproPricePerPersonByPartySize = {
  1: 150,
  2: 150,
  3: 130,
  4: 120,
};

double pricePerPersonBrl(int partySize) =>
    kGsproPricePerPersonByPartySize[partySize] ?? 150;

double computeReservationTotal({
  required int companionCount,
  required Duration duration,
}) {
  final partySize = 1 + companionCount;
  final unit = pricePerPersonBrl(partySize);
  final hours = duration.inMinutes / 60.0;
  return (partySize * unit * hours * 100).roundToDouble() / 100;
}
