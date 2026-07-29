/**
 * Classifies a DepEd Plantilla Position into one of three official RPMS buckets:
 * 1. 'teaching'          - Direct classroom teaching load (Teachers, Master Teachers, SPED, SST) & School Heads
 * 2. 'teaching_related'  - Instructional support & supervision (EPS, EPS II, SEPS, PSDS, Guidance Counselors, Librarians, Registrars)
 * 3. 'non_teaching'      - Administrative, fiscal, IT, health, and support staff (AO, ADAS, ADA, Nurse, Data Encoder, etc.)
 */
function classifyPosition(positionTitle = '', employeeType = '') {
  if (!positionTitle) {
    if (employeeType === 'teaching') return 'teaching';
    if (employeeType === 'teaching_related') return 'teaching_related';
    return 'non_teaching';
  }

  const title = positionTitle.toLowerCase().trim();

  // 1. TEACHING-RELATED PERSONNEL
  if (
    title.includes('guidance counselor') ||
    title.includes('librarian') ||
    title.includes('registrar') ||
    title.includes('education program supervisor') ||
    title.includes('education program specialist') ||
    title.includes('eps') ||
    title.includes('seps') ||
    title.includes('psds') ||
    title.includes('district supervisor') ||
    title.includes('chief education supervisor') ||
    title.includes('sgod chief')
  ) {
    return 'teaching_related';
  }

  // 2. TEACHING PERSONNEL & SCHOOL HEADS
  if (
    title.includes('teacher') ||
    title.includes('master teacher') ||
    title.includes('special science teacher') ||
    title.includes('sped teacher') ||
    title.includes('head teacher') ||
    title.includes('principal') ||
    title.includes('assistant principal')
  ) {
    return 'teaching';
  }

  // 3. NON-TEACHING PERSONNEL
  if (
    title.includes('administrative officer') ||
    title.includes('administrative assistant') ||
    title.includes('administrative aide') ||
    title.includes('ao i') || title.includes('ao ii') || title.includes('ao iii') || title.includes('ao iv') || title.includes('ao v') ||
    title.includes('adas') || title.includes('ada') ||
    title.includes('data encoder') ||
    title.includes('records officer') ||
    title.includes('information technology') ||
    title.includes('computer programmer') ||
    title.includes('it officer') ||
    title.includes('nurse') ||
    title.includes('dentist') ||
    title.includes('medical officer') ||
    title.includes('disbursing officer') ||
    title.includes('cashier') ||
    title.includes('accountant') ||
    title.includes('budget officer') ||
    title.includes('hrmo') ||
    title.includes('supply officer') ||
    title.includes('clerk') ||
    title.includes('bookkeeper') ||
    title.includes('driver') ||
    title.includes('guard') ||
    title.includes('utility')
  ) {
    return 'non_teaching';
  }

  // Fallback to employee_type column if position title is unique or unmapped
  if (employeeType === 'teaching') return 'teaching';
  if (employeeType === 'teaching_related') return 'teaching_related';
  return 'non_teaching';
}

module.exports = { classifyPosition };
