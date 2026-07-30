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

    if(dataSTA.length==0){
        alert("CSV belum selesai dimuat.");
        return;
    }

    document.getElementById("gpsStatus").innerHTML="🟡 Mengambil lokasi...";

    navigator.geolocation.getCurrentPosition(

    function(pos){

        let lat=pos.coords.latitude;
        let lon=pos.coords.longitude;

        document.getElementById("gpsStatus").innerHTML="🟢 Terhubung";
        document.getElementById("lat").innerHTML=lat.toFixed(7);
        document.getElementById("lon").innerHTML=lon.toFixed(7);
        document.getElementById("waktu").innerHTML=
        new Date().toLocaleString("id-ID");



        //----------------------------------
        // Cari STA terdekat
        //----------------------------------

        let jarakTerkecil=Infinity;
        let indexSTA=-1;

        for(let i=0;i<dataSTA.length;i++){

            let jarak=hitungJarak(
                lat,
                lon,
                dataSTA[i].lat,
                dataSTA[i].lon
            );

            if(jarak<jarakTerkecil){

                jarakTerkecil=jarak;
                indexSTA=i;

            }

        }



        //----------------------------------
        // Jika tidak ditemukan
        //----------------------------------

        if(indexSTA==-1){

            document.getElementById("sta").innerHTML="-";
            document.getElementById("jarak").innerHTML="-";
            document.getElementById("arah").innerHTML="-";

            return;

        }



        //----------------------------------
        // Tentukan arah perjalanan
        //----------------------------------

        let arah="Posisi awal";

        if(lastIndexSTA!==null){

            if(indexSTA>lastIndexSTA){

                arah="➡ Menuju STA Membesar";

            }

            else if(indexSTA<lastIndexSTA){

                arah="⬅ Menuju STA Mengecil";

            }

            else{

                arah="⏸ Tetap di STA yang sama";

            }

        }

        lastIndexSTA=indexSTA;



        //----------------------------------
        // Tampilkan hasil
        //----------------------------------

        document.getElementById("sta").innerHTML=
        dataSTA[indexSTA].sta;

        document.getElementById("jarak").innerHTML=
        jarakTerkecil.toFixed(1)+" meter";

        document.getElementById("arah").innerHTML=
        arah;

    },

    function(error){

        document.getElementById("gpsStatus").innerHTML="🔴 GPS Gagal";

        alert(error.message);

    },

    {

        enableHighAccuracy:true,
        timeout:30000,
        maximumAge:0

    });

}
}
