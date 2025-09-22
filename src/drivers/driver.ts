import { type Browser, type BrowserContext, chromium, type Page } from "playwright";
import type { DriverOptions } from "./options";

export class Driver {
  private browser: Browser;
  private context: BrowserContext;
  private _page: Page;
  private pages: Page[];
  private timeout: number;

  get page(): Page {
    return this._page;
  }

  async init(options?: DriverOptions): Promise<void> {
    this.timeout = 5 * 1000;
    this.browser = await chromium.launch({
      headless: options?.headless ?? false,
      timeout: this.timeout,
      logger: {
        isEnabled: (_name: string, _severity: "verbose" | "info" | "warning" | "error"): boolean =>
          options?.logging ?? false,
        log: (name: string, _severity: "verbose" | "info" | "warning" | "error", message: string | Error): void => {
          console.log(`${name} ${message}`);
        },
      },
    });
    this.context = await this.browser.newContext({ recordVideo: { dir: "test-result/videos/" } });
    this.pages = [];
    this.context.on("page", async (page) => {
      this.pages.push(page);
    });
    this._page = await this.context.newPage();
  }

  async open(url: string): Promise<void> {
    await this.page.goto(url);
  }

  async saveScreenshot(name: string): Promise<void> {
    await this.page.screenshot({ path: `test-result/screenshots/${name}.png` });
  }

  async saveVideo(name: string): Promise<void> {
    await this.context.close();
    const video = this.page.video();
    await video.saveAs(`test-result/videos/${name}.webm`);
    await video.delete();
  }

  async deleteVideo(): Promise<void> {
    await this.context.close();
    const video = this.page.video();
    await video.delete();
  }

  async addItemInLocalStorage(key: string, value: string): Promise<void> {
    await this.page.evaluate(({ key, value }) => localStorage.setItem(key, value), { key, value });
  }

  async quit(): Promise<void> {
    await this.browser.close();
  }
}
