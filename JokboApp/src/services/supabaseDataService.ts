import { getSupabaseClient, isSupabaseConnected } from '../config/supabaseClient';
import { UserProfile } from '../types/auth';
import { FamilyMember, EstablishedLink, SmartKinshipRequest } from '../types/family';

/**
 * [Supabase 클라우드 DB 동기화 서비스]
 * PC와 스마트폰 간 실시간 양방향 데이터 동기화를 처리합니다.
 */

// 1. 회원 계정 동기화
export async function syncUserToSupabase(user: UserProfile & { password?: string }): Promise<{ success: boolean; message?: string }> {
  if (!isSupabaseConnected()) {
    return { success: false, message: 'Supabase가 아직 연결되지 않았습니다.' };
  }
  const client = getSupabaseClient();
  if (!client) return { success: false, message: 'Supabase 클라이언트 초기화 실패' };

  try {
    let inviteCode = user.clanInviteCode || '';
    if (user.pinCode) {
      inviteCode = `PIN:${user.pinCode}|BIO:${user.biometricKey || ''}`;
    }

    const row = {
      id: user.id,
      phone: user.phone,
      name: user.name,
      hanja: user.hanja || '',
      clan: user.clan || '',
      role: user.role || 'direct_family',
      role_label: user.roleLabel || '가문 직계 자손',
      password: user.password || 'password123!',
      birth_date: user.birthDate || '',
      father_name: user.fatherName || '',
      mother_name: user.motherName || '',
      clan_invite_code: inviteCode,
      security_tier: user.securityTier || '2단계(2FA 완료)',
      is_2fa_verified: user.is2FAVerified || false,
      updated_at: new Date().toISOString(),
    };

    const { error } = await client
      .from('jokbo_users')
      .upsert(row, { onConflict: 'id' });

    if (error) {
      console.error('Failed to sync user to Supabase:', error);
      return { success: false, message: error.message };
    }

    return { success: true };
  } catch (e: any) {
    console.error('Error syncing user:', e);
    return { success: false, message: e.message || '네트워크 오류' };
  }
}

// 2. 전화번호로 회원 계정 조회 (로그인 시 클라우드 조회)
export async function fetchUserFromSupabase(phone: string): Promise<(UserProfile & { password: string }) | null> {
  if (!isSupabaseConnected()) return null;
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const { data, error } = await client
      .from('jokbo_users')
      .select('*')
      .eq('phone', cleanPhone)
      .maybeSingle();

    if (error || !data) {
      return null;
    }

    let pinCode: string | undefined = undefined;
    let biometricKey: string | undefined = undefined;
    if (data.clan_invite_code && data.clan_invite_code.startsWith('PIN:')) {
      const parts = data.clan_invite_code.split('|BIO:');
      pinCode = parts[0].replace('PIN:', '');
      if (parts.length > 1 && parts[1]) {
        biometricKey = parts[1];
      }
    }

    return {
      id: data.id,
      memberId: `mem-${data.id}`,
      name: data.name,
      hanja: data.hanja,
      clan: data.clan,
      role: data.role,
      roleLabel: data.role_label,
      phone: data.phone,
      password: data.password,
      birthDate: data.birth_date,
      fatherName: data.father_name,
      motherName: data.mother_name,
      clanInviteCode: data.clan_invite_code,
      pinCode,
      biometricKey,
      securityTier: data.security_tier,
      is2FAVerified: data.is_2fa_verified,
      lastLoginAt: new Date().toISOString(),
      isCustomRegistered: true,
    };
  } catch (e) {
    console.error('Error fetching user from Supabase:', e);
    return null;
  }
}

// 3. 가계도 트리 전체 동기화 (저장)
export async function syncFamilyTreeToSupabase(userId: string, members: FamilyMember[]): Promise<{ success: boolean; message?: string }> {
  if (!isSupabaseConnected() || !userId) return { success: false };
  const client = getSupabaseClient();
  if (!client) return { success: false };

  try {
    const rows = members.map((m) => ({
      id: m.id,
      user_id: userId,
      name: m.name,
      hanja: m.hanja || '',
      birth_year: m.birthDate || '',
      generation: m.generation,
      gender: m.gender,
      lineage: m.lineage,
      is_alive: m.isAlive,
      phone: m.phone || '',
      parent_ids: m.parentIds || [],
      spouse_id: m.spouseId || null,
      kinship_title: m.relationship || '',
      photo_url: m.photoUrl || '',
      is_p2p_connected: m.isVerifiedLineage || false,
      p2p_verified_at: m.elderApprovedDate || '',
      updated_at: new Date().toISOString(),
    }));

    const { error } = await client
      .from('jokbo_family_members')
      .upsert(rows, { onConflict: 'id' });

    if (error) {
      console.error('Failed to sync family members to Supabase:', error);
      return { success: false, message: error.message };
    }

    return { success: true };
  } catch (e: any) {
    console.error('Error syncing family tree:', e);
    return { success: false, message: e.message };
  }
}

// 4. 가계도 트리 전체 조회 (불러오기)
export async function fetchFamilyTreeFromSupabase(userId: string): Promise<FamilyMember[] | null> {
  if (!isSupabaseConnected() || !userId) return null;
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const { data, error } = await client
      .from('jokbo_family_members')
      .select('*')
      .eq('user_id', userId);

    if (error || !data || data.length === 0) return null;

    return data.map((d: any) => ({
      id: d.id,
      name: d.name,
      hanja: d.hanja,
      gender: d.gender,
      generation: d.generation,
      lineage: d.lineage,
      relationship: d.kinship_title || '친족',
      isAlive: d.is_alive,
      birthDate: d.birth_year,
      phone: d.phone,
      parentIds: d.parent_ids || [],
      spouseId: d.spouse_id,
      photoUrl: d.photo_url,
      isVerifiedLineage: d.is_p2p_connected,
      isElderApproved: Boolean(d.p2p_verified_at),
      elderApprovedDate: d.p2p_verified_at,
    }));
  } catch (e) {
    console.error('Error fetching family tree from Supabase:', e);
    return null;
  }
}

// 5. 결연 이력 동기화 (저장)
export async function syncEstablishedLinksToSupabase(userId: string, links: EstablishedLink[]): Promise<{ success: boolean; message?: string }> {
  if (!isSupabaseConnected() || !userId) return { success: false };
  const client = getSupabaseClient();
  if (!client) return { success: false };

  try {
    const rows = links.map((l) => ({
      id: l.id,
      user_id: userId,
      member_a_id: l.personAId,
      member_b_id: l.personBId,
      relation_type: l.relationType,
      kinship_title: l.note || '',
      alliance_source: l.formationMode || 'centralized',
      elder_approval_status: l.status === 'approved' ? 'approved' : 'none',
      approved_by_elder_name: l.approverElderId || '',
      approved_at: l.establishedDate || new Date().toISOString(),
      created_at: new Date().toISOString(),
    }));

    const { error } = await client
      .from('jokbo_established_links')
      .upsert(rows, { onConflict: 'id' });

    if (error) {
      console.error('Failed to sync links to Supabase:', error);
      return { success: false, message: error.message };
    }

    return { success: true };
  } catch (e: any) {
    console.error('Error syncing established links:', e);
    return { success: false, message: e.message };
  }
}

// 6. 결연 이력 조회 (불러오기)
export async function fetchEstablishedLinksFromSupabase(userId: string): Promise<EstablishedLink[] | null> {
  if (!isSupabaseConnected() || !userId) return null;
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const { data, error } = await client
      .from('jokbo_established_links')
      .select('*')
      .eq('user_id', userId);

    if (error || !data || data.length === 0) return null;

    return data.map((d: any) => ({
      id: d.id,
      personAId: d.member_a_id,
      personBId: d.member_b_id,
      relationType: d.relation_type,
      establishedDate: d.approved_at || d.created_at,
      note: d.kinship_title,
      formationMode: d.alliance_source,
      status: d.elder_approval_status === 'approved' ? 'approved' : 'pending_elder',
      approverElderId: d.approved_by_elder_name,
    }));
  } catch (e) {
    console.error('Error fetching established links from Supabase:', e);
    return null;
  }
}

// 7. 스마트 형제/친족 결연 신청 동기화 (저장)
export async function syncSmartRequestsToSupabase(
  requests: SmartKinshipRequest[]
): Promise<{ success: boolean; message?: string }> {
  if (!isSupabaseConnected() || !requests || requests.length === 0) return { success: false };
  const client = getSupabaseClient();
  if (!client) return { success: false };

  try {
    const rows = requests.map((r) => ({
      id: r.id,
      sender_user_id: r.senderUserId,
      sender_member_id: r.senderMemberId,
      sender_name: r.senderName,
      sender_phone: r.senderPhone,
      sender_birth_date: r.senderBirthDate || '',
      sender_gender: r.senderGender || 'M',
      sender_father_name: r.senderFatherName || '',
      sender_mother_name: r.senderMotherName || '',
      sender_clan: r.senderClan || '',
      receiver_phone: r.receiverPhone,
      receiver_user_id: r.receiverUserId || null,
      relation_type: r.relationType,
      sibling_subtype: r.siblingSubtype || 'brother',
      sibling_subtype_label: r.siblingSubtypeLabel || '형제',
      status: r.status,
      father_matched: r.fatherMatched || false,
      mother_matched: r.motherMatched || false,
      match_score: r.matchScore || 0,
      certificate_no: r.certificateNo || '',
      note: r.note || '',
      created_at: r.createdAt || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));

    const { error } = await client
      .from('jokbo_smart_requests')
      .upsert(rows, { onConflict: 'id' });

    if (error) {
      console.error('Failed to sync smart requests to Supabase:', error);
      return { success: false, message: error.message };
    }
    return { success: true };
  } catch (e: any) {
    console.error('Error syncing smart requests:', e);
    return { success: false, message: e.message };
  }
}

// 8. 스마트 형제/친족 결연 신청 조회 (전화번호 기준)
export async function fetchSmartRequestsFromSupabase(
  phone: string
): Promise<SmartKinshipRequest[] | null> {
  if (!isSupabaseConnected() || !phone) return null;
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const { data, error } = await client
      .from('jokbo_smart_requests')
      .select('*')
      .or(`receiver_phone.eq.${cleanPhone},sender_phone.eq.${cleanPhone}`);

    if (error || !data || data.length === 0) return null;

    return data.map((d: any) => ({
      id: d.id,
      senderUserId: d.sender_user_id,
      senderMemberId: d.sender_member_id,
      senderName: d.sender_name,
      senderPhone: d.sender_phone,
      senderBirthDate: d.sender_birth_date,
      senderGender: d.sender_gender,
      senderFatherName: d.sender_father_name,
      senderMotherName: d.sender_mother_name,
      senderClan: d.sender_clan,
      receiverPhone: d.receiver_phone,
      receiverUserId: d.receiver_user_id,
      relationType: d.relation_type,
      siblingSubtype: d.sibling_subtype,
      siblingSubtypeLabel: d.sibling_subtype_label,
      status: d.status,
      createdAt: d.created_at,
      fatherMatched: d.father_matched,
      motherMatched: d.mother_matched,
      matchScore: d.match_score,
      certificateNo: d.certificate_no,
      note: d.note,
    }));
  } catch (e) {
    console.error('Error fetching smart requests from Supabase:', e);
    return null;
  }
}
