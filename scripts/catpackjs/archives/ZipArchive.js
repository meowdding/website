import { ReadableBuffer } from '../utils/ReadableBuffer.js';
import { PleadError } from '../utils/Utils.js';
import { Archive, File } from './AbstractArchive.js';

class InvalidZipEntryException extends Error {
}

// Magic Values
const END_OF_CENTRAL_DIRECTORY_MAGIC = 0x6054b50;
const CENTRAL_DIRECTORY_ENTRY_MAGIC = 0x02014b50;
const LOCAL_FILE_HEADER_MAGIC = 0x04034b50;
const DATA_DESCRIPTOR_MAGIC = 0x08074b50;

export class ZipArchive extends Archive {
  static EXTRACT_VERSION = 20;

  static async parse(buffer) {
    let eocdRecord;
    buffer.setEndianness(ReadableBuffer.ENDIANNESS_LITTLE);
    let eocdStart = -1;
    for (let index = buffer.length - 22; index > 0; index--) {
      buffer.fork(index);
      const magic = buffer.readU4();
      if (magic !== END_OF_CENTRAL_DIRECTORY_MAGIC)
        continue;
      try {
        eocdRecord = EndOfCentralDirectoryRecord.parse(buffer);
        eocdStart = index;
        if (buffer.getIndex() === buffer.length) {
          break;
        }
      } catch {
        //
      }
    }
    if (!eocdRecord) {
      throw new PleadError('Unable to locate EndOfCentralDirectory Record!');
    }
    const centralDirectoryStart = eocdStart - eocdRecord.centralDirSize;
    const fileOffset = centralDirectoryStart - eocdRecord.centralDirOffset;
    buffer.fork(centralDirectoryStart);
    const cdRecords = new Map();
    while (buffer.getIndex() < eocdStart) {
      const centralDirectorRecord = CentralDirectoryFileHeader.parse(buffer);
      const existingEntry = cdRecords.get(centralDirectorRecord.fileName);
      if (existingEntry === undefined || existingEntry.looksLikeADirectory) {
        cdRecords.set(centralDirectorRecord.fileName, centralDirectorRecord);
      }
    }
    return new ZipArchive(await this.#loadAllFiles(cdRecords, buffer, fileOffset));
  }

  static async #loadAllFiles(records, buffer, offset) {
    const files = new Map();
    for (const record of records.values()) {
      try {
        const file = await this.#loadFile(record, buffer, offset);
        if (file === undefined)
          continue;
        files.set(file.name, file);
      } catch (exception) {
        if (!(exception instanceof InvalidZipEntryException)) {
          throw exception;
        }
      }
    }
    return files;
  }

  static async #loadFile(record, buffer, offset) {
    const localFileHeaderOffset = record.fileHeaderOffset +
      offset;
    if (!buffer.validIndex(localFileHeaderOffset)) {
      throw new InvalidZipEntryException(`Offset for "${record.fileName}" is not within the bounds of the zip archive`);
    }
    const oldPointer = buffer.fork(localFileHeaderOffset);
    const localFileHeader = LocalFileHeader.parse(buffer);
    if (!buffer.has(record.compressedSize)) {
      throw new InvalidZipEntryException(`Compressed size for "${record.fileName}" is not within the bounds of the zip archive`);
    }

    if (record.compressedSize === 0) return undefined;

    const compressedData = buffer.subBuffer(record.compressedSize);
    buffer.fork(oldPointer);
    if (record.compressionMethod === 0) {
      return new File(localFileHeader.fileName, compressedData);
    } else if (record.compressionMethod === 8) {
      const result = await compressedData.decompress();
      return new File(record.fileName, result);
    }
  }

  async compress() {
    const parts = [];
    const centralDirectories = [];
    let zipFileLength = 0;
    for (const fileName of this.files.keys()) {
      const file = this.files.get(fileName);
      const fileContent = file.contents;
      const bitFlag = new GeneralPurposeBitFlag(false, false, false, false, false, false, false, false, false, false, false, true);
      const crc = fileContent.crc32();
      let compressedWith = 'deflate';
      let compressedContent = await fileContent.compress();
      // if deflating resulted in a larger size than just storing would default back to store
      if (compressedContent.length > fileContent.length || fileContent.length === 0) {
        compressedWith = 'store';
        compressedContent = fileContent;
      }
      const lfhIndex = zipFileLength;
      const lfh = new LocalFileHeader(
        ZipArchive.EXTRACT_VERSION,
        bitFlag,
        compressedWith === 'deflate' ? 8 : 0,
        25965,
        30575,
        crc,
        compressedContent.length,
        fileContent.length,
        fileName,
        ReadableBuffer.allocate(0)
      ).buffer();
      parts.push(lfh);
      zipFileLength += lfh.length;
      parts.push(compressedContent);
      zipFileLength += compressedContent.length;
      const centralDirectoryFileHeader = new CentralDirectoryFileHeader(ZipArchive.EXTRACT_VERSION, ZipArchive.EXTRACT_VERSION, bitFlag, compressedWith === 'deflate' ? 8 : 0, 25965, 30575, crc, compressedContent.length, fileContent.length, 0, 0, 0, lfhIndex, fileName, ReadableBuffer.allocate(0), ReadableBuffer.allocate(0)).buffer();
      centralDirectories.push(centralDirectoryFileHeader);
    }
    const centralDirectoryStart = zipFileLength;
    for (let i = 0; i < centralDirectories.length; i++) {
      parts.push(centralDirectories[i]);
      zipFileLength += centralDirectories[i].length;
    }
    const endOfCentralDirectoryStart = zipFileLength;
    const eocdRecord = new EndOfCentralDirectoryRecord(0, 0, centralDirectories.length, centralDirectories.length, endOfCentralDirectoryStart - centralDirectoryStart, centralDirectoryStart, ReadableBuffer.allocate(0)).buffer();
    parts.push(eocdRecord);
    return ReadableBuffer.from(parts);
  }
}

class EndOfCentralDirectoryRecord {
  static parse(buffer) {
    const diskNum = buffer.readU2();
    const centralDirStart = buffer.readU2();
    const diskCentralDirCount = buffer.readU2();
    const totalCentralDirCount = buffer.readU2();
    const centralDirSize = buffer.readU4();
    const centralDirOffset = buffer.readU4();
    const commentLength = buffer.readU2();
    const comment = buffer.subBuffer(commentLength);
    return new EndOfCentralDirectoryRecord(diskNum, centralDirStart, diskCentralDirCount, totalCentralDirCount, centralDirSize, centralDirOffset, comment);
  }

  diskNumber;
  centralDirDisk;
  centralDirInDisk;
  centralDirTotal;
  centralDirSize;
  centralDirOffset;
  comment;

  constructor(diskNumber, centralDirDisk, centralDirInDisk, centralDirTotal, centralDirSize, centralDirOffset, comment) {
    this.diskNumber = diskNumber;
    this.centralDirDisk = centralDirDisk;
    this.centralDirInDisk = centralDirInDisk;
    this.centralDirTotal = centralDirTotal;
    this.centralDirSize = centralDirSize;
    this.centralDirOffset = centralDirOffset;
    this.comment = comment;
  }

  buffer() {
    const buffer = ReadableBuffer.allocate(22 + this.comment.length);
    buffer.setEndianness(ReadableBuffer.ENDIANNESS_LITTLE);
    buffer.writeU4(END_OF_CENTRAL_DIRECTORY_MAGIC);
    buffer.writeU2(this.diskNumber);
    buffer.writeU2(this.centralDirDisk);
    buffer.writeU2(this.centralDirInDisk);
    buffer.writeU2(this.centralDirTotal);
    buffer.writeU4(this.centralDirSize);
    buffer.writeU4(this.centralDirOffset);
    buffer.writeU2(this.comment.length);
    buffer.writeSubBuffer(this.comment);
    return buffer;
  }
}

class GeneralPurposeBitFlag {
  static parse(bitFlag) {
    return new GeneralPurposeBitFlag((bitFlag & (0b1 << 0)) !== 0, (bitFlag & (0b1 << 1)) !== 0, (bitFlag & (0b1 << 2)) !== 0, (bitFlag & (0b1 << 3)) !== 0, (bitFlag & (0b1 << 4)) !== 0, (bitFlag & (0b1 << 5)) !== 0, (bitFlag & (0b1 << 6)) !== 0, (bitFlag & (0b1 << 7)) !== 0, (bitFlag & (0b1 << 8)) !== 0, (bitFlag & (0b1 << 9)) !== 0, (bitFlag & (0b1 << 10)) !== 0, (bitFlag & (0b1 << 11)) !== 0, (bitFlag & (0b1 << 12)) !== 0, (bitFlag & (0b1 << 13)) !== 0, (bitFlag & (0b1 << 14)) !== 0, (bitFlag & (0b1 << 15)) !== 0);
  }

  encrypted;
  bit1;
  bit2;
  crcUnknown;
  bit4;
  patched;
  strongEncrypted;
  bit7;
  bit8;
  bit9;
  bit10;
  utf8Names;
  bit12;
  encryptedCD;
  bit14;
  bit15;

  constructor(encrypted = false, bit1 = false, bit2 = false, crcUnknown = false, bit4 = false, patched = false, strongEncrypted = false, bit7 = false, bit8 = false, bit9 = false, bit10 = false, utf8Names = false, bit12 = false, encryptedCD = false, bit14 = false, bit15 = false) {
    this.encrypted = encrypted;
    this.bit1 = bit1;
    this.bit2 = bit2;
    this.crcUnknown = crcUnknown;
    this.bit4 = bit4;
    this.patched = patched;
    this.strongEncrypted = strongEncrypted;
    this.bit7 = bit7;
    this.bit8 = bit8;
    this.bit9 = bit9;
    this.bit10 = bit10;
    this.utf8Names = utf8Names;
    this.bit12 = bit12;
    this.encryptedCD = encryptedCD;
    this.bit14 = bit14;
    this.bit15 = bit15;
  }

  serialize() {
    return ((this.encrypted ? 1 : 0) +
      (this.bit1 ? 2 : 0) +
      (this.bit2 ? 4 : 0) +
      (this.crcUnknown ? 8 : 0) +
      (this.bit4 ? 16 : 0) +
      (this.patched ? 32 : 0) +
      (this.strongEncrypted ? 64 : 0) +
      (this.bit7 ? 128 : 0) +
      (this.bit8 ? 256 : 0) +
      (this.bit9 ? 512 : 0) +
      (this.bit10 ? 1024 : 0) +
      (this.utf8Names ? 2048 : 0) +
      (this.bit12 ? 4096 : 0) +
      (this.encryptedCD ? 8192 : 0) +
      (this.bit14 ? 16384 : 0) +
      (this.bit15 ? 32768 : 0));
  }
}

class CentralDirectoryFileHeader {
  static parse(buffer) {
    const magic = buffer.readU4();
    if (magic !== CENTRAL_DIRECTORY_ENTRY_MAGIC) {
      throw new PleadError('Not a CentralDirectoryFileHeader');
    }
    const version = buffer.readU2();
    const extractVersion = buffer.readU2();
    const bitFlag = GeneralPurposeBitFlag.parse(buffer.readU2());
    const compressionMethod = buffer.readU2();
    const lastModifiedTime = buffer.readU2();
    const lastModifiedDate = buffer.readU2();
    const crc32 = buffer.readU4();
    const compressedSize = buffer.readU4();
    const uncompressedSize = buffer.readU4();
    const fileNameLength = buffer.readU2();
    const extraFieldLength = buffer.readU2();
    const commentLength = buffer.readU2();
    const diskNumber = buffer.readU2();
    const internalFileAttributes = buffer.readU2();
    const externalFileAttributes = buffer.readU4();
    const fileHeaderOffset = buffer.readU4();
    let fileName = buffer.subBuffer(fileNameLength).toString();
    let looksLikeADirectory = false;
    if (fileName.endsWith('/') && compressedSize !== 0) {
      fileName = fileName.substring(0, fileName.length - 1);
      looksLikeADirectory = true;
    }
    const extraField = buffer.subBuffer(extraFieldLength);
    const comment = buffer.subBuffer(commentLength);
    const cdFileHeader = new CentralDirectoryFileHeader(version, extractVersion, bitFlag, compressionMethod, lastModifiedTime, lastModifiedDate, crc32, compressedSize, uncompressedSize, diskNumber, internalFileAttributes, externalFileAttributes, fileHeaderOffset, fileName, extraField, comment);
    cdFileHeader.looksLikeADirectory = looksLikeADirectory;
    return cdFileHeader;
  }

  version;
  extractVersion;
  bitFlag;
  compressionMethod;
  lastModifiedTime;
  lastModifiedDate;
  crc32;
  compressedSize;
  uncompressedSize;
  diskNumber;
  internalFileAttributes;
  externalFileAttributes;
  fileHeaderOffset;
  fileName;
  extraField;
  comment;
  looksLikeADirectory = false;

  constructor(version, extractVersion, bitFlag, compressionMethod, lastModifiedTime, lastModifiedDate, crc32, compressedSize, uncompressedSize, diskNumber, internalFileAttributes, externalFileAttributes, fileHeaderOffset, fileName, extraField, comment) {
    this.version = version;
    this.extractVersion = extractVersion;
    this.bitFlag = bitFlag;
    this.compressionMethod = compressionMethod;
    this.lastModifiedTime = lastModifiedTime;
    this.lastModifiedDate = lastModifiedDate;
    this.crc32 = crc32;
    this.compressedSize = compressedSize;
    this.uncompressedSize = uncompressedSize;
    this.diskNumber = diskNumber;
    this.internalFileAttributes = internalFileAttributes;
    this.externalFileAttributes = externalFileAttributes;
    this.fileHeaderOffset = fileHeaderOffset;
    this.fileName = fileName;
    this.extraField = extraField;
    this.comment = comment;
  }

  buffer() {
    const fileNameBuffer = ReadableBuffer.from(this.fileName);
    const buffer = ReadableBuffer.allocate(46 + fileNameBuffer.length + this.extraField.length + this.comment.length);
    buffer.setEndianness(ReadableBuffer.ENDIANNESS_LITTLE);
    buffer.writeU4(CENTRAL_DIRECTORY_ENTRY_MAGIC);
    buffer.writeU2(this.version);
    buffer.writeU2(this.extractVersion);
    buffer.writeU2(this.bitFlag.serialize());
    buffer.writeU2(this.compressionMethod);
    buffer.writeU2(this.lastModifiedTime);
    buffer.writeU2(this.lastModifiedDate);
    buffer.writeU4(this.crc32);
    buffer.writeU4(this.compressedSize);
    buffer.writeU4(this.uncompressedSize);
    buffer.writeU2(fileNameBuffer.length);
    buffer.writeU2(this.extraField.length);
    buffer.writeU2(this.comment.length);
    buffer.writeU2(this.diskNumber);
    buffer.writeU2(this.internalFileAttributes);
    buffer.writeU4(this.externalFileAttributes);
    buffer.writeU4(this.fileHeaderOffset);
    buffer.writeSubBuffer(fileNameBuffer);
    buffer.writeSubBuffer(this.extraField);
    buffer.writeSubBuffer(this.comment);
    return buffer;
  }
}

class LocalFileHeader {
  static parse(buffer) {
    const magic = buffer.readU4();
    if (magic !== LOCAL_FILE_HEADER_MAGIC) {
      throw new PleadError('Invalid LocalFileHeader');
    }
    const extractVersion = buffer.readU2();
    const bitFlag = GeneralPurposeBitFlag.parse(buffer.readU2());
    const compressionMethod = buffer.readU2();
    const lastModifiedTime = buffer.readU2();
    const lastModifiedDate = buffer.readU2();
    const crc32 = buffer.readU4();
    const compressedSize = buffer.readU4();
    const uncompressedSize = buffer.readU4();
    const fileNameLength = buffer.readU2();
    const extraFieldLength = buffer.readU2();
    const fileName = buffer.subBuffer(fileNameLength).toString();
    const extraField = buffer.subBuffer(extraFieldLength);
    return new LocalFileHeader(extractVersion, bitFlag, compressionMethod, lastModifiedTime, lastModifiedDate, crc32, compressedSize, uncompressedSize, fileName, extraField);
  }

  extractVersion;
  bitFlag;
  compressionMethod;
  lastModifiedTime;
  lastModifiedDate;
  crc32;
  compressedSize;
  uncompressedSize;
  fileName;
  extraField;

  constructor(extractVersion, bitFlag, compressionMethod, lastModifiedTime, lastModifiedDate, crc32, compressedSize, uncompressedSize, fileName, extraField) {
    this.extractVersion = extractVersion;
    this.bitFlag = bitFlag;
    this.compressionMethod = compressionMethod;
    this.lastModifiedTime = lastModifiedTime;
    this.lastModifiedDate = lastModifiedDate;
    this.crc32 = crc32;
    this.compressedSize = compressedSize;
    this.uncompressedSize = uncompressedSize;
    this.fileName = fileName;
    this.extraField = extraField;
  }

  buffer() {
    const fileNameBuffer = ReadableBuffer.from(this.fileName);
    const buffer = ReadableBuffer.allocate(30 + fileNameBuffer.length + this.extraField.length);
    buffer.setEndianness(ReadableBuffer.ENDIANNESS_LITTLE);
    buffer.writeU4(LOCAL_FILE_HEADER_MAGIC);
    buffer.writeU2(this.extractVersion);
    buffer.writeU2(this.bitFlag.serialize());
    buffer.writeU2(this.compressionMethod);
    buffer.writeU2(this.lastModifiedTime);
    buffer.writeU2(this.lastModifiedDate);
    buffer.writeU4(this.crc32);
    buffer.writeU4(this.compressedSize);
    buffer.writeU4(this.uncompressedSize);
    buffer.writeU2(fileNameBuffer.length);
    buffer.writeU2(this.extraField.length);
    buffer.writeSubBuffer(fileNameBuffer);
    buffer.writeSubBuffer(this.extraField);
    return buffer;
  }
}

class DataDescriptor {
  static parse(localFileHeader, buffer, includeSignature = true) {
    // if CRCUnknown is not set the datadescriptor must be infered from the localfileheader
    if (!localFileHeader.bitFlag.crcUnknown) {
      return new DataDescriptor(localFileHeader.crc32, localFileHeader.compressedSize, localFileHeader.uncompressedSize);
    }
    let crc32 = buffer.readU4();
    // The magic bytes are optional for this
    if (crc32 === DATA_DESCRIPTOR_MAGIC)
      crc32 = buffer.readU4();
    const compressedSize = buffer.readU4();
    const uncompressedSize = buffer.readU4();
    return new DataDescriptor(crc32, compressedSize, uncompressedSize, includeSignature);
  }

  crc32;
  compressedSize;
  uncompressedSize;
  includeSignature;

  constructor(crc32, compressedSize, uncompressedSize, includeSignature = true) {
    this.crc32 = crc32;
    this.compressedSize = compressedSize;
    this.uncompressedSize = uncompressedSize;
    this.includeSignature = includeSignature;
  }

  buffer() {
    const buffer = ReadableBuffer.allocate(this.includeSignature ? 16 : 12);
    buffer.setEndianness(ReadableBuffer.ENDIANNESS_LITTLE);
    if (this.includeSignature)
      buffer.writeU4(DATA_DESCRIPTOR_MAGIC);
    buffer.writeU4(this.crc32);
    buffer.writeU4(this.compressedSize);
    buffer.writeU4(this.uncompressedSize);
    return buffer;
  }
}
