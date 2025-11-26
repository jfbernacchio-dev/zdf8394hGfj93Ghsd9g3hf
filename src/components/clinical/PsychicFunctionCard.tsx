/**
 * ============================================================================
 * FASE C2.5A - PsychicFunctionCard Component
 * ============================================================================
 * 
 * Componente wrapper para cards de funções psíquicas.
 * Fornece estrutura consistente para todas as 12 funções.
 */

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

interface PsychicFunctionCardProps {
  number: number;
  title: string;
  description: string;
  children: React.ReactNode;
}

export function PsychicFunctionCard({ number, title, description, children }: PsychicFunctionCardProps) {
  return (
    <Card>
      <CardHeader className="p-4 pb-3">
        <CardTitle className="text-lg">{number}. {title}</CardTitle>
        <CardDescription className="text-xs">{description}</CardDescription>
      </CardHeader>
      <CardContent className="p-4 pt-0 space-y-4">
        {children}
      </CardContent>
    </Card>
  );
}
