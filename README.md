# 🧠 BRAINGEO Backend

BRAINGEO - 1-12 sinif şagirdləri üçün onlayn olimpiada platformasının backend sistemi.

## 📋 Xüsusiyyətlər

✅ **Şagird Qeydiyyatı** - Ad, Soyad, Sinif, Məktəb, Telefon, Dogum Tarixi  
✅ **Giriş Sistemi** - İstifadəçi adı və şifrə ilə giriş  
✅ **Fön Seçimi** - Şagirdlər olimpiadada iştirak etmək istədikləri fənləri seçə bilər  
✅ **Admin Panel** - Yalnız icazə verilən fənlərə giriş  
✅ **İmtahan Nəticələri** - Nəticələr sonradan elan olunur  
✅ **Apellyasiya** - Şagirdlər apellyasiya müraciəti göndərə bilərlər  

---

## 🚀 Qurulum

### 1. **Prərequizitlər**

- Node.js 16+ yüklü olmalıdır
- npm və ya yarn
- Firebase Realtime Database aktiv olmalıdır

### 2. **Repositorini klonlayın**

```bash
git clone https://github.com/seyurkoleci-ops/braingeo-backend.git
cd braingeo-backend
```

### 3. **Dependencies-ləri yükləyin**

```bash
npm install
```

### 4. **Konfiqurasiyanı ayarlayın**

`.env.example` faylını `.env` olaraq kopyalayın:

```bash
cp .env.example .env
```

**`.env` faylını düzəltən:**

```
PORT=5000
NODE_ENV=development

FIREBASE_DATABASE_URL=https://braingeo-f0ae4-default-rtdb.europe-west1.firebasedatabase.app
FIREBASE_PROJECT_ID=braingeo-f0ae4

JWT_SECRET=your-super-secret-key-here-change-in-production
ADMIN_PASSWORD=admin123
```

### 5. **Firebase Service Account Key**

Firebase Console-dan endirdiyiniz `serviceAccountKey.json` faylını proyekt kökünə yerləşdirin

### 6. **Serveri başlatın**

```bash
npm start
```

---

## 📡 API Endpoints

### **Qeydiyyat**
```http
POST /api/register
```

### **Giriş**
```http
POST /api/login
```

### **Fön Seçimi**
```http
POST /api/select-subject
```

### **Admin: Fön İcazəsi Ver**
```http
POST /api/admin/allow-subject
```

### **Health Check**
```http
GET /api/health
```

---

## 🔐 Güvenlik

✅ **Şifrə Şifrələməsi** - bcryptjs ilə hash ədilib  
✅ **Admin Şifrəsi** - Admin əməliyyatları üçün lazımdır  
✅ **CORS** - Yalnız icazə verilən domenlərdən sorğular  

---

## 📝 License

MIT License

---

**Happy coding! 🚀**
