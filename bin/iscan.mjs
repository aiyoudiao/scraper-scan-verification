#!/usr/bin/env node
import signale from "signale";
import chalk from "chalk";
import iscan from "../src/main.js";

signale.log(`
${chalk.bgGreen("一个扫描网络文件的简单工具")}
${chalk.bgBlue("a simple tool for scanning web files")}`);

signale.log(`
如果你的运行目录中没有setting.json文件，那么当你运行这行命令时会自动在当前目录下生成一个setting.json文件的配置，配置如下：
{
  "root": "./temp", // 本地临时存储文件的根目录
  "keywords": [], // 关键字列表
  "sites": [], // 网站URL列表
  "log": "./log.json", // 日志文件
  "retention": false, // 保留你扫描过的文件
  "exclude": [] // 要排除的文件，比如那些不进行扫描，可以填入部分文件名
}

If you do not have a setting.json file in your directory, then when you run this command, a setting.json file configuration will be generated automatically in the current directory, as follows:
{
  "root": "./temp", // the root directory of the local temporary storage file
  "keywords": [], // List of keywords
  "sites": [], // List of website urls
  "log": "./log.json", // log file
  "retention": false, // Keep the files you scanned
  "exclude": [], // Files to exclude, such as those not scanned, with a partial filename
}`);
signale.log(`
${chalk.red(
  "Please fill in at least keywords and sites in setting.json or the program won't run. "
)}
${chalk.red(
  "请至少填充 setting.json 中的 keywords 和 sites ，不然程序不会运行。"
)}
`);
await iscan();
