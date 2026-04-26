import axios from 'axios';
import * as cheerio from 'cheerio';

async function testScrape() {
  const url = "https://www.mywsba.org/personifyebusiness/LegalDirectory.aspx?ShowSearchResults=TRUE&LicenseType=Lawyer&EligibleToPractice=Y&Status=Active&City=Seattle&Zip=98104&AreaOfPractice=Immigration-Naturaliza";
  console.log("Fetching: " + url);
  try {
    const profileUrl = "https://www.mywsba.org/personifyebusiness/LegalDirectory/LegalProfile.aspx?Usr_ID=000000005932";
    console.log("Fetching profile: " + profileUrl);
    const profResp = await axios.get(profileUrl);
    const $p = cheerio.load(profResp.data);
    
    const address = $p('[id$="lblAddress"]').html()?.replace(/<br\s*\/?>/ig, ', ') || '';
    const phone = $p('[id$="lblPhone"]').text().trim();
    const email = $p('[id$="lblEmail"]').text().trim();
    const website = $p('[id$="lblWebsite"]').text().trim() || $p('[id$="hplWebsite"]').attr('href') || $p('a:contains("Website")').attr('href') ||'';
    const firm = $p('[id$="lblMemberCompany"]').text().trim();
    console.log("Address:", address);
    console.log("Phone:", phone);
    $p('a').each((i, el) => {
        const href = $p(el).attr('href');
        const text = $p(el).text().trim();
        if (href && (href.includes('mailto:') || href.includes('http') || text.includes('@'))) {
             console.log(`Link: ${text} -> ${href}`);
        }
    })







  } catch (e) {
    console.error(e);
  }
}

testScrape();
