const API_URL = 'https://cmppl-staging-backend.onrender.com';

document.addEventListener('DOMContentLoaded', async () => {
  checkSession();

  // Fetch and display folders
  fetchFolders();
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

const fetchFolders = async () => {
  try {
    const response = await fetch(`${API_URL}/api/folders`, {
      method: 'GET',
      credentials: 'include',
    });

    const folders = await response.json();
    const foldersList = document.getElementById('folders-list');
    foldersList.innerHTML = '';

    folders.forEach(folder => {
      const listItem = document.createElement('li');
      listItem.textContent = folder.name;
      listItem.dataset.id = folder._id;
      listItem.onclick = () => fetchFiles(folder._id);
      foldersList.appendChild(listItem);
    });
  } catch (error) {
    console.error('Error fetching folders:', error);
  }
};

const fetchFiles = async (folderId) => {
  try {
    const response = await fetch(`${API_URL}/api/files?folder=${folderId}`, {
      method: 'GET',
      credentials: 'include',
    });

    const files = await response.json();
    const filesList = document.getElementById('files-list');
    filesList.innerHTML = '';

    files.forEach(file => {
      const listItem = document.createElement('li');
      const link = document.createElement('a');
      link.href = `${API_URL}/api/files/${file._id}/download`;
      link.textContent = file.name;
      link.target = '_blank';
      listItem.appendChild(link);
      filesList.appendChild(listItem);
    });
  } catch (error) {
    console.error('Error fetching files:', error);
  }
};

const createFolder = async () => {
  const folderName = prompt('Enter folder name:');
  if (!folderName) return;

  try {
    const response = await fetch(`${API_URL}/api/folders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ name: folderName }),
    });

    if (response.ok) {
      fetchFolders();
    } else {
      alert('Error creating folder');
    }
  } catch (error) {
    console.error('Error creating folder:', error);
  }
};

const uploadFile = async () => {
  const fileInput = document.getElementById('upload-file');
  const file = fileInput.files[0];
  const folderId = document.querySelector('#folders-list li.selected').dataset.id;

  if (!file || !folderId) {
    alert('Please select a file and a folder');
    return;
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('folderId', folderId);

  try {
    const response = await fetch(`${API_URL}/api/files`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });

    if (response.ok) {
      fetchFiles(folderId);
    } else {
      alert('Error uploading file');
    }
  } catch (error) {
    console.error('Error uploading file:', error);
  }
};

const logout = () => {
  fetch(`${API_URL}/api/auth/logout`, { method: 'GET', credentials: 'include' })
    .then(response => window.location.href = '/login.html');
};
