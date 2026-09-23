/**
 * A MINIMAL ZIP WRITER — enough to build a .xlsx, and nothing more.
 *
 * WHY THIS EXISTS RATHER THAN A DEPENDENCY. An .xlsx IS a ZIP of small XML
 * files. Every entry this app writes is one we generate ourselves: five files,
 * ASCII names, none large. That is a narrow enough problem to write exactly,
 * and it keeps a fixed dependency list fixed (see CLAUDE.md, "Tech stack").
 *
 * WHAT IT DELIBERATELY DOES NOT DO, so nobody mistakes it for a general tool:
 *   - no compression (method 0, STORE). Our payload is a few KB of XML; the
 *     saving is irrelevant and DEFLATE is where the subtle bugs live.
 *   - no ZIP64, so it is correct only below 4GB — asserted, not assumed.
 *   - no directory entries, no unicode name flags, no encryption.
 *
 * It is not exported beyond the reports service for exactly that reason.
 */

/** CRC-32 (IEEE 802.3), the checksum ZIP requires per entry. */
const CRC_TABLE = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();

function crc32(buf: Buffer): number {
  let c = -1;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xFF] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
}

export interface ZipEntry {
  /** Path inside the archive, e.g. "xl/worksheets/sheet1.xml". ASCII only. */
  name: string;
  data: Buffer;
}

/**
 * A fixed DOS timestamp rather than "now".
 *
 * Two reasons, and the second is the one that matters: a spreadsheet's bytes
 * should depend only on its CONTENTS, so a test can assert on the whole file
 * and two exports of unchanged data are identical. The generation time is
 * already stated inside the document, where a reader can see it, rather than
 * only in archive metadata where they cannot.
 */
const DOS_TIME = 0;      // 00:00:00
const DOS_DATE = 0x2821; // 2000-01-01

export function buildZip(entries: ZipEntry[]): Buffer {
  const locals: Buffer[] = [];
  const centrals: Buffer[] = [];
  let offset = 0;

  for (const e of entries) {
    const name = Buffer.from(e.name, 'ascii');
    if (name.toString('ascii') !== e.name) {
      throw new Error(`ZIP entry name must be ASCII: ${e.name}`);
    }
    if (e.data.length > 0xFFFFFFFF) throw new Error('ZIP64 is not supported here');

    const crc = crc32(e.data);

    const local = Buffer.alloc(30 + name.length);
    local.writeUInt32LE(0x04034B50, 0);  // local file header signature
    local.writeUInt16LE(20, 4);          // version needed (2.0)
    local.writeUInt16LE(0, 6);           // flags
    local.writeUInt16LE(0, 8);           // method 0 = STORE
    local.writeUInt16LE(DOS_TIME, 10);
    local.writeUInt16LE(DOS_DATE, 12);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(e.data.length, 18); // compressed size
    local.writeUInt32LE(e.data.length, 22); // uncompressed size
    local.writeUInt16LE(name.length, 26);
    local.writeUInt16LE(0, 28);          // extra field length
    name.copy(local, 30);

    locals.push(local, e.data);

    const central = Buffer.alloc(46 + name.length);
    central.writeUInt32LE(0x02014B50, 0); // central directory signature
    central.writeUInt16LE(20, 4);         // version made by
    central.writeUInt16LE(20, 6);         // version needed
    central.writeUInt16LE(0, 8);
    central.writeUInt16LE(0, 10);
    central.writeUInt16LE(DOS_TIME, 12);
    central.writeUInt16LE(DOS_DATE, 14);
    central.writeUInt32LE(crc, 16);
    central.writeUInt32LE(e.data.length, 20);
    central.writeUInt32LE(e.data.length, 24);
    central.writeUInt16LE(name.length, 28);
    central.writeUInt16LE(0, 30);         // extra
    central.writeUInt16LE(0, 32);         // comment
    central.writeUInt16LE(0, 34);         // disk number
    central.writeUInt16LE(0, 36);         // internal attrs
    central.writeUInt32LE(0, 38);         // external attrs
    central.writeUInt32LE(offset, 42);    // offset of local header
    name.copy(central, 46);
    centrals.push(central);

    offset += local.length + e.data.length;
  }

  const centralBuf = Buffer.concat(centrals);
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054B50, 0);      // end of central directory
  eocd.writeUInt16LE(0, 4);               // this disk
  eocd.writeUInt16LE(0, 6);               // disk with central dir
  eocd.writeUInt16LE(entries.length, 8);
  eocd.writeUInt16LE(entries.length, 10);
  eocd.writeUInt32LE(centralBuf.length, 12);
  eocd.writeUInt32LE(offset, 16);
  eocd.writeUInt16LE(0, 20);              // comment length

  return Buffer.concat([...locals, centralBuf, eocd]);
}
