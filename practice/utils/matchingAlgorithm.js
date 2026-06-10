const scoreAlumni = (student, alumni) => {
    let score = 0;

    const studentSkills = (student.skills || []).map(s => s.toLowerCase());
    const alumniSkills = (alumni.skills || []).map(s = s.toLowerCase());

    const sharedSkills = studentSkills.filter(s => alumniSkills.includes(s));
    score += sharedSkills.length * 3;

    const interests = (student.careerInterests || []).map(i => i.toLowerCase());
    const alumniIndustry = (alumni.industry || '').toLowerCase();
    const alumniInterests = (alumni.careerInterests || []).map(i => i.toLowerCase());

    interests.forEach(interest => {
        if (alumniIndustry.includes(interest)) score += 5;
        if (alumniInterests.includes(interest)) score += 3;
    })

    if (alumni.availableForMentorship) score += 2;

    if (student.department &&
        alumni.department &&
        student.department.toLowerCase() === alumni.department.toLowerCase()
    ) score += 1;

    return score;
};

const getMatchedAlumni = (student, alumniList) => {
    return alumniList
        .map(alumni => ({ alumni, score: scoreAlumni(student, alumni) }))
        .filter(item => item.score > 0)
        .sort((a, b) => b.score - a.score)
        .map(item => ({ ...item.alumni.toObject(), matchScore: item.score }));
};

module.exports = { getMatchedAlumni, scoreAlumni };