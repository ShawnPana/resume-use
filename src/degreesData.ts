// Common degree types
export interface Degree {
  abbreviation: string;
  fullName: string;
  level: 'associate' | 'bachelor' | 'master' | 'doctoral' | 'professional';
}

export const degreesData: Degree[] = [
  // Associate Degrees
  { abbreviation: "A.A.", fullName: "Associate of Arts", level: "associate" },
  { abbreviation: "A.S.", fullName: "Associate of Science", level: "associate" },
  { abbreviation: "A.E.", fullName: "Associate of Engineering", level: "associate" },

  // Bachelor's Degrees
  { abbreviation: "B.A.", fullName: "Bachelor of Arts", level: "bachelor" },
  { abbreviation: "B.S.", fullName: "Bachelor of Science", level: "bachelor" },
  { abbreviation: "B.E.", fullName: "Bachelor of Engineering", level: "bachelor" },

  // Master's Degrees
  { abbreviation: "M.A.", fullName: "Master of Arts", level: "master" },
  { abbreviation: "M.S.", fullName: "Master of Science", level: "master" },
  { abbreviation: "M.E.", fullName: "Master of Engineering", level: "master" },
  { abbreviation: "M.B.A.", fullName: "Master of Business Administration", level: "master" },
  { abbreviation: "M.F.A.", fullName: "Master of Fine Arts", level: "master" },
  { abbreviation: "M.Ed.", fullName: "Master of Education", level: "master" },
  { abbreviation: "M.S.W.", fullName: "Master of Social Work", level: "master" },
  { abbreviation: "M.P.H.", fullName: "Master of Public Health", level: "master" },
  { abbreviation: "M.P.A.", fullName: "Master of Public Administration", level: "master" },
  { abbreviation: "M.P.P.", fullName: "Master of Public Policy", level: "master" },
  { abbreviation: "M.Arch.", fullName: "Master of Architecture", level: "master" },
  { abbreviation: "M.L.S.", fullName: "Master of Library Science", level: "master" },
  { abbreviation: "M.M.", fullName: "Master of Music", level: "master" },
  { abbreviation: "M.Div.", fullName: "Master of Divinity", level: "master" },
  { abbreviation: "LL.M.", fullName: "Master of Laws", level: "master" },
  { abbreviation: "M.Tech.", fullName: "Master of Technology", level: "master" },
  { abbreviation: "M.Des.", fullName: "Master of Design", level: "master" },
  { abbreviation: "M.Phil.", fullName: "Master of Philosophy", level: "master" },

  // Doctoral Degrees
  { abbreviation: "Ph.D.", fullName: "Doctor of Philosophy", level: "doctoral" },
  { abbreviation: "Ed.D.", fullName: "Doctor of Education", level: "doctoral" },
  { abbreviation: "D.B.A.", fullName: "Doctor of Business Administration", level: "doctoral" },
  { abbreviation: "D.Eng.", fullName: "Doctor of Engineering", level: "doctoral" },
  { abbreviation: "D.Sc.", fullName: "Doctor of Science", level: "doctoral" },
  { abbreviation: "Psy.D.", fullName: "Doctor of Psychology", level: "doctoral" },
  { abbreviation: "D.P.H.", fullName: "Doctor of Public Health", level: "doctoral" },
  { abbreviation: "D.M.A.", fullName: "Doctor of Musical Arts", level: "doctoral" },
  { abbreviation: "D.F.A.", fullName: "Doctor of Fine Arts", level: "doctoral" },
  { abbreviation: "D.Min.", fullName: "Doctor of Ministry", level: "doctoral" },
  { abbreviation: "D.S.W.", fullName: "Doctor of Social Work", level: "doctoral" },
  { abbreviation: "D.Litt.", fullName: "Doctor of Letters", level: "doctoral" },

  // Professional Degrees
  { abbreviation: "M.D.", fullName: "Doctor of Medicine", level: "professional" },
  { abbreviation: "J.D.", fullName: "Juris Doctor", level: "professional" },
  { abbreviation: "D.D.S.", fullName: "Doctor of Dental Surgery", level: "professional" },
  { abbreviation: "D.M.D.", fullName: "Doctor of Dental Medicine", level: "professional" },
  { abbreviation: "D.V.M.", fullName: "Doctor of Veterinary Medicine", level: "professional" },
  { abbreviation: "Pharm.D.", fullName: "Doctor of Pharmacy", level: "professional" },
  { abbreviation: "D.O.", fullName: "Doctor of Osteopathic Medicine", level: "professional" },
  { abbreviation: "O.D.", fullName: "Doctor of Optometry", level: "professional" },
  { abbreviation: "D.P.M.", fullName: "Doctor of Podiatric Medicine", level: "professional" },
  { abbreviation: "D.C.", fullName: "Doctor of Chiropractic", level: "professional" },
  { abbreviation: "D.N.P.", fullName: "Doctor of Nursing Practice", level: "professional" },
  { abbreviation: "D.P.T.", fullName: "Doctor of Physical Therapy", level: "professional" },
];

// Search degrees by abbreviation or full name
export function searchDegrees(query: string): Degree[] {
  if (!query || query.length < 1) return [];

  const lowerQuery = query.toLowerCase();
  return degreesData.filter(degree =>
    degree.abbreviation.toLowerCase().includes(lowerQuery) ||
    degree.fullName.toLowerCase().includes(lowerQuery)
  ).slice(0, 8); // Return max 8 results
}