import { MemoryMap } from "./memory-map";

describe("Memory map handles overlapping allocations", () => {
  test("no lower allocation", () => {
    const map = new MemoryMap();
    map.set(addr(40), buf([1, 2, 3, 4]));
    checkMap(map, {
      40: [1, 2, 3, 4],
    });
  });

  test("lower allocation outside of range", () => {
    const map = new MemoryMap();
    map.set(addr(40), buf([1, 2, 3, 4]));
    map.set(addr(50), buf([5, 6, 7, 8]));
    checkMap(map, {
      40: [1, 2, 3, 4],
      50: [5, 6, 7, 8],
    });
  });

  test("lower allocation neighbour", () => {
    const map = new MemoryMap();
    map.set(addr(40), buf([1, 2, 3, 4]));
    map.set(addr(44), buf([5, 6, 7, 8]));
    checkMap(map, {
      40: [1, 2, 3, 4, 5, 6, 7, 8],
    });
  });

  test("higher allocation outside of range", () => {
    const map = new MemoryMap();
    map.set(addr(60), buf([1, 2, 3, 4]));
    map.set(addr(40), buf([5, 6, 7, 8]));
    checkMap(map, {
      40: [5, 6, 7, 8],
    });
  });

  test("higher allocation neighbour", () => {
    const map = new MemoryMap();
    map.set(addr(44), buf([5, 6, 7, 8]));
    map.set(addr(40), buf([1, 2, 3, 4]));
    checkMap(map, {
      40: [1, 2, 3, 4, 5, 6, 7, 8],
    });
  });

  test("overwrite allocation at the start", () => {
    const map = new MemoryMap();
    map.set(addr(40), buf([1, 2, 3, 4]));
    map.set(addr(42), buf([5, 6, 7, 8]));
    checkMap(map, {
      40: [1, 2, 5, 6, 7, 8],
    });
  });

  test("overwrite allocation at the end", () => {
    const map = new MemoryMap();
    map.set(addr(40), buf([1, 2, 3, 4]));
    map.set(addr(38), buf([5, 6, 7, 8]));
    checkMap(map, {
      38: [5, 6, 7, 8, 3, 4],
    });
  });

  test("consume existing allocations", () => {
    const map = new MemoryMap();
    map.set(addr(40), buf([1, 2, 3, 4]));
    map.set(addr(44), buf([1, 2, 3, 4]));
    map.set(addr(49), buf([1, 2, 3, 4]));
    map.set(addr(55), buf([1, 2, 3, 4]));

    const arr = [
      10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27,
      28, 29, 30, 31, 32, 33, 34, 35, 36, 37,
    ];
    map.set(addr(32), buf(arr));
    checkMap(map, {
      32: arr,
    });
    expect(map.segmentCount()).toEqual(1);
  });
});

describe("Memory map defragments allocations", () => {
  test("add at end", () => {
    const map = new MemoryMap();
    map.set(addr(40), buf([1, 2, 3, 4]));
    map.set(addr(44), buf([5, 6, 7, 8]));
    expect(map.segmentCount()).toEqual(1);
  });

  test("add at beginning", () => {
    const map = new MemoryMap();
    map.set(addr(40), buf([1, 2, 3, 4]));
    map.set(addr(36), buf([5, 6, 7, 8]));
    expect(map.segmentCount()).toEqual(1);
  });

  test("add in the middle", () => {
    const map = new MemoryMap();
    map.set(addr(40), buf([1, 2, 3, 4]));
    map.set(addr(48), buf([5, 6, 7, 8]));
    map.set(addr(44), buf([5, 6, 7, 8]));
    expect(map.segmentCount()).toEqual(1);
  });

  test("overwrite start", () => {
    const map = new MemoryMap();
    map.set(addr(40), buf([1, 2, 3, 4]));
    map.set(addr(42), buf([5, 6, 7, 8]));
    expect(map.segmentCount()).toEqual(1);
  });

  test("overwrite end", () => {
    const map = new MemoryMap();
    map.set(addr(48), buf([1, 2, 3, 4]));
    map.set(addr(46), buf([5, 6, 7, 8]));
    expect(map.segmentCount()).toEqual(1);
  });
});

describe("Memory map handles memory reads", () => {
  test("empty map", () => {
    const map = new MemoryMap();
    checkRead(map, 40, 8, null, [0, 0, 0, 0, 0, 0, 0, 0]);
  });

  test("missing data at start", () => {
    const map = new MemoryMap();
    map.set(addr(40), buf([1, 2, 3, 4]));

    checkRead(map, 36, 4, null, [0, 0, 0, 0]);
    checkRead(map, 37, 4, null, [0, 0, 0, 1]);
    checkRead(map, 38, 4, null, [0, 0, 1, 2]);
    checkRead(map, 39, 4, null, [0, 1, 2, 3]);
  });

  test("missing data at end", () => {
    const map = new MemoryMap();
    map.set(addr(40), buf([1, 2, 3, 4]));

    checkRead(map, 41, 4, null, [2, 3, 4, 0]);
    checkRead(map, 42, 4, null, [3, 4, 0, 0]);
    checkRead(map, 43, 4, null, [4, 0, 0, 0]);
    checkRead(map, 44, 4, null, [0, 0, 0, 0]);
  });

  test("missing in the middle", () => {
    const map = new MemoryMap();
    map.set(addr(40), buf([1, 2, 3, 4]));
    map.set(addr(45), buf([5, 6, 7, 8]));

    checkRead(map, 40, 10, null, [1, 2, 3, 4, 0, 5, 6, 7, 8, 0]);
    checkRead(map, 41, 4, null, [2, 3, 4, 0]);
    checkRead(map, 42, 4, null, [3, 4, 0, 5]);
    checkRead(map, 43, 4, null, [4, 0, 5, 6]);
  });

  test("missing with data before", () => {
    const map = new MemoryMap();
    map.set(addr(40), buf([1, 2, 3, 4]));

    checkRead(map, 50, 4, null, [0, 0, 0, 0]);
  });

  test("missing with data after", () => {
    const map = new MemoryMap();
    map.set(addr(60), buf([1, 2, 3, 4]));
    checkRead(map, 50, 4, null, [0, 0, 0, 0]);
  });

  test("missing with data around", () => {
    const map = new MemoryMap();
    map.set(addr(40), buf([1, 2, 3, 4]));
    map.set(addr(60), buf([1, 2, 3, 4]));

    checkRead(map, 50, 4, null, [0, 0, 0, 0]);
  });

  test("coalesce neighbour buffers", () => {
    const map = new MemoryMap();
    map.set(addr(40), buf([1, 2, 3, 4]));
    map.set(addr(44), buf([5]));
    map.set(addr(45), buf([6, 7, 8]));

    checkRead(map, 40, 8, [1, 2, 3, 4, 5, 6, 7, 8]);
    checkRead(map, 41, 7, [2, 3, 4, 5, 6, 7, 8]);
    checkRead(map, 44, 3, [5, 6, 7]);
  });
});

function checkMap(map: MemoryMap, regions: { [key: number]: number[] }) {
  for (const [address, bytes] of Object.entries(regions)) {
    const buffer = map.read(BigInt(address), BigInt(bytes.length));
    checkBuf(buffer, bytes);
  }
}

function checkBuf(buffer: ArrayBuffer | null, bytes: number[]) {
  expect(buffer).toBeTruthy();
  const array = new Uint8Array(buffer!);
  const actual = [...array];
  expect(actual).toEqual(bytes);
}

function checkRead(
  map: MemoryMap,
  address: number,
  size: number,
  expectBytes: number[] | null,
  expectZeroFilledBytes: number[] | null = null,
) {
  const data = map.read(addr(address), BigInt(size));
  if (expectBytes === null) {
    expect(data).toBeNull();
    expect(expectZeroFilledBytes).not.toBeNull();
  } else {
    checkBuf(data, expectBytes);
  }

  const zeroFilledData = map.readZeroFilled(addr(address), BigInt(size));
  checkBuf(zeroFilledData, (expectZeroFilledBytes ?? expectBytes)!);
}

function addr(address: number): bigint {
  return BigInt(address);
}

function buf(items: number[]): ArrayBuffer {
  const buffer = new ArrayBuffer(items.length);
  const view = new DataView(buffer);

  items.forEach((num, index) => {
    expect(num).toBeGreaterThanOrEqual(0);
    expect(num).toBeLessThanOrEqual(255);
    view.setUint8(index, num);
  });
  return buffer;
}
