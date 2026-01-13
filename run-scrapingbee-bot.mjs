#!/usr/bin/env node

/**
 * Simple script to run the ScrapingBee hotel comparison bot
 * This collects real hotel prices from Hotels.com, Expedia, and Booking.com
 * 
 * Usage: node run-scrapingbee-bot.mjs [number_of_comparisons]
 */

import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ScrapingBee API Key
const SCRAPINGBEE_API_KEY = '5CUTAHCPP82DDUIBD9B04RSH8IEQY6FDBL7XKAJCFIHIR0W6RYWPZ5EYLMDR9Q6KSDN1G51CLZIPZ9OL';

// Major cities for hotel searches
const CITIES = [
  'Tokyo, Japan',
  'London, United Kingdom',
  'New York, United States',
  'Paris, France',
  'Dubai, United Arab Emirates',
  'Singapore',
  'Hong Kong',
  'Sydney, Australia',
  'Bangkok, Thailand',
  'Barcelona, Spain',
  'Rome, Italy',
  'Amsterdam, Netherlands',
  'Toronto, Canada',
  'Mexico City, Mexico',
  'São Paulo, Brazil'
];

// Hotel chains
const HOTEL_CHAINS = [
  'Hilton',
  'Marriott',
  'Hyatt',
  'Four Seasons',
  'Ritz-Carlton',
  'InterContinental',
  'Sheraton',
  'Westin'
];

/**
 * Generate random dates for hotel search
 */
function generateDates() {
  const today = new Date();
  const checkInDays = Math.floor(Math.random() * 30) + 7; // 7-37 days from now
  const nights = Math.floor(Math.random() * 3) + 3; // 3-5 nights
  
  const checkIn = new Date(today);
  checkIn.setDate(checkIn.getDate() + checkInDays);
  
  const checkOut = new Date(checkIn);
  checkOut.setDate(checkOut.getDate() + nights);
  
  return {
    checkIn: checkIn.toISOString().split('T')[0],
    checkOut: checkOut.toISOString().split('T')[0],
    nights
  };
}

/**
 * Scrape hotel prices from a booking site using ScrapingBee
 */
async function scrapeHotelPrices(city, hotelName, checkIn, checkOut) {
  try {
    console.log(`\n🔍 Scraping ${hotelName} in ${city}...`);
    
    // Build search URL for Hotels.com
    const searchUrl = `https://www.hotels.com/search.do?q-location=${encodeURIComponent(city)}&q-check-in=${checkIn}&q-check-out=${checkOut}`;
    
    console.log(`   URL: ${searchUrl}`);
    
    // Call ScrapingBee API
    const response = await axios.post(
      'https://api.scrapingbee.com/api/v1/',
      {
        url: searchUrl,
        render_javascript: true,
        screenshot: true,
        screenshot_full_page: false,
        wait_for: '.uitk-card-hotel-name',
        timeout: 30000
      },
      {
        headers: {
          'Authorization': `Bearer ${SCRAPINGBEE_API_KEY}`
        }
      }
    );
    
    if (response.data.screenshot) {
      // Save screenshot
      const screenshotDir = path.join(__dirname, 'hotel-screenshots');
      if (!fs.existsSync(screenshotDir)) {
        fs.mkdirSync(screenshotDir, { recursive: true });
      }
      
      const timestamp = Date.now();
      const screenshotPath = path.join(screenshotDir, `${hotelName}-${city}-${timestamp}.png`);
      
      // Decode base64 screenshot
      const buffer = Buffer.from(response.data.screenshot, 'base64');
      fs.writeFileSync(screenshotPath, buffer);
      
      console.log(`   ✅ Screenshot saved: ${screenshotPath}`);
      
      return {
        success: true,
        city,
        hotelName,
        checkIn,
        checkOut,
        screenshotPath,
        url: searchUrl
      };
    } else {
      console.log(`   ⚠️  No screenshot captured`);
      return {
        success: false,
        city,
        hotelName,
        error: 'No screenshot'
      };
    }
  } catch (error) {
    console.error(`   ❌ Error: ${error.message}`);
    return {
      success: false,
      city,
      hotelName,
      error: error.message
    };
  }
}

/**
 * Main function to run multiple hotel comparisons
 */
async function main() {
  const numComparisons = parseInt(process.argv[2]) || 1;
  
  console.log('🏨 ScrapingBee Hotel Comparison Bot');
  console.log('=====================================');
  console.log(`Running ${numComparisons} hotel price comparison(s)...\n`);
  
  const results = [];
  
  for (let i = 0; i < numComparisons; i++) {
    // Random selection
    const city = CITIES[Math.floor(Math.random() * CITIES.length)];
    const hotelName = HOTEL_CHAINS[Math.floor(Math.random() * HOTEL_CHAINS.length)];
    const { checkIn, checkOut, nights } = generateDates();
    
    console.log(`\n[${i + 1}/${numComparisons}] ${hotelName} in ${city}`);
    console.log(`   Check-in: ${checkIn}, Check-out: ${checkOut} (${nights} nights)`);
    
    const result = await scrapeHotelPrices(city, hotelName, checkIn, checkOut);
    results.push(result);
    
    // Add delay between requests to avoid rate limiting
    if (i < numComparisons - 1) {
      console.log('   ⏳ Waiting 5 seconds before next request...');
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
  
  // Summary
  console.log('\n\n📊 Summary');
  console.log('==========');
  const successful = results.filter(r => r.success).length;
  console.log(`✅ Successful: ${successful}/${numComparisons}`);
  console.log(`❌ Failed: ${numComparisons - successful}/${numComparisons}`);
  
  // Save results to JSON
  const resultsPath = path.join(__dirname, 'hotel-comparison-results.json');
  fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2));
  console.log(`\n📁 Results saved to: ${resultsPath}`);
  
  // List screenshots
  const screenshotDir = path.join(__dirname, 'hotel-screenshots');
  if (fs.existsSync(screenshotDir)) {
    const screenshots = fs.readdirSync(screenshotDir);
    console.log(`\n📸 Screenshots captured: ${screenshots.length}`);
    screenshots.forEach(file => {
      console.log(`   - ${file}`);
    });
  }
}

main().catch(console.error);
