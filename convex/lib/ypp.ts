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
 */
export function isMentorRole(role: string): boolean {
  return role === TEAM_ROLES.LEAD_MENTOR || role === TEAM_ROLES.MENTOR;
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
 * Check if today is someone's birthday
 */
export function isBirthdayToday(birthdate: number): boolean {
  const today = new Date();
  const birth = new Date(birthdate);
  return (
    today.getMonth() === birth.getMonth() && today.getDate() === birth.getDate()
  );
}

/**
 * Get users with birthdays on a given date
 * Handles Feb 29 birthdays by treating them as Mar 1 in non-leap years
 */
export function isBirthdayOnDate(birthdate: number, date: Date): boolean {
  const birth = new Date(birthdate);
  const birthMonth = birth.getMonth();
  const birthDay = birth.getDate();

  // Handle Feb 29 birthdays in non-leap years
  if (birthMonth === 1 && birthDay === 29) {
    const isLeapYear =
      (date.getFullYear() % 4 === 0 && date.getFullYear() % 100 !== 0) ||
      date.getFullYear() % 400 === 0;
    if (!isLeapYear) {
      // Treat as March 1
      return date.getMonth() === 2 && date.getDate() === 1;
    }
  }

  return date.getMonth() === birthMonth && date.getDate() === birthDay;
}
