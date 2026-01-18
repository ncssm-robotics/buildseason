/**
 * YPP (Youth Protection Program) utilities
 * Helper functions for age calculation, role validation, and YPP contact eligibility.
 */

/**
 * Calculate age from birthdate timestamp
 */
export function calculateAge(birthdate: number): number {
  const today = new Date();
  const birth = new Date(birthdate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

/**
 * Check if person is an adult (18+) based on birthdate
 */
export function isAdult(birthdate: number): boolean {
  return calculateAge(birthdate) >= 18;
}

/**
 * Check if person is a minor (<18) based on birthdate
 */
export function isMinor(birthdate: number): boolean {
  return calculateAge(birthdate) < 18;
}

/**
 * Valid team member roles
 */
export const TEAM_ROLES = {
  LEAD_MENTOR: "lead_mentor",
  MENTOR: "mentor",
  STUDENT: "student",
} as const;

export type TeamRole = (typeof TEAM_ROLES)[keyof typeof TEAM_ROLES];

/**
 * Check if role is a mentor role (lead_mentor or mentor)
 * Also handles legacy "admin" role for backwards compatibility
 */
export function isMentorRole(role: string): boolean {
  return (
    role === TEAM_ROLES.LEAD_MENTOR ||
    role === TEAM_ROLES.MENTOR ||
    role === "admin" // backwards compat: admin maps to lead_mentor
  );
}

/**
 * Check if member can be a YPP contact (must be adult mentor)
 */
export function canBeYppContact(
  role: string,
  birthdate: number | undefined
): boolean {
  if (!birthdate) return false;
  return isMentorRole(role) && isAdult(birthdate);
}

/**
 * Check if a year is a leap year.
 */
export function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

/**
 * Check if today is someone's birthday (uses UTC for server-side consistency)
 */
export function isBirthdayToday(birthdate: number): boolean {
  return isBirthdayOnDate(birthdate, new Date());
}

/**
 * Check if a given date is someone's birthday.
 * Uses UTC for server-side consistency.
 * Handles Feb 29 birthdays by treating them as Mar 1 in non-leap years.
 *
 * @param birthdate - Birthday as Unix timestamp
 * @param checkDate - The date to check against (defaults to now)
 */
export function isBirthdayOnDate(birthdate: number, checkDate?: Date): boolean {
  const today = checkDate ?? new Date();
  const birth = new Date(birthdate);

  const todayMonth = today.getUTCMonth();
  const todayDay = today.getUTCDate();
  const currentYear = today.getUTCFullYear();

  let birthMonth = birth.getUTCMonth();
  let birthDay = birth.getUTCDate();

  // Handle Feb 29 birthdays in non-leap years
  if (birthMonth === 1 && birthDay === 29) {
    if (!isLeapYear(currentYear)) {
      // Treat as March 1
      birthMonth = 2;
      birthDay = 1;
    }
  }

  return todayMonth === birthMonth && todayDay === birthDay;
}
