import { chromium } from "playwright";
import * as fs from "fs";

async function debugWHR() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    console.log("Logging in to WHR...");
    await page.goto("https://web3demo.wholesalehotelrates.com/login", {
      waitUntil: "domcontentloaded",
    });

    const usernameInput = await page.$("input[type='text']");
    const passwordInput = await page.$("input[type='password']");

    if (usernameInput && passwordInput) {
      await usernameInput.fill("web3demo");
      await passwordInput.fill("web3demo!@");
      await page.click("button[type='submit']");
      await page.waitForNavigation({ waitUntil: "domcontentloaded" }).catch(() => {});
      await page.waitForTimeout(2000);
    }

    console.log("Navigating to Travel page...");
    await page.goto("https://web3demo.wholesalehotelrates.com/Travel", {
      waitUntil: "domcontentloaded",
    });

    console.log(`Current URL: ${page.url()}`);
    await page.waitForTimeout(2000);

    // Get all input fields
    const inputs = await page.$$("input");
    console.log(`\nFound ${inputs.length} input fields:`);
    for (let i = 0; i < Math.min(20, inputs.length); i++) {
      const id = await inputs[i].getAttribute("id");
      const name = await inputs[i].getAttribute("name");
      const type = await inputs[i].getAttribute("type");
      const placeholder = await inputs[i].getAttribute("placeholder");
      console.log(`  [${i}] id: ${id}, name: ${name}, type: ${type}, placeholder: ${placeholder}`);
    }

    // Get all buttons
    const buttons = await page.$$("button");
    console.log(`\nFound ${buttons.length} buttons:`);
    for (let i = 0; i < Math.min(10, buttons.length); i++) {
      const id = await buttons[i].getAttribute("id");
      const text = await buttons[i].textContent();
      const type = await buttons[i].getAttribute("type");
      console.log(`  [${i}] id: ${id}, text: ${text}, type: ${type}`);
    }

    // Save the full HTML
    const html = await page.content();
    fs.writeFileSync("/tmp/whr-travel-page.html", html);
    console.log("\nFull HTML saved to /tmp/whr-travel-page.html");

    // Take a screenshot
    await page.screenshot({ path: "/tmp/whr-travel-page.png" });
    console.log("Screenshot saved to /tmp/whr-travel-page.png");
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await page.close();
    await browser.close();
  }
}

debugWHR();
