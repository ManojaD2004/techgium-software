import chalk from "chalk";
import fs from "fs";
import path from "path";

function getCompanyMetadata() {
  type CompanyMetadata = {
    workHours: number;
  };
  try {
    const compnayMetadata: CompanyMetadata = JSON.parse(
      fs.readFileSync(path.join(process.cwd(), `/metadata/company.json`), {
        encoding: "utf8",
      })
    );
    return compnayMetadata;
  } catch (error: any) {
    console.log(chalk.red(`Error: ${error?.message}`));
    return null;
  }
}

export { getCompanyMetadata };
