const insertPayload: Record<string, unknown> = {
  owner_user_id: userId,
  name: input.name,
  slug,
  industry: input.industry,
  country: input.country,
  city: input.city,
  logo_url: input.logoUrl || null,
};

const { data: org, error: orgErr } = await supabase
  .from('organizations')
  .insert(insertPayload)
  .select()
  .single();

if (orgErr || !org) {
  throw orgErr || new Error('Failed to create organization');
}

const created = org as DbOrganization;

const { data: mem, error: memErr } = await supabase
  .from('memberships')
  .insert({
    user_id: userId,
    organization_id: created.id,
    role: 'owner',
    status: 'active',
  })
  .select()
  .single();

if (memErr || !mem) {
  throw memErr || new Error('Failed to create membership');
}

return created;
