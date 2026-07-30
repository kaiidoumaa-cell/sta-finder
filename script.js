// ==========================================
// STA Finder
// ==========================================

let dataSTA = [];
let lasIndexSTA = null;

// ==========================================
// Membaca CSV
// ==========================================

fetch("sta.csv")
    .then(response => response.text())
    .then(text => {

        let baris = text.trim().split("\n");

        for (let i = 1; i < baris.length; i++) {

            let kolom = baris[i].split(",");

            dataSTA.push({
                sta: kolom[0].trim(),
                lat: parseFloat(kolom[1]),
                lon: parseFloat(kolom[2])
            });

        }

        console.log(dataSTA);

        document.getElementById("csvStatus").innerHTML =
            "🟢 Berhasil (" + dataSTA.length + " titik)";

    })
    .catch(error => {

        console.log(error);

        document.getElementById("csvStatus").innerHTML =
            "🔴 Gagal membaca CSV";

    });


// ==========================================
// Rumus Haversine
// ==========================================

function hitungJarak(lat1, lon1, lat2, lon2) {

    const R = 6371000;

    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) *
        Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
}


// ==========================================
// Cari Lokasi
// ==========================================

function cekLokasi() {

    // Pastikan data CSV sudah dimuat
    if (dataSTA.length === 0) {
        alert("Data STA belum selesai dimuat. Tunggu beberapa detik lalu coba lagi.");
        return;
    }

    document.getElementById("gpsStatus").innerHTML = "🟡 Mengambil lokasi...";

    if (!navigator.geolocation) {
        alert("Browser tidak mendukung GPS");
        return;
    }

    navigator.geolocation.watchPosition(

        function (pos) {

            let lat = pos.coords.latitude;
            let lon = pos.coords.longitude;
            let akurasi = pos.coords.accuracy;

            // ==========================
            // Tampilkan informasi GPS
            // ==========================

            document.getElementById("gpsStatus").innerHTML = "🟢 Terhubung";
            document.getElementById("lat").innerHTML = lat.toFixed(7);
            document.getElementById("lon").innerHTML = lon.toFixed(7);
            document.getElementById("akurasi").innerHTML = "± " + akurasi.toFixed(1) + " meter";
            document.getElementById("waktu").innerHTML = new Date().toLocaleString("id-ID");

            // ==========================
            // Cari STA terdekat
            // ==========================

            let jarakTerkecil = Infinity;
            let staTerdekat = "-";
            let indexSTA = -1;

            for (let i = 0; i < dataSTA.length; i++) {

                let titik = dataSTA[i];

                let jarak = hitungJarak(
                    lat,
                    lon,
                    titik.lat,
                    titik.lon
                );

                if (jarak < jarakTerkecil) {
                    jarakTerkecil = jarak;
                    staTerdekat = titik.sta;
                    indexSTA = i;
                }

            }

            // Jika tidak ada STA
            if (indexSTA === -1) {

                document.getElementById("gpsStatus").innerHTML = "🔴 STA Tidak Ditemukan";
                document.getElementById("sta").innerHTML = "-";
                document.getElementById("jarak").innerHTML = "-";
                document.getElementById("arah").innerHTML = "-";

                alert("Data STA tidak ditemukan.");
                return;

            }

            // ==========================
            // Tentukan arah perjalanan
            // ==========================

            let arah = "Posisi awal";

            if (lastIndexSTA !== null) {

                if (indexSTA > lastIndexSTA) {

                    arah = "➡ Menuju STA Membesar";

            } else if (indexSTA < lastIndexSTA) {

                    arah = "⬅ Menuju STA Mengecil";

            } else {

                    arah = "⏸ Tetap di STA yang sama";

            }

        }

        // Simpan STA sekarang
        lastIndexSTA = indexSTA;
            
            // ==========================
            // Tampilkan hasil
            // ==========================

            document.getElementById("sta").innerHTML = staTerdekat;
            document.getElementById("jarak").innerHTML = jarakTerkecil.toFixed(1) + " meter";
            document.getElementById("arah").innerHTML = arah;

        },

        function (error) {

            console.error(error);

            document.getElementById("gpsStatus").innerHTML = "🔴 GPS Gagal";

            let pesan = "";

            switch (error.code) {

                case error.PERMISSION_DENIED:
                    pesan = "Izin lokasi ditolak.";
                    break;

                case error.POSITION_UNAVAILABLE:
                    pesan = "Lokasi tidak tersedia.";
                    break;

                case error.TIMEOUT:
                    pesan = "GPS timeout. Coba pindah ke area terbuka.";
                    break;

                default:
                    pesan = error.message || "GPS gagal dibaca.";

            }

            alert(pesan);

        },

        {
            enableHighAccuracy: true,
            timeout: 30000,
            maximumAge: 5000
        }

    );

}
