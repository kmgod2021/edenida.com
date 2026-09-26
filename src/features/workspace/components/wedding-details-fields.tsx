import {
  DEFAULT_WEDDING_CURRENCY,
  DEFAULT_WEDDING_TIMEZONE,
  WEDDING_CURRENCY_IDS,
  WEDDING_CURRENCY_LABELS,
  WEDDING_TIMEZONE_IDS,
  WEDDING_TIMEZONE_LABELS,
} from "../domain/validation";
import { inputClass } from "./classes";

export type WeddingFormValues = {
  title: string;
  partnerName: string;
  weddingDate: string;
  timezone: string;
  currency: string;
};

export const emptyWeddingFormValues: WeddingFormValues = {
  title: "",
  partnerName: "",
  weddingDate: "",
  timezone: DEFAULT_WEDDING_TIMEZONE,
  currency: DEFAULT_WEDDING_CURRENCY,
};

export function WeddingDetailsFields({
  values = emptyWeddingFormValues,
}: {
  values?: WeddingFormValues;
}) {
  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <label htmlFor="wedding-title" className="block text-sm font-medium text-ink">
          Titre du mariage
        </label>
        <input
          id="wedding-title"
          name="title"
          required
          maxLength={80}
          defaultValue={values.title}
          placeholder="Camille & Julien"
          className={inputClass}
        />
      </div>
      <div className="space-y-2">
        <label htmlFor="partner-name" className="block text-sm font-medium text-ink">
          Nom du partenaire
        </label>
        <input
          id="partner-name"
          name="partnerName"
          maxLength={80}
          defaultValue={values.partnerName}
          aria-describedby="partner-help"
          className={inputClass}
        />
        <p id="partner-help" className="text-sm leading-relaxed text-ink-muted">
          Ce nom n&apos;est pas encore enregistré. Cela ne crée pas de membre :
          l&apos;invitation viendra plus tard.
        </p>
      </div>
      <div className="space-y-2">
        <label htmlFor="wedding-date" className="block text-sm font-medium text-ink">
          Date du mariage
        </label>
        <input
          id="wedding-date"
          name="weddingDate"
          type="date"
          defaultValue={values.weddingDate}
          className={inputClass}
        />
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="wedding-timezone" className="block text-sm font-medium text-ink">
            Fuseau horaire
          </label>
          <select
            id="wedding-timezone"
            name="timezone"
            defaultValue={values.timezone}
            className={inputClass}
          >
            {WEDDING_TIMEZONE_IDS.map((id) => (
              <option key={id} value={id}>
                {WEDDING_TIMEZONE_LABELS[id]}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <label htmlFor="wedding-currency" className="block text-sm font-medium text-ink">
            Devise
          </label>
          <select
            id="wedding-currency"
            name="currency"
            defaultValue={values.currency}
            className={inputClass}
          >
            {WEDDING_CURRENCY_IDS.map((id) => (
              <option key={id} value={id}>
                {WEDDING_CURRENCY_LABELS[id]}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
