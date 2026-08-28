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
function all_loop(loop$list, loop$acc) {
  while (true) {
    let list = loop$list;
    let acc = loop$acc;
    if (list instanceof Empty) {
      return new Some(reverse(acc));
    } else {
      let $ = list.head;
      if ($ instanceof Some) {
        let rest = list.tail;
        let first = $[0];
        loop$list = rest;
        loop$acc = prepend(first, acc);
      } else {
        return Option$None$const;
      }
    }
  }
}
function all(list) {
  return all_loop(list, List$Empty$const);
}
function from_result(result) {
  if (result instanceof Ok) {
    let a = result[0];
    return new Some(a);
  } else {
    return Option$None$const;
  }
}
function unwrap(option, default$) {
  if (option instanceof Some) {
    let x = option[0];
    return x;
  } else {
    return default$;
  }
}
function map(option, fun) {
  if (option instanceof Some) {
    let x = option[0];
    return new Some(fun(x));
  } else {
    return option;
  }
}
function then$(option, fun) {
  if (option instanceof Some) {
    let x = option[0];
    return fun(x);
  } else {
    return option;
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

// build/dev/javascript/gleam_stdlib/gleam/int.mjs
function power2(base, exponent) {
  let _pipe = base;
  let _pipe$1 = identity(_pipe);
  return power(_pipe$1, exponent);
}
function min(a, b) {
  let $ = a < b;
  if ($) {
    return a;
  } else {
    return b;
  }
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
var emptyNode = /* @__PURE__ */ newNode(0);
var emptyDict = /* @__PURE__ */ new Dict(0, emptyNode);
function newNode(generation) {
  return new Node(generation, 0, 0, []);
}
function make() {
  return emptyDict;
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
function length_loop(loop$list, loop$count) {
  while (true) {
    let list = loop$list;
    let count = loop$count;
    if (list instanceof Empty) {
      return count;
    } else {
      let list$1 = list.tail;
      loop$list = list$1;
      loop$count = count + 1;
    }
  }
}
function length(list) {
  return length_loop(list, 0);
}
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
function map3(list, fun) {
  return map_loop(list, fun, List$Empty$const);
}
function index_map_loop(loop$list, loop$fun, loop$index, loop$acc) {
  while (true) {
    let list = loop$list;
    let fun = loop$fun;
    let index = loop$index;
    let acc = loop$acc;
    if (list instanceof Empty) {
      return reverse2(acc);
    } else {
      let first$1 = list.head;
      let rest$1 = list.tail;
      let acc$1 = prepend(fun(first$1, index), acc);
      loop$list = rest$1;
      loop$fun = fun;
      loop$index = index + 1;
      loop$acc = acc$1;
    }
  }
}
function index_map(list, fun) {
  return index_map_loop(list, fun, 0, List$Empty$const);
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
function flat_map(list, fun) {
  return flatten(map3(list, fun));
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
function fold_right(list, initial, fun) {
  if (list instanceof Empty) {
    return initial;
  } else {
    let first$1 = list.head;
    let rest$1 = list.tail;
    return fun(fold_right(rest$1, initial, fun), first$1);
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
function find_map(loop$list, loop$fun) {
  while (true) {
    let list = loop$list;
    let fun = loop$fun;
    if (list instanceof Empty) {
      return new Error(undefined);
    } else {
      let first$1 = list.head;
      let rest$1 = list.tail;
      let $ = fun(first$1);
      if ($ instanceof Ok) {
        return $;
      } else {
        loop$list = rest$1;
        loop$fun = fun;
      }
    }
  }
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
function strict_zip_loop(loop$one, loop$other, loop$acc) {
  while (true) {
    let one = loop$one;
    let other = loop$other;
    let acc = loop$acc;
    if (one instanceof Empty) {
      if (other instanceof Empty) {
        return new Ok(reverse2(acc));
      } else {
        return new Error(undefined);
      }
    } else if (other instanceof Empty) {
      return new Error(undefined);
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
function strict_zip(list, other) {
  return strict_zip_loop(list, other, List$Empty$const);
}
function merge_descendings(loop$list1, loop$list2, loop$compare, loop$acc) {
  while (true) {
    let list1 = loop$list1;
    let list2 = loop$list2;
    let compare2 = loop$compare;
    let acc = loop$acc;
    if (list1 instanceof Empty) {
      let list = list2;
      return reverse_and_prepend2(list, acc);
    } else if (list2 instanceof Empty) {
      let list = list1;
      return reverse_and_prepend2(list, acc);
    } else {
      let first1 = list1.head;
      let rest1 = list1.tail;
      let first2 = list2.head;
      let rest2 = list2.tail;
      let $ = compare2(first1, first2);
      if ($ instanceof Lt) {
        loop$list1 = list1;
        loop$list2 = rest2;
        loop$compare = compare2;
        loop$acc = prepend(first2, acc);
      } else if ($ instanceof Eq) {
        loop$list1 = rest1;
        loop$list2 = list2;
        loop$compare = compare2;
        loop$acc = prepend(first1, acc);
      } else {
        loop$list1 = rest1;
        loop$list2 = list2;
        loop$compare = compare2;
        loop$acc = prepend(first1, acc);
      }
    }
  }
}
function merge_descending_pairs(loop$sequences, loop$compare, loop$acc) {
  while (true) {
    let sequences = loop$sequences;
    let compare2 = loop$compare;
    let acc = loop$acc;
    if (sequences instanceof Empty) {
      return reverse2(acc);
    } else {
      let $ = sequences.tail;
      if ($ instanceof Empty) {
        let sequence = sequences.head;
        return reverse2(prepend(reverse2(sequence), acc));
      } else {
        let descending1 = sequences.head;
        let descending2 = $.head;
        let rest$1 = $.tail;
        let ascending = merge_descendings(descending1, descending2, compare2, List$Empty$const);
        loop$sequences = rest$1;
        loop$compare = compare2;
        loop$acc = prepend(ascending, acc);
      }
    }
  }
}
function merge_ascendings(loop$list1, loop$list2, loop$compare, loop$acc) {
  while (true) {
    let list1 = loop$list1;
    let list2 = loop$list2;
    let compare2 = loop$compare;
    let acc = loop$acc;
    if (list1 instanceof Empty) {
      let list = list2;
      return reverse_and_prepend2(list, acc);
    } else if (list2 instanceof Empty) {
      let list = list1;
      return reverse_and_prepend2(list, acc);
    } else {
      let first1 = list1.head;
      let rest1 = list1.tail;
      let first2 = list2.head;
      let rest2 = list2.tail;
      let $ = compare2(first1, first2);
      if ($ instanceof Lt) {
        loop$list1 = rest1;
        loop$list2 = list2;
        loop$compare = compare2;
        loop$acc = prepend(first1, acc);
      } else if ($ instanceof Eq) {
        loop$list1 = list1;
        loop$list2 = rest2;
        loop$compare = compare2;
        loop$acc = prepend(first2, acc);
      } else {
        loop$list1 = list1;
        loop$list2 = rest2;
        loop$compare = compare2;
        loop$acc = prepend(first2, acc);
      }
    }
  }
}
function merge_ascending_pairs(loop$sequences, loop$compare, loop$acc) {
  while (true) {
    let sequences = loop$sequences;
    let compare2 = loop$compare;
    let acc = loop$acc;
    if (sequences instanceof Empty) {
      return reverse2(acc);
    } else {
      let $ = sequences.tail;
      if ($ instanceof Empty) {
        let sequence = sequences.head;
        return reverse2(prepend(reverse2(sequence), acc));
      } else {
        let ascending1 = sequences.head;
        let ascending2 = $.head;
        let rest$1 = $.tail;
        let descending = merge_ascendings(ascending1, ascending2, compare2, List$Empty$const);
        loop$sequences = rest$1;
        loop$compare = compare2;
        loop$acc = prepend(descending, acc);
      }
    }
  }
}
function merge_all(loop$sequences, loop$direction, loop$compare) {
  while (true) {
    let sequences = loop$sequences;
    let direction = loop$direction;
    let compare2 = loop$compare;
    if (sequences instanceof Empty) {
      return sequences;
    } else if (direction instanceof Ascending) {
      let $ = sequences.tail;
      if ($ instanceof Empty) {
        let sequence = sequences.head;
        return sequence;
      } else {
        let sequences$1 = merge_ascending_pairs(sequences, compare2, List$Empty$const);
        loop$sequences = sequences$1;
        loop$direction = Sorting$Descending$const;
        loop$compare = compare2;
      }
    } else {
      let $ = sequences.tail;
      if ($ instanceof Empty) {
        let sequence = sequences.head;
        return reverse2(sequence);
      } else {
        let sequences$1 = merge_descending_pairs(sequences, compare2, List$Empty$const);
        loop$sequences = sequences$1;
        loop$direction = Sorting$Ascending$const;
        loop$compare = compare2;
      }
    }
  }
}
function sequences(loop$list, loop$compare, loop$growing, loop$direction, loop$prev, loop$acc) {
  while (true) {
    let list = loop$list;
    let compare2 = loop$compare;
    let growing = loop$growing;
    let direction = loop$direction;
    let prev = loop$prev;
    let acc = loop$acc;
    let growing$1 = prepend(prev, growing);
    if (list instanceof Empty) {
      if (direction instanceof Ascending) {
        return prepend(reverse2(growing$1), acc);
      } else {
        return prepend(growing$1, acc);
      }
    } else {
      let new$1 = list.head;
      let rest$1 = list.tail;
      let $ = compare2(prev, new$1);
      if (direction instanceof Ascending) {
        if ($ instanceof Lt) {
          loop$list = rest$1;
          loop$compare = compare2;
          loop$growing = growing$1;
          loop$direction = direction;
          loop$prev = new$1;
          loop$acc = acc;
        } else if ($ instanceof Eq) {
          loop$list = rest$1;
          loop$compare = compare2;
          loop$growing = growing$1;
          loop$direction = direction;
          loop$prev = new$1;
          loop$acc = acc;
        } else {
          let _block;
          if (direction instanceof Ascending) {
            _block = prepend(reverse2(growing$1), acc);
          } else {
            _block = prepend(growing$1, acc);
          }
          let acc$1 = _block;
          if (rest$1 instanceof Empty) {
            return prepend(toList([new$1]), acc$1);
          } else {
            let next = rest$1.head;
            let rest$2 = rest$1.tail;
            let _block$1;
            let $1 = compare2(new$1, next);
            if ($1 instanceof Lt) {
              _block$1 = Sorting$Ascending$const;
            } else if ($1 instanceof Eq) {
              _block$1 = Sorting$Ascending$const;
            } else {
              _block$1 = Sorting$Descending$const;
            }
            let direction$1 = _block$1;
            loop$list = rest$2;
            loop$compare = compare2;
            loop$growing = toList([new$1]);
            loop$direction = direction$1;
            loop$prev = next;
            loop$acc = acc$1;
          }
        }
      } else if ($ instanceof Lt) {
        let _block;
        if (direction instanceof Ascending) {
          _block = prepend(reverse2(growing$1), acc);
        } else {
          _block = prepend(growing$1, acc);
        }
        let acc$1 = _block;
        if (rest$1 instanceof Empty) {
          return prepend(toList([new$1]), acc$1);
        } else {
          let next = rest$1.head;
          let rest$2 = rest$1.tail;
          let _block$1;
          let $1 = compare2(new$1, next);
          if ($1 instanceof Lt) {
            _block$1 = Sorting$Ascending$const;
          } else if ($1 instanceof Eq) {
            _block$1 = Sorting$Ascending$const;
          } else {
            _block$1 = Sorting$Descending$const;
          }
          let direction$1 = _block$1;
          loop$list = rest$2;
          loop$compare = compare2;
          loop$growing = toList([new$1]);
          loop$direction = direction$1;
          loop$prev = next;
          loop$acc = acc$1;
        }
      } else if ($ instanceof Eq) {
        let _block;
        if (direction instanceof Ascending) {
          _block = prepend(reverse2(growing$1), acc);
        } else {
          _block = prepend(growing$1, acc);
        }
        let acc$1 = _block;
        if (rest$1 instanceof Empty) {
          return prepend(toList([new$1]), acc$1);
        } else {
          let next = rest$1.head;
          let rest$2 = rest$1.tail;
          let _block$1;
          let $1 = compare2(new$1, next);
          if ($1 instanceof Lt) {
            _block$1 = Sorting$Ascending$const;
          } else if ($1 instanceof Eq) {
            _block$1 = Sorting$Ascending$const;
          } else {
            _block$1 = Sorting$Descending$const;
          }
          let direction$1 = _block$1;
          loop$list = rest$2;
          loop$compare = compare2;
          loop$growing = toList([new$1]);
          loop$direction = direction$1;
          loop$prev = next;
          loop$acc = acc$1;
        }
      } else {
        loop$list = rest$1;
        loop$compare = compare2;
        loop$growing = growing$1;
        loop$direction = direction;
        loop$prev = new$1;
        loop$acc = acc;
      }
    }
  }
}
function sort(list, compare2) {
  if (list instanceof Empty) {
    return list;
  } else {
    let $ = list.tail;
    if ($ instanceof Empty) {
      return list;
    } else {
      let x = list.head;
      let y = $.head;
      let rest$1 = $.tail;
      let _block;
      let $1 = compare2(x, y);
      if ($1 instanceof Lt) {
        _block = Sorting$Ascending$const;
      } else if ($1 instanceof Eq) {
        _block = Sorting$Ascending$const;
      } else {
        _block = Sorting$Descending$const;
      }
      let direction = _block;
      let sequences$1 = sequences(rest$1, compare2, toList([x]), direction, y, List$Empty$const);
      return merge_all(sequences$1, Sorting$Ascending$const, compare2);
    }
  }
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
function scan_loop(loop$list, loop$accumulator, loop$accumulated, loop$fun) {
  while (true) {
    let list = loop$list;
    let accumulator = loop$accumulator;
    let accumulated = loop$accumulated;
    let fun = loop$fun;
    if (list instanceof Empty) {
      return reverse2(accumulated);
    } else {
      let first$1 = list.head;
      let rest$1 = list.tail;
      let next = fun(accumulator, first$1);
      loop$list = rest$1;
      loop$accumulator = next;
      loop$accumulated = prepend(next, accumulated);
      loop$fun = fun;
    }
  }
}
function scan(list, initial, fun) {
  return scan_loop(list, initial, List$Empty$const, fun);
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
function shuffle_pair_unwrap_loop(loop$list, loop$acc) {
  while (true) {
    let list = loop$list;
    let acc = loop$acc;
    if (list instanceof Empty) {
      return acc;
    } else {
      let elem_pair = list.head;
      let enumerable = list.tail;
      loop$list = enumerable;
      loop$acc = prepend(elem_pair[1], acc);
    }
  }
}
function do_shuffle_by_pair_indexes(list_of_pairs) {
  return sort(list_of_pairs, (a_pair, b_pair) => {
    return compare(a_pair[0], b_pair[0]);
  });
}
function shuffle(list) {
  let _pipe = list;
  let _pipe$1 = fold2(_pipe, List$Empty$const, (acc, a) => {
    return prepend([random_uniform(), a], acc);
  });
  let _pipe$2 = do_shuffle_by_pair_indexes(_pipe$1);
  return shuffle_pair_unwrap_loop(_pipe$2, List$Empty$const);
}
function max_loop(loop$list, loop$compare, loop$max) {
  while (true) {
    let list = loop$list;
    let compare2 = loop$compare;
    let max = loop$max;
    if (list instanceof Empty) {
      return max;
    } else {
      let first$1 = list.head;
      let rest$1 = list.tail;
      let $ = compare2(first$1, max);
      if ($ instanceof Lt) {
        loop$list = rest$1;
        loop$compare = compare2;
        loop$max = max;
      } else if ($ instanceof Eq) {
        loop$list = rest$1;
        loop$compare = compare2;
        loop$max = max;
      } else {
        loop$list = rest$1;
        loop$compare = compare2;
        loop$max = first$1;
      }
    }
  }
}
function max(list, compare2) {
  if (list instanceof Empty) {
    return new Error(undefined);
  } else {
    let first$1 = list.head;
    let rest$1 = list.tail;
    return new Ok(max_loop(rest$1, compare2, first$1));
  }
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
      let string = strings.head;
      let strings$1 = strings.tail;
      loop$strings = strings$1;
      loop$separator = separator;
      loop$accumulator = accumulator + separator + string;
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
function floor(float2) {
  return Math.floor(float2);
}
function round2(float2) {
  return Math.round(float2);
}
function power3(base, exponent) {
  return Math.pow(base, exponent);
}
function random_uniform() {
  const random_uniform_result = Math.random();
  if (random_uniform_result === 1) {
    return random_uniform();
  }
  return random_uniform_result;
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
  #dict(map4) {
    let body = "dict.from_list([";
    let first2 = true;
    body = fold(map4, body, (body2, key, value) => {
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
  #utfCodepoint(codepoint2) {
    return `//utfcodepoint(${String.fromCodePoint(codepoint2.value)})`;
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
function max2(a, b) {
  let $ = a > b;
  if ($) {
    return a;
  } else {
    return b;
  }
}
function min2(a, b) {
  let $ = a < b;
  if ($) {
    return a;
  } else {
    return b;
  }
}
function compare(a, b) {
  let $ = a === b;
  if ($) {
    return Order$Eq$const;
  } else {
    let $1 = a < b;
    if ($1) {
      return Order$Lt$const;
    } else {
      return Order$Gt$const;
    }
  }
}
function absolute_value(x) {
  let $ = x >= 0;
  if ($) {
    return x;
  } else {
    return 0 - x;
  }
}
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
function power(base, exponent) {
  let fractional = ceiling(exponent) - exponent > 0;
  let $ = base < 0 && fractional || base === 0 && exponent < 0;
  if ($) {
    return new Error(undefined);
  } else {
    return new Ok(power3(base, exponent));
  }
}
function square_root(x) {
  return power(x, 0.5);
}
function modulo(dividend, divisor) {
  if (divisor === 0) {
    return new Error(undefined);
  } else {
    return new Ok(dividend - floor(divideFloat(dividend, divisor)) * divisor);
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

// build/dev/javascript/gleam_stdlib/gleam/result.mjs
function try$(result, fun) {
  if (result instanceof Ok) {
    let x = result[0];
    return fun(x);
  } else {
    return result;
  }
}
function unwrap2(result, default$) {
  if (result instanceof Ok) {
    let v = result[0];
    return v;
  } else {
    return default$;
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
        return try$(power2(16, identity(index2)), (base) => {
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
function text(text2, font_size) {
  return new Text(text2, font_size);
}
function text_align(picture, alignment) {
  return new TextAlign(picture, (() => {
    if (alignment instanceof TextAlignStart2) {
      return TextAlign$TextAlignStart$const;
    } else if (alignment instanceof TextAlignEnd2) {
      return TextAlign$TextAlignEnd$const;
    } else if (alignment instanceof TextAlignLeft2) {
      return TextAlign$TextAlignLeft$const;
    } else if (alignment instanceof TextAlignRight2) {
      return TextAlign$TextAlignRight$const;
    } else {
      return TextAlign$TextAlignCenter$const;
    }
  })());
}
function text_baseline(picture, baseline) {
  return new TextBaseline(picture, (() => {
    if (baseline instanceof TextBaselineTop2) {
      return TextBaseline$TextBaselineTop$const;
    } else if (baseline instanceof TextBaselineHanging2) {
      return TextBaseline$TextBaselineHanging$const;
    } else if (baseline instanceof TextBaselineMiddle2) {
      return TextBaseline$TextBaselineMiddle$const;
    } else if (baseline instanceof TextBaselineAlphabetic2) {
      return TextBaseline$TextBaselineAlphabetic$const;
    } else if (baseline instanceof TextBaselineIdeographic2) {
      return TextBaseline$TextBaselineIdeographic$const;
    } else {
      return TextBaseline$TextBaselineBottom$const;
    }
  })());
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
function text2(ctx, text3, font) {
  ctx.font = font;
  ctx.fillText(text3, 0, 0);
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
      let text3 = picture.text;
      let size_px = picture.size_px;
      save(ctx);
      text2(ctx, text3, to_string(size_px) + "px " + state.font_family);
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

// build/dev/javascript/paper/extras.mjs
function width() {
  const canvas = document.getElementById("mycanvas");
  return canvas.width;
}
function height() {
  const canvas = document.getElementById("mycanvas");
  return canvas.height;
}
function time() {
  return Date.now();
}
// build/dev/javascript/gleam_yielder/gleam/yielder.mjs
class Stop extends CustomType {
}
var Action$Stop$const = new Stop;
class Done extends CustomType {
}
var Step$Done$const = new Done;
class NoMore extends CustomType {
}
var SizedChunk$NoMore$const = new NoMore;
// build/dev/javascript/gleam_community_maths/maths.mjs
function sin(float4) {
  return Math.sin(float4);
}
function atan2(floaty, floatx) {
  return Math.atan2(floaty, floatx);
}
function cos(float4) {
  return Math.cos(float4);
}

// build/dev/javascript/gleam_community_maths/gleam_community/maths.mjs
function sin2(x) {
  return sin(x);
}
function cos2(x) {
  return cos(x);
}
function atan22(y, x) {
  return atan2(y, x);
}

// build/dev/javascript/paper/layer.mjs
var FILEPATH4 = "src/layer.gleam";

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
  constructor(top, bottom, crease) {
    super();
    this.top = top;
    this.bottom = bottom;
    this.crease = crease;
  }
}
function paper(points, color) {
  return new Layer(points, map3(points, (_) => {
    return [0, 0];
  }), color);
}
function paper_rect(pos, size3, color) {
  return paper(toList([
    [pos[0] - size3[0] / 2, pos[1] - size3[1] / 2],
    [pos[0] + size3[0] / 2, pos[1] - size3[1] / 2],
    [pos[0] + size3[0] / 2, pos[1] + size3[1] / 2],
    [pos[0] - size3[0] / 2, pos[1] + size3[1] / 2]
  ]), color);
}
function default_stack(scale2) {
  return new Stack(toList([
    paper_rect([0, 0], [300 * scale2, 500 * scale2], colour_hex("#C0BAA8")),
    paper_rect([0, 0], [300 * scale2, 500 * scale2], colour_hex("#F1E9D2"))
  ]));
}
function transform(layer, callback) {
  if (layer instanceof Layer) {
    let points = layer.points;
    return new Layer(map3(points, callback), layer.animation, layer.color);
  } else if (layer instanceof Stack) {
    let layers = layer[0];
    return new Stack(map3(layers, (_capture) => {
      return transform(_capture, callback);
    }));
  } else {
    let top = layer.top;
    let bottom = layer.bottom;
    let p1 = layer.crease[0];
    let p2 = layer.crease[1];
    return new Fold(transform(top, callback), transform(bottom, callback), [callback(p1), callback(p2)]);
  }
}
function all_points(layer) {
  if (layer instanceof Layer) {
    let points = layer.points;
    return points;
  } else if (layer instanceof Stack) {
    let layers = layer[0];
    return flat_map(layers, all_points);
  } else {
    let top = layer.top;
    let bottom = layer.bottom;
    return append(all_points(top), all_points(bottom));
  }
}
function flip(layer, flip_line) {
  let reflect = (point, line) => {
    let a = line[0];
    let b = line[1];
    let c = line[2];
    let x = point[0];
    let y = point[1];
    let k = divideFloat(2 * (a * x + b * y + c), a * a + b * b);
    return [x - a * k, y - b * k];
  };
  if (layer instanceof Layer) {
    let points = layer.points;
    return new Layer(map3(points, (_capture) => {
      return reflect(_capture, flip_line);
    }), layer.animation, layer.color);
  } else if (layer instanceof Stack) {
    let layers = layer[0];
    return new Stack(reverse2(map3(layers, (_capture) => {
      return flip(_capture, flip_line);
    })));
  } else {
    let top = layer.top;
    let bottom = layer.bottom;
    let p1 = layer.crease[0];
    let p2 = layer.crease[1];
    return new Fold(flip(bottom, flip_line), flip(top, flip_line), [reflect(p1, flip_line), reflect(p2, flip_line)]);
  }
}
function center(layer) {
  let points = all_points(layer);
  let count = identity(length(points));
  let center$1 = fold2(points, [0, 0], (center2, point) => {
    return [center2[0] + point[0], center2[1] + point[1]];
  });
  let center$2 = [
    divideFloat(center$1[0], count),
    divideFloat(center$1[1], count)
  ];
  return transform(layer, (p) => {
    return [p[0] - center$2[0], p[1] - center$2[1]];
  });
}
function bottommost(loop$layer) {
  while (true) {
    let layer = loop$layer;
    if (layer instanceof Layer) {
      let points = layer.points;
      return points;
    } else if (layer instanceof Stack) {
      let $ = layer[0];
      if ($ instanceof Empty) {
        return List$Empty$const;
      } else {
        let layer$1 = $.head;
        loop$layer = layer$1;
      }
    } else {
      let layer$1 = layer.bottom;
      loop$layer = layer$1;
    }
  }
}
function topmost(loop$layer) {
  while (true) {
    let layer = loop$layer;
    if (layer instanceof Layer) {
      return layer;
    } else if (layer instanceof Stack) {
      let layers = layer[0];
      loop$layer = lazy_unwrap(last(layers), () => {
        throw makeError("panic", FILEPATH4, "layer", 112, "topmost", "`panic` expression evaluated.", {});
      });
    } else {
      let layer$1 = layer.top;
      loop$layer = layer$1;
    }
  }
}
function align(layer, segments) {
  let $ = bottommost(layer);
  if ($ instanceof Empty) {
    return layer;
  } else {
    let $1 = $.tail;
    if ($1 instanceof Empty) {
      return layer;
    } else {
      let p1 = $.head;
      let p2 = $1.head;
      let angle = atan22(p2[1] - p1[1], p2[0] - p1[0]);
      let angle_mod = divideFloat(6.2831852, identity(segments));
      let angle$1 = unwrap2(modulo(angle, angle_mod), angle);
      let _block;
      let $2 = angle_mod - angle$1 < angle$1;
      if ($2) {
        _block = angle$1 - angle_mod;
      } else {
        _block = angle$1;
      }
      let angle$2 = _block;
      let sin3 = sin2(0 - angle$2);
      let cos3 = cos2(0 - angle$2);
      return transform(layer, (p) => {
        return [p[0] * cos3 - p[1] * sin3, p[0] * sin3 + p[1] * cos3];
      });
    }
  }
}
function triangle_area(p1, p2, p3) {
  return absolute_value((p1[0] * (p2[1] - p3[1]) + p2[0] * (p3[1] - p1[1]) + p3[0] * (p1[1] - p2[1])) / 2);
}
function area(layer) {
  if (layer instanceof Layer) {
    let $ = layer.points;
    if ($ instanceof Empty) {
      return 0;
    } else {
      let $1 = $.tail;
      if ($1 instanceof Empty) {
        return 0;
      } else {
        let p1 = $.head;
        let p2 = $1.head;
        let rest = $1.tail;
        return fold2(rest, [0, p1, p2], (state, p3) => {
          let area$1 = state[0];
          let p1$1 = state[1];
          let p2$1 = state[2];
          return [area$1 + triangle_area(p1$1, p2$1, p3), p2$1, p3];
        })[0];
      }
    }
  } else if (layer instanceof Stack) {
    let layers = layer[0];
    return unwrap2(max(map3(layers, area), compare), 0);
  } else {
    let top = layer.top;
    let bottom = layer.bottom;
    return max2(area(top), area(bottom));
  }
}
function update_animation(layer) {
  if (layer instanceof Layer) {
    let points = layer.points;
    let animation = layer.animation;
    return new Layer(points, map3(zip(points, animation), (e) => {
      let target = e[0];
      let p = e[1];
      return [
        p[0] + (target[0] - p[0]) * 0.1,
        p[1] + (target[1] - p[1]) * 0.1
      ];
    }), layer.color);
  } else if (layer instanceof Stack) {
    let layers = layer[0];
    return new Stack(map3(layers, update_animation));
  } else {
    let top = layer.top;
    let bottom = layer.bottom;
    return new Fold(update_animation(top), update_animation(bottom), layer.crease);
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
          map3(rest, path_line),
          toList([path_line(p1), path_line(p2)])
        ])));
        let _pipe$1 = stroke(_pipe, black, 3);
        return fill(_pipe$1, color);
      }
    }
  } else if (layer instanceof Stack) {
    let layers = layer[0];
    return combine(map3(layers, draw_layer));
  } else {
    let top = layer.top;
    let bottom = layer.bottom;
    return concat2(draw_layer(bottom), draw_layer(top));
  }
}
function match(a, b, scale2) {
  let combine2 = (scores) => {
    return map(all(scores), (scores2) => {
      let count = identity(length(scores2));
      return divideFloat(fold2(scores2, 0, (a2, b2) => {
        return a2 + b2;
      }), count);
    });
  };
  if (a instanceof Layer) {
    if (b instanceof Layer) {
      let color1 = a.color;
      let color2 = b.color;
      if (isEqual(color1, color2)) {
        let points1 = a.points;
        let points2 = b.points;
        let points2$1 = map3(points2, (p) => {
          return [divideFloat(p[0], scale2), divideFloat(p[1], scale2)];
        });
        let closest = (p, set) => {
          return unwrap2(square_root(fold2(set, 1e6, (dst, p2) => {
            let $2 = [p2[0] - p[0], p2[1] - p[1]];
            let dx = $2[0];
            let dy = $2[1];
            return min2(dst, dx * dx + dy * dy);
          })), 0);
        };
        let distances = append(map3(points1, (_capture) => {
          return closest(_capture, points2$1);
        }), map3(points2$1, (_capture) => {
          return closest(_capture, points1);
        }));
        let count = identity(length(distances));
        let score = divideFloat(fold2(distances, 0, (score2, dst) => {
          return score2 + 1 - dst * dst / 1e4;
        }), count);
        let $ = score >= 0.2;
        if ($) {
          return new Some(score);
        } else {
          return Option$None$const;
        }
      } else {
        return Option$None$const;
      }
    } else {
      return Option$None$const;
    }
  } else if (a instanceof Stack) {
    if (b instanceof Stack) {
      let layers1 = a[0];
      let layers2 = b[0];
      return then$(from_result(strict_zip(layers1, layers2)), (pairs) => {
        return combine2(map3(pairs, (pair) => {
          return match(pair[0], pair[1], scale2);
        }));
      });
    } else {
      return Option$None$const;
    }
  } else if (b instanceof Fold) {
    let top1 = a.top;
    let bottom1 = a.bottom;
    let top2 = b.top;
    let bottom2 = b.bottom;
    return combine2(toList([match(top1, top2, scale2), match(bottom1, bottom2, scale2)]));
  } else {
    return Option$None$const;
  }
}

// build/dev/javascript/paper/folding.mjs
var FILEPATH5 = "src/folding.gleam";

class Paper extends CustomType {
  constructor(mouse, line, layers) {
    super();
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
function split3(layer, fold_line) {
  let combine_lines = (crease1, crease2) => {
    let eval$ = (p) => {
      return fold_line[1] * p[0] - fold_line[0] * p[1] + fold_line[2];
    };
    let _block;
    if (crease1 instanceof Some) {
      let p1 = crease1[0][0];
      let p2 = crease1[0][1];
      let $ = eval$(p1) < eval$(p2);
      if ($) {
        _block = new Some([p1, p2]);
      } else {
        _block = new Some([p2, p1]);
      }
    } else {
      _block = crease1;
    }
    let crease1$1 = _block;
    let _block$1;
    if (crease2 instanceof Some) {
      let p1 = crease2[0][0];
      let p2 = crease2[0][1];
      let $ = eval$(p1) < eval$(p2);
      if ($) {
        _block$1 = new Some([p1, p2]);
      } else {
        _block$1 = new Some([p2, p1]);
      }
    } else {
      _block$1 = crease2;
    }
    let crease2$1 = _block$1;
    if (crease1$1 instanceof Some) {
      if (crease2$1 instanceof Some) {
        let crease1$2 = crease1$1[0];
        let crease2$2 = crease2$1[0];
        return new Some([
          (() => {
            let $ = eval$(crease1$2[0]) < eval$(crease2$2[0]);
            if ($) {
              return crease1$2[0];
            } else {
              return crease2$2[0];
            }
          })(),
          (() => {
            let $ = eval$(crease1$2[1]) > eval$(crease2$2[1]);
            if ($) {
              return crease1$2[1];
            } else {
              return crease2$2[1];
            }
          })()
        ]);
      } else {
        return crease1$1;
      }
    } else if (crease2$1 instanceof Some) {
      return crease2$1;
    } else {
      return crease1$1;
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
      throw makeError("panic", FILEPATH5, "folding", 138, "split", "`panic` expression evaluated.", {});
    } else {
      let $ = polys$2.tail;
      if ($ instanceof Empty) {
        let $1 = polys$2.head;
        if ($1 instanceof Empty) {
          throw makeError("panic", FILEPATH5, "folding", 138, "split", "`panic` expression evaluated.", {});
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
            throw makeError("panic", FILEPATH5, "folding", 114, "split", "`panic` expression evaluated.", {});
          });
          let a2 = lazy_unwrap(last(a), () => {
            throw makeError("panic", FILEPATH5, "folding", 115, "split", "`panic` expression evaluated.", {});
          });
          let b1 = lazy_unwrap(first(b), () => {
            throw makeError("panic", FILEPATH5, "folding", 116, "split", "`panic` expression evaluated.", {});
          });
          let b2 = lazy_unwrap(last(b), () => {
            throw makeError("panic", FILEPATH5, "folding", 117, "split", "`panic` expression evaluated.", {});
          });
          let p1 = line_intersection(points2line(a1, b2), fold_line);
          let p2 = line_intersection(points2line(a2, b1), fold_line);
          return [
            new Some(new Layer(flatten(toList([toList([p1]), a, toList([p2])])), flatten(toList([toList([p1]), a, toList([p2])])), layer.color)),
            new Some(new Layer(flatten(toList([toList([p2]), b, toList([p1])])), flatten(toList([toList([p2]), b, toList([p1])])), layer.color)),
            new Some([p1, p2])
          ];
        } else {
          throw makeError("panic", FILEPATH5, "folding", 138, "split", "`panic` expression evaluated.", {});
        }
      }
    }
  } else if (layer instanceof Stack) {
    let layers = layer[0];
    let $ = fold_right(layers, [List$Empty$const, List$Empty$const, Option$None$const], (state, layer2) => {
      let ltop = state[0];
      let lbottom = state[1];
      let fold$12 = state[2];
      let $1 = split3(layer2, fold_line);
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
          return new Some(new Stack(layers$1));
        }
      })(),
      (() => {
        if (bottom instanceof Empty) {
          return Option$None$const;
        } else {
          let layers$1 = bottom;
          return new Some(new Stack(layers$1));
        }
      })(),
      fold$1
    ];
  } else {
    let top = layer.top;
    let bottom = layer.bottom;
    let crease = layer.crease;
    let _block;
    {
      let $12 = split3(top, fold_line);
      let top1 = $12[0];
      let bottom1 = $12[1];
      let crease12 = $12[2];
      let $22 = split3(bottom, fold_line);
      let top2 = $22[0];
      let bottom2 = $22[1];
      let crease22 = $22[2];
      _block = [
        values(toList([top1, top2])),
        values(toList([bottom1, bottom2])),
        combine_lines(crease12, crease22)
      ];
    }
    let $ = _block;
    let top$1 = $[0];
    let bottom$1 = $[1];
    let new_crease = $[2];
    let intersection2 = line_intersection(points2line(crease[0], crease[1]), fold_line);
    let _block$1;
    let $2 = above_line(crease[0], fold_line);
    let $3 = above_line(crease[1], fold_line);
    if ($2) {
      if ($3) {
        _block$1 = [crease, unwrap(new_crease, crease)];
      } else {
        _block$1 = [[crease[0], intersection2], [intersection2, crease[1]]];
      }
    } else if ($3) {
      _block$1 = [[crease[1], intersection2], [intersection2, crease[0]]];
    } else {
      _block$1 = [unwrap(new_crease, crease), crease];
    }
    let $1 = _block$1;
    let crease1 = $1[0];
    let crease2 = $1[1];
    let combine2 = (layers, crease3) => {
      if (layers instanceof Empty) {
        return Option$None$const;
      } else {
        let $4 = layers.tail;
        if ($4 instanceof Empty) {
          let layer$1 = layers.head;
          return new Some(layer$1);
        } else {
          let $5 = $4.tail;
          if ($5 instanceof Empty) {
            let top$2 = layers.head;
            let bottom$2 = $4.head;
            return new Some(new Fold(top$2, bottom$2, crease3));
          } else {
            throw makeError("panic", FILEPATH5, "folding", 199, "split", "`panic` expression evaluated.", {});
          }
        }
      }
    };
    return [combine2(top$1, crease1), combine2(bottom$1, crease2), new_crease];
  }
}
function fold4(layer, fold_line, callback) {
  let split_fold = (layer2) => {
    let $ = split3(layer2, fold_line);
    let top = $[0];
    let bottom = $[1];
    let crease = $[2];
    if (top instanceof Some) {
      if (bottom instanceof Some) {
        if (crease instanceof Some) {
          let top$1 = top[0];
          let bottom$1 = bottom[0];
          let crease$1 = crease[0];
          return [
            callback(new Fold(flip(top$1, fold_line), bottom$1, crease$1)),
            true
          ];
        } else {
          return [layer2, false];
        }
      } else {
        let top$1 = top[0];
        return [flip(top$1, fold_line), true];
      }
    } else if (bottom instanceof Some) {
      let bottom$1 = bottom[0];
      return [bottom$1, false];
    } else {
      return [layer2, false];
    }
  };
  if (layer instanceof Fold) {
    let top = layer.top;
    let bottom = layer.bottom;
    let crease = layer.crease;
    let fold_all = above_line(crease[0], fold_line) || above_line(crease[1], fold_line);
    if (fold_all) {
      return split_fold(layer);
    } else {
      let $ = fold4(top, fold_line, callback);
      let $1 = $[1];
      if ($1) {
        let top$1 = $[0];
        return [new Fold(top$1, bottom, crease), true];
      } else {
        let top$1 = $[0];
        let $2 = fold4(bottom, fold_line, (layer2) => {
          if (layer2 instanceof Fold) {
            let top1 = layer2.top;
            let bottom1 = layer2.bottom;
            let crease1 = layer2.crease;
            return callback(new Fold(top1, new Fold(top$1, bottom1, crease), crease1));
          } else {
            return layer2;
          }
        });
        let $3 = $2[1];
        if ($3) {
          return $2;
        } else {
          return [layer, false];
        }
      }
    }
  } else {
    let layer$1 = layer;
    return split_fold(layer$1);
  }
}
function continuous_time() {
  return identity(time()) / 1000;
}
function randomize(layer) {
  let top_layer = topmost(layer);
  let _block;
  if (top_layer instanceof Layer) {
    let points2 = top_layer.points;
    _block = points2;
  } else {
    throw makeError("panic", FILEPATH5, "folding", 275, "randomize", "`panic` expression evaluated.", {});
  }
  let points = _block;
  return ((callback) => {
    return unwrap2(find_map((() => {
      let _pipe = points;
      return shuffle(_pipe);
    })(), callback), layer);
  })((point) => {
    let dirs = toList([[1, 0], [1, 1], [0, 1], [-1, 1]]);
    return find_map(dirs, (dir) => {
      let line = points2line(point, [point[0] + dir[0], point[1] + dir[1]]);
      let $ = split3(top_layer, line);
      let $1 = $[0];
      if ($1 instanceof Some) {
        let $2 = $[1];
        if ($2 instanceof Some) {
          let l1 = $1[0];
          let l2 = $2[0];
          let $3 = min2(echo(area(l1), undefined, "src/folding.gleam", 294), echo(area(l2), undefined, "src/folding.gleam", 294)) > 5;
          if ($3) {
            return new Ok(fold4(layer, line, (layer2) => {
              return layer2;
            })[0]);
          } else {
            return new Error(undefined);
          }
        } else {
          return new Error(undefined);
        }
      } else {
        return new Error(undefined);
      }
    });
  });
}
function init() {
  return new Paper([0, 0], Option$None$const, toList([default_stack(1)]));
}
function update(state, event) {
  let $ = state.layers;
  if ($ instanceof Empty) {
    if (event instanceof MouseMoved) {
      let x = event[0];
      let y = event[1];
      return new Paper([x - width() / 2, y - height() / 2], state.line, state.layers);
    } else if (event instanceof MousePressed) {
      let $1 = event[0];
      if ($1 instanceof MouseButtonLeft) {
        return new Paper(state.mouse, new Some(state.mouse), state.layers);
      } else {
        return state;
      }
    } else {
      return state;
    }
  } else {
    let $1 = $.tail;
    if ($1 instanceof Empty) {
      if (event instanceof Tick) {
        let layer = $.head;
        let rest = $1;
        return new Paper(state.mouse, state.line, prepend(update_animation(layer), rest));
      } else if (event instanceof KeyboardPressed) {
        let $2 = event[0];
        if ($2 instanceof KeySpace) {
          let layer = $.head;
          let rest = $1;
          return new Paper(state.mouse, state.line, prepend(align(center(layer), 4), rest));
        } else {
          return state;
        }
      } else if (event instanceof MouseMoved) {
        let x = event[0];
        let y = event[1];
        return new Paper([x - width() / 2, y - height() / 2], state.line, state.layers);
      } else if (event instanceof MousePressed) {
        let $2 = event[0];
        if ($2 instanceof MouseButtonLeft) {
          return new Paper(state.mouse, new Some(state.mouse), state.layers);
        } else {
          return state;
        }
      } else if (event instanceof MouseReleased) {
        let $2 = state.line;
        if ($2 instanceof Some) {
          let $3 = event[0];
          if ($3 instanceof MouseButtonLeft) {
            let mouse = state.mouse;
            let layer = $.head;
            let rest = $1;
            let start = $2[0];
            let fold_line = points2line(start, mouse);
            return new Paper(state.mouse, Option$None$const, prepend(fold4(layer, fold_line, (layer2) => {
              return layer2;
            })[0], prepend(layer, rest)));
          } else {
            return state;
          }
        } else {
          return state;
        }
      } else {
        return state;
      }
    } else if (event instanceof Tick) {
      let layer = $.head;
      let rest = $1;
      return new Paper(state.mouse, state.line, prepend(update_animation(layer), rest));
    } else if (event instanceof KeyboardPressed) {
      let $2 = event[0];
      if ($2 instanceof KeySpace) {
        let layer = $.head;
        let rest = $1;
        return new Paper(state.mouse, state.line, prepend(align(center(layer), 4), rest));
      } else if ($2 instanceof KeyBackspace) {
        let previous = $1.head;
        let rest = $1.tail;
        return new Paper(state.mouse, state.line, prepend(previous, rest));
      } else {
        return state;
      }
    } else if (event instanceof MouseMoved) {
      let x = event[0];
      let y = event[1];
      return new Paper([x - width() / 2, y - height() / 2], state.line, state.layers);
    } else if (event instanceof MousePressed) {
      let $2 = event[0];
      if ($2 instanceof MouseButtonLeft) {
        return new Paper(state.mouse, new Some(state.mouse), state.layers);
      } else {
        return state;
      }
    } else if (event instanceof MouseReleased) {
      let $2 = state.line;
      if ($2 instanceof Some) {
        let $3 = event[0];
        if ($3 instanceof MouseButtonLeft) {
          let mouse = state.mouse;
          let layer = $.head;
          let rest = $1;
          let start = $2[0];
          let fold_line = points2line(start, mouse);
          return new Paper(state.mouse, Option$None$const, prepend(fold4(layer, fold_line, (layer2) => {
            return layer2;
          })[0], prepend(layer, rest)));
        } else {
          return state;
        }
      } else {
        return state;
      }
    } else {
      return state;
    }
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
  let _pipe = combine(toList([
    (() => {
      let $1 = state.layers;
      if ($1 instanceof Empty) {
        return blank();
      } else {
        let layer = $1.head;
        return draw_layer(layer);
      }
    })(),
    line
  ]));
  return translate_xy(_pipe, width() / 2, height() / 2);
}
function echo(value, message, file, line) {
  const grey = "\x1B[90m";
  const reset_color = "\x1B[39m";
  const file_line = `${file}:${line}`;
  const inspector = new Echo$Inspector;
  const string_value = inspector.inspect(value);
  const string_message = message === undefined ? "" : " " + message;
  if (globalThis.process?.stderr?.write) {
    const string4 = `${grey}${file_line}${reset_color}${string_message}
${string_value}
`;
    globalThis.process.stderr.write(string4);
  } else if (globalThis.Deno) {
    const string4 = `${grey}${file_line}${reset_color}${string_message}
${string_value}
`;
    globalThis.Deno.stderr.writeSync(new TextEncoder().encode(string4));
  } else {
    const string4 = `${file_line}${string_message}
${string_value}`;
    globalThis.console.log(string4);
  }
  return value;
}

class Echo$Inspector {
  #references = new globalThis.Set;
  #isDict(value) {
    try {
      const empty_dict = make();
      const dict_class = empty_dict.constructor;
      return value instanceof dict_class;
    } catch {
      return false;
    }
  }
  #float(float4) {
    const string4 = float4.toString().replace("+", "");
    if (string4.indexOf(".") >= 0) {
      return string4;
    } else {
      const index3 = string4.indexOf("e");
      if (index3 >= 0) {
        return string4.slice(0, index3) + ".0" + string4.slice(index3);
      } else {
        return string4 + ".0";
      }
    }
  }
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
    if (t === "bigint" || globalThis.Number.isInteger(v))
      return v.toString();
    if (t === "number")
      return this.#float(v);
    if (v instanceof UtfCodepoint)
      return this.#utfCodepoint(v);
    if (v instanceof BitArray)
      return this.#bit_array(v);
    if (v instanceof globalThis.RegExp)
      return `//js(${v})`;
    if (v instanceof globalThis.Date)
      return `//js(Date("${v.toISOString()}"))`;
    if (v instanceof globalThis.Error)
      return `//js(${v.toString()})`;
    if (v instanceof globalThis.Function) {
      const args = [];
      for (const i of globalThis.Array(v.length).keys())
        args.push(globalThis.String.fromCharCode(i + 97));
      return `//fn(${args.join(", ")}) { ... }`;
    }
    if (this.#references.size === this.#references.add(v).size) {
      return "//js(circular reference)";
    }
    let printed;
    if (globalThis.Array.isArray(v)) {
      printed = `#(${v.map((v2) => this.inspect(v2)).join(", ")})`;
    } else if (v instanceof List) {
      printed = this.#list(v);
    } else if (v instanceof CustomType) {
      printed = this.#customType(v);
    } else if (this.#isDict(v)) {
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
    const name = globalThis.Object.getPrototypeOf(v)?.constructor?.name || "Object";
    const props = [];
    for (const k of globalThis.Object.keys(v)) {
      props.push(`${this.inspect(k)}: ${this.inspect(v[k])}`);
    }
    const body = props.length ? " " + props.join(", ") + " " : "";
    const head = name === "Object" ? "" : name + " ";
    return `//js(${head}{${body}})`;
  }
  #dict(map6) {
    let body = "dict.from_list([";
    let first2 = true;
    let key_value_pairs = fold(map6, [], (pairs, key, value) => {
      pairs.push([key, value]);
      return pairs;
    });
    key_value_pairs.sort();
    key_value_pairs.forEach(([key, value]) => {
      if (!first2)
        body = body + ", ";
      body = body + "#(" + this.inspect(key) + ", " + this.inspect(value) + ")";
      first2 = false;
    });
    return body + "])";
  }
  #customType(record) {
    const props = globalThis.Object.keys(record).map((label) => {
      const value = this.inspect(record[label]);
      return isNaN(parseInt(label)) ? `${label}: ${value}` : value;
    }).join(", ");
    return props ? `${record.constructor.name}(${props})` : record.constructor.name;
  }
  #list(list3) {
    if (list3 instanceof Empty) {
      return "[]";
    }
    let char_out = 'charlist.from_string("';
    let list_out = "[";
    let current = list3;
    while (current instanceof NonEmpty) {
      let element = current.head;
      current = current.tail;
      if (list_out !== "[") {
        list_out += ", ";
      }
      list_out += this.inspect(element);
      if (char_out) {
        if (globalThis.Number.isInteger(element) && element >= 32 && element <= 126) {
          char_out += globalThis.String.fromCharCode(element);
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
  #utfCodepoint(codepoint2) {
    return `//utfcodepoint(${globalThis.String.fromCodePoint(codepoint2.value)})`;
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

// build/dev/javascript/paper/paper.mjs
class State extends CustomType {
  constructor(paper2, tasks, score, animated_score, reset_timer) {
    super();
    this.paper = paper2;
    this.tasks = tasks;
    this.score = score;
    this.animated_score = animated_score;
    this.reset_timer = reset_timer;
  }
}
function init2(_) {
  return new State(init(), List$Empty$const, 0, 0, Option$None$const);
}
function update2(state, event) {
  let paper2 = state.paper;
  let tasks = state.tasks;
  let score = state.score;
  let animated_score = state.animated_score;
  let reset_timer = state.reset_timer;
  let tasks$1 = index_map(tasks, (task, index3) => {
    let task$1 = task[0];
    let y = task[1];
    let reset3 = task[2];
    return [
      update_animation(task$1),
      y + (identity(index3) - y) * 0.1,
      reset3
    ];
  });
  let paper$1 = update(paper2, event);
  let animated_score$1 = animated_score + (score - animated_score) * 0.1;
  let _block;
  let $ = is_empty2(tasks$1);
  if ($) {
    let iterations = min(round(floor(score / 500)) + 1, 4);
    let batch = reverse2(scan(repeat(0, iterations), default_stack(0.25), (layer, _) => {
      return center(randomize(layer));
    }));
    _block = append(index_map(batch, (layer, index3) => {
      return [layer, 0, index3 === 0];
    }), tasks$1);
  } else {
    _block = tasks$1;
  }
  let tasks$2 = _block;
  let ntasks = length(tasks$2);
  let _block$1;
  let $2 = paper$1.layers;
  if ($2 instanceof Empty) {
    _block$1 = [tasks$2, score, false];
  } else if (event instanceof MouseReleased) {
    let $32 = event[0];
    if ($32 instanceof MouseButtonLeft) {
      let layer = $2.head;
      let layer$1 = align(center(layer), 1);
      _block$1 = fold_right(tasks$2, [List$Empty$const, score, true], (state2, task) => {
        let tasks$32 = state2[0];
        let score$12 = state2[1];
        let reset3 = state2[2];
        let $4 = match(layer$1, align(task[0], 1), 0.25);
        if ($4 instanceof Some) {
          let accuracy = $4[0];
          return [tasks$32, score$12 + accuracy * 100, reset3 && task[2]];
        } else {
          return [prepend(task, tasks$32), score$12, reset3];
        }
      });
    } else {
      _block$1 = [tasks$2, score, false];
    }
  } else {
    _block$1 = [tasks$2, score, false];
  }
  let $1 = _block$1;
  let tasks$3 = $1[0];
  let score$1 = $1[1];
  let reset2 = $1[2];
  let reset$1 = length(tasks$3) !== ntasks && reset2;
  let time2 = continuous_time();
  let _block$2;
  if (reset$1) {
    _block$2 = new Some(time2 + 0.3);
  } else {
    _block$2 = reset_timer;
  }
  let reset_timer$1 = _block$2;
  let _block$3;
  if (reset_timer$1 instanceof Some) {
    let reset_timer$22 = reset_timer$1[0];
    if (time2 > reset_timer$22) {
      _block$3 = [
        new Paper(paper$1.mouse, paper$1.line, toList([default_stack(1)])),
        Option$None$const
      ];
    } else {
      _block$3 = [paper$1, reset_timer$1];
    }
  } else {
    _block$3 = [paper$1, reset_timer$1];
  }
  let $3 = _block$3;
  let paper$2 = $3[0];
  let reset_timer$2 = $3[1];
  return new State(paper$2, tasks$3, score$1, animated_score$1, reset_timer$2);
}
function view2(state) {
  return combine(prepend(view(state.paper), prepend((() => {
    let _pipe = text(to_string(round(state.animated_score)), 80);
    let _pipe$1 = text_align(_pipe, TextAlign$TextAlignCenter$const2);
    let _pipe$2 = text_baseline(_pipe$1, TextBaseline$TextBaselineTop$const2);
    let _pipe$3 = translate_xy(_pipe$2, width() / 2, 10);
    return fill(_pipe$3, colour_hex("#AAAAAA"));
  })(), map3(state.tasks, (task) => {
    let layer = task[0];
    let index3 = task[1];
    let _pipe = draw_layer(layer);
    return translate_xy(_pipe, width() - 100, 150 * index3 + 75);
  }))));
}
function main() {
  return interact(init2, update2, view2, "#mycanvas");
}
export {
  main
};
