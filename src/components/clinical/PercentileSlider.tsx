/**
 * ============================================================================
 * FASE C2.5A - PercentileSlider Component
 * ============================================================================
 * 
 * Componente reutilizável para sliders percentis (0 a 100).
 * Usado para: atenção, memória, orientação, inteligência, personalidade.
 */

import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';

interface PercentileSliderProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  description?: string;
  id?: string;
}

export function PercentileSlider({ label, value, onChange, description, id }: PercentileSliderProps) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <Label htmlFor={id}>{label}</Label>
        <span className="text-sm font-medium">{value}</span>
      </div>
      <Slider
        id={id}
        value={[value]}
        onValueChange={(v) => onChange(v[0])}
        min={0}
        max={100}
        step={1}
        className="py-2"
      />
      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
    </div>
  );
}
