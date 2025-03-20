const API_URL = 'https://cmppl-staging-backend.onrender.com';

document.addEventListener('DOMContentLoaded', async () => {
  checkSession();
  fetchCertificates();
});

const checkSession = async () => {
  try {
    const response = await fetch(`${API_URL}/api/auth/check-session`, {
      method: 'GET',
      credentials: 'include',
    });

    const data = await response.json();
    console.log('Session check data:', data);
    if (!data.isAuthenticated) {
      window.location.href = '/login.html';
    }
  } catch (error) {
    console.error('Session check failed:', error);
    window.location.href = '/login.html';
  }
};

const fetchCertificates = async () => {
  try {
    const response = await fetch(`${API_URL}/api/files`, {
      method: 'GET',
      credentials: 'include',
    });

    const certificates = await response.json();
    const certificatesList = document.getElementById('certificates-list');

    certificates.forEach(cert => {
      const listItem = document.createElement('li');
      const link = document.createElement('a');
      link.href = `${API_URL}/api/files/${cert._id}/download`;
      link.textContent = cert.name;
      link.target = '_blank';
      listItem.appendChild(link);
      certificatesList.appendChild(listItem);
    });
  } catch (error) {
    console.error('Error fetching certificates:', error);
  }
};

const logout = () => {
  fetch(`${API_URL}/api/auth/logout`, { method: 'GET', credentials: 'include' })
    .then(response => window.location.href = '/login.html');
};
