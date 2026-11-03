import { snakeCase } from './data-source.js';

describe('snakeCase', () => {
  it.each([
    ['fechaHoraLabrado', 'fecha_hora_labrado'],
    ['conductaACorregir', 'conducta_a_corregir'],
    ['auth0Id', 'auth0_id'],
    ['anio', 'anio'],
  ])('%s -> %s', (input, expected) => {
    expect(snakeCase(input)).toBe(expected);
  });
});
