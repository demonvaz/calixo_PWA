'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface StoreFiltersProps {
  selectedCategory: string | null;
  onCategoryChange: (category: string | null) => void;
  selectedPremium: string | null;
  onPremiumChange: (premium: string | null) => void;
  priceRange: [number, number];
  onPriceRangeChange: (range: [number, number]) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

const categories = [
  { id: 'all', name: 'Todos', emoji: '' },
  { id: 'color', name: 'Colores', emoji: '' },
  { id: 'shirt', name: 'Camisetas', emoji: '' },
  { id: 'hat', name: 'Sombreros', emoji: '' },
  { id: 'glasses', name: 'Gafas', emoji: '' },
  { id: 'background', name: 'Fondos', emoji: '' },
  { id: 'accessories', name: 'Accesorios', emoji: '' },
];

export function StoreFilters({
  selectedCategory,
  onCategoryChange,
  selectedPremium,
  onPremiumChange,
  searchQuery,
  onSearchChange,
}: StoreFiltersProps) {
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
            placeholder="Buscar items..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Category Filter */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Categoría
          </label>
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <Button
                key={cat.id}
                variant={selectedCategory === (cat.id === 'all' ? null : cat.id) ? 'default' : 'outline'}
                size="sm"
                onClick={() => onCategoryChange(cat.id === 'all' ? null : cat.id)}
              >
                {cat.name}
              </Button>
            ))}
          </div>
        </div>

        {/* Premium Filter */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Tipo
          </label>
          <div className="flex gap-2">
            <Button
              variant={selectedPremium === null ? 'default' : 'outline'}
              size="sm"
              onClick={() => onPremiumChange(null)}
            >
              Todos
            </Button>
            <Button
              variant={selectedPremium === 'false' ? 'default' : 'outline'}
              size="sm"
              onClick={() => onPremiumChange('false')}
            >
              Gratis/Regular
            </Button>
            <Button
              variant={selectedPremium === 'true' ? 'default' : 'outline'}
              size="sm"
              onClick={() => onPremiumChange('true')}
            >
              Premium
            </Button>
          </div>
        </div>

        {/* Clear Filters */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            onCategoryChange(null);
            onPremiumChange(null);
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






