// ==========================================
// STA Finder
// ==========================================

// Menyimpan seluruh data STA dari CSV
let dataSTA = [];

// ==========================================
// Membaca file CSV saat website dibuka
// ==========================================

fetch("sta.csv")
    .then(response => response.text())
    .then(text => {

        let baris = text.trim().split("\n");

        // Lewati header
        for (let i = 1; i < baris.length; i++) {

            let kolom = baris[i].split(",");

            dataSTA.push({
                sta: kolom[0],
                lat: parseFloat(kolom[1]),
                lon: parseFloat(kolom[2])
            });

        }

        console.log("Data STA berhasil dibaca");
        console.log(dataSTA);

    })
    .catch(error => {
        console.error("Gagal membaca CSV:", error);
    });


// ==========================================
// Rumus Haversine (Menghitung jarak)
// ==========================================

function hitungJarak(lat1, lon1, lat2, lon2) {

    const R = 6371000; // Radius bumi (meter)

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
// Tombol Cari Lokasi
// ==========================================

function cekLokasi() {

    if (!navigator.geolocation) {
        alert("Browser tidak mendukung Geolocation");
        return;
    }

    navigator.geolocation.watchPosition(

        function (pos) {

            let lat = pos.coords.latitude;
            let lon = pos.coords.longitude;
            let akurasi = pos.coords.accuracy;

            // Jangan gunakan lokasi jika akurasinya buruk
            if (akurasi > 20) {
                console.log("Menunggu GPS lebih akurat...");
                return;
            }

            document.getElementById("lat").innerHTML = lat.toFixed(7);
            document.getElementById("lon").innerHTML = lon.toFixed(7);

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

            document.getElementById("sta").innerHTML = staTerdekat;

        },

        function (error) {

            console.log(error);

            alert("GPS gagal dibaca.");

        },

        {
            enableHighAccuracy: true,
            maximumAge: 0,
            timeout: 30000
        }

    );

}
// ===============================
// Cari STA terdekat
// ===============================

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

document.getElementById("sta").innerHTML = staTerdekat;
document.getElementById("jarak").innerHTML = jarakTerkecil.toFixed(2) + " meter";

        },

        function(error) {

            console.log(error);

            switch(error.code){
                case error.PERMISSION_DENIED:
                    alert("Izin lokasi ditolak.");
                    break;
                case error.POSITION_UNAVAILABLE:
                    alert("Lokasi tidak tersedia.");
                    break;
                case error.TIMEOUT:
                    alert("GPS timeout.");
                    break;
                default:
                    alert("Terjadi kesalahan GPS.");
            }

        },

        {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 0
        }

    );

}