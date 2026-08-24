// build/dev/javascript/prelude.mjs
class CustomType {
  withFields(fields) {
    let properties = Object.keys(this).map((label) => (label in fields) ? fields[label] : this[label]);
    return new this.constructor(...properties);
  }
}

class List {
  static fromArray(array, tail) {
    return toList(array, tail);
  }
  [Symbol.iterator]() {
    return new ListIterator(this);
  }
  toArray() {
    return [...this];
  }
  atLeastLength(desired) {
    let current = this;
    while (desired-- > 0 && current)
      current = current.tail;
    return current !== undefined;
  }
  hasLength(desired) {
    let current = this;
    while (desired-- > 0 && current)
      current = current.tail;
    return desired === -1 && current instanceof Empty;
  }
  countLength() {
    let current = this;
    let length = 0;
    while (current) {
      current = current.tail;
      length++;
    }
    return length - 1;
  }
}
function prepend(element, tail) {
  return new NonEmpty(element, tail);
}
function toList(elements, tail) {
  let t = tail || List$Empty$const;
  for (let i = elements.length - 1;i >= 0; --i) {
    t = new NonEmpty(elements[i], t);
  }
  return t;
}

class ListIterator {
  #current;
  constructor(current) {
    this.#current = current;
  }
  next() {
    if (this.#current instanceof Empty) {
      return { done: true };
    } else {
      let { head, tail } = this.#current;
      this.#current = tail;
      return { value: head, done: false };
    }
  }
}

class Empty extends List {
}
var List$Empty$const = new Empty;
var List$Empty = () => List$Empty$const;
var List$isEmpty = (value) => value instanceof Empty;

class NonEmpty extends List {
  constructor(head, tail) {
    super();
    this.head = head;
    this.tail = tail;
  }
}
var List$NonEmpty = (head, tail) => new NonEmpty(head, tail);
var List$isNonEmpty = (value) => value instanceof NonEmpty;
class BitArray {
  bitSize;
  byteSize;
  bitOffset;
  rawBuffer;
  constructor(buffer, bitSize, bitOffset) {
    if (!(buffer instanceof Uint8Array)) {
      throw globalThis.Error("BitArray can only be constructed from a Uint8Array");
    }
    this.bitSize = bitSize ?? buffer.length * 8;
    this.byteSize = Math.trunc((this.bitSize + 7) / 8);
    this.bitOffset = bitOffset ?? 0;
    if (this.bitSize < 0) {
      throw globalThis.Error(`BitArray bit size is invalid: ${this.bitSize}`);
    }
    if (this.bitOffset < 0 || this.bitOffset > 7) {
      throw globalThis.Error(`BitArray bit offset is invalid: ${this.bitOffset}`);
    }
    if (buffer.length !== Math.trunc((this.bitOffset + this.bitSize + 7) / 8)) {
      throw globalThis.Error("BitArray buffer length is invalid");
    }
    this.rawBuffer = buffer;
  }
  byteAt(index) {
    if (index < 0 || index >= this.byteSize) {
      return;
    }
    return bitArrayByteAt(this.rawBuffer, this.bitOffset, index);
  }
  equals(other) {
    if (this.bitSize !== other.bitSize) {
      return false;
    }
    const wholeByteCount = Math.trunc(this.bitSize / 8);
    if (this.bitOffset === 0 && other.bitOffset === 0) {
      for (let i = 0;i < wholeByteCount; i++) {
        if (this.rawBuffer[i] !== other.rawBuffer[i]) {
          return false;
        }
      }
      const trailingBitsCount = this.bitSize % 8;
      if (trailingBitsCount) {
        const unusedLowBitCount = 8 - trailingBitsCount;
        if (this.rawBuffer[wholeByteCount] >> unusedLowBitCount !== other.rawBuffer[wholeByteCount] >> unusedLowBitCount) {
          return false;
        }
      }
    } else {
      for (let i = 0;i < wholeByteCount; i++) {
        const a = bitArrayByteAt(this.rawBuffer, this.bitOffset, i);
        const b = bitArrayByteAt(other.rawBuffer, other.bitOffset, i);
        if (a !== b) {
          return false;
        }
      }
      const trailingBitsCount = this.bitSize % 8;
      if (trailingBitsCount) {
        const a = bitArrayByteAt(this.rawBuffer, this.bitOffset, wholeByteCount);
        const b = bitArrayByteAt(other.rawBuffer, other.bitOffset, wholeByteCount);
        const unusedLowBitCount = 8 - trailingBitsCount;
        if (a >> unusedLowBitCount !== b >> unusedLowBitCount) {
          return false;
        }
      }
    }
    return true;
  }
  get buffer() {
    if (this.bitOffset !== 0 || this.bitSize % 8 !== 0) {
      throw new globalThis.Error("BitArray.buffer does not support unaligned bit arrays");
    }
    return this.rawBuffer;
  }
  get length() {
    if (this.bitOffset !== 0 || this.bitSize % 8 !== 0) {
      throw new globalThis.Error("BitArray.length does not support unaligned bit arrays");
    }
    return this.rawBuffer.length;
  }
}
function bitArrayByteAt(buffer, bitOffset, index) {
  if (bitOffset === 0) {
    return buffer[index] ?? 0;
  } else {
    const a = buffer[index] << bitOffset & 255;
    const b = buffer[index + 1] >> 8 - bitOffset;
    return a | b;
  }
}

class UtfCodepoint {
  constructor(value) {
    this.value = value;
  }
}
class Result extends CustomType {
  static isResult(data) {
    return data instanceof Result;
  }
}

class Ok extends Result {
  constructor(value) {
    super();
    this[0] = value;
  }
  isOk() {
    return true;
  }
}
var Result$Ok = (value) => new Ok(value);
var Result$isOk = (value) => value instanceof Ok;
var Result$Ok$0 = (value) => value[0];

class Error extends Result {
  constructor(detail) {
    super();
    this[0] = detail;
  }
  isOk() {
    return false;
  }
}
var Result$Error = (detail) => new Error(detail);
function isEqual(x, y) {
  let values = [x, y];
  while (values.length) {
    let a = values.pop();
    let b = values.pop();
    if (a === b)
      continue;
    if (!isObject(a) || !isObject(b))
      return false;
    let unequal = !structurallyCompatibleObjects(a, b) || unequalDates(a, b) || unequalBuffers(a, b) || unequalArrays(a, b) || unequalMaps(a, b) || unequalSets(a, b) || unequalRegExps(a, b);
    if (unequal)
      return false;
    const proto = Object.getPrototypeOf(a);
    if (proto !== null && typeof proto.equals === "function") {
      try {
        if (a.equals(b))
          continue;
        else
          return false;
      } catch {}
    }
    let [keys, get] = getters(a);
    const ka = keys(a);
    const kb = keys(b);
    if (ka.length !== kb.length)
      return false;
    for (let k of ka) {
      values.push(get(a, k), get(b, k));
    }
  }
  return true;
}
function getters(object) {
  if (object instanceof Map) {
    return [(x) => x.keys(), (x, y) => x.get(y)];
  } else {
    let extra = object instanceof globalThis.Error ? ["message"] : [];
    return [(x) => [...extra, ...Object.keys(x)], (x, y) => x[y]];
  }
}
function unequalDates(a, b) {
  return a instanceof Date && (a > b || a < b);
}
function unequalBuffers(a, b) {
  return !(a instanceof BitArray) && a.buffer instanceof ArrayBuffer && a.BYTES_PER_ELEMENT && !(a.byteLength === b.byteLength && a.every((n, i) => n === b[i]));
}
function unequalArrays(a, b) {
  return Array.isArray(a) && a.length !== b.length;
}
function unequalMaps(a, b) {
  return a instanceof Map && a.size !== b.size;
}
function unequalSets(a, b) {
  return a instanceof Set && (a.size != b.size || [...a].some((e) => !b.has(e)));
}
function unequalRegExps(a, b) {
  return a instanceof RegExp && (a.source !== b.source || a.flags !== b.flags);
}
function isObject(a) {
  return typeof a === "object" && a !== null;
}
function structurallyCompatibleObjects(a, b) {
  if (typeof a !== "object" && typeof b !== "object" && (!a || !b))
    return false;
  let nonstructural = [Promise, WeakSet, WeakMap, Function];
  if (nonstructural.some((c) => a instanceof c))
    return false;
  return a.constructor === b.constructor;
}
function divideFloat(a, b) {
  if (b === 0) {
    return 0;
  } else {
    return a / b;
  }
}
function makeError(variant, file, module, line, fn, message, extra) {
  let error = new globalThis.Error(message);
  error.gleam_error = variant;
  error.file = file;
  error.module = module;
  error.line = line;
  error.function = fn;
  error.fn = fn;
  for (let k in extra)
    error[k] = extra[k];
  return error;
}
// build/dev/javascript/gleam_stdlib/gleam/order.mjs
class Lt extends CustomType {
}
var Order$Lt$const = new Lt;
class Eq extends CustomType {
}
var Order$Eq$const = new Eq;
class Gt extends CustomType {
}
var Order$Gt$const = new Gt;

// build/dev/javascript/gleam_stdlib/gleam/option.mjs
class Some extends CustomType {
  constructor($0) {
    super();
    this[0] = $0;
  }
}
class None extends CustomType {
}
var Option$None$const = new None;
function reverse_and_prepend(loop$prefix, loop$suffix) {
  while (true) {
    let prefix = loop$prefix;
    let suffix = loop$suffix;
    if (prefix instanceof Empty) {
      return suffix;
    } else {
      let first = prefix.head;
      let rest = prefix.tail;
      loop$prefix = rest;
      loop$suffix = prepend(first, suffix);
    }
  }
}
function reverse(list) {
  return reverse_and_prepend(list, List$Empty$const);
}
function unwrap(option, default$) {
  if (option instanceof Some) {
    let x = option[0];
    return x;
  } else {
    return default$;
  }
}
function values_loop(loop$list, loop$acc) {
  while (true) {
    let list = loop$list;
    let acc = loop$acc;
    if (list instanceof Empty) {
      return reverse(acc);
    } else {
      let $ = list.head;
      if ($ instanceof Some) {
        let rest = list.tail;
        let first = $[0];
        loop$list = rest;
        loop$acc = prepend(first, acc);
      } else {
        let rest = list.tail;
        loop$list = rest;
        loop$acc = acc;
      }
    }
  }
}
function values(options) {
  return values_loop(options, List$Empty$const);
}

// build/dev/javascript/gleam_stdlib/dict.mjs
var referenceMap = /* @__PURE__ */ new WeakMap;
var tempDataView = /* @__PURE__ */ new DataView(/* @__PURE__ */ new ArrayBuffer(8));
var referenceUID = 0;
function hashByReference(o) {
  const known = referenceMap.get(o);
  if (known !== undefined) {
    return known;
  }
  const hash = referenceUID++;
  if (referenceUID === 2147483647) {
    referenceUID = 0;
  }
  referenceMap.set(o, hash);
  return hash;
}
function hashMerge(a, b) {
  return a ^ b + 2654435769 + (a << 6) + (a >> 2) | 0;
}
function hashString(s) {
  let hash = 0;
  const len = s.length;
  for (let i = 0;i < len; i++) {
    hash = Math.imul(31, hash) + s.charCodeAt(i) | 0;
  }
  return hash;
}
function hashNumber(n) {
  tempDataView.setFloat64(0, n);
  const i = tempDataView.getInt32(0);
  const j = tempDataView.getInt32(4);
  return Math.imul(73244475, i >> 16 ^ i) ^ j;
}
function hashBigInt(n) {
  return hashString(n.toString());
}
function hashObject(o) {
  const proto = Object.getPrototypeOf(o);
  if (proto !== null && typeof proto.hashCode === "function") {
    try {
      const code = o.hashCode(o);
      if (typeof code === "number") {
        return code;
      }
    } catch {}
  }
  if (o instanceof Promise || o instanceof WeakSet || o instanceof WeakMap) {
    return hashByReference(o);
  }
  if (o instanceof Date) {
    return hashNumber(o.getTime());
  }
  let h = 0;
  if (o instanceof ArrayBuffer) {
    o = new Uint8Array(o);
  }
  if (Array.isArray(o) || o instanceof Uint8Array) {
    for (let i = 0;i < o.length; i++) {
      h = Math.imul(31, h) + getHash(o[i]) | 0;
    }
  } else if (o instanceof Set) {
    o.forEach((v) => {
      h = h + getHash(v) | 0;
    });
  } else if (o instanceof Map) {
    o.forEach((v, k) => {
      h = h + hashMerge(getHash(v), getHash(k)) | 0;
    });
  } else {
    const keys = Object.keys(o);
    for (let i = 0;i < keys.length; i++) {
      const k = keys[i];
      const v = o[k];
      h = h + hashMerge(getHash(v), hashString(k)) | 0;
    }
  }
  return h;
}
function getHash(u) {
  if (u === null)
    return 1108378658;
  if (u === undefined)
    return 1108378659;
  if (u === true)
    return 1108378657;
  if (u === false)
    return 1108378656;
  switch (typeof u) {
    case "number":
      return hashNumber(u);
    case "string":
      return hashString(u);
    case "bigint":
      return hashBigInt(u);
    case "object":
      return hashObject(u);
    case "symbol":
      return hashByReference(u);
    case "function":
      return hashByReference(u);
    default:
      return 0;
  }
}

class Dict {
  constructor(size, root) {
    this.size = size;
    this.root = root;
  }
}
var bits = 5;
var mask = (1 << bits) - 1;
var noElementMarker = Symbol();

class Node {
  constructor(generation, datamap, nodemap, data) {
    this.datamap = datamap;
    this.nodemap = nodemap;
    this.data = data;
    this.generation = generation;
  }
  equals(other) {
    if (this === other)
      return true;
    if (!(other instanceof Node))
      return false;
    if (this.datamap !== other.datamap || this.nodemap !== other.nodemap) {
      return false;
    }
    const leftData = this.data;
    const rightData = other.data;
    if (leftData.length !== rightData.length)
      return false;
    if (this.datamap === 0 && this.nodemap === 0) {
      return this.#equalsOverflowEntries(rightData);
    }
    const edgesStart = leftData.length - popcount(this.nodemap);
    for (let i = 0;i < edgesStart; i += 2) {
      if (!isEqual(leftData[i], rightData[i]) || !isEqual(leftData[i + 1], rightData[i + 1])) {
        return false;
      }
    }
    for (let i = edgesStart;i < leftData.length; ++i) {
      if (!leftData[i].equals(rightData[i]))
        return false;
    }
    return true;
  }
  #equalsOverflowEntries(otherData) {
    const data = this.data;
    entries:
      for (let i = 0;i < data.length; i += 2) {
        for (let j = 0;j < otherData.length; j += 2) {
          if (isEqual(data[i], otherData[j])) {
            if (!isEqual(data[i + 1], otherData[j + 1]))
              return false;
            continue entries;
          }
        }
        return false;
      }
    return true;
  }
  hashCode() {
    const data = this.data;
    const edgesStart = data.length - popcount(this.nodemap);
    let hash = 0;
    for (let i = 0;i < edgesStart; i += 2) {
      hash = hash + hashMerge(getHash(data[i + 1]), getHash(data[i])) | 0;
    }
    for (let i = edgesStart;i < data.length; ++i) {
      hash = hash + data[i].hashCode() | 0;
    }
    return hash;
  }
}
function fold(dict, state, fun) {
  const queue = [dict.root];
  while (queue.length) {
    const node = queue.pop();
    const data = node.data;
    const edgesStart = data.length - popcount(node.nodemap);
    for (let i = 0;i < edgesStart; i += 2) {
      state = fun(state, data[i], data[i + 1]);
    }
    for (let i = edgesStart;i < data.length; ++i) {
      queue.push(data[i]);
    }
  }
  return state;
}
function popcount(n) {
  n -= n >>> 1 & 1431655765;
  n = (n & 858993459) + (n >>> 2 & 858993459);
  return Math.imul(n + (n >>> 4) & 252645135, 16843009) >>> 24;
}

// build/dev/javascript/gleam_stdlib/gleam/list.mjs
class Ascending extends CustomType {
}
var Sorting$Ascending$const = new Ascending;

class Descending extends CustomType {
}
var Sorting$Descending$const = new Descending;
function reverse_and_prepend2(loop$prefix, loop$suffix) {
  while (true) {
    let prefix = loop$prefix;
    let suffix = loop$suffix;
    if (prefix instanceof Empty) {
      return suffix;
    } else {
      let first$1 = prefix.head;
      let rest$1 = prefix.tail;
      loop$prefix = rest$1;
      loop$suffix = prepend(first$1, suffix);
    }
  }
}
function reverse2(list) {
  return reverse_and_prepend2(list, List$Empty$const);
}
function is_empty2(list) {
  return list instanceof Empty;
}
function first(list) {
  if (list instanceof Empty) {
    return new Error(undefined);
  } else {
    let first$1 = list.head;
    return new Ok(first$1);
  }
}
function map_loop(loop$list, loop$fun, loop$acc) {
  while (true) {
    let list = loop$list;
    let fun = loop$fun;
    let acc = loop$acc;
    if (list instanceof Empty) {
      return reverse2(acc);
    } else {
      let first$1 = list.head;
      let rest$1 = list.tail;
      loop$list = rest$1;
      loop$fun = fun;
      loop$acc = prepend(fun(first$1), acc);
    }
  }
}
function map2(list, fun) {
  return map_loop(list, fun, List$Empty$const);
}
function append_loop(loop$first, loop$second) {
  while (true) {
    let first2 = loop$first;
    let second = loop$second;
    if (first2 instanceof Empty) {
      return second;
    } else {
      let first$1 = first2.head;
      let rest$1 = first2.tail;
      loop$first = rest$1;
      loop$second = prepend(first$1, second);
    }
  }
}
function append(first2, second) {
  return append_loop(reverse2(first2), second);
}
function flatten_loop(loop$lists, loop$acc) {
  while (true) {
    let lists = loop$lists;
    let acc = loop$acc;
    if (lists instanceof Empty) {
      return reverse2(acc);
    } else {
      let list = lists.head;
      let further_lists = lists.tail;
      loop$lists = further_lists;
      loop$acc = reverse_and_prepend2(list, acc);
    }
  }
}
function flatten(lists) {
  return flatten_loop(lists, List$Empty$const);
}
function fold2(loop$list, loop$initial, loop$fun) {
  while (true) {
    let list = loop$list;
    let initial = loop$initial;
    let fun = loop$fun;
    if (list instanceof Empty) {
      return initial;
    } else {
      let first$1 = list.head;
      let rest$1 = list.tail;
      loop$list = rest$1;
      loop$initial = fun(initial, first$1);
      loop$fun = fun;
    }
  }
}
function index_fold_loop(loop$over, loop$acc, loop$with, loop$index) {
  while (true) {
    let over = loop$over;
    let acc = loop$acc;
    let with$ = loop$with;
    let index = loop$index;
    if (over instanceof Empty) {
      return acc;
    } else {
      let first$1 = over.head;
      let rest$1 = over.tail;
      loop$over = rest$1;
      loop$acc = with$(acc, first$1, index);
      loop$with = with$;
      loop$index = index + 1;
    }
  }
}
function index_fold(list, initial, fun) {
  return index_fold_loop(list, initial, fun, 0);
}
function zip_loop(loop$one, loop$other, loop$acc) {
  while (true) {
    let one = loop$one;
    let other = loop$other;
    let acc = loop$acc;
    if (one instanceof Empty) {
      return reverse2(acc);
    } else if (other instanceof Empty) {
      return reverse2(acc);
    } else {
      let first_one = one.head;
      let rest_one = one.tail;
      let first_other = other.head;
      let rest_other = other.tail;
      loop$one = rest_one;
      loop$other = rest_other;
      loop$acc = prepend([first_one, first_other], acc);
    }
  }
}
function zip(list, other) {
  return zip_loop(list, other, List$Empty$const);
}
function repeat_loop(loop$item, loop$times, loop$acc) {
  while (true) {
    let item = loop$item;
    let times = loop$times;
    let acc = loop$acc;
    let $ = times <= 0;
    if ($) {
      return acc;
    } else {
      loop$item = item;
      loop$times = times - 1;
      loop$acc = prepend(item, acc);
    }
  }
}
function repeat(a, times) {
  return repeat_loop(a, times, List$Empty$const);
}
function chunk_loop(loop$list, loop$f, loop$previous_key, loop$current_chunk, loop$acc) {
  while (true) {
    let list = loop$list;
    let f = loop$f;
    let previous_key = loop$previous_key;
    let current_chunk = loop$current_chunk;
    let acc = loop$acc;
    if (list instanceof Empty) {
      return reverse2(prepend(reverse2(current_chunk), acc));
    } else {
      let first$1 = list.head;
      let rest$1 = list.tail;
      let key = f(first$1);
      let $ = isEqual(key, previous_key);
      if ($) {
        loop$list = rest$1;
        loop$f = f;
        loop$previous_key = key;
        loop$current_chunk = prepend(first$1, current_chunk);
        loop$acc = acc;
      } else {
        let new_acc = prepend(reverse2(current_chunk), acc);
        loop$list = rest$1;
        loop$f = f;
        loop$previous_key = key;
        loop$current_chunk = toList([first$1]);
        loop$acc = new_acc;
      }
    }
  }
}
function chunk(list, f) {
  if (list instanceof Empty) {
    return list;
  } else {
    let first$1 = list.head;
    let rest$1 = list.tail;
    return chunk_loop(rest$1, f, f(first$1), toList([first$1]), List$Empty$const);
  }
}
function last(loop$list) {
  while (true) {
    let list = loop$list;
    if (list instanceof Empty) {
      return new Error(undefined);
    } else {
      let $ = list.tail;
      if ($ instanceof Empty) {
        let last$1 = list.head;
        return new Ok(last$1);
      } else {
        let rest$1 = $;
        loop$list = rest$1;
      }
    }
  }
}

// build/dev/javascript/gleam_stdlib/gleam_stdlib.mjs
var Nil = undefined;
function identity(x) {
  return x;
}
function parse_int(value) {
  if (/^[-+]?(\d+)$/.test(value)) {
    return Result$Ok(parseInt(value));
  } else {
    return Result$Error(Nil);
  }
}
function to_string(term) {
  return term.toString();
}
function graphemes(string2) {
  const iterator = graphemes_iterator(string2);
  if (iterator) {
    return arrayToList(Array.from(iterator).map((item) => item.segment));
  } else {
    return arrayToList(string2.match(/./gsu));
  }
}
var segmenter = undefined;
function graphemes_iterator(string2) {
  if (globalThis.Intl && Intl.Segmenter) {
    segmenter ||= new Intl.Segmenter;
    return segmenter.segment(string2)[Symbol.iterator]();
  }
}
function lowercase(string2) {
  return string2.toLowerCase();
}
var unicode_whitespaces = [
  " ",
  "\t",
  `
`,
  "\v",
  "\f",
  "\r",
  "",
  "\u2028",
  "\u2029"
].join("");
var trim_start_regex = /* @__PURE__ */ new RegExp(`^[${unicode_whitespaces}]*`);
var trim_end_regex = /* @__PURE__ */ new RegExp(`[${unicode_whitespaces}]*$`);
function ceiling(float2) {
  return Math.ceil(float2);
}
function round2(float2) {
  return Math.round(float2);
}
function power(base, exponent) {
  return Math.pow(base, exponent);
}
var MIN_I32 = -(2 ** 31);
var MAX_I32 = 2 ** 31 - 1;
var U32 = 2 ** 32;
var MAX_SAFE = Number.MAX_SAFE_INTEGER;
var MIN_SAFE = Number.MIN_SAFE_INTEGER;
function bitwise_and(x, y) {
  if (x >= MIN_I32 && x <= MAX_I32 && y >= MIN_I32 && y <= MAX_I32)
    return x & y;
  if (x < MIN_SAFE || x > MAX_SAFE || y < MIN_SAFE || y > MAX_SAFE)
    return Number(BigInt(x) & BigInt(y));
  return (Math.floor(x / U32) & Math.floor(y / U32)) * U32 + ((x & y) >>> 0);
}
function bitwise_shift_right(x, y) {
  if (y === 0)
    return x;
  if (y < 0)
    return bitwise_shift_left(x, -y);
  if (y < 32 && x >= MIN_I32 && x <= MAX_I32)
    return x >> y;
  if (x < MIN_SAFE || x > MAX_SAFE)
    return Number(BigInt(x) >> BigInt(y));
  const ahi = Math.floor(x / U32);
  if (y < 32)
    return (ahi >> y) * U32 + ((x >>> y | ahi << 32 - y) >>> 0);
  return ahi >> y - 32;
}
function bitwise_shift_left(x, y) {
  if (y === 0)
    return x;
  if (y < 0)
    return bitwise_shift_right(x, -y);
  if (y < 31)
    return x * (1 << y);
  return x * 2 ** y;
}
function float_to_string(float2) {
  const string2 = float2.toString().replace("+", "");
  if (string2.indexOf(".") >= 0) {
    return string2;
  } else {
    const index2 = string2.indexOf("e");
    if (index2 >= 0) {
      return string2.slice(0, index2) + ".0" + string2.slice(index2);
    } else {
      return string2 + ".0";
    }
  }
}

class Inspector {
  #references = new Set;
  inspect(v) {
    const t = typeof v;
    if (v === true)
      return "True";
    if (v === false)
      return "False";
    if (v === null)
      return "//js(null)";
    if (v === undefined)
      return "Nil";
    if (t === "string")
      return this.#string(v);
    if (t === "bigint" || Number.isInteger(v))
      return v.toString();
    if (t === "number")
      return float_to_string(v);
    if (v instanceof UtfCodepoint)
      return this.#utfCodepoint(v);
    if (v instanceof BitArray)
      return this.#bit_array(v);
    if (v instanceof RegExp)
      return `//js(${v})`;
    if (v instanceof Date)
      return `//js(Date("${v.toISOString()}"))`;
    if (v instanceof globalThis.Error)
      return `//js(${v.toString()})`;
    if (v instanceof Function) {
      const args = [];
      for (const i of Array(v.length).keys())
        args.push(String.fromCharCode(i + 97));
      return `//fn(${args.join(", ")}) { ... }`;
    }
    if (this.#references.size === this.#references.add(v).size) {
      return "//js(circular reference)";
    }
    let printed;
    if (Array.isArray(v)) {
      printed = `#(${v.map((v2) => this.inspect(v2)).join(", ")})`;
    } else if (isList(v)) {
      printed = this.#list(v);
    } else if (v instanceof CustomType) {
      printed = this.#customType(v);
    } else if (v instanceof Dict) {
      printed = this.#dict(v);
    } else if (v instanceof Set) {
      return `//js(Set(${[...v].map((v2) => this.inspect(v2)).join(", ")}))`;
    } else {
      printed = this.#object(v);
    }
    this.#references.delete(v);
    return printed;
  }
  #object(v) {
    const name = Object.getPrototypeOf(v)?.constructor?.name || "Object";
    const props = [];
    for (const k of Object.keys(v)) {
      props.push(`${this.inspect(k)}: ${this.inspect(v[k])}`);
    }
    const body = props.length ? " " + props.join(", ") + " " : "";
    const head = name === "Object" ? "" : name + " ";
    return `//js(${head}{${body}})`;
  }
  #dict(map3) {
    let body = "dict.from_list([";
    let first2 = true;
    body = fold(map3, body, (body2, key, value) => {
      if (!first2)
        body2 = body2 + ", ";
      first2 = false;
      return body2 + "#(" + this.inspect(key) + ", " + this.inspect(value) + ")";
    });
    return body + "])";
  }
  #customType(record) {
    const props = Object.keys(record).map((label) => {
      const value = this.inspect(record[label]);
      return isNaN(parseInt(label)) ? `${label}: ${value}` : value;
    }).join(", ");
    return props ? `${record.constructor.name}(${props})` : record.constructor.name;
  }
  #list(list2) {
    if (List$isEmpty(list2)) {
      return "[]";
    }
    let char_out = 'charlist.from_string("';
    let list_out = "[";
    let current = list2;
    while (List$isNonEmpty(current)) {
      let element = current.head;
      current = current.tail;
      if (list_out !== "[") {
        list_out += ", ";
      }
      list_out += this.inspect(element);
      if (char_out) {
        if (Number.isInteger(element) && element >= 32 && element <= 126) {
          char_out += String.fromCharCode(element);
        } else {
          char_out = null;
        }
      }
    }
    if (char_out) {
      return char_out + '")';
    } else {
      return list_out + "]";
    }
  }
  #string(str) {
    let new_str = '"';
    for (let i = 0;i < str.length; i++) {
      const char = str[i];
      switch (char) {
        case `
`:
          new_str += "\\n";
          break;
        case "\r":
          new_str += "\\r";
          break;
        case "\t":
          new_str += "\\t";
          break;
        case "\f":
          new_str += "\\f";
          break;
        case "\\":
          new_str += "\\\\";
          break;
        case '"':
          new_str += "\\\"";
          break;
        default:
          if (char < " " || char > "~" && char < " ") {
            new_str += "\\u{" + char.charCodeAt(0).toString(16).toUpperCase().padStart(4, "0") + "}";
          } else {
            new_str += char;
          }
      }
    }
    new_str += '"';
    return new_str;
  }
  #utfCodepoint(codepoint) {
    return `//utfcodepoint(${String.fromCodePoint(codepoint.value)})`;
  }
  #bit_array(bits2) {
    if (bits2.bitSize === 0) {
      return "<<>>";
    }
    let acc = "<<";
    for (let i = 0;i < bits2.byteSize - 1; i++) {
      acc += bits2.byteAt(i).toString();
      acc += ", ";
    }
    if (bits2.byteSize * 8 === bits2.bitSize) {
      acc += bits2.byteAt(bits2.byteSize - 1).toString();
    } else {
      const trailingBitsCount = bits2.bitSize % 8;
      acc += bits2.byteAt(bits2.byteSize - 1) >> 8 - trailingBitsCount;
      acc += `:size(${trailingBitsCount})`;
    }
    acc += ">>";
    return acc;
  }
}
function arrayToList(array) {
  let list2 = List$Empty();
  let i = array.length;
  while (i--) {
    list2 = List$NonEmpty(array[i], list2);
  }
  return list2;
}
function isList(data) {
  return List$isEmpty(data) || List$isNonEmpty(data);
}

// build/dev/javascript/gleam_stdlib/gleam/float.mjs
function negate(x) {
  return -1 * x;
}
function round(x) {
  let $ = x >= 0;
  if ($) {
    return round2(x);
  } else {
    return 0 - round2(negate(x));
  }
}
function power2(base, exponent) {
  let fractional = ceiling(exponent) - exponent > 0;
  let $ = base < 0 && fractional || base === 0 && exponent < 0;
  if ($) {
    return new Error(undefined);
  } else {
    return new Ok(power(base, exponent));
  }
}
function divide(a, b) {
  if (b === 0) {
    return new Error(undefined);
  } else {
    let b$1 = b;
    return new Ok(divideFloat(a, b$1));
  }
}
function multiply(a, b) {
  return a * b;
}

// build/dev/javascript/gleam_stdlib/gleam/int.mjs
function power3(base, exponent) {
  let _pipe = base;
  let _pipe$1 = identity(_pipe);
  return power2(_pipe$1, exponent);
}

// build/dev/javascript/gleam_stdlib/gleam/string_tree.mjs
class All extends CustomType {
}
var Direction$All$const = new All;

// build/dev/javascript/gleam_stdlib/gleam/string.mjs
class Leading extends CustomType {
}
var Direction$Leading$const = new Leading;

class Trailing extends CustomType {
}
var Direction$Trailing$const = new Trailing;
function join_loop(loop$strings, loop$separator, loop$accumulator) {
  while (true) {
    let strings = loop$strings;
    let separator = loop$separator;
    let accumulator = loop$accumulator;
    if (strings instanceof Empty) {
      return accumulator;
    } else {
      let string2 = strings.head;
      let strings$1 = strings.tail;
      loop$strings = strings$1;
      loop$separator = separator;
      loop$accumulator = accumulator + separator + string2;
    }
  }
}
function join(strings, separator) {
  if (strings instanceof Empty) {
    return "";
  } else {
    let first$1 = strings.head;
    let rest = strings.tail;
    return join_loop(rest, separator, first$1);
  }
}

// build/dev/javascript/gleam_stdlib/gleam/result.mjs
function try$(result, fun) {
  if (result instanceof Ok) {
    let x = result[0];
    return fun(x);
  } else {
    return result;
  }
}
function lazy_unwrap(result, default$) {
  if (result instanceof Ok) {
    let v = result[0];
    return v;
  } else {
    return default$();
  }
}
// build/dev/javascript/gleam_json/gleam/json.mjs
class UnexpectedEndOfInput extends CustomType {
}
var DecodeError$UnexpectedEndOfInput$const = new UnexpectedEndOfInput;
// build/dev/javascript/gleam_community_colour/gleam_community/colour.mjs
var FILEPATH = "src/gleam_community/colour.gleam";

class Rgba extends CustomType {
  constructor(r, g, b, a) {
    super();
    this.r = r;
    this.g = g;
    this.b = b;
    this.a = a;
  }
}
var black = /* @__PURE__ */ new Rgba(0, 0, 0, 1);
var dark_grey = /* @__PURE__ */ new Rgba(0.7294117647058823, 0.7411764705882353, 0.7137254901960784, 1);
function valid_colour_value(c) {
  let $ = c > 1 || c < 0;
  if ($) {
    return new Error(undefined);
  } else {
    return new Ok(c);
  }
}
function hue_to_rgb(hue, m1, m2) {
  let _block;
  {
    if (hue < 0) {
      _block = hue + 1;
    } else if (hue > 1) {
      _block = hue - 1;
    } else {
      _block = hue;
    }
  }
  let h = _block;
  let h_t_6 = h * 6;
  let h_t_2 = h * 2;
  let h_t_3 = h * 3;
  if (h_t_6 < 1) {
    return m1 + (m2 - m1) * h * 6;
  } else if (h_t_2 < 1) {
    return m2;
  } else if (h_t_3 < 2) {
    return m1 + (m2 - m1) * (2 / 3 - h) * 6;
  } else {
    return m1;
  }
}
function hex_string_to_int(hex_string) {
  let _block;
  if (hex_string.charCodeAt(0) === 35) {
    let hex_number = hex_string.slice(1);
    _block = hex_number;
  } else if (hex_string.startsWith("0x")) {
    let hex_number = hex_string.slice(2);
    _block = hex_number;
  } else {
    _block = hex_string;
  }
  let hex = _block;
  let _pipe = hex;
  let _pipe$1 = lowercase(_pipe);
  let _pipe$2 = graphemes(_pipe$1);
  let _pipe$3 = reverse2(_pipe$2);
  return index_fold(_pipe$3, new Ok(0), (total, char, index2) => {
    if (total instanceof Ok) {
      let v = total[0];
      return try$((() => {
        if (char === "a") {
          return new Ok(10);
        } else if (char === "b") {
          return new Ok(11);
        } else if (char === "c") {
          return new Ok(12);
        } else if (char === "d") {
          return new Ok(13);
        } else if (char === "e") {
          return new Ok(14);
        } else if (char === "f") {
          return new Ok(15);
        } else {
          return parse_int(char);
        }
      })(), (num) => {
        return try$(power3(16, identity(index2)), (base) => {
          return new Ok(v + round(identity(num) * base));
        });
      });
    } else {
      return total;
    }
  });
}
function hsla_to_rgba(h, s, l, a) {
  let _block;
  let $ = l <= 0.5;
  if ($) {
    _block = l * (s + 1);
  } else {
    _block = l + s - l * s;
  }
  let m2 = _block;
  let m1 = l * 2 - m2;
  let r = hue_to_rgb(h + 1 / 3, m1, m2);
  let g = hue_to_rgb(h, m1, m2);
  let b = hue_to_rgb(h - 1 / 3, m1, m2);
  return [r, g, b, a];
}
function from_rgb255(red, green, blue) {
  return try$((() => {
    let _pipe = red;
    let _pipe$1 = identity(_pipe);
    let _pipe$2 = divide(_pipe$1, 255);
    return try$(_pipe$2, valid_colour_value);
  })(), (r) => {
    return try$((() => {
      let _pipe = green;
      let _pipe$1 = identity(_pipe);
      let _pipe$2 = divide(_pipe$1, 255);
      return try$(_pipe$2, valid_colour_value);
    })(), (g) => {
      return try$((() => {
        let _pipe = blue;
        let _pipe$1 = identity(_pipe);
        let _pipe$2 = divide(_pipe$1, 255);
        return try$(_pipe$2, valid_colour_value);
      })(), (b) => {
        return new Ok(new Rgba(r, g, b, 1));
      });
    });
  });
}
function from_rgb_hex(hex) {
  let $ = hex > 16777215 || hex < 0;
  if ($) {
    return new Error(undefined);
  } else {
    let _block;
    let _pipe = bitwise_shift_right(hex, 16);
    _block = bitwise_and(_pipe, 255);
    let r = _block;
    let _block$1;
    let _pipe$1 = bitwise_shift_right(hex, 8);
    _block$1 = bitwise_and(_pipe$1, 255);
    let g = _block$1;
    let b = bitwise_and(hex, 255);
    return from_rgb255(r, g, b);
  }
}
function from_rgb_hex_string(hex_string) {
  return try$(hex_string_to_int(hex_string), (hex_int) => {
    return from_rgb_hex(hex_int);
  });
}
function to_rgba(colour) {
  if (colour instanceof Rgba) {
    let r = colour.r;
    let g = colour.g;
    let b = colour.b;
    let a = colour.a;
    return [r, g, b, a];
  } else {
    let h = colour.h;
    let s = colour.s;
    let l = colour.l;
    let a = colour.a;
    return hsla_to_rgba(h, s, l, a);
  }
}
function to_css_rgba_string(colour) {
  let $ = to_rgba(colour);
  let r = $[0];
  let g = $[1];
  let b = $[2];
  let a = $[3];
  let percent = (x) => {
    let _block;
    let _pipe = x;
    let _pipe$1 = multiply(_pipe, 1e4);
    let _pipe$2 = round(_pipe$1);
    let _pipe$3 = identity(_pipe$2);
    _block = divide(_pipe$3, 100);
    let $1 = _block;
    let p;
    if ($1 instanceof Ok) {
      p = $1[0];
    } else {
      throw makeError("let_assert", FILEPATH, "gleam_community/colour", 576, "to_css_rgba_string", "Pattern match failed, no pattern matched the value.", {
        value: $1,
        start: 15706,
        end: 15842,
        pattern_start: 15717,
        pattern_end: 15722
      });
    }
    return p;
  };
  let round_to = (x) => {
    let _block;
    let _pipe = x;
    let _pipe$1 = multiply(_pipe, 1000);
    let _pipe$2 = round(_pipe$1);
    let _pipe$3 = identity(_pipe$2);
    _block = divide(_pipe$3, 1000);
    let $1 = _block;
    let r$1;
    if ($1 instanceof Ok) {
      r$1 = $1[0];
    } else {
      throw makeError("let_assert", FILEPATH, "gleam_community/colour", 588, "to_css_rgba_string", "Pattern match failed, no pattern matched the value.", {
        value: $1,
        start: 15964,
        end: 16099,
        pattern_start: 15975,
        pattern_end: 15980
      });
    }
    return r$1;
  };
  return join(toList([
    "rgba(",
    float_to_string(percent(r)) + "%,",
    float_to_string(percent(g)) + "%,",
    float_to_string(percent(b)) + "%,",
    float_to_string(round_to(a)),
    ")"
  ]), "");
}
// build/dev/javascript/paint/paint/internal/types.mjs
class Blank extends CustomType {
}
var Picture$Blank$const = new Blank;
class Path extends CustomType {
  constructor($0) {
    super();
    this[0] = $0;
  }
}
class Text extends CustomType {
  constructor(text, size_px) {
    super();
    this.text = text;
    this.size_px = size_px;
  }
}
class ImageRef extends CustomType {
  constructor($0, width_px, height_px) {
    super();
    this[0] = $0;
    this.width_px = width_px;
    this.height_px = height_px;
  }
}
class Fill extends CustomType {
  constructor($0, $1) {
    super();
    this[0] = $0;
    this[1] = $1;
  }
}
class Stroke extends CustomType {
  constructor($0, $1) {
    super();
    this[0] = $0;
    this[1] = $1;
  }
}
class ImageScalingBehaviour extends CustomType {
  constructor($0, $1) {
    super();
    this[0] = $0;
    this[1] = $1;
  }
}
class FontFamily extends CustomType {
  constructor($0, $1) {
    super();
    this[0] = $0;
    this[1] = $1;
  }
}
class TextAlign extends CustomType {
  constructor($0, $1) {
    super();
    this[0] = $0;
    this[1] = $1;
  }
}
class TextBaseline extends CustomType {
  constructor($0, $1) {
    super();
    this[0] = $0;
    this[1] = $1;
  }
}
class TextDirection extends CustomType {
  constructor($0, $1) {
    super();
    this[0] = $0;
    this[1] = $1;
  }
}
class Translate extends CustomType {
  constructor($0, $1) {
    super();
    this[0] = $0;
    this[1] = $1;
  }
}
class Scale extends CustomType {
  constructor($0, $1) {
    super();
    this[0] = $0;
    this[1] = $1;
  }
}
class Rotate extends CustomType {
  constructor($0, $1) {
    super();
    this[0] = $0;
    this[1] = $1;
  }
}
class Combine extends CustomType {
  constructor($0) {
    super();
    this[0] = $0;
  }
}
class ScalingSmooth extends CustomType {
}
var ImageScalingBehaviour$ScalingSmooth$const = new ScalingSmooth;
class ScalingPixelated extends CustomType {
}
var ImageScalingBehaviour$ScalingPixelated$const = new ScalingPixelated;
class MoveTo extends CustomType {
  constructor($0) {
    super();
    this[0] = $0;
  }
}
class LineTo extends CustomType {
  constructor($0) {
    super();
    this[0] = $0;
  }
}
class ArcCentre extends CustomType {
  constructor(centre, radius, start_angle, end_angle, counterclockwise) {
    super();
    this.centre = centre;
    this.radius = radius;
    this.start_angle = start_angle;
    this.end_angle = end_angle;
    this.counterclockwise = counterclockwise;
  }
}
class ArcCorner extends CustomType {
  constructor(corner, end, radius) {
    super();
    this.corner = corner;
    this.end = end;
    this.radius = radius;
  }
}
class NoStroke extends CustomType {
}
var StrokeProperties$NoStroke$const = new NoStroke;
class DashedStroke extends CustomType {
  constructor($0, width, dashes) {
    super();
    this[0] = $0;
    this.width = width;
    this.dashes = dashes;
  }
}
class TextAlignStart extends CustomType {
}
var TextAlign$TextAlignStart$const = new TextAlignStart;
class TextAlignEnd extends CustomType {
}
var TextAlign$TextAlignEnd$const = new TextAlignEnd;
class TextAlignLeft extends CustomType {
}
var TextAlign$TextAlignLeft$const = new TextAlignLeft;
class TextAlignRight extends CustomType {
}
var TextAlign$TextAlignRight$const = new TextAlignRight;
class TextAlignCenter extends CustomType {
}
var TextAlign$TextAlignCenter$const = new TextAlignCenter;
class TextBaselineTop extends CustomType {
}
var TextBaseline$TextBaselineTop$const = new TextBaselineTop;
class TextBaselineHanging extends CustomType {
}
var TextBaseline$TextBaselineHanging$const = new TextBaselineHanging;
class TextBaselineMiddle extends CustomType {
}
var TextBaseline$TextBaselineMiddle$const = new TextBaselineMiddle;
class TextBaselineAlphabetic extends CustomType {
}
var TextBaseline$TextBaselineAlphabetic$const = new TextBaselineAlphabetic;
class TextBaselineIdeographic extends CustomType {
}
var TextBaseline$TextBaselineIdeographic$const = new TextBaselineIdeographic;
class TextBaselineBottom extends CustomType {
}
var TextBaseline$TextBaselineBottom$const = new TextBaselineBottom;
class TextDirectionLtr extends CustomType {
}
var TextDirection$TextDirectionLtr$const = new TextDirectionLtr;
class TextDirectionRtl extends CustomType {
}
var TextDirection$TextDirectionRtl$const = new TextDirectionRtl;
class TextDirectionInherit extends CustomType {
}
var TextDirection$TextDirectionInherit$const = new TextDirectionInherit;

// build/dev/javascript/paint/paint.mjs
var FILEPATH2 = "src/paint.gleam";

class Clockwise extends CustomType {
}
var RotationDirection$Clockwise$const = new Clockwise;
class Counterclockwise extends CustomType {
}
var RotationDirection$Counterclockwise$const = new Counterclockwise;
class TextAlignStart2 extends CustomType {
}
var TextAlign$TextAlignStart$const2 = new TextAlignStart2;
class TextAlignEnd2 extends CustomType {
}
var TextAlign$TextAlignEnd$const2 = new TextAlignEnd2;
class TextAlignLeft2 extends CustomType {
}
var TextAlign$TextAlignLeft$const2 = new TextAlignLeft2;
class TextAlignRight2 extends CustomType {
}
var TextAlign$TextAlignRight$const2 = new TextAlignRight2;
class TextAlignCenter2 extends CustomType {
}
var TextAlign$TextAlignCenter$const2 = new TextAlignCenter2;
class TextBaselineTop2 extends CustomType {
}
var TextBaseline$TextBaselineTop$const2 = new TextBaselineTop2;
class TextBaselineHanging2 extends CustomType {
}
var TextBaseline$TextBaselineHanging$const2 = new TextBaselineHanging2;
class TextBaselineMiddle2 extends CustomType {
}
var TextBaseline$TextBaselineMiddle$const2 = new TextBaselineMiddle2;
class TextBaselineAlphabetic2 extends CustomType {
}
var TextBaseline$TextBaselineAlphabetic$const2 = new TextBaselineAlphabetic2;
class TextBaselineIdeographic2 extends CustomType {
}
var TextBaseline$TextBaselineIdeographic$const2 = new TextBaselineIdeographic2;
class TextBaselineBottom2 extends CustomType {
}
var TextBaseline$TextBaselineBottom$const2 = new TextBaselineBottom2;
class TextDirectionLtr2 extends CustomType {
}
var TextDirection$TextDirectionLtr$const2 = new TextDirectionLtr2;
class TextDirectionRtl2 extends CustomType {
}
var TextDirection$TextDirectionRtl$const2 = new TextDirectionRtl2;
class Inherit extends CustomType {
}
var TextDirection$Inherit$const = new Inherit;
function colour_hex(string2) {
  return lazy_unwrap(from_rgb_hex_string(string2), () => {
    throw makeError("panic", FILEPATH2, "paint", 60, "colour_hex", "Failed to parse hex code", {});
  });
}
function blank() {
  return Picture$Blank$const;
}
function path(start, segments) {
  return new Path(prepend(new MoveTo(start), segments));
}
function path_line(to) {
  return new LineTo(to);
}
function translate_xy(picture, x, y) {
  return new Translate(picture, [x, y]);
}
function fill(picture, colour) {
  return new Fill(picture, colour);
}
function stroke_dashed(picture, colour, width, dashes) {
  return new Stroke(picture, new DashedStroke(colour, width, dashes));
}
function stroke(picture, colour, width) {
  return stroke_dashed(picture, colour, width, List$Empty$const);
}
function combine(pictures) {
  return new Combine(pictures);
}
function concat2(picture, another_picture) {
  return combine(toList([picture, another_picture]));
}
// build/dev/javascript/gleam_javascript/gleam_javascript_ffi.mjs
function toArray(list2) {
  return list2.toArray();
}

// build/dev/javascript/paint/paint/encode.mjs
function text_direction_to_string(value) {
  if (value instanceof TextDirectionLtr) {
    return "ltr";
  } else if (value instanceof TextDirectionRtl) {
    return "rtl";
  } else {
    return "inherit";
  }
}
function text_baseline_to_string(value) {
  if (value instanceof TextBaselineTop) {
    return "top";
  } else if (value instanceof TextBaselineHanging) {
    return "hanging";
  } else if (value instanceof TextBaselineMiddle) {
    return "middle";
  } else if (value instanceof TextBaselineAlphabetic) {
    return "alphabetic";
  } else if (value instanceof TextBaselineIdeographic) {
    return "ideographic";
  } else {
    return "bottom";
  }
}
function text_align_to_string(value) {
  if (value instanceof TextAlignStart) {
    return "start";
  } else if (value instanceof TextAlignEnd) {
    return "end";
  } else if (value instanceof TextAlignLeft) {
    return "left";
  } else if (value instanceof TextAlignRight) {
    return "right";
  } else {
    return "center";
  }
}

// build/dev/javascript/paint/paint/event.mjs
class Tick extends CustomType {
  constructor($0) {
    super();
    this[0] = $0;
  }
}
class KeyboardPressed extends CustomType {
  constructor($0) {
    super();
    this[0] = $0;
  }
}
class KeyboardRelased extends CustomType {
  constructor($0) {
    super();
    this[0] = $0;
  }
}
class MouseMoved extends CustomType {
  constructor($0, $1) {
    super();
    this[0] = $0;
    this[1] = $1;
  }
}
class MousePressed extends CustomType {
  constructor($0) {
    super();
    this[0] = $0;
  }
}
class MouseReleased extends CustomType {
  constructor($0) {
    super();
    this[0] = $0;
  }
}
class KeyLeftArrow extends CustomType {
}
var Key$KeyLeftArrow$const = new KeyLeftArrow;
class KeyRightArrow extends CustomType {
}
var Key$KeyRightArrow$const = new KeyRightArrow;
class KeyUpArrow extends CustomType {
}
var Key$KeyUpArrow$const = new KeyUpArrow;
class KeyDownArrow extends CustomType {
}
var Key$KeyDownArrow$const = new KeyDownArrow;
class KeySpace extends CustomType {
}
var Key$KeySpace$const = new KeySpace;
class KeyW extends CustomType {
}
var Key$KeyW$const = new KeyW;
class KeyA extends CustomType {
}
var Key$KeyA$const = new KeyA;
class KeyS extends CustomType {
}
var Key$KeyS$const = new KeyS;
class KeyD extends CustomType {
}
var Key$KeyD$const = new KeyD;
class KeyZ extends CustomType {
}
var Key$KeyZ$const = new KeyZ;
class KeyX extends CustomType {
}
var Key$KeyX$const = new KeyX;
class KeyC extends CustomType {
}
var Key$KeyC$const = new KeyC;
class KeyEnter extends CustomType {
}
var Key$KeyEnter$const = new KeyEnter;
class KeyEscape extends CustomType {
}
var Key$KeyEscape$const = new KeyEscape;
class KeyBackspace extends CustomType {
}
var Key$KeyBackspace$const = new KeyBackspace;
class MouseButtonLeft extends CustomType {
}
var MouseButton$MouseButtonLeft$const = new MouseButtonLeft;
class MouseButtonRight extends CustomType {
}
var MouseButton$MouseButtonRight$const = new MouseButtonRight;
class MouseButtonMiddle extends CustomType {
}
var MouseButton$MouseButtonMiddle$const = new MouseButtonMiddle;

// build/dev/javascript/paint/impl_canvas_bindings.mjs
function get_rendering_context(selector) {
  return document.querySelector(selector).getContext("2d");
}
function setup_request_animation_frame(callback) {
  window.requestAnimationFrame((time) => {
    callback(time);
  });
}
function setup_input_handler(event_name, callback) {
  window.addEventListener(event_name, callback);
}
function get_key_code(event) {
  return event.keyCode;
}
function set_global(state, id) {
  if (typeof window.PAINT_STATE == "undefined") {
    window.PAINT_STATE = {};
  }
  window.PAINT_STATE[id] = state;
}
function get_global(id) {
  if (!window.PAINT_STATE) {
    return new Error(undefined);
  }
  if (!(id in window.PAINT_STATE)) {
    return new Error(undefined);
  }
  return new Ok(window.PAINT_STATE[id]);
}
function get_width(ctx) {
  return ctx.canvas.clientWidth;
}
function get_height(ctx) {
  return ctx.canvas.clientHeight;
}
function mouse_pos(ctx, event) {
  const rect = ctx.canvas.getBoundingClientRect();
  const scaleX = ctx.canvas.width / rect.width;
  const scaleY = ctx.canvas.height / rect.height;
  return [
    (event.clientX - rect.left) * scaleX,
    (event.clientY - rect.top) * scaleY
  ];
}
function check_mouse_button(event, previous_event, button_index, check_pressed) {
  let previous_buttons = Result$isOk(previous_event) ? Result$Ok$0(previous_event).buttons : 0;
  let current_buttons = event.buttons;
  if (check_pressed) {
    previous_buttons = ~previous_buttons;
  } else {
    current_buttons = ~current_buttons;
  }
  let button = previous_buttons & current_buttons & 1 << button_index;
  return !!button;
}
function reset(ctx) {
  ctx.reset();
}
function path2(ctx, add_segments, fill2, stroke2) {
  ctx.beginPath();
  add_segments(ctx);
  if (fill2) {
    ctx.fill();
  }
  if (stroke2) {
    ctx.stroke();
  }
}
function move_to(ctx, x, y) {
  ctx.moveTo(x, y);
}
function line_to(ctx, x, y) {
  ctx.lineTo(x, y);
}
function arc_centre(ctx, x, y, radius, start_angle, end_angle, counterclockwise) {
  ctx.arc(x, y, radius, start_angle, end_angle, counterclockwise);
}
function arc_corner(ctx, x1, y1, x2, y2, radius) {
  ctx.arcTo(x1, y1, x2, y2, radius);
}
function bezier_to(ctx, cp1x, cp1y, cp2x, cp2y, x, y) {
  ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x, y);
}
function text(ctx, text2, font) {
  ctx.font = font;
  ctx.fillText(text2, 0, 0);
}
function set_text_align(ctx, value) {
  ctx.textAlign = value;
}
function set_text_baseline(ctx, value) {
  ctx.textBaseline = value;
}
function set_direction(ctx, value) {
  ctx.direction = value;
}
function save(ctx) {
  ctx.save();
}
function restore(ctx) {
  ctx.restore();
}
function set_fill_colour(ctx, css_colour) {
  ctx.fillStyle = css_colour;
}
function set_stroke_color(ctx, css_color) {
  ctx.strokeStyle = css_color;
}
function set_line_width(ctx, width) {
  ctx.lineWidth = width;
}
function set_line_dash(ctx, dashes) {
  ctx.setLineDash(dashes);
}
function translate(ctx, x, y) {
  ctx.translate(x, y);
}
function scale(ctx, x, y) {
  ctx.scale(x, y);
}
function rotate(ctx, radians) {
  ctx.rotate(radians);
}
function draw_image(ctx, image, width_px, height_px) {
  ctx.drawImage(image, 0, 0, width_px, height_px);
}
function set_image_smoothing_enabled(ctx, value) {
  ctx.imageSmoothingEnabled = value;
}

// build/dev/javascript/paint/paint/canvas.mjs
var FILEPATH3 = "src/paint/canvas.gleam";

class Config extends CustomType {
  constructor(width, height) {
    super();
    this.width = width;
    this.height = height;
  }
}
class DrawingState extends CustomType {
  constructor(fill2, stroke2, font_family) {
    super();
    this.fill = fill2;
    this.stroke = stroke2;
    this.font_family = font_family;
  }
}
var default_drawing_state = /* @__PURE__ */ new DrawingState(false, true, "sans-serif");
function add_segment_to_rendering_context(segment, ctx) {
  if (segment instanceof MoveTo) {
    let dest = segment[0];
    return move_to(ctx, dest[0], dest[1]);
  } else if (segment instanceof LineTo) {
    let dest = segment[0];
    return line_to(ctx, dest[0], dest[1]);
  } else if (segment instanceof ArcCentre) {
    let centre = segment.centre;
    let radius = segment.radius;
    let start_angle = segment.start_angle;
    let end_angle = segment.end_angle;
    let counterclockwise = segment.counterclockwise;
    let start_radians = start_angle[0];
    let end_radians = end_angle[0];
    return arc_centre(ctx, centre[0], centre[1], radius, start_radians, end_radians, counterclockwise);
  } else if (segment instanceof ArcCorner) {
    let corner = segment.corner;
    let end = segment.end;
    let radius = segment.radius;
    return arc_corner(ctx, corner[0], corner[1], end[0], end[1], radius);
  } else {
    let cp1 = segment.cp1;
    let cp2 = segment.cp2;
    let end = segment.end;
    return bezier_to(ctx, cp1[0], cp1[1], cp2[0], cp2[1], end[0], end[1]);
  }
}
function add_segments_to_rendering_context(loop$segments, loop$ctx) {
  while (true) {
    let segments = loop$segments;
    let ctx = loop$ctx;
    if (segments instanceof Empty) {
      return;
    } else {
      let s = segments.head;
      let ss = segments.tail;
      add_segment_to_rendering_context(s, ctx);
      loop$segments = ss;
      loop$ctx = ctx;
    }
  }
}
function display_on_rendering_context(loop$picture, loop$ctx, loop$state) {
  while (true) {
    let picture = loop$picture;
    let ctx = loop$ctx;
    let state = loop$state;
    if (picture instanceof Blank) {
      return;
    } else if (picture instanceof Path) {
      let segments = picture[0];
      return path2(ctx, (_capture) => {
        return add_segments_to_rendering_context(segments, _capture);
      }, state.fill, state.stroke);
    } else if (picture instanceof Text) {
      let text2 = picture.text;
      let size_px = picture.size_px;
      save(ctx);
      text(ctx, text2, to_string(size_px) + "px " + state.font_family);
      return restore(ctx);
    } else if (picture instanceof ImageRef) {
      let width_px = picture.width_px;
      let height_px = picture.height_px;
      let id = picture[0].id;
      let $ = get_global(id);
      let image;
      if ($ instanceof Ok) {
        image = $[0];
      } else {
        throw makeError("let_assert", FILEPATH3, "paint/canvas", 260, "display_on_rendering_context", "Pattern match failed, no pattern matched the value.", {
          value: $,
          start: 7439,
          end: 7488,
          pattern_start: 7450,
          pattern_end: 7459
        });
      }
      return draw_image(ctx, image, width_px, height_px);
    } else if (picture instanceof Fill) {
      let p = picture[0];
      let colour = picture[1];
      save(ctx);
      set_fill_colour(ctx, to_css_rgba_string(colour));
      display_on_rendering_context(p, ctx, new DrawingState(true, state.stroke, state.font_family));
      return restore(ctx);
    } else if (picture instanceof Stroke) {
      let p = picture[0];
      let stroke2 = picture[1];
      if (stroke2 instanceof NoStroke) {
        loop$picture = p;
        loop$ctx = ctx;
        loop$state = new DrawingState(state.fill, false, state.font_family);
      } else {
        let color = stroke2[0];
        let width = stroke2.width;
        let dashes = stroke2.dashes;
        save(ctx);
        set_stroke_color(ctx, to_css_rgba_string(color));
        set_line_width(ctx, width);
        set_line_dash(ctx, toArray(dashes));
        display_on_rendering_context(p, ctx, new DrawingState(state.fill, true, state.font_family));
        return restore(ctx);
      }
    } else if (picture instanceof ImageScalingBehaviour) {
      let p = picture[0];
      let behaviour = picture[1];
      save(ctx);
      set_image_smoothing_enabled(ctx, (() => {
        if (behaviour instanceof ScalingSmooth) {
          return true;
        } else {
          return false;
        }
      })());
      display_on_rendering_context(p, ctx, state);
      return restore(ctx);
    } else if (picture instanceof FontFamily) {
      let p = picture[0];
      let family = picture[1];
      loop$picture = p;
      loop$ctx = ctx;
      loop$state = new DrawingState(state.fill, state.stroke, family);
    } else if (picture instanceof TextAlign) {
      let p = picture[0];
      let alignment = picture[1];
      save(ctx);
      set_text_align(ctx, text_align_to_string(alignment));
      display_on_rendering_context(p, ctx, state);
      return restore(ctx);
    } else if (picture instanceof TextBaseline) {
      let p = picture[0];
      let baseline = picture[1];
      save(ctx);
      set_text_baseline(ctx, text_baseline_to_string(baseline));
      display_on_rendering_context(p, ctx, state);
      return restore(ctx);
    } else if (picture instanceof TextDirection) {
      let p = picture[0];
      let direction = picture[1];
      save(ctx);
      set_direction(ctx, text_direction_to_string(direction));
      display_on_rendering_context(p, ctx, state);
      return restore(ctx);
    } else if (picture instanceof Translate) {
      let p = picture[0];
      let vec = picture[1];
      let x = vec[0];
      let y = vec[1];
      save(ctx);
      translate(ctx, x, y);
      display_on_rendering_context(p, ctx, state);
      return restore(ctx);
    } else if (picture instanceof Scale) {
      let p = picture[0];
      let vec = picture[1];
      let x = vec[0];
      let y = vec[1];
      save(ctx);
      scale(ctx, x, y);
      display_on_rendering_context(p, ctx, state);
      return restore(ctx);
    } else if (picture instanceof Rotate) {
      let p = picture[0];
      let angle = picture[1];
      let rad = angle[0];
      save(ctx);
      rotate(ctx, rad);
      display_on_rendering_context(p, ctx, state);
      return restore(ctx);
    } else {
      let pictures = picture[0];
      if (pictures instanceof Empty) {
        return;
      } else {
        let p = pictures.head;
        let ps = pictures.tail;
        display_on_rendering_context(p, ctx, state);
        loop$picture = new Combine(ps);
        loop$ctx = ctx;
        loop$state = state;
      }
    }
  }
}
function get_tick_func(ctx, view, update, selector) {
  return (time) => {
    let $ = get_global(selector);
    let current_state;
    if ($ instanceof Ok) {
      current_state = $[0];
    } else {
      throw makeError("let_assert", FILEPATH3, "paint/canvas", 476, "get_tick_func", "Pattern match failed, no pattern matched the value.", {
        value: $,
        start: 13594,
        end: 13657,
        pattern_start: 13605,
        pattern_end: 13622
      });
    }
    let new_state = update(current_state, new Tick(time));
    set_global(new_state, selector);
    let picture = view(new_state);
    reset(ctx);
    display_on_rendering_context(picture, ctx, default_drawing_state);
    return setup_request_animation_frame(get_tick_func(ctx, view, update, selector));
  };
}
function parse_key_code(key_code) {
  if (key_code === 32) {
    return new Some(Key$KeySpace$const);
  } else if (key_code === 37) {
    return new Some(Key$KeyLeftArrow$const);
  } else if (key_code === 38) {
    return new Some(Key$KeyUpArrow$const);
  } else if (key_code === 39) {
    return new Some(Key$KeyRightArrow$const);
  } else if (key_code === 40) {
    return new Some(Key$KeyDownArrow$const);
  } else if (key_code === 87) {
    return new Some(Key$KeyW$const);
  } else if (key_code === 65) {
    return new Some(Key$KeyA$const);
  } else if (key_code === 83) {
    return new Some(Key$KeyS$const);
  } else if (key_code === 68) {
    return new Some(Key$KeyD$const);
  } else if (key_code === 90) {
    return new Some(Key$KeyZ$const);
  } else if (key_code === 88) {
    return new Some(Key$KeyX$const);
  } else if (key_code === 67) {
    return new Some(Key$KeyC$const);
  } else if (key_code === 18) {
    return new Some(Key$KeyEnter$const);
  } else if (key_code === 27) {
    return new Some(Key$KeyEscape$const);
  } else if (key_code === 8) {
    return new Some(Key$KeyBackspace$const);
  } else {
    return Option$None$const;
  }
}
function interact(init, update, view, selector) {
  let ctx = get_rendering_context(selector);
  let initial_state = init(new Config(get_width(ctx), get_height(ctx)));
  set_global(initial_state, selector);
  let create_key_handler = (event_name, constructor) => {
    return setup_input_handler(event_name, (event) => {
      let key = parse_key_code(get_key_code(event));
      if (key instanceof Some) {
        let key$1 = key[0];
        let $ = get_global(selector);
        let old_state;
        if ($ instanceof Ok) {
          old_state = $[0];
        } else {
          throw makeError("let_assert", FILEPATH3, "paint/canvas", 369, "interact", "Pattern match failed, no pattern matched the value.", {
            value: $,
            start: 10345,
            end: 10404,
            pattern_start: 10356,
            pattern_end: 10369
          });
        }
        let new_state = update(old_state, constructor(key$1));
        return set_global(new_state, selector);
      } else {
        return;
      }
    });
  };
  create_key_handler("keydown", (var0) => {
    return new KeyboardPressed(var0);
  });
  create_key_handler("keyup", (var0) => {
    return new KeyboardRelased(var0);
  });
  setup_input_handler("mousemove", (event) => {
    let $ = mouse_pos(ctx, event);
    let x = $[0];
    let y = $[1];
    let $1 = get_global(selector);
    let old_state;
    if ($1 instanceof Ok) {
      old_state = $1[0];
    } else {
      throw makeError("let_assert", FILEPATH3, "paint/canvas", 386, "interact", "Pattern match failed, no pattern matched the value.", {
        value: $1,
        start: 10876,
        end: 10935,
        pattern_start: 10887,
        pattern_end: 10900
      });
    }
    let new_state = update(old_state, new MouseMoved(x, y));
    set_global(new_state, selector);
    return;
  });
  let create_mouse_button_handler = (event_name, constructor, check_pressed) => {
    return setup_input_handler(event_name, (event) => {
      let previous_event_id = "PAINT_PREVIOUS_MOUSE_INPUT_FOR_" + selector;
      let previous_event = get_global(previous_event_id);
      set_global(event, previous_event_id);
      let check_button = (i) => {
        return check_mouse_button(event, previous_event, i, check_pressed);
      };
      let trigger_update = (button) => {
        let $3 = get_global(selector);
        let old_state;
        if ($3 instanceof Ok) {
          old_state = $3[0];
        } else {
          throw makeError("let_assert", FILEPATH3, "paint/canvas", 415, "interact", "Pattern match failed, no pattern matched the value.", {
            value: $3,
            start: 11869,
            end: 11928,
            pattern_start: 11880,
            pattern_end: 11893
          });
        }
        let new_state = update(old_state, constructor(button));
        return set_global(new_state, selector);
      };
      let $ = check_button(0);
      if ($) {
        trigger_update(MouseButton$MouseButtonLeft$const);
      } else {}
      let $1 = check_button(1);
      if ($1) {
        trigger_update(MouseButton$MouseButtonRight$const);
      } else {}
      let $2 = check_button(2);
      if ($2) {
        trigger_update(MouseButton$MouseButtonMiddle$const);
      } else {}
      return;
    });
  };
  create_mouse_button_handler("mousedown", (var0) => {
    return new MousePressed(var0);
  }, true);
  create_mouse_button_handler("mouseup", (var0) => {
    return new MouseReleased(var0);
  }, false);
  return setup_request_animation_frame(get_tick_func(ctx, view, update, selector));
}

// build/dev/javascript/paper/canvas_extra.mjs
function width() {
  const canvas = document.getElementById("mycanvas");
  return canvas.width;
}
function height() {
  const canvas = document.getElementById("mycanvas");
  return canvas.height;
}
// build/dev/javascript/paper/folding.mjs
var FILEPATH4 = "src/folding.gleam";

class Layer extends CustomType {
  constructor(points, animation, color) {
    super();
    this.points = points;
    this.animation = animation;
    this.color = color;
  }
}
class Stack extends CustomType {
  constructor($0) {
    super();
    this[0] = $0;
  }
}
class Fold extends CustomType {
  constructor(top, bottom, fold3) {
    super();
    this.top = top;
    this.bottom = bottom;
    this.fold = fold3;
  }
}
class Paper extends CustomType {
  constructor(space, mouse, line, layers) {
    super();
    this.space = space;
    this.mouse = mouse;
    this.line = line;
    this.layers = layers;
  }
}
function points2line(a, b) {
  return [b[1] - a[1], a[0] - b[0], b[0] * a[1] - a[0] * b[1]];
}
function line_intersection(line1, line2) {
  let a1 = line1[0];
  let b1 = line1[1];
  let c1 = line1[2];
  let a2 = line2[0];
  let b2 = line2[1];
  let c2 = line2[2];
  return [
    divideFloat(b1 * c2 - b2 * c1, a1 * b2 - a2 * b1),
    divideFloat(c1 * a2 - c2 * a1, a1 * b2 - a2 * b1)
  ];
}
function above_line(point, line) {
  let a = line[0];
  let b = line[1];
  let c = line[2];
  let x = point[0];
  let y = point[1];
  return a * x + b * y + c >= 0;
}
function reflect(point, line) {
  let a = line[0];
  let b = line[1];
  let c = line[2];
  let x = point[0];
  let y = point[1];
  let k = divideFloat(2 * (a * x + b * y + c), a * a + b * b);
  return [x - a * k, y - b * k];
}
function split2(layer, fold_line, allow_partial) {
  let combine_lines = (fold1, fold22) => {
    if (fold1 instanceof Some) {
      if (fold22 instanceof Some) {
        let fold1$1 = fold1[0];
        let fold2$1 = fold22[0];
        let eval$ = (p) => {
          return fold_line[1] * p[0] - fold_line[0] * p[1] + fold_line[2];
        };
        return new Some([
          (() => {
            let $ = eval$(fold1$1[0]) < eval$(fold2$1[0]);
            if ($) {
              return fold1$1[0];
            } else {
              return fold2$1[0];
            }
          })(),
          (() => {
            let $ = eval$(fold1$1[1]) > eval$(fold2$1[1]);
            if ($) {
              return fold1$1[1];
            } else {
              return fold2$1[1];
            }
          })()
        ]);
      } else {
        return fold1;
      }
    } else if (fold22 instanceof Some) {
      return fold22;
    } else {
      return fold1;
    }
  };
  if (layer instanceof Layer) {
    let points = layer.points;
    let polys = chunk(points, (_capture) => {
      return above_line(_capture, fold_line);
    });
    let _block;
    if (polys instanceof Empty) {
      _block = polys;
    } else {
      let $ = polys.tail;
      if ($ instanceof Empty) {
        _block = polys;
      } else {
        let $1 = $.tail;
        if ($1 instanceof Empty) {
          _block = polys;
        } else {
          let $2 = $1.tail;
          if ($2 instanceof Empty) {
            let a = polys.head;
            let b = $.head;
            let c = $1.head;
            _block = toList([b, append(c, a)]);
          } else {
            _block = polys;
          }
        }
      }
    }
    let polys$1 = _block;
    let _block$1;
    if (polys$1 instanceof Empty) {
      _block$1 = polys$1;
    } else {
      let $ = polys$1.head;
      if ($ instanceof Empty) {
        _block$1 = polys$1;
      } else {
        let first2 = $;
        let rest = polys$1.tail;
        let p1 = $.head;
        let $1 = above_line(p1, fold_line);
        if ($1) {
          _block$1 = polys$1;
        } else {
          _block$1 = append(rest, toList([first2]));
        }
      }
    }
    let polys$2 = _block$1;
    if (polys$2 instanceof Empty) {
      throw makeError("panic", FILEPATH4, "folding", 129, "split", "`panic` expression evaluated.", {});
    } else {
      let $ = polys$2.tail;
      if ($ instanceof Empty) {
        let $1 = polys$2.head;
        if ($1 instanceof Empty) {
          throw makeError("panic", FILEPATH4, "folding", 129, "split", "`panic` expression evaluated.", {});
        } else {
          let p1 = $1.head;
          let $2 = above_line(p1, fold_line);
          if ($2) {
            return [new Some(layer), Option$None$const, Option$None$const];
          } else {
            return [Option$None$const, new Some(layer), Option$None$const];
          }
        }
      } else {
        let $1 = $.tail;
        if ($1 instanceof Empty) {
          let a = polys$2.head;
          let b = $.head;
          let a1 = lazy_unwrap(first(a), () => {
            throw makeError("panic", FILEPATH4, "folding", 105, "split", "`panic` expression evaluated.", {});
          });
          let a2 = lazy_unwrap(last(a), () => {
            throw makeError("panic", FILEPATH4, "folding", 106, "split", "`panic` expression evaluated.", {});
          });
          let b1 = lazy_unwrap(first(b), () => {
            throw makeError("panic", FILEPATH4, "folding", 107, "split", "`panic` expression evaluated.", {});
          });
          let b2 = lazy_unwrap(last(b), () => {
            throw makeError("panic", FILEPATH4, "folding", 108, "split", "`panic` expression evaluated.", {});
          });
          let p1 = line_intersection(points2line(a1, b2), fold_line);
          let p2 = line_intersection(points2line(a2, b1), fold_line);
          return [
            new Some(new Layer(flatten(toList([toList([p1]), a, toList([p2])])), flatten(toList([toList([p1]), a, toList([p2])])), layer.color)),
            new Some(new Layer(flatten(toList([toList([p2]), b, toList([p1])])), flatten(toList([toList([p2]), b, toList([p1])])), layer.color)),
            new Some([p1, p2])
          ];
        } else {
          throw makeError("panic", FILEPATH4, "folding", 129, "split", "`panic` expression evaluated.", {});
        }
      }
    }
  } else if (layer instanceof Stack) {
    let layers = layer[0];
    let $ = fold2(layers, [List$Empty$const, List$Empty$const, Option$None$const], (state, layer2) => {
      let ltop = state[0];
      let lbottom = state[1];
      let fold$12 = state[2];
      let $1 = split2(layer2, fold_line, allow_partial);
      let top2 = $1[0];
      let bottom2 = $1[1];
      let fold1 = $1[2];
      let ltop$1 = append(values(toList([top2])), ltop);
      let lbottom$1 = append(values(toList([bottom2])), lbottom);
      return [ltop$1, lbottom$1, combine_lines(fold$12, fold1)];
    });
    let top = $[0];
    let bottom = $[1];
    let fold$1 = $[2];
    return [
      (() => {
        if (top instanceof Empty) {
          return Option$None$const;
        } else {
          let layers$1 = top;
          return new Some(new Stack(reverse2(layers$1)));
        }
      })(),
      (() => {
        if (bottom instanceof Empty) {
          return Option$None$const;
        } else {
          let layers$1 = bottom;
          return new Some(new Stack(reverse2(layers$1)));
        }
      })(),
      fold$1
    ];
  } else {
    let top = layer.top;
    let bottom = layer.bottom;
    let current_fold = layer.fold;
    let _block;
    let $ = above_line(current_fold[0], fold_line);
    if ($) {
      _block = current_fold;
    } else {
      _block = [current_fold[1], current_fold[0]];
    }
    let current_fold$1 = _block;
    let _block$1;
    {
      let $22 = split2(top, fold_line, allow_partial);
      let top$1 = $22[0];
      let bottom$1 = $22[1];
      let new_fold2 = $22[2];
      _block$1 = [
        values(toList([top$1])),
        values(toList([bottom$1])),
        new_fold2
      ];
    }
    let $1 = _block$1;
    let ltop = $1[0];
    let lbottom = $1[1];
    let new_fold = $1[2];
    let partial_fold = !above_line(current_fold$1[0], fold_line) && !is_empty2(ltop) && allow_partial;
    let _block$2;
    if (partial_fold) {
      _block$2 = [ltop, append(lbottom, toList([bottom])), new_fold];
    } else {
      let $32 = split2(bottom, fold_line, is_empty2(ltop) && allow_partial);
      let top$1 = $32[0];
      let bottom$1 = $32[1];
      let new_fold2 = $32[2];
      _block$2 = [
        append(ltop, values(toList([top$1]))),
        append(lbottom, values(toList([bottom$1]))),
        combine_lines(new_fold, new_fold2)
      ];
    }
    let $2 = _block$2;
    let ltop$1 = $2[0];
    let lbottom$1 = $2[1];
    let new_fold$1 = $2[2];
    let _block$3;
    let $4 = above_line(current_fold$1[0], fold_line);
    let $5 = above_line(current_fold$1[1], fold_line);
    if ($4) {
      if ($5) {
        _block$3 = [current_fold$1, unwrap(new_fold$1, current_fold$1)];
      } else {
        let intersection = line_intersection(points2line(current_fold$1[0], current_fold$1[1]), fold_line);
        _block$3 = [
          [current_fold$1[0], intersection],
          [intersection, current_fold$1[1]]
        ];
      }
    } else if ($5) {
      throw makeError("panic", FILEPATH4, "folding", 204, "split", "sorted", {});
    } else {
      _block$3 = [unwrap(new_fold$1, current_fold$1), current_fold$1];
    }
    let $3 = _block$3;
    let fold_top = $3[0];
    let fold_bottom = $3[1];
    return [
      (() => {
        if (ltop$1 instanceof Empty) {
          return Option$None$const;
        } else {
          let $6 = ltop$1.tail;
          if ($6 instanceof Empty) {
            let layer$1 = ltop$1.head;
            return new Some(layer$1);
          } else {
            let $7 = $6.tail;
            if ($7 instanceof Empty) {
              let top$1 = ltop$1.head;
              let bottom$1 = $6.head;
              return new Some(new Fold(top$1, bottom$1, fold_top));
            } else {
              throw makeError("panic", FILEPATH4, "folding", 213, "split", "`panic` expression evaluated.", {});
            }
          }
        }
      })(),
      (() => {
        if (lbottom$1 instanceof Empty) {
          return Option$None$const;
        } else {
          let $6 = lbottom$1.tail;
          if ($6 instanceof Empty) {
            let layer$1 = lbottom$1.head;
            return new Some(layer$1);
          } else {
            let $7 = $6.tail;
            if ($7 instanceof Empty) {
              let top$1 = lbottom$1.head;
              let bottom$1 = $6.head;
              return new Some(new Fold(top$1, bottom$1, fold_bottom));
            } else {
              throw makeError("panic", FILEPATH4, "folding", 219, "split", "`panic` expression evaluated.", {});
            }
          }
        }
      })(),
      new_fold$1
    ];
  }
}
function flip(layer, flip_line) {
  if (layer instanceof Layer) {
    let points = layer.points;
    return new Layer(map2(points, (_capture) => {
      return reflect(_capture, flip_line);
    }), layer.animation, layer.color);
  } else if (layer instanceof Stack) {
    let layers = layer[0];
    return new Stack(reverse2(map2(layers, (_capture) => {
      return flip(_capture, flip_line);
    })));
  } else {
    let top = layer.top;
    let bottom = layer.bottom;
    let p1 = layer.fold[0];
    let p2 = layer.fold[1];
    return new Fold(flip(bottom, flip_line), flip(top, flip_line), [reflect(p1, flip_line), reflect(p2, flip_line)]);
  }
}
function fold3(layer, fold_line) {
  let $ = split2(layer, fold_line, true);
  let $1 = $[0];
  if ($1 instanceof Some) {
    let $2 = $[1];
    if ($2 instanceof Some) {
      let $3 = $[2];
      if ($3 instanceof Some) {
        let top = $1[0];
        let bottom = $2[0];
        let flip1 = $3[0];
        return new Fold(flip(top, fold_line), bottom, flip1);
      } else {
        throw makeError("panic", FILEPATH4, "folding", 246, "fold", "`panic` expression evaluated.", {});
      }
    } else {
      let top = $1[0];
      return flip(top, fold_line);
    }
  } else {
    let $2 = $[1];
    if ($2 instanceof Some) {
      let bottom = $2[0];
      return bottom;
    } else {
      throw makeError("panic", FILEPATH4, "folding", 246, "fold", "`panic` expression evaluated.", {});
    }
  }
}
function init() {
  return new Paper(false, [0, 0], Option$None$const, new Stack(toList([
    new Layer(toList([
      [-150, -250],
      [150, -250],
      [150, 250],
      [-150, 250]
    ]), repeat([0, 0], 4), colour_hex("#F1E9D2")),
    new Layer(toList([
      [-100, -200],
      [100, -200],
      [100, 200],
      [-100, 200]
    ]), repeat([0, 0], 4), colour_hex("#1111ff"))
  ])));
}
function update_animation(layer) {
  if (layer instanceof Layer) {
    let points = layer.points;
    let animation = layer.animation;
    return new Layer(points, map2(zip(points, animation), (e) => {
      let target = e[0];
      let p = e[1];
      return [
        p[0] + (target[0] - p[0]) * 0.1,
        p[1] + (target[1] - p[1]) * 0.1
      ];
    }), layer.color);
  } else if (layer instanceof Stack) {
    let layers = layer[0];
    return new Stack(map2(layers, update_animation));
  } else {
    let top = layer.top;
    let bottom = layer.bottom;
    return new Fold(update_animation(top), update_animation(bottom), layer.fold);
  }
}
function update(state, event) {
  if (event instanceof Tick) {
    return new Paper(state.space, state.mouse, state.line, update_animation(state.layers));
  } else if (event instanceof KeyboardPressed) {
    let $ = event[0];
    if ($ instanceof KeySpace) {
      return new Paper(true, state.mouse, state.line, state.layers);
    } else {
      return state;
    }
  } else if (event instanceof KeyboardRelased) {
    let $ = event[0];
    if ($ instanceof KeySpace) {
      return new Paper(false, state.mouse, state.line, state.layers);
    } else {
      return state;
    }
  } else if (event instanceof MouseMoved) {
    let x = event[0];
    let y = event[1];
    return new Paper(state.space, [x - width() / 2, y - height() / 2], state.line, state.layers);
  } else if (event instanceof MousePressed) {
    let $ = event[0];
    if ($ instanceof MouseButtonLeft) {
      return new Paper(state.space, state.mouse, new Some(state.mouse), state.layers);
    } else {
      return state;
    }
  } else {
    let $ = event[0];
    if ($ instanceof MouseButtonLeft) {
      let $1 = state.line;
      if ($1 instanceof Some) {
        let mouse = state.mouse;
        let layers = state.layers;
        let start = $1[0];
        let fold_line = points2line(start, mouse);
        return new Paper(state.space, state.mouse, Option$None$const, fold3(layers, fold_line));
      } else {
        return state;
      }
    } else {
      return state;
    }
  }
}
function draw_layer(layer) {
  if (layer instanceof Layer) {
    let $ = layer.animation;
    if ($ instanceof Empty) {
      return blank();
    } else {
      let $1 = $.tail;
      if ($1 instanceof Empty) {
        return blank();
      } else {
        let color = layer.color;
        let p1 = $.head;
        let p2 = $1.head;
        let rest = $1.tail;
        let _pipe = path(p1, flatten(toList([
          toList([path_line(p2)]),
          map2(rest, path_line),
          toList([path_line(p1), path_line(p2)])
        ])));
        let _pipe$1 = stroke(_pipe, black, 3);
        return fill(_pipe$1, color);
      }
    }
  } else if (layer instanceof Stack) {
    let layers = layer[0];
    return combine(map2(layers, draw_layer));
  } else {
    let top = layer.top;
    let bottom = layer.bottom;
    return concat2(draw_layer(bottom), draw_layer(top));
  }
}
function view(state) {
  let _block;
  let $ = state.line;
  if ($ instanceof Some) {
    let start = $[0];
    let _pipe2 = path(start, toList([path_line(state.mouse)]));
    _block = stroke_dashed(_pipe2, dark_grey, 3, toList([5, 3]));
  } else {
    _block = blank();
  }
  let line = _block;
  let _pipe = combine(toList([draw_layer(state.layers), line]));
  return translate_xy(_pipe, width() / 2, height() / 2);
}

// build/dev/javascript/paper/paper.mjs
class State extends CustomType {
  constructor(paper) {
    super();
    this.paper = paper;
  }
}
function init2(_) {
  return new State(init());
}
function update2(state, event) {
  return new State(update(state.paper, event));
}
function view2(state) {
  return view(state.paper);
}
function main() {
  return interact(init2, update2, view2, "#mycanvas");
}
export {
  main
};
