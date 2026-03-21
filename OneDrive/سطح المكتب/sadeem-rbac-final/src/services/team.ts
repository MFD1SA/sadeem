import { supabase } from '@/lib/supabase';
import type { DbMembership, DbUser } from '@/types/database';

export interface TeamMemberRow {
  membership: DbMembership;
  user: DbUser;
}

export const teamService = {
  async listMembers(organizationId: string): Promise<TeamMemberRow[]> {
    const { data: membershipsData, error: memErr } = await supabase
      .from('memberships')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: true });

    if (memErr) throw memErr;
    const memberships = (membershipsData || []) as DbMembership[];
    if (memberships.length === 0) return [];

    const userIds = memberships.map(m => m.user_id);
    const { data: usersData, error: usrErr } = await supabase
      .from('users')
      .select('*')
      .in('id', userIds);

    if (usrErr) throw usrErr;
    const users = (usersData || []) as DbUser[];

    const userMap = new Map<string, DbUser>();
    for (const u of users) {
      userMap.set(u.id, u);
    }

    const results: TeamMemberRow[] = [];
    for (const m of memberships) {
      const u = userMap.get(m.user_id);
      if (u) {
        results.push({ membership: m, user: u });
      }
    }
    return results;
  },
};
