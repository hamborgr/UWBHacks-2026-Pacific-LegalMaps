import axios from "axios";

async function test() {
    let address = '705 2nd Ave Ste 1300, Seattle, WA 98104-1797, United States';
    // Clean up address: remove Suite / Ste etc and Zip+4 and Country
    address = address.replace(/,? \b(?:Ste|Suite|Unit|Apt|Room|Fl|Floor|Bldg)\b.*?(?=,)/ig, ''); // Removes Ste 1300
    address = address.replace(/-\d{4}/, ''); // Removes -1797
    address = address.replace(/,? United States$/, '');
    
    console.log("Cleaned:", address);
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1`;
    try {
        const res = await axios.get(url, { headers: { 'User-Agent': 'MyApp/1.0' } });
        console.log("Nominatim length:", res.data.length);
        if (res.data && res.data.length > 0) {
            console.log("Loc:", res.data[0].lat, res.data[0].lon);
        }
    } catch (e) {
        console.log("Error", e);
    }
}
test();
