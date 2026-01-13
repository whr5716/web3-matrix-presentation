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

    console.log(`Current URL after login: ${page.url()}`);

    // Get all links on the page
    const links = await page.$$("a");
    console.log(`\nFound ${links.length} links on the page:`);
    for (let i = 0; i < Math.min(15, links.length); i++) {
      const href = await links[i].getAttribute("href");
      const text = await links[i].textContent();
      console.log(`  [${i}] href: ${href}, text: ${text}`);
    }

    // Get all form elements
    const forms = await page.$$("form");
    console.log(`\nFound ${forms.length} forms on the page`);
    for (let i = 0; i < Math.min(5, forms.length); i++) {
      const action = await forms[i].getAttribute("action");
      const method = await forms[i].getAttribute("method");
      const inputs = await forms[i].$$("input");
      console.log(`  [${i}] action: ${action}, method: ${method}, inputs: ${inputs.length}`);
      for (let j = 0; j < Math.min(5, inputs.length); j++) {
        const id = await inputs[j].getAttribute("id");
        const name = await inputs[j].getAttribute("name");
        const type = await inputs[j].getAttribute("type");
        console.log(`      input[${j}] id: ${id}, name: ${name}, type: ${type}`);
      }
    }

    // Save the full HTML
    const html = await page.content();
    fs.writeFileSync("/tmp/whr-page.html", html);
    console.log("\nFull HTML saved to /tmp/whr-page.html");

    // Take a screenshot
    await page.screenshot({ path: "/tmp/whr-login-page.png" });
    console.log("Screenshot saved to /tmp/whr-login-page.png");
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await page.close();
    await browser.close();
  }
}

debugWHR();
