'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface CouponFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedPartner: string | null;
  onPartnerChange: (partner: string | null) => void;
  partners: string[];
}

export function CouponFilters({
  searchQuery,
  onSearchChange,
  selectedPartner,
  onPartnerChange,
  partners,
}: CouponFiltersProps) {
  return (
    <Card>
      <CardContent className="pt-6 space-y-4">
        {/* Search */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Buscar
          </label>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Buscar cupones..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Partner Filter */}
        {partners.length > 0 && (
          <div>
            <label className="block text-sm font-medium mb-2">
              Empresa
            </label>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={selectedPartner === null ? 'default' : 'outline'}
                size="sm"
                onClick={() => onPartnerChange(null)}
              >
                Todos
              </Button>
              {partners.map((partner) => (
                <Button
                  key={partner}
                  variant={selectedPartner === partner ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => onPartnerChange(partner)}
                >
                  {partner}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Clear Filters */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            onPartnerChange(null);
            onSearchChange('');
          }}
          className="w-full"
        >
          Limpiar filtros
        </Button>
      </CardContent>
    </Card>
  );
}
