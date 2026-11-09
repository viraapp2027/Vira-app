import { useEffect, useRef, useState, type PointerEvent } from 'react';
import { Camera, Check, Move, X } from 'lucide-react';

interface AvatarPickerProps {
  displayName: string;
  imageUrl: string | null;
  onUpload: (file: File) => Promise<void>;
}

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const CROP_SIZE = 320;

async function detectedImageType(file: File): Promise<string | null> {
  const bytes = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'image/jpeg';
  if (bytes.length >= 8 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47 && bytes[4] === 0x0d && bytes[5] === 0x0a && bytes[6] === 0x1a && bytes[7] === 0x0a) return 'image/png';
  if (bytes.length >= 12 && String.fromCharCode(...bytes.slice(0, 4)) === 'RIFF' && String.fromCharCode(...bytes.slice(8, 12)) === 'WEBP') return 'image/webp';
  return null;
}

export function AvatarPicker({ displayName, imageUrl, onUpload }: AvatarPickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const dragRef = useRef({ active: false, x: 0, y: 0 });
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [cropUrl, setCropUrl] = useState<string | null>(null);
  const [cropOpen, setCropOpen] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
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

  function drawCrop() {
    const canvas = canvasRef.current;
    const image = imageRef.current;
    if (!canvas || !image || !image.naturalWidth || !image.naturalHeight) return;
    const context = canvas.getContext('2d');
    if (!context) return;
    const baseScale = Math.max(CROP_SIZE / image.naturalWidth, CROP_SIZE / image.naturalHeight);
    const scale = baseScale * zoom;
    const width = image.naturalWidth * scale;
    const height = image.naturalHeight * scale;
    const x = (CROP_SIZE - width) / 2 + offset.x;
    const y = (CROP_SIZE - height) / 2 + offset.y;
    context.clearRect(0, 0, CROP_SIZE, CROP_SIZE);
    context.fillStyle = '#111';
    context.fillRect(0, 0, CROP_SIZE, CROP_SIZE);
    context.drawImage(image, x, y, width, height);
  }

  useEffect(() => { if (cropOpen) drawCrop(); }, [cropOpen, zoom, offset]);

  async function selectFile(file: File | undefined) {
    if (!file) return;
    setMessage('');
    setError('');
    if (file.size > MAX_IMAGE_BYTES) {
      setError('A imagem deve ter no máximo 5 MB. Escolha uma foto menor.');
      return;
    }
    const detectedType = await detectedImageType(file);
    if (!detectedType || !ALLOWED_TYPES.has(detectedType)) {
      setError('Este formato não é compatível. Escolha uma foto JPEG, PNG ou WebP; fotos HEIC/HEIF precisam ser convertidas antes.');
      return;
    }
    const normalized = file.type === detectedType ? file : new File([file], file.name || 'avatar', { type: detectedType, lastModified: file.lastModified });
    const url = URL.createObjectURL(normalized);
    const image = new Image();
    image.onload = () => {
      imageRef.current = image;
      setPendingFile(normalized);
      setCropUrl(url);
      setZoom(1);
      setOffset({ x: 0, y: 0 });
      setCropOpen(true);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      setError('Não foi possível abrir essa foto. Escolha outra imagem.');
    };
    image.src = url;
  }

  function moveCrop(event: PointerEvent<HTMLCanvasElement>) {
    if (!dragRef.current.active) return;
    const dx = event.clientX - dragRef.current.x;
    const dy = event.clientY - dragRef.current.y;
    dragRef.current.x = event.clientX;
    dragRef.current.y = event.clientY;
    setOffset((current) => ({ x: current.x + dx, y: current.y + dy }));
  }

  function confirmCrop() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.toBlob((blob) => {
      if (!blob) {
        setError('Não foi possível recortar essa foto.');
        return;
      }
      const cropped = new File([blob], 'avatar.jpg', { type: 'image/jpeg', lastModified: Date.now() });
      setPendingFile(cropped);
      setCropOpen(false);
      setCropUrl(null);
    }, 'image/jpeg', 0.9);
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
    if (cropUrl) URL.revokeObjectURL(cropUrl);
    setPendingFile(null);
    setCropUrl(null);
    setCropOpen(false);
    setMessage('');
    setError('');
  }

  return (
    <section className="avatar-editor" aria-labelledby="avatar-editor-title">
      <div className="avatar-editor__preview" role="img" aria-label={pendingFile ? 'Prévia da nova foto selecionada' : `Foto de perfil de ${displayName}`}>
        {previewUrl ? <img src={previewUrl} alt="Prévia da nova foto" /> : imageUrl ? <img src={imageUrl} alt={`Foto de perfil de ${displayName}`} /> : <span>{initials}</span>}
      </div>
      <div className="avatar-editor__content">
        <h2 id="avatar-editor-title">Sua foto de perfil</h2>
        <p>Escolha ou tire uma foto. Antes de enviar, você poderá recortar e enquadrar o rosto.</p>
        <input ref={inputRef} className="sr-only" type="file" accept="image/*" capture="environment" aria-label="Selecionar ou tirar uma foto de perfil" disabled={busy} onChange={(event) => { const file = event.currentTarget.files?.[0]; event.currentTarget.value = ''; void selectFile(file); }} />
        <button className="button button--outline" type="button" disabled={busy} onClick={() => inputRef.current?.click()}><Camera size={17} aria-hidden="true" /> {pendingFile ? 'Escolher outra foto' : imageUrl ? 'Trocar foto' : 'Escolher foto'}</button>
        {pendingFile && !cropOpen && <>
          <p className="avatar-editor__status" role="status">Prévia de “{pendingFile.name}”. A foto atual só será trocada após confirmar o envio.</p>
          <div className="avatar-editor__actions"><button className="button button--outline" type="button" disabled={busy} onClick={() => void uploadSelected()}>{busy ? 'Enviando…' : 'Enviar foto'}</button><button className="button button--outline" type="button" disabled={busy} onClick={cancelSelection}>Cancelar</button></div>
        </>}
        {message && <p className="avatar-editor__status" role="status">{message}</p>}
        {error && <p className="form-error" role="alert">{error}</p>}
      </div>
      {cropOpen && cropUrl && <div className="avatar-cropper" role="dialog" aria-modal="true" aria-labelledby="avatar-crop-title">
        <div className="avatar-cropper__panel">
          <div className="avatar-cropper__header"><h3 id="avatar-crop-title">Enquadre sua foto</h3><button type="button" aria-label="Cancelar recorte" onClick={cancelSelection}><X size={20} /></button></div>
          <p>Arraste a imagem para posicionar e use o zoom para enquadrar.</p>
          <canvas ref={canvasRef} width={CROP_SIZE} height={CROP_SIZE} className="avatar-cropper__canvas" onPointerDown={(event) => { event.currentTarget.setPointerCapture(event.pointerId); dragRef.current = { active: true, x: event.clientX, y: event.clientY }; }} onPointerMove={moveCrop} onPointerUp={() => { dragRef.current.active = false; }} onPointerCancel={() => { dragRef.current.active = false; }} />
          <label className="avatar-cropper__zoom">Zoom <input type="range" min="1" max="3" step="0.01" value={zoom} onChange={(event) => setZoom(Number(event.target.value))} /></label>
          <p className="avatar-cropper__hint"><Move size={15} /> Arraste para ajustar o enquadramento</p>
          <div className="avatar-cropper__actions"><button className="button button--outline" type="button" onClick={cancelSelection}>Cancelar</button><button className="button" type="button" onClick={confirmCrop}><Check size={17} /> Usar esta foto</button></div>
        </div>
      </div>}
    </section>
  );
}
