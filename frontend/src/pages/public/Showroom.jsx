import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { listPublicVehicles } from '../../api/vehicles';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { Card } from '../../components/ui/Card';

const emptyFilters = { make: '', model: '', minPrice: '', maxPrice: '', year: '' };

function CardSkeleton() {
  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      <div className="aspect-[4/3] bg-muted animate-pulse" />
      <div className="p-4 flex flex-col gap-2">
        <div className="h-4 w-3/4 bg-muted rounded animate-pulse" />
        <div className="h-4 w-1/2 bg-muted rounded animate-pulse" />
        <div className="h-3 w-2/3 bg-muted rounded animate-pulse" />
      </div>
    </div>
  );
}

export default function Showroom() {
  const { tenantSlug } = useParams();
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState(emptyFilters);

  async function loadVehicles(activeFilters) {
    setLoading(true);
    setError('');
    try {
      const cleaned = Object.fromEntries(
        Object.entries(activeFilters).filter(([, v]) => v !== '')
      );
      const data = await listPublicVehicles(tenantSlug, cleaned);
      setVehicles(data);
    } catch (err) {
      setError('Dealership not found or inventory unavailable');
      setVehicles([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadVehicles(filters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantSlug]);

  function handleFilterChange(field, value) {
    setFilters((f) => ({ ...f, [field]: value }));
  }

  function handleSearch(e) {
    e.preventDefault();
    loadVehicles(filters);
  }

  function handleClear() {
    setFilters(emptyFilters);
    loadVehicles(emptyFilters);
  }

  const hasActiveFilters = Object.values(filters).some((v) => v !== '');

  return (
    <div className="min-h-screen bg-muted">
      <header className="bg-white border-b border-border">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <h1 className="text-2xl font-semibold">Vehicle Inventory</h1>
          <p className="text-sm text-muted-foreground mt-1">Search our current lineup below.</p>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <form onSubmit={handleSearch} className="bg-white border border-border rounded-lg p-4 mb-6 flex flex-wrap gap-3 items-end">
          <div className="flex flex-col gap-1 w-36">
            <label className="text-xs font-medium text-muted-foreground">Make</label>
            <Input value={filters.make} onChange={(e) => handleFilterChange('make', e.target.value)} placeholder="Any" />
          </div>
          <div className="flex flex-col gap-1 w-36">
            <label className="text-xs font-medium text-muted-foreground">Model</label>
            <Input value={filters.model} onChange={(e) => handleFilterChange('model', e.target.value)} placeholder="Any" />
          </div>
          <div className="flex flex-col gap-1 w-32">
            <label className="text-xs font-medium text-muted-foreground">Min Price</label>
            <Input type="number" value={filters.minPrice} onChange={(e) => handleFilterChange('minPrice', e.target.value)} placeholder="$0" />
          </div>
          <div className="flex flex-col gap-1 w-32">
            <label className="text-xs font-medium text-muted-foreground">Max Price</label>
            <Input type="number" value={filters.maxPrice} onChange={(e) => handleFilterChange('maxPrice', e.target.value)} placeholder="No limit" />
          </div>
          <div className="flex flex-col gap-1 w-28">
            <label className="text-xs font-medium text-muted-foreground">Year</label>
            <Input type="number" value={filters.year} onChange={(e) => handleFilterChange('year', e.target.value)} placeholder="Any" />
          </div>
          <div className="flex gap-2">
            <Button type="submit">Search</Button>
            {hasActiveFilters && (
              <Button type="button" variant="ghost" onClick={handleClear}>Clear</Button>
            )}
          </div>
        </form>

        {!loading && !error && (
          <p className="text-sm text-muted-foreground mb-4">
            {vehicles.length} {vehicles.length === 1 ? 'vehicle' : 'vehicles'} found
          </p>
        )}

        {error && (
          <div className="text-center py-16">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {!error && loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => <CardSkeleton key={i} />)}
          </div>
        )}

        {!loading && !error && vehicles.length === 0 && (
          <div className="text-center py-16">
            <p className="text-sm font-medium">No vehicles match your search</p>
            <p className="text-xs text-muted-foreground mt-1">Try adjusting or clearing your filters.</p>
            {hasActiveFilters && <Button variant="secondary" className="mt-4" onClick={handleClear}>Clear filters</Button>}
          </div>
        )}

        {!loading && !error && vehicles.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {vehicles.map((v) => (
              <Card key={v.id} className="overflow-hidden transition-shadow hover:shadow-md">
                <div className="aspect-[4/3] bg-muted overflow-hidden">
                  <img
                    src={v.images?.[0]?.url || '/placeholder-car.png'}
                    alt={`${v.year} ${v.make} ${v.model}`}
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                  />
                </div>
                <div className="p-4 flex flex-col gap-2">
                  <h3 className="font-semibold leading-tight">{v.year} {v.make} {v.model}</h3>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-semibold text-primary">${Number(v.price).toLocaleString()}</span>
                    <span className="text-sm text-muted-foreground">{Number(v.mileage).toLocaleString()} mi</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {v.trim && <Badge>{v.trim}</Badge>}
                    {v.transmission && <Badge>{v.transmission}</Badge>}
                    {v.drivetrain && <Badge>{v.drivetrain}</Badge>}
                    {v.body_style && <Badge>{v.body_style}</Badge>}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>

      <footer className="max-w-6xl mx-auto px-6 py-6 text-center">
        <Link to="/admin/login" className="text-xs text-muted-foreground hover:text-foreground">
          Dealer login
        </Link>
      </footer>
    </div>
  );
}
