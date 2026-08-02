import fs from 'fs/promises';
import { pipeline } from 'stream/promises';

const readablefile = await fs.open('./hello.txt');
const writablefile = await fs.open('./hello2.txt', 'w');

const readstream = readablefile.createReadStream();
const writestream = writablefile.createWriteStream();

try {
  await pipeline(readstream, writestream);
  console.log('Copy done');
} catch (err) {
  console.error('Pipeline failed:', err);
} finally {
  await readablefile.close();
  await writablefile.close();
}