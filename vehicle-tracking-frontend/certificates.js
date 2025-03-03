const API_URL = 'https://cmppl-staging-backend.onrender.com';
document.addEventListener('DOMContentLoaded', async () => {
    const checkSession = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/auth/check-session', {
          method: 'GET',
          credentials: 'include',
        });
  
        const data = await response.json();
        console.log('Session check data:', data);
        if (!data.isAuthenticated) {
          window.location.href = '/login.html';
        } else {
          fetchCertificates();
        }
      } catch (error) {
        console.error('Session check failed:', error);
        window.location.href = '/login.html';
      }
    };
  
    const fetchCertificates = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/certificate', {
          method: 'GET',
          credentials: 'include',
        });
  
        const certificates = await response.json();
        const certificatesList = document.getElementById('certificates-list');
        certificates.forEach(cert => {
          const listItem = document.createElement('li');
          const link = document.createElement('a');
          link.href = cert.url;
          link.textContent = cert.name;
          link.target = '_blank';
          listItem.appendChild(link);
          certificatesList.appendChild(listItem);
        });
      } catch (error) {
        console.error('Error fetching certificates:', error);
      }
    };
  
    await checkSession();
  });

// Example function to fetch certificates
async function fetchCertificates() {
    const response = await fetch(`${API_URL}/certificate`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
    });
    return response.json();
}