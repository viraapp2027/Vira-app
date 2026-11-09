export function LoadingScreen({ message = 'Só um instante…' }: { message?: string }) {
  return (
    <main className="loading-screen" role="status" aria-live="polite">
      <span className="spinner" aria-hidden="true" />
      <p>{message}</p>
    </main>
  );
}
