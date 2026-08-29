import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import type { Customer, CustomerPayload } from '@/domain/customer/Customer'
import { formatCepInput, formatCpfInput, formatPhoneBrInput } from '@/shared/lib/br'
import { ghostButtonClass, inputClass, primaryButtonClass } from '@/presentation/components/admin/AdminUi'

export function CustomerForm({
  initial,
  submitLabel,
  onCancel,
  onSubmit,
}: {
  initial?: Customer | null
  submitLabel: string
  onCancel: () => void
  onSubmit: (payload: CustomerPayload) => Promise<void>
}) {
  const { t } = useTranslation('admin')
  const [fullName, setFullName] = useState(initial?.fullName ?? '')
  const [cpf, setCpf] = useState(formatCpfInput(initial?.cpf ?? ''))
  const [email, setEmail] = useState(initial?.email ?? '')
  const [phone, setPhone] = useState(formatPhoneBrInput(initial?.phone ?? ''))
  const [birthDate, setBirthDate] = useState(initial?.birthDate?.slice(0, 10) ?? '')
  const [postalCode, setPostalCode] = useState(formatCepInput(initial?.postalCode ?? ''))
  const [street, setStreet] = useState(initial?.street ?? '')
  const [streetNumber, setStreetNumber] = useState(initial?.streetNumber ?? '')
  const [complement, setComplement] = useState(initial?.complement ?? '')
  const [district, setDistrict] = useState(initial?.district ?? '')
  const [city, setCity] = useState(initial?.city ?? '')
  const [state, setState] = useState(initial?.state ?? '')
  const [lgpdAccepted, setLgpdAccepted] = useState(Boolean(initial))
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!fullName.trim() || !cpf || !email || !phone || !birthDate) return
    if (!initial && !lgpdAccepted) return
    setSaving(true)
    try {
      await onSubmit({
        fullName: fullName.trim(),
        cpf,
        email: email.trim(),
        phone,
        birthDate,
        lgpdAccepted: true,
        postalCode: postalCode || undefined,
        street: street || undefined,
        streetNumber: streetNumber || undefined,
        complement: complement || undefined,
        district: district || undefined,
        city: city || undefined,
        state: state || undefined,
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <form className="grid gap-3 sm:grid-cols-2" onSubmit={(event) => void handleSubmit(event)}>
      <label className="text-xs text-[var(--gsb-muted)] sm:col-span-2">
        {t('customers.fullName')}
        <input
          className={`${inputClass} mt-1`}
          value={fullName}
          onChange={(event) => setFullName(event.target.value)}
          required
        />
      </label>
      <label className="text-xs text-[var(--gsb-muted)]">
        {t('customers.cpf')}
        <input
          className={`${inputClass} mt-1`}
          value={cpf}
          onChange={(event) => setCpf(formatCpfInput(event.target.value))}
          inputMode="numeric"
          required
        />
      </label>
      <label className="text-xs text-[var(--gsb-muted)]">
        {t('common.phone')}
        <input
          className={`${inputClass} mt-1`}
          value={phone}
          onChange={(event) => setPhone(formatPhoneBrInput(event.target.value))}
          inputMode="tel"
          required
        />
      </label>
      <label className="text-xs text-[var(--gsb-muted)]">
        {t('common.email')}
        <input
          className={`${inputClass} mt-1`}
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
      </label>
      <label className="text-xs text-[var(--gsb-muted)]">
        {t('customers.birthDate')}
        <input
          className={`${inputClass} mt-1`}
          type="date"
          value={birthDate}
          onChange={(event) => setBirthDate(event.target.value)}
          required
        />
      </label>
      <label className="text-xs text-[var(--gsb-muted)]">
        {t('customers.postalCode')}
        <input
          className={`${inputClass} mt-1`}
          value={postalCode}
          onChange={(event) => setPostalCode(formatCepInput(event.target.value))}
          inputMode="numeric"
        />
      </label>
      <label className="text-xs text-[var(--gsb-muted)]">
        {t('customers.street')}
        <input className={`${inputClass} mt-1`} value={street} onChange={(event) => setStreet(event.target.value)} />
      </label>
      <label className="text-xs text-[var(--gsb-muted)]">
        {t('customers.streetNumber')}
        <input
          className={`${inputClass} mt-1`}
          value={streetNumber}
          onChange={(event) => setStreetNumber(event.target.value)}
        />
      </label>
      <label className="text-xs text-[var(--gsb-muted)]">
        {t('customers.complement')}
        <input
          className={`${inputClass} mt-1`}
          value={complement}
          onChange={(event) => setComplement(event.target.value)}
        />
      </label>
      <label className="text-xs text-[var(--gsb-muted)]">
        {t('customers.district')}
        <input
          className={`${inputClass} mt-1`}
          value={district}
          onChange={(event) => setDistrict(event.target.value)}
        />
      </label>
      <label className="text-xs text-[var(--gsb-muted)]">
        {t('business.city')}
        <input className={`${inputClass} mt-1`} value={city} onChange={(event) => setCity(event.target.value)} />
      </label>
      <label className="text-xs text-[var(--gsb-muted)]">
        {t('business.state')}
        <input
          className={`${inputClass} mt-1`}
          value={state}
          maxLength={2}
          onChange={(event) => setState(event.target.value.toUpperCase())}
        />
      </label>
      {initial ? null : (
        <label className="flex items-start gap-2 text-xs text-[var(--gsb-muted)] sm:col-span-2">
          <input
            type="checkbox"
            className="mt-0.5"
            checked={lgpdAccepted}
            onChange={(event) => setLgpdAccepted(event.target.checked)}
            required
          />
          <span>{t('customers.lgpd')}</span>
        </label>
      )}
      <div className="flex gap-2 sm:col-span-2">
        <button type="submit" className={primaryButtonClass} disabled={saving || (!initial && !lgpdAccepted)}>
          {submitLabel}
        </button>
        <button type="button" className={ghostButtonClass} onClick={onCancel}>
          {t('common.cancel')}
        </button>
      </div>
    </form>
  )
}
