// ==========================================
// STA Finder - Live Tracking & Status STA
// ==========================================
let dataSTA = [];
let watchId = null;
let lastLat = null;
let lastLon = null;

// ==========================================
// Membaca CSV
// ==========================================
fetch("sta.csv")
    .then(response => response.text())
    .then(text => {
        let baris = text.trim().split("\n");
        for (let i = 1; i < baris.length; i++) {
            let kolom = baris[i].split(",");
            if (kolom.length >= 3) {
                dataSTA.push({
                    sta: kolom[0].trim(),
                    lat: parseFloat(kolom[1]),
                    lon: parseFloat(kolom[2])
                });
            }
        }
        document.getElementById("csvStatus").innerHTML = "🟢 Berhasil (" + dataSTA.length + " titik)";
    })
    .catch(error => {
        console.log(error);
        document.getElementById("csvStatus").innerHTML = "🔴 Gagal membaca CSV";
    });

// ==========================================
// Fungsi Parsing STA (Contoh: "1+500" jadi 1500 meter)
// ==========================================
function parseSTA(staStr) {
    if (staStr && staStr.includes("+")) {
        let parts = staStr.split("+");
        return (parseFloat(parts[0]) * 1000) + parseFloat(parts[1]);
    }
    return -1;
}

// ==========================================
// Rumus Haversine (Hitung Jarak)
// ==========================================
function hitungJarak(lat1, lon1, lat2, lon2) {
    const R = 6371000; // Radius bumi dalam meter
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

// ==========================================
// Rumus Bearing (Hitung Arah Derajat)
// ==========================================
function hitungBearing(lat1, lon1, lat2, lon2) {
    let lat1Rad = lat1 * Math.PI / 180;
    let lat2Rad = lat2 * Math.PI / 180;
    let dLon = (lon2 - lon1) * Math.PI / 180;

    let y = Math.sin(dLon) * Math.cos(lat2Rad);
    let x = Math.cos(lat1Rad) * Math.sin(lat2Rad) -
            Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLon);

    let brng = Math.atan2(y, x);
    brng = brng * 180 / Math.PI; 
    return (brng + 360) % 360; // Memastikan hasilnya 0-360 derajat
}

// ==========================================
// Live Tracking (Toggle Start/Stop)
// ==========================================
function toggleLokasi() {
    let btn = document.getElementById("btnLokasi");

    // Jika sedang melacak, matikan pelacakan
    if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
        watchId = null;
        lastLat = null;
        lastLon = null;
        btn.innerHTML = "MULAI PELACAKAN LIVE";
        btn.style.background = "#1976d2";
        document.getElementById("gpsStatus").innerHTML = "⚪ Berhenti melacak";
        return;
    }

    // Memulai Pelacakan
    document.getElementById("gpsStatus").innerHTML = "🟡 Mengambil lokasi...";
    btn.innerHTML = "🛑 HENTIKAN PELACAKAN";
    btn.style.background = "#d32f2f"; // Ubah tombol jadi merah

    if (!navigator.geolocation) {
        alert("Browser tidak mendukung GPS");
        return;
    }

    // Gunakan watchPosition agar lokasi terus update tanpa perlu refresh web
    watchId = navigator.geolocation.watchPosition(
        function (pos) {
            let lat = pos.coords.latitude;
            let lon = pos.coords.longitude;
            let akurasi = pos.coords.accuracy;

            document.getElementById("gpsStatus").innerHTML = "🟢 Terhubung (Live)";
            document.getElementById("lat").innerHTML = lat.toFixed(7);
            document.getElementById("lon").innerHTML = lon.toFixed(7);
            document.getElementById("akurasi").innerHTML = "± " + akurasi.toFixed(1) + " meter";
            document.getElementById("waktu").innerHTML = new Date().toLocaleString("id-ID");

            // 1. Filter dan Urutkan STA standar secara numerik (terkecil ke terbesar)
            let standardSTA = dataSTA.filter(item => item.sta.includes("+"));
            standardSTA.sort((a, b) => parseSTA(a.sta) - parseSTA(b.sta));

            if (standardSTA.length === 0) return;

            // 2. Cari STA terdekat dari posisi saat ini
            let minJarak = Infinity;
            let closestIdx = 0;

            for (let i = 0; i < standardSTA.length; i++) {
                let jarak = hitungJarak(lat, lon, standardSTA[i].lat, standardSTA[i].lon);
                if (jarak < minJarak) {
                    minJarak = jarak;
                    closestIdx = i;
                }
            }

            let currentClosest = standardSTA[closestIdx];
            document.getElementById("sta").innerHTML = currentClosest.sta;
            document.getElementById("jarak").innerHTML = minJarak.toFixed(1) + " meter";

            // Tentukan titik STA sebelum dan sesudahnya sebagai acuan
            let prevSTA = closestIdx > 0 ? standardSTA[closestIdx - 1] : currentClosest;
            let nextSTA = closestIdx < standardSTA.length - 1 ? standardSTA[closestIdx + 1] : currentClosest;

            // ==========================================
            // 3. Logika Penentuan Status Arah Baru
            // ==========================================
            let statusArah = "-";

            // Jika jarak ke STA terdekat <= 4 meter, tampilkan status tepat di STA
            if (minJarak <= 4.0) {
                statusArah = "berada tepat di sta 📍";
            } else {
                // Deteksi arah gerakan atau posisi relatif
                let userBearing = null;
                if (lastLat !== null && lastLon !== null) {
                    let distMoved = hitungJarak(lastLat, lastLon, lat, lon);
                    if (distMoved > 0.4) { // Jika bergeser lebih dari 40 cm
                        userBearing = hitungBearing(lastLat, lastLon, lat, lon);
                    }
                }
                if (pos.coords.heading !== null && !isNaN(pos.coords.heading)) {
                    userBearing = pos.coords.heading;
                }

                let bearingNext = hitungBearing(lat, lon, nextSTA.lat, nextSTA.lon);
                let bearingPrev = hitungBearing(lat, lon, prevSTA.lat, prevSTA.lon);

                if (userBearing !== null) {
                    let diffNext = Math.abs(userBearing - bearingNext);
                    if (diffNext > 180) diffNext = 360 - diffNext;
                    let diffPrev = Math.abs(userBearing - bearingPrev);
                    if (diffPrev > 180) diffPrev = 360 - diffPrev;

                    if (diffNext < diffPrev) {
                        statusArah = "menuju ke sta besar";
                    } else {
                        statusArah = "menuju ke sta kecil";
                    }
                } else {
                    // Fallback jika posisi sedang diam: bandingkan jarak ke depan vs belakang
                    let jrkNext = hitungJarak(lat, lon, nextSTA.lat, nextSTA.lon);
                    let jrkPrev = hitungJarak(lat, lon, prevSTA.lat, prevSTA.lon);
                    if (jrkNext < jrkPrev) {
                        statusArah = "menuju ke sta besar";
                    } else {
                        statusArah = "menuju ke sta kecil";
                    }
                }
            }

            // Tampilkan hasil teks status arah ke elemen HTML ID "arah"
            document.getElementById("arah").innerHTML = statusArah;

            // Simpan posisi terakhir untuk perbandingan gerakan berikutnya
            lastLat = lat;
            lastLon = lon;
        },
        function (error) {
            console.log(error);
            document.getElementById("gpsStatus").innerHTML = "🔴 GPS Gagal / Lemah";
        },
        {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0 // Pastikan tidak mengambil cache lokasi lama
        }
    );
}
