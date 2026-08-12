const applicationsPanel = document.querySelector('.applications-panel');
const applicantsForm = document.querySelector('.applicants-form');
const applicantDetail = document.querySelector('.applicant-detail');
const backToApplicants = document.querySelector('.back-to-applicants');

function openApplications() {
    applicationsPanel.classList.remove('d-none');
    requestAnimationFrame(() => applicationsPanel.classList.add('open'));
}

function closeApplications() {
    applicationsPanel.classList.remove('open');
    setTimeout(() => {
        applicationsPanel.classList.add('d-none');
        applicantDetail.classList.add('d-none');
        applicantsForm.classList.remove('d-none');
    }, 200);
}

document.querySelectorAll('.applicant-name').forEach(link => {
    link.addEventListener('click', () => {
        const userId = link.dataset.userId;
        fetch(`../get-user/${userId}`)
            .then(response => response.json())
            .then(user => {
                applicantDetail.querySelector('.applicant-detail-name').textContent = user.username || '';
                applicantDetail.querySelector('.applicant-detail-bio').textContent = user.bio || 'No bio yet.';
                applicantDetail.querySelector('.applicant-detail-avatar').src = user.profile
                    ? `../storage/${user.profile}`
                    : '../assets/images/user.png';

                const cvLink = applicantDetail.querySelector('.applicant-detail-cv');
                if (user.cv_path) {
                    cvLink.href = `../storage/${user.cv_path}`;
                    cvLink.classList.remove('d-none');
                } else {
                    cvLink.classList.add('d-none');
                }

                applicantsForm.classList.add('d-none');
                applicantDetail.classList.remove('d-none');
            })
            .catch(() => {
                applicantDetail.querySelector('.applicant-detail-name').textContent = 'Could not load this user';
                applicantsForm.classList.add('d-none');
                applicantDetail.classList.remove('d-none');
            });
    });
});

if (backToApplicants) {
    backToApplicants.addEventListener('click', () => {
        applicantDetail.classList.add('d-none');
        applicantsForm.classList.remove('d-none');
    });
}
