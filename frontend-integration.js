/**
 * BRAINGEO Frontend Integration
 * Bu fayl HTML-ə əlavə edilməlidir: <script src="frontend-integration.js"></script>
 */

// API Backend URL
const API_URL = 'http://localhost:5000/api'; // Lokal test üçün
// const API_URL = 'https://your-heroku-app.herokuapp.com/api'; // Production üçün

/**
 * =============== QEYDIYYAT FUNKSIYASI ===============
 */
async function registerStudentAPI(formData) {
  try {
    const response = await fetch(`${API_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ad: formData.ad,
        soyad: formData.soyad,
        sinif: formData.sinif,
        mekteb: formData.mekteb,
        telefon: formData.telefon,
        istifadechi: formData.istifadechi,
        sifre: formData.sifre,
        dogum: formData.dogum
      })
    });

    const data = await response.json();

    if (data.success) {
      console.log('✅ Qeydiyyat uğurlu:', data);
      localStorage.setItem('studentId', data.studentId);
      return { success: true, message: data.message };
    } else {
      console.error('❌ Qeydiyyat xətası:', data.error);
      return { success: false, error: data.error };
    }
  } catch (error) {
    console.error('🔴 Network xətası:', error);
    return { success: false, error: 'Server əlaqəsi uğursuz!' };
  }
}

/**
 * =============== GİRİŞ FUNKSIYASI ===============
 */
async function loginStudentAPI(istifadechi, sifre) {
  try {
    const response = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ istifadechi, sifre })
    });

    const data = await response.json();

    if (data.success) {
      console.log('✅ Giriş uğurlu:', data.student);
      
      // localStorage-də saxla
      localStorage.setItem('studentId', data.student.studentId);
      localStorage.setItem('studentName', data.student.ad);
      localStorage.setItem('studentSurname', data.student.soyad);
      localStorage.setItem('studentClass', data.student.sinif);
      localStorage.setItem('allowedSubjects', JSON.stringify(data.student.icazeli_fenler));
      localStorage.setItem('selectedSubjects', JSON.stringify(data.student.seçilen_fenler));

      return { success: true, student: data.student };
    } else {
      console.error('❌ Giriş xətası:', data.error);
      return { success: false, error: data.error };
    }
  } catch (error) {
    console.error('🔴 Network xətası:', error);
    return { success: false, error: 'Server əlaqəsi uğursuz!' };
  }
}

/**
 * =============== FÖN SEÇİMİ FUNKSIYASI ===============
 */
async function selectSubjectsAPI(fenler) {
  try {
    const studentId = localStorage.getItem('studentId');

    if (!studentId) {
      return { success: false, error: 'Giriş etmədiniz!' };
    }

    const response = await fetch(`${API_URL}/select-subject`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentId, fenler })
    });

    const data = await response.json();

    if (data.success) {
      console.log('✅ Fənlər seçildi:', data.fenler);
      localStorage.setItem('selectedSubjects', JSON.stringify(fenler));
      return { success: true, fenler: data.fenler };
    } else {
      return { success: false, error: data.error };
    }
  } catch (error) {
    console.error('🔴 Network xətası:', error);
    return { success: false, error: 'Server əlaqəsi uğursuz!' };
  }
}

/**
 * =============== NƏTİCƏLƏR FUNKSIYASI ===============
 */
async function getExamResultsAPI() {
  try {
    const studentId = localStorage.getItem('studentId');

    if (!studentId) {
      return { success: false, error: 'Giriş etmədiniz!' };
    }

    const response = await fetch(`${API_URL}/exam-results/${studentId}`);
    const data = await response.json();

    if (data.success) {
      console.log('✅ Nəticələr alındı:', data.results);
      return { success: true, results: data.results };
    } else {
      return { success: false, error: data.error };
    }
  } catch (error) {
    console.error('🔴 Network xətası:', error);
    return { success: false, error: 'Server əlaqəsi uğursuz!' };
  }
}

/**
 * =============== APELLYASIYA FUNKSIYASI ===============
 */
async function sendAppealAPI(appealData) {
  try {
    const studentId = localStorage.getItem('studentId');

    if (!studentId) {
      return { success: false, error: 'Giriş etmədiniz!' };
    }

    const response = await fetch(`${API_URL}/send-appeal`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentId, ...appealData })
    });

    const data = await response.json();

    if (data.success) {
      console.log('✅ Apellyasiya göndərildi:', data);
      return { success: true, message: data.message };
    } else {
      return { success: false, error: data.error };
    }
  } catch (error) {
    console.error('🔴 Network xətası:', error);
    return { success: false, error: 'Server əlaqəsi uğursuz!' };
  }
}

/**
 * =============== LOGOUT FUNKSIYASI ===============
 */
function logoutStudent() {
  localStorage.clear();
  console.log('✅ Çıxış edildi');
  return { success: true, message: 'Çıxış uğurlu oldu!' };
}

/**
 * =============== YÜNLƏNDİRİCİ FUNKSIYALAR ===============
 */

// Qeydiyyat formasında istifadə et
async function handleRegistrationWithAPI(event) {
  event.preventDefault();

  const formData = {
    ad: document.getElementById('reg-name').value.trim(),
    soyad: document.getElementById('reg-surname').value.trim(),
    sinif: document.getElementById('reg-class').value,
    mekteb: document.getElementById('reg-school').value,
    telefon: document.getElementById('reg-phone').value.trim(),
    istifadechi: document.getElementById('reg-username').value.trim(),
    sifre: document.getElementById('reg-password').value,
    dogum: `${document.getElementById('reg-birth-year').value}-${document.getElementById('reg-birth-month').value}-${document.getElementById('reg-birth-day').value}`
  };

  const result = await registerStudentAPI(formData);
  const messageBox = document.getElementById('reg-message');

  if (result.success) {
    messageBox.className = 'message-box msg-success';
    messageBox.innerText = result.message;
    messageBox.style.display = 'block';
    document.getElementById('registration-form').reset();
  } else {
    messageBox.className = 'message-box msg-error';
    messageBox.innerText = result.error;
    messageBox.style.display = 'block';
  }
}

// Giriş formasında istifadə et
async function handleLoginWithAPI(event) {
  event.preventDefault();

  const istifadechi = document.getElementById('login-username').value.trim();
  const sifre = document.getElementById('login-password').value;
  const errorBox = document.getElementById('login-error-msg');

  const result = await loginStudentAPI(istifadechi, sifre);

  if (result.success) {
    errorBox.style.display = 'none';
    updateProfileUI();
    buildCabinetSubjects();
    
    document.getElementById('header-menu').innerHTML = `<a onclick="toggleSidePanel(true)">☰ Menyu</a>`;
    document.getElementById('main-burger-btn').style.display = 'flex';
    
    document.getElementById('main-content').style.display = 'none';
    document.getElementById('giris-page').style.display = 'none';
    document.getElementById('profile-page').style.display = 'block';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } else {
    errorBox.innerText = result.error;
    errorBox.style.display = 'block';
  }
}

/**
 * =============== YARDIMÇI FUNKSIYALAR ===============
 */

function getStudentFromStorage() {
  return {
    studentId: localStorage.getItem('studentId'),
    ad: localStorage.getItem('studentName'),
    soyad: localStorage.getItem('studentSurname'),
    sinif: localStorage.getItem('studentClass'),
    icazeli_fenler: JSON.parse(localStorage.getItem('allowedSubjects') || '[]'),
    seçilen_fenler: JSON.parse(localStorage.getItem('selectedSubjects') || '[]')
  };
}

function isStudentLoggedIn() {
  return !!localStorage.getItem('studentId');
}

/**
 * =============== HEALTH CHECK ===============
 */
async function checkBackendHealth() {
  try {
    const response = await fetch(`${API_URL}/health`);
    const data = await response.json();
    console.log('✅ Backend sağlam:', data);
    return true;
  } catch (error) {
    console.error('❌ Backend əlaqəsi yoxdur:', error);
    alert('⚠️ Backend server başlamamışdır! Zəhmət olmasa "npm start" əmrini icra edin.');
    return false;
  }
}

// Səhifə yüklənəndə health check et
document.addEventListener('DOMContentLoaded', () => {
  checkBackendHealth();
  
  // Əgər istifadəçi artıq login olarsa, profili göstər
  if (isStudentLoggedIn()) {
    updateProfileUI();
    buildCabinetSubjects();
  }
});

console.log('✅ BRAINGEO Frontend Integration yükləndi!');
