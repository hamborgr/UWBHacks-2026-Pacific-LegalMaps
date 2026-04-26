import axios from 'axios';
async function test() {
  const { data } = await axios.get('http://localhost:3000/api/lawyers?city=Seattle&zip=98104');
  console.log(data.lawyers?.map(l => ({ name: l.name, lat: l.lat, lng: l.lng, address: l.address })));
}
test();
