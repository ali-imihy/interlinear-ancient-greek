import fs from "fs";

const raw = fs.readFileSync("data/lsj.json", "utf8");
const data = JSON.parse(raw);

console.log(Array.isArray(data));
console.log(data.length);
console.log(data[0]);