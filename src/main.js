import fs from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import scrape from "website-scraper";
import PuppeteerPlugin from "website-scraper-puppeteer";
import chalk from "chalk";
import ora from "ora";
import signale from "signale";

export default async () => {
  const isDirEmpty = async (dirPath) => {
    const files = await fs.readdir(dirPath);

    for (const file of files) {
      const filePath = path.join(dirPath, file);
      const stats = await fs.stat(filePath);

      if (stats.isDirectory()) {
        if (!(await isDirEmpty(filePath))) {
          return false;
        }
      } else {
        return false;
      }
    }

    return true;
  };

  const initialization = async () => {
    let setting;
    try {
      const json = await fs.readFile("./setting.json", { encoding: "utf8" });
      setting = JSON.parse(json);
    } catch (error) {
      setting = {
        root: "./temp", // 本地临时存储文件的根目录
        keywords: [], // 关键字列表
        sites: [], // 网站URL列表
        log: "./log.json", // 日志文件
        retention: false, // 保留文件
        exclude: [], // 排除文件
      };
      await fs.writeFile("./setting.json", JSON.stringify(setting, null, 2), {
        encoding: "utf8",
      });
    }

    return setting;
  };

  const { root, keywords, sites, log, retention, exclude } =
    await initialization();

  if (!(keywords?.length && sites?.length)) {
    signale.info(
      `Define the website URL to request and the keywords to check in the setting.json file`
    );
    process.exit(0);
  }

  // 对每个网站进行爬取
  for (const site of sites) {
    const spinner = ora(`Visiting ${chalk.cyan(site)}...`).start();
    const { hostname, pathname } = new URL(site);

    const directory = `${root}/${hostname}/${path.dirname(pathname)}`;
    if (existsSync(directory)) {
      await fs.rm(directory, { recursive: true, force: true });
    }
    try {
      let result = await scrape({
        urls: [site],
        directory,
        plugins: [
          new PuppeteerPlugin({
            launchOptions: { headless: "new" },
            gotoOptions: {},
            scrollToBottom: null,
            blockNavigation: false,
          }),
        ],
      });

      spinner.succeed(`Visit ${chalk.cyan(site)}`);
      const recursiveCheck = async (list, index = 0) => {
        // 过滤掉要排除的文件
        list = list.filter(
          (res) => !exclude.find((tmp) => res.filename.search(tmp))
        );

        // 检查每个文件的文件名和内容
        for (const item of list) {
          const filename = item.filename;
          const text = item.text;

          if (index === 0) {
            signale.log(
              `${chalk.green(
                ">"
              )} Start searching through the file ${chalk.green(filename)}.`
            );
          }

          // 检查文件名和内容中的关键字
          for (const keyword of keywords) {
            if (filename.includes(keyword) || text.includes(keyword)) {
              signale.log(
                `${chalk.red("x")} Found "${keyword}" in ${filename}`
              );
            }
          }

          item?.children?.length &&
            (await recursiveCheck(item.children, index + 1));

          if (index === 0) {
            signale.log(
              `${chalk.green(
                "<"
              )} Search is complete from the file ${chalk.green(filename)}`
            );
          }
        }
      };

      await recursiveCheck(result);

      !retention && (await fs.rm(directory, { recursive: true, force: true }));
    } catch (error) {
      spinner.fail(
        `Failed to visit ${chalk.cyan(site)}: ${chalk.red(error.message)}`
      );
    }
    signale.log();
  }

  if (await isDirEmpty(root)) {
    await fs.rm(root, { recursive: true, force: true });
    signale.success(`Because ${root} is empty, so delete ${root}.`);
    signale.log();
  }
};
