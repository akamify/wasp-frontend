export function whatsappProfilePictureUrl(profile: any) {
  return String(profile?.profile_picture_url || profile?.profilePictureUrl || "").trim();
}
