const express = require('express');
const puppeteer = require('puppeteer');
const app = express();
const port = 3000;

// Function to scrape article headlines using Puppeteer
const webScraper = async () => {
  try {
    const headlines = [];
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    await page.goto('https://sea.mashable.com/tech/');
    let showMoreClickCount = 0;

    while (true) {
      // Extract data from the current page
      const scrapedData = await page.evaluate(() => {
        const data = [];
        const articles = document.querySelectorAll('li.blogroll');

        articles.forEach((article) => {
          const pageUrl = article.querySelector('a').getAttribute('href');
          const date = article.querySelector('time.datepublished').textContent;
          const name = article.querySelector('div.caption').textContent.trim();

          if (name && pageUrl && date) {
            data.push({ url: pageUrl, name, date });
          }
        });

        return data;
      });

      // Filter out articles older than January 1, 2022
      const filteredData = scrapedData.filter((article) => {
        const articleDate = new Date(article.date);
        return !isNaN(articleDate) && articleDate >= new Date('2022-01-01');
      });

      headlines.push(...filteredData);

      // Click "Show More" button to load more articles if available, up to 5 times
      const showMoreButton = await page.$('#showmore');
      if (showMoreButton && showMoreClickCount < 5) {
        await showMoreButton.click();
        await page.waitForTimeout(2000); // Add a delay to allow content to load (adjust as needed)
        showMoreClickCount++;
      } else {
        break; // No more "Show More" button or clicked 5 times, exit the loop
      }
    }

    await browser.close();
    return headlines;
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
        <h1>Mashable Tech Headlines</h1>
        <ul>
          ${headlines
            .map(
              (headline) =>
                `<li><a href="${headline.url}" target="_blank">${headline.name}</a> (Published on ${headline.date})</li>`
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

// Export the Express API
module.exports = app;