// ==========================================
// STA Finder
// ==========================================

let dataSTA = [];

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

    document.getElementById("gpsStatus").innerHTML =
        "🟡 Mengambil lokasi...";

    if (!navigator.geolocation) {

        alert("Browser tidak mendukung GPS");
        return;

    }

    navigator.geolocation.getCurrentPosition(

        function (pos) {

            let lat = pos.coords.latitude;
            let lon = pos.coords.longitude;
            let akurasi = pos.coords.accuracy;

            // ==========================
            // Tampilkan Informasi GPS
            // ==========================

            document.getElementById("gpsStatus").innerHTML =
                "🟢 Terhubung";

            document.getElementById("lat").innerHTML =
                lat.toFixed(7);

            document.getElementById("lon").innerHTML =
                lon.toFixed(7);

            document.getElementById("akurasi").innerHTML =
                "± " + akurasi.toFixed(1) + " meter";

            document.getElementById("waktu").innerHTML =
                new Date().toLocaleString("id-ID");


            // ==========================
            // Cari STA Terdekat
            // ==========================

            let jarakTerkecil = Infinity;
            let staTerdekat = "-";

            for (let titik of dataSTA) {

                let jarak = hitungJarak(
                    lat,
                    lon,
                    titik.lat,
                    titik.lon
                );

                if (jarak < jarakTerkecil) {

                    jarakTerkecil = jarak;
                    staTerdekat = titik.sta;

                }

            }


            // ==========================
            // Tampilkan Hasil
            // ==========================

            document.getElementById("sta").innerHTML =
                staTerdekat;

        },

        function (error) {

            console.log(error);

            document.getElementById("gpsStatus").innerHTML =
                "🔴 GPS Gagal";

            alert("GPS gagal dibaca.");

        },

        {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 0
        }

    );

}
