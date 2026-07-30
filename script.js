// ==========================================
// STA Finder - Live Tracking & Arah
// ==========================================
let dataSTA = [];
let watchId = null;

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
// Konversi Derajat ke Arah Mata Angin
// ==========================================
function getArahMataAngin(bearing) {
    const arah = [
        "Utara ⬆️", "Timur Laut ↗️", "Timur ➡️", "Tenggara ↘️", 
        "Selatan ⬇️", "Barat Daya ↙️", "Barat ⬅️", "Barat Laut ↖️"
    ];
    // Membagi 360 derajat menjadi 8 bagian (tiap bagian 45 derajat)
    let index = Math.round(bearing / 45) % 8;
    return arah[index];
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
        btn.innerHTML = "📍 MULAI PELACAKAN LIVE";
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

            let jarakTerkecil = Infinity;
            let staTerdekat = "-";
            let targetLat = 0;
            let targetLon = 0;

            // Cari jarak terdekat
            for (let titik of dataSTA) {
                let jarak = hitungJarak(lat, lon, titik.lat, titik.lon);
                if (jarak < jarakTerkecil) {
                    jarakTerkecil = jarak;
                    staTerdekat = titik.sta;
                    targetLat = titik.lat;
                    targetLon = titik.lon;
                }
            }

            // Tampilkan Hasil (STA, Jarak, Arah)
            if (staTerdekat !== "-") {
                document.getElementById("sta").innerHTML = staTerdekat;
                document.getElementById("jarak").innerHTML = jarakTerkecil.toFixed(1) + " meter";
                
                // Hitung arah dari posisi user ke STA
                let bearing = hitungBearing(lat, lon, targetLat, targetLon);
                let arahTeks = getArahMataAngin(bearing);
                document.getElementById("arah").innerHTML = arahTeks;
            }
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
