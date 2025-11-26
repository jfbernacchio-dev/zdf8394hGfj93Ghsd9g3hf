/**
 * ============================================================================
 * FASE C2.5A - CheckboxGroup Component
 * ============================================================================
 * 
 * Componente reutilizável para grupos de checkboxes.
 * Usado em várias funções psíquicas.
 */

import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

interface CheckboxOption {
  id: string;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

interface CheckboxGroupProps {
  label: string;
  options: CheckboxOption[];
  columns?: 1 | 2 | 3;
}

export function CheckboxGroup({ label, options, columns = 2 }: CheckboxGroupProps) {
  const gridClass = columns === 1 ? 'grid-cols-1' : columns === 3 ? 'grid-cols-3' : 'grid-cols-2';
  
  return (
    <div className="space-y-3">
      <Label>{label}</Label>
      <div className={`grid ${gridClass} gap-3`}>
        {options.map((option) => (
          <div key={option.id} className="flex items-center space-x-2">
            <Checkbox
              id={option.id}
              checked={option.checked}
              onCheckedChange={(checked) => option.onChange(checked as boolean)}
            />
            <label htmlFor={option.id} className="text-sm cursor-pointer">
              {option.label}
            </label>
          </div>
        ))}
      </div>
    </div>
  );
}
