const signinEndpoint = 'https://learn.reboot01.com/api/auth/signin';

let authToken = '';

async function login(username, password) {
  try {
    // Basic Auth base64 encoding of username and password
    const authHeader = 'Basic ' + btoa(username + ':' + password);

    // Make a POST request to sign in
    const response = await fetch(signinEndpoint, {
      method: 'POST',
      headers: {
      'Authorization': authHeader,
      },
    });

    if (!response.ok) {
      throw new Error('Login failed. Please check your credentials.');
    }


    // After successful login
    document.querySelector('.login-box').style.display = 'none';
    
    const data = await response.json();
    console.log('Login Response:', data);
    
    // Store the token after login
    authToken = data;
    console.log('this is auth token >> ', authToken)
    // After login, fetch user data (JWT is sent automatically with requests)
    fetchUserData();  

  } catch (error) {
    document.getElementById('loginError').style.display = 'block';
  }
}

function logout() {
  authToken = '';
  document.getElementById('logoutButton').style.display = 'none';
  document.querySelector('.login-box').style.display = 'block';
  document.getElementById('userData').style.display = 'none';
  document.getElementById('progressDataOutput').style.display = 'none';
  document.getElementById('AuditsAndRatio').style.display = 'none';
  document.getElementById('SkillsOutput').style.display = 'none';
}
