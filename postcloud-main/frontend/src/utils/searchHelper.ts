function getSearchVariants(text: string): string[] {
  if (!text) return [];
  const norm = text.trim().toLowerCase();
  const variants = new Set<string>();
  variants.add(norm);
  variants.add(norm.replace(/[\s\-_/.,]+/g, ''));

  // Phonetic variations commonly typed by users:
  // ee <-> i, oo <-> u, w <-> v, sh <-> s
  const p1 = norm
    .replace(/ee/g, 'i')
    .replace(/oo/g, 'u')
    .replace(/w/g, 'v')
    .replace(/sh/g, 's')
    .replace(/aa/g, 'a');
  variants.add(p1);
  variants.add(p1.replace(/[\s\-_/.,]+/g, ''));

  const p2 = norm
    .replace(/w/g, 'v')
    .replace(/v/g, 'w');
  variants.add(p2);
  variants.add(p2.replace(/[\s\-_/.,]+/g, ''));

  return Array.from(variants).filter((v) => v.length > 0);
}

export function matchesSearch(voter: any, query?: string): boolean {
  if (!query || !query.trim()) return true;

  const queryVariants = getSearchVariants(query);

  const tokens = (voter.searchTokens || '').toLowerCase();
  const tokensCompact = tokens.replace(/[\s\-_/.,]+/g, '');

  const combined = [
    voter.firstName,
    voter.lastName,
    voter.englishName,
    voter.englishFirstName,
    voter.englishLastName,
    voter.previousAddress,
    voter.englishRelative,
    voter.electionID,
    voter.houseNumber,
    voter.wardNumber,
    voter.partNumber,
    voter.wardPart,
    voter.areaName,
    voter.village,
    voter.panchayat,
    voter.mobileNumber
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  const combinedCompact = combined.replace(/[\s\-_/.,]+/g, '');

  for (const q of queryVariants) {
    if (tokens.includes(q) || tokensCompact.includes(q)) return true;
    if (combined.includes(q) || combinedCompact.includes(q)) return true;
  }

  return false;
}

