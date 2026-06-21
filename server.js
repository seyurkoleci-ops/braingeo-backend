const express = require('express');
const admin = require('firebase-admin');
const cors = require('cors');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// =============== FIREBASE İNİSİALİZASİYASI ===============
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: process.env.FIREBASE_DATABASE_URL
});

const db = admin.database();
const app = express();

// =============== MİDLEWARES ===============
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5000', 'https://seyurkoleci-ops.github.io'],
  credentials: true
}));
app.use(express.json());

// =============== LOG MIDDLEWARE ===============
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// =============== QEYDİYYAT ENDPOINT ===============
app.post('/api/register', async (req, res) => {
  try {
    const { ad, soyad, sinif, mekteb, telefon, istifadechi, sifre, dogum } = req.body;

    // Validasiya
    if (!ad || !soyad || !sinif || !mekteb || !telefon || !istifadechi || !sifre || !dogum) {
      return res.status(400).json({ 
        success: false,
        error: 'Bütün sahələr doldurulmalıdır!' 
      });
    }

    // Telefon duplikat yoxla
    const phoneSnapshot = await db.ref('students')
      .orderByChild('telefon')
      .equalTo(telefon)
      .once('value');

    if (phoneSnapshot.exists()) {
      return res.status(400).json({ 
        success: false,
        error: 'Bu telefon artıq qeydiyyatdan keçib!' 
      });
    }

    // İstifadəçi adı duplikat yoxla
    const usernameSnapshot = await db.ref('students')
      .orderByChild('istifadechi')
      .equalTo(istifadechi)
      .once('value');

    if (usernameSnapshot.exists()) {
      return res.status(400).json({ 
        success: false,
        error: 'Bu istifadəçi adı artıq istifadə olunur!' 
      });
    }

    // Şifrəni hash edin
    const hashedPassword = await bcrypt.hash(sifre, 10);

    // Yeni şagird yaradın
    const newStudent = {
      ad,
      soyad,
      sinif: parseInt(sinif),
      mekteb,
      telefon,
      istifadechi,
      sifre: hashedPassword,
      dogum,
      icazeli_fenler: [],
      seçilen_fenler: [],
      imtahan_naticeleri: [],
      apellyasiya: [],
      qeydiyyat_tarixi: new Date().toISOString(),
      sonuncu_giris: null
    };

    const newRef = db.ref('students').push();
    await newRef.set(newStudent);

    res.status(201).json({ 
      success: true,
      message: 'Qeydiyyat uğurlu oldu! İndi giriş edə bilərsiniz.',
      studentId: newRef.key 
    });

  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// =============== GİRİŞ ENDPOINT ===============
app.post('/api/login', async (req, res) => {
  try {
    const { istifadechi, sifre } = req.body;

    if (!istifadechi || !sifre) {
      return res.status(400).json({ 
        success: false,
        error: 'İstifadəçi adı və şifrə daxil edin!' 
      });
    }

    const snapshot = await db.ref('students')
      .orderByChild('istifadechi')
      .equalTo(istifadechi)
      .once('value');

    if (!snapshot.exists()) {
      return res.status(401).json({ 
        success: false,
        error: 'İstifadəçi tapılmadı!' 
      });
    }

    const students = snapshot.val();
    const studentId = Object.keys(students)[0];
    const student = students[studentId];

    // Şifrə yoxla
    const passwordMatch = await bcrypt.compare(sifre, student.sifre);

    if (!passwordMatch) {
      return res.status(401).json({ 
        success: false,
        error: 'Şifrə yanlışdır!' 
      });
    }

    // Sonuncu giriş zamanını güncəllə
    await db.ref(`students/${studentId}/sonuncu_giris`).set(new Date().toISOString());

    res.json({
      success: true,
      message: 'Giriş uğurlu oldu!',
      student: {
        studentId,
        ad: student.ad,
        soyad: student.soyad,
        sinif: student.sinif,
        mekteb: student.mekteb,
        telefon: student.telefon,
        istifadechi: student.istifadechi,
        dogum: student.dogum,
        icazeli_fenler: student.icazeli_fenler || [],
        seçilen_fenler: student.seçilen_fenler || []
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// =============== FÖN SEÇİMİ ENDPOINT ===============
app.post('/api/select-subject', async (req, res) => {
  try {
    const { studentId, fenler } = req.body;

    if (!studentId || !fenler || !Array.isArray(fenler)) {
      return res.status(400).json({ 
        success: false,
        error: 'Geçərsiz məlumat!' 
      });
    }

    await db.ref(`students/${studentId}/seçilen_fenler`).set(fenler);

    res.json({ 
      success: true,
      message: 'Fənlər seçildi!',
      fenler 
    });

  } catch (error) {
    console.error('Select subject error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// =============== ADMIN: FÖN İCAZESİ VER ===============
app.post('/api/admin/allow-subject', async (req, res) => {
  try {
    const { adminPassword, studentId, fen } = req.body;

    // Admin yoxla
    if (adminPassword !== process.env.ADMIN_PASSWORD) {
      return res.status(403).json({ 
        success: false,
        error: 'Admin şifrəsi yanlışdır!' 
      });
    }

    const snapshot = await db.ref(`students/${studentId}`).once('value');
    
    if (!snapshot.exists()) {
      return res.status(404).json({ 
        success: false,
        error: 'Şagird tapılmadı!' 
      });
    }

    const student = snapshot.val();
    const icazeli = student.icazeli_fenler || [];

    if (!icazeli.includes(fen)) {
      icazeli.push(fen);
      await db.ref(`students/${studentId}/icazeli_fenler`).set(icazeli);
    }

    res.json({ 
      success: true,
      message: `${fen} üçün icazə verildi!`,
      icazeli_fenler: icazeli
    });

  } catch (error) {
    console.error('Allow subject error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// =============== İMTAHAN NƏTİCƏSİ SAX ===============
app.post('/api/save-exam-result', async (req, res) => {
  try {
    const { adminPassword, studentId, fen, bal, tarix } = req.body;

    // Admin yoxla
    if (adminPassword !== process.env.ADMIN_PASSWORD) {
      return res.status(403).json({ 
        success: false,
        error: 'Admin şifrəsi yanlışdır!' 
      });
    }

    const result = {
      fen,
      bal: parseInt(bal),
      tarix: tarix || new Date().toISOString(),
      status: 'Gözləniş'
    };

    const resultsRef = db.ref(`students/${studentId}/imtahan_naticeleri`).push();
    await resultsRef.set(result);

    res.json({ 
      success: true,
      message: 'Nəticə saxlanıldı!',
      resultId: resultsRef.key
    });

  } catch (error) {
    console.error('Save exam result error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// =============== NƏTİCƏLƏR GÖR ===============
app.get('/api/exam-results/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;

    const snapshot = await db.ref(`students/${studentId}/imtahan_naticeleri`).once('value');
    const resultsObj = snapshot.val() || {};

    const results = Object.entries(resultsObj).map(([id, data]) => ({
      id,
      ...data
    }));

    res.json({
      success: true,
      results
    });

  } catch (error) {
    console.error('Get exam results error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// =============== APELLYASIYA MÜRACIƏTI GÖNDƏR ===============
app.post('/api/send-appeal', async (req, res) => {
  try {
    const { studentId, ad, istifadechi, fen, sual_nomresi, sebeb } = req.body;

    if (!studentId || !ad || !istifadechi || !fen || !sual_nomresi || !sebeb) {
      return res.status(400).json({ 
        success: false,
        error: 'Bütün sahələr doldurulmalıdır!' 
      });
    }

    const appeal = {
      ad,
      istifadechi,
      fen,
      sual_nomresi: parseInt(sual_nomresi),
      sebeb,
      tarix: new Date().toISOString(),
      status: 'Gözləniş'
    };

    const appealRef = db.ref(`students/${studentId}/apellyasiya`).push();
    await appealRef.set(appeal);

    res.json({ 
      success: true,
      message: 'Apellyasiya müraciəti göndərildi!',
      appealId: appealRef.key
    });

  } catch (error) {
    console.error('Send appeal error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// =============== ADMIN: TÜM ŞAGIRDLƏR ===============
app.get('/api/admin/all-students', async (req, res) => {
  try {
    const { adminPassword } = req.query;

    if (adminPassword !== process.env.ADMIN_PASSWORD) {
      return res.status(403).json({ 
        success: false,
        error: 'Admin şifrəsi yanlışdır!' 
      });
    }

    const snapshot = await db.ref('students').once('value');
    const studentsObj = snapshot.val() || {};

    const students = Object.entries(studentsObj).map(([id, data]) => ({
      id,
      ad: data.ad,
      soyad: data.soyad,
      sinif: data.sinif,
      mekteb: data.mekteb,
      telefon: data.telefon,
      istifadechi: data.istifadechi,
      icazeli_fenler: data.icazeli_fenler || [],
      seçilen_fenler: data.seçilen_fenler || [],
      qeydiyyat_tarixi: data.qeydiyyat_tarixi,
      sonuncu_giris: data.sonuncu_giris
    }));

    res.json({
      success: true,
      toplam: students.length,
      students
    });

  } catch (error) {
    console.error('Get all students error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// =============== HEALTH CHECK ===============
app.get('/api/health', (req, res) => {
  res.json({ 
    success: true,
    message: 'Server işləyir! ✅',
    timestamp: new Date().toISOString()
  });
});

// =============== ERROR HANDLING ===============
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ 
    success: false,
    error: 'Server xətası baş verdi!' 
  });
});

// =============== SERVER BAŞLAT ===============
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 BRAINGEO Backend ${PORT} portunda işləyir!`);
  console.log(`Database: ${process.env.FIREBASE_DATABASE_URL}`);
});
