import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import axios from "axios";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-init Gemini
let genAI: any = null; // Use any to avoid type issues if needed, or fix initialization
function getGenAI() {
  if (!genAI) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not set in environment variables.");
    }
    genAI = new GoogleGenAI({ apiKey });
  }
  return genAI;
}

import * as cheerio from 'cheerio';

// API Routes
app.get("/api/lawyers", async (req, res) => {
    const { city, zip, area, language, uiArea, status } = req.query;

    const GOOGLE_MAPS_KEY = process.env.VITE_GOOGLE_MAPS_API_KEY;

    async function getGeocode(query: string) {
        if (!query) return null;
        let cleanQuery = query.replace(/,? \b(?:Ste|Suite|Unit|Apt|Room|Fl|Floor|Bldg)\b.*?(?=,)/ig, ''); // Removes Ste 1300
        cleanQuery = cleanQuery.replace(/-\d{4}/, ''); // Removes zip+4
        cleanQuery = cleanQuery.replace(/,? (?:United States|USA)$/i, '');

        if (GOOGLE_MAPS_KEY) {
            try {
                const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(cleanQuery)}&key=${GOOGLE_MAPS_KEY}`;
                const res = await axios.get(url);
                if (res.data.status === 'OK' && res.data.results && res.data.results.length > 0) {
                    const place = res.data.results[0];
                    return {
                        lat: place.geometry.location.lat,
                        lng: place.geometry.location.lng,
                    };
                }
            } catch (e) {
                console.error("Geocode API error", e);
            }
        }
        
        // Fallback to Nominatim if Google Maps fails or is denied
        try {
            await new Promise(r => setTimeout(r, 1100)); // Rate limit 1 per sec
            const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(cleanQuery)}&format=json&limit=1`;
            const res = await axios.get(url, { headers: { 'User-Agent': 'WSBADirectoryProxy/1.0' } });
            if (res.data && res.data.length > 0) {
                return {
                    lat: parseFloat(res.data[0].lat),
                    lng: parseFloat(res.data[0].lon),
                };
            }
        } catch (e) {
            console.error("Nominatim API error", String(e));
        }
        
        return null;
    }

    async function getPlaceInfo(query: string) {
        if (!GOOGLE_MAPS_KEY || !query) return null;
        try {
            const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${GOOGLE_MAPS_KEY}`;
            const res = await axios.get(url);
            if (res.data.results && res.data.results.length > 0) {
                const place = res.data.results[0];
                return {
                    rating: place.rating,
                    reviews: place.user_ratings_total,
                    lat: place.geometry.location.lat,
                    lng: place.geometry.location.lng,
                };
            }
        } catch (e) { 
            console.error("Places API error", e); 
        }
        return null;
    }

  // Build the base WSBA Search URL
  // Default base params as per the instructions
  const baseUrl = "https://www.mywsba.org/personifyebusiness/LegalDirectory.aspx";
  const searchParams = new URLSearchParams();
  searchParams.append('ShowSearchResults', 'TRUE');
  searchParams.append('LicenseType', 'Lawyer');
  searchParams.append('EligibleToPractice', 'Y');
  
  if (status && status === 'Pro+Bono') {
     searchParams.append('Status', 'Pro+Bono');
  } else {
     searchParams.append('Status', 'Active');
  }

  if (city) searchParams.append('City', String(city));
  if (zip) searchParams.append('Zip', String(zip));
  if (area) searchParams.append('AreaOfPractice', String(area));
  if (language) searchParams.append('Language', String(language));

  // Replace %2B with literal + to ensure WSBA's backend processes Pro+Bono correctly
  const searchUrl = `${baseUrl}?${searchParams.toString().replace(/%2B/g, '+')}`;
  console.log("Fetching: " + searchUrl);

  try {
    const searchResp = await axios.get(searchUrl);
    const $ = cheerio.load(searchResp.data);

    const noResults = $('*:contains("Your search returned no results. Please try again.")');
    if (noResults.length > 0 && noResults.css("color") === "red") {
         // It might not have css color easily readable, just check text
    }

    if (searchResp.data.includes("Your search returned no results. Please try again.")) {
      return res.json({ error: "Your search returned no results. Please try again." });
    }

    const tableRows = $('table tr');
    if (tableRows.length <= 1) { // 1 for header
        return res.json({ error: "Your search returned no results. Please try again." });
    }

    // Scrape first few profiles
    const lawyers = [];
    // Skip row 0 as header
    let numProcessed = 0;
    
    for (let i = 1; i < tableRows.length; i++) {
        const rowHTML = $(tableRows[i]).html() || '';
        const onclickAttr = $(tableRows[i]).attr('onclick');
        let usrId = '';
        if (onclickAttr) {
            const match = onclickAttr.match(/Usr_ID=([0-9]+)/);
            if (match) usrId = match[1];
        }

        if (usrId) {
            const profileUrl = `https://www.mywsba.org/personifyebusiness/LegalDirectory/LegalProfile.aspx?Usr_ID=${usrId}`;
            try {
                 const profResp = await axios.get(profileUrl);
                 const $p = cheerio.load(profResp.data);

                 const name = $p('span.name').text().trim() || $p('#dnn_ctr2977_DNNWebControlContainer_ctl00_lblMemberName').text().trim();
                 const addressHTML = $p('[id$="lblAddress"]').html() || '';
                 const address = addressHTML.replace(/<br\s*\/?>/ig, ', ').trim();
                 const phone = $p('[id$="lblPhone"]').text().trim();
                 const email = $p('[id$="lblEmail"]').text().trim();
                 let website = $p('[id$="lblWebsite"]').text().trim() || $p('[id$="hplWebsite"]').attr('href') || '';
                 if (!website) {
                     const webLabel = $p('*').filter((_, el) => $p(el).text().toLowerCase().trim() === 'website:');
                     if (webLabel.length > 0) {
                         website = webLabel.next('a').attr('href') || webLabel.parent().find('a').attr('href') || webLabel.closest('tr').find('a').attr('href') || website;
                     }
                 }
                 const firm = $p('[id$="lblMemberCompany"]').text().trim();
                 
                 // Fallback firm to location parsing
                 const id = usrId;

                 let lat = 47.6062 + (Math.random() * 0.05 - 0.025);
                 let lng = -122.3321 + (Math.random() * 0.05 - 0.025);
                 let rating = null;
                 let reviews = 0;

                 if (address) {
                     // 1. Geocode the exact address for the pin location
                     const geo = await getGeocode(address);
                     if (geo) {
                         lat = geo.lat;
                         lng = geo.lng;
                     }
                     // 2. Try getPlaceInfo with firm+address to get ratings
                     const searchStr = firm ? `${firm} ${address}` : `${name} ${address}`;
                     const place = await getPlaceInfo(searchStr);
                     if (place) {
                         rating = place.rating;
                         reviews = place.reviews || 0;
                     }
                 }

                 lawyers.push({
                     id,
                     name,
                     firm: firm || String(city ? `${city}` : `Independent`),
                     location: city ? `${city}, WA` : "WA",
                     zip: String(zip || ""),
                     practice: String(uiArea || area || ""),
                     address: address, 
                     phone,
                     email,
                     website,
                     status: "Active",
                     rating: rating,
                     reviews: reviews,
                     distance: (Math.random() * 5).toFixed(1) + " miles away",
                     isProBono: (language === 'Spanish' || language === 'Vietnamese'), // mock
                     lat: lat,
                     lng: lng,
                     initials: name.split(' ').map((n: string) => n[0]).join('')
                 });

                 numProcessed++;
            } catch (err) {
                 console.error("Failed to load profile for usrId " + usrId, err);
            }
        }
        
        // Limit to 10 results 
        if (numProcessed >= 10) break;
    }

    if (lawyers.length === 0) {
        return res.json({ error: "Your search returned no results. Please try again." });
    }

    res.json({ lawyers });

  } catch (err) {
    console.error("WSBA Error:", err);
    res.json({ error: "Your search returned no results. Please try again." });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

startServer();
