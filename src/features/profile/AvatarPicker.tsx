import { useEffect, useRef, useState } from 'react';
import { Camera } from 'lucide-react';

interface AvatarPickerProps {
  displayName: string;
  imageUrl: string | null;
  onUpload: (file: File) => Promise<void>;
}

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

export function AvatarPicker({ displayName, imageUrl, onUpload }: AvatarPickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const initials = displayName.trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('') || 'V';

  useEffect(() => {
    if (!pendingFile) {
      setPreviewUrl(null);
      return;
    }

    const objectUrl = URL.createObjectURL(pendingFile);
    setPreviewUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [pendingFile]);

  function selectFile(file: File | undefined) {
    if (!file) return;
    setMessage('');
    setError('');

    if (!ALLOWED_TYPES.has(file.type)) {
      setPendingFile(null);
      setError('Escolha uma imagem JPEG, PNG ou WebP.');
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setPendingFile(null);
      setError('A imagem deve ter no máximo 5 MB.');
      return;
    }

    setPendingFile(file);
  }

  async function uploadSelected() {
    if (!pendingFile) return;
    setMessage('');
    setError('');
    setBusy(true);
    try {
      await onUpload(pendingFile);
      setPendingFile(null);
      setMessage('Sua foto foi atualizada.');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Não foi possível enviar essa imagem.');
    } finally {
      setBusy(false);
    }
  }

  function cancelSelection() {
    setPendingFile(null);
    setMessage('');
    setError('');
  }

  return (
    <section className="avatar-editor" aria-labelledby="avatar-editor-title">
      <div
        className="avatar-editor__preview"
        role="img"
        aria-label={pendingFile ? 'Prévia da nova foto selecionada' : `Foto de perfil de ${displayName}`}
      >
        {previewUrl ? <img src={previewUrl} alt="" /> : imageUrl ? <img src={imageUrl} alt="" /> : <span>{initials}</span>}
      </div>
      <div className="avatar-editor__content">
        <h2 id="avatar-editor-title">Sua foto de perfil</h2>
        <p>JPG, PNG ou WebP, até 5 MB. Nesta etapa, a foto é privada e somente você pode visualizá-la.</p>
        <input
          ref={inputRef}
          className="sr-only"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          aria-label="Selecionar uma foto de perfil"
          disabled={busy}
          onChange={(event) => {
            const file = event.currentTarget.files?.[0];
            event.currentTarget.value = '';
            selectFile(file);
          }}
        />
        <button className="button button--outline" type="button" disabled={busy} onClick={() => inputRef.current?.click()}>
          <Camera size={17} aria-hidden="true" /> {pendingFile ? 'Escolher outra foto' : imageUrl ? 'Trocar foto' : 'Escolher foto'}
        </button>
        {pendingFile && (
          <>
            <p className="avatar-editor__status" role="status">Prévia de “{pendingFile.name}”. A foto atual só será trocada após confirmar o envio.</p>
            <div className="avatar-editor__actions">
              <button className="button button--outline" type="button" disabled={busy} onClick={() => void uploadSelected()}>
                {busy ? 'Enviando…' : 'Enviar foto'}
              </button>
              <button className="button button--outline" type="button" disabled={busy} onClick={cancelSelection}>
                Cancelar
              </button>
            </div>
          </>
        )}
        {message && <p className="avatar-editor__status" role="status">{message}</p>}
        {error && <p className="form-error" role="alert">{error}</p>}
      </div>
    </section>
  );
}
