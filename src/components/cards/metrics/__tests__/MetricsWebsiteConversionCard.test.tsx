/**
 * 🧪 TESTES UNITÁRIOS: MetricsWebsiteConversionCard
 * 
 * @phase C3-R.3 - Testes Unitários
 */

import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { MetricsWebsiteConversionCard } from '../marketing/MetricsWebsiteConversionCard';

describe('MetricsWebsiteConversionCard', () => {
  const mockProps = {
    isLoading: false
  };

  it('renderiza taxa de conversão (mockado)', () => {
    const { container } = render(<MetricsWebsiteConversionCard {...mockProps} />);
    expect(container.textContent).toMatch(/%/); // Deve ter alguma porcentagem
  });

  it('mostra skeleton quando isLoading=true', () => {
    const { container } = render(<MetricsWebsiteConversionCard isLoading={true} />);
    expect(container.querySelector('.animate-pulse')).toBeTruthy();
  });
});
