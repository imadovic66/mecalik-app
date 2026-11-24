-- ═══════════════════════════════════════════════════════
-- RLS SECURITY POLICIES — run in Supabase SQL editor
-- ═══════════════════════════════════════════════════════

-- ── BOOKINGS TABLE ──────────────────────────────────────

ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Clients read only their own bookings
CREATE POLICY "clients_read_own_bookings" ON bookings
  FOR SELECT USING (auth.uid() = user_id);

-- Clients insert only their own bookings
CREATE POLICY "clients_insert_own_bookings" ON bookings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Clients update only their own bookings
CREATE POLICY "clients_update_own_bookings" ON bookings
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Fleet managers read their company's bookings
CREATE POLICY "fleet_read_company_bookings" ON bookings
  FOR SELECT USING (
    company_id IS NOT NULL AND
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Mechanics read all bookings (to see assigned jobs)
CREATE POLICY "mechanic_read_assigned_bookings" ON bookings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'mechanic'
    )
  );

-- Mechanics update status of bookings (for job progress)
CREATE POLICY "mechanic_update_assigned_bookings" ON bookings
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'mechanic'
    )
  );

-- Admins have full access via JWT (service role bypasses RLS automatically)
CREATE POLICY "admin_all_bookings" ON bookings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ── PROFILES TABLE ──────────────────────────────────────

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Users read their own profile
CREATE POLICY "users_read_own_profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Users update their own profile
CREATE POLICY "users_update_own_profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Admins full access to all profiles
CREATE POLICY "admin_read_all_profiles" ON profiles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
