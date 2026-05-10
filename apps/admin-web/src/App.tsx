import { Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Bookings } from './pages/Bookings';
import { BookingDetail } from './pages/BookingDetail';
import { CarTypes } from './pages/CarTypes';
import { Dashboard } from './pages/Dashboard';
import { DriverDetail } from './pages/DriverDetail';
import { Drivers } from './pages/Drivers';
import { PassengerDetail } from './pages/PassengerDetail';
import { Passengers } from './pages/Passengers';
import { Promos } from './pages/Promos';
import { Reports } from './pages/Reports';
import { Settings } from './pages/Settings';
import { Staff } from './pages/Staff';
import { Zones } from './pages/Zones';
import { EmptyState } from './components/ui';

export function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="bookings" element={<Bookings />} />
        <Route path="bookings/:id" element={<BookingDetail />} />
        <Route path="drivers" element={<Drivers />} />
        <Route path="drivers/:id" element={<DriverDetail />} />
        <Route path="passengers" element={<Passengers />} />
        <Route path="passengers/:id" element={<PassengerDetail />} />
        <Route path="staff" element={<Staff />} />
        <Route path="car-types" element={<CarTypes />} />
        <Route path="zones" element={<Zones />} />
        <Route path="promos" element={<Promos />} />
        <Route path="reports" element={<Reports />} />
        <Route path="settings" element={<Settings />} />
        <Route
          path="*"
          element={
            <EmptyState
              title="Page not found"
              description="The page you tried to open does not exist."
            />
          }
        />
      </Route>
    </Routes>
  );
}
