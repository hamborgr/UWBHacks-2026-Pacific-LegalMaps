import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

async function test() {
  const GOOGLE_MAPS_KEY = process.env.VITE_GOOGLE_MAPS_API_KEY;
  if (!GOOGLE_MAPS_KEY) return console.log("NO KEY");
  const address = '705 2nd Ave Ste 1300, Seattle, WA 98104-1797, United States';
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${GOOGLE_MAPS_KEY}`;
  const res = await axios.get(url);
  console.log(res.data.results?.[0]?.geometry?.location);
}
test();
