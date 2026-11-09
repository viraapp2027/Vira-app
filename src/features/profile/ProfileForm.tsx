import { useState, type FormEvent } from 'react';
import { Check, Save } from 'lucide-react';
import { BRAZILIAN_STATES, INTEREST_OPTIONS, INTENTION_OPTIONS } from './profileOptions';
import type { Intention, Profile, ProfileUpdate } from '../../types/profile';

interface ProfileFormProps {
  profile: Profile;
  submitLabel: string;
  onSubmit: (update: ProfileUpdate) => Promise<void>;
  onCancel?: () => void;
}

export function ProfileForm({ profile, submitLabel, onSubmit, onCancel }: ProfileFormProps) {
  const [displayName, setDisplayName] = useState(profile.display_name);
  const [city, setCity] = useState(profile.city);
  const [state, setState] = useState(profile.state);
  const [bio, setBio] = useState(profile.bio ?? '');
  const [interests, setInterests] = useState<string[]>(profile.interests ?? []);
  const [intentions, setIntentions] = useState<Intention[]>(profile.intentions ?? []);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  function toggleInterest(value: string) {
    setInterests((current) => current.includes(value) ? current.filter((item) => item !== value) : [...current, value]);
  }

  function toggleIntention(value: Intention) {
    setIntentions((current) => current.includes(value) ? current.filter((item) => item !== value) : [...current, value]);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    if (intentions.length === 0) { setError('Escolha ao menos uma intenção para continuar.'); return; }
    setBusy(true);
    try {
      await onSubmit({
        display_name: displayName.trim(),
        city: city.trim(),
        state,
        bio: bio.trim(),
        interests,
        intentions,
        onboarding_completed: true,
      });
    } catch {
      setError('Não foi possível salvar seu perfil. Confira sua conexão e tente novamente.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="profile-form" onSubmit={(event) => void handleSubmit(event)}>
      <section className="form-section" aria-labelledby="identity-heading">
        <h2 id="identity-heading">Sobre você</h2>
        <p>Essas informações formam seu perfil. Sua data de nascimento é privada.</p>
        <label className="form-field"><span>Nome de exibição</span><input autoComplete="nickname" minLength={2} maxLength={40} required value={displayName} onChange={(event) => setDisplayName(event.target.value)} /></label>
        <div className="form-grid">
          <label className="form-field"><span>Cidade</span><input autoComplete="address-level2" maxLength={80} required value={city} onChange={(event) => setCity(event.target.value)} placeholder="Ex.: Campinas" /></label>
          <label className="form-field"><span>Estado</span><select autoComplete="address-level1" required value={state} onChange={(event) => setState(event.target.value)}><option value="">Selecione</option>{BRAZILIAN_STATES.map(([uf, name]) => <option value={uf} key={uf}>{uf} — {name}</option>)}</select></label>
        </div>
        <label className="form-field"><span>Biografia <small>(opcional)</small></span><textarea maxLength={300} value={bio} onChange={(event) => setBio(event.target.value)} placeholder="O que você gosta de fazer?" /><small>{bio.length}/300 caracteres</small></label>
      </section>

      <section className="form-section" aria-labelledby="interests-heading">
        <h2 id="interests-heading">O que você curte?</h2>
        <p>Selecione temas que ajudam a contar um pouco sobre você. Você pode mudar isso depois.</p>
        <div className="interest-grid" aria-label="Interesses">
          {INTEREST_OPTIONS.map((interest) => {
            const selected = interests.includes(interest);
            return <button className={`interest-chip ${selected ? 'is-selected' : ''}`} key={interest} type="button" aria-pressed={selected} onClick={() => toggleInterest(interest)}>{interest}</button>;
          })}
        </div>
      </section>

      <section className="form-section" aria-labelledby="intentions-heading">
        <h2 id="intentions-heading">O que você procura?</h2>
        <p>Escolha uma ou mais intenções. Você decide como quer participar.</p>
        <div className="choice-grid">
          {INTENTION_OPTIONS.map((option) => {
            const selected = intentions.includes(option.value);
            return (
              <button className={`choice-card ${selected ? 'is-selected' : ''}`} key={option.value} type="button" aria-pressed={selected} onClick={() => toggleIntention(option.value)}>
                <span className="choice-card__check" aria-hidden="true">{selected && <Check size={13} />}</span>
                <span><strong>{option.label}</strong><small>{option.description}</small></span>
              </button>
            );
          })}
        </div>
      </section>

      {error && <p className="form-error" role="alert">{error}</p>}
      <div className="form-actions">
        {onCancel && <button className="button button--quiet" type="button" onClick={onCancel}>Cancelar</button>}
        <button className="button button--primary" type="submit" disabled={busy}>{busy ? 'Salvando…' : <><Save size={17} aria-hidden="true" /> {submitLabel}</>}</button>
      </div>
    </form>
  );
}
