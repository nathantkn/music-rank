// Small display formatters shared across views.

// "1st", "2nd", "3rd", "4th"… The teens are the exception to the last-digit
// rule — 11th, 12th, 13th, not 11st.
export function ordinal(n) {
  const teens = n % 100
  if (teens >= 11 && teens <= 13) return `${n}th`
  return `${n}${{ 1: 'st', 2: 'nd', 3: 'rd' }[n % 10] || 'th'}`
}
