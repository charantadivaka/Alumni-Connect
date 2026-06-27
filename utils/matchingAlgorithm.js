/**
 * Smart Matching Algorithm
 * Scores each alumni against a student profile.
 *
 * Scoring:
 *   +3 pts per skill shared with student.skills
 *   +5 pts per shared item between student.careerInterests & alumni.industry / alumni.careerInterests
 *   +2 pts if alumni.mentorshipAvailability === 'Available' or 'Limited'
 *   +1 pt if same department
 */
const scoreAlumni = (student, alumni) => {
    let score = 0;

    const studentSkills = (student.skills || []).map(s => s.toLowerCase());
    const alumniSkills  = (alumni.skills  || []).map(s => s.toLowerCase());

    // Skill overlap
    const sharedSkills = studentSkills.filter(s => alumniSkills.includes(s));
    score += sharedSkills.length * 3;

    // Career interest / industry overlap
    const interests = (student.careerInterests || []).map(i => i.toLowerCase());
    const alumniIndustry = (alumni.industry || '').toLowerCase();
    const alumniInterests = (alumni.careerInterests || []).map(i => i.toLowerCase());

    interests.forEach(interest => {
        if (alumniIndustry.includes(interest)) score += 5;
        if (alumniInterests.includes(interest)) score += 3;
    });

    // Mentorship availability bonus
    if (alumni.mentorshipAvailability === 'Available' || alumni.mentorshipAvailability === 'Limited') score += 2;

    // Same department
    if (
        student.department &&
        alumni.department &&
        student.department.toLowerCase() === alumni.department.toLowerCase()
    ) score += 1;

    return score;
};

const getMatchedAlumni = (student, alumniList) => {
    return alumniList
        .map(alumni => ({ alumni, score: scoreAlumni(student, alumni) }))
        .sort((a, b) => b.score - a.score)
        .map(item => ({ ...item.alumni.toObject(), matchScore: item.score }));
};

module.exports = { getMatchedAlumni, scoreAlumni };
