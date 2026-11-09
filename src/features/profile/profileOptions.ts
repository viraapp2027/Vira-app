import type { Intention } from '../../types/profile';

export const INTENTION_OPTIONS: ReadonlyArray<{ value: Intention; label: string; description: string }> = [
  { value: 'friendship', label: 'Fazer amizades', description: 'Conhecer gente nova e ampliar o círculo.' },
  { value: 'relationship', label: 'Procurar relacionamento', description: 'Encontrar alguém com objetivos compatíveis.' },
  { value: 'outings', label: 'Encontrar companhia para passeios', description: 'Combinar programas e descobrir lugares.' },
  { value: 'communities', label: 'Participar de comunidades', description: 'Compartilhar interesses em comum.' },
];

export const INTEREST_OPTIONS = [
  'Futebol', 'Música', 'Cinema', 'Games', 'Tecnologia', 'Viagens',
  'Gastronomia', 'Pets', 'Atividades físicas', 'Leitura', 'Fotografia', 'Natureza',
] as const;

export const BRAZILIAN_STATES = [
  ['AC', 'Acre'], ['AL', 'Alagoas'], ['AP', 'Amapá'], ['AM', 'Amazonas'],
  ['BA', 'Bahia'], ['CE', 'Ceará'], ['DF', 'Distrito Federal'], ['ES', 'Espírito Santo'],
  ['GO', 'Goiás'], ['MA', 'Maranhão'], ['MT', 'Mato Grosso'], ['MS', 'Mato Grosso do Sul'],
  ['MG', 'Minas Gerais'], ['PA', 'Pará'], ['PB', 'Paraíba'], ['PR', 'Paraná'],
  ['PE', 'Pernambuco'], ['PI', 'Piauí'], ['RJ', 'Rio de Janeiro'], ['RN', 'Rio Grande do Norte'],
  ['RS', 'Rio Grande do Sul'], ['RO', 'Rondônia'], ['RR', 'Roraima'], ['SC', 'Santa Catarina'],
  ['SP', 'São Paulo'], ['SE', 'Sergipe'], ['TO', 'Tocantins'],
] as const;

export function calculateAge(dateOfBirth: string | null, now = new Date()): number {
  if (!dateOfBirth) return 0;
  const birthDate = new Date(`${dateOfBirth}T00:00:00`);
  if (Number.isNaN(birthDate.getTime())) return 0;

  let age = now.getFullYear() - birthDate.getFullYear();
  const monthDifference = now.getMonth() - birthDate.getMonth();
  if (monthDifference < 0 || (monthDifference === 0 && now.getDate() < birthDate.getDate())) age -= 1;
  return age;
}

export function isAdult(dateOfBirth: string | null, now = new Date()): boolean {
  if (!dateOfBirth || calculateAge(dateOfBirth, now) < 18) return false;
  return new Date(`${dateOfBirth}T00:00:00`).getTime() <= now.getTime();
}
