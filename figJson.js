const fs = require('fs');
const axios = require('axios');

const FIGMA_URL = 'https://api.qa.unifyapps.com/api-endpoint/figma/Fetch-Figma-Details';
const FILE_URL = 'https://www.figma.com/design/huI2r4FfZauzyQRfwb2sTs/Untitled?node-id=5-67&t=nafiDHsCG1ytZJ0d-4';

async function fetchFigmaJson() {
    try {
        const response = await axios.post(FIGMA_URL, {
            fileUrl: FILE_URL
        }, {
            headers: { 'Content-Type': 'application/json' }
        });
        const beautified = JSON.stringify(response.data, null, 2);
        fs.writeFileSync('figma.json', beautified);
        console.log('Figma JSON saved to figma.json');
    } catch (error) {
        console.error('Error fetching Figma JSON:', error.message);
    }
}

fetchFigmaJson();