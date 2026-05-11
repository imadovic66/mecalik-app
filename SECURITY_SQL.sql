-- =============================================
-- ENABLE RLS ON BOOKINGS
-- =============================================
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "clients_select_own" ON bookings;
DROP POLICY IF EXISTS "clients_insert_own" ON bookings;
DROP POLICY IF EXISTS "guest_insert_booking" ON bookings;
DROP POLICY IF EXISTS "fleet_select_company" ON bookings;
DROP POLICY IF EXISTS "mechanic_select_assigned" ON bookings;
DROP POLICY IF EXISTS "mechanic_update_assigned" ON bookings;
DROP POLICY IF EXISTS "admin_all" ON bookings;

-- Clients: read only their own bookings
CREATE POLICY "clients_select_own" ON bookings
  FOR SELECT USING (auth.uid() = user_id);

-- Clients: create their own bookings
CREATE POLICY "clients_insert_own" ON bookings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Guests: insert bookings without a user account (user_id must be NULL)
CREATE POLICY "guest_insert_booking" ON bookings
  FOR INSERT WITH CHECK (user_id IS NULL);

-- Fleet managers: read their company bookings
CREATE POLICY "fleet_select_company" ON bookings
  FOR SELECT USING (
    company_id IS NOT NULL AND
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid() AND company_id IS NOT NULL
    )
  );

-- Mechanics: read all bookings (they need to see assigned jobs)
CREATE POLICY "mechanic_select_assigned" ON bookings
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'mechanic')
  );

-- Mechanics: update bookings (to change status)
CREATE POLICY "mechanic_update_assigned" ON bookings
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'mechanic')
  );

-- Admins: full access
CREATE POLICY "admin_all" ON bookings
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- =============================================
-- ENABLE RLS ON PROFILES
-- =============================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_select_own" ON profiles;
DROP POLICY IF EXISTS "users_update_own" ON profiles;
DROP POLICY IF EXISTS "admin_all_profiles" ON profiles;

-- Users: read own profile
CREATE POLICY "users_select_own" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Users: update own profile
CREATE POLICY "users_update_own" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Admins: full access to all profiles
CREATE POLICY "admin_all_profiles" ON profiles
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );
