import { useEffect, useMemo, useState } from 'react';
import { listMyVehicles } from '../../api/vehicles';
import { useAuth } from '../../context/AuthContext';
import VehicleForm from './VehicleForm';
import { Card, CardContent } from '../../components/ui/Card';
import Button from '../../components/ui/Button';

function StatCard({ label, value }) {
  return (
    <Card>
      <CardContent className="py-4">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <p className="text-2xl font-semibold mt-1">{value}</p>
      </CardContent>
    </Card>
  );
}

function TableSkeleton() {
  return (
    <div className="p-6 flex flex-col gap-3">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="h-9 bg-muted rounded-md animate-pulse" />
      ))}
    </div>
  );
}

export default function Dashboard() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const { logout } = useAuth();

  async function loadVehicles() {
    setLoading(true);
    setError('');
    try {
      const data = await listMyVehicles();
      setVehicles(data);
    } catch (err) {
      setError('Failed to load inventory');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadVehicles();
  }, []);

  const stats = useMemo(() => {
    if (vehicles.length === 0) return { count: 0, totalValue: 0, avgMileage: 0 };
    const totalValue = vehicles.reduce((sum, v) => sum + Number(v.price), 0);
    const avgMileage = vehicles.reduce((sum, v) => sum + Number(v.mileage), 0) / vehicles.length;
    return { count: vehicles.length, totalValue, avgMileage: Math.round(avgMileage) };
  }, [vehicles]);

  function openAddForm() {
    setEditingVehicle(null);
    setShowAddForm((s) => !s);
  }

  function openEditForm(vehicle) {
    setShowAddForm(false);
    setEditingVehicle(vehicle);
  }

  function closeForms() {
    setShowAddForm(false);
    setEditingVehicle(null);
    loadVehicles();
  }

  return (
    <div className="min-h-screen bg-muted">
      <header className="bg-white border-b border-border sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold">Inventory Dashboard</h1>
            <p className="text-xs text-muted-foreground">Manage your dealership's vehicle listings</p>
          </div>
          <div className="flex gap-2">
            <Button variant={showAddForm ? 'secondary' : 'primary'} onClick={openAddForm}>
              {showAddForm ? 'Close' : '+ Add Vehicle'}
            </Button>
            <Button variant="ghost" onClick={logout}>Logout</Button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8 flex flex-col gap-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard label="Vehicles in stock" value={stats.count} />
          <StatCard label="Total inventory value" value={`$${stats.totalValue.toLocaleString()}`} />
          <StatCard label="Average mileage" value={`${stats.avgMileage.toLocaleString()} mi`} />
        </div>

        {showAddForm && <VehicleForm onSaved={closeForms} />}
        {editingVehicle && <VehicleForm vehicle={editingVehicle} onSaved={closeForms} />}

        <Card>
          <CardContent className="p-0">
            {loading && <TableSkeleton />}
            {error && (
              <div className="p-6 flex flex-col items-start gap-3">
                <p className="text-sm text-destructive">{error}</p>
                <Button variant="secondary" onClick={loadVehicles}>Retry</Button>
              </div>
            )}
            {!loading && !error && vehicles.length === 0 && (
              <div className="p-10 text-center">
                <p className="text-sm font-medium">No vehicles yet</p>
                <p className="text-xs text-muted-foreground mt-1">Add your first vehicle to get it listed on your public showroom.</p>
                <Button className="mt-4" onClick={openAddForm}>+ Add Vehicle</Button>
              </div>
            )}
            {!loading && !error && vehicles.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-muted-foreground">
                      <th className="px-6 py-3 font-medium">Stock #</th>
                      <th className="px-6 py-3 font-medium">Year</th>
                      <th className="px-6 py-3 font-medium">Make</th>
                      <th className="px-6 py-3 font-medium">Model</th>
                      <th className="px-6 py-3 font-medium">Price</th>
                      <th className="px-6 py-3 font-medium">Mileage</th>
                      <th className="px-6 py-3 font-medium"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {vehicles.map((v) => (
                      <tr key={v.id} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
                        <td className="px-6 py-3 font-medium">{v.stock_number}</td>
                        <td className="px-6 py-3">{v.year}</td>
                        <td className="px-6 py-3">{v.make}</td>
                        <td className="px-6 py-3">{v.model}</td>
                        <td className="px-6 py-3">${Number(v.price).toLocaleString()}</td>
                        <td className="px-6 py-3">{Number(v.mileage).toLocaleString()} mi</td>
                        <td className="px-6 py-3 text-right">
                          <Button variant="ghost" className="px-2 py-1" onClick={() => openEditForm(v)}>
                            Edit
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
