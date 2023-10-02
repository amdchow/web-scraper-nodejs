const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');

const app = express();
const port = 3000;

// Function to scrape article headlines
const webScraper = async () => {
  try {
    const response = await axios.get('https://sea.mashable.com/tech/');

    if (response.status === 200) {
      const headlines = [];
      const $ = cheerio.load(response.data);

      // Find the <li> elements with class "blogroll"
      $('li.blogroll').each((index, element) => {
        // Extract the data of interest
        const pageUrl = $(element).find('a').attr('href');
        const date = $(element).find('time.datepublished').text();
        const name = $(element).find('div.caption').text().trim();

        // Filter out not interesting data
        if (name && pageUrl && date) {
          // Convert the data extracted into a more readable object
          const blogPost = {
            url: pageUrl,
            name: name,
            date: date,
          };

          // Add the object containing the scraped data to the headlines array
          headlines.push(blogPost);
        }
      });

      return headlines;
    } else {
      throw new Error('Failed to retrieve data from the article.');
    }
  } catch (error) {
    throw error;
  }
};

app.get('/', async (req, res) => {
  try {
    const headlines = await webScraper();

    // Display headlines in a basic HTML page
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Article Headlines</title>
      </head>
      <body>
        <h1>Headlines</h1>
        <ul>
          ${headlines
            .map(
              (headline) =>
                `<li><a href="${headline.url}">${headline.name}</a> (Published on ${headline.date})</li>`
            )
            .join('')}
        </ul>
      </body>
      </html>
    `;

    res.send(html);
  } catch (error) {
    res.status(500).send('An error occurred.');
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
