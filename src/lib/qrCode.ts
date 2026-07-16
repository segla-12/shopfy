type QrVersionConfig = {
  version: number;
  dataCodewords: number;
  ecCodewords: number;
  blockCount: number;
};

const versionConfigs: QrVersionConfig[] = [
  { version: 1, dataCodewords: 19, ecCodewords: 7, blockCount: 1 },
  { version: 2, dataCodewords: 34, ecCodewords: 10, blockCount: 1 },
  { version: 3, dataCodewords: 55, ecCodewords: 15, blockCount: 1 },
  { version: 4, dataCodewords: 80, ecCodewords: 20, blockCount: 1 },
  { version: 5, dataCodewords: 108, ecCodewords: 26, blockCount: 1 },
  { version: 6, dataCodewords: 136, ecCodewords: 18, blockCount: 2 },
];

const alignmentCenters: Record<number, number[]> = {
  1: [],
  2: [6, 18],
  3: [6, 22],
  4: [6, 26],
  5: [6, 30],
  6: [6, 34],
};

export type QrMatrix = boolean[][];

export function createQrMatrix(text: string): QrMatrix {
  const bytes = Array.from(new TextEncoder().encode(text));
  const config = getVersionConfig(bytes.length);
  const dataCodewords = createDataCodewords(bytes, config);
  const codewords = createFinalCodewords(dataCodewords, config);
  return createMatrix(codewords, config.version);
}

function getVersionConfig(byteLength: number) {
  for (const config of versionConfigs) {
    const bitLength = 4 + 8 + byteLength * 8;
    if (Math.ceil(bitLength / 8) <= config.dataCodewords) {
      return config;
    }
  }

  throw new Error("Store URL is too long for the QR code generator.");
}

function createDataCodewords(bytes: number[], config: QrVersionConfig) {
  const bits: number[] = [];
  appendBits(bits, 0b0100, 4);
  appendBits(bits, bytes.length, 8);
  bytes.forEach((byte) => appendBits(bits, byte, 8));

  const maxBits = config.dataCodewords * 8;
  appendBits(bits, 0, Math.min(4, maxBits - bits.length));

  while (bits.length % 8 !== 0) {
    bits.push(0);
  }

  const codewords: number[] = [];
  for (let index = 0; index < bits.length; index += 8) {
    codewords.push(Number.parseInt(bits.slice(index, index + 8).join(""), 2));
  }

  for (let padIndex = 0; codewords.length < config.dataCodewords; padIndex += 1) {
    codewords.push(padIndex % 2 === 0 ? 0xec : 0x11);
  }

  return codewords;
}

function createFinalCodewords(dataCodewords: number[], config: QrVersionConfig) {
  const blockSize = config.dataCodewords / config.blockCount;
  const blocks = Array.from({ length: config.blockCount }, (_, index) => (
    dataCodewords.slice(index * blockSize, (index + 1) * blockSize)
  ));
  const errorBlocks = blocks.map((block) => createErrorCorrection(block, config.ecCodewords));
  const finalCodewords: number[] = [];

  for (let index = 0; index < blockSize; index += 1) {
    blocks.forEach((block) => finalCodewords.push(block[index]));
  }

  for (let index = 0; index < config.ecCodewords; index += 1) {
    errorBlocks.forEach((block) => finalCodewords.push(block[index]));
  }

  return finalCodewords;
}

function createMatrix(codewords: number[], version: number): QrMatrix {
  const size = version * 4 + 17;
  const modules = Array.from({ length: size }, () => Array(size).fill(false) as boolean[]);
  const reserved = Array.from({ length: size }, () => Array(size).fill(false) as boolean[]);

  function setModule(row: number, column: number, isDark: boolean, isReserved = true) {
    if (row < 0 || column < 0 || row >= size || column >= size) {
      return;
    }

    modules[row][column] = isDark;
    reserved[row][column] = isReserved;
  }

  drawFinderPattern(setModule, 0, 0);
  drawFinderPattern(setModule, size - 7, 0);
  drawFinderPattern(setModule, 0, size - 7);
  drawAlignmentPatterns(setModule, version);
  drawTimingPatterns(setModule, size);
  setModule(4 * version + 9, 8, true);
  reserveFormatAreas(reserved, size);
  drawDataBits(modules, reserved, codewords);
  applyMask(modules, reserved);
  drawFormatBits(setModule, size);

  return modules;
}

function drawFinderPattern(
  setModule: (row: number, column: number, isDark: boolean, isReserved?: boolean) => void,
  row: number,
  column: number,
) {
  for (let y = -1; y <= 7; y += 1) {
    for (let x = -1; x <= 7; x += 1) {
      const isInside = x >= 0 && x <= 6 && y >= 0 && y <= 6;
      const isDark = isInside && (x === 0 || x === 6 || y === 0 || y === 6 || (x >= 2 && x <= 4 && y >= 2 && y <= 4));
      setModule(row + y, column + x, isDark);
    }
  }
}

function drawAlignmentPatterns(
  setModule: (row: number, column: number, isDark: boolean, isReserved?: boolean) => void,
  version: number,
) {
  const centers = alignmentCenters[version];

  for (const row of centers) {
    for (const column of centers) {
      const overlapsFinder = (row === 6 && column === 6)
        || (row === 6 && column === version * 4 + 10)
        || (row === version * 4 + 10 && column === 6);

      if (overlapsFinder) {
        continue;
      }

      for (let y = -2; y <= 2; y += 1) {
        for (let x = -2; x <= 2; x += 1) {
          setModule(row + y, column + x, Math.max(Math.abs(x), Math.abs(y)) !== 1);
        }
      }
    }
  }
}

function drawTimingPatterns(
  setModule: (row: number, column: number, isDark: boolean, isReserved?: boolean) => void,
  size: number,
) {
  for (let index = 8; index < size - 8; index += 1) {
    setModule(6, index, index % 2 === 0);
    setModule(index, 6, index % 2 === 0);
  }
}

function reserveFormatAreas(reserved: boolean[][], size: number) {
  for (let index = 0; index <= 8; index += 1) {
    if (index !== 6) {
      reserved[8][index] = true;
      reserved[index][8] = true;
    }
  }

  for (let index = 0; index < 8; index += 1) {
    reserved[8][size - 1 - index] = true;
    reserved[size - 1 - index][8] = true;
  }
}

function drawDataBits(modules: boolean[][], reserved: boolean[][], codewords: number[]) {
  const bits = codewords.flatMap((codeword) => (
    Array.from({ length: 8 }, (_, index) => ((codeword >>> (7 - index)) & 1) === 1)
  ));
  const size = modules.length;
  let bitIndex = 0;
  let upward = true;

  for (let column = size - 1; column > 0; column -= 2) {
    if (column === 6) {
      column -= 1;
    }

    for (let step = 0; step < size; step += 1) {
      const row = upward ? size - 1 - step : step;

      for (let offset = 0; offset < 2; offset += 1) {
        const targetColumn = column - offset;

        if (!reserved[row][targetColumn]) {
          modules[row][targetColumn] = bits[bitIndex] || false;
          bitIndex += 1;
        }
      }
    }

    upward = !upward;
  }
}

function applyMask(modules: boolean[][], reserved: boolean[][]) {
  for (let row = 0; row < modules.length; row += 1) {
    for (let column = 0; column < modules.length; column += 1) {
      if (!reserved[row][column] && (row + column) % 2 === 0) {
        modules[row][column] = !modules[row][column];
      }
    }
  }
}

function drawFormatBits(
  setModule: (row: number, column: number, isDark: boolean, isReserved?: boolean) => void,
  size: number,
) {
  const formatBits = getFormatBits();

  for (let index = 0; index <= 5; index += 1) {
    setModule(8, index, getBit(formatBits, index));
  }

  setModule(8, 7, getBit(formatBits, 6));
  setModule(8, 8, getBit(formatBits, 7));
  setModule(7, 8, getBit(formatBits, 8));

  for (let index = 9; index < 15; index += 1) {
    setModule(14 - index, 8, getBit(formatBits, index));
  }

  for (let index = 0; index < 8; index += 1) {
    setModule(size - 1 - index, 8, getBit(formatBits, index));
  }

  for (let index = 8; index < 15; index += 1) {
    setModule(8, size - 15 + index, getBit(formatBits, index));
  }
}

function getFormatBits() {
  const errorCorrectionLevelLow = 0b01;
  const maskPattern = 0b000;
  const data = (errorCorrectionLevelLow << 3) | maskPattern;
  let bits = data << 10;

  for (let index = 14; index >= 10; index -= 1) {
    if (((bits >>> index) & 1) !== 0) {
      bits ^= 0x537 << (index - 10);
    }
  }

  return ((data << 10) | bits) ^ 0x5412;
}

function appendBits(bits: number[], value: number, length: number) {
  for (let index = length - 1; index >= 0; index -= 1) {
    bits.push((value >>> index) & 1);
  }
}

function getBit(value: number, index: number) {
  return ((value >>> index) & 1) !== 0;
}

function createErrorCorrection(dataCodewords: number[], ecCodewords: number) {
  const generator = createGeneratorPolynomial(ecCodewords);
  const result = [...dataCodewords, ...Array(ecCodewords).fill(0)];

  for (let index = 0; index < dataCodewords.length; index += 1) {
    const factor = result[index];

    if (factor === 0) {
      continue;
    }

    for (let generatorIndex = 0; generatorIndex < generator.length; generatorIndex += 1) {
      result[index + generatorIndex] ^= gfMultiply(generator[generatorIndex], factor);
    }
  }

  return result.slice(dataCodewords.length);
}

function createGeneratorPolynomial(degree: number) {
  let polynomial = [1];

  for (let index = 0; index < degree; index += 1) {
    polynomial = multiplyPolynomials(polynomial, [1, gfPower(index)]);
  }

  return polynomial;
}

function multiplyPolynomials(left: number[], right: number[]) {
  const result = Array(left.length + right.length - 1).fill(0);

  for (let leftIndex = 0; leftIndex < left.length; leftIndex += 1) {
    for (let rightIndex = 0; rightIndex < right.length; rightIndex += 1) {
      result[leftIndex + rightIndex] ^= gfMultiply(left[leftIndex], right[rightIndex]);
    }
  }

  return result;
}

function gfPower(exponent: number) {
  return gfExponents[exponent];
}

function gfMultiply(left: number, right: number) {
  if (left === 0 || right === 0) {
    return 0;
  }

  return gfExponents[gfLogs[left] + gfLogs[right]];
}

const gfExponents = (() => {
  const values = Array(512).fill(0);
  let value = 1;

  for (let index = 0; index < 255; index += 1) {
    values[index] = value;
    value <<= 1;

    if (value & 0x100) {
      value ^= 0x11d;
    }
  }

  for (let index = 255; index < 512; index += 1) {
    values[index] = values[index - 255];
  }

  return values;
})();

const gfLogs = (() => {
  const values = Array(256).fill(0);

  for (let index = 0; index < 255; index += 1) {
    values[gfExponents[index]] = index;
  }

  return values;
})();
