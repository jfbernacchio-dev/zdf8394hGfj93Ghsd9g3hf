/**
 * 🧪 TESTES UNITÁRIOS: MetricsWebsiteCTRCard
 * 
 * @phase C3-R.3 - Testes Unitários
 */

import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { MetricsWebsiteCTRCard } from '../marketing/MetricsWebsiteCTRCard';

describe('MetricsWebsiteCTRCard', () => {
  const mockProps = {
    isLoading: false
  };

  it('renderiza taxa CTR (mockado)', () => {
    const { container } = render(<MetricsWebsiteCTRCard {...mockProps} />);
    expect(container.textContent).toMatch(/%/); // Deve ter alguma porcentagem
  });

  it('mostra skeleton quando isLoading=true', () => {
    const { container } = render(<MetricsWebsiteCTRCard isLoading={true} />);
    expect(container.querySelector('.animate-pulse')).toBeTruthy();
  });
});
